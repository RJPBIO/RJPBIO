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

## Who to call

Escalation is configured in PagerDuty / on-call rota (outside this repo). Do not page LLM-generated contacts.
