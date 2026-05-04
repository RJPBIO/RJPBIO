/**
 * Phase 6F SP-A — Program backend wiring smoke E2E.
 *
 * Scope deliberadamente acotado: SP-A es BACKEND-ONLY (no toca UI).
 * Tests verifican que los endpoints están montados, auth está wired,
 * role gate funciona, y la respuesta JSON tiene la shape esperada.
 *
 * Happy-path con auth real (POST /me/program/start después de
 * /api/dev/login) NO se cubre aquí — requiere DB seed garantizada y
 * pertenece a SP-B (UI flow). Si /api/dev/login está disponible y el
 * user demo existe, el último test corre opcionalmente.
 *
 * Run con: npm run test:e2e (suite completa) o
 *          playwright test tests/e2e/program-flow.spec.ts
 */
import { test, expect } from "@playwright/test";

test.describe("Phase 6F SP-A — Program endpoints wiring", () => {
  test("GET /api/v1/me/program/active retorna 401 sin sesión", async ({ request }) => {
    const res = await request.get("/api/v1/me/program/active");
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(body.error).toBe("unauthorized");
  });

  test("POST /api/v1/me/program/start retorna 401 sin sesión", async ({ request }) => {
    const res = await request.post("/api/v1/me/program/start", {
      data: { programId: "neural-baseline" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/me/program/abandon retorna 401 sin sesión", async ({ request }) => {
    const res = await request.post("/api/v1/me/program/abandon");
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/me/program/reEval retorna 401 sin sesión", async ({ request }) => {
    const res = await request.post("/api/v1/me/program/reEval", {
      data: {
        instrumentId: "pss-4",
        score: 8,
        level: "moderate",
        answers: { q1: 2, q2: 1, q3: 2, q4: 3 },
      },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/v1/orgs/[orgId]/programs/adherence retorna 401 sin sesión", async ({ request }) => {
    const res = await request.get("/api/v1/orgs/dummy_org_id/programs/adherence");
    expect(res.status()).toBe(401);
  });

  test("Endpoints NO retornan 404 (rutas montadas correctamente)", async ({ request }) => {
    // Sin auth todos retornan 401, no 404. Confirma que los archivos
    // route.js están en su path correcto y Next.js los registró.
    const checks = [
      { method: "GET", url: "/api/v1/me/program/active" },
      { method: "POST", url: "/api/v1/me/program/start" },
      { method: "POST", url: "/api/v1/me/program/abandon" },
      { method: "POST", url: "/api/v1/me/program/reEval" },
      { method: "GET", url: "/api/v1/orgs/abc/programs/adherence" },
    ];
    for (const c of checks) {
      const res = c.method === "GET"
        ? await request.get(c.url)
        : await request.post(c.url, { data: {} });
      expect(res.status(), `${c.method} ${c.url}`).not.toBe(404);
    }
  });
});

test.describe("Phase 6F SP-A — Happy path con /api/dev/login", () => {
  test("user autenticado puede iniciar + leer + abandonar programa", async ({ page, request }) => {
    // /api/dev/login sólo existe en NODE_ENV=development. Si no está
    // disponible (404 o 403), skipeamos. No hay forma robusta de seedar
    // un user demo desde aquí, así que confiamos en `npm run seed`.
    const loginRes = await page.goto(
      "/api/dev/login?email=owner@demo.local&next=/app",
      { waitUntil: "networkidle" }
    ).catch(() => null);
    if (!loginRes || loginRes.status() === 403 || loginRes.status() === 404) {
      test.skip(true, "dev/login no disponible — corre `npm run seed` y NODE_ENV=development");
      return;
    }

    // Cookies del page.context() persisten para request subsiguientes.
    // POST /me/program/start
    const startRes = await page.request.post("/api/v1/me/program/start", {
      data: { programId: "neural-baseline", source: "self-selected" },
    });
    if (startRes.status() === 401) {
      test.skip(true, "dev login no fijó cookie correctamente — environment-specific");
      return;
    }
    expect(startRes.status()).toBe(201);
    const startBody = await startRes.json();
    expect(startBody.ok).toBe(true);
    expect(startBody.assignment.programId).toBe("neural-baseline");

    // GET /me/program/active → debe retornar el programa recién iniciado
    const activeRes = await page.request.get("/api/v1/me/program/active");
    expect(activeRes.status()).toBe(200);
    const activeBody = await activeRes.json();
    expect(activeBody.active).not.toBeNull();
    expect(activeBody.active.programId).toBe("neural-baseline");
    expect(activeBody.active.todayStatus).toBeDefined();
    expect(activeBody.active.progress).toBeDefined();

    // POST /me/program/abandon → debe marcar abandonedAt
    const abandonRes = await page.request.post("/api/v1/me/program/abandon");
    expect(abandonRes.status()).toBe(200);

    // GET /me/program/active → ahora null (programa abandonado)
    const activeAfter = await page.request.get("/api/v1/me/program/active");
    expect(activeAfter.status()).toBe(200);
    const activeAfterBody = await activeAfter.json();
    expect(activeAfterBody.active).toBeNull();
  });
});
