# FINAL_SYSTEM_STATE.md — Estado del sistema tras elevación Fase 2

**Fecha:** 2026-05-01 · **Versión sistema:** post Sprint 5 elevation.

> Este documento reemplaza al `SYSTEM_OVERVIEW.md` histórico (2026-04-29) en los puntos donde Phase 2 cambió la realidad. Es el insumo principal para que el asesor externo arme el prompt de reconstrucción frontend.

---

## 1. Identidad funcional (post-elevación)

BIO-IGNICIÓN es **una plataforma SaaS B2B-grade de "neural performance" con una PWA local-first como capa de operador**. Tres superficies coexistiendo:

- **Marketing site** (~28 rutas públicas)
- **PWA neural** en `/app` — sesiones 60-180s con audio binaural + haptics + voz + adaptación heurística
- **Consola admin B2B** (`/admin/*` — 24 páginas) con miembros, equipos, SCIM, SSO, branding, billing, audit hash chain, DSAR, NOM-035 STPS, webhooks, API keys, integraciones, stations físicas, incidents/maintenance, motor adaptativo

### Lo que cambió en Phase 2 (resumen ejecutivo)

| Antes | Después |
|---|---|
| Magic-link console fallback en prod = secret leak posible | Fail-boot explícito en prod sin `EMAIL_SERVER` |
| `audit-export.js` con bug de `await` faltante (función rota) | Arreglado + S3 Object Lock interface lista |
| `requireMfa` solo enforce en `/admin` (gap en `/app`, sync, coach) | Enforce en `/api/sync/*` + `/api/coach` con `enforceMfaIfPolicyDemands` |
| Sin job queue → 8+ features inertes (DSAR sweep, audit prune, maintenance T-24, etc.) | 11 cron tasks vía Vercel Cron + secret-protected dispatcher |
| Sin GDPR cascade real (Art 17 incompleto) | `eraseUserData(userId)` + `hardDeleteExpiredUsers(graceDays:30)` + index `User.deletedAt` |
| `WearableEvent.userId` SetNull → huérfanos | Cascade FK + index admin `(orgId, provider, receivedAt)` |
| Stripe webhook re-aplicaba en retries | `StripeEvent` table fingerprint + idempotency check |
| Coach LLM hardcoded `claude-sonnet-4-6`, sin gating | `resolveCoachModel(plan)` (Haiku free, Sonnet paid, Opus opt-in Enterprise), `CoachUsage` con quota mensual hard-cap (5/100/500/∞) |
| SCIM PATCH `active=false` no revocaba sesiones (8h gracia) | `revokeUserAccess` cascade en PATCH/PUT/DELETE (≤60s) |
| `verifyChain` cargaba toda la chain en memoria (OOM) | Streamed/batched cursor 5K rows, escala a millones |
| Push notifications eran `setTimeout` cliente (solo si tab abierto) | `PushOutbox` + cron drain + `web-push` server-side cross-device |
| No había narrative summary del coach | Weekly Haiku digest cron (lunes 14:00 UTC) |
| Inteligencia neural construida pero NO expuesta al frontend | `/api/v1/me/neural-health`, `/api/v1/orgs/[orgId]/neural-health`, cohort prior endpoint vivo |
| `compositeReward` perdía sesión completa si `mood_post` ausente | Inferencia desde Δ HRV cuando mood ausente (~30-50% recovery) |
| `selectArm` con cold-start ties siempre retornaba primer candidato | Tie-breaking diversity con `rng` injectable |
| NOM-035 ítems sin verificación de integridad | `nom35_items_hash` SHA-256 + `nom035TextValidatedByLawyer=false` flag |
| Coach prompt cache 5min ephemeral default | 1h ephemeral (~60-80% ahorro tokens en sesiones largas) |
| Webhook event sin versioning | `webhook-event-version: 1` header + body field |

---

## 2. Top 5 jobs-to-be-done (sin cambio post-Phase 2)

1. **(B2C)** "Necesito reset rápido en lo que tardo en hacerme un café" — protocolo 60-180s con feedback sensorial sincronizado.
2. **(B2C)** "Necesito saber si estoy listo para esa reunión / vuelo / cirugía" — Readiness Score 0-100.
3. **(B2B)** "Necesito firmar mi NOM-035 sin invadir privacidad" — aplicador 72 ítems + agregado k≥5 + export ECO37 firmado SHA-256.
4. **(B2B)** "Necesito SSO + SCIM + audit log + BAA en mi empresa de 500" — toda la suite enterprise existe.
5. **(B2B)** "Necesito medir adopción de wellness sin convertirlo en otra app de meditación" — stations NFC + integración wearable + "Retorno Saludable".

---

## 3. Mapa de funcionalidades — estado completo

### PWA / dominio neural
- 14 protocolos active + 3 training (10 min) + 3 crisis con citas científicas, iExec scripts, breath cycles, safety variants
- Audio engine binaural + chord + music + TTS + haptics
- Motor adaptativo: bandit UCB1-Normal contextual con prior + decay dual + cohort prior org-level + residuals + cold-start + staleness + pause-fatigue + anti-gaming v2 + engine-health introspección
- HRV pipeline dual: BLE strap + cámara PPG (filter / peaks / SQI / metrics)
- 12 locales i18n
- Persistencia: IDB AES-GCM 256, sync outbox, cross-tab broadcast, mergeNeuralState server-side correcto
- Service Worker v6 + offline + background sync
- Tap-to-Ignite NFC/QR con HMAC + replay-guard
- Cronotipo MEQ-SA, Resonancia, NOM-035 (72 ítems, 10 dominios, 5 categorías), 3 instrumentos psicométricos (PSS-4, SWEMWBS-7, PHQ-2)
- 5+ programas multi-día curados (Neural Baseline 14d, Recovery Week 7d, Focus Sprint 5d, Burnout Recovery, Executive Presence)
- Achievements, V-Cores, streaks

### Auth / sesiones
- NextAuth v5 JWT 8h
- 4 OIDC providers condicionales (Google, Azure, Okta, Apple)
- Magic-link branded por org (con DNS verify TXT)
- Phone SMS-OTP (Twilio o console-dev)
- WebAuthn / passkeys
- TOTP MFA RFC 6238 + backup codes scrypt + trusted device 30d + reset autoservicio
- DB-backed UserSession + lazy revoke 60s + sessionEpoch++ logout-all
- **NUEVO Phase 2:** MFA enforcement en `/api/sync/*` + `/api/coach` (no solo `/admin`)

### B2B / multi-tenant
- Multi-org + Membership + 5 roles (OWNER/ADMIN/MANAGER/MEMBER/VIEWER)
- Teams + Invitations bulk
- SCIM 2.0 (Users/Groups/ResourceTypes/Schemas/SPC) con API key + scope `scim` + rate-limit per-key
- **NUEVO Phase 2:** SCIM PATCH/PUT/DELETE con `active=false` ahora cascade revoca sessions + bumpea sessionEpoch + borra trusted devices
- SSO/SAML/OIDC por org con `ssoDomain` único + discovery
- Branding por org (logo, colors, customDomain con TXT verify, coachPersona)
- **NUEVO Phase 2:** audit chain verify ahora **streamed** (cursor 5K), escala a millones de entries
- Audit log hash chain SHA-256 + HMAC seal + retention configurable + S3 Object Lock interface (mock filesystem hasta AWS configurado)
- DSAR (GDPR Art 15/17/20) — auto-resolve ACCESS/PORTABILITY, ERASURE admin approval
- **NUEVO Phase 2:** DSAR ERASURE ejecuta `eraseUserData()` (revoca sessions, push, devices, accounts, phone OTPs, deactiva personal-org membership). Cron diario hace `hardDeleteExpiredUsers(graceDays:30)`
- Org security policies: requireMfa, sessionMaxAgeMinutes, ipAllowlist (CIDR IPv4)
- Impersonation HMAC + audit + hard expiry
- API keys con scopes + expiry + rotation
- Webhooks HMAC + secret rotation overlap + retry exponencial + **Phase 2:** event versioning header
- Stations físicas HMAC + replay-guard + slot policy
- Stripe billing 5 planes + checkout + portal + webhook + dunning + grace
- **NUEVO Phase 2:** `StripeEvent` idempotency table + cron `dunning-check` downgrade a FREE post-grace

### Compliance
- NOM-035 STPS Guía III aplicador 72 ítems server-recompute + agregado k≥5 + export ECO37 firmado
- **NUEVO Phase 2:** `nom35_items_hash` integrity check + `nom035TextValidatedByLawyer=false` flag (requiere review humano legal antes de imprimir actas oficiales)
- Status page público con incidents (investigating/identified/monitoring/resolved) + maintenance windows + RSS + email/webhook subscribers
- **NUEVO Phase 2:** maintenance T-24/T-0/complete + incident broadcast workers (cron every-minute / 5-min) — antes flags existían pero nadie los disparaba
- Notifications system per-user con kinds, levels, read/unread

### Coach LLM (Anthropic)
- Endpoint `/api/coach` streaming SSE
- **NUEVO Phase 2:** `resolveCoachModel(plan)` — Haiku free, Sonnet paid, Opus opt-in Enterprise
- **NUEVO Phase 2:** `CoachUsage` quota table — hard-cap mensual (5/100/500/∞) con 429 + `X-Quota-Reason: monthly_cap`
- **NUEVO Phase 2:** prompt cache 1h (vs 5min antes) — ahorro 60-80%
- Safety library con CRISIS_PATTERNS / SOFT_PATTERNS / PHQ-2 / PSS-4 + recursos por locale
- Memory `coachMemory.buildCoachContext` (cliente-only)
- **NUEVO Phase 2:** weekly LLM summary cron (Haiku 4.5, lunes 14:00 UTC) → push notification con 3 frases narrativas

### Wearables
- Webhook ingress con HMAC per-provider (Whoop, Oura, Garmin, Apple, Fitbit) — 5 secrets env distintos
- **NO IMPLEMENTADO (Sprint 6+):** OAuth user-flow para conectar cuenta. Eventos siguen llegando con `userId: null`. No hay reconciliation job.

### Marketing
- 8 verticales B2B (`/for-aviation` … `/for-tech`)
- 3 versus pages
- 3 learn articles
- Trust pages (DPA, SSO, subprocessors)
- ROI calculator
- BookDemoDrawer + PartnerApplyModal

### Background work (Phase 2 — antes inexistente)
- 11 cron tasks vía Vercel Cron + dispatcher `/api/cron/[task]` con `Authorization: Bearer ${CRON_SECRET}`:
  1. `audit-prune` — diario 03:00 UTC
  2. `audit-verify` — semanal domingo 04:00 UTC
  3. `audit-export` — diario 03:30 UTC (S3 mock o real según AWS config)
  4. `dsar-sweep` — diario 01:00 UTC (PENDING expiry + hard-delete post-30d)
  5. `dunning-check` — diario 01:30 UTC
  6. `maintenance-notify` — cada 5 min (T-24, T-0, complete)
  7. `incident-broadcast` — cada minuto (fan-out a subscribers)
  8. `trial-end-reminder` — diario 09:00 UTC
  9. `webhook-retry` — cada minuto (drena WebhookDelivery con nextRetry vencido)
  10. `push-deliver` — cada minuto (drena PushOutbox)
  11. `weekly-summary` — lunes 14:00 UTC (Haiku digest + push)

---

## 4. Flujos críticos end-to-end (post-Phase 2)

### A) Onboarding B2C
1. Usuario aterriza en `/` → CTA → `/signup`
2. NextAuth signin (OIDC, magic-link, phone OTP, passkey)
3. Callback `signIn` → `ensurePersonalOrg(userId, email)` upsert idempotente
4. Redirect a `/app`
5. PWA: `useStore.init({userId})` carga IDB; primera vez → `BioIgnitionWelcome`
6. Tutorial → calibración neural → primera sesión → post-session check-in
7. Outbox push a `/api/sync/outbox`. **Phase 2:** si org `requireMfa=true`, gate 403 hasta verificar MFA
8. Server merge con `mergeNeuralState`

### B) Onboarding B2B (admin nuevo)
1. CHRO vía `/demo` (sales-led) o Stripe Checkout self-serve
2. Stripe webhook → upsert org plan; **Phase 2:** `StripeEvent` fingerprint anti-duplicado
3. Owner accede `/admin` → invita miembros, configura SSO, branding, policies
4. Miembros → `/accept-invite/[token]` → magic-link branded

### C) Sesión típica
1. Usuario abre PWA → recommendation engine bandit + cohort prior + circadian + NOM-035 bias → propone protocolo
2. Tap orb → countdown → ignition flash + audio + haptics → loop 250ms
3. Eyes-closed UX TTS con cues
4. `sec=0` → `comp()` calcula sessionMetrics + `compositeReward`. **Phase 2:** si mood-post ausente pero HRV presente, reward inferido
5. Post-session check-in mood/energy/tag → outboxAdd → IDB persist → flush si online

### D) Billing
1. `/pricing` → `/api/billing/checkout` → Stripe Checkout
2. Webhook → resolveStripeEvent → orgUpdate. **Phase 2:** StripeEvent fingerprint check
3. `customer.subscription.deleted/paused` → `dunningState=canceled/paused`, `graceUntil=+90d`
4. **NUEVO Phase 2:** cron `dunning-check` diario downgrade a FREE post-grace

### E) DSAR ERASURE
1. User → `/me/dsar` POST kind=ERASURE
2. Admin (OWNER/ADMIN) revisa en `/admin/dsar` → APPROVED
3. **NUEVO Phase 2:** `eraseUserData(userId)` ejecuta soft-erasure inmediata (sessions revoke + sessionEpoch++ + push subs + trusted devices + accounts + phone OTPs + personal-org membership deactivated)
4. **NUEVO Phase 2:** cron `dsar-sweep` diario hace `hardDeleteExpiredUsers(graceDays:30)` → User.delete cascade

### F) Coach LLM
1. PWA → `/api/coach` POST con messages + userContext
2. **Phase 2:** CSRF + auth + MFA gate + rate-limit (60/min) + **quota mensual** + plan-based model selection
3. Streaming SSE → cliente render incremental
4. Post-success: `coachUsage.upsert` increment requests + audit log

### G) Reportes B2B (NUEVO Phase 2)
1. Admin `/admin/neural` → GET `/api/v1/orgs/[orgId]/neural-health`
2. Server agrega `NeuralSession` + `User.neuralState` summaries (k-anon ≥5)
3. Devuelve `computeOrgNeuralHealth` + `computeProtocolEffectiveness` con Cohen's d / CI95 / hit rate / verdict + actions

---

## 5. Modelo conceptual del producto (post-Phase 2)

**Conceptos centrales (sin cambio):**

1. **Org** (tenant) — `personal=true` o B2B
2. **Membership** (User × Org × Role)
3. **Protocolo** — receta de fases × intent (calma/enfoque/energía/reset)
4. **Session** (NeuralSession) — instancia ejecutada
5. **Baseline Neural** — composite 0-100
6. **Operador** — rol del usuario en PWA
7. **Readiness** — fusión 0-100 coherencia/calma/energía
8. **V-Cores** — moneda gamificada
9. **Programa** — trayectoria curada multi-día
10. **Estación** — punto físico NFC/QR firmado HMAC
11. **Audit log** con hash chain
12. **DSAR** (GDPR Art 15/17/20)
13. **NOM-035** evaluación
14. **Cohort prior** (NUEVO en backend operativo) — la respuesta del equipo refina baseline literatura

**Inconsistencias de naming pendientes (NO resueltas en Phase 2 — son frontend):**
- "sesión" vs "ignición" vs "pulso" vs "tap" — 4 nombres para lo mismo
- 6+ scores derivados (V-Cores, Mood, Readiness, BioSignal, Estado neural, Composite, Variabilidad Neural, Rendimiento Neural, etc.) — caos UX, requiere mental model claro en reconstrucción

Estos son problema de la reconstrucción frontend. Backend los resuelve definiendo en `FINAL_FEATURES_CATALOG.md` cuáles son las verdades primarias.

---

## 6. Estado de pruebas y CI

- **2762 tests** vitest (118 archivos) — todos verdes.
- **TypeScript strict-off check** — sin errores.
- **Cobertura**: ≥70% líneas/funciones en `src/lib/*` y `src/hooks/*`.
- **Cobertura faltante (gap conocido):** los handlers `app/api/*` tienen tests parciales solo donde la lib subyacente es testeable. Phase 3 follow-up.

---

## 7. Estado de migraciones

| Migración | Estado |
|---|---|
| 0001_baseline … 0021_push_subscriptions | aplicadas en prod (histórico) |
| `0022_sprint1_compliance` (Phase 2) | **lista, NO aplicada a prod** — se aplica en próximo `npm run build` (script `migrate-if-db.js`) |
| `0023_coach_usage_push_outbox` (Phase 2) | **lista, NO aplicada a prod** — idem |

Las migraciones nuevas son idempotentes (`IF NOT EXISTS`, `DO $$ NOT EXISTS` para constraints) — seguras de re-ejecutar.

---

## 8. Veredicto final

El sistema **POST Phase 2** tiene:

✅ **Listo para producción enterprise** en estos aspectos:
- Auth + multi-tenant + audit + DSAR + GDPR Art 17 cascade + Stripe idempotency + SCIM cascade revoke + push delivery server-side
- Inteligencia neural exposable al frontend (engine-health + cohort + org-health endpoints)
- Coach con quota + plan-tiered models + 1h cache
- 11 crons que ejecutan tareas de mantenimiento

⚠️ **Claims que el código sostiene pero requieren ops/legal action:**
- "Audit S3 WORM" — interface lista, requiere AWS bucket + creds + `npm i @aws-sdk/client-s3`
- "NOM-035 STPS oficial" — texto verificado integridad SHA-256, pero `nom035TextValidatedByLawyer=false` hasta review humano legal vs DOF
- "MFA-required" — ahora real en `/app` data egress + `/coach`

❌ **Claims pendientes (Phase 3+ / Sprint 6+):**
- "Conecta tu Whoop / Oura" — no hay OAuth flow user-side (webhooks ingress sí, vincular cuenta no)
- "Slack & Teams notifications" — Integration config sí, dispatcher no
- "Annual SOC 2 Type II" — claim de marketing, audit S3 ya implementable (siguiente paso)
- "IPv6 IP allowlist" — deferred explícitamente
- "RLS Postgres multi-tenant" — pendiente para Fase 3 (compromiso documentado en ROADMAP.md)

El sistema **NO está listo** para vender Enterprise tier (>$50K/año contract value) sin RLS Postgres + S3 Object Lock real + Whoop/Oura OAuth real + SAML signed assertion validation. Está listo para todos los tiers inferiores.
