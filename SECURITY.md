# Security Policy — BIO-IGNICIÓN

## Supported versions

Only the latest minor release of BIO-IGNICIÓN receives security fixes.

## Reporting a vulnerability

Report privately to **security@bio-ignicion.app** (PGP key available on request).

- Initial acknowledgement: within **24 hours**.
- Triage + severity (CVSS v3.1): within **72 hours**.
- Fix target: Critical ≤ 7 days · High ≤ 30 days · Medium ≤ 90 days.

We run a coordinated disclosure program. Please do not publish details until a fix is released and customers have been notified.

## Threat model (summary)

Trust boundaries: browser ↔ edge (Cloudflare) ↔ app (Vercel) ↔ datastore (Postgres on AWS) ↔ third-party subprocessors.

Top assets: neural-session data, PII, billing info, audit log integrity, tenant isolation.

STRIDE highlights:
- **Spoofing** → SSO OIDC/SAML, MFA TOTP, short-lived sessions (8h), signed cookies.
- **Tampering** → Audit log hash chain (SHA-256), Stripe/webhook HMAC verification.
- **Repudiation** → Append-only audit with timestamp and actor.
- **Information disclosure** → AES-GCM 256 at rest, TLS 1.3 in transit, k-anonymity (k≥5), differential privacy on analytics (ε=1.0).
- **Denial of service** → Cloudflare WAF/DDoS, per-tenant token-bucket rate limits.
- **Elevation of privilege** → RBAC (OWNER/ADMIN/MANAGER/MEMBER/VIEWER), least-privilege API keys with scopes.

## Cryptography

- Symmetric: **AES-256-GCM** (client IndexedDB + server column-level where required).
- Hashing: **SHA-256** (audit chain, API key digest, webhook signature).
- KDF: **PBKDF2-SHA256** (310k iterations) for key derivation from master passphrase.
- Transport: **TLS 1.3** only, HSTS `max-age=63072000; includeSubDomains; preload`.
- CSP: strict, per-request nonce, `object-src 'none'`, `base-uri 'self'`.

## Secrets management

- Runtime secrets in AWS Secrets Manager / Vercel encrypted env vars.
- No secrets in the repo. `gitleaks` runs on every push (see `.github/workflows/security.yml`).
- Rotation: customer-visible keys 90 days, internal 30 days.

## Identity & access

- Workforce: SSO + hardware MFA (FIDO2), JIT provisioning.
- Customers: SSO (Okta, Azure AD, Google), SCIM 2.0, TOTP MFA, backup codes.
- Admin access to production requires break-glass approval and is fully audited.

## SDLC

- Code review mandatory on `main`.
- CI gates: lint, unit, E2E (Playwright), accessibility (axe), Lighthouse budgets, CodeQL SAST, Trivy FS, `npm audit`, Gitleaks, CycloneDX SBOM.
- Dependency auto-updates via Dependabot (weekly, security patches hourly).
- Signed commits and signed releases (tag signatures).

## Incident response

- 24/7 on-call via PagerDuty.
- IR runbook in `OPERATIONS.md`.
- Customer notification within **72 hours** of confirmed data breach (GDPR Art. 33 aligned).
