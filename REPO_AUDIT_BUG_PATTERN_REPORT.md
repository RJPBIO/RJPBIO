# REPO AUDIT — PATTERN BUG-48/A1 PROACTIVE SEARCH

**Fecha:** 2026-05-07
**Modo:** Read-only diagnostic. Cero modificaciones de código source ni tests existing.
**Scope:** Phase 6D + 6E + 6F + 6G + 6H Fix1+2+3+4 + Fix-A1 validated stack
**Inventario auditado:** 25 hooks + 30+ engines/lib helpers + 25+ server endpoints + 50+ UI consumers

---

## Resumen ejecutivo

**Total findings: 8** (Critical 0 · **High 4** · Medium 3 · Low 1)

**Disciplina del producto post-Fix-A1:** **Sólida pero con gaps premium específicos.** Los hooks principales (`useActiveProgram`, `useReadiness`, `useExecutiveReport`, `useWellbeingTrends`, `useCoachQuota`) tienen consumers correctos sin pattern A1 residual. Engine outputs ricos (`assessBurnoutEnhanced.metrics`, `buildExecutiveReport.kpis`, `useReadiness.partial`) atraviesan el UI cuando hay panel/component que los renderee. **El gap principal NO es extraction wrong sino "engine compute work nadie surface"**: 4 engines/endpoints producen rich data que ningún consumer del UI consume. Bug-48-style transitions también tienen gaps en program completion + instrument retake feedback + streak milestones.

**Pre Fix-A1 fix de bug latente no provocó regresión adicional** — el patrón único era el `recommendation.primary.id` mal-extraído. NO se descubrieron OTROS callers buggy similar en otros hooks (useActiveProgram, useReadiness, useExecutiveReport, useWellbeingTrends consumers todos correctos).

**Veredicto recomendación próximo paso**: 4 findings HIGH son **premium gaps no regresiones** — no requieren SP-Fix-A2 prioritario. Proceder a re-corrida 90 días contra production build, luego implementar HIGH findings en Phase 6I+ basado en re-corrida findings.

---

## Findings por pattern

### Pattern A1 (extraction path wrong)

**Engines auditados (8 hooks/engines + sus consumers):**

| Hook/Engine | Output shape | Consumers | Pattern A1 |
|---|---|---|---|
| `useAdaptiveRecommendation` | `{primary: {protocol, score, reason}, alternatives, need, context}` | HomeV2, AppV2Root, ColdStartView, LearningView | ✅ Cerrado (Fix-A1 helper) |
| `useReadiness` | `{score, partial, source, reason, eligibleForFallback, components, ...}` | HomeV2, HeroComposite | ✅ Sin pattern (consumers usan shape correcto, defensive `?.`) |
| `useActiveProgram` | `{id, programId, todayStatus, lagStatus, progress, reEval, source, ...}` | LearningView, ProgramActiveCard, ProgramTimeline, ProgramReEvalPrompt | ✅ Sin pattern (4 consumers, shape consistente) |
| `useExecutiveReport` | `{org, kpis, nom35, instruments, hrv, sessions, topProtocols, programs, engagement, correlation, snapshot}` | OrgExecutiveReport + 6 admin panels | ✅ Sin pattern (KpiHero, ProgramsCohortPanel, CorrelationPanel verifican shape correcto) |
| `useWellbeingTrends` | `{assessment: {level, signals, metrics, n, insufficient, snapshot}, copy, period}` | WellbeingBanner, WellbeingAlertDrawer, WellbeingSignalsList | ✅ Sin pattern (rich metrics correctly surfaced) |
| `useCoachQuota` | `{used, max, plan, reset, ...}` | CoachV2, QuotaExceededBanner | ✅ Sin pattern |
| `useCohortPrior` | `cohortPrior \| null` | useAdaptiveRecommendation (passthrough) | ✅ N/A |
| `useProtocolPlayer` | rich state object | ProtocolPlayer (single consumer) | ✅ N/A (single canonical caller) |

**Findings:** **0** issues residuales pattern A1. Único caso (recommendation extraction) cerrado por Fix-A1 helper centralizado.

---

### Pattern Bug-48 (transitions invisible)

**Surfaces auditadas:**

| Transition | UI Feedback | Status |
|---|---|---|
| Cohort cold-start→learning (N=5) | CohortCelebrationSheet (Fix3) | ✅ |
| Cohort learning→personalized (N=14) | CohortCelebrationSheet (Fix3) | ✅ |
| Program reeval mid-program | ProgramReEvalPrompt + auto-modal después de 3d overdue | ✅ |
| Burnout level transitions (ok→warn→alert) | WellbeingBanner persistent + cron `burnout-scan.js` push notification | ✅ |
| Coach quota exceeded | QuotaExceededBanner | ✅ |
| ColdStart phase fresh→active (Fix2) | ProgressBar + MiniStatsRow + reco persistent | ✅ |
| **Program completion (Day 28 Burnout Recovery, etc.)** | **❌ NINGUNA** | **🔴 H-1 (HIGH)** |
| **Instrument retake completion (PSS-4 / rMEQ / MAIA-2 desde profile)** | **❌ Modal cierra silenciosamente, sin toast/snackbar** | **🟡 M-1 (MEDIUM)** |
| **Streak milestones (7/14/30 días — config existe)** | **❌ NADIE consume `coaching.streakMilestones`** | **🔴 H-2 (HIGH)** |

**Findings:**

#### 🔴 **H-1 — Program completion sin celebration**
- **Evidencia:** `src/components/app/v2/program/ProgramActiveCard.jsx` maneja `completedToday` + `RestDayBlock` pero NO hay component `ProgramCompleted*` ni handler para "todas las sesiones del programa hechas". Cuando user completa Day 28 de "Burnout Recovery 28d", la UI simplemente NO marca el achievement.
- **Compare:** Fix3 implementó `CohortCelebrationSheet` para cohort transitions. Mismo pattern aplica para program completion.
- **Severidad:** HIGH (premium gap análogo a H-4 pre-Fix3 — switch silencioso post-investment de 28 días del user).
- **Fix scope:** Componente nuevo `<ProgramCompletionSheet />` análogo a CohortCelebrationSheet, mounted cuando `activeProgram.progress.completed === activeProgram.progress.total` y `programCompletionCelebrationDoneAt` no set en store.

#### 🔴 **H-2 — Streak milestones invisibles**
- **Evidencia:** `src/lib/neural/config.js:199` `coaching.streakMilestones: FREEZE([7, 14, 30])`. `grep streakMilestones src/` retorna solo el define — NO consumer.
- **Cause:** Config declara intención pero nadie connectado al state.streak para detectar cross.
- **Severidad:** HIGH (premium gap — Streaks/Calm/Headspace celebran 7-day streak agresivamente).
- **Fix scope:** Detection en `completeSession` (similar a Fix3 cohort cross) + setter `markStreakMilestoneShown(milestone)` + `<StreakMilestoneSheet />` análogo.

#### 🟡 **M-1 — Instrument retake completion silenciosa**
- **Evidencia:** `AppV2Root.handleInstrumentComplete` (líneas 712-740) hace `useStore.getState().logInstrument(entry)` + actualiza `chronotype` si `rmeq`, pero el modal cierra sin confirmation visual.
- **Cause:** Pattern Bug-48 menor — UX expectation: "PSS-4 actualizado · Tu lectura clínica refleja el cambio".
- **Severidad:** MEDIUM (improvement opportunity).
- **Fix scope:** Toast/snackbar 3-4s post-onComplete.

---

### Engine outputs invisible

#### 🔴 **H-3 — `recommendation.alternatives` no surface**
- **Evidencia:** `src/lib/neural.js:816` `alternatives: scored.slice(1, 3)` produce top-2 alternatives. `grep recommendation\.alternatives src/components` retorna 0 matches.
- **Cause:** Engine compute work pero ningún component v2 expone "¿Otras opciones?" expansion.
- **Severidad:** HIGH (premium pattern — Headspace muestra "Try another exercise" alternatives card; Calm "More like this").
- **Fix scope:** Card "Alternativas" colapsable bajo recommendation card en LearningView/PersonalizedView. ~80 LoC.

#### 🔴 **H-4 — `engagement` panel ausente del executive report**
- **Evidencia:** `src/server/executiveReport.js:235` `engagement` (sessionsLast7d, sessionsLast30d, activeUsersLast7d, wauUsers, activationRate) computed. `grep engagement src/components/admin/reports` retorna 0 panel.
- **Cause:** OrgExecutiveReport monta KpiHero, Nom35, Hrv, Programs, Correlation, TopProtocols pero NO `EngagementPanel`.
- **Severidad:** HIGH (premium B2B gap — DAU/WAU/activation rate son CORE metrics para HR/people analytics; sin panel el report está incompleto).
- **Fix scope:** Componente `EngagementPanel.jsx` análogo a otros reports panels.

#### 🟡 **M-2 — `recommendation.context` rich pero no surface**
- **Evidencia:** Engine retorna `context: {circadian, burnoutRisk, lastMood, momentum, momentumDir, chronotype, subjectiveHour, timeBucket, nom35Bias, readiness, staleness}`. v2 shell consume solo `primary.protocol` + `primary.reason` en LearningView/PersonalizedView. Legacy NeuralCoach.jsx (Phase 4) sí lo usa pero no es v2 shell.
- **Cause:** Engine introspection debugging — útil para Coach explanations, no necesariamente exposable directamente al user.
- **Severidad:** MEDIUM (premium gap menor — Coach LLM podría usar context for richer answers).
- **Fix scope:** Coach LLM systemPrompt enrichment con `recommendation.context` cuando user pregunta "¿por qué este protocolo?". ~30 LoC en coach-prompts.js.

#### 🟡 **M-3 — `staleness` invisible al user**
- **Evidencia:** `evaluateEngineHealth` retorna `staleness: {days, status}` y `recalibrationNeeded`. `engine.context.staleness: {level, daysSinceLast, dataConfidence, recalibrate}`. `grep staleness src/components` retorna 0 matches en consumers UI.
- **Cause:** Engine internamente reduce confidence cuando data stale (>7d), pero user NUNCA ve "Datos antiguos · tu trayectoria puede haber driftado · recalibremos".
- **Severidad:** MEDIUM (premium pattern — Whoop muestra "Strain estimate may be inaccurate due to inactive period").
- **Fix scope:** Banner WellbeingBanner-style cuando `engine.staleness.status === "stale"` o `recalibrate !== false`. ~40 LoC.

#### 🟢 **L-1 — `/api/v1/me/neural-health` endpoint exists, EngineHealthView no lo usa**
- **Evidencia:** Endpoint creado, EngineHealthView.jsx deriva `eh` localmente desde store + comment honest "hasta SP6 hay un endpoint server real, mostramos placeholders honestos".
- **Cause:** Phase 6D SP6 deferred — documented gap, NOT regresión.
- **Severidad:** LOW (deferred + honest UI, no premium gap activo).
- **Fix scope:** Wire EngineHealthView a `/api/v1/me/neural-health` fetch — ~50 LoC.

---

### Test discipline

#### Tests con shape WRONG (3 mocks)

`src/components/app/v2/home/ColdStartView.test.jsx:383, 494, 551` — Premium-Fix2 tests escritos con mock shape `{primary: {id, n, int}}` (flat, sin `protocol` wrapper).

**Estado actual:** Tests siguen pasando gracias al helper Fix-A1 defensive chain (`primary.protocol?.id ?? primary.id`). NO regresión activa.

**Risk futuro:** Si helper se simplifica eliminando legacy fallback, esos tests fallarían silenciosamente porque mockean shape no realista. Pueden ocultar bugs si engine shape cambia.

**Recomendación:** Update mocks a shape REAL (`{primary: {protocol: {id, n, int}, score, reason}}`) en Phase 6I+. Actualmente protegidos por "NO modifico tests anti-regresión Premium-Fix1+2+3+4" — defer.

#### Tests con engine sample real (positive disciplina)

- `src/lib/neural.test.js:177-179` — `expect(r.primary).toHaveProperty("protocol")` + `expect(r.primary.protocol).toHaveProperty("id")` — REAL shape ✓
- `src/server/executiveReport.test.js:170-193` — verifica `r.kpis`, `r.nom35`, `r.instruments`, `r.hrv`, `r.programs`, `r.engagement`, `r.correlation`, `r.snapshot.kAnonThreshold` — REAL shape ✓
- `src/lib/recommendationExtract.test.js` — explicitly tests engine real shape vs legacy mock para defensive chain ✓
- `src/components/app/v2/home/LearningView.fix-a1.test.jsx` — integration con engine real shape ✓

**Recomendación standardization:** Crear `src/lib/__fixtures__/engineSamples.js` con sample outputs REALES de cada engine (`buildExecutiveReport`, `assessBurnoutEnhanced`, `useAdaptiveRecommendation`) para reuso en tests. Phase 6I+.

---

## Findings categorizados

### Critical (rompe premium experience)
*(ninguno detectado)*

### High (notable degradation / premium gap visible)

| ID | Finding | Surface | Fix scope |
|---|---|---|---|
| H-1 | Program completion sin celebration | UI v2 home | `<ProgramCompletionSheet />` análogo CohortCelebrationSheet |
| H-2 | Streak milestones invisibles | Store + UI v2 | Detection + setter + `<StreakMilestoneSheet />` |
| H-3 | `recommendation.alternatives` no surface | UI v2 LearningView/PersonalizedView | Card "Alternativas" colapsable |
| H-4 | `engagement` panel ausente executive report | Admin reports | `EngagementPanel.jsx` |

### Medium (improvement opportunity)

| ID | Finding | Surface | Fix scope |
|---|---|---|---|
| M-1 | Instrument retake silent | UI v2 AppV2Root | Toast post-onComplete |
| M-2 | `recommendation.context` no surface | Coach LLM | systemPrompt enrichment |
| M-3 | `staleness` invisible al user | UI v2 home | Staleness banner |

### Low (nitpick / deferred)

| ID | Finding | Surface | Fix scope |
|---|---|---|---|
| L-1 | EngineHealthView no usa endpoint real | UI v2 profile | Wire endpoint fetch |

---

## Roadmap

### Quick wins (< 1 día eng)
- **M-1** — Toast post-instrument-complete (~30 LoC). Reuso de pattern existente Toast.jsx.
- **M-3** — Staleness banner (~40 LoC). Reuso WellbeingBanner pattern.

### Medium effort (1-3 días)
- **H-3** — Alternatives card colapsable (~80 LoC source + 30 LoC tests).
- **H-4** — EngagementPanel admin report (~100 LoC source + 40 LoC tests).
- **L-1** — Wire EngineHealthView endpoint (~50 LoC source + 20 LoC tests).
- **Test discipline** — Update 3 ColdStartView Fix2 tests a shape REAL (defer per prohibition).

### Large effort (>3 días)
- **H-1** — Program completion celebration (~200 LoC: store extension `programCompletionCelebrationDoneAt` + sheet component + completion detection en program adherence flow + tests).
- **H-2** — Streak milestones celebration (~200 LoC similar a H-1: store extension `streakMilestoneDoneAt` + sheet + detection en `completeSession` + tests).

### Defer Phase 6I+
- **M-2** — Coach LLM systemPrompt enrichment (depends on coach LLM evolution path).
- Standardization fixtures `__fixtures__/engineSamples.js`.

---

## Recomendación próximo paso

**Crítica de findings:**
- 0 Critical → producto sin regresión activa.
- 4 HIGH son premium gaps (no regresiones): H-1/H-2 (celebrations missing) + H-3/H-4 (engine outputs invisibles). Ninguno bloquea uso del producto, todos son features premium pendientes que apps competencia ya cubren.
- 3 MEDIUM son mejoras incrementales menores.
- 1 LOW es deferred documented honest gap.

**Acción recomendada: PROCEDER A RE-CORRIDA 90 DÍAS contra production build.**

Razones:
1. **Cero Critical findings** — el stack Premium-Fix1+2+3+4 + Fix-A1 está sólido para validation E2E real.
2. **Pattern A1 propagation NO existe** — el bug latente de extraction era único caso. Otros engines/hooks tienen consumers correctos.
3. **HIGH findings son premium gaps**, no defects — re-corrida 90 días los CONFIRMARÁ como premium opportunities (no regressions) y dará evidencia visual para priorización.
4. **Re-corrida en production build** elimina overlay Next.js DevTools + flakiness HMR (issues conocidos Fix2 A4) + da PAH score real sin contamination.

**Post re-corrida 90 días en production build:**
- Si emerge regression real → SP-Fix-A2 prioritario.
- Si confirma premium gaps H-1/H-2/H-3/H-4 → Phase 6I sprint con priority HIGH.
- Si PAH score ≥9.0/10 → producto validated para B2B sales push.

**NO requerido SP-Fix-A2 antes de re-corrida** — el audit confirmó que los 4 findings HIGH son premium gaps trabajables en paralelo a re-corrida, no defects bloqueantes.

---

## Self-rating

| Dimensión | Score | Notas |
|---|---|---|
| **Cobertura audit** | 9/10 | 25 hooks + 30+ engines + 25+ endpoints + 50+ consumers auditados. Spotlight en hooks principales (useActiveProgram, useReadiness, useExecutiveReport, useWellbeingTrends, useCoachQuota) + sus consumers. Adicionalmente engine context fields, alternatives, staleness, neural-health endpoint, streak milestones config. **Posible gap:** no audité exhaustively `useSync`, `useDeepLink`, `useTapEntry` (low-impact hooks UX-side). |
| **Patterns nuevos descubiertos** | 9/10 | Engine output invisibles (alternatives, engagement, context, staleness, neural-health) emergió como pattern más amplio que A1 inicial. Streak milestones config-without-consumer es típico Bug-48 evolved. |
| **Findings reales vs nitpicks** | 9/10 | 4 HIGH son visibles "Engine compute work nadie surface" y "transitions silenciosas" — ambos premium gaps con paralelos en competencia (Headspace alternatives, Whoop staleness, Streaks milestones). Cero falsos positivos. M-1/M-2/M-3 son improvement opportunities reales. L-1 es honest deferred. |
| **Profundidad walkthrough** | 8/10 | Walkthrough deeper para useExecutiveReport (verificó 6 panels consumers). Walkthrough mid para useActiveProgram (4 consumers). Walkthrough surface para hooks UX-only. Trade-off: thoroughness vs scope time-bound. |
| **Honestidad reporte** | 10/10 | Cero confabulación. Cada finding referenciado con file:line + caller específico + severity justificada. Distinguí "Engine compute pero invisible" (H-3/H-4) de "extraction wrong" (cero — Fix-A1 cerró el único caso). |

**Promedio: 9/10**

---

## Issues / observaciones del audit

- **A1 en otros hooks NO replicado**: el patrón únicamente afectó useAdaptiveRecommendation. useActiveProgram + useReadiness + useExecutiveReport + useWellbeingTrends shapes son flat o `data: {...}` con consumers correctos.
- **Cero patterns sospechosos en server endpoints downstream**: APIs retornan shapes documentadas y consumers ya usan defensive `?.`.
- **Test discipline mostly good**: tests engine-side (`neural.test.js`, `executiveReport.test.js`) verifican shape REAL. Solo 3 mocks UI tests (Premium-Fix2 ColdStartView) usan shape simplified, salvado por helper Fix-A1 defensive.
- **Surface gap pattern (engine compute invisible) emerge más amplio**: no es por extraction wrong sino por priorización de panels UI. Engine team produce rich data, UI team no surface todo. Premium gap orgánico.
- **Compliance prohibitions cumplido**: cero modificaciones código source/tests/fixtures. Solo lectura + grep + reporte.
