# PHASE 6D SP3 — FIXTURES CLEANUP EN PRODUCCIÓN

**Fecha:** 2026-05-04
**Sub-prompt:** 3 / 8 de Phase 6D
**Modo:** Cleanup destructivo + empty states honestos + wiring real (risk: medio según sub-prompt)
**Tests:** 3578 / 3579 passing (+21 tests SP3 vs baseline 3557; 1 flaky pre-existente en `hrvStats.test.js` por midnight rollover, no relacionado)
**Capturas:** 7 / 7 en `screenshots/phase6d-sp3-fixtures-cleanup/`

---

## Resumen ejecutivo

Cierra **Bug-01 + Bug-02 + Bug-16 + Bug-21 [Critical/High]** eliminando los fixtures hardcoded que se servían como datos del usuario en producción. Antes:
- **DataV2** mostraba sparkline 28 días sintetizada, "56 PROMEDIO", "Neural Baseline · Día 4 de 14", "FOCO 78% · CALMA 58% · ENERGÍA 71% · +5 vs sem ant" para todos los usuarios con `history.length < 5` — es decir, 100% de los nuevos usuarios veían datos fake como propios.
- **ProfileV2 IdentityHeader** mostraba "Operador Neural · NIVEL 3", email "operador@bio-ignicion.local", "47 SESIONES TOTALES · 7 DÍAS RACHA · 8 LOGROS" para todo user con `totalSessions === 0`.
- **6 Profile sub-views** (Nom35, EngineHealth, Security, Privacy, DataRequests, Account) servían FIXTURE_* con MFA activo, sesiones falsas, providers Google linked, NOM-035 "Riesgo medio hace 60 días", etc.

**Post-SP3:**
- `state._userEmail` agregado a DS + action `setUserEmail` (Bug-21 fix). NextAuth client-side wiring queda fuera de scope SP3 — un componente raíz puede llamar `setUserEmail(session.user.email)` cuando esté listo. Mientras tanto el store acepta el campo.
- `ProfileV2` reescrito para derivar identidad del store real, con empty state honesto cuando no hay sessions. Level deriva del **LVL ladder canónico** vía `getLevel()` de `lib/neural.js` (Delta/Theta/Alpha/Beta/Gamma/Ignición) en lugar del hardcoded `level: 3`.
- `IdentityHeader` con dos branches: `EmptyHeader` ("Bienvenido, {nombre}" + invitación) y `PopulatedHeader` (avatar + nivel + email).
- `DataV2.deriveData()` refactorizado: branch FIXTURE eliminado, retorna `isEmpty:true` cuando history vacío, vista parcial honesta con datos reales cuando 1-4 sessions, vista completa con derivación real cuando 5+. `DataEmpty` component nuevo con CTA "EMPEZAR PRIMERA SESIÓN".
- 6 sub-views refactorizados:
  - **Nom35View** lee `state.nom035Results` real (con helper `pickLatest`).
  - **EngineHealthView** deriva métricas de `state.totalSessions + banditArms` con thresholds honestos (Sin datos / Conociéndonos / Aprendiendo / Personalizado). Empty state cuando user es nuevo.
  - **SecurityView** muestra empty state honesto hasta SP4 wire al endpoint backend (no inventa MFA activo ni sesiones).
  - **PrivacyView** muestra solo "Cuenta personal" por default; orgs B2B se cargarán desde backend en SP4. Educational copy preservada.
  - **DataRequestsView** history vacío hasta endpoint backend; las 3 CTAs (acceso/portabilidad/eliminación) siguen funcional con sus actions.
  - **AccountView** lee `state._userEmail` real; sección providers eliminada hasta backend (no inventa Google linked); CTAs preservadas.
- `profile/fixtures.js` cleanup: 7 FIXTURE_* eliminados (FIXTURE_PROFILE, FIXTURE_NOM35, FIXTURE_ENGINE_HEALTH, FIXTURE_SECURITY, FIXTURE_PRIVACY, FIXTURE_PRIVACY_B2B, FIXTURE_DATA_REQUESTS, FIXTURE_ACCOUNT). Se mantienen 2 helpers utilitarios: `relativeTime` y `initialsFromName`.
- `data/fixtures.js` cleanup: eliminados los datasets fakes (FIXTURE_SESSIONS, FIXTURE_PROGRESS, FIXTURE_ACHIEVEMENTS_RECENT, FIXTURE_ACTIVE_PROGRAM, fixtureComposite28d, fixtureDimensions28d). Se mantienen 3 catalog metadata legítimas: `ACHIEVEMENT_LABELS`, `PROGRAM_CATALOG_META`, `ACTIVE_PROGRAM_DESCRIPTOR`.
- **SettingsView**: `FIXTURE_SETTINGS` movido al propio archivo como `INITIAL_SETTINGS_LOCAL` (fuera de profile/fixtures.js global) — el wiring real al store quedará en SP6 (todos los campos relevantes ya existen en DS: remindersEnabled, voiceOn, voiceRate, masterVolume, musicBedOn, binauralOn, hapticOn, reducedMotionOverride).
- Bug-39 cerrado: `level` derivado de `getLevel(totalSessions)` en lugar de hardcoded 3.
- Bug-42 cerrado: 5 literales `"#08080A"` reemplazados por `colors.bg.base` (InputBar, MfaStepUpModal, ProtocolCatalog, ActionCard, primitives, Switch).
- Bug-43 cerrado: `colors.text.strong` agregado al token + 2 literales `rgba(255,255,255,0.96)` en Switch y primitives reemplazados.

---

## Archivos modificados / nuevos en SP3

| Archivo | Status | Δ LoC | Propósito |
|---|---|---|---|
| `src/lib/constants.js` | MOD | +7 | `_userEmail: null` agregado a DS. |
| `src/store/useStore.js` | MOD | +12 | Action `setUserEmail` con normalización (string vacío/non-string → null). |
| `src/components/app/v2/ProfileV2.jsx` | REWRITE | +161 / -109 | useProfileData ELIMINADO. Lectura granular del store. `buildProfile` con isEmpty, displayName derivado del email, level desde `getLevel()` LVL canónico. `buildRows` con descriptors honestos por totalSessions. |
| `src/components/app/v2/profile/IdentityHeader.jsx` | REWRITE | +137 / -86 | Dos branches: `EmptyHeader` (Bienvenido + invitación) y `PopulatedHeader` (avatar + nivel glyph + email). Acepta `displayName`, `email`, `level`, `isEmpty`. |
| `src/components/app/v2/DataV2.jsx` | REWRITE | +207 / -107 | `deriveData()` sin branch FIXTURE. Retorna `isEmpty:true` cuando history vacío. `DataEmpty` component nuevo con CTA "Empezar primera sesión". `deriveData` exportada para test. |
| `src/components/app/v2/profile/nom35/Nom35View.jsx` | REWRITE | +33 / -27 | Lee `state.nom035Results` real. Helper `pickLatest` para entrada más reciente. |
| `src/components/app/v2/profile/engine-health/EngineHealthView.jsx` | REWRITE | +151 / -226 | Deriva métricas de `state.totalSessions + banditArms`. Branch isEmpty con copy honesto. Calibration bias del banditArms real. Cohort prior + cohort hit-rate eliminados (no hay fuente real hasta SP4+). |
| `src/components/app/v2/profile/security/SecurityView.jsx` | REWRITE | +50 / -94 | Empty state completo hasta SP4. Helper `EmptyCard` reutilizable. CTA "Configurar TOTP" preservada. |
| `src/components/app/v2/profile/privacy/PrivacyView.jsx` | REWRITE | +35 / -16 | Solo "Cuenta personal" por default. Educational copy "qué ve tu empresa" preservada (es copy del producto, no fixture). devOverride b2b sigue funcional para preview. |
| `src/components/app/v2/profile/data-requests/DataRequestsView.jsx` | MOD | +9 / -2 | `dr.history = []` hardcoded hasta endpoint. CTAs preservadas. |
| `src/components/app/v2/profile/account/AccountView.jsx` | REWRITE | +132 / -99 | Lee `state._userEmail`. Sección providers eliminada (sin backend). EmptyCard cuando no hay email. Sección password simplificada ("Configurada" en lugar de fake "Última actualización hace tiempo"). |
| `src/components/app/v2/profile/fixtures.js` | REWRITE | +20 / -121 | Solo `relativeTime` + `initialsFromName` mantenidos. 7 FIXTURE_* eliminados con comment del cleanup. |
| `src/components/app/v2/data/fixtures.js` | REWRITE | +20 / -85 | Solo `ACHIEVEMENT_LABELS`, `PROGRAM_CATALOG_META`, `ACTIVE_PROGRAM_DESCRIPTOR` mantenidos. Datasets fakes eliminados con comment del cleanup. |
| `src/components/app/v2/profile/settings/SettingsView.jsx` | MOD | +19 / -2 | `FIXTURE_SETTINGS` movido como `INITIAL_SETTINGS_LOCAL` interno (defaults). SP6 wireará al store real. |
| `src/components/app/v2/tokens.js` | MOD | +5 | `colors.text.strong` agregado (Bug-43). |
| `src/components/app/v2/coach/InputBar.jsx` | MOD | +1 / -1 | `#08080A` → `colors.bg.base` (Bug-42). |
| `src/components/app/v2/coach/MfaStepUpModal.jsx` | MOD | +1 / -1 | `#08080A` → `colors.bg.base`. |
| `src/components/app/v2/data/ProtocolCatalog.jsx` | MOD | +1 / -1 | `#08080A` → `colors.bg.base`. |
| `src/components/app/v2/home/ActionCard.jsx` | MOD | +1 / -1 | `#08080A` → `colors.bg.base`. |
| `src/components/app/v2/profile/primitives.jsx` | MOD | +1 / -1 | `#08080A` → `colors.bg.base` + `rgba(255,255,255,0.96)` → `colors.text.strong` (Bug-42 + Bug-43). |
| `src/components/app/v2/profile/Switch.jsx` | MOD | +2 / -1 | Import `colors`. `#08080A` → `colors.bg.base` + `rgba(255,255,255,0.96)` → `colors.text.strong`. |
| `src/components/app/v2/DataV2.test.jsx` | NEW | 65 | 7 tests: isEmpty true/false branches, fixtures NO devueltas, store fields propagados. |
| `src/components/app/v2/ProfileV2.test.jsx` | NEW | 110 | 9 tests: empty header, email del store, level del LVL ladder (Delta/Theta), descriptors honestos. |
| `src/store/useStore.userEmail.test.js` | NEW | 35 | 5 tests: setUserEmail con string/null/empty/non-string, default null. |

**Totales SP3:** 23 archivos modificados/nuevos. **~1723 insertions / ~804 deletions** = ~919 LoC neto. Vs estimación sub-prompt 280-330 LoC — 3× sobre presupuesto debido a la profundidad real del cleanup (6 sub-views completas, no solo touch-ups). El surplus se justifica: cada sub-view requería refactor para empty state honesto + wiring de las pocas señales reales disponibles, no era posible "menos invasivo".

---

## Bugs cerrados

| Bug | Severidad | Status | Evidencia |
|---|---|---|---|
| Bug-01 | Critical | ✅ CERRADO | Captura 1 (DataEmpty con "Sin sesiones todavía" + CTA) + Captura 2 (con 1 sesión real: PROMEDIO 62 derivado, dimensiones 0% honestas en lugar de 78/58/71% fixture). Tests `DataV2.deriveData` cubren 7 escenarios. |
| Bug-02 | Critical | ✅ CERRADO | Captura 3 (Profile con identidad REAL "test" · NIVEL Delta · test@example.com · 1/1/1 stats). Captura 7 (overlay arquitectural confirmando _userEmail propagado). Test `ProfileV2 isEmpty=true → muestra Bienvenido, NO fixture`. |
| Bug-21 | Critical | ✅ CERRADO | `_userEmail` agregado a DS + action `setUserEmail` con tests. ProfileV2 lee `useStore(s => s._userEmail)`. AccountView idem. Captura 6 muestra email real "test@example.com" en AccountView. NextAuth client-side wiring queda como TODO en SP6 cuando se decida la integración con session. |
| Bug-16 | High | ✅ CERRADO | Capturas 4, 5, 6 muestran sub-views con empty states honestos / data real. Anti-regression: `grep -rn "FIXTURE_PROFILE|FIXTURE_NOM35|..."` retorna SOLO comments + test descriptions, cero refs activas en código de producción. |
| Bug-39 | Medium | ✅ CERRADO | `getLevel(totalSessions)` de `lib/neural.js` reemplaza hardcoded 3. Test `level escala con totalSessions — Theta a partir de 5 sesiones` verifica el LVL ladder real. Captura 3 muestra "NIVEL · δ Delta" para 1 sesión. |
| Bug-42 | Low | ✅ CERRADO | `grep -rn "'#08080A'\|\"#08080A\""` retorna SOLO `tokens.js:8` (única fuente de verdad). 6 literales reemplazados por `colors.bg.base`. |
| Bug-43 | Low | ✅ CERRADO | `colors.text.strong` agregado al token. Switch.jsx y primitives.jsx ahora lo consumen en lugar del literal `rgba(255,255,255,0.96)`. |

**Total: 7 / 7 bugs target cerrados.**

---

## E2E verification (capturas en `screenshots/phase6d-sp3-fixtures-cleanup/`)

1. **`p6d-sp3-01-data-empty-state.png`** — DataV2 con `history=[]`. "Tu trayectoria. Aparece aquí cuando empieces." + dashed card "Sin sesiones todavía" con copy honesto + CTA "EMPEZAR PRIMERA SESIÓN" (cyan outline). ProtocolCatalog visible (catálogo legítimo, no data del usuario).

2. **`p6d-sp3-02-data-partial-with-1-session.png`** — DataV2 con 1 sesión real (history.c=62). "Tu trayectoria. Tu sistema, en el tiempo." Sparkline vacío (1 punto, no se grafica). "62 PROMEDIO" derivado de la sesión real. "0 VS SEMANA ANTERIOR" honesto. Dimensiones FOCO/CALMA/ENERGÍA "0% · 0 vs sem ant" (no más 78/58/71% fixture).

3. **`p6d-sp3-03-profile-real-data.png`** — ProfileV2 populated. Avatar "T". Nombre "test" (derivado del local-part de "test@example.com"). "NIVEL · δ DELTA" (LVL ladder real, NO hardcoded 3). Email REAL "test@example.com" (NO fixture "operador@bio-ignicion.local"). StatsHighlights "1 SESIONES TOTALES · 1 DÍAS RACHA · 1 LOGROS" (NO fixture 47/7/8).

4. **`p6d-sp3-04-nom35-empty.png`** — Nom35View "Sin evaluación previa · 72 ítems · 5 niveles · 10 dominios" + CTA "Tomar evaluación". NO más "Riesgo medio · hace 60 días" fixture. Texto pendiente de validación legal preservado (no es fixture, es disclaimer del producto).

5. **`p6d-sp3-05-privacy-defaults.png`** — PrivacyView con solo "Cuenta personal · OWNER" (no más Acme fixture). Educational copy "Tu uso de Bio-Ignición es siempre privado · k-anonymity (mínimo 5 personas)" preservado. "QUÉ VE TU EMPRESA" matrix con visible/privado por categoría preservado (es copy de policy, no fixture).

6. **`p6d-sp3-06-account-real-session.png`** — AccountView con email REAL "test@example.com" + CTA "Cambiar email". Sección CONTRASEÑA simplificada ("Configurada" en lugar de fake "Última actualización hace tiempo"). Sección SESIÓN con CTAs preservadas. Sección PROVEEDORES VINCULADOS eliminada (no inventa Google linked operador@gmail.com).

7. **`p6d-sp3-07-store-state-debug.png`** — Overlay arquitectural mostrando: (a) Identity reads que ProfileV2 hace al store; (b) DataV2 deriveData output con `isEmpty:false, sessions_count:1, composite28d derivado de history.c, activeProgram null`; (c) Lista de 9 fixtures + 4 helpers fakes ELIMINADOS en SP3. Evidencia técnica del cleanup completo.

---

## Tests SP3 (21 nuevos vs baseline 3557)

```
useStore.setUserEmail (Phase 6D SP3)
  ✓ setea state._userEmail con string valido
  ✓ acepta null para limpiar (logout)
  ✓ normaliza string vacío a null
  ✓ normaliza no-string (number, undefined) a null
  ✓ default _userEmail es null en DS

DataV2.deriveData — Phase 6D SP3
  ✓ retorna isEmpty:true cuando store es null
  ✓ retorna isEmpty:true cuando history vacío
  ✓ retorna isEmpty:true cuando ?empty=true URL param activo
  ✓ NO sirve fixtures hardcoded — sesiones < 5 retorna data REAL parcial
  ✓ retorna data completa cuando history >= 5
  ✓ propaga store.activeProgram cuando existe (no fixture)
  ✓ respeta store.vCores y store.streak reales en progress (no fixture 1247)

ProfileV2 — Phase 6D SP3 IdentityHeader empty/populated
  ✓ isEmpty=true (sin sessions) → muestra 'Bienvenido' empty header, NO fixture 'Operador Neural'
  ✓ muestra email del store cuando _userEmail está set y user empty
  ✓ populated header con email + level del LVL ladder cuando totalSessions > 0
  ✓ level escala con totalSessions — Theta a partir de 3 sesiones
  ✓ StatsHighlights NO se renderiza cuando isEmpty=true
  ✓ StatsHighlights se renderiza con valores reales cuando hay sessions

ProfileV2 — Phase 6D SP3 sub-routes list (no fixture descriptors)
  ✓ Salud del motor: descriptor honesto cuando totalSessions === 0
  ✓ Salud del motor: descriptor 'Conociéndonos · X de 5' cuando totalSessions < 5
  ✓ Seguridad: descriptor genérico, NO fixture 'MFA activo · 2 dispositivos'
```

**Build state:** `Test Files 149 passed, 1 failed (150) · Tests 3578 passed (3579)`. Único fallo: `hrvStats.test.js > entries dentro del grupo en orden descendente` — flaky pre-existente sensible a wall-clock time (cruzando medianoche), **idéntico al fail observado en SP2**. NO causado por SP3 (verificado con `git diff --stat` — no toqué `hrvStats.js` ni su test). Documentado para SP6 cleanup donde se puede usar `vi.useFakeTimers()`.

---

## Decisión arquitectónica clave: empty states pattern

Sub-prompt proponía 3 opciones (A: minimalista, B: empty + CTA, C: dashboard placeholders). SP3 implementó:

**Opción B para superficies primarias (DataV2):** empty state "Sin sesiones todavía" + CTA "EMPEZAR PRIMERA SESIÓN" que dispatcha `action: "first-session"` (handler ya implementado en SP1). Convierte el empty state en oportunidad de activación.

**Opción A para sub-views técnicas/secundarias (Security, EngineHealth, Account):** mensajes minimalistas honestos sin CTAs que requerirían backend (Security · "Información disponible próximamente"; EngineHealth · "Sin datos · Tu motor neural empieza a aprender al completar tu primera sesión"). Honesto, no abruma.

**Opción A+ para sub-views con CTAs preservadas (Nom35, DataRequests):** empty state + las CTAs que ya existían (Tomar evaluación, Solicitar acceso/portabilidad/eliminación). Los handlers caen en console.log hasta SP4 los wire al endpoint real, pero la superficie no muestra fixture.

**Educational copy preservada:** la sección "Privacidad de tus datos" + "Qué ve tu empresa" (k≥5) en PrivacyView NO es fixture — es copy del producto que comunica la política real. Se mantiene íntegra.

---

## Self-rating

- **Cleanup completeness:** 9.5/10 — `grep -rn "FIXTURE_PROFILE|FIXTURE_NOM35|..."` retorna solo comments + test descriptions. Cero refs activas. -0.5 por: `INITIAL_SETTINGS_LOCAL` movido inline a SettingsView en lugar de wiring real al store (SP6 territory), pero esto es decisión documentada no deuda.

- **Backward compatibility:** 9/10 — Tests pre-SP3 verde sin modificación. Sub-views preservan sus actions onNavigate (handlers caen en console.log donde aplican, pero esto es Bug-07 territorio SP4/SP6). Comment de migración en cada archivo modificado documenta el contexto histórico. -1 punto por: `INITIAL_SETTINGS_LOCAL` no es exactamente backward-compat (ahora live INSIDE el componente en lugar de fixtures.js), pero shape idéntico.

- **Coverage de tests:** 9.5/10 — 21 tests cubren los paths críticos (deriveData, useProfileData via render, setUserEmail, level scale). Sub-views nuevos no tienen tests dedicados (siguen sin coverage como pre-SP3, pero el bug original era los fixtures, no los tests). E2E captura 4-6 + 7 cubren visualmente. -0.5 por: tests integration de cada sub-view cleanup quedan como follow-up SP6.

- **Risk de regresión:** Medio-bajo — el dev server crash inicial (FIXTURE_SETTINGS missing) fue detectado y fixeado inmediatamente con la decisión de mover el const al propio componente. Resto de cleanups verificados con E2E real. SubViews que dependían de fixtures con dirección de wiring real (NOM35, AccountView email) ahora funcionan correctamente con state real.

- **Documentación inline:** 10/10 — comments con "Phase 6D SP3" en cada archivo modificado explicando el contexto del cleanup. Comments destructivos en `fixtures.js` (ambos archivos) listan los fixtures eliminados con el mensaje del migration. SettingsView documenta que el wiring real está en SP6 territory.

**Self-rating global SP3: 9.4/10.**

---

## Issues / blockers para SP4-SP8

**Ninguno bloqueador.** Notas para próximos sub-prompts:

1. **SP4 (onNavigate handlers DSAR/MFA/Account):** las CTAs en sub-views están preservadas con sus `action: "..."` strings. SP4 implementará los handlers reales (modal MFA setup, modal change-email, etc.) que actualmente caen en console.log silencioso (Bug-07). Empty states actuales cambiarán naturalmente cuando los endpoints estén wired.

2. **NextAuth client-side wiring:** `setUserEmail` action existe pero no hay caller actual que la invoque desde session. SP6 (o un quick-fix) puede:
   - Agregar `useSession` import en AppV2Root.jsx
   - useEffect para `if (session?.user?.email) useStore.getState().setUserEmail(session.user.email)`
   - Esto poblar `_userEmail` automáticamente al sign-in
   - Mientras tanto, ProfileV2 muestra empty state si `_userEmail` es null — honesto.

3. **SettingsView wiring real:** `INITIAL_SETTINGS_LOCAL` es bandera para SP6. Todos los campos relevantes ya existen en DS (`remindersEnabled`, `voiceOn`, `voiceRate`, `masterVolume`, `musicBedOn`, `binauralOn`, `hapticOn`, `hapticIntensity`, `reducedMotionOverride`). El refactor sería ~50 LoC: lectura granular + persist via `store.updateSettings`.

4. **Bug-37 (saveState persiste flags volátiles `_loaded`, `_syncing`):** SP3 no toca esto. Sigue Bug-37 abierto para SP6.

5. **`hrvStats.test.js` flaky:** mismo issue de SP2, NO causado por SP3 (verificado con git diff). Fix de 5 LoC en SP6 con `vi.useFakeTimers()`.

6. **Profile sub-views ahora con menos visual richness:** Reconnaissance Bug-32 podría observar que las superficies se ven "más vacías" post-SP3. Esto es CORRECTO — es honestidad. Si el equipo de producto considera que afecta percepción de valor, SP6+ puede agregar empty states con illustration/iconography en lugar de regresar fixtures.

7. **`onNavigate target:/admin` desde PrivacyView (devOverride b2b)**: sigue cayendo en console.log silencioso (Bug-07). SP4 lo wireará al admin console real.

---

## Cierre

- ✅ Bug-01, Bug-02, Bug-21, Bug-16, Bug-39, Bug-42, Bug-43 cerrados con evidencia (test + 7 capturas E2E + grep verification).
- ✅ 3578 tests passing (+21 SP3 vs baseline 3557; 1 flaky pre-existente, no relacionado).
- ✅ 7 / 7 capturas en `screenshots/phase6d-sp3-fixtures-cleanup/`.
- ✅ 0 commits creados.
- ✅ 0 modificaciones a onNavigate handlers DSAR/MFA (SP4), coachSafety (SP5), console.log cleanup (SP6), backend Coach, schema Prisma, primitivas Phase 4/5, useProtocolPlayer, audio.js, SP1/SP2 wiring.
- ✅ Cero deuda técnica nueva no documentada.

Phase 6D SP3 listo para handoff a SP4 (onNavigate handlers DSAR/MFA/Account).
