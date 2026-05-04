# BUG EMERGENCIA — HOMEV2 CONTENIDO VACÍO POST-ONBOARDING

**Fecha:** 2026-05-04
**Modo:** Read-only diagnóstico
**Severidad reportada:** CRITICAL (producto NO usable post-onboarding)
**Status diagnosis:** ⚠️ **NOT REPRODUCED en local dev** — bug del QA NO se manifiesta tras 2 escenarios E2E flow real
**Detectado por:** QA externo (NO Phase 6D Playwright captures, NO en este reconocimiento read-only)

---

## TL;DR honest

**Phase 6D NO introdujo regresión que produzca "pantalla central negra vacía post-onboarding"** en local dev contra `main` actual (commit `5398ab4`). Dos escenarios reales E2E (instrumentos completos + skip-all calibration) renderean **ColdStartView correctamente** con cards filtradas según el state real del store.

El reporte del QA es **real** (no se inventa) pero **no se reproduce en este ambiente** con flow real fresh. Las hipótesis técnicas H7/H9/H10/H11/H12 del sub-prompt **están refutadas por evidencia** — el code path siempre cae en uno de los dos branches con render no-null. ColdStartView siempre renderea greeting + section header "EMPEZAR POR AQUÍ" aunque actions=[].

**Recomendación operativa**: solicitar al QA evidencia ambiental (browser/device/version build commit hash/screenshot devtools console + IDB inspection) ANTES de implementar fix especulativo. Implementar fix sin reproduce confirmado tiene alto riesgo de breaking algo que ya funciona.

---

## Reproducción intentada en flow real

### Escenario A — Onboarding completo con instrumentos (intent: calma)

**Pasos ejecutados (Playwright real, NO state injection):**

1. `localStorage.clear()` + `indexedDB.deleteDatabase(...)` para reset total
2. Navigate `/app` fresh
3. Welcome paso 1→4: click "Continuar" 4 veces
4. Welcome paso 5: click "Calma" + "Estoy listo"
5. NeuralCalibration paso 1: PSS-4 4 preguntas con "A veces" + "Siguiente" cada una
6. NeuralCalibration paso 2: rMEQ 5 preguntas con opción media + "Siguiente"
7. NeuralCalibration paso 3: MAIA-2 32 preguntas con "A veces" / opción media + "Siguiente"
8. NeuralCalibration paso 4: HRV → "Siguiente" (skip cámara)
9. NeuralCalibration paso 5: Resumen "Calibración completa" → click "Empezar"

**Resultado:**

State runtime real post-onboarding (verificado con `window.__BIO_STORE__.getState()`):
```json
{
  "_loaded": true,
  "welcomeDone": true,
  "onboardingComplete": true,
  "firstIntent": "calma",
  "totalSessions": 0,
  "history": [],            // length 0, isArray:true
  "instruments": [          // length 2 (pss-4 + maia-2; rMEQ va a chronotype)
    {"instrumentId": "pss-4", ...},
    {"instrumentId": "maia-2", ...}
  ],
  "chronotype": {           // SET
    "type": "intermediate",
    "category": "intermediate",
    "label": "Intermedio",
    "score": 12,
    "bestTimeWindow": "midday",
    "ts": 1777895304974
  },
  "neuralBaseline": { /* set */ },
  "hrvLog": []
}
```

**UI renderizada (captura `bug-emergencia-05-tab-hoy-after-onboarding-REAL.png`):**

- ✅ HeaderV2 mounted: "MADRUGADA · 04:48" + bell icon
- ✅ Greeting: "Hola." + "Vamos a conocerte."
- ✅ ColdStartView mounted: "EMPEZAR POR AQUÍ"
- ✅ **2 cards visibles** (filtrado correcto):
  - "Tu primera sesión · Reinicio Parasimpático · 120s · sin protocolo previo necesario"
  - "Mide tu variabilidad cardíaca · 60s con cámara o BLE · primera medición"
- ✅ BottomNav: HOY (active) · DATOS · COACH · PERFIL
- ✅ CrisisFAB: SOS

**Filtrado correcto:**
- Card "primera": `!hasFirstSession` (totalSessions=0) → VISIBLE ✓
- Card "cronotipo": `!hasChronotype` → chronotype set → OCULTA ✓
- Card "HRV": `!hasHrv` (0 entries) → VISIBLE ✓
- Card "PSS-4": `!hasPss4` → instruments tiene pss-4 → OCULTA ✓

### Escenario B — Skip-all calibration (intent: enfoque)

**Pasos:**
1. localStorage + IDB clean
2. Welcome 5 steps + "Enfoque" + "Estoy listo"
3. NeuralCalibration: skip de los 4 instrumentos consecutivamente ("Saltar (incompleto)")
4. Step 5 → "Empezar"

**Resultado:**
- `welcomeDone: true`, `onboardingComplete: true`, `firstIntent: "enfoque"`
- `instruments: []`, `chronotype: null`, `neuralBaseline: null`
- ColdStart renderea **4 cards** (todas las cards visibles porque ningún filter activo): primera + cronotipo + HRV + PSS-4

**Captura `bug-emergencia-07-tab-hoy-skip-all-calibration.png`** confirma render correcto.

### Hard reload (race con IDB hidratación)

- Tras escenario A, navigate `/app` fresh sin clear
- IDB hidrata → ColdStart renderea correctamente
- No race condition observada

---

## Code path analysis (Task 3)

### `HomeV2.jsx` (líneas 24-85)

```jsx
export default function HomeV2({ devOverride = null, onNavigate, onBellClick }) {
  const store = useStore();
  // ... hooks
  const { health, ... } = applyDevOverride({...});

  if (health.dataMaturity === "cold-start") {
    return (<><HeaderV2/><ColdStartView/></>);
  }

  // ... (default branch)
  return (<><HeaderV2/><PersonalizedView/></>);
}
```

**Observaciones críticas:**
- **NO hay branch que retorne null o fragment vacío.** Siempre renderea Header + uno de los dos views.
- `dataMaturity` viene de `evaluateEngineHealth(state)` → `state.history.length < 5 ? "cold-start" : ...`.
- Hooks `useReadiness` y `useAdaptiveRecommendation` retornan null en catch — no rompen el flow.

### `ColdStartView.jsx` (líneas 33-101)

```jsx
return (
  <>
    <section data-v2-greeting>
      <h1>{greeting}</h1>
      <p>{subtitle}</p>
    </section>
    <section data-v2-onboarding>
      <div>EMPEZAR POR AQUÍ</div>
      {actions.map(a => <ActionRow .../>)}
    </section>
  </>
);
```

**Observaciones críticas:**
- **Siempre renderea el greeting H1 + section "EMPEZAR POR AQUÍ"** aún si `actions=[]`.
- Si `actions=[]`, el section "EMPEZAR POR AQUÍ" muestra solo el header sin cards — NO una pantalla negra.
- buildActions filtros son defensivos (Array.isArray fallback, ?? || guards).

### `evaluateEngineHealth` (`src/lib/neural/health.js:37-104`)

```js
const hist = Array.isArray(state?.history) ? state.history : [];
const totalSessions = hist.length;
const dataMaturity = totalSessions < cfg.coldStartSessions
  ? "cold-start"
  : totalSessions < cfg.learningSessions ? "learning" : "personalized";
```

**Observaciones críticas:**
- `cfg.coldStartSessions = 5` (de `neural/config.js:419`).
- Defensive `Array.isArray ? : []` cubre history null/undefined/no-array.
- Función pura, sin side effects.
- Post-onboarding (`history.length === 0`) → `totalSessions = 0 < 5` → `dataMaturity = "cold-start"` ✓

---

## Hipótesis evaluadas

### H7 — TotalSessions threshold incorrecto
**REFUTADA.** El threshold es `< 5` y post-onboarding history.length=0. Branch cold-start se activa correctamente.

### H9 — Conditional rendering retorna null
**REFUTADA.** HomeV2 NO tiene `if (...) return null` antes del JSX. Branch logic exhaustivo (cold-start o personalized).

### H10 — ColdStartView buildActions retorna [] sin empty state
**PARCIALMENTE VÁLIDA pero NO causa pantalla negra.** Si las 4 filtros se activan (chronotype + pss-4 + hrv + history todos populated), `actions=[]` y `actions.map()` no renderea filas. PERO el header "EMPEZAR POR AQUÍ" SÍ se renderea. Eso es content-light, no pantalla negra.

**Caveat:** Esto puede confundirse con "vacío" si el QA esperaba ver cards. **Recomendación de mejora UX** (independiente del bug): empty state si actions=[] del estilo "Ya completaste el onboarding básico — explora Datos / Coach / Perfil".

### H11 — Selector del store retorna undefined
**REFUTADA.** Todos los selectores `useStore(s => s.X)` con defaults via `?.` y `||`. Hooks retornan null en catch sin romper.

### H12 — Branch personalized se activa por error
**REFUTADA.** El único path a personalized requiere `dataMaturity !== "cold-start"`, lo que requiere `history.length >= 5`. Post-onboarding history es vacío.

### Hipótesis ambientales NO descartables (no reproducidas pero plausibles)

| Hipótesis | Plausibilidad | Cómo verificar |
|---|---|---|
| **HE1**: Build vieja en QA (pre-Phase 6D `main` HEAD) | Alta | Pedir commit hash exacto que QA tiene; comparar con `5398ab4` (último Phase 6D) |
| **HE2**: IDB corrupto del user (state pre-Phase 6D persistido sin migración) | Media | Pedir QA ejecutar `localStorage.clear()` + IDB delete + retry |
| **HE3**: iOS Safari específico (rendering bug WebKit con position:fixed + flex children) | Media | Pedir captura con device/UA específico; reproducir en iOS Simulator |
| **HE4**: Race condition tras `setNeuralBaseline` callback async (rare) | Baja | Pedir QA evidence: ¿ocurre siempre o intermitente? |
| **HE5**: Service Worker cacheando bundle viejo | Media | Pedir QA: DevTools → Application → Service Workers → Unregister + hard reload |
| **HE6**: Extensión browser bloqueando inline styles (Privacy Badger, custom CSS) | Baja | Pedir QA: incognito mode test |

---

## Por qué Phase 6D no detectó el bug reportado

Análisis honesto:

1. **Capturas Phase 6D SP1**: usaron `?onboard=skip` URL param + `window.__BIO_STORE__.setState({...})` para forzar state. NO ejecutaron Welcome → Calibration completo. Si el bug es race condition entre `setNeuralBaseline` callback y `setSection("hoy")`, no se manifiesta con setState directo.

2. **SP9 verification (read-only)**: confió en capturas SP1 + verificó zIndex/grep. NO ejecutó flow real onboarding completo (la captura SP9-01 muestra cookie banner + onboarding paso 1/5, pero NO continuó el flow).

3. **3747 tests verde**: son unit + integration. Tests V2 mockean useStore con `useStore.setState({...})`. El flow E2E real `Welcome → 5 instrumentos → Tab Hoy transition` NO está cubierto por ningún test.

4. **Este reconocimiento SP9-bis (read-only)**: SÍ ejecutó flow real (2 escenarios). Bug NO se reproduce. Esto sugiere que el bug del QA es **ambiental** (HE1-HE6), no inherente al code de `main`.

---

## Recomendación operativa

### Antes de implementar fix:

**P0** — Solicitar al QA:
1. **Commit hash exacto** del build que está testeando (¿es `5398ab4` post-Phase 6D, o build anterior?)
2. **Browser + version + OS** + screenshot DevTools console al ocurrir el bug
3. **JSON dump del store runtime** via `JSON.stringify(window.__BIO_STORE__.getState())` cuando ve la pantalla vacía
4. **Reproduce steps exactos** (¿completó instrumentos? ¿saltó? ¿hard reload? ¿navigation?)
5. **¿Es intermitente o reproducible 100%?** Si intermitente, race condition.
6. **Test en incognito** + extensiones disabled

### Si tras evidencia se confirma reproduce:

**Fix recomendado (defensivo aunque H10 no es root cause):** agregar empty state a ColdStartView cuando `actions.length === 0`. Texto sugerido:

```jsx
{actions.length === 0 ? (
  <p style={{ ... }}>
    Ya completaste lo básico. Explora <button>Datos</button> · <button>Coach</button> · <button>Perfil</button>.
  </p>
) : (
  actions.map(a => <ActionRow ... />)
)}
```

Complexity: ~15 LoC. Risk: bajo. NO es el root cause confirmado, pero blinda contra el escenario "ColdStart visible pero sin cards" si surgiera.

### Tests anti-regression a agregar (independiente del bug):

1. **Test E2E real Playwright** (`e2e/onboarding-to-home.spec.js`):
   ```js
   test("flow real onboarding → Tab Hoy renderea ColdStart con greeting", async ({ page }) => {
     await page.goto("/app");
     // ... (5 welcome steps + 5 calibration steps)
     await expect(page.locator('[data-v2-greeting]')).toBeVisible();
     await expect(page.locator('[data-v2-onboarding]')).toBeVisible();
     await expect(page.locator('[data-v2-header]')).toBeVisible();
   });
   ```

2. **Test smoke HomeV2 nunca null**:
   ```js
   it("HomeV2 nunca renderea null en ningún state", () => {
     const cases = [
       { history: [] },
       { history: [{ ts: Date.now(), c: 60 }] },
       { history: Array(5).fill({ ts: Date.now(), c: 60 }) },
       { history: null },
       { history: undefined },
     ];
     for (const state of cases) {
       useStore.setState(state, true);
       const { container } = render(<HomeV2 onNavigate={() => {}} onBellClick={() => {}} />);
       expect(container.querySelector('[data-v2-greeting], [data-v2-hero]')).toBeTruthy();
     }
   });
   ```

3. **Disciplina de tests E2E**: capturas Playwright con flow REAL siempre (clicks reales), NO `setState` injection. Establecer en CI: cualquier captura nueva debe pasar pre-checks que confirmen mounted via clicks no via state seed.

---

## Capturas E2E generadas SP9-bis

| Archivo | Descripción |
|---|---|
| `bug-emergencia-00-fresh-load.png` | Welcome step 1/5 fresh |
| `bug-emergencia-01-welcome-step-final.png` | Welcome step 5/5 (intent picker) |
| `bug-emergencia-02-after-welcome-calma.png` | Welcome stuck (intent picker no seleccionado) |
| `bug-emergencia-03-step4-hrv.png` | Calibration step 4 (HRV) |
| `bug-emergencia-04-step5-final.png` | Calibration step 5 (resumen "Calibración completa") |
| **`bug-emergencia-05-tab-hoy-after-onboarding-REAL.png`** | **Tab Hoy post-onboarding completo — ColdStart con 2 cards (Bug NO reproduce)** |
| `bug-emergencia-06-after-hard-reload.png` | Tab Hoy tras hard reload (race IDB) — sigue OK |
| **`bug-emergencia-07-tab-hoy-skip-all-calibration.png`** | **Tab Hoy post-onboarding skip-all — ColdStart con 4 cards (Bug NO reproduce)** |

---

## Verdict

**Status:** ⚠️ **NOT REPRODUCED** en local dev `main` HEAD (`5398ab4`). 2/2 escenarios reales pasan.

**Implementar fix especulativo:** ❌ NO RECOMENDADO sin evidencia ambiental del QA.

**Próximo paso:** solicitar evidencia QA (commit hash, browser/OS, store dump, repro steps) ANTES de cualquier modificación de código. Bug puede ser ambiental (build vieja, IDB corrupto, browser specific) y no inherente al producto post-Phase 6D.

**Mejora UX independiente** que vale la pena considerar: empty state en ColdStartView cuando `actions=[]` (defensive blinding, ~15 LoC bajo riesgo). Esto NO arregla el bug reportado pero blinda contra confusión "ColdStart visible pero sin cards" en futuros casos. Decisión queda a discreción del usuario después de revisar evidencia QA.

**Lección operativa Phase 6E**: capturas E2E y smoke tests deben usar **flow real** (clicks reales, no `setState` injection). Si Phase 6D hubiera incluido un test E2E real onboarding-to-Tab-Hoy, este reporte de QA nos diría inmediatamente si reproduce o no — sin necesidad de este SP9-bis ad-hoc.
