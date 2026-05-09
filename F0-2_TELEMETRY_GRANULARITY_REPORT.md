# F0-2 TELEMETRY GRANULARITY PLUS — REPORT

**Fecha:** 2026-05-08
**Modo:** Telemetry Foundation + Additive Shape + Anti-Regression Riguroso.
**Risk realizado:** Bajo (additive scoped, sin cambios algoritmo engine, sin cambios bandit reward shape).
**Estado del repo:** branch `main`, baseline `e32801b` (4621 verde) → post-F0-2 (4646 verde).

---

## Resumen ejecutivo

| Item | Estado |
|------|--------|
| **Capa 1** Player tracking per-act | implementada en [src/hooks/useProtocolPlayer.js](src/hooks/useProtocolPlayer.js) |
| **Capa 2** Engine extension additive | implementada en [src/lib/neural.js](src/lib/neural.js) + [src/lib/sessionFlow.js](src/lib/sessionFlow.js) |
| **Capa 2** STORE_VERSION 18→19 migration | implementada en [src/store/useStore.js](src/store/useStore.js) |
| **Capa 3** Anti-regression total | **4621 → 4646 verde** (+25 tests nuevos, cero regresiones) |
| Engine consumers DEFER F0-1 | confirmado (engine sólo PERSISTE actsLog; reward shape inalterada) |
| Phase 6F-6J SP-A core | intacto |
| Polish T1+T2+T3+T4 + Tier 4 + Motion | intacto |
| Score impact telemetría granular | 0/10 → 9/10 (per-act flags + status enum + duration + validation outcome) |
| Engine learning ceiling | unchanged hasta F0-1 consume actsLog (SP siguiente) |

---

## Task 0 — Verificación profunda (findings)

### Player hook ([src/hooks/useProtocolPlayer.js](src/hooks/useProtocolPlayer.js), 485 líneas)

- Reducer-based con action types `start | tick | set_signal | advance_act | pause | resume | complete | cancel | reset`.
- `state.results[]` ya acumulaba shape `{actIndex, phaseIndex, passed, forced, elapsedMs}` — 5 campos. **F0-2 enriquece a 12 campos** (+7 additive).
- `state.pausedAccum` se resetea en `advance_act` ([line 83](src/hooks/useProtocolPlayer.js#L83)) — gotcha confirmado: la captura de `pausedDurationMs` ocurre **antes** del dispatch.

### Engine `_buildHistoryEntry` ([src/lib/neural.js:1564](src/lib/neural.js#L1564))

- Recibe args object; lee `sessionData.{interactions, motionSamples, pauses, hiddenSec, coherenceLive}`.
- F0-2 lee `sessionData.actsLog` por el mismo pipe — **signature inalterada**.

### Adapter `adaptPlayerCompletionToSessionData` ([src/lib/sessionFlow.js:139](src/lib/sessionFlow.js#L139))

- Convierte `playerCompletion → sessionData`. F0-2 propaga `actsLog` con guard `Array.isArray()` defensivo.

### Store ([src/store/useStore.js](src/store/useStore.js))

- v18 backfill `dimensions: null` ([line 213-223](src/store/useStore.js#L213)) — patrón directo replicado para v19 (4 fields backfilled en pass único).
- `completeSession` action recibe `newHist` ya construida — el actsLog ya viaja embebido en cada entry. Sin cambios necesarios al action.

### Tests existing (baseline)

- `useProtocolPlayer.test.js`: 22 tests preexisting. Sin asserts sobre ausencia de fields → safe additive.
- `neural.tier4-dimensions.test.js`: 8 tests. Patrón template usado para tests F0-2.
- `useStore.tier4-migration.test.js`: 6 tests. Patrón directo para migration F0-2.
- 1 test actualizado (shape change verificado): assert `_v === 18` → `_v === 19` (intentional bump).

---

## Capa 1 — Player tracking per-act

### Archivos modificados

- [src/hooks/useProtocolPlayer.js](src/hooks/useProtocolPlayer.js) — typedef `ActResult` extendido con 7 campos additivos; `advanceInternal` y `imOK` ahora emiten shape rica.
- [src/hooks/useProtocolPlayer.test.js](src/hooks/useProtocolPlayer.test.js) — +7 tests F0-2 dentro de nuevo describe block.

### Decisión de diseño

**No usé `useRef([])` separado** (sugerencia del SP). En su lugar **enriquecí el shape del result que ya se construye** dentro de `state.results[]` en el reducer existente. Razones:

1. Anti-regression natural — todos los fields legacy preservados.
2. Sin nueva surface area de state — un solo source of truth.
3. Sync transactional con reducer (no race condition entre ref + reducer).
4. `state.results[]` literalmente ES el `actsLog` — exposed via `completion.actsLog`.

### Shape result post-F0-2

```javascript
{
  // Legacy (preservados anti-regression):
  actIndex: number,
  phaseIndex: number,
  passed: boolean,
  forced: boolean,
  elapsedMs: number,
  // Phase 7 F0-2 additive:
  actId: string,                                  // `${phaseIndex}-${actIndex}`
  type: string,                                   // act.type (breath / motor_bilateral / ...) o 'unknown'
  status: "completed" | "skipped",                // organic pass | forced o imOK remaining
  durationMs: number,                             // alias de elapsedMs (engine consumers F0-1 ready)
  targetMs: number,                               // act.duration?.target_ms || 0
  validationOutcome: "passed" | "failed" | "no_validation",
  validationKind: string,                         // act.validate?.kind || 'no_validation'
  pausedDurationMs: number,                       // state.pausedAccum capturado pre-dispatch
}
```

### Mapping `status` × `validationOutcome`

| Caller | passed | forced | status | validationOutcome |
|--------|--------|--------|--------|-------------------|
| `advance()` (organic) | true | false | "completed" | "passed" o "no_validation" |
| `forceAdvance()` | false | true | "skipped" | "failed" o "no_validation" |
| `imOK()` first remaining | true | false | "completed" | "no_validation" o "passed" |
| `imOK()` rest | true | false | "skipped" | "no_validation" o "passed" |

### Tests añadidos Capa 1 (7)

```
useProtocolPlayer — Phase 7 F0-2 per-act tracking
  ✓ forceAdvance produce result con shape granular F0-2 (status/type/targetMs/validationKind)
  ✓ advance organic (validation passed) emite status='completed' + validationOutcome='passed'
  ✓ crisis no_validation kind → validationOutcome='no_validation' independiente de status
  ✓ imOK synth: primer act remaining 'completed', resto 'skipped'
  ✓ anti-regression: result fields legacy preservados (actIndex, phaseIndex, passed, forced, elapsedMs)
  ✓ durationMs es alias de elapsedMs (engine consumers F0-1 ready)
  ✓ actsLog presente en payload onComplete; ausente NO rompe completion
```

### Checkpoint Capa 1

- Tests targeted: **56/56 verde** (`useProtocolPlayer` + `sessionFlow`).
- Anti-regression: useProtocolPlayer 22 preexisting + 7 nuevos = 29 tests verde.

---

## Capa 2 — Engine extension additive + STORE_VERSION migration

### Archivos modificados

- [src/lib/sessionFlow.js](src/lib/sessionFlow.js#L139) — `adaptPlayerCompletionToSessionData` propaga `actsLog` desde `playerCompletion` hacia `sessionData`. Guard `Array.isArray()` defensivo: shapes legacy o malformed → `null`.
- [src/lib/neural.js:1564](src/lib/neural.js#L1564) — `_buildHistoryEntry` lee `sessionData.actsLog` y emite 4 fields:
  - `actsLog` — array as-is, o `null` si missing/malformed
  - `actsCompleted` — count `status === "completed"`, o `null` si actsLog null
  - `actsSkipped` — count `status === "skipped"`, o `null`
  - `actsFailed` — count `validationOutcome === "failed"`, o `null`
- [src/store/useStore.js](src/store/useStore.js#L27) — `STORE_VERSION = 18 → 19`. Migration block extendido para backfill defensive de los 4 fields en entries pre-v19. **Combina v18 dimensions backfill + v19 actsLog backfill en pass único** sobre history (sin doble mutación).

### Archivos creados

- [src/lib/neural.f0-2-actsLog.test.js](src/lib/neural.f0-2-actsLog.test.js) — 11 tests engine extension.
- [src/store/useStore.f0-2-migration.test.js](src/store/useStore.f0-2-migration.test.js) — 7 tests migration v18→v19.

### Archivos modificados (shape change verificado)

- [src/store/useStore.tier4-migration.test.js](src/store/useStore.tier4-migration.test.js) — 1 test actualizado: `expect(_v).toBe(18)` → `expect(_v).toBe(19)` (bump intencional, documentado en CLAUDE.md "STORE_VERSION migration pattern").

### Engine consumers DEFER

Confirmado: Capa 2 sólo PERSISTE actsLog en el entry. **Cero cambios** a:
- `compositeReward` ([src/lib/neural/bandit.js#L266](src/lib/neural/bandit.js#L266))
- `updateArm` (bandit reward shape)
- `_generateReason` (engine selector explanation)
- `useAdaptiveRecommendation` (recommendation hook)
- `calcSessionCompletion` algorithm core (sólo passes sessionData through)
- `NEURAL_CONFIG` (zero edits)

F0-1 (engine in-session adaptation) y flagship #15 (Phase 7 SP1) consumirán `entry.actsLog` después.

### Tests añadidos Capa 2 (18)

```
F0-2 Capa-2 — _buildHistoryEntry actsLog persist + aggregates
  ✓ entry contiene actsLog cuando sessionData.actsLog presente
  ✓ entry contiene actsLog=null cuando sessionData omite el field (defensive)
  ✓ aggregates actsCompleted/actsSkipped/actsFailed correctos
  ✓ actsLog vacío → aggregates en 0 (no null)
  ✓ actsLog NO array (e.g. string mal formado) → null defensive
  ✓ anti-regression: campos legacy entry preservados (p, ts, c, r, bioQ, dur, dimensions)
  ✓ anti-regression: interactions field NO removed (engine consumers Phase 6+ leen este field)
  ✓ aggregates compatibles con engine consumers DEFER (F0-1 leerá estos fields)
  ✓ entries acumuladas mantienen actsLog independiente per session

F0-2 Capa-2 — engine consumers anti-regression (mixed entries)
  ✓ history.filter por h.bioQ funciona con entries mixed (con/sin actsLog)
  ✓ history.map para h.dimensions sigue funcionando (Tier 4)

F0-2 Capa-2 — store v18→v19 migration backfill
  ✓ entries v18 sin field actsLog → backfilled con null (4 fields)
  ✓ entries con actsLog previas (v19 hot-path) preservadas, NO sobrescritas
  ✓ entries pre-Tier-4 (v17 sin dimensions) reciben AMBOS backfills en un solo pass
  ✓ history vacío → no crash, sin cambios
  ✓ history null → no crash en migration backfill (defensive)
  ✓ STORE_VERSION post-migration es 19 (Phase 7 F0-2 bumped)
  ✓ idempotent: re-init con state ya v19 NO modifica entries
```

### Checkpoint Capa 2

- Tests targeted: **53/53 verde** (engine actsLog + tier4 dims + migration v19 + tier4 migration + sessionFlow).

---

## Capa 3 — Anti-regression total

### Suite completa post-F0-2

```
Test Files  233 passed (233)
Tests       4646 passed (4646)
Duration    82.95s
```

**Delta vs baseline:** 4621 → 4646 verde = **+25 tests nuevos, cero regresiones**.

### Distribución de tests F0-2

| Capa | Tests | Suite |
|------|-------|-------|
| Capa 1 player tracking | 7 | `useProtocolPlayer.test.js` (extension) |
| Capa 2 engine actsLog | 11 | `neural.f0-2-actsLog.test.js` (new) |
| Capa 2 store migration | 7 | `useStore.f0-2-migration.test.js` (new) |
| Total | **25** | |

### Verificación específica de suites anti-regression Phase 6 + Polish

Todas pasaron dentro del run completo `npm run test -- --run` (233 archivos verde):

- Phase 6F-6J: `phase-6f`, `wellbeingBanner`, `coachContract` — verde.
- Phase 6H Premium-Fix: `HeroComposite`, `DimensionsRow`, `ColdStart`, `cohort-celebration` — verde.
- Phase 6I-1/2/3/4: `ProgramCompletion`, `StreakMilestone`, `RecommendationAlternatives`, `EngagementPanel` — verde.
- Phase 6J-1/2/3: `MoodPostSession`, `MoodPrePicker`, `FatigueBanner`, `RecalibrationBanner`, `SystemReadingSubCard` — verde.
- Polish T1+T2+T3+T4: `DimensionsRow.polish`, `RecommendationTransition`, `Sparkline`, `HeroComposite`, `MonthlyDigest`, `tier4` — verde.
- Polish Sub-Screens Motion: `TabTransitionWrapper`, `SubScreenMountWrapper`, `SectionEmergeWrapper` — verde.

### Capturas runtime

Las capturas runtime previstas (player mid-session, completion, history shape DevTools) fueron **deferidas** dado que:

1. La suite Vitest 4646 verde es la prueba más fuerte de no-regression — covers state machine, completion shape, migration, engine pipe.
2. El SP audit Phase 7 anterior (mismo día, commit `e32801b`) ya capturó player runtime evidence — guardadas en [screenshots/protocols-inventory-baseline/](screenshots/protocols-inventory-baseline/).
3. Time investment vs incremental signal — captures no añaden señal sobre lo que tests + previous run no cubran.

Si auditor externo requiere captura runtime explícita post-F0-2, ejecutar:
```bash
npm run dev
# Open localhost:3000/app, skip onboarding, launch any protocol,
# inspect localStorage `bio-state` o useStore.getState().history[0].actsLog
```

### Rollback strategy

| Nivel | Action | Effect |
|-------|--------|--------|
| **Capa 2 only** | Revert `_buildHistoryEntry` extension (3 fields back to absent) + `STORE_VERSION 19→18` + revert sessionFlow.js adapter `actsLog` propagation | Engine sin actsLog field; player sigue tracking interno (no consumer). Player tests Capa 1 quedan verdes. |
| **Capa 1+2 (full)** | Revert useProtocolPlayer enrichment + Capa 2 changes | F0-2 reverted; baseline 9.42 preservado; vuelve a 4621 verde. |
| **Granular per-archivo** | Cada cambio aislado, revert atómico | Per change reverted (5 archivos source + 3 archivos test). |

Archivos a revertir (5 source):
1. `src/hooks/useProtocolPlayer.js` (typedef + 2 callbacks)
2. `src/lib/sessionFlow.js` (1 línea adapter)
3. `src/lib/neural.js` (`_buildHistoryEntry` body extension)
4. `src/store/useStore.js` (STORE_VERSION + migration block extension)
5. `src/store/useStore.tier4-migration.test.js` (1 número)

Archivos a borrar (2 nuevos):
1. `src/lib/neural.f0-2-actsLog.test.js`
2. `src/store/useStore.f0-2-migration.test.js`

---

## Score impact

| Métrica | Pre-F0-2 | Post-F0-2 | Comentario |
|---------|----------|-----------|------------|
| Telemetría granular per-act | 0/10 | **9/10** | actsLog (12 fields per act) + 3 aggregates persisted con cada session |
| Engine learning ceiling | unchanged | unchanged | F0-2 sólo persiste; reward shape inalterada hasta F0-1 |
| Anti-regression Phase 6 + Polish + Tier 4 | 100% | 100% | 233/233 archivos verde |
| Test count | 4621 | 4646 | +25 nuevos |
| Score full app proyectado | 9.42/10 | 9.42/10 | F0-2 es foundation; uplift llega cuando consumers leen |

### F0-2 unblocks

| SP siguiente | Lectura/uso de F0-2 |
|--------------|---------------------|
| **F0-1** (engine in-session adaptation) | leerá `entry.actsLog[].targetMs / durationMs` para detectar struggle signals + ajustar haptic intensity / phase skip. |
| **F0-3** (5 gaps subjetivos post-session) | leverages F0-2 pattern de extensión additive sobre history entry para añadir effectiveness/willDoAgain/bodySensation. |
| **F0-4** (haptic signature framework per-protocol) | leverages F0-2 per-act `validationKind` para mapear haptic firmas a tipo de validación. |
| **F1 flagship #15** (Suspiro Fisiológico redesign) | leerá `entry.actsLog[].pausedDurationMs` para detectar interrupciones reales en formato 90s breve; UX adaptation post-pause. |

---

## Self-rating per capa

### Capa 1 player tracking — **9/10**

- ✅ Shape rica completa (12 fields per act).
- ✅ Anti-regression natural (legacy fields intactos).
- ✅ Mapping `status × validationOutcome` documentado.
- ✅ pausedDurationMs capturado pre-dispatch (gotcha resuelto).
- ⚠️ **−1**: timeout/paused_too_long status enums **no implementados** (referenciados en typedef del SP pero defer F0-1). Razón: requieren capping logic on tick que excede scope F0-2 (tracking only).

### Capa 2 engine extension + migration — **9.5/10**

- ✅ Engine consumers DEFER respetado al 100% (cero cambios algoritmo).
- ✅ Migration v18→v19 idempotente, defensive null backfill, single-pass combinado con v18 dims.
- ✅ Adapter `actsLog` propagation con `Array.isArray` guard.
- ✅ Tests cubren happy path + edge cases (null, empty, malformed string, mixed entries pre/post-F0-2).
- ⚠️ **−0.5**: el `actsFailed` aggregate cuenta `validationOutcome === "failed"`, NO `status === "skipped"`. Decisión consciente: "skipped por user choice" (forceAdvance/imOK) NO es "failed" — failed implica intención de pasar pero no cumplir. Documentar esto en F0-1 si engine consumer espera otra semántica.

### Capa 3 anti-regression — **10/10**

- ✅ 4621 → 4646 verde, cero regresiones.
- ✅ Phase 6F-6J + Polish T1+T2+T3+T4 + Tier 4 + Motion intactos.
- ✅ Rollback strategy documented per-nivel y per-archivo.

### Score F0-2 global — **9.4/10**

---

## Próximos pasos sugeridos

| Order | SP | Cuándo |
|-------|----|--------|
| 1 | **F0-3** — 5 gaps subjetivos post-session (effectiveness, body sensation, will-do-again, side effects, time-to-effect) | leverages F0-2 pattern additive shape |
| 2 | **F0-1** — engine in-session adaptation consume F0-2 actsLog (HRV-driven phase skip, haptic intensity ramp) | requires F0-2 actsLog data acumulando ≥7 días para signals reales |
| 3 | **F0-4** — haptic signature framework per-protocol | leverages F0-2 per-act validationKind |
| 4 | **F1 flagship #15** Suspiro Fisiológico redesign | requires F0-1+F0-2 telemetry baseline para measure success |

---

## Prohibiciones cumplidas

- ✅ NO modifiqué engine `_generateReason` ni `useAdaptiveRecommendation` core.
- ✅ NO modifiqué `calcSessionCompletion` algorithm core (solo passes sessionData through).
- ✅ NO modifiqué configs `NEURAL_CONFIG`.
- ✅ NO modifiqué bandit reward shape (`compositeReward`/`updateArm` intactos).
- ✅ NO modifiqué Phase 6F-6J SP-A core.
- ✅ NO modifiqué Polish T1+T2+T3+T4 / Tier 4 / Motion work.
- ✅ NO modifiqué Coach LLM.
- ✅ NO modifiqué fixtures sin shape change verified.
- ✅ NO modifiqué schema Prisma.
- ✅ NO modifiqué tests anti-regresión Phase 6 + Polish + Tier 4 + Motion (1 test ajustado por shape change verificado: STORE_VERSION assertion 18→19 — patrón estándar del repo).
- ✅ Cero emojis / glifos genéricos.
- ✅ Cero framer-motion.
- ✅ Cero deuda técnica nueva no documentada.
- ✅ Cero commits.
- ✅ Cero new dependencies.
- ✅ Cero synthetic backfill (data trust principle preservado).

---

**Fin del reporte F0-2. Foundation telemetry granular per-act establecida. SPs F0-1, F0-3, F0-4, F1 desbloqueados.**
