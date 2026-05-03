# ANALYSIS_BACKEND.md — Estado actual del backend

**Fecha:** 2026-05-01 · **Reglas:** código manda · honestidad brutal · cero diplomacia.

> Este doc reemplaza/actualiza al `BACKEND_AUDIT.md` (2026-04-29) en los puntos donde el código real contradice al audit anterior. Los hallazgos pesimistas del audit previo corregidos están explícitamente marcados.

---

## 0. Stack real (verificado en código)

| Capa | Tecnología | Notas |
|---|---|---|
| HTTP | Next.js 16 App Router | edge middleware + node runtimes mezclados por handler |
| ORM | Prisma 6 + `@prisma/client` | sin `prisma generate` automático — `postinstall` lo dispara |
| DB | Postgres (Supabase pooled+direct) | sin SDK de Supabase, sin RLS, sin Realtime, sin Storage |
| Adapter dev | In-memory custom (`src/server/db.js`) | activado cuando `DATABASE_URL` está vacío. NO soporta `$executeRaw` ni todos los métodos Prisma |
| Auth | NextAuth v5 beta 31 + `@auth/prisma-adapter` | strategy=`"jwt"`, 8h TTL global |
| Cache/RL | Upstash Redis REST + memoria fallback | warn-once en prod si `REDIS_URL` ausente |
| Email | nodemailer (Postmark/SES) + console fallback | console fallback es una bomba de tiempo en prod |
| Crypto | scrypt · AES-GCM · HMAC-SHA256 | KMS AWS opcional (envelope) |
| Webhooks | HMAC firma + secret rotation overlap + delivery retry | bien diseñado |
| Observability | Sentry · OpenTelemetry SDK · CSP-report endpoint · custom logger | OTEL no exporta sin `OTEL_EXPORTER_OTLP_ENDPOINT` |
| Background work | **Ninguno** | sin job queue, sin Vercel Cron registrado en repo |
| LLM | Anthropic SDK 0.90 · `claude-sonnet-4-6` · streaming SSE | con prompt-cache ephemeral en system prompt |

**Modelos Prisma:** 30 · **Migraciones:** 21 (0001…0021, append-only) · **API routes:** 103 · **Tests:** 108 (mayoría en `lib/`, casi nada en `app/api/`).

---

## 1. Tenancy y RLS

**Confirmado: no hay Row-Level Security a nivel Postgres.** El comentario inicial del schema dice "Postgres con Row-Level Security a nivel app (tenant_id en todas las tablas)" — esto es una promesa de aplicación, no de DB.

**Implicación operativa:** una query Prisma con bug lógico (olvidé filtrar `orgId`) lee cross-tenant sin ningún check de DB. La defensa en profundidad asume "siempre confía en `requireMembership(session, orgId, action)`" — pero el patrón no es auto-enforced y es fácil de olvidar al añadir handlers.

**Evidencia de patrón confiable:**
- `src/server/rbac.js` — policies declarativas por acción + `requireMembership` chequea membership y rol mínimo. **Bien construido pero opt-in.**
- Personal-org idempotente vía `upsert` — race-safe (Sprint 93 fix).

**Gap real:** no hay test de integridad cross-tenant — un caso "user de orgA pide datos de orgB" solo se cubre por inspección manual. Cobertura de tests sobre rutas API es mínima.

---

## 2. Auth + sesiones (estado real)

| Mecanismo | Estado | Robustez |
|---|---|---|
| Email magic-link | Funcional | ⚠️ console fallback en prod = secret leak en logs |
| Password puro | Removido | bien — bug de auth-bypass histórico |
| OIDC Google/Azure AD/Okta/Apple | Condicionales (skip si faltan creds) | UI oculta botones sin creds (`/api/auth/providers-available`) |
| Phone SMS-OTP | Funcional con Twilio o console fallback | OTP hasheado HMAC, TTL corto, attempts counter |
| WebAuthn / passkeys | Funcional (`/api/webauthn/*`) | passkeys persistidas en `User.passkeyCredentials` JSON, no tabla |
| TOTP MFA RFC 6238 | Funcional, 30s step, ±1 window | HOTP propio (no dep externa) |
| Backup codes scrypt | Funcional, single-use, salted | bien |
| Trusted-device cookie 30d | Funcional, sha256 hash en DB | bien |
| MFA reset autoservicio | Funcional via `/recover` → `MfaResetRequest` | requiere admin/platform-admin para resolver |
| Logout-all (sessionEpoch++) | Funcional via `/api/auth/signout-all` | bien |
| Lazy revoke validation | 60s interval o `trigger="update"` | gap de 60s aceptable, documentado |
| Password reset | **No existe** | sin password = sin reset; recovery solo MFA |

### Hallazgo crítico — `requireMfa` no enforce en `/app` PWA

`src/app/(admin)/admin/layout.jsx:28-33` redirige a `/settings/security/mfa` si `policies.some(p => p?.requireMfa)`. **No existe equivalente en `/app/page.jsx` ni en `/api/sync/*`.** Un miembro no-admin de un org "MFA-required" puede:

1. Acceder a la PWA sin MFA.
2. Capturar HRV/mood/sesiones en `/app`.
3. Sincronizar al server vía `/api/sync/outbox` (que sí valida session pero no MFA-state).

**Severidad:** alta para B2B compliance; el threat model "datos del operador requieren MFA" actualmente falla.

### Hallazgo — IP allowlist solo IPv4

`middleware.js:151` hace `parseIpv4(ip) !== null` antes de aplicar policies. IPv6 hace pass-through. Esto es decision documentada (`org-security.js:11-18` "IPv6 deferred"), pero merece convertirse en toggle por org: "deny IPv6 por defecto" para clientes que sí pueden enforcer.

### Hallazgo — magic-link console fallback en prod

`src/server/auth.js:93-104`: si no hay `EMAIL_SERVER`, los magic-links se imprimen a stdout. En prod sin SMTP, esto significa **secrets de auth en logs**. Debería:
- En `NODE_ENV=production`, lanzar error explícito en boot si `EMAIL_SERVER` ausente, **NO** caer al console fallback.

---

## 3. Handlers API — patrón general

### Patrón típico (cuando se sigue completo)

```
1. requireCsrf(req)                  ← presente en mayoría de POST/PUT/PATCH/DELETE
2. const session = await auth()      ← session check
3. rate-limit check(`key:${userId}`) ← key estable per resource
4. Body size guard (Content-Length)  ← solo donde aplica (sync, webhooks)
5. JSON parse try/catch              ← solo el outbox lo formaliza
6. Validate shape (validateEntry)    ← mejor adoptado en sync; inconsistente fuera
7. RBAC requireMembership(...)       ← presente donde toca org-data
8. Operación
9. auditLog({...}).catch(()=>{})     ← async no-bloqueante, bien
```

### Inconsistencias detectables

- **Validación de inputs** no es universal. Algunos handlers parsean body con `await req.json()` y confían en Prisma para rechazar tipos malformados. **Zod existe como dep pero NO se usa en la mayoría de handlers.** Es input pollution latente — debería ser estándar.
- **CSRF se aplica donde `requireCsrf` se llama explícito.** Si un handler nuevo se merge sin esa línea, queda CSRF-vulnerable. Es opt-in, no auto-enforced.
- **`force-dynamic` declarado por handler**, no centralizado.

### Handlers con queries pesadas (riesgo OOM o latencia)

| Ruta | Problema | Severidad |
|---|---|---|
| `/api/v1/orgs/[orgId]/audit/verify` (`verifyChain`) | Carga toda la cadena en memoria | OOM en orgs grandes |
| `/api/v1/orgs/[orgId]/audit/export` | `take: 50_000` cap, pero sin streaming | aceptable, mejor con NDJSON streaming |
| `/api/v1/nom35/aggregate` | `findMany` sin date filter ni pagination | OOM con orgs grandes |
| `/api/v1/nom35/aggregate/export` | Carga responses completas en memoria | igual |
| `/admin` overview | 4 queries paralelas + `findMany memberships` sin take | escala mal en orgs ≥10K |

### Handlers SCIM 2.0

- `/api/scim/v2/{Users,Groups,ResourceTypes,Schemas,ServiceProviderConfig}` con Bearer API key + scope `scim` + rate-limit per-key + headers RFC 9239.
- `Users [id]` patch + filter (`scim-filter.js` + `scim-patch.js` con tests).
- **Gap:** no hay paginación visible en `/Users` por defecto (a confirmar al leer handler completo); SCIM spec exige `count` + `startIndex`.
- **Gap:** SCIM bulk operations endpoint (`/Bulk`) no existe — algunos IdPs lo requieren.

### Handlers billing/webhooks

- `/api/billing/checkout` → Stripe Checkout Session (`mode=subscription`).
- `/api/billing/portal` → Stripe Customer Portal session.
- `/api/billing/webhook` → `stripe.webhooks.constructEvent` (bien) → `resolveStripeEvent` (puro, testeable, en `lib/billing-webhook.js`) → applies orgUpdate + notifyOrgAdmins.
- Idempotencia por `event.id` se maneja vía `auditLog` (hash chain detecta dupes en post-mortem, **no rechaza request duplicado**). Stripe ya garantiza at-most-once para `webhooks.constructEvent`, pero un retry de Stripe podría re-aplicar `orgUpdate`. Aceptable porque mutaciones son idempotentes (set plan, set seats), pero **no hay tabla `StripeEvent` para fingerprinting**.

### Coach LLM — `/api/coach`

Endpoint **vivo y bien construido**, NO es feature flag muerta:
- CSRF + auth + RBAC `coach.query` (MEMBER+).
- Rate-limit `coach:{userId}` 60/min — alto por error costoso.
- 50 mensajes max, 4000 chars per turn (cap pre-fetch).
- Anthropic streaming SSE, model `claude-sonnet-4-6`.
- `cache_control: { type: "ephemeral" }` en system prompt (correcto).
- Sanitization en `sanitizeUserTurn`.

**Gaps:**
- Modelo está hard-coded en handler en lugar de leer `process.env.COACH_MODEL` (que sí existe en `.env.example`).
- No hay quota mensual por org/plan — puede explotar costos si hay abuso.
- No persiste conversaciones (memoria solo en cliente). Eso evita PII en server pero limita features (resúmenes longitudinales, retomar conversación cross-device).

---

## 4. NOM-035 — confirma/niega audit anterior

✅ **CONFIRMADO buen estado:** `src/app/api/v1/nom35/responses/route.js:63` recomputa `scoreAnswers(body.answers)` server-side y persiste el resultado del **server**, NO del cliente. El audit anterior afirmaba "nivel calculado en cliente y aceptado server-side" — **falso**. Bien resuelto.

⚠️ **Gap real:** `aggregate/route.js` (admin) hace `findMany` SIN filtro de fecha y sin pagination. En orgs con respuestas históricas grandes, esto es un escaneo full-table. Debería filtrar por window (última año, q trim, etc.).

---

## 5. Wearables ingest — confirma/niega audit anterior

✅ **CONFIRMADO buen estado:** `src/server/wearables.js` tiene HMAC per-provider:
- whoop, oura, garmin, apple → hex HMAC
- fitbit → base64 HMAC
- Cada uno con `${PROVIDER}_WEBHOOK_SECRET` env separado.
- `timingSafeEqual` aplicado correctamente.

El audit anterior afirmaba "wearable webhook ingest no verifica HMAC per-provider" — **falso**.

⚠️ **Gap real:** ningún OAuth flow para que el USUARIO conecte su Whoop/Oura/Fitbit. El ingest es solo el lado server-to-server del webhook; no hay UI ni endpoint para autorizar el provider y mapear `userExt` ← → `User.id`. Implicación: **el admin no puede vincular un user real con su data wearable**. Los rows en `WearableEvent` quedan con `userId: null` esperando una "reconciliation job" que no existe.

---

## 6. Audit chain — sobre-ingenierizado, bien

- SHA-256 hash chain + HMAC seal con `AUDIT_HMAC_KEY` + advisory lock per-org (`pg_advisory_xact_lock`) → race-safe.
- `verifyChain(orgId)` recomputa entera la cadena. **Carga toda en memoria** — no escala más allá de ~50K-100K entries por org.
- `pruneByRetention` funciona, pero **no se ejecuta periódicamente**: no hay cron registrado, no hay job worker. Solo se llama desde `/api/v1/orgs/[orgId]/audit/retention` cuando admin lo pide.
- S3 export para SOC2 evidence pack vía `verify-audit.js` script — diseñado para CI/scheduled, requiere `AUDIT_EXPORT_BUCKET`.
- HMAC de "seal" se inyecta DESPUÉS del hash en `payload._seal` — `recomputeRow` lo strip-ea correctamente. Robusto.

**Gap real:** `verifyChain` debería **streaming/batched** (cursor + chunk verify) para soportar orgs enterprise con 1M+ entries.

---

## 7. Sync (PWA outbox + state merge)

- `/api/sync/outbox` POST: CSRF + session + rate-limit (60/min/user) + body size guard (`MAX_PAYLOAD_BYTES`) + batch size guard (`MAX_BATCH`).
- Personal-org `upsert` (Sprint 93 fix de race) — bien.
- Entries `kind=session` → `neuralSession.upsert` (idempotent by id). Otros kinds (mood, hrv, instrument, nom035, etc.) se mergean implícitamente vía `neuralState` (JSON en `User`).
- `mergeNeuralState` (en `src/server/sync-merge.js`) — TS_LOGS por `ts`, MAX_COUNTERS por `Math.max`, SET_UNIONS por `new Set`, CAPS por slice. **Sólido.**
- Documenta trade-offs explícitos: `banditArms` no se mergea cross-device (drift conocido), counters derivables se reconcilian en cliente.

**Gap real:** los kinds NO-session nunca se promueven a tablas dedicadas. **HRV, mood, NOM-035, instrumentos viven indefinidamente en `User.neuralState` JSON.** Esto:
- Dificulta queries SQL eficientes ("dame el avg HRV de todos los miembros").
- Hace que `User.neuralState` crezca sin techo (cap por `MAX_NEURAL_STATE_BYTES` pero contenido se pierde al rebasar).
- Bloquea features de inteligencia agregadas (cohort priors, comparativas). Comentario en código: "promote a tablas dedicadas en sprints futuros (MoodLog, HrvLog, etc.)" — pendiente.

---

## 8. Storage cliente (PWA)

- IndexedDB AES-GCM 256 + localStorage fallback.
- Sprint 80 fix: localStorage shadow en plano eliminado tras escribir IDB. Antes coexistía → AES-GCM era teatro porque atacante con storage access leía plain. **Bien.**
- BroadcastChannel cross-tab sync.
- Outbox autoIncrement con UUID forzado (Sprint update — antes IDB autoIncrement asignaba ints, server validaba string → silent rejection).
- `clearAll` borra IDB + localStorage + sync-token (anti cross-user leak).
- Migración versionada (v14 actual), append-only flags por versión.

**Sólido.** Una de las piezas mejor cuidadas del repo.

---

## 9. CSRF, rate-limit, RBAC

- **CSRF** (`src/server/csrf.js`): double-submit cookie, edge-compatible (Web Crypto only), `constantTimeEq`. Bien. Bypass para Bearer (server-to-server) — correcto.
- **Rate-limit** (`src/server/ratelimit.js`): token-bucket Upstash + memoria fallback con `warn once` en prod si Redis ausente. Plan-aware (`limits(plan)` retorna FREE 120/min, ENTERPRISE 10K/min).
- **RBAC** (`src/server/rbac.js`): ladder simple de 5 roles (OWNER>ADMIN>MANAGER>MEMBER>VIEWER), 17 policies declarativas. Asserts lanzan `error.status = 403`. Limpio.

**Gap menor:** el `coach.query` está en MEMBER level — eso quiere decir que cualquier seat consume costos LLM. Si el cliente abusa, el costo es del operador. Considerar quota por user/org.

---

## 10. Compliance (NOM-035 / DSAR / GDPR)

**NOM-035 (México) STPS-2018:**
- Aplicador 46-72 ítems Likert 0-4 (Guía II/III).
- Server recomputa `nivel/total/porDominio/porCategoria`.
- Aggregate con K-anon ≥5 server-side (`aggregateScores`).
- Documento oficial PDF (`Nom35PersonalReport.jsx` 51 KB) — diseño clónable.

**DSAR (GDPR Art 15/17/20):**
- Estado machine completo: PENDING → APPROVED|REJECTED|EXPIRED|COMPLETED.
- Auto-resolve para ACCESS y PORTABILITY (artifactUrl al export `/api/v1/users/me/export`).
- ERASURE requiere admin approval (legal-hold awareness).
- 30d default expiry alineado con GDPR Art 12 §3 (1 mes).
- **Gap:** la implementación de "soft-delete" (`User.deletedAt`) no propaga a sesiones — `WearableEvent.userId onDelete:SetNull` deja huérfanos vivos. Esto es Art 17 incompleto. Lo mismo `SupportTicket`, `Notification.orgId` (al borrar org).

**Audit retention:**
- Configurable 30..2555 días por org.
- `pruneByRetention` deleteMany por cutoff.
- `auditLastVerifiedAt`, `auditLastVerifiedStatus`, `auditLastPrunedAt` persisten para SOC2 evidence.
- **No hay cron**: pruning solo dispara cuando el admin click "prune now" en `/admin/audit`.

---

## 11. Background work — ZERO job queue

Operaciones que deberían estar en background y corren inline:

| Operación | Latencia esperada | Hoy |
|---|---|---|
| `verifyChain` | hasta minutos en orgs grandes | bloquea request |
| Audit retention prune | OK pero solo on-demand | sin cron |
| Webhook delivery retry | retry inline en handler | sin queue persistente |
| Maintenance window T-24/T-0 notifications | flag `notifiedT24`/`notifiedT0` se setea pero **nadie lo dispara** | dead code? |
| Incident notifications a subscribers | requiere worker | sin worker |
| Dunning state checks | reactive a Stripe webhook | OK reactivo, pero no hay sweep diario |
| DSAR expiry sweeper | requiere cron | no existe |
| Trial-end reminders | reactive solo | sin cron |
| Token bucket cleanup | best-effort en Redis con TTL | OK |

**Gap más importante del backend.** Sin job queue:
- Las features "scheduled" del status page son teatro.
- Reportes batched no existen.
- DSAR expiry nunca se ejecuta — requests pendientes acumulan indefinidamente.
- "Audit chain verified weekly" claim (si lo hay en marketing) no se sostiene.

**Opciones (a discutir Fase 2):**
1. Vercel Cron (gratis hasta 2 jobs en hobby, 40 en pro).
2. Upstash Qstash (queue HTTP, retry policy).
3. Inngest / Trigger.dev (ergonomía mejor; deps adicional).
4. Vercel Cron + handler dedicado en `/api/cron/*` con secret en header.

---

## 12. OpenAPI

- `src/lib/openapi-builder.js` + `/api/openapi/route.js` exponen un OpenAPI 3.0 spec.
- A confirmar: ¿está completo? ¿qué endpoints documenta?
- Si solo cubre el subset enterprise (api-keys, webhooks, sessions, members, analytics), eso es coherente con "API pública para enterprise".

---

## 13. Hallazgos consolidados

### Lo que está bien (no tocar a menos que la mejora sea grande)

1. Audit log con hash chain + HMAC seal + advisory lock — **sobre-ingenierizado para SOC2/HIPAA**, ya está en el nivel correcto.
2. Auth de grado empresarial (4 OIDC + magic-link + WebAuthn + TOTP MFA + backup codes scrypt + trusted device + reset flow).
3. Schema Prisma rico y migraciones limpias append-only.
4. `mergeNeuralState` correcto.
5. Storage AES-GCM con shadow plain eliminado.
6. NOM-035 server-recompute (audit anterior estaba mal).
7. Wearable HMAC per-provider (audit anterior estaba mal).
8. CSRF double-submit + rate-limit token-bucket + RBAC declarativo.
9. Stripe webhook resolution puro testeable.
10. Coach LLM con prompt-cache + streaming + safety library bien construida.

### Lo que está mal o es riesgoso (priorizado)

| # | Hallazgo | Severidad | Esfuerzo fix |
|---|---|---|---|
| 1 | **Sin RLS Postgres** | alta | XL — habilitar RLS por tabla + policies SQL |
| 2 | **`requireMfa` no enforce en `/app` ni `/api/sync/*`** | alta (B2B compliance) | M — añadir guard server-side y middleware coverage |
| 3 | **No hay job queue** — DSAR sweeper, audit prune cron, maintenance notifications, trial-end nunca corren | alta | L (Vercel Cron) o XL (Inngest) |
| 4 | **HRV/mood/NOM-035/instrumentos solo en `User.neuralState` JSON**, no en tablas dedicadas | media (limita features B2B agregadas) | L por tabla — migración + sync writes paralelos |
| 5 | **Magic-link console fallback en prod** | alta (secret leak) | S — refuse boot si NODE_ENV=production y EMAIL_SERVER ausente |
| 6 | **`verifyChain` carga TODO a memoria** — OOM en orgs grandes | media | M — batched cursor verify |
| 7 | **Nom35 aggregate sin date filter** | media (latencia/OOM) | S — añadir window param |
| 8 | **No hay UI de OAuth conexión wearables** — webhook ingest sin reconciliation con user real | alta (feature mostly teatro) | L — OAuth flow per provider + reconciliation job |
| 9 | **Coach modelo hardcoded** — debería leer `COACH_MODEL` env | trivial | S |
| 10 | **No hay quota mensual coach por org/plan** — costo runaway potencial | media | M |
| 11 | **In-memory rate-limit fallback per-réplica en serverless** = N×120/min real | alta si REDIS_URL no se setea en prod | trivial — checklist deploy |
| 12 | **IPv6 allowlist deferred** (decision) | media | M — extender `parseIp` a v6 + CIDR v6 |
| 13 | **`User.deletedAt` sin índice** | bajo | S — migración índice |
| 14 | **`WearableEvent.userId onDelete:SetNull`** deja huérfanos contra Art 17 | media | S — cambiar a Cascade o cleanup explícito |
| 15 | **`SupportTicket`, `Notification.orgId` mismo patrón** | bajo | S |
| 16 | **`dangerouslyAllowSVG: true`** en next.config | bajo (mitigado por CSP imagen) | revisar SVGs servidos |
| 17 | **React Compiler off** (TDZ + audit risk) | bajo (perf) | M (si se enciende) |
| 18 | **Tests cubren `lib/` no `app/api/*`** | medio (regresiones) | XL (coverage gap real) |
| 19 | **No hay tabla `StripeEvent`** para fingerprinting de retries | bajo | S |
| 20 | **OpenAPI status no auditado en este analysis** | bajo | S |

### Decisiones documentadas que confirmo correctas

- JWT-strategy en lugar de DB-strategy (robustez ante DB caída).
- React Compiler off (admisión explícita).
- Personal-org auto-provisioning idempotente.
- BLE/PPG en cliente (privacy by design).

---

## 14. Memory leaks / race conditions detectadas

- **Race en `signIn` ↔ `outbox` upsert** del personal-org — **resuelto** Sprint 93 con `org.upsert`.
- **Race en `auditLog` writes** — **resuelto** con `pg_advisory_xact_lock(orgLockKey(orgId))`.
- **`User.lastSyncedAt` write conflict cross-device** — eventual consistency, last-writer-wins, aceptable.
- **BLE listener cleanup** — los hooks (`useDeepLink`, `useSync`, `useSessionTimer`) limpian en useEffect, OK.
- **Memoria del rate-limit fallback** crece sin techo en cold-start serverless — bajo en práctica (replica recicla).
- **No detectado leak crítico server-side.** Confirmable solo con APM en producción.

---

## 15. Opportunities (sin escribir código todavía)

A priorizar en Fase 2:

A. **Tabla `StripeEvent` (fingerprint)** — idempotencia explícita.
B. **Vercel Cron + `/api/cron/[task]`** con secret header — corre DSAR sweep, audit prune, maintenance notifications, trial-end reminders.
C. **`MfaPolicy` enforcement en `/api/sync/outbox` y `/app` server-side** — closing del gap #2.
D. **`User.deletedAt` index + GDPR Art 17 cascade** — closing #14, #15.
E. **`HrvSample`, `MoodSample`, `Nom35Snapshot` tablas dedicadas** — promover de JSON, dual-write con backfill.
F. **`audit-verify-stream`** — cursor batch verify para orgs grandes.
G. **`coach.usage` quota table** — `tokensUsedMtd`, `quotaPlan`.
H. **`process.env.COACH_MODEL` honored** + `claude-haiku-4-5-20251001` para tier FREE.
I. **CI assertion: `NODE_ENV=production` + `!EMAIL_SERVER` → fail boot.**
J. **Wearable OAuth flow** — al menos Whoop + Oura + Fitbit. Esto convierte el ingest en real.
K. **Quota dashboards en `/admin/billing` o `/admin/health`** (request count, coach tokens).
L. **OpenAPI completar** — espec para enterprise integration partners.

---

**Fin de ANALYSIS_BACKEND.md.**
