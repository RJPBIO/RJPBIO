# BIO-IGNICIÓN Public API v1

Base URL: `https://api.bio-ignicion.app/v1`
Machine-readable spec: `GET /api/openapi` (OpenAPI 3.1.0).

## Authentication

All endpoints require one of:

- **API key** — `Authorization: Bearer bi_<key>` (issued in admin console, scopes: `read:sessions`, `write:sessions`, `read:members`, `admin`, `scim`).
- **Session cookie** — for first-party web clients only.

API keys are shown **once** at creation; only a SHA-256 digest is stored.

## Rate limits

Token-bucket per tenant + key. Headers on every response:

```
RateLimit-Limit: 2000
RateLimit-Remaining: 1987
RateLimit-Reset: 1713225600
Retry-After: 42      # only on 429
```

Plan budgets: FREE 120/min · STARTER 600/min · GROWTH 2k/min · ENTERPRISE 10k/min.

## Pagination

Cursor-based. Requests accept `?limit=` (1–100, default 25) and `?cursor=`. Responses include `next_cursor` (null when exhausted).

## Errors

Problem+JSON (RFC 9457):

```json
{ "type": "https://bio-ignicion.app/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Role MEMBER cannot perform member.invite",
  "instance": "/v1/members",
  "trace_id": "0af7651916cd43dd8448eb211c80319c" }
```

Stable codes: `400 invalid_request`, `401 unauthorized`, `403 forbidden`, `404 not_found`, `409 conflict`, `422 validation_failed`, `429 rate_limited`, `5xx server_error`.

## Core endpoints

| Method + path                         | Description                          | Scope            |
| ------------------------------------- | ------------------------------------ | ---------------- |
| `GET  /v1/sessions`                   | List neural sessions                 | `read:sessions`  |
| `POST /v1/sessions`                   | Create session                       | `write:sessions` |
| `GET  /v1/sessions/{id}`              | Session detail                       | `read:sessions`  |
| `GET  /v1/members`                    | List members                         | `read:members`   |
| `GET  /v1/analytics/team/{teamId}`    | k-anonymous aggregates (k≥5, ε=1.0) | `read:members`   |
| `POST /v1/webhooks`                   | Register webhook                     | `admin`          |
| `POST /v1/webhooks/{id}/rotate`       | Rotate signing secret                | `admin`          |

## SCIM 2.0

`/scim/v2/Users` and `/scim/v2/Groups` per RFC 7644. Bearer token with `scim` scope required. Discovery at `/scim/v2/ServiceProviderConfig`.

## Webhooks

We deliver events with retry (exponential backoff, up to 8 attempts over ~24h). Headers follow the [Standard Webhooks](https://www.standardwebhooks.com/) spec:

```
webhook-id: 01HXYZ...
webhook-timestamp: 1713225600
webhook-signature: v1,<base64(hmac-sha256(body))>
```

Events: `session.completed`, `member.added`, `member.removed`, `plan.changed`, `audit.exported`.

## Versioning

URL-versioned (`/v1/`). Breaking changes → `/v2/` with ≥ 12 months of overlap. Deprecation flagged in `Sunset` header and in the OpenAPI spec.

## SDKs

- TypeScript: `npm i @bio-ignicion/sdk`
- Python: `pip install bio-ignicion`
- Go: `go get github.com/bio-ignicion/go-sdk`

All SDKs auto-retry on 429/5xx with jittered backoff and honour `Retry-After`.

## Idempotency

Mutating endpoints accept `Idempotency-Key: <uuid>`. Keys are remembered for 24h; replays return the original response without re-executing.

## Support

- Status: `status.bio-ignicion.app`
- Developers: `developers@bio-ignicion.app`
- Enterprise: dedicated Slack Connect channel
