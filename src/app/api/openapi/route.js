/* OpenAPI 3.1 spec — comprehensive coverage de la API B2B + SCIM + status.
   Sprint 21: refactor con builders compartidos (lib/openapi-builder).
   Cubre todos los endpoints documented hasta hoy: auth, sessions,
   members, analytics, audit, webhooks, api-keys, sso, security policies,
   admin sessions, dsar, branding, custom domain, scim v2, status page +
   subscribers, incidents.
*/

import { NextResponse } from "next/server";
import {
  errorBody, responses, paged, ok, created, noContent,
  pathParam, queryParam, bearerWithScope,
  validateSpec,
} from "@/lib/openapi-builder";

export const runtime = "nodejs";

const REF = (name) => ({ $ref: `#/components/schemas/${name}` });

const spec = {
  openapi: "3.1.0",
  info: {
    title: "BIO-IGNICIÓN API",
    version: "1.0.0",
    description:
      "API pública B2B-elite para sesiones neurales, miembros, analíticas " +
      "agregadas (k-anonymity), audit logs, webhooks, SCIM 2.0 provisioning, " +
      "incident subscriptions y data subject access requests (GDPR).",
    contact: { email: "developers@bio-ignicion.app" },
    license: { name: "Proprietary" },
  },
  servers: [
    { url: "https://api.bio-ignicion.app", description: "production" },
    { url: "http://localhost:3000", description: "local development" },
  ],
  security: [{ bearerAuth: [] }],

  tags: [
    { name: "sessions", description: "Sesiones neurales completadas" },
    { name: "members", description: "Membresías del org (lectura, invite via SCIM)" },
    { name: "analytics", description: "Aggregated metrics con k-anonymity (k≥5)" },
    { name: "audit", description: "Audit log retention + verify + export (SOC2 evidence)" },
    { name: "api-keys", description: "API key lifecycle (create, rotate, revoke)" },
    { name: "webhooks", description: "Webhook subscriptions + signing rotation" },
    { name: "sso", description: "Federation config (Okta, Azure AD, Google, SAML)" },
    { name: "org-security", description: "Policies (require-MFA, IP allowlist, session TTL)" },
    { name: "admin-sessions", description: "Cross-org session control + offboarding" },
    { name: "dsar", description: "GDPR Art. 15/17/20 — data subject rights" },
    { name: "branding", description: "White-label (logo, colors, custom domain)" },
    { name: "custom-domain", description: "DNS verification flow para custom domain" },
    { name: "scim", description: "SCIM 2.0 provisioning (Okta-certifiable)" },
    { name: "status", description: "Public status page + incident subscribers" },
    { name: "incidents", description: "Platform-wide incident management" },
    { name: "me", description: "Current user self-service (sessions, keys, IP, DSAR)" },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "bi_xxx",
        description: "API key con prefix `bi_`. Crear vía /admin/api-keys; scopes definen acceso.",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description: "Session cookie de NextAuth — usado en endpoints /admin/* y /me/*",
      },
    },

    responses: {
      Unauthorized: responses.unauthorized,
      Forbidden: responses.forbidden,
      NotFound: responses.notFound,
      ValidationError: responses.validationError,
      Conflict: responses.conflict,
      RateLimited: responses.rateLimited,
    },

    schemas: {
      Error: errorBody,

      Session: {
        type: "object",
        required: ["userId", "protocolId", "durationSec", "completedAt"],
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          teamId: { type: "string", nullable: true },
          protocolId: { type: "string" },
          durationSec: { type: "integer", minimum: 15, maximum: 1800 },
          coherenciaDelta: { type: "number", nullable: true },
          moodPre: { type: "integer", minimum: 1, maximum: 5 },
          moodPost: { type: "integer", minimum: 1, maximum: 5 },
          completedAt: { type: "string", format: "date-time" },
        },
      },

      Member: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          name: { type: "string", nullable: true },
          role: { type: "string", enum: ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"] },
          deactivatedAt: { type: "string", format: "date-time", nullable: true },
          joinedAt: { type: "string", format: "date-time" },
        },
      },

      ApiKey: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          prefix: { type: "string", description: "Primeros 8 chars del token (display only)" },
          scopes: { type: "array", items: { type: "string" } },
          createdAt: { type: "string", format: "date-time" },
          lastUsedAt: { type: "string", format: "date-time", nullable: true },
          lastUsedIp: { type: "string", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
          revokedAt: { type: "string", format: "date-time", nullable: true },
        },
      },

      ApiKeyCreated: {
        allOf: [
          REF("ApiKey"),
          {
            type: "object",
            properties: {
              token: { type: "string", description: "Plaintext key — mostrado UNA vez al crear/rotar" },
            },
          },
        ],
      },

      Webhook: {
        type: "object",
        required: ["url", "events"],
        properties: {
          id: { type: "string" },
          url: { type: "string", format: "uri" },
          events: { type: "array", items: { type: "string" }, description: "Lista de eventos suscritos o ['*']" },
          active: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          secretRotatedAt: { type: "string", format: "date-time", nullable: true },
          prevSecretExpiresAt: { type: "string", format: "date-time", nullable: true },
        },
      },

      WebhookDelivery: {
        type: "object",
        properties: {
          id: { type: "string" },
          event: { type: "string" },
          status: { type: "integer", nullable: true },
          attempts: { type: "integer" },
          deliveredAt: { type: "string", format: "date-time", nullable: true },
          error: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },

      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          orgId: { type: "string", nullable: true },
          actorId: { type: "string", nullable: true },
          actorEmail: { type: "string", nullable: true },
          action: { type: "string" },
          target: { type: "string", nullable: true },
          ip: { type: "string", nullable: true },
          ua: { type: "string", nullable: true },
          payload: { type: "object", nullable: true },
          hash: { type: "string", description: "SHA-256 hash chain" },
          ts: { type: "string", format: "date-time" },
        },
      },

      Incident: {
        type: "object",
        required: ["id", "title", "status", "severity"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          body: { type: "string", nullable: true },
          status: { type: "string", enum: ["investigating", "identified", "monitoring", "resolved"] },
          severity: { type: "string", enum: ["minor", "major", "critical"] },
          components: { type: "array", items: { type: "string" } },
          startedAt: { type: "string", format: "date-time" },
          resolvedAt: { type: "string", format: "date-time", nullable: true },
        },
      },

      DsarRequest: {
        type: "object",
        required: ["kind", "status"],
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["ACCESS", "PORTABILITY", "ERASURE"] },
          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "EXPIRED"] },
          reason: { type: "string", nullable: true },
          artifactUrl: { type: "string", nullable: true, description: "URL al export (auto-resolved kinds)" },
          requestedAt: { type: "string", format: "date-time" },
          resolvedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time" },
        },
      },

      OrgSecurityPolicy: {
        type: "object",
        properties: {
          requireMfa: { type: "boolean" },
          sessionMaxAgeMinutes: { type: "integer", nullable: true },
          ipAllowlist: { type: "array", items: { type: "string" }, description: "CIDR IPv4" },
          ipAllowlistEnabled: { type: "boolean" },
        },
      },

      Branding: {
        type: "object",
        properties: {
          logoUrl: { type: "string", nullable: true },
          primaryColor: { type: "string", description: "Hex #RRGGBB" },
          accentColor: { type: "string" },
          customDomain: { type: "string", nullable: true },
          coachPersona: { type: "string", nullable: true },
        },
      },

      ScimUser: {
        type: "object",
        properties: {
          schemas: { type: "array", items: { type: "string" } },
          id: { type: "string" },
          userName: { type: "string", format: "email" },
          displayName: { type: "string", nullable: true },
          active: { type: "boolean", description: "false si membership.deactivatedAt != null" },
          emails: { type: "array", items: { type: "object" } },
          externalId: { type: "string", nullable: true },
          meta: { type: "object" },
        },
      },

      UserSession: {
        type: "object",
        properties: {
          id: { type: "string" },
          jti: { type: "string" },
          ip: { type: "string", nullable: true },
          userAgent: { type: "string", nullable: true },
          label: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          lastSeenAt: { type: "string", format: "date-time" },
          expiresAt: { type: "string", format: "date-time" },
          revokedAt: { type: "string", format: "date-time", nullable: true },
          current: { type: "boolean", description: "true si es la sesión del request actual" },
        },
      },
    },
  },

  paths: {
    /* ═══ Sessions ═══ */
    "/api/v1/sessions": {
      get: {
        tags: ["sessions"],
        summary: "Listar sesiones",
        security: bearerWithScope("read:sessions"),
        parameters: [
          queryParam("limit", "integer", "Max 200"),
          queryParam("offset", "integer"),
        ],
        responses: { "200": paged(REF("Session")), ...responses.standard() },
      },
      post: {
        tags: ["sessions"],
        summary: "Registrar sesión completada",
        security: bearerWithScope("write:sessions"),
        requestBody: {
          required: true,
          content: { "application/json": { schema: REF("Session") } },
        },
        responses: { "201": created(REF("Session")), ...responses.withValidation() },
      },
    },

    /* ═══ Members ═══ */
    "/api/v1/members": {
      get: {
        tags: ["members"],
        summary: "Listar miembros del org",
        security: bearerWithScope("read:members"),
        responses: { "200": paged(REF("Member")), ...responses.standard() },
      },
    },

    /* ═══ Analytics ═══ */
    "/api/v1/analytics": {
      get: {
        tags: ["analytics"],
        summary: "Métricas agregadas (k≥5, Differential Privacy con ε=1)",
        description:
          "Devuelve aggregates por día/team/protocol con k-anonymity " +
          "(min 5 usuarios por bucket) + Laplace noise para protección " +
          "contra reconstruction attacks. Recital 26 GDPR carve-out.",
        security: bearerWithScope("read:analytics"),
        parameters: [
          queryParam("teamId", "string"),
          queryParam("from", "string"),
          queryParam("to", "string"),
        ],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
    },

    /* ═══ Audit ═══ */
    "/api/v1/orgs/{orgId}/audit/export": {
      get: {
        tags: ["audit"],
        summary: "Export audit logs (CSV/JSONL) para SOC2 evidence",
        parameters: [
          pathParam("orgId"),
          queryParam("format", "string", "csv | jsonl (default csv)"),
          queryParam("from", "string", "ISO date-time"),
          queryParam("to", "string", "ISO date-time"),
        ],
        responses: {
          "200": { description: "OK — text/csv o application/x-ndjson" },
          ...responses.standard(),
        },
      },
    },
    "/api/v1/orgs/{orgId}/audit/verify": {
      post: {
        tags: ["audit"],
        summary: "Verifica hash chain + HMAC seal del audit log",
        parameters: [pathParam("orgId")],
        responses: {
          "200": ok({
            type: "object",
            properties: {
              status: { type: "string", enum: ["verified", "tampered", "error"] },
              verified: { type: "integer" },
              brokenAt: { type: "string", nullable: true },
              verifiedAt: { type: "string", format: "date-time" },
            },
          }),
          ...responses.standard(),
        },
      },
    },
    "/api/v1/orgs/{orgId}/audit/retention": {
      get: {
        tags: ["audit"],
        summary: "Ver retention days config",
        parameters: [pathParam("orgId")],
        responses: { "200": ok({ type: "object", properties: { days: { type: "integer" } } }), ...responses.standard() },
      },
      put: {
        tags: ["audit"],
        summary: "Set retention (OWNER only, 30..2555 días)",
        parameters: [pathParam("orgId")],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { days: { type: "integer" } } } } } },
        responses: { "200": ok({ type: "object" }), ...responses.withValidation() },
      },
    },
    "/api/v1/orgs/{orgId}/audit/count": {
      get: {
        tags: ["audit"],
        summary: "Count lightweight para preview de export",
        parameters: [pathParam("orgId"), queryParam("from", "string"), queryParam("to", "string")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
    },

    /* ═══ API keys ═══ */
    "/api/v1/api-keys": {
      post: {
        tags: ["api-keys"],
        summary: "Crear API key (token revealed UNA vez)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: {
            name: { type: "string" },
            scopes: { type: "array", items: { type: "string" } },
            expiresAtDays: { type: "integer", nullable: true, description: "1..3650 días o null" },
          } } } },
        },
        responses: { "201": created(REF("ApiKeyCreated")), ...responses.withValidation() },
      },
    },
    "/api/v1/api-keys/{id}": {
      delete: {
        tags: ["api-keys"],
        summary: "Revocar API key",
        security: [{ cookieAuth: [] }],
        parameters: [pathParam("id")],
        responses: { "204": noContent(), ...responses.standard() },
      },
      post: {
        tags: ["api-keys"],
        summary: "Acciones (rotate, etc) — query param ?action=rotate",
        security: [{ cookieAuth: [] }],
        parameters: [pathParam("id"), queryParam("action", "string")],
        responses: { "200": ok(REF("ApiKeyCreated")), ...responses.standard() },
      },
    },

    /* ═══ Webhooks ═══ */
    "/api/v1/webhooks/{id}": {
      patch: {
        tags: ["webhooks"],
        summary: "Toggle active / update events",
        security: [{ cookieAuth: [] }],
        parameters: [pathParam("id")],
        responses: { "200": ok(REF("Webhook")), ...responses.standard() },
      },
      delete: {
        tags: ["webhooks"],
        summary: "Eliminar webhook",
        security: [{ cookieAuth: [] }],
        parameters: [pathParam("id")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
      post: {
        tags: ["webhooks"],
        summary: "Acciones (rotate con overlap, test ping)",
        security: [{ cookieAuth: [] }],
        parameters: [pathParam("id"), queryParam("action", "string")],
        requestBody: {
          content: { "application/json": { schema: { type: "object", properties: { overlapDays: { type: "integer" } } } } },
        },
        responses: {
          "200": ok({
            type: "object",
            properties: {
              secret: { type: "string", description: "Secret nuevo (rotate only, una vez)" },
              prevSecretExpiresAt: { type: "string", format: "date-time" },
            },
          }),
          ...responses.standard(),
        },
      },
    },
    "/api/v1/webhooks/{id}/deliveries": {
      get: {
        tags: ["webhooks"],
        summary: "Lista últimas 50 deliveries",
        security: [{ cookieAuth: [] }],
        parameters: [pathParam("id")],
        responses: { "200": ok({ type: "object", properties: { data: { type: "array", items: REF("WebhookDelivery") } } }), ...responses.standard() },
      },
      post: {
        tags: ["webhooks"],
        summary: "Retry delivery (?action=retry&did=...)",
        security: [{ cookieAuth: [] }],
        parameters: [pathParam("id"), queryParam("action", "string"), queryParam("did", "string")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
    },

    /* ═══ SSO ═══ */
    "/api/v1/orgs/{orgId}/sso": {
      get: {
        tags: ["sso"],
        summary: "Get SSO config (OWNER only)",
        parameters: [pathParam("orgId")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
      put: {
        tags: ["sso"],
        summary: "Configurar SSO (Okta/Azure AD/Google/SAML)",
        parameters: [pathParam("orgId")],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { domain: { type: "string" }, provider: { type: "string" }, metadata: { type: "object" } } } } } },
        responses: { "200": ok({ type: "object" }), ...responses.withValidation() },
      },
      delete: {
        tags: ["sso"],
        summary: "Deshabilitar SSO",
        parameters: [pathParam("orgId")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
    },

    /* ═══ Org security ═══ */
    "/api/v1/orgs/{orgId}/security": {
      get: {
        tags: ["org-security"],
        summary: "Get policies (require-MFA, IP allowlist, session TTL)",
        parameters: [pathParam("orgId")],
        responses: { "200": ok(REF("OrgSecurityPolicy")), ...responses.standard() },
      },
      put: {
        tags: ["org-security"],
        summary: "Set policies (OWNER only, self-lockout protection)",
        parameters: [pathParam("orgId")],
        requestBody: { required: true, content: { "application/json": { schema: REF("OrgSecurityPolicy") } } },
        responses: { "200": ok({ type: "object" }), "409": { $ref: "#/components/responses/Conflict" }, ...responses.withValidation() },
      },
    },

    /* ═══ Admin sessions ═══ */
    "/api/v1/orgs/{orgId}/sessions": {
      get: {
        tags: ["admin-sessions"],
        summary: "Lista sesiones de members (OWNER/ADMIN)",
        parameters: [pathParam("orgId"), queryParam("includeRevoked", "boolean")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
    },
    "/api/v1/orgs/{orgId}/sessions/{sessionId}": {
      delete: {
        tags: ["admin-sessions"],
        summary: "Revocar sesión específica (anti-warfare role gating)",
        parameters: [pathParam("orgId"), pathParam("sessionId")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
    },
    "/api/v1/orgs/{orgId}/members/{userId}/revoke-sessions": {
      post: {
        tags: ["admin-sessions"],
        summary: "Cerrar TODAS las sesiones del user (offboarding)",
        parameters: [pathParam("orgId"), pathParam("userId")],
        responses: { "200": ok({ type: "object", properties: { count: { type: "integer" } } }), ...responses.standard() },
      },
    },

    /* ═══ DSAR ═══ */
    "/api/v1/me/dsar": {
      get: {
        tags: ["dsar", "me"],
        summary: "Lista propias DSAR requests",
        responses: { "200": ok({ type: "object", properties: { requests: { type: "array", items: REF("DsarRequest") } } }), ...responses.standard() },
      },
      post: {
        tags: ["dsar", "me"],
        summary: "Crear DSAR request (auto-resuelve ACCESS/PORTABILITY)",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { kind: { type: "string" }, reason: { type: "string" }, orgId: { type: "string" } } } } } },
        responses: { "201": created({ type: "object", properties: { request: REF("DsarRequest") } }), ...responses.withValidation() },
      },
    },
    "/api/v1/orgs/{orgId}/dsar": {
      get: {
        tags: ["dsar"],
        summary: "Admin queue (OWNER/ADMIN)",
        parameters: [pathParam("orgId"), queryParam("status", "string")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
    },
    "/api/v1/orgs/{orgId}/dsar/{id}/resolve": {
      post: {
        tags: ["dsar"],
        summary: "Approve/Reject (state machine guarded)",
        parameters: [pathParam("orgId"), pathParam("id")],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, notes: { type: "string" } } } } } },
        responses: { "200": ok({ type: "object" }), "409": { $ref: "#/components/responses/Conflict" }, ...responses.withValidation() },
      },
    },

    /* ═══ Branding + custom domain ═══ */
    "/api/v1/orgs/{orgId}/branding": {
      get: {
        tags: ["branding"],
        summary: "Get branding (cualquier member)",
        parameters: [pathParam("orgId")],
        responses: { "200": ok({ type: "object", properties: { branding: REF("Branding"), plan: { type: "string" } } }), ...responses.standard() },
      },
      put: {
        tags: ["branding"],
        summary: "Set branding (OWNER, plan-gating)",
        parameters: [pathParam("orgId")],
        requestBody: { required: true, content: { "application/json": { schema: REF("Branding") } } },
        responses: { "200": ok({ type: "object" }), ...responses.withValidation() },
      },
    },
    "/api/v1/orgs/{orgId}/domain/verify": {
      get: {
        tags: ["custom-domain"],
        summary: "Status del verify flow + instrucciones TXT",
        parameters: [pathParam("orgId")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
      post: {
        tags: ["custom-domain"],
        summary: "Start (genera token) o check (resuelve DNS)",
        parameters: [pathParam("orgId"), queryParam("action", "string", "start | check")],
        responses: { "200": ok({ type: "object" }), ...responses.withValidation() },
      },
      delete: {
        tags: ["custom-domain"],
        summary: "Limpiar verify state",
        parameters: [pathParam("orgId")],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
    },

    /* ═══ SCIM ═══ */
    "/api/scim/v2/Users": {
      get: {
        tags: ["scim"],
        summary: "List users (SCIM filter v2 + pagination)",
        security: bearerWithScope("scim"),
        parameters: [
          queryParam("filter", "string", "userName eq, sw, co, and/or supported"),
          queryParam("startIndex", "integer"),
          queryParam("count", "integer"),
        ],
        responses: { "200": ok({ type: "object" }), ...responses.standard() },
      },
      post: {
        tags: ["scim"],
        summary: "Create user (idempotent reactivation)",
        security: bearerWithScope("scim"),
        responses: { "201": ok(REF("ScimUser")), ...responses.standard() },
      },
    },
    "/api/scim/v2/Users/{id}": {
      get: { tags: ["scim"], summary: "Get user", security: bearerWithScope("scim"), parameters: [pathParam("id")], responses: { "200": ok(REF("ScimUser")), ...responses.standard() } },
      patch: { tags: ["scim"], summary: "PATCH (active=false → soft-deactivate)", security: bearerWithScope("scim"), parameters: [pathParam("id")], responses: { "200": ok(REF("ScimUser")), ...responses.standard() } },
      put: { tags: ["scim"], summary: "PUT replace (subset)", security: bearerWithScope("scim"), parameters: [pathParam("id")], responses: { "200": ok(REF("ScimUser")), ...responses.standard() } },
      delete: { tags: ["scim"], summary: "DELETE → soft-deactivate (mantiene audit)", security: bearerWithScope("scim"), parameters: [pathParam("id")], responses: { "204": noContent(), ...responses.standard() } },
    },
    "/api/scim/v2/Groups": {
      get: { tags: ["scim"], summary: "List groups", security: bearerWithScope("scim"), responses: { "200": ok({ type: "object" }), ...responses.standard() } },
      post: { tags: ["scim"], summary: "Create group", security: bearerWithScope("scim"), responses: { "201": ok({ type: "object" }), ...responses.standard() } },
    },
    "/api/scim/v2/Schemas": {
      get: { tags: ["scim"], summary: "Schema discovery (RFC 7643 §7)", responses: { "200": ok({ type: "object" }) } },
    },
    "/api/scim/v2/ResourceTypes": {
      get: { tags: ["scim"], summary: "ResourceTypes discovery", responses: { "200": ok({ type: "object" }) } },
    },
    "/api/scim/v2/ServiceProviderConfig": {
      get: { tags: ["scim"], summary: "Service provider config", responses: { "200": ok({ type: "object" }) } },
    },

    /* ═══ Status + incidents + subscribers ═══ */
    "/api/v1/incidents": {
      get: { tags: ["incidents"], summary: "Public list (active + recent)", responses: { "200": ok({ type: "object", properties: { incidents: { type: "array", items: REF("Incident") } } }) } },
      post: {
        tags: ["incidents"],
        summary: "Create (PLATFORM_ADMIN only)",
        security: [{ cookieAuth: [] }],
        responses: { "201": ok(REF("Incident")), ...responses.withValidation() },
      },
    },
    "/api/v1/incidents/{id}/updates": {
      post: {
        tags: ["incidents"],
        summary: "Add update + state transition",
        security: [{ cookieAuth: [] }],
        parameters: [pathParam("id")],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, body: { type: "string" } } } } } },
        responses: { "201": ok({ type: "object" }), "409": { $ref: "#/components/responses/Conflict" }, ...responses.withValidation() },
      },
    },
    "/api/v1/status/subscribe": {
      post: {
        tags: ["status"],
        summary: "Subscribe email or webhook (XOR)",
        security: [],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, webhookUrl: { type: "string" }, components: { type: "array", items: { type: "string" } } } } } } },
        responses: { "201": ok({ type: "object" }), "422": { $ref: "#/components/responses/ValidationError" } },
      },
    },

    /* ═══ Me (self-service) ═══ */
    "/api/v1/me/sessions": {
      get: { tags: ["me"], summary: "Sesiones activas del user actual", security: [{ cookieAuth: [] }], responses: { "200": ok({ type: "object", properties: { sessions: { type: "array", items: REF("UserSession") } } }), ...responses.standard() } },
    },
    "/api/v1/me/sessions/{id}": {
      delete: { tags: ["me"], summary: "Revocar sesión propia", security: [{ cookieAuth: [] }], parameters: [pathParam("id")], responses: { "200": ok({ type: "object" }), ...responses.standard() } },
    },
    "/api/v1/me/ip": {
      get: { tags: ["me"], summary: "IP del request actual (preview para IP allowlist)", security: [{ cookieAuth: [] }], responses: { "200": ok({ type: "object", properties: { ip: { type: "string" } } }), ...responses.standard() } },
    },
  },
};

// Self-check en boot — si el spec se desincroniza, log a la consola
// pero no rompemos el endpoint (devuelve igual).
const _check = validateSpec(spec);
if (!_check.ok && process.env.NODE_ENV !== "production") {
  console.warn("[openapi] spec validation errors:", _check.errors);
}

export function GET() {
  return NextResponse.json(spec, { headers: { "cache-control": "public, max-age=300" } });
}
