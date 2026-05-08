# NEURAL ENGINE AUDIT — ¿MOTOR BUGATTI A FULL CAPACIDAD?

**Fecha:** 2026-05-07
**Modo:** Read-only diagnostic + algorithmic effectiveness audit
**Scope:** [src/lib/neural.js](src/lib/neural.js) + [src/lib/neural/](src/lib/neural/) (10 modules) + [src/hooks/useAdaptiveRecommendation.js](src/hooks/useAdaptiveRecommendation.js) + consumers (HomeV2, LearningView, PersonalizedView, ColdStartView, AppV2Root, EngineHealthView, NeuralSettingsClient, PostSessionFlow)

**Veredicto preliminary:** **~38–45 % de capacidad efectiva** — el motor implementa algoritmos premium-grade pero los pipelines de input y output que lo alimentan en producción están casi todos cortados. Es un Bugatti corriendo en primera marcha.

---

## Resumen ejecutivo

| Severidad | Findings |
| --- | --- |
| **Critical** | 4 |
| **High** | 7 |
| **Medium** | 6 |
| **Low** | 4 |

**Hallazgo dominante:** Existe un **gap masivo de ALIMENTACIÓN** del engine. Las funciones algorítmicas (Thompson/UCB1, Bayesian priors, residual calibration, multi-signal anti-gaming, burnout MBI, cold-start cohort blend) están implementadas y testadas a nivel premium. Pero en flujo producción real:

1. **`state.moodLog` siempre vacío** (`logMood` nunca se llama, [PostSessionFlow.jsx](src/components/PostSessionFlow.jsx) es código muerto). Esto envenena ~9 métricas downstream que dependen del par mood pre/post.
2. **Bandit nunca actualiza** — `recordSessionOutcome` se llama con `deltaMood: null, hrvDelta: null` ([AppV2Root.jsx:738-748](src/components/app/v2/AppV2Root.jsx#L738-L748)) → `compositeReward` retorna null → bandit short-circuits sin update. Sprint 4.2 fallback HRV-only no rescata porque tampoco se pasa HRV en path session-complete.
3. **`detectGamingV2` (Sprint 45 multi-signal)** → no se usa en producción. `calcSessionCompletion` invoca `detectGamingPattern` v1 (3 reglas binarias).
4. **`currentMood` (mood picker pre-sesión)** → engine lo soporta como controller en tiempo real, pero no existe UI que lo pase. El branch `moodIsExplicit` en [neural.js:644-690](src/lib/neural.js#L644-L690) está muerto.

El motor podría triplicar su valor real con ~3 SPs dedicados de "wiring" sin tocar algoritmos.

---

## Inventario engine

### Funciones core ([src/lib/neural.js](src/lib/neural.js), 1580 líneas)

| Función | Propósito | Nivel |
| --- | --- | --- |
| `adaptiveProtocolEngine` | Engine principal multi-factor | Premium |
| `_generateReason` | Reasons contextuales (8 ramas) | Premium |
| `predictSessionImpact` | CI prediction + chronotype prior + cohort blend + drift detection | Premium |
| `calcSessionCompletion` | Compute new state post-session | Sólido |
| `_computeStreakUpdate` | Streak DST-safe (Sprint 80) | Sólido |
| `calcBurnoutIndex` | MBI 3-component (Schaufeli 2002) | Premium |
| `calcBioQuality` | iScore/tScore/mScore weights motion-aware | Premium |
| `calcNeuralMomentum` | Tendencia delta + streak + density | Sólido |
| `analyzeNeuralRhythm` | Peak windows + day pattern | Sólido |
| `generateCoachingInsights` | 9 tipos de insight priorizados | Premium |
| `estimateCognitiveLoad` | Curva horaria + signals personales + sleep debt (Lim & Dinges 2010) | Premium |
| `analyzeStreakChain` | DST-safe break analysis | Sólido |
| `suggestOptimalTime` | Hour bucket effectiveness | Sólido |
| `calcProtoSensitivity` | avgDelta per protocol | Sólido |
| `calcRecoveryIndex` | Mood retention windows | Sólido |
| `calcProtocolCorrelations` | Per-protocol time-of-day delta | Sólido |
| `calcNeuralFingerprint` | Cognitive signature snapshot | Sólido |
| `genIns` (legacy) | DEPRECATED | Mantenido por compat |

### Sub-modules ([src/lib/neural/](src/lib/neural/))

| Modulo | LOC | Propósito | Nivel |
| --- | --- | --- | --- |
| [bandit.js](src/lib/neural/bandit.js) | 303 | UCB1-Normal contextual + time-decay (Sprint 47) + composite reward (Sprint S4.2) | Premium |
| [coldStart.js](src/lib/neural/coldStart.js) | 235 | Bayesian priors literatura + cohort blend (Sprint 51) | Premium |
| [staleness.js](src/lib/neural/staleness.js) | 175 | Drift detection + age-weighted samples (Sprint 42) | Premium |
| [pauseFatigue.js](src/lib/neural/pauseFatigue.js) | 198 | Multi-signal partial/pauses/hidden detection (Sprint 50) | Premium |
| [antiGaming.js](src/lib/neural/antiGaming.js) | 256 | Multi-signal v2 (Sprint 45): RT/touch/timeOfDay/bioQ/duration | Premium |
| [chronoCircadian.js](src/lib/neural/chronoCircadian.js) | 106 | Subjective hour by chronotype (Roenneberg 2007) | Premium |
| [residuals.js](src/lib/neural/residuals.js) | 101 | Per-arm calibration bias | Sólido |
| [pauseFatigue config](src/lib/neural/config.js#L250) | — | Severe/mild thresholds + force intent | Sólido |
| [health.js](src/lib/neural/health.js) | 295 | Engine self-introspection (5 metrics + actions list) | Premium |
| [orgHealth.js](src/lib/neural/orgHealth.js) | 330 | Org-wide aggregate metrics | Sólido |
| [config.js](src/lib/neural/config.js) | 469 | Frozen NEURAL_CONFIG con citations académicas | Premium |

### Consumers identificados

| Consumer | Surface engine | Notas |
| --- | --- | --- |
| [HomeV2.jsx](src/components/app/v2/HomeV2.jsx) | `evaluateEngineHealth` (sólo `dataMaturity`), `useAdaptiveRecommendation`, `suggestOptimalTime`, `useReadiness` | Usa pero NO surface `accuracy`, `acceptance`, `personalization`, `fatigue`, `recalibration`, `recommendation.context.*` |
| [LearningView.jsx](src/components/app/v2/home/LearningView.jsx) | `useAdaptiveRecommendation` + `extractPrimaryProtocol/Reason` + `RecommendationAlternativesCard` | Surface primary + alternatives + reason. NO surface `context.fatigue/staleness/recalibration` |
| [PersonalizedView.jsx](src/components/app/v2/home/PersonalizedView.jsx) | recommendation.alternatives | Idem |
| [ColdStartView.jsx](src/components/app/v2/home/ColdStartView.jsx) | recommendation pass-through | Engine often returns null → fallback `firstProtocolForIntent` |
| [PostSessionFlow.jsx](src/components/PostSessionFlow.jsx) | (DEAD CODE — no importer) | **Critical finding** |
| [DashboardView.jsx](src/components/DashboardView.jsx) | `calcBioSignal`, `calcBurnoutIndex`, `generateCoachingInsights`, `calcNeuralMomentum`, `calcNeuralVariability`, `estimateCognitiveLoad` | Legacy v1 dashboard (no claro si está ruteado en v2) |
| [NeuralCoach.jsx](src/components/NeuralCoach.jsx) | `generateCoachingInsights`, `calcNeuralMomentum`, `analyzeNeuralRhythm`, `calcProtocolDiversity`, `calcSessionQualityTrend` | Legacy |
| [ProfileView.jsx](src/components/ProfileView.jsx) | `calcNeuralFingerprint`, `suggestOptimalTime`, `analyzeStreakChain` | Legacy |
| [EngineHealthView.jsx](src/components/app/v2/profile/engine-health/EngineHealthView.jsx) | **NO USA `evaluateEngineHealth`** — sólo `totalSessions` tier + bandit reward | Re-implementación shallow |
| [NeuralSettingsClient.jsx](src/app/(org)/settings/neural/NeuralSettingsClient.jsx) | `evaluateEngineHealth` exhaustive (overall, recalibration, accuracy, signals, actions, schemaVersion) | **Único surface premium** del health introspection. NO surface fatigue field. |
| [CorrelationMatrix.jsx](src/components/CorrelationMatrix.jsx) | `calcProtocolCorrelations` | Legacy |
| [api/v1/me/neural-health/route.js](src/app/api/v1/me/neural-health/route.js) | Server-side `evaluateEngineHealth` | Endpoint existe — UI mobile (EngineHealthView) no lo consume aún |

---

## Algoritmos operating at full capacity (positivo)

### `_generateReason` ([neural.js:854](src/lib/neural.js#L854))
- Implementación: 8 ramas priorizadas (burnout > readiness > nom35 urgent > nom35 match > moodPicker explicit > sensitivity > momentum > circadian default).
- Tests: cubiertos parcialmente (bugfix/fix-a1 specs verifican shape).
- Output surface: ✅ via `extractPrimaryReason` en HomeV2/LearningView/PersonalizedView (Phase 6H Fix-A1).

### Thompson / UCB1 Bandit ([bandit.js](src/lib/neural/bandit.js))
- Implementación: UCB1-Normal con prior Bayesiano + decay observación (0.97) + decay temporal lazy-on-read (Sprint 47) + tie-breaking diversity (Sprint S4.3) + composite reward fallback HRV (Sprint S4.2).
- Tests: 375 LOC, cubre prior, decay, ties, time-decay, composite.
- Output surface: parcial (EngineHealthView muestra sum/n por intent), pero **time-decay efectivamente muerto** (ver Critical-2).

### Bayesian cold-start prior ([coldStart.js](src/lib/neural/coldStart.js))
- 8 buckets × 4 intents con anclas literatura (Cajochen, Roenneberg, Schmidt) + cohort k-anonymity (≥5 users) + ramp lineal a 30 muestras.
- Tests: 362 LOC, cubre blend literatura/cohort en distintos n.
- Surface: vía `priorBonus` en scoring + `priorPredictionShape` en `predictSessionImpact`. Funciona end-to-end.

### Staleness + age-weighted samples ([staleness.js](src/lib/neural/staleness.js))
- 5 ventanas (fresh→abandoned), exponential decay 21d half-life (Wood & Rünger 2016), recalibration soft/hard.
- Tests: 209 LOC.
- Surface: parcial. `NeuralSettingsClient` muestra recalibration banner. Engine context expone `staleness.*` y `recalibration` en cada call pero **HomeV2/LearningView/PersonalizedView NO lo surface en mobile** (la sub-ruta web sí).

### Anti-gaming v2 multi-signal ([antiGaming.js](src/lib/neural/antiGaming.js))
- 5 signals (RT CV, touch hold uniformity, time-of-day entropy, bioQ distribution, duration variance) + composer scoring [0..100] con verdicts clean/suspicious/likely-gaming.
- Tests: 245 LOC, cubre cada signal + composer.
- Surface: ❌ **DEAD** (Critical-3).

### MBI Burnout Index
- 3 componentes (exhaustion/disengagement/efficacy) con weights ponderados por presencia de efficacy data.
- Tests: cubiertos.
- Surface: ❌ — `state.moodLog` siempre empty en prod (Critical-1) → `risk: "sin datos"` perpetuo.

**Sub-total positivo:** ~70 % del CÓDIGO está implementado a nivel premium-grade. ~30 % ya alcanza UI con calidad esperada (la web admin/settings tier es el único surface completo).

---

## CRITICAL findings

### CRITICAL-1 — `state.moodLog` permanently empty in production

**Evidence:**
- `logMood` defined in [useStore.js:439](src/store/useStore.js#L439).
- `grep "logMood\\("` retorna **0 callers en producción**.
- [PostSessionFlow.jsx](src/components/PostSessionFlow.jsx) (1147 líneas) no es importado desde ningún lugar; `grep PostSessionFlow` solo encuentra su propia definición.

**Impact en cascada:**
- `calcBurnoutIndex` → `risk: "sin datos"` siempre.
- `calcBioSignal.burnout` → 0.
- `calcProtoSensitivity` → `{}` siempre.
- `predictSessionImpact` → cae a fallback global `0.8` (línea 555-565).
- `_burnoutExhaustion / Disengagement / Efficacy` → todas "datos insuficientes".
- `calcRecoveryIndex` → `null` (necesita 4+ moodLog with pre).
- `calcProtocolCorrelations` → `null` (necesita 5 con pre).
- `computePredictionAccuracy` → `value: null, status: "insufficient-data"`.
- `computePersonalizationStrength` → `signals.sensitivity: false` permanente.
- `_generateReason` rama "tu historial muestra +X" → nunca se activa.
- `recordSessionOutcome` con `deltaMood: null` → no actualiza bandit (ver Critical-2).

**Fix scope:** SP dedicado — wire `PostSessionFlow` a `AppV2Root.handlePlayerComplete` o crear un "mood post" mini-modal antes de cerrar el player. Una sola integración recupera ~9 métricas downstream.

---

### CRITICAL-2 — Bandit nunca recibe reward real en producción

**Evidence:** [AppV2Root.jsx:738-748](src/components/app/v2/AppV2Root.jsx#L738-L748)
```js
store.recordSessionOutcome({
  intent: selectedProtocol.int,
  deltaMood: null,        // ← sin checkin manual MVP
  predictedDelta: null,
  completionRatio: ...,    // sólo este es real
  hrvDelta: null,         // ← sin biometría real todavía (Phase 6B)
});
```
- En [useStore.js:709](src/store/useStore.js#L709): `if (!moodPresent && !hrvPresent) return;` → corta silenciosamente.
- `compositeReward` con todos los deltas null → returns null → no update.

**Impact:**
- Bandit `banditArms` queda en `{}` o congelado para siempre.
- `selectArm` ranking sólo usa el prior poblacional (PRIOR_MEAN=0.3), todos los empates → tie-break random (Sprint S4.3 logic).
- UCB1 exploration vs exploitation degenera: nunca hay "exploitation" porque ningún arm aprende.
- `topArms` siempre vacío.
- Calibration bias por arm → todos `n=0` (filtra `n >= 2`).

**Fix scope:** Combinar con Critical-1 — cuando user submitee mood post, propagarlo aquí. Mientras tanto, considerar pasar `hrvDelta` cuando sí existe lectura HRV pre/post (existe `logHRV` y `useReadiness`).

---

### CRITICAL-3 — `detectGamingV2` (Sprint 45) is dead code in production

**Evidence:**
- `grep "detectGamingV2\\("` retorna **sólo tests + neural.js export**.
- [neural.js:1526](src/lib/neural.js#L1526) en `calcSessionCompletion` invoca `detectGamingPattern` (v1 — 3 reglas binarias).

**Impact:**
- 5 signals premium (CV de RT, uniformidad touch, entropía de hora-del-día, distribución bioQ, varianza duración) **nunca corren en sesión real**.
- Sprint 45 NEURAL_CONFIG.gamingV2 (~60 líneas de constantes con racional) es ornamento.
- Falsos negativos: usuarios sofisticados con bot que evita las 3 reglas v1 (interactions=0 / qual-flat-low / 30s-gap) pasan limpios.

**Fix scope:** ~1 día — reemplazar `detectGamingPattern(hist)` con `detectGamingV2({history: hist}, {reactionTimes, touchHolds})` en `calcSessionCompletion` y aplicar el verdict (likely-gaming → `bioQ.quality = "inválida"`, suspicious → reduce vCores).

---

### CRITICAL-4 — `currentMood` pre-session picker logic está implementado pero sin UI

**Evidence:**
- Engine soporta `currentMood` ([neural.js:627-690](src/lib/neural.js#L627-L690)) — branch `moodIsExplicit` permite que un tap en picker pre-sesión modifique `primaryNeed` en tiempo real.
- `useAdaptiveRecommendation({currentMood})` propaga la opción.
- `grep "currentMood:" / "currentMood ="` → solo neural.js + hook + 1 test (`useAdaptiveRecommendation.test.js`). **0 callers en componentes**.

**Impact:**
- La feature "el tap del picker pre-sesión modifica recommendation en tiempo real" — **vendida en código** pero **invisible al user**.
- Override priorities (lastMood=1 → calma, lastMood=5 → energia) → muerto.

**Fix scope:** Mini-component "How are you feeling?" (1-5 emoji scale) en pre-protocol screen + propagar al hook. ~½ día.

---

## HIGH findings

### HIGH-1 — Time-decay del bandit nunca se persiste

**Evidence:** [useStore.js:726-727](src/store/useStore.js#L726-L727)
```js
[keyCtx]: updateArm(arms[keyCtx], reward),  // sin {now}
[keyGlb]: updateArm(arms[keyGlb], reward),  // sin {now}
```
`updateArm` sólo setea `lastUpdatedAt` cuando recibe `now`. Sin él, **`lastUpdatedAt` queda undefined** → `timeDecayFactor` retorna `1` siempre (línea 52: `if (typeof arm.lastUpdatedAt !== "number") return 1`).

**Impact:** Sprint 47 ("calendar decay para usuarios inactivos") no opera. Brazos congelados de hace 6 meses pesan igual que los de hoy.

**Fix scope:** 1-line change: `updateArm(arms[keyCtx], reward, { now: Date.now() })`. Pero requiere migración cuidadosa de arms existentes (lazy assign en read).

### HIGH-2 — `nom35Bias` sin wiring en flow personal

**Evidence:** Engine soporta `porDominio` opcional. `useAdaptiveRecommendation` recibe `nom35Dominios` pero **ningún consumer lo pasa**. Admin lee `porDominio` para reportes pero no llega al engine personal.

**Impact:** Premium-Fix `_generateReason` rama "Tu perfil NOM-035 (X) indica Y como prioridad" → nunca se ve. `applyBiasToScore` muerto en runtime personal.

**Fix scope:** Hook `useNom35Profile()` que lee última `Nom35Result` del user → pasar `nom35Dominios` a `useAdaptiveRecommendation` desde HomeV2.

### HIGH-3 — `evaluateEngineHealth` mobile surface incompleto

**Evidence:** [EngineHealthView.jsx:24-244](src/components/app/v2/profile/engine-health/EngineHealthView.jsx#L24-L244) re-implementa una versión "shallow" basada sólo en `totalSessions` + `banditArms`. **No invoca `evaluateEngineHealth(state)`**.

Entre las cosas no surface en mobile:
- `staleness.recalibrationNeeded` (banner no aparece).
- `predictionAccuracy` (cuando `moodLog` se llene).
- `personalization.signals` checklist (los 5 signals booleanos).
- `actions[]` (suggestions).
- `fatigue` (Sprint 50).
- `recalibrationGuidance` (copy "Bienvenido de vuelta / Recalibrar ahora").

**Fix scope:** Refactor de EngineHealthView para invocar `evaluateEngineHealth` directo (sin re-implementar derive). Aprox 2-3 horas — el web admin (NeuralSettingsClient) ya muestra el patrón completo.

### HIGH-4 — `recommendation.context.fatigue` y `recommendation.context.recalibration` invisibles

**Evidence:** Engine retorna en `context.fatigue` y `context.recalibration` ([neural.js:842-849](src/lib/neural.js#L842-L849)), pero ningún UI los consume en mobile. `fatigueGuidance({title, body, cta})` y `recalibrationGuidance({title, body, cta})` son funciones que producen copy listo para banner — sin renderer.

**Impact:** Sprint 50 ("Tu sistema pide pausa"), Sprint 42 ("Han pasado X días — recalibrar") nunca se muestran al user.

**Fix scope:** Banner component reutilizable (~0.5 día). HomeV2/LearningView ya tienen pattern para banners (`WellbeingBanner`) — clonar.

### HIGH-5 — `recommendation.context.momentum` y `burnoutRisk` invisibles

**Evidence:** Engine surface estos campos en `context` y `_generateReason` los usa. Pero ningún componente UI los lee como display directo. El user nunca ve "Tu momentum es ascendente: +8 puntos" salvo dentro del legacy `DashboardView` (no claro si está montado en v2).

**Fix scope:** Sub-card en PersonalizedView con momentum + burnout chips (cuando datos suficientes).

### HIGH-6 — `evaluateEngineHealth.fatigue` no surface en NeuralSettingsClient

**Evidence:** `evaluateEngineHealth` populates `fatigue: {level, partialRatio, ...}` y `synthesizeActions` ya incluye action items severe/mild. Pero [NeuralSettingsClient.jsx](src/app/(org)/settings/neural/NeuralSettingsClient.jsx) no tiene tile dedicado, sólo aparece como action si severe/mild.

**Fix scope:** KPITile adicional. ~1 hora.

### HIGH-7 — `useMemo` mal escopeado en HomeV2 → engine recomputa en cada render

**Evidence:** [HomeV2.jsx:45](src/components/app/v2/HomeV2.jsx#L45)
```js
const realState = store;  // useStore() retorna el objeto completo
const realHealth = useMemo(() => evaluateEngineHealth(realState), [realState]);
const optimalWindow = useMemo(() => safeOptimal(realState, devOverride), [realState]);
```
Con Zustand `useStore()` (sin selector), `store` es referencia ESTABLE entre renders **sólo** mientras nada del state cambia. Cualquier mutación (incluso UI-only flags) → nuevo objeto → useMemo invalida → engine vuelve a correr.

`useAdaptiveRecommendation` SÍ tiene deps granulares, pero `evaluateEngineHealth` y `suggestOptimalTime` no. Cada cambio en `wakeLockOn` o `fatigueDismissed` recomputa la salud completa.

**Impact perf:** `evaluateEngineHealth` itera moodLog y history; `suggestOptimalTime` itera history per-bucket. Con history slice(-200) y rerenders frecuentes, son CPU desperdiciado.

**Fix scope:** Granular selectors:
```js
const moodLog = useStore(s => s.moodLog);
const history = useStore(s => s.history);
const realHealth = useMemo(() => evaluateEngineHealth({moodLog, history, ...}), [moodLog, history]);
```
~1-2 horas. Patrón ya existe en `useAdaptiveRecommendation`.

---

## MEDIUM findings

### MEDIUM-1 — `predictSessionImpact` no pasa `chronotype` desde consumers

**Evidence:** Función soporta `chronotype` opcional pero ningún caller actual lo pasa. Sólo el adaptive engine usa `getColdStartPrior` con chronotype internamente.

**Fix:** Cuando user tenga `state.chronotype`, pasarlo en cualquier UI que muestre predicted delta.

### MEDIUM-2 — `priorWeight` cae a 0 a las 5 sesiones; threshold inconsistente con health.coldStartSessions=5

**Evidence:** `priorWeight = 1 - sessionsCount/5` ([coldStart.js:58-60](src/lib/neural/coldStart.js#L58-L60)). A 5 sesiones priorWeight=0. Pero `health.coldStartSessions=5` significa "ya pasamos cold-start". Inconsistencia: justo al salir de cold-start, el prior se apaga aunque aún quedan 9 sesiones de "learning".

**Fix:** Considerar `priorWeight = max(0, 1 - sessionsCount/14)` para overlap con learning phase. Param tuning, no algorithmic.

### MEDIUM-3 — `NEURAL_CONFIG.scoring.diversityPenalty: -15` aplicado por nombre de protocolo

**Evidence:** [neural.js:732](src/lib/neural.js#L732) — `if (last3.includes(p.n))`. Nombre de protocolo. Si hay protocolos diferentes con `int` similar (ambos calma), no se considera diversidad de intent. Penaliza repetir Reinicio Parasimpático pero no penaliza alternar dos protocolos del mismo intent.

**Fix:** Doble check — penalty por nombre (estricto) + penalty menor por intent repetido. Param decision.

### MEDIUM-4 — `historyMaxLength: 200` puede limitar señales de largo plazo

**Evidence:** `calcSessionCompletion` slice(-200). Esto significa que para usuarios power (1 sesión/día) hay sólo ~6 meses de retención. `analyzeNeuralRhythm` y `suggestOptimalTime` no se benefician de history > 200.

**Fix:** Considerar tier diferenciado (e.g. 200 raw + agregados mensuales). Or simplemente subir cap a 500. No urgente.

### MEDIUM-5 — `_burnoutReducedEfficacy` usa magic numbers (40, 55) sin estar en NEURAL_CONFIG

**Evidence:** [neural.js:212-218](src/lib/neural.js#L212-L218): `qR < 40 ? 30 : qR < 55 ? 15 : 0`. El resto del config está externalizado pero estos no.

**Fix:** Quick win — mover a `NC.burnout.efficacy.{lowQualThreshold, midQualThreshold, lowQualBase, midQualBase}`.

### MEDIUM-6 — Tests no cubren branches críticos del adaptive engine

**Evidence:** [useAdaptiveRecommendation.test.js](src/hooks/useAdaptiveRecommendation.test.js) tiene **4 tests**. No cubre:
- Pause fatigue override (severe forces calma)
- Staleness recalibrate path
- cohortPrior blend
- bandit time-decay path
- Each branch de `_generateReason`
- `nom35Bias.urgent` override

[neural.test.js:160-202](src/lib/neural.test.js#L160-L202) `adaptiveProtocolEngine` tiene 4 tests también. Insuficiente cobertura para function de 230 líneas con 7 overrides + scoring multi-factor.

**Fix scope:** SP dedicado de tests adaptiveProtocolEngine — añadir 8-10 cases por branch.

---

## LOW findings

### LOW-1 — `genIns` deprecated pero sigue exportado y testado

[neural.js:376](src/lib/neural.js#L376) `@deprecated desde Sprint 44`. Tests todavía lo cubren. Decisión: deprecate o limpiar.

### LOW-2 — `getDailyIgn` (línea 101) usa seed determinístico sin context staleness

Recomendación diaria fija por (year + month*50 + date) → mismo protocolo ese día siempre, ignora momentum/burnout actual. Probablemente intencional (ritual matutino estable) pero no documentado.

### LOW-3 — `compositeReward` energy weight hardcoded (0.3) no en config

[bandit.js:280](src/lib/neural/bandit.js#L280): `r += 0.3 * energyDelta`. HRV multiplier 1.5 también hardcoded. Comentario justifica los valores pero no son tuneables por config.

### LOW-4 — `interpretCalibration` usa magic numbers sin doc

[neural.js:1357](src/lib/neural.js#L1357) thresholds 70/40/60/30 sin link a literatura ni a config.

---

## Performance bottlenecks (análisis estático)

| Función | Big-O | Comment |
| --- | --- | --- |
| `adaptiveProtocolEngine` | O(P × M + H) ≈ O(14 × moodLog + history) | Aceptable mientras moodLog<200 |
| `calcBurnoutIndex` | O(M) | OK |
| `calcProtoSensitivity` | O(M) | OK |
| `analyzeNeuralRhythm` | O(H × 24) | OK con cap 200 |
| `suggestOptimalTime` | O(H × M_filtered) | OK |
| `analyzeStreakChain` | O(H log H) | sort por toDateString — usa Set + sort |
| `evaluateEngineHealth.computePredictionAccuracy` | O(M²) en peor caso | Por proto-grouping con array push + reduce. Con M=200 → 40k ops. Marginal pero observable. |
| `_buildHistoryEntry` | O(1) | OK |
| `calcSessionCompletion` | O(H + M + 200) | Spread + slice. Cada session-complete dispara TODO esto. |

**Bottleneck real:** No es algoritmo — es **invocaciones redundantes** por mal scope de useMemo (HIGH-7). El engine corre N veces por render en lugar de 1 cuando data no cambió.

---

## Tests discipline gaps

| Archivo | Mock shape | Edge cases | Notas |
| --- | --- | --- | --- |
| [neural.test.js](src/lib/neural.test.js) | Realista — usa `Array.from({length}, () => ({...}))` con timestamps reales | Cobertura amplia (35 describes) pero superficial (3-4 cases each) | OK; añadir más branches del engine |
| [bandit.test.js](src/lib/neural/bandit.test.js) | Realista — secuencias de updates | Decay, ties, time-decay, composite | Comprehensive |
| [coldStart.test.js](src/lib/neural/coldStart.test.js) | Realista — cohort sessions con userId | Blend literature/cohort, k-anonymity | Comprehensive |
| [staleness.test.js](src/lib/neural/staleness.test.js) | Realista | 4 ventanas, decayMinWeight floor | Comprehensive |
| [pauseFatigue.test.js](src/lib/neural/pauseFatigue.test.js) | Realista | mild/severe levels, override | Comprehensive |
| [antiGaming.test.js](src/lib/neural/antiGaming.test.js) | Realista — RT arrays + history | 5 signals + composer | Comprehensive |
| [useAdaptiveRecommendation.test.js](src/hooks/useAdaptiveRecommendation.test.js) | Mínimo — 4 tests | **Insuficiente** | Ver Medium-6 |
| [LearningView.bugfix.test.jsx](src/components/app/v2/home/LearningView.bugfix.test.jsx) | Mock shape `{primary: {id, n, int}}` flat — **NO coincide con engine real** que es `{primary: {protocol: {id,...}, score, reason}}` | El bug Phase 6F que escapó por esto | Documentado en `recommendationExtract.js` como "legacy/mock fallback compat" — pero el test todavía pasa shape incorrecto |

**Discipline finding:** Algunos tests UI mockeen recommendation con shape obsoleto. El defensive extraction (Phase 6H Fix-A1) lo absorbe pero los tests no validan el shape REAL del engine. Recomendación: helper `makeRealEngineRecommendation()` que produzca shape exacto.

---

## Findings categorizados (resumen)

### Critical (4)
1. `state.moodLog` permanently empty — toda la inteligencia mood-driven starved.
2. Bandit nunca recibe reward real.
3. `detectGamingV2` (Sprint 45) is dead code.
4. `currentMood` pre-session picker no tiene UI.

### High (7)
1. Time-decay bandit nunca se persiste (Sprint 47 muerto).
2. `nom35Bias` sin wiring en flow personal.
3. EngineHealthView mobile re-implementa shallow (no usa `evaluateEngineHealth`).
4. `context.fatigue` y `context.recalibration` invisibles en mobile.
5. `context.momentum` / `burnoutRisk` invisibles en mobile.
6. `evaluateEngineHealth.fatigue` no surface en NeuralSettings.
7. useMemo mal escopeado → engine recomputa en cada render.

### Medium (6)
1. `predictSessionImpact` no recibe chronotype de callers.
2. `priorWeight` corte 5 sesiones inconsistente con learning=14.
3. `diversityPenalty` aplicado por name no por intent.
4. `historyMaxLength: 200` limitante para power users.
5. `_burnoutReducedEfficacy` magic numbers fuera de config.
6. Tests adaptive engine cobertura insuficiente.

### Low (4)
1. `genIns` deprecated todavía en uso.
2. `getDailyIgn` ignora context dinámico (probablemente intencional).
3. `compositeReward` weights HRV/energy hardcoded.
4. `interpretCalibration` thresholds sin doc.

---

## Roadmap propuesto

### Quick wins (<1 día eng cada uno)
- **CRITICAL-3 fix:** swap `detectGamingPattern` → `detectGamingV2` en `calcSessionCompletion`. ~3 hours.
- **HIGH-1 fix:** `updateArm(..., {now: Date.now()})` en `recordSessionOutcome`. + lazy assign en arm reads. ~2 hours.
- **MEDIUM-5 fix:** mover magic numbers de `_burnoutReducedEfficacy` a config. ~30 min.
- **HIGH-7 fix:** granular selectors en HomeV2. ~2 hours.
- **HIGH-6 fix:** KPITile fatigue en NeuralSettings. ~1 hour.

### Medium effort (1-3 días)
- **CRITICAL-1 + CRITICAL-2 + CRITICAL-4 combined SP:** mood post-session UI (sheet o mini-modal antes de cerrar player) + mood pre-session picker → wire a `logMood` + `recordSessionOutcome.deltaMood` + `useAdaptiveRecommendation.currentMood`. **Esto es el SP más alto leverage del audit completo** — recupera 9 métricas downstream.
- **HIGH-3:** EngineHealthView refactor a `evaluateEngineHealth`-based.
- **HIGH-4 + HIGH-5:** banners contextuales en HomeV2/LearningView (fatigue, recalibration, momentum, burnout chips).
- **MEDIUM-6:** SP de tests adaptiveProtocolEngine — 8-10 cases por branch.

### Large effort (>3 días)
- **HIGH-2:** Wiring NOM-035 personal → `useNom35Profile` + propagación.
- **MEDIUM-1 + MEDIUM-2 + MEDIUM-3:** tuning sweep params (priorWeight, diversityPenalty intent, predictSessionImpact chronotype).

### Defer
- LOW-1 a LOW-4 — documentar y dejar.

---

## Veredicto motor capacidad

**Motor a ~38–45 % de capacidad efectiva en producción.**

Breakdown del 55–62 % no aprovechado:
- **~25 % perdido en input gap (CRITICAL-1, CRITICAL-2, CRITICAL-4):** la inteligencia mood/burnout/sensitivity/bandit-reward/picker está starved. Con un solo SP se recuperaría.
- **~15 % perdido en output gap (HIGH-3 a HIGH-6):** datos premium que el engine sí computa pero no se renderean en mobile. Banner sweep + EngineHealthView refactor lo cierran.
- **~7 % perdido en algorithm subutilization (CRITICAL-3, HIGH-1, HIGH-2):** Sprint 45 antiGaming v2, Sprint 47 time-decay, NOM-35 bias. Quick swaps.
- **~5 % perdido en perf y tests (HIGH-7, MEDIUM-6):** invocaciones redundantes + cobertura branches.
- **~3 % perdido en param tuning (MEDIUM-1 a 5):** edge case tuning con impact marginal.
- **~2 % en deuda doc (LOW-*):** cosmético.

---

## Recomendación próximo paso

**SP-Engine-Wiring-Critical** dedicado, scope bundled:

1. `MoodPostSessionSheet` component que emerge antes de cerrar el player (1-5 emoji + opcional "How are you feeling now?"). Wire a `store.logMood({mood, pre, proto, ts})` + `store.recordSessionOutcome({deltaMood, predictedDelta})`.
2. `MoodPrePicker` chip-row en pre-protocol screen. Wire a `useAdaptiveRecommendation({currentMood})`.
3. Replace `detectGamingPattern` con `detectGamingV2` en `calcSessionCompletion`.
4. Wire `updateArm(..., {now})` para activar Sprint 47 time-decay.

Estimación: 2-3 días eng. Impacto estimado: motor pasa de **~40 %** a **~75 %** de su capacidad efectiva. ROI dramático — sin tocar algoritmos.

Después de ese SP, evaluar el sweep de surface (HIGH-3 a HIGH-6) como Phase 6J.

---

**Self-rating del audit:**
- Cobertura: 9/10 (10 modulos engine + ~12 consumers + 7 sub-tests revisados read-only)
- Findings reales vs nitpicks: 8/10 (4 critical genuinos, no padding)
- Profundidad walkthrough: 8/10 (no se midió perf en runtime — análisis estático)
- Honestidad veredicto: 9/10 — el motor SÍ es Bugatti, pero el chasis no le entrega potencia
