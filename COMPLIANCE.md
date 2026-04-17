# Compliance — BIO-IGNICIÓN

## Frameworks

| Framework          | Status                          | Evidence                                        |
| ------------------ | ------------------------------- | ----------------------------------------------- |
| SOC 2 Type II      | Audit window 2026-Q2 → 2026-Q4 | Controls mapped in `docs/controls/soc2.csv`    |
| ISO/IEC 27001:2022 | Gap assessment complete         | Stage 1 audit scheduled                         |
| HIPAA              | BAA available                   | Customer BAA template in Trust Center           |
| GDPR (EU)          | Aligned                         | DPA, RoPA, DPIA templates                       |
| LFPDPPP (MX)       | Aligned                         | Aviso de Privacidad integral + simplificado     |
| LGPD (BR)          | Aligned                         | DPA (LGPD addendum)                             |
| CCPA / CPRA (US)   | Aligned                         | "Do Not Sell/Share" toggle, right-to-delete API |
| PIPEDA (CA)        | Aligned                         | —                                                |

## Data protection principles

- **Lawfulness** — processing bound to contract + legitimate interest; consent captured for non-essential telemetry.
- **Purpose limitation** — neural-session data is used only to render dashboards and (opt-in) the LLM coach.
- **Data minimization** — k-anonymity (k≥5) on team aggregates; no PII in logs.
- **Accuracy** — user self-service edit + SCIM sync.
- **Storage limitation** — default retention 365 days, per-tenant configurable.
- **Integrity & confidentiality** — see `SECURITY.md`.
- **Accountability** — append-only audit with SHA-256 hash chain; `verifyChain()` callable from admin UI.

## Data subject rights

| Right                 | Endpoint / mechanism                                  |
| --------------------- | ----------------------------------------------------- |
| Access                | `GET /api/v1/users/me/export`                         |
| Rectification         | Profile UI, SCIM `PATCH /Users/{id}`                  |
| Erasure ("forgotten") | `DELETE /api/v1/users/me` — 30-day hard-delete window |
| Restriction           | Admin-initiated account suspension                    |
| Portability           | JSON export, signed with tenant key                   |
| Objection             | Consent banner + Trust Center preferences             |

## Subprocessors

Full list in the Trust Center: `/trust/subprocessors`. Customers are notified **30 days** before new subprocessors are added (subscribe at `trust-announce@bio-ignicion.app`).

## Data residency

- Tenants choose region at creation: **US**, **EU (Frankfurt)**, **APAC (Tokyo)**, **LATAM (São Paulo)**.
- Data does not leave the chosen region except for signed, encrypted backups to a secondary AZ within the same region.

## AI governance

- The LLM coach runs on **Anthropic Claude Sonnet 4.6** via their API.
- **Opt-in per tenant.** No training on customer data (per Anthropic's DPA).
- Prompts are sanitized (2000 char cap, no PII) before egress.
- Coach output is logged in the tenant's audit log for review.

## Retention & deletion

| Data class          | Default retention | Customer-configurable |
| ------------------- | ----------------- | --------------------- |
| Neural sessions     | 365 days          | Yes                   |
| Audit log           | 7 years           | No (compliance)       |
| Billing records     | 10 years          | No (fiscal)           |
| Access logs         | 90 days           | No                    |
| Backups             | 35 days           | No                    |

## Responsible contacts

- **DPO**: dpo@bio-ignicion.app
- **Security**: security@bio-ignicion.app
- **Legal / Privacy**: legal@bio-ignicion.app
