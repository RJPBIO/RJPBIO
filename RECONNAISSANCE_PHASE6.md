# RECONNAISSANCE_PHASE6.md

> SP1 Phase 6 · Reconocimiento forense del flujo user-facing post-Phase 5.
> Estado: el motor + protocolos + primitivas están listos, pero **el flujo
> user-facing está desconectado del motor**. La integración funcional
> requiere reconstrucción explícita.

---

## TL;DR (estado real para el usuario hoy)

- **Catálogo**: 23 protocolos migrados, motor consolidado, bandit funcional, programas curados — todo verde en tests + build.
- **Frontend v2**: HomeV2 / DataV2 / CoachV2 / ProfileV2 montados detrás de feature-flag `PROTOTYPE_V2 = true` (hardcoded).
- **CRÍTICO**: el shell v2 NO tiene wiring para mountar el `ProtocolPlayer`. El callback `onNavigate` en `AppV2Root.jsx:37` es literalmente `console.log("[v2] navigate", item)`. Cualquier botón "Comenzar" en producción **no hace nada**.
- **Resultado**: el único path que ejecuta protocolos hoy es `/dev/protocol-player` (dev harness, no expuesto a usuarios).
- Bandit, recordSessionOutcome, completeSession, programs.completeProgramDay, persistencia outbox, onboarding (BioIgnitionWelcome + NeuralCalibration), crisis quick access — todos viven en código legacy que el feature-flag deja inalcanzable.

Phase 6 debe **integrar lo que ya existe**, no construir features nuevos.

---

## 1. Entry point principal — page.jsx

- **LoC**: 2619 líneas en `src/app/app/page.jsx`.
- **Imports relevantes** (línea 100): `ProtocolPlayer` cargado dinámicamente vía `@/components/protocol/v2/ProtocolPlayer`. SP3 Phase 4 lo conectó.
- **`SessionRunner` import**: 0 referencias en código fuente (sólo en `CLEANUP_BACKLOG.md` y `ENGINE_AUDIT.md`). El archivo `src/components/SessionRunner.jsx` existe huérfano (CLEANUP_BACKLOG #1).
- **Mount condicional** del `<ProtocolPlayer>` (líneas 927-962):
  ```jsx
  {(ts==="running"||ts==="paused") && pr && (
    <ProtocolPlayer ... />
  )}
  ```
  Funciona contra el state machine legacy: `setTs("running")` lo monta. `onComplete` delega a `comp()` (la función legacy de cierre de sesión).

### CRÍTICO: feature-flag corta el mount
- Línea 10: `const PROTOTYPE_V2 = true;` (constante hardcoded).
- Línea 110: `if (PROTOTYPE_V2) return <AppV2Root />;`

→ **Todo el código entre líneas 111-2619 (incluyendo el mount del ProtocolPlayer en 927) es DEAD CODE**. Los usuarios reales nunca lo alcanzan.

---

## 2. Tabs v2 — qué expone, qué falta

### Tab Hoy (`HomeV2.jsx`, 148 LoC)

- Llama `useAdaptiveRecommendation(state)` → `adaptiveProtocolEngine` → bandit + scored selection. **Recommendation funciona end-to-end como cómputo**, pero solo se renderiza como tarjeta visual.
- `ColdStartView` para usuarios con <5 sesiones (4 cards: cronotipo, primera sesión, HRV, PSS-4).
- `PersonalizedView` con composite + dimension trends + recommendation card (`ActionCard`) + active program preview.
- **Botones**:
  - "Comenzar" en ActionCard → `onStartRecommended` → `onNavigate({action:"start-recommended", protocolId})` → **stub**.
  - "Ver mi programa" → `onOpenProgram` → `onNavigate({target:"/app/data#programs"})` → **stub**.
  - Cards onboarding cold-start → `onAction(item)` → `onNavigate(item)` → **stub**.

### Tab Datos (`DataV2.jsx`, 129 LoC + subcomponentes)

- Secciones: `DataIntro`, `TrajectoryHero`, `DimensionsTrends`, `ProgramsSection`, `SessionsRecent`, `ProgressStats`, `AchievementsRecent`.
- `ProgramsSection`: muestra programa activo + catálogo (5 programas curados).
- `SessionsRecent`: muestra historial de sesiones leyendo `store.history`. Si <5 sesiones, usa fixtures.
- **NO hay catálogo tappeable de protocolos**. User no puede browsear los 23 protocolos y elegir uno explícitamente.
- **NO hay vista detallada de programa** que permita arrancar la sesión del día.
- "Ver día hoy" en `ActiveProgramFull` → emite navigate event → **stub**.

### Tab Coach (`CoachV2.jsx`, 237 LoC)

- LLM real vía `/api/coach` SSE, quota tracking, MFA gate, weekly summary card.
- Crisis detection: si `evaluateSafetySignals().level === "crisis"`, renderiza `CrisisCard` con recursos externos (Línea 911, etc.).
- **`CrisisCard` NO mountea protocolos #18-#20**. Es informacional puro (lista de teléfonos).
- **Coach NO sugiere protocolos tappeables**. Solo texto.
- **Coach NO consume `programs.js`**. No puede sugerir "hoy te toca día 5 NB".

### Tab Perfil (`ProfileV2.jsx`, 109 LoC + 9 sub-views)

- 9 sub-routes: Calibration, Instruments, NOM-35, Engine Health, Settings, Security, Privacy, Data Requests, Account.
- Stats highlights (totalSessions, streak, achievements).
- **NO hay "Programa activo" sub-route** (programa actual + día actual). Esa info aparece en Tab Datos.
- **`SettingsView` existe** con TTS/haptic/voice (no auditado en SP1, deferido a SP2 Phase 6).

---

## 3. Crisis quick access — **GAP CRÍTICO**

- **NO existe botón "Estoy en crisis" / "SOS" / "Necesito ayuda"** en el shell v2.
- **NO existe path** desde HomeV2 / DataV2 / Tab Coach a montar #18 / #19 / #20.
- **CrisisCard del coach** lista recursos externos (911), pero NO los protocolos crisis del catálogo.
- **Path actual**: ninguno desde producción. Único acceso: `/dev/protocol-player` → tap #18/#19/#20 manualmente. Inaccesible en prod.

Para un usuario en pánico real hoy: **no hay ayuda dentro del producto**. Es un riesgo de compliance + duty-of-care.

---

## 4. Onboarding flow

- **Existe componentes**: `BioIgnitionWelcome` (3-screen manifesto cinemático), `NeuralCalibration` (calibración baseline + cronotipo + recommendations).
- **Mount**: en `page.jsx:969-988` dentro del bloque legacy. **Inalcanzable bajo PROTOTYPE_V2=true**.
- **Cold-start visual existe** (`ColdStartView` en HomeV2 con 4 cards), pero los handlers son stubs.
- **`useStore.completeOnboarding()` existe** pero no hay disparador en el shell v2 que lo invoque.

---

## 5. Bandit integration end-to-end

| Etapa | Estado | Observación |
|---|---|---|
| `defaultRecommendationPool()` | ✅ Funcional | Filtra crisis/training, devuelve 18 active |
| `adaptiveProtocolEngine` | ✅ Funcional | Lee `banditArms`, scoring + bucket-aware |
| `useAdaptiveRecommendation` | ✅ Wired | HomeV2 lo llama y muestra `recommendation.primary` |
| User tap "Comenzar" | ❌ **STUB** | `onNavigate` no monta player |
| Player onComplete | ❌ Inalcanzable | Aunque player se mounteara desde v2, su onComplete está cableado al `comp()` legacy en page.jsx (dead code) |
| `recordSessionOutcome` | ❌ Nunca se llama | Único caller (`page.jsx:741`) está dentro del bloque legacy |
| Bandit aprende | ❌ NO | UCB1 nunca actualiza arms en producción. Stays cold-start indefinidamente |

**Diagnóstico**: la cadena recommend → execute → record está rota en el eslabón "execute". Bandit cómputo está listo pero nunca recibe feedback.

---

## 6. Programs.js consumption en UI

- **Datos en store**: `activeProgram = { id, startedAt, completedSessionDays }` se persiste. Helpers `programTodayStatus`, `currentProgramDay`, `programProgress` existen y están testeados.
- **Visualización en v2**:
  - `ProgramsSection` (Tab Datos) muestra programa activo + catálogo.
  - `ActiveProgramFull` muestra detalles del programa.
  - `HomeV2` muestra programa activo en `PersonalizedView`.
- **Acción "Ver día hoy"**: existe el botón, pero `onSeeToday` → `onNavigate({action:"see-program-today"})` → stub.
- **Acción "Comenzar día"**: NO existe explícitamente. El user no tiene un CTA claro para arrancar la sesión del día actual.
- **Acción "Iniciar programa"**: NO existe. El user no puede activar un programa desde el catálogo.
- **Avance automático**: `store.completeProgramDay` se llama en `page.jsx:714` (legacy, inalcanzable). Programs nunca avanzan en producción.

→ Programa exists as data; **nunca progresa en producción**.

---

## 7. Persistencia + sync backend

- **Backend Prisma model**: `NeuralSession` (línea 309 de `schema.prisma`):
  ```
  id, orgId, userId, teamId, protocolId(String), durationSec, coherenciaDelta,
  moodPre, moodPost, completedAt, clientVersion, stationId, slot
  ```
- **Faltan los campos del schema Phase 4**: `status`, `partial`, `partialPercent`, `completedActs`, `totalActs`, `useCase`, `banditWeight`, `vCoresAward`. NO se persisten.
- **`buildSessionOutboxPayload`** (`sessionDelta.js:197`) sólo arma legacy fields (protocolId, durationSec, coherenciaDelta, moodPre, moodPost, completedAt). Nuevos campos del playerCompletion **se descartan al outbox**.
- **Sync route**: `/api/sync/outbox` existe y procesa NeuralSession; ignora cualquier campo extra.
- **Local store**: `history` (zustand persist) guarda telemetría completa local-first. Pero como `completeSession()` no se invoca desde v2, **history nunca crece en producción**.

---

## 8. Gaps categorizados + plan estructural

### CRÍTICOS (bloquean producto deployable)

| # | Gap | Complejidad | SP sugerido | Dependencias |
|---|---|---|---|---|
| C1 | `onNavigate` stub en AppV2Root no monta ProtocolPlayer | **L** | SP2 Phase 6 | — |
| C2 | "Comenzar" en HomeV2 no ejecuta protocolo recomendado | **M** (con C1 resuelto) | SP2 Phase 6 | C1 |
| C3 | Bandit `recordSessionOutcome` no se llama post-sesión en v2 | **M** | SP3 Phase 6 | C1, C2 |
| C4 | NO hay crisis quick access (#18/#19/#20 inalcanzables) | **M** | SP4 Phase 6 | C1 |
| C5 | Onboarding (BioIgnitionWelcome + NeuralCalibration) no se monta en v2 | **L** | SP5 Phase 6 | C1 |
| C6 | Programs nunca avanzan (completeProgramDay no se llama en v2) | **M** | SP3 Phase 6 (parte del flow post-completion) | C1, C2 |
| C7 | Backend `NeuralSession` schema sin campos Phase 4 | **M** (Prisma migration + outbox + route) | SP6 Phase 6 | — (paralelizable) |

### IMPORTANTES (afectan UX top-tier)

| # | Gap | Complejidad | SP sugerido |
|---|---|---|---|
| I1 | NO hay catálogo tappeable de los 23 protocolos en Tab Datos | **M** | SP4 Phase 6 |
| I2 | NO hay vista de programa activo con botón "Hacer sesión del día" | **M** | SP3 Phase 6 |
| I3 | NO hay path "Iniciar programa" desde catálogo | **S** | SP3 Phase 6 |
| I4 | Coach no sugiere protocolos tappeables ni consume programs.js | **L** | SP7+ Phase 6 (post-base) |
| I5 | NO hay sub-route "Programa activo" en Perfil | **S** | SP3 Phase 6 |
| I6 | SettingsView no auditada (TTS/haptic/voice toggles) | **S** | SP5 Phase 6 |
| I7 | Cold-start handlers son stubs (4 cards) | **M** | SP5 Phase 6 |

### OPCIONALES (nice-to-have)

| # | Gap | Complejidad | SP sugerido |
|---|---|---|---|
| O1 | Eliminar `SessionRunner.jsx` huérfano | **S** | SP6 Phase 6 cleanup |
| O2 | Eliminar bloque legacy `page.jsx` 111-2619 (post-validación v2) | **L** | post-Phase 6 |
| O3 | Telemetría: shipear playerCompletion shape rico al outbox | **M** | SP6 Phase 6 (con C7) |
| O4 | Quita-test flaky `hrvStats` (`Date.now()` relativo) | **S** | post-Phase 6 cleanup |

---

## 9. Plan estructural Phase 6 propuesto

**6 sub-prompts adicionales + posibles quick fixes intermedios.**

### SP2 Phase 6 — Wiring básico de mount + Comenzar
**Objetivo**: que tap "Comenzar" en HomeV2 monte el `ProtocolPlayer` real con el protocolo recomendado.

- Reemplazar el stub `onNavigate` en `AppV2Root.jsx` por un router action handler.
- Promover el state machine de mount (selectedProtocol, isPlayerOpen) al nivel `AppV2Root`.
- Mountar `<ProtocolPlayer>` como overlay full-screen cuando `isPlayerOpen`.
- onComplete → cerrar player + lanzar post-session flow (placeholder, real en SP3).
- onCancel → cerrar player sin penalty.
- Verify: tap "Comenzar" → player mounts → completa → cierra. SIN persistir todavía.

**Estimado**: 200-300 LoC. **Risk**: bajo (pieces ya existen).

### SP3 Phase 6 — Persistencia + bandit recording + programs avance
**Objetivo**: cerrar el loop recommend → execute → record.

- onComplete handler en AppV2Root → `store.completeSession(r)` + `store.recordSessionOutcome(...)` + `store.completeProgramDay(...)` si aplica.
- Construir el `r` payload (lo que `comp()` legacy construye en page.jsx).
- Verify: 1 sesión real → history crece, banditArms se actualiza, programa avanza.

**Estimado**: 300-400 LoC + adaptación lógica de comp() a v2. **Risk**: medio (computeSessionMetrics + calcSessionCompletion son complejos).

### SP4 Phase 6 — Crisis quick access + catálogo de protocolos
**Objetivo**: usuario en crisis tiene acceso en ≤2 taps; usuario navegando puede tap protocolo.

- Botón flotante "Estoy en crisis" persistente (probablemente en BottomNavV2 o como overlay).
- Sheet con #18/#19/#20 → tap → mount player con safety overlay.
- En Tab Datos, agregar `ProtocolCatalog` section con los 23 protocolos tappeables.
- Tap protocolo → mount player.

**Estimado**: 250-350 LoC. **Risk**: bajo.

### SP5 Phase 6 — Onboarding flow + cold-start handlers
**Objetivo**: usuario nuevo recibe BioIgnitionWelcome + NeuralCalibration; cards cold-start funcionan.

- Mount `BioIgnitionWelcome` en AppV2Root cuando `!onboardingComplete && !welcomeDone`.
- Mount `NeuralCalibration` post-welcome.
- Auditar SettingsView (TTS/haptic/voice toggles).
- Cards cold-start "Tu primera sesión" → arrancar Pulse Shift directo.

**Estimado**: 200-300 LoC. **Risk**: bajo (componentes existen).

### SP6 Phase 6 — Backend schema + outbox payload extendido
**Objetivo**: persistir la telemetría rica del playerCompletion en backend.

- Migración Prisma: agregar `status`, `partial`, `partialPercent`, `completedActs`, `totalActs`, `useCase`, `banditWeight`, `vCoresAward` a `NeuralSession`.
- Actualizar `buildSessionOutboxPayload` para incluir esos campos.
- Actualizar `/api/sync/outbox/route.js` para validar + persistir.
- Cleanup huérfanos: `SessionRunner.jsx` (CLEANUP_BACKLOG #1).

**Estimado**: 150-200 LoC + 1 migration. **Risk**: medio (data persistence).

### SP7 Phase 6 — Coach protocol-aware + programs context (opcional)
**Objetivo**: Coach sugiere protocolos tappeables y conoce el programa activo.

- Extender system prompt del coach con catálogo + programs.
- Coach replies pueden incluir markup tappeable `[run:21]` que monta player.
- "Hoy te toca día 5 del NB" en respuestas.

**Estimado**: 200-300 LoC + LLM prompt eng. **Risk**: medio (LLM behavior tuning).

### SP8 Phase 6 — Cierre + final report (mandatorio)
- FINAL_PHASE6_REPORT.md consolidando.
- Eliminar dead code legacy (page.jsx 111-2619) si validación e2e v2 pasa.
- Update CLEANUP_BACKLOG.

### Quick fixes anticipados

- **Post-SP2**: probable issue con state lifting (player mounting from AppV2Root vs HomeV2).
- **Post-SP3**: probable issue con shape mismatch entre playerCompletion (Phase 4 schema) y comp() legacy expectations.
- **Post-SP4**: probable issue con safety overlay timing en crisis quick-tap.

---

## 10. Listo para SP2 Phase 6

Reconnaissance documentado. Próximo paso: SP2 Phase 6 — wiring básico de mount + Comenzar funcional.

**Prohibición continúa hasta cierre de Phase 6**: no eliminar el código legacy de `page.jsx` hasta que la validación end-to-end v2 esté completa (SP8 Phase 6).
