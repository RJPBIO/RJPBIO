# Scripts dev — seed / clear / capture

Toolkit infraestructural para SP-2/SP-3. Cero impacto en runtime de producción.

## Arquitectura — leer antes de modificar

El store del PWA es **local-first IndexedDB cifrado** ([src/store/useStore.js](../src/store/useStore.js), `STORE_VERSION = 21`).
`state.history` vive en el browser del usuario, **no en Postgres/Prisma**.
Las tablas Prisma (`NeuralSession`, etc.) almacenan agregados B2B k-anónimos ≥ 5 — distintas.

Implicación: para poblar `PersonalizedView` necesitamos escribir en IndexedDB del browser, **no en Prisma directo**. Approach correcto: Playwright headless → `window.__BIO_STORE__` (exposed by useStore.js:357 en dev) → setState + flush IDB.

## dev-seed.mjs

Pobla test account con N sesiones fictionales realistas.

```bash
# 30 sesiones → PersonalizedView (engine personalizado)
node scripts/dev-seed.mjs --email owner@demo.local --sessions 30

# 7 sesiones → LearningView
node scripts/dev-seed.mjs --email owner@demo.local --sessions 7

# 3 sesiones → ColdStartView (active)
node scripts/dev-seed.mjs --email owner@demo.local --sessions 3

# 0 → cold-start fresh (onboarding BioIgnitionWelcomeV2)
node scripts/dev-seed.mjs --email owner@demo.local --sessions 0
```

### Distribución honest

| Outcome    | % | Notas |
|------------|---|-------|
| Completed  | 70% | bioQ.quality `alta`/`premium`, completeness ≥ 0.85 |
| Partial    | 20% | bioQ.quality `estándar`/`ligera`, completeness 0.4–0.75 |
| Gap (skip) | 10% | sin entry — gap de 1–2 días, rompe streak |

### HRV evolución

- rmssd inicial ~38–45 ms, final ~50–58 ms (+12 ms over N sessions).
- Daily variance ±8 ms (no flat).

### Streak realista

- 30 sessions → streak final ~14–18 días (no 30 lineal).
- Multi-session days ~15% (2 sesiones mismo día).

## dev-clear.mjs

Limpia state local del test user (history, moodLog, hrvLog, achievements, etc).

```bash
node scripts/dev-clear.mjs --email owner@demo.local
```

Preserva el User row en DB. Para borrar User → Prisma Studio o SQL manual.

## Estados resultantes (capturables para SP-2)

| `--sessions` | dataMaturity | View renderada | Componente |
|---|---|---|---|
| 0   | n/a              | BioIgnitionWelcomeV2 onboarding | (overlay sobre AppV2Root) |
| 1–4 | cold-start active| ColdStartView | `src/components/app/v2/home/ColdStartView.jsx` |
| 5–13| learning         | LearningView  | `src/components/app/v2/home/LearningView.jsx` |
| 14+ | personalized     | PersonalizedView | `src/components/app/v2/home/PersonalizedView.jsx` |

Thresholds canónicos: `src/store/useStore.js:33-34` (alineados con `NEURAL_CONFIG.health.coldStartSessions=5 / learningSessions=14`).

## capture-pwa-mockups.mjs

Genera 5 PNGs reales de la PWA en iPhone 15 Pro device emulation para uso en /why marketing site.

```bash
# Pre-requisito: seed la cuenta primero con N=20+ para PersonalizedView visible
node scripts/dev-seed.mjs --email owner@demo.local --sessions 20

# Captura los 5 mockups
node scripts/capture-pwa-mockups.mjs --email owner@demo.local
```

Output: `public/screenshots/why/*.png` (5 capturas).
Consumibles desde [`MockupFrame`](../src/components/brand/MockupFrame.jsx) component.

## Safety

Los 3 scripts ejecutan **safety guards**:

- ✗ Refuse si `NODE_ENV=production`.
- ✗ Refuse si `--base-url` no es `localhost`.
- ✗ Refuse si `DATABASE_URL` contiene `supabase.com|.vercel-postgres.com|prod|production`.
- ✗ Refuse si `--email` no provisto o user no existe en DB.

**NUNCA usar en producción.** Estos scripts requieren `DATABASE_URL` apuntando a desarrollo/staging y `NODE_ENV=development`.

## Pre-requisito común

1. Dev server corriendo en `localhost:3000` (`npm run dev`).
2. Test user existe en DB (creado vía `npm run seed` → `owner@demo.local` + `member@demo.local`, o vía signup OAuth).
3. `AUTH_SECRET` configurado en `.env.local`.
4. Playwright + browser instalado (`npx playwright install chromium` si primera vez).
