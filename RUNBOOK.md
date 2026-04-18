# RUNBOOK — Incident response

Scope: production on-call for BIO-IGNICIÓN. Keep this file short and current.

## Severity

- **SEV1**: signin or onboarding broken, data corruption, secret leak → page immediately.
- **SEV2**: coach unavailable, billing webhook failing, admin dashboard errors → respond within 30 min.
- **SEV3**: PWA offline glitches, non-blocking UI bugs → next business day.

## First 5 minutes

1. Check `/api/health` and `/api/ready`.
2. Vercel dashboard → Deployments → Runtime logs. Filter by status 5xx.
3. If DB errors: check the Postgres provider status page before debugging.
4. If LLM errors: check `status.anthropic.com`.

## Common failure modes

### Prisma crash on cold start
Symptom: `PrismaClientInitializationError` on Vercel only.
Cause: missing `binaryTargets = ["native", "rhel-openssl-3.0.x"]` in `prisma/schema.prisma`.
Fix: confirm binary target, redeploy. Check `DATABASE_URL` is set in the Vercel project (not only Preview).

### Auth redirect loop
Symptom: signin → dashboard → signin.
Cause: `NEXTAUTH_URL` mismatch or missing `NEXTAUTH_SECRET`.
Fix: set `NEXTAUTH_URL` to the canonical prod URL. Rotate `NEXTAUTH_SECRET` only if compromised (invalidates all sessions).

### Coach returns 503 `coach_unavailable`
Cause: `ANTHROPIC_API_KEY` missing or quota exceeded.
Fix: verify env var, check Anthropic console quota. Coach fails closed — UI shows degraded state.

### Billing webhook 400 `invalid signature`
Cause: `STRIPE_WEBHOOK_SECRET` out of sync with Stripe dashboard.
Fix: regenerate endpoint secret in Stripe, update env, redeploy. Do not skip signature check.

### Rate limit errors 429 on first request
Cause: upstream Redis rejecting (wrong `REDIS_URL`/`REDIS_TOKEN`). The in-memory fallback returns ok but resets each invocation.
Fix: confirm Upstash creds. Without Redis, expect rate-limit leakage between serverless instances.

## Data recovery

- Postgres backups: provider-managed daily. Point-in-time restore via provider console.
- Tenant data export: `/api/v1/org/[id]/export` (admin-only). Verify signature with `npm run verify:audit`.
- Per-user export (GDPR Art. 15): `/api/v1/users/me/export`.

## Rotation

- Data key: `npm run rotate:key` (requires KMS access).
- Stripe webhook secret: regenerate in Stripe, update env, redeploy.
- API keys: `/admin/api-keys` — revoke and reissue. Token values are hashed; original is shown once.

## Incident lifecycle (SEV1 / SEV2)

1. **Declare** — one person owns comms (Incident Commander). Post in `#incidents` with severity + symptom.
2. **Contain** — stop the bleed before fixing the cause. Toggle the feature flag, roll back the deploy, block the bad actor.
3. **Communicate** — first customer-facing update within 15 min on `/status` + status email. Every 30 min until resolved.
4. **Resolve** — declared only when metrics return to baseline for ≥ 15 min.
5. **Postmortem** — blameless, within 5 business days. Template below.

### Comms templates

**Initial (status page + email):**
> We are investigating reports of [symptom] affecting [scope]. Sessions/data are not at risk. Updates every 30 minutes at /status.

**Resolved:**
> The issue with [symptom] is resolved as of [UTC timestamp]. Duration: [X] min. Root cause: [1-line]. Full postmortem in [Y] business days.

### Postmortem template

```
# Postmortem — [date] [title]
Severity: SEV[1|2]  ·  Duration: [start]–[end] UTC  ·  IC: [name]

## Impact
- Users affected: [N]  ·  Orgs affected: [N]  ·  Requests failed: [N]
- Data loss: [yes/no]  ·  Data exposure: [yes/no]

## Timeline (UTC)
- HH:MM — first alert fired
- HH:MM — IC declared SEV[N]
- HH:MM — mitigation applied
- HH:MM — metrics returned to baseline

## Root cause
[What actually broke, in mechanical terms — not "human error".]

## Why now
[What changed recently that enabled this.]

## Action items (owner, due date)
- [ ] Prevention: [...]
- [ ] Detection: [...]
- [ ] Response: [...]
```

## Backup / restore

- **Backups**: Postgres provider-managed, daily + PITR. S3/GCS snapshot nightly (`BACKUP_URL`).
- **Verify weekly**: `npm run verify:backup` (restores latest snapshot to `RESTORE_DB_URL`, checks row counts, walks audit chain). Failure → SEV2 auto-page.
- **RTO**: 1 h.  **RPO**: 5 min (PITR).
- **Restore runbook**:
  1. Provision ephemeral DB.
  2. `pg_restore --dbname=$RESTORE_DB_URL --clean latest.dump`.
  3. Verify row counts against last known prod metrics.
  4. Cut over `DATABASE_URL` in Vercel; redeploy.
  5. Force sign-out-all via `Clear-Site-Data` toggle.
  6. Rotate all API keys and webhook secrets.

## Admin impersonation (support)

Platform staff can assume a user's session for debugging:

1. Add operator email to `PLATFORM_ADMINS` env.
2. `POST /api/admin/impersonate` with `{ targetUserId, reason, minutes }`.
3. Open the returned `consumeUrl` in a **private window** (keeps your real session intact).
4. Session is capped at 60 min server-side, one-shot token, fully audited (`Impersonation` + `AuditLog`).

## Who to call

Escalation is configured in PagerDuty / on-call rota (outside this repo). Do not page LLM-generated contacts.
