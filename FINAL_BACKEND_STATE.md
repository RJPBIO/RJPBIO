# FINAL_BACKEND_STATE.md — Backend tras elevación Fase 2

**Fecha:** 2026-05-01.

---

## 1. Stack server (sin cambios estructurales)

| Capa | Tecnología | Notas |
|---|---|---|
| HTTP | Next.js 16 App Router | Edge middleware + Node runtime mixto |
| ORM | Prisma 6 | `postinstall` corre `prisma generate` |
| DB | Postgres (Supabase pooled+direct) | sin RLS (pendiente Fase 3) |
| Adapter dev | In-memory custom (`src/server/db.js`) | activo cuando `DATABASE_URL` vacío |
| Auth | NextAuth v5 beta 31 | `strategy="jwt"`, 8h TTL |
| Cache/RL | Upstash Redis REST + memoria fallback | warn-once en prod si sin Redis |
| Email | nodemailer + console fallback | **NUEVO Phase 2:** fail-boot en prod sin EMAIL_SERVER |
| Crypto | scrypt · AES-GCM · HMAC-SHA256 | KMS AWS opcional (envelope) |
| Webhooks salientes | HMAC + secret rotation overlap | **NUEVO Phase 2:** event versioning header |
| Observability | Sentry + OpenTelemetry SDK + custom logger + CSP-report | OTEL requiere `OTEL_EXPORTER_OTLP_ENDPOINT` |
| **Background work** | **Vercel Cron** (Phase 2) | 11 tasks definidas en `vercel.json` |
| LLM | Anthropic SDK 0.90 | **Phase 2:** plan-tiered + quota + 1h cache |
| Push | web-push@^3.6.7 (Phase 2) | server-side cross-device delivery real |

---

## 2. Schema Prisma — modelos completos

### Models pre-existentes (30) — ver `prisma/schema.prisma`:
Org, User, Membership, Team, Invitation, Account, Session, VerificationToken, UserSession, TrustedDevice, MfaResetRequest, PhoneOtp, PushSubscription, NeuralSession, Station, StationTap, Webhook, WebhookDelivery, ApiKey, Integration, SupportTicket, Impersonation, Nom35Response, WearableEvent, AuditLog, DsarRequest, Notification, Incident, IncidentUpdate, MaintenanceWindow, IncidentSubscriber.

### Models NUEVOS Phase 2 (3):

| Modelo | Propósito |
|---|---|
| `StripeEvent` (S1.5) | Idempotency fingerprint para webhook retries de Stripe |
| `CoachUsage` (S5.1) | Quota mensual coach LLM por user (year+month unique) |
| `PushOutbox` (S5.2) | Queue server-side de push notifications con retry exponencial |

### Schema diff resumen (S1.3, S1.4, S1.5):

```diff
model User {
+ wearableEvents WearableEvent[]
+ coachUsage     CoachUsage[]
+ pushOutbox     PushOutbox[]
+ @@index([deletedAt])
}

model Org {
+ coachUsage     CoachUsage[]
}

model WearableEvent {
- userId: column without FK
+ user User? @relation(fields: [userId], references: [id], onDelete: Cascade)
+ @@index([orgId, provider, receivedAt])
}
```

### Migraciones Phase 2:
- `0022_sprint1_compliance` — User.deletedAt index, WearableEvent FK + cascade + admin index, StripeEvent table.
- `0023_coach_usage_push_outbox` — CoachUsage table, PushOutbox table.

Ambas idempotentes (`IF NOT EXISTS`, `DO $$ ... NOT EXISTS`).

---

## 3. Auth flows (Phase 2 estado)

| Mecanismo | Estado | Phase 2 cambio |
|---|---|---|
| Email magic-link | Funcional | Console fallback fail-boot en prod |
| OIDC Google/Azure/Okta/Apple | Funcional condicional | sin cambio |
| Phone SMS-OTP | Funcional Twilio + console-dev | sin cambio |
| WebAuthn / passkeys | Funcional | sin cambio |
| TOTP MFA + backup scrypt + trusted device 30d + reset | Funcional | sin cambio |
| **MFA enforcement endpoint-side** | Antes solo `/admin` | **Phase 2:** `/api/sync/*` + `/api/coach` también |
| DB-backed UserSession + lazy revoke 60s + sessionEpoch++ | Funcional | sin cambio |
| **SCIM cascade revoke** | No existía | **Phase 2:** PATCH/PUT/DELETE active=false → revokeUserAccess (sessions + epoch + trusted devices) |

---

## 4. API endpoints — inventario

**Total handlers:** 105+ (post Phase 2: +5 nuevos endpoints).

### Endpoints NUEVOS Phase 2:

| Ruta | Método | Auth | Propósito |
|---|---|---|---|
| `/api/v1/me/neural-health` | GET | session | snapshot per-user `evaluateEngineHealth()` |
| `/api/v1/orgs/[orgId]/neural-health` | GET | session + RBAC OWNER/ADMIN/MANAGER | org-level engine maturity + protocolEffectiveness con CI95/Cohen's d |
| `/api/cron/[task]` | GET/POST | `Bearer ${CRON_SECRET}` o `x-vercel-cron` | dispatcher de 11 cron tasks |

### Cron tasks invocables en `/api/cron/[task]`:

| Task | Cadencia (vercel.json) | Acción |
|---|---|---|
| `audit-prune` | 0 3 * * * | retention prune por org según `auditRetentionDays` |
| `audit-verify` | 0 4 * * 0 | streamed verify chain → persist `auditLastVerifiedAt/Status` |
| `audit-export` | 30 3 * * * | export por chunks a S3 (Object Lock COMPLIANCE) o filesystem mock |
| `dsar-sweep` | 0 1 * * * | EXPIRY pendientes + `hardDeleteExpiredUsers(30d)` |
| `dunning-check` | 30 1 * * * | downgrade a FREE post-grace |
| `maintenance-notify` | */5 * * * * | T-24/T-0/complete flags + audit |
| `incident-broadcast` | * * * * * | fan-out IncidentUpdate a IncidentSubscriber matching components |
| `trial-end-reminder` | 0 9 * * * | notify orgs con `trialEndsAt` <72h sin notificación reciente |
| `webhook-retry` | * * * * * | drena `WebhookDelivery` con `nextRetry` vencido |
| `push-deliver` | * * * * * | drena `PushOutbox` con `web-push` real |
| `weekly-summary` | 0 14 * * 1 | Haiku 4.5 narrative summary + push notification por user activo |

### Endpoints existentes con cambios Phase 2:

| Ruta | Cambio |
|---|---|
| `/api/sync/outbox` | + MFA gate |
| `/api/sync/state` | + MFA gate |
| `/api/coach` | + MFA gate + plan-tiered model + quota check + cache 1h + audit con plan/used/max |
| `/api/billing/webhook` | + StripeEvent idempotency check + persist |
| `/api/scim/v2/Users/[id]` | PATCH/PUT/DELETE active=false → cascade revoke |

### Endpoints invariantes (sin cambio Phase 2):
- `/api/auth/[...nextauth]` (NextAuth)
- `/api/auth/mfa/*` (setup, verify, disable, backup-codes, trusted-devices)
- `/api/auth/phone/*`, `/api/auth/sso-discover`, `/api/auth/signout-all`, `/api/auth/providers-available`
- `/api/webauthn/{register,auth}`
- `/api/billing/{checkout,portal}`
- `/api/scim/v2/{Groups,ResourceTypes,Schemas,ServiceProviderConfig}`
- `/api/v1/orgs/[orgId]/{audit/export, audit/verify, audit/retention, audit/count, branding, compliance, compliance/export, security, sessions, sessions/[sessionId], sso, dsar, dsar/[id]/resolve, members/[userId]/revoke-sessions, domain/verify}`
- `/api/v1/me/{dsar, sessions, sessions/[id], neural-priors, ip, notifications/read-all, notifications/[id]/read}`
- `/api/v1/users/me/{export}`
- `/api/v1/{api-keys, api-keys/[id], webhooks, webhooks/[id], webhooks/[id]/deliveries, integrations, integrations/test, integrations/[id], leads, onboarding, sessions, stations, stations/[id], teams, teams/[id], members, mfa-reset-request, mfa-reset-request/[id], analytics, status/subscribe, health/metrics, incidents, incidents/[id]/updates, maintenance, maintenance/[id]/status, nom35/responses, nom35/aggregate, nom35/aggregate/export, org/[id]/export}`
- `/api/{coach, csp-report, health, ready, openapi, push/{subscribe,resubscribe,unsubscribe}, status/{verify,unsubscribe}, support, sync/outbox, sync/state, vitals, dev/login, admin/impersonate, admin/impersonate/consume/[token], notifications/recent, integrations/wearables/[provider]/ingest, invite/bulk, members/bulk, account/link-email, team/export}`

---

## 5. Edge functions

`src/middleware.js` mantiene sin cambios estructurales:
- Rate limit (general 120/min, auth 10/min, plan-aware via Upstash)
- CSP nonce per-request, strict-dynamic
- Headers de seguridad agresivos (HSTS preload, COEP credentialless, COOP/CORP same-origin)
- IP allowlist enforcement (IPv4 only)
- CORS condicional via `CORS_ALLOWED_ORIGINS`

---

## 6. Realtime / sync

Sin Realtime (sin Supabase Realtime, sin WebSockets, sin SSE general). Lo más cercano a tiempo real:
- **Push notifications server-side (Phase 2)** — `web-push` + `PushOutbox` queue + cron drain
- Polling client-side de `/api/notifications/recent`
- Periodic Sync API del SW (Chrome only)
- BroadcastChannel cross-tab para state sync local
- SSE en `/api/coach` (Anthropic streaming)

---

## 7. Seguridad — estado actual

### Headers (sin cambio Phase 2)
- HSTS preload, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin
- Permissions-Policy deny camera/mic/geo/cohort, allow payment self
- COOP same-origin, CORP same-origin, COEP credentialless
- CSP con nonce per-request, strict-dynamic, frame-ancestors 'none', object-src 'none'

### Rate limiting
- Edge: 120/min general, 10/min auth
- Per-handler `check(...)` con keys per-user/per-IP/per-resource
- Upstash Redis REST + memoria fallback (warn-once en prod)

### Webhook security
- HMAC-SHA256 + secret rotation overlap (Sprint 17)
- **Phase 2:** `webhook-event-version: 1` header

### Audit chain
- SHA-256 + HMAC seal con `AUDIT_HMAC_KEY`
- Advisory lock per-org `pg_advisory_xact_lock`
- **Phase 2:** `verifyChain` streamed cursor 5K (escala a millones)
- **Phase 2:** S3 Object Lock COMPLIANCE interface lista para activar (mock filesystem hasta AWS configurado)

### Stripe
- Webhook signature `constructEvent`
- **Phase 2:** `StripeEvent` table fingerprint (idempotency post retry)

### CSRF
- Double-submit cookie (`bio-csrf` + `x-csrf-token` header)
- Bypass para Bearer tokens (server-to-server)

### MFA enforcement (Phase 2)
- Hasta Phase 2: solo `/admin` layout
- Phase 2: `enforceMfaIfPolicyDemands(session)` en `/api/sync/outbox`, `/api/sync/state`, `/api/coach`. Devuelve 403 + `X-MFA-Required: true` con reason (`mfa_not_enabled` | `mfa_never_verified` | `mfa_stale`).

### Hallazgos críticos cerrados en Phase 2:
1. ✅ Magic-link console fallback en prod (cerrado: fail-boot).
2. ✅ `audit-export.js` bug `await` (cerrado).
3. ✅ MFA gap en `/app` data egress (cerrado: enforce en sync + coach).
4. ✅ `WearableEvent.userId` SetNull → huérfanos GDPR (cerrado: Cascade FK).
5. ✅ DSAR cascade incompleto (cerrado: `eraseUserData` + cron hard-delete).
6. ✅ SCIM cascade incompleto (cerrado: `revokeUserAccess` cascade).
7. ✅ `verifyChain` OOM (cerrado: streamed/batched).
8. ✅ Stripe webhook re-aplicación (cerrado: StripeEvent fingerprint).
9. ✅ Coach quota runaway (cerrado: monthly hard-cap por plan).
10. ✅ `User.deletedAt` sin índice (cerrado).

### Hallazgos críticos abiertos (Phase 3+):
1. **Sin RLS Postgres** — defensa en profundidad ausente. Compromiso: implementar antes de Enterprise tier >$50K/año (ver `ROADMAP.md`).
2. **IPv6 IP allowlist deferred** (decision documentada).
3. **Wearable OAuth flows** — no implementado.
4. **SAML signed assertion validation** — confirmar que NextAuth SAML provider lib lo cubre.
5. **Audit S3 Object Lock** — interface lista, requiere AWS bucket + `npm i @aws-sdk/client-s3`.

---

## 8. Performance backend (Phase 2 mejoras)

### Bottlenecks cerrados:
- ✅ `verifyChain` streamed (antes OOM en orgs grandes).

### Bottlenecks abiertos:
- ⚠️ `/api/v1/nom35/aggregate` sin filtro de fecha (full scan). Mitigación trivial: agregar `?from=&to=` query.
- ⚠️ `/api/v1/orgs/[orgId]/audit/export` carga 50K rows antes de stream. Mitigación: NDJSON streaming response.
- ⚠️ `/admin` overview 4 queries paralelas + `findMany memberships` sin take. Aceptable hasta orgs ~10K.
- ⚠️ `User.neuralState` JSON sin techo — HRV/mood/instrumentos viven en JSON, no tablas. Pendiente Sprint 6+ (`HrvSample` / `MoodSample` tablas dedicadas).

---

## 9. Compliance posture (post-Phase 2)

| Control | Estado |
|---|---|
| **GDPR Art 15 (access)** | ✅ DSAR auto-resolve + export `/me/dsar` |
| **GDPR Art 17 (erasure)** | ✅ Soft-erasure inmediata + hard-delete cron post-30d |
| **GDPR Art 20 (portability)** | ✅ DSAR auto-resolve + JSON export |
| **K-anonymity ≥5** | ✅ NOM-035 aggregate + computeOrgNeuralHealth + computeProtocolEffectiveness + cohort prior |
| **NOM-035 STPS** | ✅ Server-recompute + 72 ítems oficiales + integrity hash + flag legal validation pendiente |
| **Audit chain hash + HMAC seal** | ✅ |
| **Audit retention prune** | ✅ Cron diario |
| **Audit verify** | ✅ Cron semanal streamed |
| **Audit S3 WORM** | ⚠️ Interface lista, requiere AWS config + `@aws-sdk/client-s3` install |
| **MFA enforcement** | ✅ `/admin` + `/sync/*` + `/coach` |
| **SCIM 2.0 cascade revoke** | ✅ |
| **Stripe webhook idempotency** | ✅ |
| **Wearable HMAC per-provider** | ✅ |
| **IPv6 IP allowlist** | ❌ Deferred |
| **RLS Postgres** | ❌ Deferred → Fase 3 |
| **SAML signed assertion** | ⚠️ A verificar (NextAuth SAML provider) |
| **SOC 2 Type II** | claim — requiere ops process + AWS S3 real |
| **HIPAA BAA** | claim — requiere legal flow |

---

## 10. Background work (Phase 2 — antes inexistente)

11 cron tasks ejecutadas vía Vercel Cron + dispatcher `/api/cron/[task]` con `Authorization: Bearer ${CRON_SECRET}`. Cada task:
- Verifica auth (timing-safe).
- Limita timeout 50s (Vercel Pro cap 60s).
- Audit-loggea con duration + counts.
- Devuelve JSON consistente `{task, ok, durationMs, processed, errors, details}`.

Cuándo escalar a Inngest (documentado en ELEVATION_LOG):
- Si necesitamos durable workflows (cross-restart retries persistentes).
- Si superamos 40 jobs (Vercel Pro cap).
- Si necesitamos sub-minute cadencia.

---

## 11. Diff de impacto Phase 2 sobre métricas

| Métrica | Pre Phase 2 | Post Phase 2 |
|---|---|---|
| API endpoints | 103 | 105+ (3 nuevos + dispatcher cron) |
| Modelos Prisma | 30 | 33 (StripeEvent, CoachUsage, PushOutbox) |
| Migraciones | 21 | 23 |
| Tests pasando | 2722 | 2762 (+40 nuevos) |
| Cron tasks | 0 | 11 |
| Compliance gaps abiertos | ~15 críticos | ~5 críticos |
| Inteligencia neural expuesta al frontend | 1 endpoint (cohort) | 3 endpoints (cohort + me/health + org/health) |
| Coach LLM cost control | ninguno | quota monthly hard-cap + plan-tiered models + 1h cache |
| Push notifications server | 0% (cliente only) | 100% (PushOutbox + cron + web-push) |

El sistema está sustancialmente más robusto, observable, y compliance-ready post Phase 2.
