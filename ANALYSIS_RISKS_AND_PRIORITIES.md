# ANALYSIS_RISKS_AND_PRIORITIES.md — Riesgos consolidados + priorización Fase 2

**Fecha:** 2026-05-01 · **Reglas:** severidad real · esfuerzo verificable.

---

## 1. Compliance — gaps críticos

| # | Hallazgo | Severidad | Esfuerzo | Audit anterior decía |
|---|---|---|---|---|
| 1 | **Sin Row-Level Security Postgres** | alta | XL | igual |
| 2 | **`requireMfa` no enforce en `/app` PWA ni `/api/sync/*`** | alta | M | igual |
| 3 | **Audit S3 Object Lock es PLACEHOLDER explícito** (`audit-export.js:25-28`) | alta | M | "S3 long-term export" — implícito que existe; falso |
| 4 | **`audit-export.js:13` BUG**: `db().auditLog` sin `await` | alta (función rota) | trivial | no detectado |
| 5 | **DSAR ERASURE soft-delete sin sweeper hard-delete** | alta (Art 17 incompleto) | S + cron | no detectado |
| 6 | **DSAR cascade incompleto** — no revoca API keys / webhooks / sessions del user borrado | alta (Art 17 incompleto) | S | no detectado |
| 7 | **Magic-link console fallback en prod** = secret leak en logs | alta | trivial | igual |
| 8 | **NOM-035 server-recompute** | ✅ OK ya | — | "client-side, manipulable" — **falso** |
| 9 | **Wearable HMAC per-provider** | ✅ OK ya | — | "single env var, providers comparten" — **falso** |
| 10 | **IPv6 IP allowlist deferred** (decision documentada) | media | M | igual |
| 11 | **`User.deletedAt` sin índice** | bajo | S | no detectado |
| 12 | **`WearableEvent.userId onDelete:SetNull` deja huérfanos** | media | S | no detectado |
| 13 | **SAML signed assertion validation no visible en código** | crítica si aplica (NextAuth puede delegar; confirmar) | L | no detectado |
| 14 | **SCIM PATCH `active=false` no revoca sessions/API keys** | alta | M | no detectado |
| 15 | **Audit retention prune sin cron** — solo on-demand | media | S + cron | parcial |
| 16 | **DSAR expiry sweeper sin cron** | media | S + cron | no detectado |
| 17 | **Audit chain verify scheduled sin cron** | media | S + cron | no detectado |
| 18 | **`Org.auditLastVerifiedAt` nunca se actualiza** | media | depende de #17 | no detectado |
| 19 | **HMAC key rotation (`AUDIT_HMAC_KEY`) no documentado** | media | M | no detectado |
| 20 | **NOM-035 texto literal vs DOF oficial — pendiente verificación** (comentario explícito en `items.js:13`) | medio (riesgo legal si imprime actas) | S — diff vs DOF | no detectado |

---

## 2. Performance / escalabilidad — bottlenecks

| # | Hallazgo | Severidad | Esfuerzo |
|---|---|---|---|
| 1 | **`verifyChain(orgId)`** carga toda la cadena en memoria — OOM en orgs grandes | alta a >50K rows | M (cursor batched) |
| 2 | **`/api/v1/nom35/aggregate`** sin filtro de fecha — full scan | media | S |
| 3 | **`/api/v1/orgs/[orgId]/audit/export`** carga 50K rows antes de stream | media | S (NDJSON streaming) |
| 4 | **`computeProtocolEffectiveness`** y `computeOrgNeuralHealth` se aplican post-fetch en memoria | media | S si orgs <50K members |
| 5 | **`User.neuralState` JSON sin techo** — HRV/mood/instrumentos viven en JSON; queries SQL imposibles | alta a escala | L (promote a tablas) |
| 6 | **`anonymize` agregados** carga todo en memoria | media | M |
| 7 | **N+1 sospechado** en `/admin` overview — 4 queries paralelas + memberships find | bajo | M (test APM real) |
| 8 | **In-memory rate-limit fallback per-réplica** — multiplica límite real ×N en serverless | alta si REDIS_URL no se setea en prod | trivial (checklist deploy) |
| 9 | **Coach LLM sin quota mensual** = costo runaway potencial | media | M |
| 10 | **OpenTelemetry instrumentado pero sin endpoint** — sin OTLP no hay traces | bajo | S (configurar exporter) |
| 11 | **React Compiler off** — pierde memo automático | bajo | M (re-evaluar TDZ risk) |

---

## 3. Seguridad — hallazgos no de compliance

| # | Hallazgo | Severidad | Esfuerzo |
|---|---|---|---|
| 1 | **CSRF se aplica donde `requireCsrf` se llama explícito** — opt-in no auto-enforced | media | S (audit handlers) |
| 2 | **Validación de inputs no es universal** — Zod existe en deps pero no en handlers | media | M (introducir middleware Zod) |
| 3 | **`dangerouslyAllowSVG: true`** — mitigado por CSP imagen pero requiere auditar SVGs servidos | bajo | S |
| 4 | **API key scope enforcement runtime no visible** — keys con scope "scim" pueden hacer non-SCIM ops | media | M |
| 5 | **Bandit corre client-side**, server persiste arms sin recompute → cliente puede falsear arms | bajo (per-user, no cross-tenant) | M (server recompute si se quiere) |
| 6 | **No hay tabla `StripeEvent` para fingerprinting** | bajo | S |
| 7 | **Notifications cleanup** — `Notification.orgId onDelete:SetNull` deja huérfanos | bajo | S |
| 8 | **`SupportTicket` orgId/userId SetNull** — tickets de user borrado siguen visibles a admin | bajo | S |
| 9 | **`PLATFORM_ADMINS` env CSV hardcoded** — no DB, no rotación | bajo | M (mover a tabla) |
| 10 | **Coach modelo hardcoded** (`claude-sonnet-4-6`) — no lee env | trivial | trivial |

---

## 4. Tenancy y aplicacional sin RLS — riesgos derivados

- Todas las tablas dependen de filtrado en código.
- Patrón `requireMembership(session, orgId, action)` es el guardian, pero **opt-in**.
- No hay test de integridad cross-tenant que detectaría una nueva ruta filtrando mal.
- **Mitigación parcial:** RBAC declarativo + audit log. **No es defensa en profundidad.**

**Recomendación Fase 2 o Fase posterior:** introducir RLS Postgres por tabla. Esfuerzo XL pero defensa real. Mínimo: `Org`, `Membership`, `NeuralSession`, `AuditLog`, `Nom35Response`, `WearableEvent`.

---

## 5. Memory leaks / race conditions

- **Race en `signIn` ↔ `outbox` upsert** del personal-org → ✅ resuelto Sprint 93.
- **Race en `auditLog` writes** → ✅ resuelto con `pg_advisory_xact_lock`.
- **Race en rate-limit-key dual-bucket** → documentada y aceptada (over-consumption ~2 req).
- **`webhooks.js setTimeout` fire-and-forget** — callbacks pueden perderse en redeploy. Aceptable (retry logic salva intentos fallidos parciales).
- **`rate-limit-key.js memBuckets` sin TTL** — memory bloat si Redis down y carga sostenida.
- **BLE listener cleanup** — hooks limpian en useEffect, OK.

**No detectado leak crítico server-side.** Confirmable solo con APM en prod.

---

## 6. Deuda técnica acumulada

| # | Item | Severidad | Esfuerzo |
|---|---|---|---|
| 1 | **Tests cubren `lib/` no `app/api/*`** — regresiones en handlers no se detectan | alta | XL (coverage gap real) |
| 2 | **`page.jsx` 58 KB monolítico** — refactor a hooks "in progress" | media | XL — pero está documentado como work-in-progress; **NO TOCAR EN ESTA SESIÓN** (frontend) |
| 3 | **Variables cortas legacy (`st`, `pr`, `bL`)** | bajo | M |
| 4 | **`progDay` legacy deprecated pero código sobrevive** | trivial | S — limpieza |
| 5 | **`preview-runner.html`** archivo de 23KB obsoleto en raíz | trivial | S |
| 6 | **CHANGELOG.md desactualizado** | bajo | S |
| 7 | **`SYSTEM_OVERVIEW.md` afirma "46 ítems NOM-035"** — son 72 | bajo | S — actualizar doc |
| 8 | **`BACKEND_AUDIT.md` afirma fallos en NOM-035 y wearables que no existen** | bajo | S — superseded por este doc |
| 9 | **Programs `programDay` legacy** (Sprint 77) | trivial | S |
| 10 | **i18n locales completitud no auditada** — probable parciales | bajo | M (script verifica missing keys) |
| 11 | **OpenAPI spec audit pendiente** — qué cubre, si está actualizado | bajo | S |
| 12 | **`docs/legal` directorio existe** pero contenido no auditado en este pase | bajo | S |
| 13 | **Coach `org.branding.coachPersona` campo huérfano** — usado en prompt, no en UI | trivial | S |

---

## 7. Dependencias entre items

Algunas mejoras dependen de otras:

- `wearable OAuth real` (C.4) requiere `wearable reconciliation job` que requiere `job queue` (F.1).
- `audit S3 Object Lock real` (F.2) y `audit verify scheduled` (item 17) requieren `job queue` (F.1).
- `DSAR hard-delete` (item 5) y `DSAR expiry sweeper` (item 16) requieren `job queue` (F.1).
- `maintenance T-24/T-0`, `incident broadcast`, `trial-end reminder`, `push delivery server-side` → todos requieren `job queue` (F.1).
- **`F.1 (job queue) es upstream de ~10 items.** Es la oportunidad #1 por desbloqueo.**
- `Engine health endpoint` (F.5) y `cohort prior endpoint` (A.2) son independientes y rápidos — buenos quick-wins paralelos.
- `MfaPolicy enforcement` (item 2 / F.4) es independiente — buen quick-win compliance.

---

## 8. Plan recomendado Fase 2 (priorizado)

### Sprint 1 — Compliance hard fixes (S/M, alta criticidad)
1. **#7 magic-link console fallback** → fail boot en prod sin EMAIL_SERVER (trivial).
2. **#4 `audit-export.js` await fix** (trivial).
3. **#11 `User.deletedAt` index** (S).
4. **#12 `WearableEvent` cascade fix** (S).
5. **#6 DSAR cascade real** — `eraseUserData(userId)` lib (S).
6. **F.7 StripeEvent tabla** (S).
7. **F.13 `COACH_MODEL` env honored + plan-gate coach** (S).
8. **#20 NOM-035 ítems vs DOF — verificar texto literal** (S).

### Sprint 2 — Job queue infraestructura
9. **F.1 Vercel Cron + dispatcher `/api/cron/[task]`** (L).
10. **#15 audit retention prune cron**.
11. **#16 DSAR expiry sweeper**.
12. **#5 DSAR hard-delete tras 30d**.
13. **#17 audit verify cron** + **#18 update `Org.auditLastVerifiedAt`**.
14. **#13 maintenance T-24/T-0/complete notifications** (cron + email/push delivery).
15. **incident broadcast worker**.
16. **trial-end reminder cron**.

### Sprint 3 — Compliance hard problems
17. **#2 `requireMfa` enforce en `/app` + `/api/sync/*`** (M).
18. **F.2 audit S3 Object Lock real** — AWS SDK PutObject (M).
19. **#14 SCIM PATCH cascade revoke** (M).
20. **F.6 GDPR cascade real ya hecha en Sprint 1**.
21. **#1 verifyChain streaming/batched** (M).

### Sprint 4 — Inteligencia expuesta + features pequeñas
22. **F.5 endpoints engine-health + cohort + neural-priors** (S).
23. **A.1 reward inferencia desde HRV** (S).
24. **A.7 selectArm fallback fix** (S).
25. **B.3 weekly intent ganador push** (S, depende de F.1).
26. **C.5 coach persona UI editor** (S).
27. **E.5/E.6 coach cache 1h + context cache** (S).
28. **D.3 webhook event versioning** (S).

### Sprint 5 — Plays grandes
29. **C.1 org neural health dashboard** (M).
30. **A.2 cohort prior wired** (M).
31. **F.8 coach quota** (M).
32. **F.12 push delivery server-side** (M, depende de F.1).
33. **C.6 coach quota mensual por plan** — completa F.8.
34. **E.2 weekly LLM summary** (M, depende de F.1 + F.8).

### Sprint 6 — Apuestas
35. **C.4 wearable OAuth real** (XL).
36. **A.3 HrvSample / MoodSample tablas** (L).
37. **G.1 programa adaptativo bandit-generado** (L).
38. **F.11 SAML signed assertion validation** (L, si NextAuth no lo cubre).

### Diferido a Fase 3 o más allá
- **#1 RLS Postgres** (XL) — defensa real pero costoso.
- **G.6 coach memoria longitudinal cifrada** (L).
- **E.1 coach tool-use** (L) — si C.1/A.2 muestran tracción.
- **#10 IPv6 allowlist** (M).
- **G.2 burnout MBI real** (M).
- **B.6 HRV con normas poblacionales** (M).
- **D.1/D.2 Slack/Teams dispatcher** (M cada uno).

---

## 9. Lo que NO hay que tocar en Fase 2

- **`/app` PWA** — frontend reescritura es Fase futura separada.
- **Marketing**, **/admin layouts**, **signup**, **signin**, **accept-invite** — UI no se toca.
- **Schema breaking changes** — solo append-only.
- **API contracts existentes** — solo backwards-compatible o `/v2/`.

---

## 10. Riesgos del plan mismo

- **Sprint 2 (job queue)** es upstream de muchos items — si no se completa bien, sprints 3-5 quedan parcialmente bloqueados.
- **Vercel Cron tiene límites** (2 jobs hobby, 40 pro). Si se necesitan más, considerar Inngest.
- **Costo coach LLM** podría escalar antes de F.8 (quota) — Sprint 4 debe priorizar quota antes de exponer features que aumenten uso.
- **AWS SDK + S3 Object Lock** requiere credenciales y configuración AWS que el dueño debe proveer. Sin ello, Sprint 3 item #18 queda bloqueado.
- **Tests cubren lib/, no app/api/*** — al añadir crons y cascade GDPR, riesgo de regresión sin red de seguridad. Necesario añadir tests para handlers nuevos.

---

## 11. Decisiones que requieren input del dueño antes de Fase 2

1. **Job queue technology:** Vercel Cron (gratis, simple, max 40 jobs) vs Inngest (mejor ergonomía, cuesta) vs Upstash QStash.
2. **AWS credentials para S3 Object Lock** — disponibilidad y configuración (`AUDIT_EXPORT_BUCKET` + KMS keys).
3. **Plan-gate del Coach LLM** — ¿FREE ve coach? ¿con quota? ¿solo con Haiku 4.5?
4. **NOM-035 DOF verificación** — ¿el texto literal de los 72 ítems se confirma o requiere abogado/STPS-certificado revisar?
5. **RLS Postgres** — ¿se compromete a Fase 3 o se difiere indefinidamente? Afecta claim "multi-tenant grade" del marketing.
6. **Wearable OAuth alcance** — ¿implementar 5 providers (Whoop/Oura/Garmin/Apple/Fitbit) o priorizar 1-2 (ej. Whoop + Oura)?
7. **Coach memoria longitudinal** — la decisión "memoria solo cliente" fue intencional (privacy by design). ¿Se mantiene o se evoluciona?
8. **Push delivery server-side** — ¿implementar y prometer reminders al server (real, cross-device)? Hoy son `setTimeout` cliente-only.

---

**Fin de ANALYSIS_RISKS_AND_PRIORITIES.md.**
