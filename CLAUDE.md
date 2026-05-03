# CLAUDE.md — Guía de colaboración

## Contexto del proyecto

**BIO-IGNICIÓN** es una PWA local-first de optimización humana. El diferencial es la experiencia sensorial (audio, haptics, binaural, voz, wake-lock) y el motor neural adaptativo en `src/lib/neural.js`.

## Cosas a saber antes de editar

- **`page.jsx` es grande (55 KB) a propósito.** Está bajo refactor progresivo a hooks en `src/hooks/`. No reescribir de una vez; extraer piezas con tests primero.
- **Variables cortas (`st`, `pr`, `bL`) son legacy.** En código nuevo usa nombres completos.
- **Persistencia es async.** `store.init()` es `async`; no asumas estado sincrónico al montar.
- **Nunca añadas `unsafe-inline` ni `unsafe-eval` al CSP.** Cualquier script inline debe recibir el nonce de `middleware.js`.
- **Nada de telemetría por defecto.** El logger solo sale si `NEXT_PUBLIC_LOG_ENDPOINT` está definido.

## Flujo de trabajo

1. Antes de cambiar lógica de dominio, lee `neural.test.js` y añade el caso que vas a soportar.
2. Cambios en `manifest.json` requieren bump de `CACHE_VERSION` en `public/sw.js`.
3. Cambios en persistencia requieren bump de `STORE_VERSION` en `store/useStore.js` y una función de migración en `lib/storage.js`.
4. No commitees archivos `.env*`. Usa `NEXT_PUBLIC_*` solo para valores no sensibles.

## Tests

- `npm run test` debe pasar antes de cada commit.
- Cobertura mínima: 70 % líneas / funciones.
- Usa `vi.useFakeTimers()` para hooks con temporizadores.

## Decisiones ya tomadas (no re-litigar sin motivo)

- **IndexedDB cifrado > `localStorage` plano.** Si el usuario tiene IDB, lo usamos.
- **Zustand > Redux.** El dominio cabe en un único store; no hace falta middleware.
- **Framer Motion > CSS animations puras.** La UX sensorial lo justifica.
- **SVG > PNG para iconos.** PWA moderna; iOS acepta SVG en apple-touch-icon desde iOS 16.
- **i18n casero > next-intl.** 2 locales no justifican otra dep.
- **Vercel Cron > Inngest** (Phase 2). 11 jobs, cabe en Pro. Migrar a Inngest solo si necesitamos durable workflows o >40 jobs.
- **RLS Postgres deferred** a Fase 4. Compromiso documentado en `ROADMAP.md`: implementar antes de cerrar deal Enterprise tier (>$50K USD/año contract value). Mientras tanto, defensa via `requireMembership` opt-in en handlers + audit log.
- **NOM-035 texto ítems** verificado por hash SHA-256 (`integrity.js`). Validación legal vs DOF oficial pendiente — `nom035TextValidatedByLawyer = false`. Reportes oficiales muestran disclaimer hasta review humano.
- **Coach LLM plan-tiered** (Phase 2): FREE Haiku 5/mes, PRO Sonnet 100/mes, STARTER 500/mes, GROWTH/ENTERPRISE ∞. Hard-cap, no soft.
- **Magic-link console fallback bloqueado en prod** — falla boot si `EMAIL_SERVER` ausente.
- **Push delivery server-side real** (Phase 2) vía `web-push` + `PushOutbox` + cron. setTimeout cliente NO se reintroduce.
- **MFA enforce en `/api/sync/*` + `/api/coach`** (Phase 2), no solo `/admin`.

## Phase 2 elevation context (post 2026-05-01)

- Backend recibió 22 sub-items de mejoras (Sprints 1-5). Ver `ELEVATION_LOG.md` para detalle.
- Sprint 6 (wearable OAuth Whoop+Oura, HrvSample tables, etc.) deferido — ver `ROADMAP.md`.
- 6 docs finales para asesor externo: `FINAL_SYSTEM_STATE.md`, `FINAL_BACKEND_STATE.md`, `FINAL_DOMAIN_INTELLIGENCE.md`, `FINAL_FEATURES_CATALOG.md`, `FINAL_FRONTEND_REQUIREMENTS.md`, `DECISION_POINTS.md`.
- Migraciones nuevas: `0022_sprint1_compliance` y `0023_coach_usage_push_outbox`. Ambas idempotentes — se aplican en próximo `npm run build`.
- Dependencia nueva: `web-push@^3.6.7`.
- Cron tasks nuevas en `vercel.json` — requieren `CRON_SECRET` env en Vercel.
