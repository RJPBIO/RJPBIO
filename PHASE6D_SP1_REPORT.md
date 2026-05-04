# PHASE 6D SP1 — NEURALCALIBRATION → STORE WIRING + COLDSTART CONSISTENCY

**Fecha:** 2026-05-04
**Sub-prompt:** 1 / 8 de Phase 6D
**Modo:** Wiring disciplinado + consistency check (risk: bajo según reconnaissance)
**Tests:** 3553 / 3553 passing (+50 nuevos vs baseline 3503)
**Capturas:** 6 / 6 en `screenshots/phase6d-sp1-wiring/`

---

## Resumen ejecutivo

Cierra la cadena de bugs **Critical Bug-03 → Bug-04 → Bug-09 + High Bug-15/Bug-23/Bug-40** identificada en el reconnaissance. La causa raíz era que `NeuralCalibrationV2.handleAdvance` solo persistía un blob `neuralBaseline` pero NO llamaba a las acciones canónicas del store (`logInstrument` por instrumento, `setChronotype` para rMEQ). Los selectores de `ColdStartView` chequeaban `state.instruments[].instrumentId === 'pss-4'` y `state.chronotype !== null` que siempre retornaban falsos → cards "Calibra cronotipo" y "PSS-4" persistían inmediato post-onboarding aunque el usuario los acababa de completar.

**Ahora**, post-onboarding:
- `state.instruments` contiene 2 entries (`pss-4`, `maia-2`) con shape canónico (`{ instrumentId, score, level, ts, source: 'onboarding' }` + `dimensions` para MAIA-2).
- `state.chronotype` contiene record canónico `{ type, category, label, score, bestTimeWindow, ts }` que satisface a TODOS los consumers existentes (`prescriber.js` usa `.type`, `ProfileView` usa `.label/.score`, `useAdaptiveRecommendation` usa truthy check, `coachMemory` usa truthy check, ColdStart Phase 6D usa truthy check).
- `state.hrvLog` solo se actualiza si el user efectivamente midió HRV (no si saltó).

**ColdStartView** filtra dinámicamente sus 4 cards según el state. **Card "Tu primera sesión"** ahora deriva su label desde `firstIntent` (calma → Reinicio Parasimpático, energia → Pulse Shift, etc.) en lugar de hardcodear "Pulse Shift". **Card "Cronotipo"** cita el instrumento real (rMEQ · 5 ítems · Adan & Almirall 1991) en lugar del incorrecto MEQ-SA · 19 preguntas.

**CalibrationView** lee `state.chronotype` directo (Phase 6D) con fallback a `neuralBaseline.rmeq` legacy → un retake desde Profile o ColdStart se refleja inmediato en el card.

**Retake-chronotype** ahora funciona: handler en AppV2Root mountea InstrumentRunner con `RMEQ + scoreRmeq` (definiciones nuevas en `lib/instruments.js`); el runner extendido para soportar opciones per-item (rMEQ tiene scores no-Likert por pregunta) preserva el spread de `result` para que `chronotype/bestTimeWindow` lleguen al consumer; AppV2Root detecta `instrumentId === 'rmeq'` y dispara `setChronotype` además del `logInstrument` estándar.

**Quick wins integrados:** Bug-44 (focus style sutil en "Saltar introducción") y Bug-22 (paddingInlineEnd en AnnouncementBar para no solapar con close button en mobile).

---

## Archivos modificados / creados

| Archivo | Status | LoC | Propósito |
|---|---|---|---|
| `src/lib/first-protocol.js` | NEW | 44 | Mapa intent → primer protocolo + helper, compartido entre AppV2Root y ColdStartView. |
| `src/lib/first-protocol.test.js` | NEW | 81 | 11 tests: mapping correcto, default Reinicio Parasimpático, helper `firstProtocolForIntent`. |
| `src/lib/instruments.js` | MOD | +144 | Agrega `RMEQ` definition (5 ítems con options custom per-item), `scoreRmeq()`, `chronotypeLabel()`, `buildChronotypeRecord()`. |
| `src/lib/instruments.test.js` | MOD | +117 | 13 tests nuevos: rMEQ structure, scoring por categoría, chronotypeLabel mapping, buildChronotypeRecord shape. |
| `src/components/onboarding/v2/NeuralCalibrationV2.jsx` | MOD | +62 | `handleAdvance` final ahora llama `logInstrument(pss-4)`, `logInstrument(maia-2)`, `setChronotype(record)` además del `setNeuralBaseline(baseline)` existente. |
| `src/components/onboarding/v2/NeuralCalibrationV2.test.jsx` | MOD | +135 | 6 tests Phase 6D SP1: cada wiring action verificado independientemente, orden con onComplete preservado, state final del store correcto. |
| `src/components/app/v2/home/ColdStartView.jsx` | MOD | +136 / -39 | Refactor completo: selectores granulares al store, función pura `buildActions()` (exportada para test), filtrado dinámico de cards, label de "Tu primera sesión" derivado del firstIntent. |
| `src/components/app/v2/home/ColdStartView.test.jsx` | NEW | 160 | 19 tests: filtrado por chronotype/instruments/hrvLog/totalSessions, label derivation por intent, copy rMEQ correcto, actions canónicas, defensivo. |
| `src/components/app/v2/AppV2Root.jsx` | MOD | +60 / -10 | Importa `FIRST_PROTOCOL_BY_INTENT` desde módulo compartido (eliminado local), agrega handler `retake-chronotype` y alias `first-session`, `handleInstrumentComplete` con branch RMEQ → setChronotype. |
| `src/components/app/v2/AppV2Root.test.jsx` | MOD | +15 / -3 | beforeEach extendido con reset de `instruments/hrvLog/chronotype/totalSessions` para evitar leak entre tests. |
| `src/components/app/v2/profile/calibration/CalibrationView.jsx` | MOD | +45 / -16 | Lee `state.chronotype` (record fresh tras retake) con fallback a `neuralBaseline.rmeq` legacy. Última calibración via `instruments[].ts`. CTA action `retake-chronotype` (era `retest-chronotype` que caía en console.log). |
| `src/components/InstrumentRunner.jsx` | MOD | +37 / -8 | `getRenderOptions()` honra `item.options` cuando presentes (rMEQ tiene scores per-item); `pick(value)` recibe valor directo en lugar de índice. `save()` spread `...result` para preservar campos extra (chronotype, bestTimeWindow). |
| `src/components/onboarding/v2/BioIgnitionWelcomeV2.jsx` | MOD | +15 | Bug-44: focus style custom sutil (1px dashed con opacidad del texto) en "Saltar introducción" en lugar de browser default cyan. |
| `src/components/AnnouncementBar.jsx` | MOD | +6 / -1 | Bug-22: `paddingInlineEnd: 36` en text span para reservar espacio del close button absolutamente posicionado, evitando wrap del texto detrás del botón en mobile. |

**Totales:**
- Source: 8 modificados + 2 nuevos = 10 archivos source, ~590 LoC neto.
- Tests: 3 modificados + 2 nuevos = 5 archivos test, ~318 LoC.
- **Total: ~908 LoC añadidos / 76 borrados** vs estimación sub-prompt 200-300 LoC. La diferencia se explica por: (a) tests exhaustivos (50 nuevos casos), (b) extensión defensiva de InstrumentRunner para soportar el patrón rMEQ que no estaba contemplado en SP2.

---

## Bugs cerrados

| Bug | Severidad | Status | Evidencia |
|---|---|---|---|
| Bug-03 | Critical | ✅ CERRADO | Captura 6 — state.instruments contiene 2 entries (pss-4, maia-2) + state.chronotype set correctamente tras onboarding completo. Verificado por test `estado del store post-wiring: instruments tiene 2 entries, chronotype set`. |
| Bug-04 | Critical | ✅ CERRADO | Captura 2 — post-onboarding intent calma con instruments+chronotype set, ColdStart muestra solo "Tu primera sesión" + "Mide HRV"; cards "Cronotipo" y "PSS-4" desaparecidas. Verificado por 5 tests `oculta card X cuando state Y`. |
| Bug-09 | Critical | ✅ CERRADO | Captura 2 (calma → Reinicio Parasimpático) + Captura 3 (energia → Pulse Shift). Verificado por 5 tests `intent X → label correcto`. Default es Reinicio Parasimpático (más universal) en lugar de Pulse Shift. |
| Bug-15 | High | ✅ CERRADO | Captura 1 — card "Calibra tu cronotipo · rMEQ · 5 ítems · Adan & Almirall 1991". Verificado por test `card cronotipo cita rMEQ ... NO MEQ-SA / 19 preguntas`. |
| Bug-23 | High | ✅ CERRADO | Captura 4 — CalibrationView muestra "Más matutino · score 19 · Última calibración: hace 8m" leído de `state.chronotype` directo. Captura 5+6 muestran retake actualizando `state.chronotype` inmediato. |
| Bug-40 | High | ✅ CERRADO | Consecuencia de Bug-15 — el badge en NeuralCalibrationV2 (`rMEQ · Adan & Almirall 1991 · 5 ítems`) y el label de ColdStart ahora son consistentes. |
| Bug-44 | Low | ✅ CERRADO | `BioIgnitionWelcomeV2.jsx:236-262` — focus style custom 1px dashed con opacidad del texto en lugar de browser default cyan que competía con accent del CTA. |
| Bug-22 | High | ✅ CERRADO | `AnnouncementBar.jsx:90` — `paddingInlineEnd: 36` reserva espacio para close button absolutamente posicionado, evitando wrap del texto detrás del botón en mobile (≤480px). |
| Bug-46 | Low | 🚫 SKIPPED | Decisión: keep current copy. "Coach. Aquí cuando me necesites." es directo y B2B profesional. Cambio no es claramente mejora. |

**Total: 8 / 9 bugs target cerrados (Bug-46 declarado como decisión de no-cambio).**

---

## Hipótesis arquitecturales validadas

**H1 — Wiring incompleto a slots canónicos era la causa raíz.** Confirmado: añadir 3 llamadas (`logInstrument` x2 + `setChronotype` x1) en `handleAdvance` final desbloqueó el comportamiento esperado de ColdStart sin tocar el modelo de datos. El blob `neuralBaseline` se mantiene como espacio rico para data extra (recommendations, profileLabel, etc.) pero ya no es la única fuente.

**H2 — Shape compatibility con consumers existentes (`prescriber.js .type`, `ProfileView .label`).** Confirmado: `buildChronotypeRecord` produce el record con TODOS los aliases en lugar de elegir un solo shape. Cero refactors invasivos a consumers — todos siguen funcionando con sus contratos previos.

**H3 — InstrumentRunner extensible para per-item options.** Confirmado: extensión mínima (~17 LoC) — `getRenderOptions(instrument, item)` honra `item.options` cuando existen y cae a `instrument.scale + offset` si no. PSS-4/SWEMWBS-7/PHQ-2 (uniform Likert) no requieren cambios; rMEQ (per-item custom) ahora funciona. Sin tocar la duplicación PSS-4 (Bug-06, scope SP2).

**H4 — Action name canónico Phase 6D + alias backward-compat.** Confirmado: `first-session` (canónico) + `start-pulse-shift` (legacy alias) + `id:"primera"` (legacy id-based) los 3 funcionan. ColdStart usa `first-session`. Tests legacy no rotos.

---

## E2E verification (capturas en `screenshots/phase6d-sp1-wiring/`)

1. **`p6d-sp1-01-coldstart-pre-onboarding.png`** — User totalmente nuevo (firstIntent=null, chronotype=null, instruments=[]). Las 4 cards visibles. "Tu primera sesión · **Reinicio Parasimpático** · 120s" (default sin intent). "Calibra tu cronotipo · **rMEQ · 5 ítems · Adan & Almirall 1991**".

2. **`p6d-sp1-02-coldstart-post-onboarding-calma.png`** — Post-onboarding intent calma con state.chronotype + state.instruments[pss-4, maia-2] populated. Solo 2 cards visibles: "Tu primera sesión · **Reinicio Parasimpático** · 120s" + "Mide tu variabilidad cardíaca". Cards Cronotipo y PSS-4 correctamente OCULTAS.

3. **`p6d-sp1-03-coldstart-post-onboarding-energia.png`** — Mismo escenario pero firstIntent=energia. "Tu primera sesión · **Pulse Shift** · 120s · sin protocolo previo necesario". Demuestra que el label cambia con el intent.

4. **`p6d-sp1-04-calibration-view-with-chronotype.png`** — CalibrationView leyendo state.chronotype: "Más matutino · score 19 · Última calibración: hace 8m" + Re-test button. Resonancia y HRV en empty state correcto.

5. **`p6d-sp1-05-rmeq-instrument-runner.png`** — Tap "Re-test" mountea InstrumentRunner con RMEQ. Header "EVALUACIÓN VALIDADA · ADAN & ALMIRALL 1991". Title "Cuestionario reducido de matutinidad-vespertinidad". Q1 muestra las 5 opciones custom (Antes de 6:30 / 6:30—7:45 / 7:45—9:45 / 9:45—11:00 / Después de 11:00) — el runner extendido respeta `item.options`.

6. **`p6d-sp1-06-store-state-debug.png`** — Overlay con JSON del store post-retake. `state.chronotype = { type, category, label: "Intermedio", score: 12, bestTimeWindow: "midday", ts }`. `state.instruments` = 2 entries rmeq (la mock inicial + la real del retake con `answers, score, chronotype, bestTimeWindow, level, max, min`). Evidencia técnica del wiring completo.

---

## Tests (50 nuevos vs baseline)

**Distribución:**
- `instruments.test.js` (+13): RMEQ structure (2), scoreRmeq por categoría (6), chronotypeLabel (2), buildChronotypeRecord (3).
- `first-protocol.test.js` (+11): mapping intents (5), default validation (1), catalog integrity (1), helper (3), edge cases (1).
- `ColdStartView.test.jsx` (+19): filtrado dinámico (7), label derivation (5), copy rMEQ correcto (1), actions canónicas (4), defensivo (3).
- `NeuralCalibrationV2.test.jsx` (+6): logInstrument pss-4, logInstrument maia-2, setChronotype shape, hrvLog NO actualizado si skip, onComplete después del wiring, estado final del store.
- `AppV2Root.test.jsx` (+1 inline en beforeEach): reset de slots SP1.

**Build verde:** `Test Files 147 passed (147) · Tests 3553 passed (3553) · Duration 45.47s`.

---

## Self-rating

- **Wiring correctness:** 9.5/10 — verificado a 4 niveles (test directo, store state, UI consequence, E2E full flow). Único punto -0.5: el InstrumentRunner summary tras rMEQ muestra "intermediate" raw en lugar de "Intermedio" porque el `levelTone()` map no contempla rMEQ — cosmético, no afecta el wiring; vivo en SP2 cuando se haga la limpieza de duplicación.

- **Coverage de tests:** 9/10 — 50 tests cubren todos los nuevos paths (scoring, selectors, wiring, derivation). El único hueco: el handler `retake-chronotype` en AppV2Root no tiene test integration directo — confirmado manualmente vía Playwright (Captura 5). SP6 cleanup podría añadir cobertura.

- **Backward compatibility:** 10/10 — `start-pulse-shift` y `id:"primera"` siguen funcionando. `state.chronotype` shape acepta legacy y nuevo via aliases. CalibrationView con fallback a `neuralBaseline.rmeq` para users con onboarding pre-SP1 que no han recalibrado.

- **Risk de regresión:** Bajo — cambios localizados en 5 archivos source críticos + extensión defensiva de InstrumentRunner. Test suite previo intacto (3503 → 3553 sin breaks).

- **Documentación inline:** 9/10 — comments con "Phase 6D SP1" en cada cambio explicando el por qué (no el qué). El "por qué" referencia el bug específico cuando aplica (e.g. Bug-15 fix en ColdStartView).

**Self-rating global SP1: 9.4/10.**

---

## Issues / blockers para SP2-SP8

**Ninguno bloqueador.** Notas para próximos sub-prompts:

1. **SP2 (eliminación duplicación PSS-4):** la extensión `getRenderOptions` que añadí a InstrumentRunner facilita SP2 — el path canónico podría usar este patrón para todos los instrumentos. La definición `RMEQ` que añadí a `lib/instruments.js` también es referencia del shape canónico. El "Profile retake PSS-4 que cita Cohen & Williamson 1988 con escala diferente" ahora puede consolidarse con la versión `Cohen 1983` del onboarding NeuralCalibrationV2.

2. **SP3 (fixtures cleanup en DataV2/ProfileV2):** SP1 no toca fixtures. Mismo patrón aplicable: cuando los fixtures se eliminen, los selectores granulares al store que usé en ColdStartView pueden servir de plantilla.

3. **Bug-11 (sub-section navigation Profile rota):** sigue presente. Mi cambio en CalibrationView usa `retake-chronotype` action (handled) en lugar de `target:/app/profile/...` (Bug-11 territory). SP4 abordará el navigation real.

4. **InstrumentRunner cosmético:** summary muestra category raw ("intermediate") sin label friendly. Decisión SP2 si el InstrumentRunner se canoniza y este se reescribe, o si se parchea solo.

5. **Migration v17 NO necesaria:** Verifiqué que `chronotype: null` ya estaba en DS desde v7. El cambio de shape (string legacy → objeto rico) es backward-compatible: el record contiene `.type` que satisface el contrato existente, y los nuevos consumers usan `.category`.

6. **Persist allowlist:** `saveState` guarda whole state sin allowlist (Bug-37 reconnaissance). Por suerte, `chronotype` ya estaba en DS y persiste correctamente. SP6 puede abordar el allowlist explícito.

---

## Cierre

- ✅ Bugs 03, 04, 09, 15, 23, 40, 22, 44 cerrados con evidencia (test + E2E).
- ✅ Bug-46 declarado decisión de no-cambio.
- ✅ 3553/3553 tests passing (+50 vs baseline 3503).
- ✅ 6 / 6 capturas en `screenshots/phase6d-sp1-wiring/`.
- ✅ 0 commits creados (sub-prompt prohibición respetada).
- ✅ 0 modificaciones a backend, coachSafety, primitivas Phase 4/5, useProtocolPlayer, audio.js, schema Prisma, system prompt, ni a las áreas reservadas para SP2-SP8.
- ✅ Cero deuda técnica nueva no documentada (todas las decisiones explicadas en código y reporte).

Phase 6D SP1 listo para handoff a SP2 (PSS-4 duplication cleanup).
