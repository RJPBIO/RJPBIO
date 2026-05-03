# LEGACY_AUDIT_PHASE6.md

> SP2 Phase 6 · Auditoría forense del código legacy en `page.jsx` 111-2619.
> Decisión per-component (refactor / re-conectar / reescribir) antes de SP3-SP5.

---

## TL;DR

El bloque legacy es **mejor de lo esperado**. Casi todo se puede **re-conectar tal cual** con un wiring trivial desde AppV2Root. Sólo hay 2 puntos de fricción reales:

1. El bandit no recibe `banditWeight` que el player Phase 4 ya calcula — `recordSessionOutcome` se queda con `completionRatio` legacy. **Pérdida defendible**, no bloqueante.
2. `_buildHistoryEntry` no escribe los campos ricos del playerCompletion (status, useCase, vCoresAward computed por el player) al `history` local. El adapter en page.jsx:935-959 los stash en `sessionData.playerCompletion` pero el helper los descarta. **Cosmético**, no rompe nada.

Verdict global: **re-conectar 5/5 componentes auditados**. Cero refactors mayores requeridos para SP3-SP5. Los gaps de telemetría enriquecida quedan como mejoras opcionales (CLEANUP_BACKLOG #12 sugerido).

---

## 1. comp() — verdict: **RE-CONECTAR (con caveat menor)**

### Ubicación + tamaño
- [src/app/app/page.jsx:664-729](src/app/app/page.jsx#L664-L729) · 66 LoC.

### Inputs (vía closure de React)
- `pr` (protocolo activo)
- `st` (state local de useStore en React)
- `sessionData` (legacy shape, populated por adapter de player)
- `durMult` (multiplicador de duración)
- `preMood`, `nfcCtx`, `circadian`, `voiceOn` (contexto)
- `sessionStartedAtRef`, `sessionEndedAtRef`, `motionRef` (refs)

### Flujo interno
1. **Cleanup**: `pauseTRef`, `motionRef.cleanup()`.
2. **Métricas**: `computeSessionMetrics({sessionData, protocol, durMult, now})` → `sessionDataFull`.
3. **Closure cómputo**: `calcSessionCompletion(st, ctx)` → `{eVC, newState, bioQ}`.
4. **Delta HRV**: `buildSessionDelta(...)` → `setPostDelta` (UI state pre-checkin).
5. **Cinematic close**: `playIgnition()`, `hapticSignature("ignition")`, `setOrbDoneFlash(true)` 1600ms.
6. **State commit**: `setSt({...st, ...result.newState})` (vCores, streak, weeklyData, history, achievements, etc.).
7. **Programs avance**: `programTodayStatus` → `store.completeProgramDay` + `store.finalizeProgram` si aplica.

### Shape mismatch vs Phase 4 playerCompletion
| Phase 4 player → comp() | Manejo legacy |
|---|---|
| `status` | descartado (legacy reconstruye via `bioQ.quality`) |
| `partial` | descartado (legacy reconstruye via `_classifyPartialSession`) |
| `partialPercent` | descartado |
| `banditWeight` | descartado (no se pasa a recordSessionOutcome) |
| `vCoresAward` | descartado (legacy recomputa `eVC` con su fórmula) |
| `durationMs` | usado vía sessionData.actualSec (sí) |
| `completedActs` | mapeado a `sessionData.interactions` (sí, vía adapter) |
| `totalActs` | descartado |
| `useCase` | descartado (no propagado a history) |

**Caveat**: el legacy descarta los campos ricos del player, pero **funciona correctamente** porque:
- `_classifyPartialSession` tiene su propia lógica (completeness desde tiempo activo, hidden time).
- `_qualityMultiplier` consume `bioQ.quality` que se computa desde `calcBioQuality(sessionData)`.
- `_computeStreakUpdate`, `_computeCoherence`, `_computeResilience`, `_computeAchievements` son lógica de progresión que no requiere los campos ricos.

### Verdict: **RE-CONECTAR**
- **Razón**: lógica interna correcta, helpers puros (`computeSessionMetrics`, `calcSessionCompletion`, `buildSessionDelta`) ya viven en `lib/`. Programs avance funcional. Cinematic close consistente.
- **Caveat documentado**: campos `status/useCase/vCoresAward/banditWeight` se descartan. Aceptable para SP3 (ship básico). Mejora opcional → CLEANUP_BACKLOG #12.
- **Tarea SP3**: extraer comp() de la closure de page.jsx a una función pura (`closeSession({sessionData, protocol, st, ...})`) reutilizable desde AppV2Root. Estimado: 50 LoC.

---

## 2. submitCheckin → recordSessionOutcome — verdict: **RE-CONECTAR + DEFER UX-OPTIONAL**

### submitCheckin
- [src/app/app/page.jsx:730-746](src/app/app/page.jsx#L730-L746) · 17 LoC.
- **Función** (no componente UI): toma estado de `<PostSessionFlow>` (mood/energy/tag), arma outcome, alimenta bandit + outbox.

### Flow
1. `buildCheckinEntry({checkMood, checkEnergy, checkTag, preMood, protocol, ...})` → `{moodLog, achievements, outcome|null}`.
2. Si `!skipped`: `setSt({...st, moodLog, achievements})`.
3. Si `outcome` existe: `store.recordSessionOutcome(outcome)` → bandit aprende.
4. `shipSessionToOutbox(checkMood)` → backend sync.
5. `setPostStep("summary")`.

### buildCheckinEntry shape (de [src/lib/sessionCheckin.js](src/lib/sessionCheckin.js))
```js
outcome = {
  intent: protocol.int,
  protocol: protocol.n,
  deltaMood: postMood - preMood,
  predictedDelta,
  completionRatio,
  energyDelta?, hrvDelta?
}
```

### recordSessionOutcome (en [src/store/useStore.js:349](src/store/useStore.js#L349))
- Toma intent/deltaMood/hrvDelta/completionRatio/energyDelta.
- Computa `compositeReward({moodDelta, energyDelta, hrvDeltaLnRmssd, completionRatio})`.
- Actualiza dos arms del bandit: contextual `intent:bucket` + global `intent`.
- Loggea residuales (predicted vs actual) sólo si moodPresent.

### Gap detectado
- **`banditWeight` del Phase 4 playerCompletion NO se pasa a recordSessionOutcome.**
- El store usa `completionRatio` legacy (1.0 por default, modulable por checkin).
- Phase 4 player calcula `banditWeight` específicamente para penalizar `partial` sessions (e.g. 0.5 si el user salió a mitad).
- Hoy: si user completa 100% de actos, banditWeight=1.0 — match con default. Si user sale a mitad (partial), Phase 4 banditWeight=0.5 pero legacy `completionRatio` queda en 1.0 a menos que se pase explícito.
- Resultado: bandit aprende **un poco optimista** en sesiones partial. No critical.

### Verdict: **RE-CONECTAR (función) + DEFER (UI checkin)**
- **`buildCheckinEntry` + `recordSessionOutcome`**: re-conectar tal cual. Pasar `completionRatio: playerCompletion.banditWeight ?? 1` desde el flow de SP3 cierra el gap. **Trivial: 1 LoC.**
- **`<PostSessionFlow>` UI checkin**: opcional para Phase 6 MVP. SP4 puede shippar sin checkin manual (auto-record con `deltaMood=null` + `hrvDelta` si existe HRV — sí actualiza bandit por la rama HRV de Sprint S4.2 en useStore.js:367). UX checkin → Phase 7 o post-launch.

---

## 3. BioIgnitionWelcome — verdict: **MANTENER TAL CUAL**

### Ubicación + tamaño
- [src/components/BioIgnitionWelcome.jsx](src/components/BioIgnitionWelcome.jsx) · **705 LoC**.

### Estructura
- 4 pantallas (no 3 como SP1 P6 supuso): manifiesto / cómo funciona / intent picker / ignite CTA.
- Branding canónico: `BioGlyph`, `Wordmark`, `IgnitionBurst`, `bioSignal`, `brand`, `font`, `space`, `radius`, `ty`.
- Framer Motion + `useReducedMotion` (a11y) + `useFocusTrap` (modal a11y).
- INTENTS picker (4) alineado con `protoColor` (enfoque/calma/energia/recuperacion).
- Copy professional B2B (NO wellness genérico): "instrumento", "señal biométrica", "filtro 94%/6%", "1 de cada 20 opera al día 30".

### Calidad
- ADN visual heredado: ✅ tokens canónicos, sin auroras, sin gradients reñidos.
- Tono apropiado para profesional ejecutivo: ✅.
- A11y: ✅ focus trap, reduced motion, ariaLabels.
- Cumple "top global app": ✅. Comparable con Oura/Whoop/Apple Fitness welcome.

### Verdict: **MANTENER TAL CUAL**
- **Tarea SP5**: mountar como overlay en AppV2Root cuando `!st.welcomeDone`. Pasar `onComplete(intent)` para guardar `firstIntent` + `setWelcomeDone`. Estimado: 30 LoC en AppV2Root.

---

## 4. NeuralCalibration — verdict: **MANTENER TAL CUAL**

### Ubicación + tamaño
- [src/components/NeuralCalibration.jsx](src/components/NeuralCalibration.jsx) · **1154 LoC**.

### Estructura
- 6 pasos: welcome / reaction time / breath hold / focus / stress / result.
- Cada step con science note (RT prefrontal, breath-hold vagal tone, attention dorsal network).
- Cita base: Lancet Digital Health 2020 (personalized interventions +34% outcomes).
- Composite baseline calc: `rt*0.25 + bh*0.25 + focus*0.25 + stress*0.25`.
- Recommendations: primaryIntent (calma/enfoque/energia), sessionGoal (2 o 3), difficulty (1-3).

### Instrumentos
- **NO valida instrumentos clínicos** (no PSS-4, MAIA, MEQ chronotype). Son proxies custom.
- Defendibles científicamente:
  - Reaction time visual: standard prefrontal proxy.
  - Breath hold: vagal tone proxy estándar (>25s = buen tono parasimpático).
  - Focus distraction count: dorsal attention network proxy.
- Para producto B2B wellness: **acceptable**. Para certificación clínica: requeriría instrumentos validados (esto está documentado en CLEANUP_BACKLOG / NOM-035 review).

### Output payload (clean)
```js
baseline = {
  avgRT, rtVariance, rtScore,
  breathHold, bhScore,
  focusAccuracy, focusError,
  stressLevel, stressScore,
  composite, timestamp, profile, profileLabel,
  recommendations: { primaryIntent, sessionGoal, difficulty }
}
```

### Verdict: **MANTENER TAL CUAL**
- **Tarea SP5**: mountar después de BioIgnitionWelcome si `!st.onboardingComplete`. onComplete actualiza `neuralBaseline + onboardingComplete + calibrationHistory + sessionGoal`. Estimado: 30 LoC en AppV2Root.

---

## 5. Mount `<ProtocolPlayer>` — verdict: **REUSAR AS-IS (con mínima refactor de adapter)**

### Ubicación
- [src/app/app/page.jsx:920-962](src/app/app/page.jsx#L920-L962).

### Mount actual
```jsx
{(ts==="running"||ts==="paused") && pr && (
  <ProtocolPlayer
    key={`pp-${pr.id}-${sessionStartedAtRef.current||0}`}
    protocol={pr}
    voiceOn={voiceOn}
    hapticOn={st.hapticOn !== false}
    binauralOn={st.binauralOn !== false && st.soundOn !== false}
    cameraEnabled={false}
    onComplete={(playerSessionData) => { ...adapter... ; comp(); }}
    onCancel={() => { rs(); }}
  />
)}
```

### Adapter onComplete (líneas 935-959)
```jsx
setSessionData(d => ({
  ...d,
  interactions: (playerSessionData.completedActs || 0),  // semantic remap
  phaseTimings: (d.phaseTimings || []).concat([{
    phase: "player_v2",
    durationMs, completedActs, totalActs, status,
    partial, partialPercent, banditWeight, useCase
  }]),
  playerCompletion: playerSessionData,  // raw stash
}));
setTs("done");
comp();
```

### Verdict: **REUSAR AS-IS**
- Mount está condicionado correctamente.
- Props correctos (voiceOn, hapticOn, binauralOn, cameraEnabled).
- `key={pp-${pr.id}-${startedAt}}` fuerza re-mount entre sesiones (correcto).
- Adapter funciona: el legacy comp() consume sessionData.interactions (=completedActs) y sessionData.actualSec (=durationMs/1000).
- onCancel → rs() (reset al state idle).

### Mejora opcional (CLEANUP_BACKLOG #12 sugerido)
- Pasar `completionRatio: playerCompletion.banditWeight ?? 1` cuando se llame `recordSessionOutcome` desde submitCheckin (1 LoC en submitCheckin).
- Extender `_buildHistoryEntry` para aceptar `playerCompletion` y persistir `status / useCase / vCoresAward Player-computed` en history. Estimado: 10 LoC en `_buildHistoryEntry`.

### Tarea SP3
- Mountar `<ProtocolPlayer>` como overlay desde AppV2Root, NO desde page.jsx. State lifted: `selectedProtocol`, `playerOpen` en AppV2Root.
- Wire onComplete a un nuevo handler `handlePlayerComplete(playerSessionData)` que invoca `closeSession()` (extraída de comp()) + `recordSessionOutcome` opcional + `completeProgramDay` opcional.
- Eliminar la dependencia de `setSessionData` (state local de page.jsx) — pasarla a `closeSession` como param.

---

## 6. Helpers asociados — verdicts

### computeSessionMetrics — [src/lib/sessionClose.js:20](src/lib/sessionClose.js#L20)
- **Pure function**, ya en `lib/`, no tiene UI deps.
- Consume `sessionData` shape legacy (expectedSec, startedAt, hiddenMs).
- **Verdict: REUSAR**. Cero modificaciones requeridas para SP3.

### calcSessionCompletion — [src/lib/neural.js:1491](src/lib/neural.js#L1491)
- **Pure function**, ya en `lib/`.
- Consume sessionData + protocol + st (slice del store).
- Llama 8 helpers internos: `_computeStreakUpdate`, `_computeCoherence`, `_computeResilience`, `_computeCapacity`, `_computeAchievements`, `_classifyPartialSession`, `_qualityMultiplier`, `_buildHistoryEntry`.
- **Verdict: REUSAR**. Para mejora opcional (richer history), extender `_buildHistoryEntry` (10 LoC, no bloqueante).

### buildSessionDelta — [src/lib/sessionDelta.js:93](src/lib/sessionDelta.js#L93)
- **Pure function**, ya en `lib/`.
- Construye delta HRV pre/post para outbox.
- **Verdict: REUSAR**.

### buildCheckinEntry — [src/lib/sessionCheckin.js:33](src/lib/sessionCheckin.js#L33)
- **Pure function**, ya en `lib/`. Excelente contract documented + tested.
- **Verdict: REUSAR**.

### buildSessionOutboxPayload — [src/lib/sessionDelta.js:197](src/lib/sessionDelta.js#L197)
- Construye payload para `/api/sync/outbox`.
- **GAP**: NO incluye campos Phase 4 (status, useCase, etc.). SP1 P6 reportó esto.
- **Verdict: EXTEND** en SP6 (ó CLEANUP_BACKLOG #12). Bloqueado hasta migration Prisma de NeuralSession.

### sessionQualityMessage / shouldPlayIgnitionSignature
- Trivial helpers en sessionClose.js.
- **Verdict: REUSAR**.

### store helpers (completeSession, recordSessionOutcome, completeProgramDay, finalizeProgram)
- Todos en `useStore.js`. Bien estructurados, con tests.
- **Verdict: RE-CONECTAR INVOCATIONS** desde AppV2Root.

---

## 7. Plan SP3-SP5 ajustado

### SP3 Phase 6 — Wiring básico (LoC: ~250)
**Objetivo**: tap "Comenzar" en HomeV2 → mount `<ProtocolPlayer>` → onComplete recoge sessionData.

- **AppV2Root** (~80 LoC): state lifted `selectedProtocol`, `playerOpen`. Mount `<ProtocolPlayer>` como overlay full-screen condicional. onComplete + onCancel handlers.
- **Bus de navegación** (~30 LoC): reemplazar `onNavigate = console.log` por `handleNavigate({action, target, ...})`. Action `start-recommended` → setSelectedProtocol(rec.primary) + setPlayerOpen(true).
- **closeSession()** (~80 LoC): extraer comp() a función pura en `lib/sessionFlow.js`. Recibe `{sessionData, protocol, st, durMult, refs}`. Aplica computeSessionMetrics + calcSessionCompletion + completeProgramDay + cinematic close. Devuelve `{newState, postDelta, eVC, bioQ}` para que caller aplique setSt.
- **Adapter player→sessionData**: idéntico al de page.jsx:935-959, ~25 LoC en AppV2Root.
- **Programs avance**: copiar bloque de comp() líneas 711-728 dentro de closeSession.
- **Risk**: bajo (todas las piezas existen).

### SP4 Phase 6 — Crisis + Catálogo + Bandit recording (LoC: ~300)
**Objetivo**: crisis quick access, catálogo tappeable, bandit aprende de sesión real.

- **Crisis FAB** (~60 LoC): botón flotante "Estoy en crisis" en BottomNavV2 o como overlay persistente. Sheet con #18/#19/#20 (label + intro corta). Tap → setSelectedProtocol + setPlayerOpen. SafetyOverlay del player gestiona disclaimer.
- **ProtocolCatalog** en Tab Datos (~120 LoC): nueva sección con los 23 protocolos tappeables (filter por intent / dificultad). Tap → setSelectedProtocol + setPlayerOpen.
- **Auto-record bandit** post-completion (~40 LoC): wire `closeSession` para llamar `store.recordSessionOutcome` con `outcome` derivado del playerCompletion (intent=protocol.int, completionRatio=banditWeight, hrvDelta si HRV disponible). Sin checkin manual; defer UI checkin a SP5/Phase 7.
- **completeProgramDay** ya en closeSession de SP3.
- **Risk**: bajo (CrisisCard del coach permanece como informational; este FAB es nuevo path).

### SP5 Phase 6 — Onboarding + Cierre (LoC: ~200 + cleanup)
**Objetivo**: usuario nuevo recibe Welcome+Calibration, dead code legacy se borra.

- **Mount BioIgnitionWelcome** en AppV2Root cuando `!st.welcomeDone` (~30 LoC).
- **Mount NeuralCalibration** post-welcome cuando `!st.onboardingComplete` (~30 LoC).
- **ColdStartView handlers** funcionales (~40 LoC): "Tu primera sesión" → setSelectedProtocol(P[12]) + setPlayerOpen.
- **SettingsView** audit: quick scan de TTS/haptic/voice toggles, fix wiring si está roto (~30 LoC if needed).
- **Cleanup dead code**: eliminar líneas 111-2619 de page.jsx (post-validación e2e). Remover `PROTOTYPE_V2` flag.
- **CLEANUP_BACKLOG update**: cerrar item #1 (SessionRunner deprecated removal post-validación). Add #12 sobre playerCompletion enrichment opcional.
- **FINAL_PHASE6A_REPORT.md** consolidado.
- **Risk**: bajo (componentes existen, solo wiring + cleanup final).

### LoC total estimado Phase 6A: ~750 LoC + 1 archivo nuevo (`lib/sessionFlow.js`).

---

## 8. Risk register actualizado

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| State lifting genera bugs en mount/unmount del player | Baja | Patrón estándar (key forzado por `${id}-${startedAt}`); SP3 incluye e2e Playwright |
| comp() extraction rompe alguna closure | Baja | Función casi pura; refs se pasan como params explícitos |
| Adapter playerCompletion ↔ sessionData no cubre algún edge | Baja | Adapter actual ya probado en harness `/dev/protocol-player` |
| Bandit recording con `completionRatio: banditWeight` produce sesgo | Muy baja | banditWeight=1.0 default; partial=0.5 es exactamente lo que se quiere |
| SettingsView toggles no funcionales | Media | Audit ligero en SP5; si falla, fix es ~50 LoC |
| Crisis FAB visual conflicta con BottomNavV2 | Baja | SP4 incluye Playwright capture mobile 375×812 |
| Cleanup dead code rompe algún componente que aún se importa | Baja | grep antes de borrar; CI/build catches imports rotos |
| BioIgnitionWelcome / NeuralCalibration tienen UI deps no resueltas en v2 | Baja | Componentes ya tienen sus tokens via theme.js / tokens.js compartidos |

**Risk dominante**: ninguno crítico. Phase 6A se sostiene en piezas existentes y bien probadas.

---

## 9. Conclusión + cierre SP2

**Auditoría completa**: 5 verdicts MANTENER/RE-CONECTAR + 6 verdicts RE-CONECTAR sobre helpers. Cero refactors mayores requeridos. Cero reescrituras desde cero.

**Único refactor menor recomendado**: extraer `comp()` de la closure de page.jsx a `lib/sessionFlow.js > closeSession()` (~80 LoC). Esto es lo que SP3 ya planeaba; ahora confirmado como suficiente.

**Mejora opcional documentada** (no bloqueante): enriquecer `_buildHistoryEntry` para persistir status/useCase/vCoresAward Phase 4 en history local. → CLEANUP_BACKLOG #12.

Listo para SP3 Phase 6 — wiring básico de mount + "Comenzar" funcional.
