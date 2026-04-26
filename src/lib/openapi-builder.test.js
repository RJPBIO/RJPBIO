import { describe, it, expect } from "vitest";
import {
  errorBody, responses, paged, ok, created, noContent,
  pathParam, queryParam, bearerWithScope,
  validateSpec, countOperations, listUsedTags,
} from "./openapi-builder";

describe("errorBody", () => {
  it("shape estable con error required", () => {
    expect(errorBody.required).toContain("error");
    expect(errorBody.properties.error.type).toBe("string");
    expect(errorBody.properties.message).toBeDefined();
    expect(errorBody.properties.details).toBeDefined();
  });
});

describe("responses.standard / withValidation", () => {
  it("standard tiene 401, 403, 429", () => {
    const s = responses.standard();
    expect(s["401"]).toBeDefined();
    expect(s["403"]).toBeDefined();
    expect(s["429"]).toBeDefined();
    expect(s["200"]).toBeUndefined();
  });

  it("withValidation suma 404 y 422", () => {
    const r = responses.withValidation();
    expect(r["401"]).toBeDefined();
    expect(r["404"]).toBeDefined();
    expect(r["422"]).toBeDefined();
    expect(r["429"]).toBeDefined();
  });

  it("rateLimited incluye headers RFC 9239", () => {
    expect(responses.rateLimited.headers["RateLimit-Policy"]).toBeDefined();
    expect(responses.rateLimited.headers["RateLimit"]).toBeDefined();
    expect(responses.rateLimited.headers["Retry-After"]).toBeDefined();
  });

  it("cada response component referencia schemas/Error", () => {
    for (const key of ["unauthorized", "forbidden", "notFound", "validationError", "conflict", "rateLimited"]) {
      const r = responses[key];
      const schema = r.content?.["application/json"]?.schema;
      expect(schema?.$ref).toBe("#/components/schemas/Error");
    }
  });
});

describe("paged / ok / created / noContent", () => {
  it("paged wrap con totalResults + Resources", () => {
    const p = paged({ $ref: "#/components/schemas/Session" });
    expect(p.description).toContain("OK");
    const schema = p.content["application/json"].schema;
    expect(schema.required).toContain("Resources");
    expect(schema.properties.Resources.items.$ref).toBe("#/components/schemas/Session");
  });

  it("ok básico", () => {
    const o = ok({ type: "object" });
    expect(o.description).toBe("OK");
    expect(o.content["application/json"].schema.type).toBe("object");
  });

  it("ok con description custom", () => {
    expect(ok({}, "custom").description).toBe("custom");
  });

  it("created", () => {
    const c = created({ $ref: "#/components/schemas/Session" }, "Sesión registrada");
    expect(c.description).toBe("Sesión registrada");
  });

  it("noContent (204)", () => {
    expect(noContent()).toEqual({ description: "No content" });
    expect(noContent("Removed").description).toBe("Removed");
  });
});

describe("pathParam / queryParam", () => {
  it("pathParam required + schema type", () => {
    const p = pathParam("orgId", "string", "Org id");
    expect(p.name).toBe("orgId");
    expect(p.in).toBe("path");
    expect(p.required).toBe(true);
    expect(p.schema.type).toBe("string");
  });

  it("queryParam not-required default", () => {
    const q = queryParam("limit", "integer");
    expect(q.in).toBe("query");
    expect(q.required).toBe(false);
  });

  it("queryParam required override", () => {
    expect(queryParam("token", "string", "", { required: true }).required).toBe(true);
  });
});

describe("bearerWithScope", () => {
  it("sin scope → bearerAuth empty array", () => {
    expect(bearerWithScope()).toEqual([{ bearerAuth: [] }]);
  });
  it("con scope → bearerAuth con scope name", () => {
    expect(bearerWithScope("scim")).toEqual([{ bearerAuth: ["scim"] }]);
  });
});

describe("validateSpec", () => {
  function validSpec() {
    return {
      openapi: "3.1.0",
      info: { title: "X API", version: "1.0.0" },
      paths: { "/x": { get: { responses: { "200": { description: "OK" } } } } },
      components: {},
    };
  }

  it("spec válido → ok", () => {
    expect(validateSpec(validSpec())).toEqual({ ok: true });
  });

  it("non-object → error", () => {
    expect(validateSpec(null).ok).toBe(false);
    expect(validateSpec("nope").ok).toBe(false);
  });

  it("falta openapi version → error", () => {
    const s = validSpec();
    delete s.openapi;
    const r = validateSpec(s);
    expect(r.ok).toBe(false);
    expect(r.errors.find((e) => e.field === "openapi")).toBeDefined();
  });

  it("falta info.title → error", () => {
    const s = validSpec();
    s.info = { version: "1.0.0" };
    const r = validateSpec(s);
    expect(r.errors.find((e) => e.field === "info.title")).toBeDefined();
  });

  it("falta paths → error", () => {
    const s = validSpec();
    delete s.paths;
    const r = validateSpec(s);
    expect(r.errors.find((e) => e.field === "paths")).toBeDefined();
  });

  it("path sin verbs HTTP → error", () => {
    const s = validSpec();
    s.paths = { "/x": { foo: "bar" } };
    const r = validateSpec(s);
    expect(r.errors.find((e) => e.field === "paths./x" && e.error === "no_verbs")).toBeDefined();
  });

  it("path no-objeto → error", () => {
    const s = validSpec();
    s.paths = { "/x": "nope" };
    const r = validateSpec(s);
    expect(r.errors.find((e) => e.field === "paths./x" && e.error === "not_object")).toBeDefined();
  });
});

describe("countOperations / listUsedTags", () => {
  const spec = {
    paths: {
      "/a": {
        get: { tags: ["foo"], responses: { "200": { description: "OK" } } },
        post: { tags: ["foo", "bar"], responses: { "201": { description: "Created" } } },
      },
      "/b": {
        delete: { tags: ["bar"], responses: { "204": { description: "OK" } } },
      },
    },
  };

  it("cuenta operations únicas (verb-paths)", () => {
    expect(countOperations(spec)).toBe(3);
  });

  it("listUsedTags dedup + sort", () => {
    expect(listUsedTags(spec)).toEqual(["bar", "foo"]);
  });

  it("spec sin paths → 0 / []", () => {
    expect(countOperations({})).toBe(0);
    expect(listUsedTags({})).toEqual([]);
  });

  it("null safe", () => {
    expect(countOperations(null)).toBe(0);
    expect(listUsedTags(null)).toEqual([]);
  });
});
