# FINAL_FEATURES_CATALOG.md — Catálogo de features que el frontend nuevo debe exponer

**Fecha:** 2026-05-01.
**Audiencia:** asesor externo + reconstrucción frontend Phase 3.

> Este es el documento más importante para Phase 3. Lista TODAS las features que el frontend nuevo debe ofrecer al usuario, organizadas por audiencia (B2C / B2B / Admin / Platform-admin) y por flow. Cada item indica QUÉ hace, QUÉ datos consume del backend, QUÉ endpoints usa, QUÉ inputs requiere del usuario, QUÉ outputs genera, y VALOR para el usuario.

---

## Audiencia A — Operador B2C (PWA `/app`)

### A.1 Sesión neural — el core del producto

**Qué hace:** ejecuta protocolo de 60-180s con audio + haptics + voz + visualización.

**Datos que consume:**
- `protocols.js` — catálogo 14 active + 3 training + 3 crisis con fases, breath cycles, scripts iExec.
- `User.neuralState.banditArms` para selección.
- `getColdStartPrior()` + cohort prior si org disponible.
- `evaluateEngineHealth(state)` — para mostrar "modo cold-start" / "personalizado" al usuario.
- `pauseFatigue.detectPauseFatigue` para recomendación adaptativa.

**Endpoints:**
- `GET /api/sync/state` — hidrata IDB al login.
- `GET /api/v1/me/neural-priors` — cohort prior (Phase 2 confirmado vivo).
- `GET /api/v1/me/neural-health` — engine health snapshot (NUEVO Phase 2).
- `POST /api/sync/outbox` — push de session + checkin.

**Inputs del usuario:**
- Tap en orb para iniciar.
- Pre-mood scale (Likert opcional).
- Post-mood scale + energy + tag (opcional).

**Outputs:**
- HRV pre/post delta.
- V-Cores ganados.
- Mood delta visual.
- Achievement unlock si aplica.

**Valor al usuario:** reset rápido en 60-180s con efecto inmediato medible.

**Estado actual:** completo en backend; UI cosmética PWA en E1-E21 + cascade global completados (mayo 2026); reconstrucción Phase 3 va a refactorizar la UI, NO la lógica.

### A.2 Calibración inicial (onboarding)

**Qué hace:** setea baseline neural del usuario.

**Datos:**
- Cronotipo MEQ-SA (`chronotype.js`).
- Resonancia respiratoria 5 ensayos.
- Primera medición HRV (BLE o cámara PPG).

**Endpoints:**
- `POST /api/sync/outbox` con kind=`chronotype`, `hrv`.

**Valor:** el motor empieza a personalizar desde día 1.

### A.3 NOM-035 evaluación personal

**Qué hace:** aplica 72 ítems Likert 0-4, agrupa por dominio + categoría, devuelve nivel de riesgo (nulo/bajo/medio/alto/muy_alto).

**Endpoints:**
- `POST /api/v1/nom35/responses` — server recomputa scoring.
- `GET /api/v1/nom35/responses` — última respuesta del user.

**Outputs:**
- PDF firmado SHA-256 (`Nom35PersonalReport.jsx`).
- Recomendación textual + intent bias para futuras sesiones.

**Valor:** legal/HR compliance + bias del motor adaptativo a las áreas de riesgo del user.

**⚠️ Phase 2 disclaimer:** `nom035TextValidatedByLawyer = false`. Los reportes oficiales DEBEN mostrar disclaimer "Texto pendiente de validación legal vs DOF".

### A.4 Estado del motor neural ("transparency dashboard")

**Qué hace:** muestra al usuario qué tan personalizado está el motor + qué predicciones está haciendo + cómo está calibrado.

**Datos de `evaluateEngineHealth(state)`:**
- `dataMaturity`: cold-start / learning / personalized.
- `predictionAccuracy.hitRate %`.
- `recommendationAcceptance.value`.
- `personalizationStrength` con signals booleanos.
- `staleness.level + recalibrationNeeded`.
- `fatigue.level`.
- `actions[]` accionables.

**Endpoint:** `GET /api/v1/me/neural-health` (NUEVO Phase 2).

**Inputs:** ninguno (lectura pura).

**Outputs UI:**
- Badge "Motor: Aprendiendo (3/5 sesiones)" / "Motor: Personalizado".
- Hit rate visible (% predicciones correctas).
- Banner si `staleness ≥ cooling`: "Han pasado X días, recalibrar".
- Banner si `fatigue.severe`: "Hagamos calma 60s".

**Valor:** transparency que es retention. Calm/Headspace son cajas negras — esto es diferenciador.

**Estado:** endpoint listo; UI a construir Phase 3.

### A.5 Coach LLM conversacional

**Qué hace:** chat streaming con Claude Sonnet/Haiku según plan, contextualizado con `coachContext` (mood trajectory, top protocols, instruments).

**Endpoint:** `POST /api/coach` (streaming SSE).

**Pre-checks:** auth + CSRF + MFA gate (Phase 2) + rate-limit 60/min + quota mensual (Phase 2).

**Inputs:**
- Mensajes (array de `{role, content}`, max 50).
- `userContext` opcional con coherencia/resiliencia/capacidad/recent/mood/timezone/hour.

**Outputs:**
- SSE events `{delta: text}` incremental + `{done: true}`.

**Caps por plan (Phase 2):**
- FREE: 5 msgs/mes (Haiku 4.5)
- PRO: 100 msgs/mes (Sonnet 4.6)
- STARTER: 500 msgs/mes (Sonnet 4.6)
- GROWTH: ∞ (Sonnet 4.6)
- ENTERPRISE: ∞ (Sonnet 4.6 default; Opus opt-in via `COACH_OPUS_FOR_ENTERPRISE=1`)

**Safety:**
- CRISIS_PATTERNS / SOFT_PATTERNS detection client-side via `coachSafety.evaluateSafetySignals` antes de mandar.
- Si `level=crisis` → UI muestra recursos locales y NO envía al LLM.

**Valor:** acompañamiento conversacional accesible 24/7 con guardrails.

### A.6 Programs (trayectorias multi-día)

**Qué hace:** programa curado de 5-14 días con sesiones específicas por día.

**Catálogo (≥5):**
- Neural Baseline (14d) — descubrir intent ganador
- Recovery Week (7d) — post-crisis
- Focus Sprint (5d) — alta demanda cognitiva
- Burnout Recovery
- Executive Presence

**Endpoints:** persistencia local en `useStore` + outbox.

**Acciones:** startProgram(id), completeProgramDay(day), finalizeProgram(), abandonProgram().

**Valor:** convierte "biblioteca de sesiones sueltas" en "journey" estilo Calm/Headspace.

### A.7 HRV historial + trend

**Qué hace:** muestra log de HRV (BLE strap o cámara PPG), trend lnRMSSD, comparación con baseline.

**Datos:** `User.neuralState.hrvLog` (cap 365 entries).

**Outputs:**
- Sparkline HRV.
- Delta vs baseline.
- ⚠️ NO comparison con normas poblacionales todavía (oportunidad B.6 del análisis).

### A.8 Mood log + trend

Similar a HRV.

### A.9 V-Cores + Streaks + Achievements

**Qué hace:** gamification.

**Datos:** `User.neuralState.{vCores, streak, bestStreak, achievements, streakFreezes}`.

**Acciones especiales:** `freezeStreak()` máx 2/mes — pausa honesta sin falsear racha.

### A.10 Tap-to-Ignite (NFC/QR)

**Qué hace:** scan de estación física → inicia sesión + atribuye a `Station`.

**Datos:** `Station` con HMAC signing key, `StationTap` con replay-guard.

**Backend:** `lib/stationSig.js`, `lib/stationSlot.js`, server-side sig verify.

**Valor B2B:** lobbies, salas de breakout. Puntos físicos de adopción wellness sin forzar app.

### A.11 Settings (notificaciones, audio, voz, haptic, theme)

**Qué hace:** personalizar la experiencia sensorial.

**Datos persistidos:** `voiceOn`, `voiceRate`, `voicePreference`, `masterVolume`, `wakeLockEnabled`, `reducedMotionOverride`, `musicBedOn`, `binauralOn`, `hapticIntensity`, `remindersEnabled` + hour/min, `sleepTargetHours`.

**Valor:** control fino sin perderse en menus.

### A.12 DSAR autoservicio

**Qué hace:** GDPR Art 15/17/20 self-serve.

**Endpoint:** `POST /api/v1/me/dsar` con `{kind: "ACCESS"|"PORTABILITY"|"ERASURE", reason?}`.

**Auto-resolve:** ACCESS y PORTABILITY → artifactUrl al export.
**ERASURE:** PENDING hasta admin approval.

**Phase 2 NUEVO:** ERASURE approved → `eraseUserData()` inmediato + cron `dsar-sweep` hace `hardDeleteExpiredUsers(30d)`.

**Valor:** legal compliance + control del usuario sobre sus datos.

### A.13 Account export (GDPR)

**Endpoint:** `GET /api/v1/users/me/export` — JSON completo del User.neuralState + sessions + memberships.

### A.14 Push notifications (Phase 2 NUEVO)

**Qué hace:** recibe push notifications cross-device server-driven.

**Tipos:**
- `weekly-digest` (NUEVO Phase 2) — cada lunes resumen narrativo Haiku.
- `reminder` — recordatorio diario configurable.
- `notification` — incidents, billing alerts, etc.

**Backend:** `PushOutbox` queue + cron drain + `web-push`.

**Subscripción:** `POST /api/push/subscribe` con VAPID PushSubscription.

**Valor:** retention activa. Antes era setTimeout cliente (solo si tab abierto).

### A.15 Sesiones activas (account security)

**Qué hace:** lista devices con UserSession activos, permite revocar uno.

**Endpoints:**
- `GET /api/v1/me/sessions`
- `DELETE /api/v1/me/sessions/[id]`

### A.16 MFA management

**Qué hace:** setup TOTP, generate backup codes, manage trusted devices, MFA reset request.

**Endpoints:**
- `POST /api/auth/mfa/setup`
- `POST /api/auth/mfa/verify`
- `POST /api/auth/mfa/disable`
- `GET/POST /api/auth/mfa/backup-codes`
- `DELETE /api/auth/mfa/trusted-devices/[id]`
- `POST /api/v1/mfa-reset-request`

### A.17 Notifications inbox

**Qué hace:** lista de Notification per-user con kinds, levels, read/unread.

**Endpoints:**
- `GET /api/notifications/recent`
- `POST /api/v1/me/notifications/read-all`
- `PATCH /api/v1/me/notifications/[id]/read`

### A.18 Multi-org switcher

**Qué hace:** si user es miembro de varios orgs, switch contexto.

**Datos:** `session.memberships` (Phase 2 sin cambio).

---

## Audiencia B — Admin B2B (`/admin/*`)

### B.1 Org overview

**Qué muestra:** miembros count, sesiones último 30d, ROI estimate, billing status.

**Endpoint:** queries existentes en server-side render del admin layout.

### B.2 Members management

**Endpoints:**
- `GET /api/v1/members`
- `POST /api/v1/members` o `/api/invite/bulk`
- `DELETE /api/v1/orgs/[orgId]/members/[userId]/revoke-sessions`

### B.3 Teams management

**Endpoints:**
- `GET/POST /api/v1/teams`
- `PATCH/DELETE /api/v1/teams/[id]`

### B.4 SSO config

**Endpoints:**
- `GET/PUT/DELETE /api/v1/orgs/[orgId]/sso`
- Domain verify TXT challenge: `GET/POST/DELETE /api/v1/orgs/[orgId]/domain/verify`

### B.5 SCIM provisioning

**Endpoints:**
- `/api/scim/v2/{Users, Users/[id], Groups, Groups/[id], ServiceProviderConfig, Schemas, ResourceTypes}`

**Phase 2 NUEVO:** PATCH/PUT/DELETE `active=false` cascade revoca sessions + bumpea epoch + borra trusted devices.

### B.6 Branding

**Endpoints:**
- `GET/PUT /api/v1/orgs/[orgId]/branding`

**Campos:** logo, colors, customDomain, **coachPersona** (oportunidad: agregar UI editor — campo huérfano hasta hoy).

### B.7 Audit log + retention + verify + export

**Endpoints:**
- `GET /api/v1/orgs/[orgId]/audit/count`
- `GET /api/v1/orgs/[orgId]/audit/export` (NDJSON 50K cap)
- `GET /api/v1/orgs/[orgId]/audit/verify` (Phase 2: streamed cursor 5K)
- `PATCH /api/v1/orgs/[orgId]/audit/retention` (días 30..2555)

**Phase 2 NUEVO:** `auditLastVerifiedAt + auditLastVerifiedStatus + auditLastPrunedAt` se actualizan automáticamente vía crons. UI puede mostrar "última verificación: hace X días".

### B.8 Compliance pack (SOC2 evidence)

**Endpoints:**
- `GET /api/v1/orgs/[orgId]/compliance`
- `GET /api/v1/orgs/[orgId]/compliance/export`

**Outputs:** snapshot config (SSO, MFA, audit retention, SCIM keys, recent rotations).

### B.9 DSAR resolución (admin)

**Endpoints:**
- `GET /api/v1/orgs/[orgId]/dsar`
- `POST /api/v1/orgs/[orgId]/dsar/[id]/resolve`

**Phase 2 NUEVO:** APPROVED ERASURE → ejecuta `eraseUserData(userId)` cascade.

### B.10 Org sessions overview (admin view de members)

**Endpoint:** `GET /api/v1/orgs/[orgId]/sessions`

**Acción:** revocar device de un member: `DELETE /api/v1/orgs/[orgId]/sessions/[sessionId]`.

### B.11 Security policies

**Endpoint:** `GET/PATCH /api/v1/orgs/[orgId]/security`

**Campos:** `requireMfa`, `sessionMaxAgeMinutes`, `ipAllowlist[]`, `ipAllowlistEnabled`.

**Phase 2 NUEVO:** `requireMfa` ahora se enforce real en `/app` data egress (`/api/sync/*`) y `/api/coach`, no solo `/admin`.

### B.12 API keys lifecycle

**Endpoints:**
- `GET/POST /api/v1/api-keys`
- `DELETE /api/v1/api-keys/[id]`
- `POST /api/v1/api-keys/[id]?action=rotate`

### B.13 Webhooks management

**Endpoints:**
- `GET/POST /api/v1/webhooks`
- `PATCH/DELETE /api/v1/webhooks/[id]`
- `POST /api/v1/webhooks/[id]?action=rotate` (overlap zero-downtime)
- `POST /api/v1/webhooks/[id]?action=test`
- `GET /api/v1/webhooks/[id]/deliveries`

**Phase 2 NUEVO:** `webhook-event-version: 1` header en payloads.

### B.14 Integrations (Slack/Teams/Okta/Workday — parcial)

**Endpoints:**
- `GET/POST /api/v1/integrations`
- `POST /api/v1/integrations/test`
- `PATCH/DELETE /api/v1/integrations/[id]`

**⚠️ Phase 2 NO ejecutado:** dispatcher real Slack/Teams (sigue siendo "Integration config sí, dispatcher no"). Sub-item de Sprint 6+.

### B.15 Stations management

**Endpoints:**
- `GET/POST /api/v1/stations`
- `PATCH/DELETE /api/v1/stations/[id]`

### B.16 NOM-035 admin reports

**Endpoints:**
- `GET /api/v1/nom35/aggregate` (k-anon ≥5)
- `GET /api/v1/nom35/aggregate/export` (CSV)

**⚠️ Gap pendiente:** sin filtro de fecha — Phase 3 follow-up trivial (`?from=&to=`).

### B.17 Org neural health dashboard (NUEVO Phase 2)

**Endpoint:** `GET /api/v1/orgs/[orgId]/neural-health`

**Outputs:**
- `neuralHealth`: maturity %, staleness %, top protocols, verdict (`at-risk/mature/early/developing`), actions sugeridas.
- `protocolEffectiveness[]`: por protocolo Cohen's d, CI95, hitRate, distinctUsers, significant flag, effectSize label (`large/medium/small/trivial`).

**Valor B2B premium:** reporte estadístico real (no solo conteos) que People Ops/CHRO presenta al CFO.

### B.18 Billing + invoices

**Endpoints:**
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- (webhook Stripe handles internally)

### B.19 Onboarding wizard

**Endpoints:**
- `POST /api/v1/onboarding`

**Pasos:** plan + invite team + SSO setup + branding + policies.

### B.20 Coach quota dashboard (NUEVO Phase 2 — UI a construir)

**Datos:** `CoachUsage` table per org/user/month.

**Outputs UI:**
- Total mensajes consumidos por month.
- % del cap usado.
- Breakdown por user (k-anon ≥5).

**Endpoint:** queryable via dashboard SSR; no hay endpoint dedicado todavía — oportunidad Phase 3 follow-up.

---

## Audiencia C — Platform-admin (cross-org, super admin)

### C.1 Health endpoint

`GET /api/v1/health/metrics` — público.

### C.2 Incidents management

**Endpoints:**
- `GET/POST /api/v1/incidents`
- `POST /api/v1/incidents/[id]/updates`

**Phase 2 NUEVO:** cron `incident-broadcast` fan-out a IncidentSubscriber automático.

### C.3 Maintenance windows

**Endpoints:**
- `GET/POST /api/v1/maintenance`
- `PATCH /api/v1/maintenance/[id]/status`

**Phase 2 NUEVO:** cron `maintenance-notify` flippea `notifiedT24/T0/complete` automático.

### C.4 Status subscribers

**Endpoint:** `POST /api/v1/status/subscribe` (público, email + magic-link verify), `/api/status/{verify, unsubscribe}`.

### C.5 Impersonation

**Endpoints:**
- `POST /api/admin/impersonate`
- `GET /api/admin/impersonate/consume/[token]`

### C.6 Lead capture

**Endpoint:** `POST /api/v1/leads` — público con CSRF + rate-limit IP-based + honeypot.

### C.7 Support tickets

**Endpoint:** `POST /api/support`

---

## Audiencia D — Background workers (cron, NO user-facing pero importantes para frontend display)

Cada cron actualiza estado que el frontend muestra:

| Cron | Frontend impacto |
|---|---|
| `audit-prune` | `Org.auditLastPrunedAt` visible en `/admin/audit` |
| `audit-verify` | `Org.auditLastVerifiedAt + Status` visible ditto |
| `audit-export` | manifests en log + S3 keys |
| `dsar-sweep` | DSAR EXPIRED visible + users hard-deleted desaparecen |
| `dunning-check` | plan downgrade reflejado en `/admin/billing` |
| `maintenance-notify` | flags en MaintenanceWindow |
| `incident-broadcast` | IncidentSubscriber.lastNotifiedAt |
| `trial-end-reminder` | Notification con kind=billing.trial_end_soon |
| `webhook-retry` | WebhookDelivery.attempts/status |
| `push-deliver` | PushOutbox status sent/failed/exhausted |
| `weekly-summary` | Push notification entregada lunes |

---

## Inventario de páginas que el frontend nuevo debe ofrecer

### B2C operador (PWA `/app/*`)
1. `/app` (home dashboard)
2. `/app/session` (orb + ignition)
3. `/app/profile`
4. `/app/calibration` (cronotipo + resonancia + HRV baseline)
5. `/app/programs` (catálogo + active program)
6. `/app/coach` (chat con LLM)
7. `/app/history` (sesiones + HRV + mood trends)
8. `/app/instruments` (PSS-4, SWEMWBS-7, PHQ-2)
9. `/app/nom35` (aplicador 72 ítems + reporte personal)
10. `/app/settings` (notifs, audio, voz, haptic, privacy, MFA, sessions, DSAR, account export)
11. `/app/engine-health` (NUEVO Phase 2 — transparency)
12. `/app/notifications` (inbox)

### Auth shell
13. `/signin`, `/signup`, `/recover`, `/verify`, `/mfa`, `/accept-invite/[token]`, `/account`, `/handle`, `/q`

### Marketing público (existente, no se reescribe)
14. `/`, `/why`, `/pricing`, `/demo`, `/evidencia`, `/trust/*`, `/changelog`, `/status`, `/learn/*`, `/for-*`, `/vs/*`, `/roi-calculator`, `/aup`, `/cookies`, `/privacy`, `/terms`, `/team-preview`, `/kit`, `/docs`, `/share`, `/nom35` (público), `/reporte`

### Admin B2B (`/admin/*`)
15-39. Las 24 páginas existentes (`/admin`, `/admin/members`, `/admin/teams`, `/admin/sso`, `/admin/billing`, `/admin/audit`, `/admin/security`, `/admin/api-keys`, `/admin/webhooks`, `/admin/integrations`, `/admin/branding`, `/admin/stations`, `/admin/neural`, `/admin/compliance` + DSAR, `/admin/nom35` + documento, `/admin/health`, `/admin/incidents`, `/admin/maintenance`, `/admin/onboarding`)

40. **NUEVO Phase 2:** `/admin/coach-usage` (quota dashboard) — sub-item Phase 3 follow-up.

### Settings org-level (`/settings/*`)
41-44. `/settings/security/mfa`, `/settings/sessions`, `/settings/sso`, `/settings/data-requests`, `/settings/neural`, `/team`

---

## Resumen Phase 3 — qué construir como mínimo

**Tier 1 (críticas para reconstrucción):**
- A.1 sesión (mantener funcional, redesign UI)
- A.2 calibración onboarding
- A.3 NOM-035 personal
- A.4 estado del motor neural (NUEVO endpoint Phase 2)
- A.5 coach LLM
- A.7-8 HRV/mood trends
- A.9 V-Cores/streaks/achievements
- A.10 tap-to-ignite
- A.11 settings
- A.12-13 DSAR + export
- A.14 push notifications inbox
- A.18 multi-org switcher

**Tier 2 (importantes):**
- A.6 programs UI
- A.15 sessions/devices
- A.16 MFA management
- A.17 notifications inbox

**Tier 3 (admin B2B — todas)**
- B.1 a B.19 + B.20 coach-usage dashboard

**Tier 4 (platform-admin — pocos pero existentes)**
- C.1 a C.7

**Lo que el frontend NUEVO no construye en Phase 3 (Sprint 6+ sigue):**
- Wearable OAuth UI (Whoop/Oura).
- Slack/Teams dispatcher UI.
- HrvSample/MoodSample dedicated visualizations (require backend tabla migration first).
