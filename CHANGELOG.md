# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Multi-tenant backend (Prisma schema, Auth.js v5, RBAC, audit hash-chain, MFA/TOTP, WebAuthn passkeys).
- SCIM 2.0 (Users + Groups).
- Public API v1 + OpenAPI 3.1, webhooks (Standard Webhooks HMAC), rate-limit (memory + Upstash).
- LLM Coach (Anthropic Claude Sonnet 4.6, SSE streaming, prompt caching).
- Billing (Stripe per-seat + metered).
- Admin console: members, audit, billing, branding, api-keys, webhooks, onboarding.
- Org/Team dashboards with k-anonymity (k≥5) + Laplace DP (ε=1.0).
- Trust Center + subprocessors + DPA.
- i18n 12 locales + RTL (ar, he).
- Observability (OpenTelemetry + Sentry + Web Vitals RUM).
- PWA hardening: SW v6, push, background + periodic sync, share target, protocol handlers, shortcut routes, Badging API.
- E2E (Playwright), a11y (axe), Lighthouse budgets, CodeQL SAST, Trivy, Gitleaks, CycloneDX SBOM, Dependabot.
- Enterprise docs (SECURITY, COMPLIANCE, OPERATIONS, API).
- BYOK envelope encryption, row-level security, region routing, WORM audit export.

## [0.1.0] - 2026-04-01
- Initial PWA (single-user).
