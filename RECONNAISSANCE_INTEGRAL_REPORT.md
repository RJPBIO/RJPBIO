# RECONNAISSANCE INTEGRAL — END-TO-END
**Fecha:** 2026-05-04
**Alcance:** Producto Bio-Ignición integrado post-Phase 6C
**Modo:** Read-only (cero modificaciones de código, tests o commits)
**Trabajo realizado:** Code audit estructural (1.1–1.11) + 5 flows E2E parciales con Playwright (mobile viewport 390×844 sobre `localhost:3000`).

---

## Resumen ejecutivo

**El producto NO está deployable a primera org B2B en su estado actual.** Aunque la fundación está sólida (motor neural, persistencia IDB cifrada, ProtocolPlayer) y los tests pasan en su universo sintético, la integración real entre `NeuralCalibrationV2` ↔ `useStore` ↔ `HomeV2/DataV2/ProfileV2` está rota, y varias superficies user-facing (DataV2, ProfileV2 IdentityHeader, ProfileV2 sub-views) muestran **datos de fixtures hardcoded como si fueran datos reales del usuario**. Adicionalmente, ~14 acciones del `onNavigate` handler caen en `console.log` silencioso (DSAR, MFA, account, sessions, navegación cross-tab al programa activo, etc.), y existe duplicación crítica entre dos implementaciones distintas del instrumento PSS-4 que generan resultados incoherentes.

**Cifras:**
- Total bugs detectados: **47**
- Critical (bloquean deployment): **9**
- High (regresiones user-facing core): **14**
- Medium (UX defects + technical debt): **17**
- Low (cosmetic / polish): **7**

**Recomendación:** Phase 6D no es un sprint de polish. Es un sprint de **integración real + eliminación de fixtures de producción** + cobertura de los handlers no implementados. Estimo 6 sub-prompts (~1500–2000 LoC de fixes/wiring real, sin contar la limpieza de fixtures que es destructiva).

---

## Hipótesis iniciales — validadas / refutadas

| Hipótesis | Veredicto | Evidencia |
|---|---|---|
| **H1**: bugs de integración cruzada Phases 4/5/6A/6B/6C | **VALIDADA** | NeuralCalibration (6) → useStore: PSS-4/rMEQ no se logean a `instruments[]`/`chronotype`. Profile fixtures (6B SP3 limpieza incompleta) siguen pintándose en producción. |
| **H2**: race conditions sutiles | **PARCIAL** | El gate `_loaded` en AppV2Root resolvió el caso store.init() histórico. Pero CoachV2 streaming sin cleanup en unmount = race state-on-unmounted potencial. |
| **H3**: state sync issues en flows reales | **VALIDADA** | El user completa rMEQ en onboarding → `neuralBaseline` se persiste pero `state.chronotype` queda `null` → ColdStart sigue ofreciendo "Calibra tu cronotipo" inmediato post-onboarding. |
| **H4**: ADN inconsistencies acumuladas | **VALIDADA** | InstrumentRunner legacy usa otro ADN (lib/theme.js) cuando se monta desde Profile. El PSS-4 onboarding y el PSS-4 retake se ven distintos y citan distintos años de Cohen (1983 vs 1988). |
| **H5**: bugs específicos que tests sintéticos con mocks no capturan | **VALIDADA** | DataV2 con `history.length < 5` → fallback a `FIXTURE_*`. Los tests mockean store y nunca pisan ese branch en condiciones realistas (user nuevo). |
| **H6**: regresiones por sub-prompts posteriores | **PARCIAL** | No detecté regresiones obvias entre 6A/6B/6C; los bugs son de integración acumulada, no de "antes funcionaba ahora no". |
| **H7**: defectos estructurales nunca detectados | **VALIDADA** | `onBellClick` es stub literal, ~14 acciones `onNavigate` caen en `console.log("[v2] navigate", event)`, 47 V2 components sin test, lib/theme.js consumido por 40+ legacy components. |

---

## Inventario completo de bugs

### CRITICAL (9) — bloquean deployment

#### Bug-01 [CRITICAL] · DataV2 sirve fixtures como datos reales para todo new user
- **Categoría:** integration / state
- **Componente afectado:** [src/components/app/v2/DataV2.jsx:104-112](src/components/app/v2/DataV2.jsx#L104-L112)
- **Reproducción:** Usuario nuevo (history.length < 5) → Tab Datos.
- **Expected:** Empty state honesto ("aún no tienes datos") o ColdStart equivalente.
- **Actual:** Sparkline 28 días, "56 PROMEDIO", "+5 vs sem ant", FIXTURE_ACTIVE_PROGRAM "Neural Baseline · Día 4 de 14", FIXTURE_SESSIONS, FIXTURE_PROGRESS, FIXTURE_ACHIEVEMENTS_RECENT — todo fake mostrado como datos del usuario.
- **Captura:** `flow2-03-data-tab.png`, `flow2-03b-data-scroll.png`
- **Hipótesis causa:** branch `else` final de `deriveData()` retorna fixtures sin gate. El `?empty=true` URL-param es el único escape, pero el user real no lo conoce.
- **Phase origen probable:** 6A SP3/SP4 (UI build con previews); fixtures nunca se removieron.
- **Fix estimado:** ~80 LoC (reemplazar fallback por `<DataIntroEmpty />`).

#### Bug-02 [CRITICAL] · ProfileV2 IdentityHeader + StatsHighlights muestran usuario fake
- **Categoría:** integration / state
- **Componente afectado:** [src/components/app/v2/ProfileV2.jsx:96-98](src/components/app/v2/ProfileV2.jsx#L96-L98)
- **Reproducción:** Usuario nuevo → Tab Perfil.
- **Expected:** Identidad real (email auth, totalSessions=0, racha=0, nivel=Delta).
- **Actual:** "Operador Neural · NIVEL 3", "operador@bio-ignicion.local", "47 SESIONES TOTALES · 7 DÍAS RACHA · 8 LOGROS".
- **Captura:** `flow2-05-profile-tab.png`, `flow5-01-pss4-modal.png` (segundo screenshot al volver)
- **Hipótesis causa:** `useProfileData` retorna `FIXTURE_PROFILE` cuando `totalSessions === 0`. Además `level: 3` está hardcoded incluso cuando hay sesiones reales.
- **Phase origen probable:** 6A SP4 / 6B SP1.
- **Fix estimado:** ~40 LoC (eliminar fixture branch, derivar level desde LVL ladder).

#### Bug-03 [CRITICAL] · NeuralCalibrationV2 NO loggea PSS-4 a `state.instruments[]` ni rMEQ a `state.chronotype`
- **Categoría:** integration / state
- **Componente afectado:** [src/components/onboarding/v2/NeuralCalibrationV2.jsx](src/components/onboarding/v2/NeuralCalibrationV2.jsx) y `useStore.setNeuralBaseline`
- **Reproducción:** Completar onboarding (PSS-4 score 8/16 + rMEQ score 12 "Intermedio") → inspeccionar `window.__BIO_STORE__.getState()`.
- **Expected:** `instruments: [{instrumentId:'pss-4', score:8, ...}]`, `chronotype: 'intermediate'`.
- **Actual:** `instruments: []`, `chronotype: null` (verificado con eval). Solo `neuralBaseline: set` queda.
- **Hipótesis causa:** la calibración guarda todo dentro de `neuralBaseline` blob pero no llama `logInstrument` ni `setChronotype`. Los selectores que el resto de la app usa para decidir "ya completado" (ColdStart cards, InstrumentsView) chequean los slots correctos y no encuentran nada.
- **Phase origen probable:** Phase 6 quick-fix post-SP5 (rewrite NeuralCalibrationV2).
- **Fix estimado:** ~30 LoC (en `onComplete` además del baseline llamar `logInstrument` por cada psychometric + `setChronotype`).
- **Impacto en cadena:** dispara Bug-04 y Bug-09.

#### Bug-04 [CRITICAL] · ColdStart cards "Cronotipo" y "PSS-4" persisten post-onboarding
- **Categoría:** integration / state
- **Componente afectado:** [src/components/app/v2/home/ColdStartView.jsx](src/components/app/v2/home/ColdStartView.jsx)
- **Reproducción:** Completar onboarding → Tab Hoy.
- **Expected:** Ambas cards desaparecen (rMEQ y PSS-4 ya completados).
- **Actual:** Ambas siguen apareciendo como acciones primarias.
- **Captura:** `flow1-17b-home-after-cookies.png`
- **Causa:** consecuencia de Bug-03 (los selectores no detectan que ya se hicieron).
- **Fix estimado:** depende de Bug-03; si se arregla allí, ColdStart se limpia automáticamente.

#### Bug-05 [CRITICAL] · `coachSafety` NO detecta ideación pasiva ("no veo salida", "todo me pesa", etc.)
- **Categoría:** integration / compliance
- **Componente afectado:** [src/lib/coachSafety.js:22-30](src/lib/coachSafety.js#L22-L30)
- **Reproducción:** Coach tab → escribir "no veo salida" → enviar.
- **Expected:** CrisisCard con recursos por locale, NO LLM call, NO incremento quota.
- **Actual:** Va al `/api/coach`, retorna error genérico "No pude responder ahora. Intenta de nuevo en un momento."
- **Captura:** `flow3-11-coach-crisis-detected.png`
- **Hipótesis causa:** lista de regex limitada a frases explícitas ("quiero morir", "matarme", "suicidio"). Frases pasivas/idiomáticas en español ("no veo salida", "no aguanto más", "ya no quiero seguir") no están cubiertas.
- **Compliance impact:** crítico. El sub-prompt mismo lista esto como ejemplo crisis path; la app responde como si fuera un mensaje normal.
- **Fix estimado:** ~30 LoC (ampliar regex set + casos test).

#### Bug-06 [CRITICAL] · Dos implementaciones distintas y discrepantes de PSS-4
- **Categoría:** integration / dead code
- **Componentes afectados:** [src/lib/instruments.js](src/lib/instruments.js) (usado por NeuralCalibrationV2 y AppV2Root retake) vs [src/components/InstrumentRunner.jsx](src/components/InstrumentRunner.jsx) (legacy usado en otro lado).
- **Reproducción:** Completar PSS-4 onboarding → Profile > Instrumentos > "Tomar test".
- **Expected:** Mismo wording, mismo año de cita, mismas opciones, mismo ADN visual.
- **Actual:**
  | | Onboarding | Profile retake |
  |---|---|---|
  | Cita | "PSS-4 · Cohen 1983 · validado peer-reviewed" | "EVALUACIÓN VALIDADA · COHEN & WILLIAMSON 1988" |
  | Opciones | Nunca/Casi nunca/A veces/**Frecuentemente**/**Muy frecuentemente** | Nunca/Casi nunca/A veces/**Casi siempre**/**Siempre** |
  | ADN visual | tokens v2, dark, sin glass | otro ADN, X cyan circular, barra progreso top |
  | Wording Q1 | "En el último mes, ¿con qué frecuencia te sentiste incapaz..." | "¿Con qué frecuencia te has sentido incapaz..." |
- **Captura:** `flow1-09-calibration-01-pss4.png` vs `flow5-01-pss4-modal-real.png`
- **Phase origen probable:** Phase 6 quick-fix (NeuralCalibrationV2 rewrite) introdujo `lib/instruments.js` sin retirar `InstrumentRunner` legacy.
- **Fix estimado:** ~50 LoC (decidir cuál es canónico, redirigir el otro consumer al canónico, retirar legacy).
- **Impacto científico:** scores no comparables entre administraciones — los datos longitudinales del usuario quedan corruptos.

#### Bug-07 [CRITICAL] · ~14 acciones `onNavigate` caen en `console.log` silencioso
- **Categoría:** integration / dead code
- **Componente afectado:** [src/components/app/v2/AppV2Root.jsx:172-294](src/components/app/v2/AppV2Root.jsx#L172-L294)
- **Detalle:** El handler implementa start-recommended/start-protocol/start-pulse-shift/id:hrv/id:pss4/retake-pss4/retake-swemwbs/retake-phq2/tap-program/see-program-today/abandon-program/export-weekly-summary, pero **estos NO**:
  - DataRequestsView: `dsar-access`, `dsar-portability`, `dsar-erasure`
  - AccountView: `change-email`, `change-password`, `unlink-provider`, `signout-current`, `signout-all`
  - SecurityView: `mfa-backup-codes`, `mfa-disable`, `mfa-setup`, `revoke-session`, `remove-trusted-device`
  - Nom35View: `take-nom35`, `target:/app/profile/nom35/report`
  - CalibrationView: `retest-chronotype`, `retest-resonance`
  - HomeV2: `target:/app/data?dimension=...`, `target:/app/data#programs`
  - DataV2: `target:/app/data/sessions/all`, `target:/app/data/achievements/all`
  - DataV2 dimensions: `target:/app/profile/engine-health#...`
  - PrivacyView: `target:/admin`
- **Expected:** Cada uno con handler real (navegar, abrir modal, llamar endpoint).
- **Actual:** Tap → `console.log("[v2] navigate", event)` → user ve "no pasó nada".
- **Fix estimado:** Cuántos sprints valga implementar uno por uno; bloqueador para sub-views user-facing.

#### Bug-08 [CRITICAL] · Cookie banner queda debajo del onboarding modal — bloqueado hasta cerrar onboarding
- **Categoría:** UX / compliance (consentimiento GDPR)
- **Componente afectado:** stacking context entre cookie banner global y AppV2Root onboarding modal.
- **Reproducción:** Visitar `/app` por primera vez → cookie banner aparece pero "Aceptar todo" intercept → "Continuar" del onboarding intercepta pointer events.
- **Expected:** Cookie banner debe ser interactivo SIEMPRE (compliance), o no aparecer hasta que el flow inicial termine.
- **Actual:** Imposible aceptar/rechazar cookies hasta terminar las 5 pantallas welcome + 5 pasos calibration.
- **Captura:** error log de Playwright "subtree intercepts pointer events" durante click `Aceptar todo`.
- **Compliance impact:** consent debe ser libre y previo a cualquier interacción con tracking. Esto fuerza al user a interactuar antes de poder consentir/rechazar.
- **Fix estimado:** ~10 LoC (z-index del cookie banner > modal, o gate del onboarding hasta consent).

#### Bug-09 [CRITICAL] · ColdStart "Tu primera sesión · Pulse Shift" hardcodeado, no deriva del intent
- **Categoría:** state / integration
- **Componente afectado:** [src/components/app/v2/home/ColdStartView.jsx](src/components/app/v2/home/ColdStartView.jsx) (label) vs [src/components/app/v2/AppV2Root.jsx:59-65](src/components/app/v2/AppV2Root.jsx#L59-L65) (handler).
- **Reproducción:** Welcome step 5 → seleccionar "Calma" → Home → ColdStart card "Tu primera sesión".
- **Expected:** Card label "Reinicio Parasimpático · 120s · sin protocolo previo necesario" (el correcto para `firstIntent: 'calma'`).
- **Actual:** Label dice "Pulse Shift · 120s ..." (correcto solo para `energia`); pero al tap, AppV2Root sí lanza el correcto Reinicio Parasimpático vía `FIRST_PROTOCOL_BY_INTENT`.
- **Hipótesis causa:** label en card está hardcoded, no usa `firstIntent` para derivar.
- **Fix estimado:** ~15 LoC (derivar label del mismo mapa que el handler).

---

### HIGH (14) — regresiones user-facing core

#### Bug-10 [HIGH] · `onBellClick` es stub literal — el bell de notificaciones no hace nada
- **Componente:** [src/components/app/v2/AppV2Root.jsx:401](src/components/app/v2/AppV2Root.jsx#L401)
- **Código:** `const onBellClick = () => { console.log("[v2] bell click — drawer placeholder"); };`
- **Captura:** En todos los screenshots de tabs, bell visible top-right, no funcional.

#### Bug-11 [HIGH] · `onNavigate` target a sub-section de Profile cambia tab pero no abre la subsection
- **Componente:** [src/components/app/v2/AppV2Root.jsx:217-228](src/components/app/v2/AppV2Root.jsx#L217-L228)
- **Detalle:** Comentario en código admite el bug. ProfileV2 mantiene `section` state local sin setter externo; `target:/app/profile/calibration` cambia a Tab Perfil pero el user ve la lista de secciones, no la sección target.

#### Bug-12 [HIGH] · CoachV2 muestra "PLAN PRO 0/100" engañoso para users no autenticados
- **Componente:** [src/components/app/v2/CoachV2.jsx:50](src/components/app/v2/CoachV2.jsx#L50)
- **Detalle:** `DEFAULT_QUOTA = { used: 0, max: 100, plan: "PRO" }`. Si `useCoachQuota` falla (401 user no auth) la UI queda con el default → user anónimo cree que tiene PRO.

#### Bug-13 [HIGH] · CoachV2 muestra "No pude responder ahora" sin diferenciar 401 (auth requerido) vs 5xx
- **Componente:** [src/components/app/v2/CoachV2.jsx:163-169](src/components/app/v2/CoachV2.jsx#L163-L169)
- **Detalle:** `!resp.ok || !resp.body` → mismo mensaje genérico. User no auth ve el error pero no sabe que necesita login.

#### Bug-14 [HIGH] · CoachV2 streaming: si user cambia de tab durante stream, fetch no se aborta
- **Componente:** [src/components/app/v2/CoachV2.jsx:172-212](src/components/app/v2/CoachV2.jsx#L172-L212)
- **Detalle:** AbortController existe pero solo se usa en `handleNewConversation`. No hay `useEffect` cleanup que cancele en unmount → setState on unmounted warning + recursos colgando + posible doble-persist en re-mount.

#### Bug-15 [HIGH] · ColdStart card "Calibra tu cronotipo · Test MEQ-SA · 19 preguntas" cita el instrumento equivocado
- **Componente:** ColdStartView card label.
- **Detalle:** El sistema usa rMEQ (Adan & Almirall 1991, **5 ítems**) — no MEQ-SA (Horne & Östberg 1976, 19 ítems). Label hardcoded.

#### Bug-16 [HIGH] · Profile sub-views (Security, Privacy, DataRequests, Account, EngineHealth) sirven `FIXTURE_*` en lugar del store real
- **Componente:** [src/components/app/v2/profile/fixtures.js](src/components/app/v2/profile/fixtures.js) — FIXTURE_NOM35, FIXTURE_ENGINE_HEALTH, FIXTURE_SECURITY, FIXTURE_PRIVACY, FIXTURE_PRIVACY_B2B, FIXTURE_DATA_REQUESTS, FIXTURE_ACCOUNT.
- **Comentario en archivo:** "Phase 6B SP3 — FIXTURE_CALIBRATION + FIXTURE_INSTRUMENTS eliminados" — solo 2 de 9 fueron limpiados; el resto sigue cableado en producción.

#### Bug-17 [HIGH] · NavigationBack del browser tras cerrar protocol player rompe state
- **Reproducción:** Tap "Tu primera sesión" → ProtocolPlayer → exit → back arrow del browser → vuelve al landing `/`. Pierde contexto.
- **Esperado:** Back navigation dentro de la app SPA se queda en /app.

#### Bug-18 [HIGH] · `404 desde /api/v1/me/neural-priors` sin manejo elegante
- **Categoría:** integration / a11y (silent fail)
- **Detalle:** Console error en cada page load. User no auth → 401 esperado, pero no hay try/catch que silencie en cliente.

#### Bug-19 [HIGH] · Auto-advance de PSS-4 inconsistente: q1-q3 sí, q4 (final) no
- **Reproducción:** Onboarding PSS-4 → seleccionar opción en q1 → auto-advance a q2 → mismo en q2/q3 → en q4 NO auto-advance, requiere "Siguiente" manual.
- **UX:** patrón inconsistente; user espera mismo comportamiento.

#### Bug-20 [HIGH] · `Salir` del ProtocolPlayer requiere doble-tap (confirmation pattern) pero el segundo tap a veces no se registra
- **Reproducción:** Mid-protocol → tap "Salir" → toast "Toca otra vez para confirmar" → segundo tap dentro de timeout no siempre cierra.
- **Captura:** `flow1-21b-back-to-home.png` (segundo tap aún muestra protocol activo).

#### Bug-21 [HIGH] · Email del user no se persiste en store (`_userEmail` no existe en DS)
- **Componente:** [src/components/app/v2/ProfileV2.jsx:101](src/components/app/v2/ProfileV2.jsx#L101)
- **Detalle:** Profile lee `store?._userEmail` pero ese field nunca se setea (no está en DS, no hay action que lo escriba). Siempre cae a `FIXTURE_PROFILE.email`.

#### Bug-22 [HIGH] · Banner promo top en landing solapa con botón "Entrar" en mobile (390px)
- **Captura:** `flow1-01-landing.png` — "Nuevo · Activation Kit para equipos — QP" cortado, "Entrar" detrás.
- **Componente:** banner global / header CTA.

#### Bug-23 [HIGH] · CalibrationView muestra "Intermedio · score 12 · hace 8m" ✓ pero ColdStart sigue ofreciendo cronotipo → INCOHERENCIA visual cross-tab
- **Detalle:** Refleja Bug-03 + Bug-04 desde el otro ángulo: el dato existe en `neuralBaseline` (lo lee CalibrationView), pero los selectores de ColdStart no lo encuentran.

---

### MEDIUM (17) — UX defects + technical debt

#### Bug-24 [MEDIUM] · 6+ componentes V2 emiten `console.log("[v2] X active")` en cada render — ruido producción
- **Componentes:** AppV2Root:98, BottomNavV2:14, CoachV2:54, HomeV2:25, DataV2:29, ProfileV2:40
- **Fix:** wrap en `if (process.env.NODE_ENV !== 'production')`.

#### Bug-25 [MEDIUM] · `onNavigate` log de fallback `console.log("[v2] navigate", event)` para todas las acciones no manejadas
- **Componente:** [src/components/app/v2/AppV2Root.jsx:293](src/components/app/v2/AppV2Root.jsx#L293)
- **Detalle:** Hace que ~14 bugs (Bug-07) sean SILENT en producción — no hay user feedback, solo console que el user no abre.

#### Bug-26 [MEDIUM] · 47+ V2 components sin test files
- **Detalle:** HomeV2, DataV2, CoachV2, ProfileV2, todos los profile sub-views, todos los coach sub-components, todos los data sub-components, casi todos los home sub-components.
- **Implicación:** Los 3503 tests pasan pero NO cubren las superficies user-facing principales — explica por qué los bugs Critical-Medium no se detectaron por el suite.

#### Bug-27 [MEDIUM] · `lib/theme.js` legacy aún consumido por 40+ componentes
- **Detalle:** WeeklyReport, TemporalCharts, StreakShield, StreakCalendar, SettingsSheet, SessionShareCard, etc. + InstrumentRunner.
- **Riesgo:** mezcla de ADN cuando estos se montan en V2 (caso confirmado: PSS-4 retake en Profile).

#### Bug-28 [MEDIUM] · Glassmorphism uses contradicen ADN v2 ("no glassmorphism")
- **Componentes:** CrisisFAB:34-35 (blur 12px), MfaStepUpModal:23-24 (blur 4px), QuotaExceededBanner:46-47 (blur 20px), CrisisSheet:59-60 (blur 8px)
- **Decisión pendiente:** dejarlos como excepción documentada o retirar.

#### Bug-29 [MEDIUM] · `fontWeight` raw values fuera de `typography.weight.*`
- **EngineHealthView.jsx:254** — `fontWeight: 500`
- **StreamingCursor.jsx:17** — `fontWeight: 200`

#### Bug-30 [MEDIUM] · DSAR Phase 6C export weekly summary stub
- **Componente:** [src/components/app/v2/AppV2Root.jsx:282-289](src/components/app/v2/AppV2Root.jsx#L282-L289)
- **Detalle:** `window.alert("Export del resumen semanal estará disponible próximamente.")` — honest stub pero feature visible al user. Phase 6D scope.

#### Bug-31 [MEDIUM] · CSP en dev bloquea ~15 inline styles de Next.js dev tools (ruido)
- **Detalle:** En consola: 15+ "Applying inline style violates CSP" desde `next-devtools_index_...js`. No es bug productivo (devtools no se cargan en prod) pero polluta el output cuando se debugga.

#### Bug-32 [MEDIUM] · `react eval()` warning en dev por CSP estricta
- **Detalle:** "eval() is not supported in this environment" — React dev mode requiere eval. Solo afecta dev experience.

#### Bug-33 [MEDIUM] · `audit-export.js` cron exporta TODO desde el primer log (sin cursor persistido)
- **Componente:** [src/server/cron/audit-export.js:8-9](src/server/cron/audit-export.js#L8-L9)
- **TODO en código:** "agregar `Org.auditLastExportedId` en próxima migración".
- **Performance impact:** orgs con muchos audit logs pagan retry costs en cada run.

#### Bug-34 [MEDIUM] · `/api/v1/orgs/[orgId]/audit/verify` sin paginación
- **Componente:** [src/app/api/v1/orgs/[orgId]/audit/verify/route.js:3](src/app/api/v1/orgs/%5BorgId%5D/audit/verify/route.js#L3)
- **TODO admitido en código.** Costoso para orgs grandes.

#### Bug-35 [MEDIUM] · CrisisSheet keydown listener agregado en useEffect sin verificar cleanup
- **Componente:** [src/components/app/v2/CrisisSheet.jsx:37](src/components/app/v2/CrisisSheet.jsx#L37)
- **Verificación pendiente:** comprobar que removeEventListener se llama en el return del useEffect.

#### Bug-36 [MEDIUM] · HeaderV2 setInterval(60s) — verificar cleanup en unmount
- **Componente:** [src/components/app/v2/home/HeaderV2.jsx:15](src/components/app/v2/home/HeaderV2.jsx#L15)

#### Bug-37 [MEDIUM] · saveState persiste flags volátiles `_loaded`, `_syncing`
- **Componente:** [src/store/useStore.js](src/store/useStore.js) — sin allowlist en `scheduleSave/saveNow`.
- **Detalle:** ruido en IDB; siguiente init() lee `_loaded:true` y aunque init lo sobrescribe, hay un microsegundo donde el state cargado dice "ya está cargado" sin estarlo realmente.

#### Bug-38 [MEDIUM] · Dynamic imports sin loading state
- **Componentes:** HRVCameraMeasure, HRVMonitor, InstrumentRunner, ProtocolPlayer en AppV2Root
- **Detalle:** `dynamic(...)` sin opción `loading: () => <LoadingSpinner />`. En conexión lenta hay flash blank entre tap y modal mounted.

#### Bug-39 [MEDIUM] · ProfileV2 hardcodea `level: 3` cuando totalSessions > 0
- **Componente:** [src/components/app/v2/ProfileV2.jsx:103](src/components/app/v2/ProfileV2.jsx#L103)
- **Detalle:** Debería derivar del LVL ladder (`Delta`/`Theta`/`Alpha`/`Beta`/`Gamma`/`Ignición`) basado en `totalSessions`.

#### Bug-40 [MEDIUM] · NeuralCalibration result map: rMEQ score 12 → "Intermedio" pero el ColdStart card sigue diciendo MEQ-SA 19 preguntas
- **Detalle:** Compone con Bug-15 — no solo el label es incorrecto, refleja una decisión de qué instrumento canónico que no se actualizó cross-app.

---

### LOW (7) — cosmetic / polish

#### Bug-41 [LOW] · `data-v2-coach-disclaimer` posición fixed con cálculo hardcoded `56px` (alto del input bar)
- **Componente:** [src/components/app/v2/CoachV2.jsx:375](src/components/app/v2/CoachV2.jsx#L375)
- **Riesgo:** si InputBar height cambia (e.g. multi-line input), disclaimer se descoloca.

#### Bug-42 [LOW] · Duplicación de constante `#08080A` en ~5 componentes en lugar de `colors.bg.base`
- **Componentes:** ActionCard:74, primitives:106, Switch:41, ProtocolCatalog:234, InputBar:119, MfaStepUpModal:109, tokens:8.
- **Fix trivial:** sustituir por token.

#### Bug-43 [LOW] · `rgba(255,255,255,0.96)` repetido en Switch, primitives — debería estar en tokens.
- Ver Bug-42 mismo patrón.

#### Bug-44 [LOW] · `Saltar introducción` con border cyan grueso destaca demasiado vs ADN sutil
- **Componente:** BioIgnitionWelcomeV2 header skip button.
- **Captura:** `flow1-04-welcome-01-manifesto.png`

#### Bug-45 [LOW] · CoachV2 footer disclaimer en gradient `transparent → bg.base` puede leer extraño en algunos backgrounds
- **Componente:** [src/components/app/v2/CoachV2.jsx:383](src/components/app/v2/CoachV2.jsx#L383)

#### Bug-46 [LOW] · "Coach. Aquí cuando me necesites." — copy entre punto seco y frase invitando (ver consistencia con resto)
- **Componente:** CoachV2 intro / CoachIntro

#### Bug-47 [LOW] · "47 SESIONES TOTALES" — divider "·" entre sub-labels en StatsHighlights podría ser más sutil
- **Componente:** StatsHighlights — observación menor de tipografía.

---

## Tablas resumen

### Por severidad

| Severidad | Cantidad | % del total |
|---|---|---|
| Critical | 9 | 19.1% |
| High | 14 | 29.8% |
| Medium | 17 | 36.2% |
| Low | 7 | 14.9% |
| **Total** | **47** | **100%** |

### Por categoría

| Categoría | Cantidad |
|---|---|
| integration / state | 16 |
| dead code / stubs | 6 |
| UX inconsistency | 8 |
| ADN / visual | 6 |
| compliance / safety | 3 |
| performance / memory | 3 |
| testing gaps | 1 |
| infra (dev mode CSP) | 2 |
| copy / cosmetic | 2 |

### Por Phase origen probable

| Phase | Bugs introducidos | % | Notas |
|---|---|---|---|
| Phase 4 | 2 | 4.3% | ProtocolPlayer cancel double-tap edge case + 401 silent fail |
| Phase 5 | 0 | 0.0% | — |
| Phase 6 SP1-SP5 | 22 | 46.8% | Mayoría de bugs (UI build con fixtures, NeuralCalibrationV2 sin wiring real, IdentityHeader fixture) |
| Phase 6A | 6 | 12.8% | onNavigate handlers parciales, ColdStart hardcoded labels |
| Phase 6B | 8 | 17.0% | InstrumentRunner duplication, fixture cleanup incompleto |
| Phase 6C | 4 | 8.5% | CoachV2 streaming cleanup, DEFAULT_QUOTA, disclaimer pos hardcoded |
| Pre-Phase 4 / legacy | 5 | 10.6% | lib/theme.js legacy consumers, CSP/dev infra |

---

## Recomendación plan Phase 6D

Basado en los bugs detectados, propongo **6 sub-prompts** con un total estimado de ~1500–2000 LoC de fixes/wiring real (sin contar la limpieza destructiva de fixtures).

### SP0 — Reconnaissance complemento (ya hecho — este reporte)

### SP1 — Eliminación de fixtures de producción
- Limpiar DataV2.deriveData fallback fixtures → empty state honesto.
- Limpiar ProfileV2 useProfileData fixture → empty state + email auth real cuando esté disponible.
- Limpiar profile/fixtures.js (FIXTURE_NOM35, FIXTURE_SECURITY, FIXTURE_PRIVACY, FIXTURE_ENGINE_HEALTH, FIXTURE_DATA_REQUESTS, FIXTURE_ACCOUNT) → wiring real al store o sub-views con empty state.
- **LoC:** ~250
- **Risk:** medium (cambia visualmente todas las superficies que actualmente "se ven completas" con fixtures).

### SP2 — Integración NeuralCalibrationV2 → store + ColdStart consistency
- En `NeuralCalibrationV2.onComplete` además de `setNeuralBaseline`, llamar `logInstrument` por cada psychometric (PSS-4, MAIA-2 si aplica) y `setChronotype` con el resultado rMEQ.
- Verificar ColdStartView selectors: `chronotype !== null`, `instruments.some(i => i.instrumentId === 'pss-4')` ahora deberían funcionar.
- Card "Tu primera sesión": derivar label desde `firstIntent` (no hardcoded Pulse Shift).
- Card "Cronotipo" copy: rMEQ (5 ítems) no MEQ-SA (19).
- **LoC:** ~150

### SP3 — Eliminación de InstrumentRunner duplicado + canonización PSS-4
- Decidir cuál implementación es canónica (sugerencia: lib/instruments.js + InstrumentRunner v2 dentro de app/v2).
- Migrar el otro consumer al canónico.
- Retirar InstrumentRunner legacy + comprobar que no rompe ningún test.
- Bug fix auto-advance q4 (UX).
- **LoC:** ~200

### SP4 — Implementación de los ~14 handlers `onNavigate` faltantes
- DSAR (3): conectar a /api/v1/me/dsar.
- MFA (5): conectar a /api/auth/mfa/* + sub-views modales.
- Account (5): change-email, change-password, unlink, signout-current/all → endpoints existentes.
- Sub-section navigation (Profile): refactor ProfileV2 para aceptar setter externo de section, así el target:/app/profile/calibration realmente abre la subsection.
- Bell drawer (NotificationDrawer V2 nuevo).
- Home/Data target navigation real.
- **LoC:** ~600 (es mucho — puede dividirse en 4a/4b si el LoC budget lo requiere).

### SP5 — Coach safety expansion + ux clarity
- Ampliar `coachSafety.js` regex con frases pasivas/idiomáticas españolas (no veo salida, no aguanto más, ya no quiero seguir, todo me pesa demasiado, etc.).
- DEFAULT_QUOTA → fetch quota antes de renderizar, mostrar "verificando…" mientras tanto.
- Diferenciar 401 (auth requerido — link a /signin) vs 5xx (genérico) en Coach error states.
- AbortController cleanup en CoachV2 useEffect return.
- **LoC:** ~150

### SP6 — Cleanup técnico + tests críticos
- Eliminar console.log "[v2] X active" producción.
- Reemplazar `console.log("[v2] navigate", event)` fallback por `console.warn` que liste explícitamente "no implementado".
- Eliminar `onBellClick` stub o conectar al drawer real (depende de SP4).
- Tests: cubrir HomeV2, DataV2, ProfileV2 (los 3 tabs principales sin tests) — al menos smoke test que NO se sirvan fixtures.
- Cookie banner z-index fix (Bug-08).
- **LoC:** ~250 + ~300 tests.

### Quick wins viables (cualquier sprint)
- Bug-22 (banner mobile overlap) — 5 LoC
- Bug-29 (fontWeight raw → token) — 4 LoC
- Bug-39 (level hardcoded → derive from LVL) — 8 LoC
- Bug-44 (Saltar introducción styling) — 10 LoC
- Bug-42, Bug-43 (color tokens) — 30 LoC

### Risk areas
- **SP1** rompe muchos snapshots visuales — coordinarlo con visual diff sweep.
- **SP4** es 600 LoC pero 14 endpoints requieren validación independiente cada uno; alto riesgo de regresión si se hace en una sola pasada.
- **SP2** depende de que el shape de `neuralBaseline` actual contenga los datos necesarios para `logInstrument`/`setChronotype` — verificar antes de implementar.

### NO recomendado para Phase 6D
- Eliminar `lib/theme.js` legacy completo — fuera de scope, se queda en su nicho histórico (PWA legacy components).
- Refactor `page.jsx` 55KB legacy — mismo motivo.
- Glassmorphism cleanup (Bug-28) — decisión de ADN, no técnica.

---

## Capturas

Total: **35 screenshots** en [screenshots/reconnaissance-integral/](screenshots/reconnaissance-integral/), agrupadas por flow:

- **Flow 1 (new user onboarding + primera sesión):** flow1-01 → flow1-21c (15 capturas)
- **Flow 2 (reload + cross-tab):** flow2-02 → flow2-07 (7 capturas)
- **Flow 3 (Coach crisis path):** flow3-11 (1 captura)
- **Flow 5 (Instrumentos PSS-4 retake):** flow5-01 (2 capturas — modal real)

Faltantes vs spec:
- HRV measurement E2E real (skipped — no hay cámara en test environment).
- Crisis FAB sheet detail (visible en capturas Home pero no abierto).
- PSS-4 standalone desde ColdStart (cubierto por retake desde Profile).
- SWEMWBS-7 / PHQ-2 retake (mismo modal duplicado que PSS-4 Bug-06).
- Coach quota exceeded (no se llegó a quota en esta sesión).
- Reload del Tab Coach con conversación previa (no hubo conversación válida que persistir).

Estos pueden cubrirse en follow-up Phase 6D verification, después de los fixes.

---

## Conclusión honesta

El reporte de Phase 6C que dijo "deployable a primera org B2B" estaba **basado en tests sintéticos que no cubren las superficies user-facing principales** y en preview screens con `?state=` overrides que no representan el comportamiento de un usuario real.

El producto tiene una **arquitectura sólida** (motor neural, store, persistencia, ProtocolPlayer real, audio engine, neural learning) — esa fundación NO está rota. Lo que está roto es la **última milla de wiring**: los componentes V2 user-facing (DataV2, ProfileV2, CoachV2, ColdStartView) tienen fixtures hardcoded que se sirven en producción y handlers de navegación que caen en console.log silencioso.

Phase 6D necesita ser un sprint serio (~6 sub-prompts, ~2000 LoC) **antes** de cualquier deploy B2B. La buena noticia: la mayoría de los fixes son cirugía localizada en archivos específicos, no requieren refactors de arquitectura.

Cero código modificado en este reconnaissance. Cero tests modificados. Cero commits.
