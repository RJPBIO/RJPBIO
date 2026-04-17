import { NextResponse } from "next/server";

export const runtime = "nodejs";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "BIO-IGNICIÓN API",
    version: "1.0.0",
    description: "API pública para sesiones neurales, miembros y analíticas agregadas.",
    contact: { email: "developers@bio-ignicion.app" },
    license: { name: "Proprietary" },
  },
  servers: [{ url: "https://api.bio-ignicion.app", description: "prod" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "bi_xxx" },
    },
    schemas: {
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
          role: { type: "string", enum: ["OWNER","ADMIN","MANAGER","MEMBER","VIEWER"] },
          joinedAt: { type: "string", format: "date-time" },
        },
      },
      Error: { type: "object", properties: { error: { type: "string" } } },
    },
  },
  paths: {
    "/api/v1/sessions": {
      get: {
        summary: "Listar sesiones",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", maximum: 200 } },
          { name: "offset", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "OK" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
      post: {
        summary: "Registrar sesión",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Session" } } },
        },
        responses: { "201": { description: "Creada" } },
      },
    },
    "/api/v1/members": {
      get: { summary: "Listar miembros", responses: { "200": { description: "OK" } } },
    },
    "/api/v1/analytics": {
      get: {
        summary: "Analíticas agregadas (k-anonymity k=5)",
        parameters: [
          { name: "teamId", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/scim/v2/Users": {
      get: { summary: "SCIM list users", responses: { "200": { description: "OK" } } },
      post: { summary: "SCIM create user", responses: { "201": { description: "Created" } } },
    },
  },
};

export function GET() {
  return NextResponse.json(spec, { headers: { "cache-control": "public, max-age=300" } });
}
