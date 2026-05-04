# E2E Tests — Playwright

## Cuándo usar E2E vs unit/integration

**Unit tests (Vitest) — `npm test`**
- Funciones puras (lib/*, hooks).
- Componentes leaf con render aislado.
- Mocks libres.

**Integration tests (Vitest + Testing Library) — `npm test`**
- Componentes con state Zustand vía `useStore.setState()` injection.
- Cobertura de branches con cohortes prearmadas (rápido, deterministic).
- Excelente para regression guards de logic — pero **NO valida** que el flow real del usuario produzca ese state.

**E2E tests (Playwright) — `npm run test:e2e`**
- Flow completo con clicks reales (Welcome 5 pasos, Calibration 4 instrumentos, etc.).
- **Sin state injection** en welcome/calibration — solo `simulateCompleteSession` usa store directo (ProtocolPlayer real es out-of-scope: 60s+ breath cycle + audio context).
- **Disciplina post-Bug-48**: capturas E2E con flow real, NO state seed pre-loaded.
- Verifica cross-component integration: hidratación IDB, store re-render bidireccional, branch transitions reales.

## Comandos

```bash
# Smoke critical path (corre rápido en CI, ~30s)
npm run test:e2e:smoke

# Bug-48 anti-regression suite completa (manual, ~2-3min)
npm run test:e2e:bug48

# Toda la suite (todos los archivos en tests/e2e/, todos los browsers)
npm run test:e2e

# UI mode (debugging interactivo)
npm run test:e2e:ui
```

## Estructura

```
tests/e2e/
├── README.md                              ← este documento
├── utils/
│   └── helpers.ts                         ← resetAppState, waitForStoreReady, completeWelcome, etc.
├── smoke/
│   └── critical-path.spec.ts              ← 1 test crítico onboarding → 1 sesión
├── onboarding-to-multi-sessions.spec.ts   ← Bug-48 suite (4 escenarios)
├── a11y.spec.ts                           ← legacy
├── protocol-select.spec.ts                ← legacy
├── session.spec.ts                        ← legacy
└── smoke.spec.ts                          ← legacy (marketing + PWA)
```

## Convenciones

1. **Reset state al inicio de cada test** vía `resetAppState(page)` — limpia `localStorage` + IndexedDB (cross-test isolation).
2. **Esperar store ready** vía `waitForStoreReady(page)` antes de assertions sobre data — store.init() es async, sin esto hay race conditions.
3. **`test.describe.configure({ mode: "serial" })`** en suites que usan flow continuo onboarding (evita race condition entre tests paralelos compartiendo IDB).
4. **Capturas con flow real** — usar `simulateCompleteSession` / `simulateAllGatesCompleted` SOLO cuando el test no necesita verificar la integración real del componente disparando el evento (e.g. el ProtocolPlayer real). En caso de duda, **usa clicks reales**.
5. **Assertions Bug-48** — usar `assertHomeViewportNotEmpty(page)` en cualquier test que toque Tab Hoy. Garantiza que ColdStart/Learning/Personalized SIEMPRE rendea contenido accionable.

## Bug-48 anti-regression coverage

`onboarding-to-multi-sessions.spec.ts` cubre:

| # | Escenario | Branch esperado | Selector clave |
|---|---|---|---|
| 1 | Reproducer original (skip-all + 1 session + all gates) | cold-start | `[data-v2-coldstart-empty]` |
| 2 | 5 sessions consecutive | learning | `[data-v2-learning-progress]` |
| 3 | 20 sessions consecutive | personalized | `[data-v2-hero]` |
| 4 | Boundary N=1,2,3,4 con all gates true → transición N=5 a learning | cold-start (N=1..4), learning (N=5) | `[data-v2-coldstart-empty]` + transición `[data-v2-learning-progress]` |

Suite completa SP-A unit/integration cubre la matriz lógica (vía
`useStore.setState` injection). Esta suite E2E SP-B verifica que el
flow REAL del usuario produce esos states — el gap exacto que enmascaró
Bug-48 hasta que QA externo lo reportó.

## Lección operativa

Phase 6D SP1 capturas usaban state injection que enmascaró Bug-48
(ColdStart Stuck post-primera-acción). SP-B establece disciplina
nueva: cualquier captura nueva en `screenshots/` que demuestre un
fix UI debe venir de un test E2E con clicks reales (no DOM injection
ni state seed pre-loaded).

Excepción documentada: `simulateCompleteSession` usa store directo
porque ProtocolPlayer real es out-of-scope (60s+ breath cycles +
audio context que Playwright headless no soporta confiablemente).
El payload simulado refleja exactamente lo que `closeSession` real
dispara al final del player.

## CI integration

**Actualmente:** smoke spec corre vía `npm run test:e2e:smoke` (manual
en local; agregar a CI workflow es Phase 6E SP-C decision).

**Deferred a SP-C:**
- GitHub Actions job para smoke en cada PR.
- Decision: full suite en cada PR (caro) vs solo smoke (rápido).
- Vercel preview deployment URL como `E2E_BASE_URL` para test contra
  build real, no dev server.

## Configuración

`playwright.config.ts` (root) define:
- 5 projects (chromium, firefox, webkit, mobile-chrome, mobile-safari)
- baseURL: `process.env.E2E_BASE_URL || "http://localhost:3000"`
- webServer: `npm run dev` (local), `npm run build && npm start` (CI)
- locale: `es-ES`
- retries: 2 en CI, 0 local

Smoke + bug48 scripts forzan `--project=chromium` para velocidad.
Run `npm run test:e2e` (sin args) para correr en TODOS los browsers.
