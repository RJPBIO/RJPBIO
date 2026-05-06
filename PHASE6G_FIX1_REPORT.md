# PHASE 6G FIX1 — P0 MASTER BUGS · REPORTE MICROSCOPIO

**Fecha:** 2026-05-06
**Scope:** Master bug persistencia + calibration helper + auth rate-limit
**Modo:** Fix quirúrgico + tests E2E reales + verification cascading

---

## 1 · Archivos modificados / nuevos

### Modificados (3)

| Archivo | Líneas | Razón |
| --- | --- | --- |
| [src/store/useStore.js](src/store/useStore.js) | belongsToUser + init defensive | **Fix P0-1 master bug** — preserva state cuando saved._userId !== null y opts.userId === null (caso ambiguo durante mount AppV2Root o 429 sobre `/api/auth/session`) |
| [src/middleware.js](src/middleware.js) | RATE_LIMIT constants | **Fix rate-limit** — `AUTH_RATE.max` 10→30 + nuevo bucket `SESSION_READ_RATE.max=120` para GET `/api/auth/session` (read-only, no brute-forceable) |
| [tests/e2e/utils/helpers.ts](tests/e2e/utils/helpers.ts) | selector + skipAllCalibration | **Fix P0-2 helper** — `[data-v2-onboarding-calibration]`→`[data-v2-calibration]` (selector real). Rewrite `skipAllCalibration` con data-testid attributes para precisión (steps 0-2 use `calibration-skip-instrument`, step 3 HRV use `hrv-skip` + `calibration-cta`, step 4 use `calibration-cta`) |

### Nuevos (3)

| Archivo | Tests | Cubre |
| --- | --- | --- |
| [src/store/useStore.init.test.js](src/store/useStore.init.test.js) | 7 unit | Vitest unit anti-regresión P0-1: 7 escenarios (anon→anon, anon+login, same userId, switch user, MASTER BUG ambiguous, fresh user, error path) |
| [tests/e2e/regression/master-persistence.spec.ts](tests/e2e/regression/master-persistence.spec.ts) | 4 e2e | Reproductor master bug + cohort transitions: reload tras setup, 5 sesiones→LearningView, 20→PersonalizedView, **429 simulado en `/api/auth/session` NO clava state** |
| [tests/e2e/regression/calibration-skip.spec.ts](tests/e2e/regression/calibration-skip.spec.ts) | 2 e2e | Anti-regresión P0-2: skip individual avanza step-by-step (5 steps verified) + helper `skipAllCalibration` post-fix funciona end-to-end |

### NO modificados (per prohibición)

- ✅ Phase 6F ideas (3 ideas SP-A→SP-F) intactas
- ✅ Coach (CoachV2.jsx, CoachLLM, coachSafety) intacto
- ✅ Fixtures de tests no tocadas
- ✅ Schema Prisma no tocada
- ✅ Backend Idea 1/2/3 intacto
- ✅ Cero strings nuevos con "burnout score"/"predicción"/"diagnóstico"

---

## 2 · Root cause REAL P0-1 (vs hipótesis Opus)

### Hipótesis original Opus (parcialmente equivocada)
> "useAuthBridge recibe 429 y llama useStore.init({ userId }) con userId stale o null"

**Realidad — descubierto en Task 0:**
- `useAuthBridge.js` NO llama `useStore.init()`. Solo expone `signOutAndClear`.
- El **único** caller de `init()` es [src/components/app/v2/AppV2Root.jsx:212](src/components/app/v2/AppV2Root.jsx#L212): `store.init?.()` con **NO opts** → `userId = opts.userId ?? null` → siempre null.

### Cadena real del master bug

1. Usuario hace login → [src/lib/sync.js:157](src/lib/sync.js#L157) escribe `merged._userId = currentUserId` en saved state IDB.
2. Usuario recarga la página o el SW restart re-mount AppV2Root.
3. AppV2Root [line 212](src/components/app/v2/AppV2Root.jsx#L212) llama `store.init?.()` SIN opts.
4. Init: `userId = null`. `loadState()` retorna saved state con `_userId='real-user'`.
5. `belongsToUser({_userId:'real-user'}, null)` ANTES del fix:
   ```js
   const prev = 'real-user';
   const curr = null;
   return prev === curr; // false → trigger clearAll
   ```
6. **`clearAll()`** → IDB wiped → migrate(null) → DS defaults → `welcomeDone=false`, `history=[]`, `totalSessions=0`. Welcome modal reaparece.

### Fix aplicado (`belongsToUser` + `init`)

```js
function belongsToUser(loaded, currentUserId) {
  const prev = loaded?._userId ?? null;
  const curr = currentUserId ?? null;
  if (prev === curr) return true;
  if (prev === null) return true; // first login: anon-saved se attach al user
  if (curr === null) return true; // ambiguous: token aún no resuelto/429 — preservar
  return false;                    // ambos definidos y distintos → switch real
}
```

Y en `init()`, nuevo bloque:
```js
} else if (prevUserId !== null && userId === null) {
  // Phase 6G Fix1 P0-1: caso ambiguo. Preservar loaded._userId — no
  // sobrescribir con null. sync.js identity binding requiere _userId
  // para próximo pull con currentUserId real.
}
```

**Validación**: `master-persistence.spec.ts Test 4` reproduce el escenario exacto (saved `_userId='user-real-from-sync'` + `page.route('/api/auth/session', 429)` + reload) y verifica que state se preserve. **PASS** post-fix.

### Auth rate-limit como factor agravante

ANTES: `AUTH_RATE.max=10/min` cubría TODO `/api/auth/*` y `/signin`. NextAuth's useSession hace fetch on-mount + on-focus + refetchInterval; con multi-tab se exhausto fácilmente. El audit mostró 31× 429 en `/api/auth/session` + 23× 429 en `/signin` (54 total).

DESPUÉS Fix1:
- `AUTH_RATE.max=30/min` para mutations (signin, signout, callback)
- `SESSION_READ_RATE.max=120/min` para GET `/api/auth/session` (read-only, no brute-forceable)

**Validación**: re-run del audit muestra **0 × 429** en network errors (vs 54 previos).

---

## 3 · Root cause REAL P0-2

### Hipótesis original
> "onSkip handler missing OR handleSkip no avanza step OR race condition"

### Realidad — descubierto en Task 0

- [NeuralCalibrationV2.jsx:377-379](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L377-L379) `handleSkipInstrument` está bien wired y avanza step correctamente.
- [NeuralCalibrationV2.jsx:487](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L487) lo passea como prop a `CalibFooter`.
- [NeuralCalibrationV2.jsx:594-606](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L594-L606) renderea botón con `data-testid="calibration-skip-instrument"` que clickea `handleSkipInstrument` directo.

**El bug NO era de producto — era del test helper.**

[helpers.ts](tests/e2e/utils/helpers.ts) buscaba botones dentro de `[data-v2-onboarding-calibration]` pero el componente real usa `data-v2-calibration` ([line 395](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L395)). El selector retornaba `null` → `find()` no encontraba botones → `clickedSkip=false` → loop break → fall-through a `clickButtonByText("Empezar")` que tampoco encontraba el botón porque seguíamos en step 1.

Adicional: el helper text-matched `/saltar/i` también encontraba "Saltar (incompleto)" en HRV step 4 sin avanzar (HRV step requiere skip + CTA "Siguiente" después).

### Fix aplicado en helpers.ts

```ts
// Selector corregido + rewrite con data-testid:
async function skipAllCalibration(page) {
  for (let safety = 0; safety < 6; safety++) {
    const counter = await page.getByTestId("calibration-step-counter").textContent(...);
    const step = parseInt(counter.match(/(\d{2})/)[1], 10);
    if (step <= 3)      await page.getByTestId("calibration-skip-instrument").click();
    else if (step === 4) {
      await page.getByTestId("hrv-skip").click();
      await page.getByTestId("calibration-cta").click();
    }
    else if (step === 5) {
      await page.getByTestId("calibration-cta").click(); // "Empezar"
      break;
    }
  }
}
```

**Validación**: `calibration-skip.spec.ts` 2/2 PASS (incluye Test 2 que invoca el helper end-to-end).

---

## 4 · Auditoría re-corrida: bugs ANTES vs DESPUÉS

| Métrica | ANTES (audit-run-6) | DESPUÉS (audit-run-after-fix) | Δ |
| --- | --- | --- | --- |
| **Bugs totales** | 23 | **17** | **−6** |
| P0 | 4 | 3 | **−1** (calibration skip) |
| P1 | 16 | 11 | **−5** (audit fallback + 4 cascading menores) |
| P2 | 2 | 2 | 0 |
| P3 | 1 | 1 | 0 |
| **Console errors** | 824 | 850 | +26 (more pages visited; same CSP pattern) |
| **Network errors** | 66 | **10** | **−56** (TODOS los 429 eliminados) |
| 429 sobre `/api/auth/session` | 31 | **0** | **−31** ✓ |
| 429 sobre `/signin` | 23 | **0** | **−23** ✓ |
| 401 esperados (sin auth) | resto | 10 | resto |

### Bugs resueltos automáticamente cascading
- ✅ **Día 0 [P0] Calibration skip-all** — RESUELTO (helper fix)
- ✅ **Día 0 [P1] Audit fallback** — RESUELTO (no fallback porque calibration skip-all funciona)
- ✅ **Auth rate-limit 429 storm** — RESUELTO (middleware fix, validable por 0 × 429 en re-run)

### Bugs P0 producción remanentes en audit (test-harness artifacts)

Después del fix, el audit aún reporta 3 P0 + algunos P1/P2 cascading:
- P0 Día 2-4 history.length=3 (esperado 4)
- P0 Día 5 LearningView NO visible
- P0 Día 20 PersonalizedView NO visible
- P1 Día 10-13 totalSessions=4 (esperado 9)
- P1 Día 21 HeroComposite empty
- P2 Día 22 DimensionsRow not found

**ESTOS NO SON BUGS DE PRODUCTO.** Son artifacts del test harness:

1. **Playwright crea un BrowserContext NUEVO por cada test** (default). `mode: 'serial'` solo significa "ejecutar en orden, abortar al primer fallo"; **NO comparte contexto**.
2. El audit asume incorrectamente que el state de Día 1 persiste a Día 2-4. En realidad cada test arranca con IDB vacío + cookie banner + Welcome.
3. Capturas Día 5/20 muestran Welcome reapareciendo POR ESTA RAZÓN, no por el master bug.

**Evidencia que el master bug producto SÍ está fixed**:
- `master-persistence.spec.ts` Test 1 (anon reload preserva state) ✓ PASS
- Test 2 (5 sessions → LearningView dentro de un test) ✓ PASS
- Test 3 (20 sessions → PersonalizedView dentro de un test) ✓ PASS
- **Test 4 (429 simulado en /api/auth/session NO clava state)** ✓ PASS — reproductor exacto del master bug
- `onboarding-to-multi-sessions.spec.ts` Phase 6E SP-B: 4/4 PASS sin regresión

### Bugs producción reales remanentes (Fix2 scope)

- P1 Día 1 ColdStart UI vacío post-onboarding (no cascading)
- **P1 Día 9 `/app/programs` 404** (page no existe)
- P1 Día 28 program/today error sin programa (cascading auth + missing empty state)
- P1 Día 15-19 Bottom nav cascading parcial (test prev navega a /app/program/today que rompe AppV2Root mount)
- 850 console errors CSP inline-style (Phase 6F SP-F deuda; no introducida por Fix1)
- 6 React "setState during render" warnings

---

## 5 · Suite Vitest mantenida

```
ANTES: 4052/4052 passed
DESPUÉS Fix1: 4059/4059 passed (+7 nuevos init.test.js, 0 regresiones)
```

Comando: `npm run test` → 56s, 190 test files, 4059 tests verde.

---

## 6 · Tests E2E nuevos verde

```
tests/e2e/regression/calibration-skip.spec.ts:
  ✓ Skip individual avanza step PSS-4 → rMEQ → MAIA-2 → HRV → Resumen (8.9s)
  ✓ skipAllCalibration helper avanza 4 instrumentos + Empezar (post-fix) (9.3s)

tests/e2e/regression/master-persistence.spec.ts:
  ✓ Test 1: reload tras setupPostOnboarding preserva state (anon) (7.1s)
  ✓ Test 2: 5 sesiones + reload → LearningView (cohort transition P0-3) (8.0s)
  ✓ Test 3: 20 sesiones + reload → PersonalizedView (cohort transition P0-4) (9.9s)
  ✓ Test 4: 429 simulado en /api/auth/session NO clava state (master bug) (7.3s)

6/6 passed (54.3s)
```

Y verificación de no-regresión Phase 6E SP-B:
```
tests/e2e/onboarding-to-multi-sessions.spec.ts:
  ✓ Bug-48 reproducer (15.7s)
  ✓ cohort transition 5 sessions → LearningView (9.0s)
  ✓ cohort transition 20 sessions → PersonalizedView (11.1s)
  ✓ boundary cases N=1,2,3,4 (23.4s)

4/4 passed (1.2m)
```

---

## 7 · Self-rating

| Criterio | Score | Notas |
| --- | --- | --- |
| Investigación raíz | **9.5/10** | Hipótesis Opus parcialmente equivocada (useAuthBridge no era el caller). Identificado el caller real (AppV2Root.useEffect line 212) + cadena exacta sync.js → init → belongsToUser |
| Fix quirúrgico | **9/10** | 3 archivos modificados, ningún strings de Phase 6F tocado, ningún coach/fixture/schema tocado. belongsToUser + init defensive simétrico (4 casos cubiertos) |
| Anti-regresión | **9/10** | 7 unit tests + 6 E2E (incluye reproductor 429 simulado). Vitest 4059/4059, Phase 6E SP-B 4/4 |
| Cobertura cascading verificada | **8/10** | Audit re-corrido. Cascading bugs resueltos: 6 (calibration + audit fallback + 31×429 + 23×429). Bugs persistencia "remanentes" en audit son test-harness artifacts (cross-test isolation Playwright), NO bugs de producto — documentado |
| Honestidad sobre scope | **10/10** | No invento "fix" de bugs que no toqué. P1 reales remanentes (programs 404, ColdStart UI, BottomNav cascading, CSP) declarados como Fix2 |

**Promedio: 9.1/10**

---

## 8 · Issues / blockers

### Resueltos
- ✅ Master bug P0-1 persistencia cross-reload con saved._userId
- ✅ Auth rate-limit 429 storm
- ✅ Calibration skip helper

### Identificados pero fuera de scope (Fix2)

1. **CSP `style-src` violations × 712-740 por sesión** — Framer Motion + tokens.js inyectan inline styles que violan el nonce. middleware.js tiene `style-src-attr 'unsafe-hashes' 'unsafe-inline'` para style attr inline pero el `style-src` (no -attr) sigue sin nonce-aware en algunos paths. Auditar próximo SP.

2. **`/app/programs` 404** — Sub-prompt SP-B menciona que la page no existe. Crear listing de programas (Burnout Recovery, Sleep, Focus) en próximo SP.

3. **React setState-during-render × 6** — algún componente llama setState durante su render. Tracear con dev tools en próximo SP.

4. **Audit script tiene cross-test assumption invalid** — el audit asume cross-test persistence que Playwright no provee. Reescribir cada test con `setupPostOnboarding` al inicio (como hace `onboarding-to-multi-sessions.spec.ts`) si se quiere usar el audit como CI gate; mientras tanto los regression tests son la fuente fiable.

5. **/app/program/today empty state** sin programa — Falta copy "No hay programa activo — explorar programas" en lugar de body casi vacío.

### Sin blockers

Todos los fixes funcionan en dev server local. Listo para PR / commit por usuario cuando lo decida.

---

## 9 · Cambio neto medido

| Indicador | Antes | Después | Comentario |
| --- | --- | --- | --- |
| Master bug producto P0-1 | reproducible 100% con Test 4 simulado | NO reproducible | ✓ Fix validado |
| Calibration skip helper | timeout en step 1 | 5/5 steps avanzan + helper PASS | ✓ |
| 429 storm en auth | 54 errores red en audit | 0 errores red | ✓ |
| Vitest suite | 4052 verde | 4059 verde (+7) | ✓ |
| Phase 6E SP-B regresión | 4/4 verde | 4/4 verde | ✓ sin regresión |
| Audit (test-harness limited) | 23 bugs | 17 bugs (−6) | parcial — limitación cross-test |

**Resumen** — el master bug productivo está cerrado y validado por test E2E con reproductor exacto. Los bugs cascading documentados como "remanentes" en el audit son artifacts del test runner, no del producto. Listo para Fix2 (programs page + ColdStart UI + CSP audit).
