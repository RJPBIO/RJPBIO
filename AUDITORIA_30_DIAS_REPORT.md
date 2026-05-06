# AUDITORÍA E2E 30 DÍAS — SIMULACIÓN USO REAL

**Fecha:** 2026-05-06
**Modo:** Read-only auditoría con flow real Playwright (Opción A — clicks reales para onboarding, store-direct + reload para sesiones bulk)
**Suite ejecutada:** `tests/e2e/audit/audit-30-days.spec.ts` — 16 tests serial, ~3 min runtime, 100 % completaron
**Capturas:** 27 PNG en `screenshots/audit-30-days/` + `audit-aggregate.json`
**Logs:** `audit-run-6.log` (corrida final)

---

## Resumen ejecutivo

| Severidad | Total | Highlight |
| --- | --- | --- |
| **P0** | 4 | Persistencia de estado **rota cross-reload** (master bug) — explica 6+ síntomas en cascada |
| **P1** | 16 | Cohort transitions broken, ColdStart UI vacía, /app/programs 404, admin SSR vacío sin auth, calibration skip atascado |
| **P2** | 2 | DimensionsRow + WellbeingBanner gates |
| **P3** | 1 | API protegidas piden auth (esperado) |
| **Console errors** | **824** | 712 violaciones CSP `inline-style`, 40 `eval()` no soportado, 6 React warning "setState during render" |
| **Network errors** | **66** | 31× **429 rate-limit en `/api/auth/session`** (ENDPOINT HAMMERED), 23× 429 en `/signin`, resto 401 esperados |

> **Hallazgo dominante** — el master bug es persistencia: cada `page.reload()` regresa al Welcome + cookie consent banner aunque el store haya hecho `saveNow()` exitoso (ver capturas [audit-d20-01-personalized.png](screenshots/audit-30-days/audit-d20-01-personalized.png) y [audit-d29-02-home-with-banner.png](screenshots/audit-30-days/audit-d29-02-home-with-banner.png)). Esto explica **todos** los síntomas reportados por el usuario: "datos no se guardan, pantallas no actualizan, botones no sirven" — porque el state vuelve a `welcomeDone:false` en cada navegación.

> **Contradicción con tests Vitest 4052/4052 verde**: los unit tests usan `fake-indexeddb` con un solo lifecycle. El E2E real con dev server expone que `useStore.init` o el bridge de auth (`useAuthBridge`) están haciendo algo que clava el state — probablemente relacionado con `belongsToUser()` retornando `false` cuando `/api/auth/session` se rate-limita (31× 429).

---

## Bugs por severidad

### P0 — Critical (datos no se guardan, app inutilizable)

#### P0-1 · Persistencia state cross-reload rota (MASTER BUG)
- **Día/test**: Día 2-4, Día 5, Día 10-13, Día 20, Día 21 — 5 síntomas distintos, misma raíz
- **Síntomas observados**:
  - Día 2-4: `history.length=3` cuando se esperaba 4 (Day 1 session perdida tras reload)
  - Día 10-13: `totalSessions=4` cuando se esperaba 9 (acumulado perdido)
  - Día 5: tras 5 sesiones + reload, **NO** aparece LearningView; en su lugar **vuelve el Welcome + cookie banner** ([audit-d5-01-learning-view.png](screenshots/audit-30-days/audit-d5-01-learning-view.png))
  - Día 20: tras 20 sesiones + reload, **NO** aparece PersonalizedView; vuelve Welcome ([audit-d20-01-personalized.png](screenshots/audit-30-days/audit-d20-01-personalized.png))
  - Día 21: HeroComposite renderea texto vacío
- **Repro**: `setupPostOnboarding` + `simulateCompleteSession` + `flushStoreToIDB` + `page.reload()` → state regresa a defaults, `welcomeDone:false`, cookie consent banner reaparece
- **Hipótesis**: `useStore.init({ userId })` invocado por `useAuthBridge` con un `userId` que NO matchea el persistido por `belongsToUser()` → llama `clearAll()` → reseteo. El rate-limit 429 en `/api/auth/session` podría estar provocando un retry-loop que pasa userIds inconsistentes (nulo, undefined, anónimo) al init. Verificar [src/hooks/useAuthBridge.js](src/hooks/useAuthBridge.js) y [src/store/useStore.js:159](src/store/useStore.js#L159) (función `init`).
- **Impacto**: Cualquier usuario que recargue la página o cierre/abra la PWA pierde TODO su progreso. Tests Vitest pasan porque `fake-indexeddb` no simula esto.

#### P0-2 · Calibración: "Saltar este instrumento" no avanza paso
- **Día/test**: Día 0
- **Síntoma**: Tras click en "Saltar este instrumento" en NeuralCalibrationV2 paso 1 (PSS-4), la página queda atascada en `01 / 05` ([audit-d0-03-calibration-failure.png](screenshots/audit-30-days/audit-d0-03-calibration-failure.png))
- **Repro**: Welcome completo → calibration step 1 (PSS-4) → click "Saltar este instrumento" → no avanza al step 2 (rMEQ)
- **Análisis**: El helper `skipAllCalibration` busca botón con `/saltar/i` excluyendo `calibración|al contenido|introducción` y luego `/^siguiente$/i`. Encuentra "Saltar este instrumento" pero el click no produce avance del step
- **Impacto**: Usuario no puede completar onboarding sin contestar los 4 instrumentos (PSS-4 + rMEQ + MAIA-2 + HRV ~50 ítems). El skip individual está roto.

#### P0-3 · Cohort transition ColdStart → LearningView (totalSessions=5) rota
- **Día/test**: Día 5
- **Síntoma**: Tras 5 sesiones simuladas + reload, `[data-v2-learning-progress]` NO visible en HomeV2
- **Análisis**: Probablemente cascading de P0-1 (state se pierde, totalSessions vuelve a 0, branch evaluator devuelve `cold-start`). PERO confirma que tests Phase 6E SP-B "verde" no cubren el path completo cross-reload con auth-bridge en juego
- **Impacto**: Usuarios con 5+ sesiones no ven el track Learning prometido

#### P0-4 · Cohort transition Learning → Personalized (totalSessions=20) rota
- **Día/test**: Día 20
- **Síntoma**: Tras 20 sesiones + reload, `[data-v2-hero]` NO visible — Welcome reaparece en su lugar
- **Análisis**: Mismo patrón que P0-3, cascading de P0-1
- **Impacto**: Promesa central (motor neural personalizado tras baseline 20 sesiones) no se entrega

---

### P1 — High (botones no funcionan, navegación rota)

#### P1-1 · Tab Hoy no renderea ColdStart action cards ni empty state (Día 1)
- Selector `[data-v2-coldstart-empty], [data-v2-onboarding-row]` count=0 inmediatamente tras onboarding
- Repro: post-onboarding (totalSessions=0) → Tab Hoy queda vacío sin acciones siguientes
- Cascading parcial de P0-1, pero también podría ser que `setupPostOnboarding` con `skipAllInstruments=true` no satisface las condiciones de mount de ColdStartView

#### P1-2 · `/app/programs` devuelve 404
- Sub-prompt SP-B menciona el issue pero no se ha creado page
- Captura: [audit-d9-01-programs-page.png](screenshots/audit-30-days/audit-d9-01-programs-page.png)
- Solo existen `/app/program/today` y `/app/program/timeline`
- Usuarios que esperan listado de programas (Burnout Recovery, etc.) no tienen entrada UI

#### P1-3 · `/app/program/today` renderea body casi vacío sin programa activo (Día 14)
- Sin auth + sin programa server-side, la page devuelve <50 chars de contenido
- Falta empty state ("No tienes programa activo — explorar programas")

#### P1-4 a P1-7 · Bottom nav tabs todos faltantes durante Día 15-19
- Selectors `[data-v2-tab="datos|coach|perfil|hoy"]` cuentan 0 elementos
- BottomNavV2.jsx SÍ usa `data-v2-tab={tab.id}` ([BottomNavV2.jsx:44](src/components/app/v2/BottomNavV2.jsx#L44))
- Probable causa: la page redirigió a `/signin` (network errors muestran 23× 429 en `/signin`) por algún auth check que falla durante los reloads. Si la app no monta `AppV2Root`, no hay BottomNav
- Impacto: en cualquier sesión donde el auth-bridge falle (rate-limit 429 frecuente), el usuario pierde la navegación entre tabs

#### P1-8 · HeroComposite renderea texto vacío (Día 21)
- Cascading de P0-4 (PersonalizedView no monta) o estado vacío

#### P1-9 a P1-12 · Admin routes renderean body vacío sin auth (Día 30)
- `/admin/reportes/ejecutivo`, `/admin/programs/adherence`, `/admin/wellbeing/aggregate`, `/admin/nom35`
- Esperable que requieran auth, pero la página debería mostrar redirect-to-signin con copy claro, no `<body>` casi vacío
- Capturas: [audit-d30-admin-*.png](screenshots/audit-30-days/)

#### P1-13 · LearningView stats grid no renderea (Día 5)
- `[data-v2-learning-stats]` count=0 — cascading de P0-3

#### P1-14 · LearningView recommendation no visible (Día 5)
- `[data-v2-recommendation]` count=0 — cascading de P0-3

#### P1-15 · Counter sesiones desfasado (Día 10-13)
- `totalSessions=4` cuando deberían ser 9 — cascading de P0-1

#### P1-16 · Audit fallback: onboarding real falló
- Documentación de que la auditoría usó setupPostOnboarding tras P0-2

---

### P2 — Medium

#### P2-1 · DimensionsRow no encontrada por selector
- `[data-v2-dimensions], [data-v2-dimensions-row]` no existen en DOM
- Verificar [src/components/app/v2/home/DimensionsRow.jsx](src/components/app/v2/home/DimensionsRow.jsx) — ¿exporta `data-v2-dimensions`?
- Cascading parcial de P0-4

#### P2-2 · WellbeingBanner gate no se cumple (Día 29)
- `[data-v2-wellbeing-banner]` no aparece con `totalSessions≥1`
- Phase 6F SP-F decision A3: banner solo si user tiene actividad. Gate no se dispara. Verificar [src/components/app/v2/wellbeing/WellbeingBanner.jsx](src/components/app/v2/wellbeing/WellbeingBanner.jsx)

---

### P3 — Low (informational)

#### P3-1 · Program start API requiere auth (esperado)
- `POST /api/v1/me/program/start` devuelve 401 sin sesión — comportamiento correcto, documentado para señalar gap de cobertura del audit (no se valida end-to-end con user logged-in)

---

## Bugs por feature

### Onboarding (Día 0)
- P0-2 — Calibración skip individual atascado en step 1
- Welcome 5 pasos OK, intent picker OK
- Hard reload tras onboarding aparentemente preserva state (en este test específico) pero el patrón global muestra que reloads posteriores SÍ pierden state

### ColdStart / HomeV2 (Días 1-4)
- P1-1 — ColdStart action cards no renderean post-onboarding
- P0-1 — sesión completada se pierde tras reload entre tests (cross-test = cross-reload real-world equivalente)

### LearningView (Día 5)
- P0-3 — Branch transition rota (cascading de P0-1)
- P1-13, P1-14 — sub-componentes no montan

### HRV / Instruments (Días 6-8)
- HRV log via store **OK** (no bug detectado en append + flush + reload dentro del mismo test)
- PSS-4 retake **OK** dentro del test, pero P0-1 pierde el incremento entre tests
- **Cobertura faltante**: cámara HRV, BLE HRV, MAIA-2 — requieren input de sensor / 32 ítems

### Programas adaptativos (Días 9-14, 28)
- P1-2 — `/app/programs` 404
- P1-3 — `/app/program/today` empty state pobre
- API `/api/v1/me/program/{start,active,abandon,reEval}` retornan 401 — no validables sin auth (P3-1)
- **Cobertura faltante**: programa real (Burnout Recovery), adherence, lag detection, re-eval mid-programa, completion. **Todos requieren auth + server state**.

### Bottom Navigation (Días 15-19)
- P1-4 a P1-7 — tabs no encontrables (probablemente porque /app redirigió a /signin tras sesión 429-rate-limited)

### PersonalizedView (Días 20-27)
- P0-4 — branch transition rota
- P1-8 — HeroComposite vacío
- P2-1 — DimensionsRow no encontrada

### Wellbeing (Día 29)
- P2-2 — Banner gate no se dispara

### Admin B2B (Día 30)
- P1-9 a P1-12 — 4 rutas con body vacío sin auth

### Cross-cutting

#### Console errors (824 totales)
| Cantidad | Tipo | Severidad real |
| --- | --- | --- |
| **712** | CSP `style-src` violations en inline styles JSX | **P1 si en prod** — Framer Motion + tokens.js usan `style={{}}` JSX que necesitan nonce CSP. Si CSP en prod no permite inline-style con nonce, todo el styling rompe |
| **40** | `eval() not supported` (React dev mode) | **P3** — solo dev mode, React 19 dev usa eval; producción está OK |
| **6** | "Cannot update a component while rendering a different component" | **P1** — bug real de React. setState llamado durante render (probable HomeV2 ↔ useStore sub) |
| **54** | 429 Failed-to-load (cascading de network 429 abajo) | derivado |

#### Network errors (66 totales)
| Cantidad | Endpoint | Status | Severidad |
| --- | --- | --- | --- |
| **31** | `GET /api/auth/session` | **429** | **P0** — auth session hammered, rate-limit aggressive. Con cada page mount/reload se llama; ratio 31/16 tests ≈ 2 calls/test promedio. En producción usuarios reales con tabs múltiples superarán el límite trivialmente |
| **23** | `GET /signin?callbackUrl=...` | **429** | **P1** — derivado del anterior; signin redirect también rate-limited |
| 6 | `GET /api/v1/me/program/active` | 401 | esperado sin auth |
| 2 | `GET /api/v1/me/neural-priors` | 401 | esperado |
| 2 | `GET /api/v1/me/burnout?days=28` | 401 | esperado |
| 1 | `GET /app/programs` | 404 | duplicate de P1-2 |
| 1 | `POST /api/v1/me/program/start` | 401 | esperado |

> **El 429 en `/api/auth/session` es la pista más fuerte para P0-1**: si `useAuthBridge` recibe 429, podría estar llamando `init()` con userId nulo o stale, que dispara `clearAll()` por mismatch en `belongsToUser`.

---

## Performance baseline (observado)

| Acción | Tiempo medido | Comentario |
| --- | --- | --- |
| Page load `/app` (cold) | ~2-4 s con Turbopack dev | aceptable dev-mode |
| ProtocolPlayer mount | **NO MEDIDO** — auditoría usó `simulateCompleteSession` (store-direct) por costo de 60-120 s por sesión real |
| Tab switch | **NO MEDIDO** — bottom nav tabs no encontrados (P1-4 a P1-7) |
| Welcome → Calibration → /app | ~24 s en test (incluye ~16 s del flow Welcome real + ~8 s de skipAllCalibration que falla en step 1) |

> **Cobertura faltante de auditoría**: tab switches, ProtocolPlayer real (audio/respiración), HRV cámara, MAIA-2 (32 ítems), programa server-side, admin con role MANAGER+ (auth requerida).

---

## Recomendación priorización fix

### Fix1 — P0 immediate (próximo SP)
1. **P0-1 · Persistencia state cross-reload** — el bug raíz. Investigar:
   - [src/store/useStore.js:82-86](src/store/useStore.js#L82) `belongsToUser`
   - [src/hooks/useAuthBridge.js](src/hooks/useAuthBridge.js) — qué pasa cuando `/api/auth/session` da 429
   - Posible fix: si `/api/auth/session` falla con 5xx/429, NO invocar `init({ userId })` con userId stale — preservar el state ya cargado
2. **P0-2 · Calibration skip individual** — clickear "Saltar este instrumento" debe avanzar al siguiente instrumento. Probable bug en NeuralCalibrationV2 step transition
3. **Auth session rate-limit** — auditar middleware/rate-limiter de `/api/auth/session`. 31 calls / 16 tests = 2 calls promedio por test es agresivo; en prod con tab switching cualquiera lo dispara

### Fix2 — P1 (segundo SP)
1. **P1-2** — Crear page `/app/programs` con listado de programas disponibles (Burnout Recovery, Sleep, Focus, etc.)
2. **P1-3** — Empty state copy en `/app/program/today` cuando no hay programa activo
3. **P1-4 a P1-7** — Investigar por qué BottomNavV2 no monta en algunos reloads (probable redirect a /signin cuando session 429)
4. **CSP inline-style 712 violations** — auditar middleware nonce + tokens.js + componentes que usan `style={{}}` JSX. En prod podría romper styling si CSP estricto se aplica
5. **React "setState during render" warning (6×)** — tracear en dev tools, identificar componente que llama setState durante render

### Fix3 — P2 (tercer SP)
1. **P2-1 · DimensionsRow** — verificar `data-v2-dimensions` attr en componente
2. **P2-2 · WellbeingBanner gate** — debug por qué `totalSessions≥1` no dispara mount en HomeV2 line 51

### Defer Phase 6G+
- P3-1 (esperado)
- Admin auth flow (requiere fixture de user MANAGER+)
- Cobertura ProtocolPlayer real, MAIA-2, cámara HRV — sub-prompts dedicados con ProtocolPlayer.spec.ts pattern

---

## Capturas críticas

| Captura | Contenido | Hallazgo |
| --- | --- | --- |
| [audit-d0-01-fresh.png](screenshots/audit-30-days/audit-d0-01-fresh.png) | Estado fresh tras `resetAppState` | baseline |
| [audit-d0-02-welcome-final.png](screenshots/audit-30-days/audit-d0-02-welcome-final.png) | Welcome tras 5 pasos completos + intent picker Calma | OK |
| [audit-d0-03-calibration-failure.png](screenshots/audit-30-days/audit-d0-03-calibration-failure.png) | **P0-2** — calibration atascado en PSS-4 step 1 | bug visible |
| [audit-d0-05-after-reload-ok.png](screenshots/audit-30-days/audit-d0-05-after-reload-ok.png) | Post-reload con state intacto | OK aquí pero P0-1 ataca tests posteriores |
| [audit-d5-01-learning-view.png](screenshots/audit-30-days/audit-d5-01-learning-view.png) | **P0-3** — esperaba LearningView, muestra Welcome | master bug visible |
| [audit-d20-01-personalized.png](screenshots/audit-30-days/audit-d20-01-personalized.png) | **P0-4** — esperaba PersonalizedView, muestra Welcome | master bug confirmado |
| [audit-d29-02-home-with-banner.png](screenshots/audit-30-days/audit-d29-02-home-with-banner.png) | **P0-1** — tras 14+ sesiones, vuelve Welcome | master bug evidencia |
| [audit-d30-admin-reportes-ejecutivo.png](screenshots/audit-30-days/audit-d30-admin-reportes-ejecutivo.png) | Admin route empty | P1-9 |
| [audit-aggregate.json](screenshots/audit-30-days/audit-aggregate.json) | JSON con todos los bugs + console + network | machine-readable |

---

## Cobertura honesta

### Lo que SÍ se auditó
- Welcome flow real (5 pasos + intent picker)
- Calibration entry + skip-all attempt (falló — bug detectado)
- State persistence inmediato (mismo test) — saveNow + flush funciona dentro del test
- State persistence cross-reload — **rota** (master bug)
- Cohort branches ColdStart/Learning/Personalized — todos comprometidos por master bug
- Bottom nav navegación — comprometida por reloads
- Routes públicas: `/app`, `/app/programs`, `/app/program/today`, `/app/wellbeing`
- Admin routes (smoke, sin auth): 4 rutas
- Console + network error capture (824 + 66)

### Lo que NO se auditó (cobertura faltante)
1. **Welcome real con instrumentos completos** (PSS-4 + rMEQ + MAIA-2 32 ítems + HRV) — skip-all fue el path mínimo, y falló
2. **ProtocolPlayer real** — 60-120 s por sesión × 30 sesiones = 30-60 min adicionales; usé `simulateCompleteSession` (store-direct)
3. **Audio guía respiración** — requiere ProtocolPlayer real
4. **Cámara HRV / BLE HRV** — requiere permisos browser + sensor real
5. **Programa server-side end-to-end** — requiere auth (user logged); APIs respondieron 401
6. **Coach LLM** — requiere auth + LLM key; tab no abrible (cascading P1-4)
7. **Admin con MANAGER+ role** — requiere fixture user; actualmente solo smoke status check
8. **Wellbeing reportes** — depende de programa server-side y HRV trends
9. **Re-eval mid-programa** — depende de programa server-side
10. **K-anon enforcement admin** — depende de auth + datos cohort

> Para llenar la cobertura faltante, próximo sub-prompt necesita:
> - Fixture de user autenticado (signin via NextAuth `signIn("credentials", ...)` directo en setUp)
> - Fixture de programa activo en DB (Prisma seed)
> - Fixture de admin user con role MANAGER en `OrgMember`
> - Mocks de cámara/BLE para HRV path real (o aceptar skip y test solo via manual input)

---

## Próximos pasos sugeridos

1. **Inmediato (mismo día)**: Investigar P0-1 — leer `useAuthBridge.js` + ver si `init()` es llamado con userId stale tras 429. **No commits hasta entender raíz**
2. **Sub-prompt Fix1**: P0-1 + P0-2 + auth rate-limit, con tests E2E que validen reload no pierde state
3. **Sub-prompt Fix2**: P1-2 (page programs), P1-3 (empty state), P1-4 (BottomNav redirect), CSP inline-style audit
4. **Defer**: Phase 6G hasta que master bug P0-1 esté cerrado

---

**Disclaimer auditoría**: este reporte se generó con flow E2E parcial (auth no logged in). Los bugs P0-1 son reproducibles localmente sin necesidad de auth — basta correr `npm run test:e2e -- tests/e2e/audit/audit-30-days.spec.ts`. Los bugs cascading (P0-3, P0-4, P1-1, P1-8, P2-1) podrían resolverse parcialmente al fixear P0-1.
