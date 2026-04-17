# Operations — BIO-IGNICIÓN

## SLOs

| Service              | Objective                               | Error budget |
| -------------------- | --------------------------------------- | ------------ |
| Public API           | 99.9% success (non-5xx)                 | 43 min/mo    |
| Auth                 | 99.95% success on `/api/auth/*`         | 21 min/mo    |
| LLM Coach            | p95 first-token < 1.5s                  | —            |
| Webhooks             | 99.5% delivered within 5 min            | —            |
| RPO                  | ≤ 15 minutes                            | —            |
| RTO                  | ≤ 4 hours                               | —            |

## Environments

- `dev` — ephemeral per-PR previews (Vercel).
- `staging` — mirrors prod topology, synthetic traffic.
- `prod` — multi-region active/passive (US primary, EU/APAC/LATAM read replicas).

## Deploy

- Trunk-based, `main` always deployable.
- Every push to `main` → staging auto-deploy; prod promotion requires green CI + manual approval.
- Feature flags via environment variables; destructive migrations gated behind `MIGRATION_APPROVED=true`.
- Rollback: `vercel rollback <deployment-id>` (≤ 60s) + `prisma migrate resolve --rolled-back`.

## Observability

- **Traces**: OpenTelemetry → OTLP → Datadog APM.
- **Metrics**: business counters (`bio.sessions.completed`, `bio.api.calls`, `bio.auth.events`) + histograms (`bio.coach.latency`, `bio.db.query`).
- **Logs**: structured JSON via `src/lib/logger.js`, no PII, 90-day retention.
- **Alerts**: PagerDuty (critical), Slack `#ops` (warn).

Critical alerts:
- API 5xx rate > 1% for 5 min.
- Auth failure rate > 10% for 5 min.
- Audit chain verification failure (any).
- Webhook delivery lag > 10 min.
- Certificate expiry < 14 days.

## Runbooks

### Incident response
1. Declare severity (SEV1–4) in `#incidents` Slack.
2. Page IC + comms lead (SEV1/2).
3. Create incident doc from template `docs/runbooks/incident-template.md`.
4. Status page update within 15 min (status.bio-ignicion.app).
5. Post-mortem due within 5 business days; published to customers for SEV1.

### Audit chain tamper
Run `node scripts/verify-audit.js --org <id>` → if breaks, freeze tenant writes and page DPO + security.

### DB failover
Promote replica with `pg_ctl promote`; update `DATABASE_URL` secret; restart app tier; verify writes.

### Key rotation
- Data keys: `node scripts/rotate-data-key.js --tenant <id>` (online, background re-encrypt).
- API keys: customer-initiated via admin UI.
- Webhook signing: `POST /api/v1/webhooks/{id}/rotate`.

## Backups

- Postgres PITR to S3 (same region, cross-AZ), 35-day retention, daily restore test.
- Object store replicated cross-region with MRAP.
- Monthly DR drill: full restore into staging, validate checksums + audit chain.

## Capacity

- Autoscaling on Vercel (edge) + RDS read replicas + Upstash Redis serverless.
- Per-tenant rate limits (see `src/server/ratelimit.js`) scale with plan.
- Quarterly load test (k6) at 10× steady-state.

## On-call

- 24/7 primary + secondary on PagerDuty.
- Escalation: L1 (on-call) → L2 (team lead) → L3 (CTO) at 15 min intervals.
- Paid comp-time after any SEV1 page.
