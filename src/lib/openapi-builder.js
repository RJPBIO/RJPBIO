/* ═══════════════════════════════════════════════════════════════
   OpenAPI 3.1 builder — pure helpers para componer specs sin DRY violations.
   ═══════════════════════════════════════════════════════════════
   Antes: spec hardcoded de ~5 endpoints con responses inconsistentes.
   Ahora: builders compartidos + tests garantizan shape uniforme + cobertura
   completa de endpoints en /api/openapi.

   Uso típico:
     import { responses, paged, errorBody } from "@/lib/openapi-builder";

     paths: {
       "/api/v1/sessions": {
         get: {
           tags: ["sessions"],
           summary: "List sessions",
           responses: {
             "200": paged({ $ref: "#/components/schemas/Session" }),
             ...responses.standard(),
           },
         },
       },
     }
   ═══════════════════════════════════════════════════════════════ */

/**
 * Body de respuesta error genérico — usado en componentes.
 */
export const errorBody = {
  type: "object",
  required: ["error"],
  properties: {
    error: { type: "string", description: "machine-readable error code" },
    message: { type: "string", description: "human-readable detail" },
    details: { type: "array", items: { type: "object" }, description: "field-level errors si aplica" },
  },
};

/**
 * Common response references — para componer en cada operation.
 * Spec mete estos como #/components/responses/X.
 */
export const responses = {
  unauthorized: {
    description: "Bearer token inválido, expirado, o ausente.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
  forbidden: {
    description: "Token válido pero falta scope o role requerido.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
  notFound: {
    description: "Recurso no encontrado o no pertenece al actor.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
  validationError: {
    description: "Body inválido (422). Incluye `details` array con errors por campo.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
  conflict: {
    description: "Recurso duplicado o estado incompatible (409).",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },
  rateLimited: {
    description: "Quota excedida (429). Headers RateLimit-* (RFC 9239) presentes.",
    headers: {
      "RateLimit-Policy": { schema: { type: "string" }, description: "limit;w=window;burst=cap" },
      "RateLimit": { schema: { type: "string" }, description: "limit=N, remaining=N, reset=N" },
      "Retry-After": { schema: { type: "integer" }, description: "segundos hasta poder reintentar" },
    },
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  },

  /**
   * Set estándar para añadir a cualquier endpoint con auth.
   * Caller hace `...responses.standard()` y suma su 200/201/204 propios.
   */
  standard() {
    return {
      "401": { $ref: "#/components/responses/Unauthorized" },
      "403": { $ref: "#/components/responses/Forbidden" },
      "429": { $ref: "#/components/responses/RateLimited" },
    };
  },

  /**
   * Para endpoints que aceptan body con validación.
   */
  withValidation() {
    return {
      ...responses.standard(),
      "404": { $ref: "#/components/responses/NotFound" },
      "422": { $ref: "#/components/responses/ValidationError" },
    };
  },
};

/**
 * Wrapper paged response — schema con totalResults / Resources.
 * @param {object} itemSchema  e.g. { $ref: "#/components/schemas/Session" }
 */
export function paged(itemSchema) {
  return {
    description: "OK — lista paginada",
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["totalResults", "Resources"],
          properties: {
            totalResults: { type: "integer" },
            startIndex: { type: "integer" },
            itemsPerPage: { type: "integer" },
            Resources: { type: "array", items: itemSchema },
          },
        },
      },
    },
  };
}

/**
 * Response 200 con un solo schema referenciado.
 */
export function ok(schema, description = "OK") {
  return {
    description,
    content: { "application/json": { schema } },
  };
}

/**
 * Response 201 created con schema.
 */
export function created(schema, description = "Created") {
  return {
    description,
    content: { "application/json": { schema } },
  };
}

/**
 * Response 204 (no body).
 */
export function noContent(description = "No content") {
  return { description };
}

/**
 * Path parameter helper.
 */
export function pathParam(name, type = "string", description = "") {
  return {
    name, in: "path", required: true,
    schema: { type },
    description,
  };
}

/**
 * Query parameter helper.
 */
export function queryParam(name, type = "string", description = "", { required = false } = {}) {
  return {
    name, in: "query", required,
    schema: { type },
    description,
  };
}

/**
 * Construye el `security` requirement requiriendo un scope específico.
 * Caller compone con scopes válidos del sistema.
 */
export function bearerWithScope(scope) {
  if (!scope) return [{ bearerAuth: [] }];
  return [{ bearerAuth: [scope] }];
}

/**
 * Validación mínima del shape OpenAPI — sanity check para que el spec
 * publicado no salga roto. Retorna { ok, errors }.
 *
 * No es un validator completo OAS3.1 (sería ~3000 líneas); sólo
 * estructura básica: paths object, components object, info.title.
 */
export function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  if (typeof spec.openapi !== "string") errors.push({ field: "openapi", error: "missing" });
  if (!spec.info || typeof spec.info.title !== "string") errors.push({ field: "info.title", error: "missing" });
  if (!spec.info?.version) errors.push({ field: "info.version", error: "missing" });
  if (!spec.paths || typeof spec.paths !== "object") errors.push({ field: "paths", error: "missing" });
  if (!spec.components || typeof spec.components !== "object") errors.push({ field: "components", error: "missing" });
  // Sanity: cada path debe tener al menos un verb HTTP válido.
  if (spec.paths) {
    const verbs = new Set(["get", "post", "put", "patch", "delete", "options", "head"]);
    for (const [path, def] of Object.entries(spec.paths)) {
      if (!def || typeof def !== "object") {
        errors.push({ field: `paths.${path}`, error: "not_object" });
        continue;
      }
      const hasVerb = Object.keys(def).some((k) => verbs.has(k.toLowerCase()));
      if (!hasVerb) errors.push({ field: `paths.${path}`, error: "no_verbs" });
    }
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

/**
 * Cuenta total de operaciones (verb-paths) en el spec — útil para tests.
 */
export function countOperations(spec) {
  if (!spec?.paths) return 0;
  const verbs = new Set(["get", "post", "put", "patch", "delete", "options", "head"]);
  let n = 0;
  for (const def of Object.values(spec.paths)) {
    if (!def || typeof def !== "object") continue;
    for (const k of Object.keys(def)) {
      if (verbs.has(k.toLowerCase())) n++;
    }
  }
  return n;
}

/**
 * Lista todos los tags usados — útil para asegurar que matchean spec.tags[].
 */
export function listUsedTags(spec) {
  if (!spec?.paths) return [];
  const tags = new Set();
  for (const def of Object.values(spec.paths)) {
    if (!def || typeof def !== "object") continue;
    for (const op of Object.values(def)) {
      if (op?.tags && Array.isArray(op.tags)) {
        for (const t of op.tags) tags.add(t);
      }
    }
  }
  return Array.from(tags).sort();
}
