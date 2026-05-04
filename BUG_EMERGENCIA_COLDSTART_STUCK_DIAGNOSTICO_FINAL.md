# BUG EMERGENCIA — COLDSTART STUCK POST-PRIMERA-ACCIÓN

**Fecha:** 2026-05-04
**Modo:** Read-only diagnóstico (revisión 3 — comprensión final del síntoma)
**Severidad:** **CRITICAL UX** (producto con pantalla inútil entre sesiones 1-4)
**Status:** ✅ **REPRODUCIDO 100%** — bug confirmado en local dev. Pending fix.
**Detectado por:** QA externo (NO Phase 6D Playwright captures)
**Comprensión previa SP9-bis:** errónea (se interpretó como "pantalla negra completa" → bug NO reproducible)
**Comprensión correcta:** ColdStart STUCK con greeting + header + cards filtradas hasta vacío entre 1-4 sesiones

---

## TL;DR

Bug **reproducido al 100%** en captura `bug-final-04-coldstart-EMPTY-CARDS-STUCK.png`. Tab Hoy muestra solo:
- HeaderV2 (top)
- Greeting "Hola." + "Vamos a conocerte." (ya completó onboarding pero copy sigue diciéndolo)
- Section header "EMPEZAR POR AQUÍ"
- **Viewport central completamente vacío** (cards filtradas: actions=[])
- BottomNav (bottom)
- CrisisFAB SOS

**Root cause:** brecha arquitectónica entre `dataMaturity:"cold-start"` (history.length<5) y `dataMaturity:"personalized"` (history.length>=5). ColdStartView filtra cards completed sin empty state fallback. Usuario stuck entre sesiones 1-4 sin contenido accionable.

**Severidad:** **CRITICAL UX** — el producto entrega pantalla muerta justo en el momento de mayor expectativa (después de la primera sesión positiva). User pierde momentum, posible churn pre-D2/D3 retention.

**Fix recomendado:** combo
- **P0 immediate (~25 LoC, low risk)**: empty state en ColdStartView cuando `actions=[]` con CTAs a "Nueva sesión", "Datos", "Coach"
- **P1 Phase 6E (~50 LoC, medium risk)**: branch `dataMaturity === "learning"` en HomeV2 con LearningView específica para sessions 1-19

---

## Reproducción confirmada (Task 1)

### Escenario E2E flow real

**Setup:** localStorage clean + IDB delete via `indexedDB.databases().forEach(deleteDatabase)`.

**Pasos ejecutados (Playwright real, NO state injection en welcome/calibration):**

1. Navigate `/app` fresh
2. Welcome 5 pasos: 4× "Continuar" + intent "Calma" + "Estoy listo"
3. Calibration: skip los 4 instrumentos (PSS-4, rMEQ, MAIA-2, HRV)
4. Step 5 final → "Empezar"
5. Tap card "Tu primera sesión" → ProtocolPlayer mounted (Reinicio Parasimpático)
6. Simular completión via `useStore.completeSession({...})` con payload válido (refleja closeSession() del player real)
7. Simular medición HRV: `useStore.logHRV({rmssd:45, ...})`
8. Simular PSS-4: `useStore.logInstrument({instrumentId:"pss-4", ...})`
9. Simular cronotipo: `useStore.setChronotype({...})`

### Capturas progresivas

| # | Estado | Cards visibles | Captura |
|---|---|---|---|
| 1 | Post-onboarding (skip-all calibration) | 4 (primera + cronotipo + HRV + PSS-4) | `bug-final-01-coldstart-initial.png` |
| 2 | ProtocolPlayer mounted (mid sesión) | n/a | `bug-final-02-protocol-player-mounted.png` |
| 3 | Post 1ª sesión (totalSessions=1) | 3 (cronotipo + HRV + PSS-4) | `bug-final-03-coldstart-after-1-session.png` |
| 4 | Post 1ª sesión + HRV + PSS-4 + cronotipo | **0** (STUCK) | **`bug-final-04-coldstart-EMPTY-CARDS-STUCK.png`** |

### State runtime en captura 4 (BUG)

```json
{
  "totalSessions": 1,
  "history": [{ "ts": ..., "p": "Reinicio Parasimpático", "c": 60, ... }],
  "hrvLog": [{ "rmssd": 45, "source": "ble", ... }],
  "instruments": [{ "instrumentId": "pss-4", "score": 6, "level": "moderate" }],
  "chronotype": { "type": "intermediate", "label": "Intermedio", "score": 12, ... },
  "firstDone": true,
  "streak": 1,
  "coherencia": 60
}
```

### Branch evaluation en captura 4

- `evaluateEngineHealth(state)`: `totalSessions=1 < coldStartSessions=5` → `dataMaturity="cold-start"` ✓
- HomeV2 línea 41: `if (health.dataMaturity === "cold-start")` → renderea `<ColdStartView />` ✓
- ColdStartView buildActions con state arriba:
  - `!hasFirstSession (1>0)` → false → primera **OCULTA**
  - `!hasChronotype` → chronotype set → false → cronotipo **OCULTA**
  - `!hasHrv (1)` → false → hrv **OCULTA**
  - `!hasPss4 (1 entry)` → false → pss4 **OCULTA**
- `actions = []` → `actions.map()` no renderea nada
- ColdStartView siempre renderea greeting `<h1>Hola.</h1>` + `<p>Vamos a conocerte.</p>` + section "EMPEZAR POR AQUÍ" — pero sin nada debajo

**Esto coincide exactamente con el síntoma reportado por el QA.**

---

## Code path analysis (Task 2 + Task 3)

### `src/components/app/v2/HomeV2.jsx:41-51`
```jsx
if (health.dataMaturity === "cold-start") {
  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <ColdStartView greeting={greeting} onAction={(item) => onNavigate?.(item)} />
    </>
  );
}
```
- Branch logic exhaustivo: cold-start O personalized.
- **NO hay branch para `dataMaturity === "learning"`** (1 ≤ totalSessions < 20).
- "learning" cae al default `personalized` que renderea `<PersonalizedView>` con `composite=0`, `recommendation=null`, datos prácticamente vacíos.
- Pero MIENTRAS totalSessions < 5, el branch cold-start se mantiene.

### `src/lib/neural/config.js:419-420`
```js
coldStartSessions: 5,
learningSessions: 20,
```
- 5 sesiones para salir de cold-start.
- 20 sesiones para llegar a personalized maduro.

### `src/lib/neural/health.js:43-47`
```js
const dataMaturity = totalSessions < cfg.coldStartSessions
  ? "cold-start"
  : totalSessions < cfg.learningSessions
    ? "learning"
    : "personalized";
```
- Función pura. `totalSessions` viene de `state.history.length` (no de `state.totalSessions` field — defensive).
- Post-1ª sesión: `totalSessions=1 < 5` → "cold-start".

### `src/components/app/v2/home/ColdStartView.jsx:33-101`
Estructura render exacta:

```jsx
return (
  <>
    <section data-v2-greeting>
      <h1>{greeting}</h1>           {/* "Hola." */}
      <p>{subtitle}</p>             {/* "Vamos a conocerte." */}
    </section>
    <section data-v2-onboarding aria-label="Empezar por aquí">
      <div>EMPEZAR POR AQUÍ</div>   {/* siempre visible */}
      {actions.map((a) => <ActionRow key={a.id} item={a} onAction={onAction} />)}
      {/* ❌ NO HAY: actions.length === 0 ? <EmptyState /> : ... */}
    </section>
  </>
);
```

**Confirmado:** NO hay empty state fallback cuando `actions=[]`.

### `src/components/app/v2/home/ColdStartView.jsx:108-179` — buildActions filters

| Card | Filter exacto | Se filtra cuando |
|---|---|---|
| `primera` | `if (!hasFirstSession)` con `hasFirstSession = (totalSessions \|\| 0) > 0` | Tras 1ª sesión completa |
| `cronotipo` | `if (!hasChronotype)` con `hasChronotype = chronotype != null` | Onboarding con rMEQ O retake |
| `hrv` | `if (!hasHrv)` con `hasHrv = safeHrvLog.length > 0` | 1ª medición HRV |
| `pss4` | `if (!hasPss4)` con `hasPss4 = safeInstruments.some(e => e.instrumentId === "pss-4")` | Onboarding PSS-4 O retake |

**4/4 cards son filter-binarias. Cuando todas las gates están true, `actions=[]`.**

---

## Gap arquitectónico (Task 4)

### Brecha confirmada por reproducción

| Estado user | totalSessions | dataMaturity | UI esperada | UI real |
|---|---|---|---|---|
| Post-onboarding skip | 0 | cold-start | ColdStart 4 cards | ✅ ColdStart 4 cards |
| Post-1ª sesión | 1 | cold-start | LearningView con next steps | ❌ ColdStart 3 cards (primera filtrada) |
| Post-1ª sesión + HRV + PSS4 + cronotipo | 1 | cold-start | LearningView | ❌ ColdStart **0 cards** = bug crítico |
| Post-5ª sesión | 5 | learning | LearningView | ❌ PersonalizedView con composite=0 |
| Post-20ª sesión | 20 | personalized | PersonalizedView | ✅ PersonalizedView |

**Doble gap:**
1. **HomeV2 NO maneja "learning"** — cae a personalized (default).
2. **ColdStartView NO maneja `actions=[]`** — pantalla útil entre primera acción y 5ª sesión.

El bug del QA es la intersección de ambos gaps.

---

## Hipótesis evaluation (Task 5)

| Hip | Descripción | Status | Evidencia |
|---|---|---|---|
| **H1** | ColdStartView sin empty state | ✅ **CONFIRMADA** | Code reading línea 96-98: `{actions.map(...)}` sin fallback |
| **H2** | Threshold coldStartSessions=5 demasiado alto | ⚠️ PARCIAL | Razonable para personalization signals (necesitas N≥5 para baseline confiable), pero combinado con filter-binarias produce gap |
| **H3** | Filtros binarios en lugar de progresivos | ✅ **CONFIRMADA** | Card "primera" se filtra con totalSessions>0 (debería transformarse a "Próxima sesión recomendada") |
| **H4** | Branch "learning" no implementado | ✅ **CONFIRMADA** | HomeV2:41 solo chequea "cold-start" — "learning" cae a personalized default |

**Las 4 hipótesis tienen evidencia. Bug es composición de H1 + H3 + H4 (H2 es contributor no causa única).**

---

## Por qué Phase 6D no detectó (Task 6)

### Análisis honesto

1. **SP1 capturas E2E** (`p6d-sp1-02-coldstart-post-onboarding-calma.png`):
   - State capturado: post-onboarding inicial (`totalSessions=0`, instruments populated, chronotype set)
   - 2 cards visibles: primera + HRV — **pasa el test "tras onboarding hay cards"**
   - **NO captura state post-1ª-sesión** (donde el bug emerge)
   - **NO captura state post-1ª-sesión + HRV + PSS-4 + cronotipo** (donde es 0 cards)

2. **SP9 verification** (read-only, este reporte original): confió en capturas SP1 + verificó zIndex/grep/code.
   - No ejecutó flow continuo onboarding → primera sesión → return Tab Hoy.
   - **Asumió que "post-onboarding" era el peor caso**. Era el mejor caso.

3. **Tests V2 actuales**:
   - `HomeV2.smoke.test.jsx` (SP6) testea cold-start branch + personalized branch via `devOverride`.
   - **NO testea state intermedio**: `totalSessions=1, history=[1 entry], instruments=[pss-4], chronotype set, hrvLog=[1]`.
   - `ColdStartView.test.jsx` (SP1) testea filtrado de cards individualmente, **NO testea actions=[]**.

4. **Tests E2E**: NO existen tests Playwright que ejecuten el flow continuo `onboarding → primera sesión → return Tab Hoy → segunda sesión → ...`. Bug del QA no detectado por **gap de cobertura E2E continuo**.

### Lección de testing operativa

El flow `onboarding → primera sesión → return Tab Hoy` era **el flow más obvio del producto**. La ausencia de un test E2E real ejecutando esto explicar por qué Phase 6D pasó verde. Phase 6E debe agregarlo en P0.

---

## Fix recommendations (Task 7) — sin implementar

### Fix A — Empty state en ColdStartView (P0 immediate, ~25 LoC, low risk)

**Approach:** branch `actions.length === 0 ? <EmptyColdStart /> : actions.map(...)` en ColdStartView.

```jsx
// src/components/app/v2/home/ColdStartView.jsx
{actions.length === 0 ? (
  <article data-v2-coldstart-empty style={{ /* card style ADN */ }}>
    <div style={{ /* eyebrow mono cyan */ }}>YA EMPEZASTE</div>
    <h2 style={{ /* title 24px light */ }}>Sigues construyendo tu baseline.</h2>
    <p style={{ /* body */ }}>
      Necesitas algunas sesiones más para ver tu trayectoria personalizada.
    </p>
    <button onClick={() => onAction?.({ action: "first-session" })}>
      Nueva sesión
    </button>
  </article>
) : (
  actions.map((a) => <ActionRow key={a.id} item={a} onAction={onAction} />)
)}
```

- **Complexity:** ~25 LoC.
- **Risk:** Bajo (cambio aditivo + branch nuevo en mismo componente).
- **Resuelve:** El síntoma exacto del QA (pantalla con header + cards vacío).
- **NO resuelve:** UX gap entre cold-start y personalized para sessions 2-4 (sigue mostrando "EMPEZAR POR AQUÍ" tono onboarding).

### Fix B — Reducir coldStartSessions threshold (1 LoC, medium risk)

```js
// src/lib/neural/config.js:419
coldStartSessions: 1,  // antes: 5
```

- **Complexity:** 1 LoC.
- **Risk:** Medio. Cambia engine logic — `dataMaturity === "personalized"` se activa con totalSessions=1, y `<PersonalizedView>` requiere `composite`, `recommendation`, `activeProgram`, etc. que pueden ser `null`/`0` con history=1.
- **Probable cascade**: HeroComposite mostrará "0%", recommendation card vacía, dimensions con `focus=50, calm=50, energy=50` defaults. UX confuso ("personalizado" pero sin datos personalizados).
- **NO recomendado solo** sin Fix C complementario.

### Fix C — Branch "learning" intermedio en HomeV2 (Phase 6E, ~80 LoC, medium risk)

**Approach:** implementar `<LearningView>` específico para sessions 1-19.

```jsx
// HomeV2.jsx
if (health.dataMaturity === "cold-start") {
  return <ColdStartView />;
}
if (health.dataMaturity === "learning") {
  return <LearningView totalSessions={...} sessionsToBaseline={5 - totalSessions} ... />;
}
return <PersonalizedView />; // 20+ sessions
```

LearningView contenido:
- Greeting acorde ("Hola, [intent]")
- Progress indicator: "Sesión X de 5 hasta tu baseline"
- Próxima sesión recomendada (engine puede recomendar con N=1 via fallback circadian)
- Mini-stats acumulados (sparkline 7d / dimensiones simples)
- CTA "Nueva sesión" siempre visible

- **Complexity:** ~80 LoC componente nuevo.
- **Risk:** Medio. Requiere copy decisions + diseño visual ADN.
- **Resuelve:** Gap completo entre primera sesión y maduración del motor. UX premium.

### Recomendación combo

| Fase | Fix | Justificación |
|---|---|---|
| **P0 hotfix immediate** | **Fix A** | 25 LoC bajo riesgo + blinda contra el síntoma exacto del QA + ship-able mismo día |
| **Phase 6E** | **Fix C** | UX premium adecuada para producto B2B + bridge architectónico real |
| **NO recomendado** | Fix B aislado | Cascade de UI bugs en PersonalizedView con data insuficiente |

---

## Tests anti-regression requeridos (Task 8)

### Test 1 — ColdStartView empty state

```js
describe('ColdStartView — Phase 6E follow-up', () => {
  test('renderiza empty state cuando todas las acciones completadas (actions=[])', () => {
    useStore.setState({
      totalSessions: 1,
      history: [{ ts: Date.now(), c: 60, p: "x" }],
      instruments: [{ instrumentId: "pss-4", ts: Date.now(), score: 6 }],
      chronotype: { type: "intermediate", ... },
      hrvLog: [{ rmssd: 45, ts: Date.now() }],
    });
    const { container } = render(<ColdStartView greeting="Hola" onAction={() => {}} />);
    // Tras Fix A:
    expect(container.querySelector('[data-v2-coldstart-empty]')).toBeTruthy();
    expect(container.textContent).toMatch(/sigues construyendo|nueva sesión/i);
  });
});
```

### Test 2 — buildActions returns []

```js
test('buildActions retorna [] cuando todas las gates están true', () => {
  const actions = buildActions({
    firstIntent: "calma",
    chronotype: { type: "intermediate" },
    instruments: [{ instrumentId: "pss-4" }],
    totalSessions: 1,
    hrvLog: [{ rmssd: 45 }],
  });
  expect(actions).toEqual([]);
});
```

### Test 3 — HomeV2 NUNCA renderea pantalla central vacía

```js
const intermediateStates = [
  { totalSessions: 1, instrumentsCount: 1, hrvCount: 1, chronoSet: true },
  { totalSessions: 2, instrumentsCount: 0, hrvCount: 0, chronoSet: false },
  { totalSessions: 4, instrumentsCount: 1, hrvCount: 1, chronoSet: true },
];
intermediateStates.forEach((s, i) => {
  test(`HomeV2 estado intermedio #${i} muestra contenido accionable`, () => {
    useStore.setState({ /* construir state */ });
    const { container } = render(<HomeV2 onNavigate={() => {}} onBellClick={() => {}} />);
    // Verifica que hay AL MENOS un card o un CTA visible
    const actionableElements = container.querySelectorAll(
      '[data-v2-onboarding-row], button:not([aria-label*="alir"]):not([aria-label*="bell" i])'
    );
    expect(actionableElements.length).toBeGreaterThan(0);
  });
});
```

### Test 4 — E2E Playwright real

```js
// e2e/onboarding-to-first-session.spec.js
test('flow real: onboarding → primera sesión → Tab Hoy NUNCA stuck con 0 cards', async ({ page }) => {
  await page.goto('/app');
  // ... welcome + skip calibration
  await expect(page.locator('[data-v2-onboarding-row="primera"]')).toBeVisible();
  await page.click('[data-v2-onboarding-row="primera"]');
  // ... completar player
  await expect(page.locator('[data-v2-greeting]')).toBeVisible();
  // ASSERTION CRÍTICA:
  const cardsCount = await page.locator('[data-v2-onboarding-row]').count();
  const emptyState = await page.locator('[data-v2-coldstart-empty]').count();
  // Debe tener cards O empty state — nunca ambos vacíos:
  expect(cardsCount + emptyState).toBeGreaterThan(0);
});
```

**Coverage gap a cerrar Phase 6E:** establecer disciplina de E2E continuos `onboarding → primera sesión → returns to Tab Hoy → segunda sesión → ...` para todas las cohortes de user (N=0,1,3,5,10,20).

---

## Comparativa con SP9-bis (reporte previo)

SP9-bis concluyó **NOT REPRODUCED**. ¿Por qué se equivocó?

- SP9-bis interpretó "pantalla central negra" como **viewport completo negro** (HomeV2 retornando null).
- En realidad QA reportaba **viewport central vacío** entre header y nav (cards filtradas todas).
- SP9-bis verificó hasta post-onboarding inicial → vio 2-4 cards → declaró bug no reproducible.
- **NO continuó al flow post-1ª-sesión** que es donde el bug emerge.

Lección: el sub-prompt SP9-bis **falló por interpretación literal** del síntoma reportado. El QA dijo "vacío" — no "negro completo". Honest hand-off para futuras versiones del reconnaissance: **pedir captura del QA** ANTES de interpretar.

Este reporte SP9-final corrige la interpretación y reproduce 100%.

---

## Verdict final

✅ **Bug reproducido al 100%** en captura `bug-final-04-coldstart-EMPTY-CARDS-STUCK.png`.

✅ **Root cause identificado**: composición de 3 gaps:
1. ColdStartView sin empty state (H1)
2. Filter binarias en lugar de progresivas (H3)
3. Branch "learning" no implementado (H4)

⚠️ **Severidad CRITICAL UX**: pantalla muerta en momento crítico de retention (post-1ª-sesión positiva).

✅ **Fix path claro**:
- P0 hotfix Fix A (~25 LoC empty state) → ship-able mismo día
- P1 Phase 6E Fix C (~80 LoC LearningView branch) → solución arquitectónica completa

✅ **Tests E2E faltantes identificados** + plan anti-regression específico.

✅ **Lección operativa Phase 6E**: capturas E2E con flow continuo (no solo snapshots de un punto), tests con states intermedios (N=1,2,3,4 sessions), interpretar reportes QA literalmente sin inferir.

---

## Capturas SP9-final generadas

| Archivo | Descripción | Cards visibles |
|---|---|---|
| `bug-final-01-coldstart-initial-skip-all.png` | Welcome stuck step 5 (intermedio) | n/a |
| `bug-final-01-coldstart-initial.png` | ColdStart inicial post-onboarding skip-all | **4** |
| `bug-final-02-protocol-player-mounted.png` | ProtocolPlayer mounted (Reinicio Parasimpático) | n/a |
| `bug-final-03-coldstart-after-1-session.png` | ColdStart post-1ª-sesión (primera filtrada) | **3** |
| **`bug-final-04-coldstart-EMPTY-CARDS-STUCK.png`** | **BUG: ColdStart con 0 cards (síntoma QA)** | **0** |

Path: `screenshots/bug-emergencia-coldstart-stuck/`.

---

**Próximo sub-prompt sugerido:** implementar Fix A (empty state ColdStartView) + tests Test 1/2/3/4 arriba, ship-able como hotfix Phase 6D.1 antes de Phase 6E.
