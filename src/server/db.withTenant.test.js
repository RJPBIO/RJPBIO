import { describe, it, expect } from "vitest";
import { withTenant, db } from "./db";

/* Fase 1 del RLS: el plumbing withTenant. En test usa el adaptador de
   memoria (sin $executeRaw), así que valida la ruta no-op: ejecuta fn con
   el cliente y devuelve su resultado, con o sin ctx. La ruta real (Prisma
   $transaction + set_config) requiere Postgres de staging — no verificable
   in-memory, por diseño. */

describe("withTenant (Fase 1 plumbing)", () => {
  it("ejecuta fn con el cliente y devuelve su resultado", async () => {
    const out = await withTenant({ userId: "u_1", orgIds: ["o_1", "o_2"], role: "ADMIN" }, async (client) => {
      expect(client).toBeTruthy();
      expect(typeof client.org.findMany).toBe("function");
      return "ok";
    });
    expect(out).toBe("ok");
  });

  it("funciona sin ctx (defaults vacíos)", async () => {
    const out = await withTenant(undefined, async () => 42);
    expect(out).toBe(42);
  });

  it("el cliente expuesto es el mismo adaptador que db()", async () => {
    const direct = await db();
    let inside;
    await withTenant({ userId: "u_1" }, async (client) => { inside = client; });
    // En memoria, withTenant pasa el orm directo (no abre transacción).
    expect(inside).toBe(direct);
  });

  it("propaga el error de fn", async () => {
    await expect(withTenant({ userId: "u_1" }, async () => { throw new Error("boom"); })).rejects.toThrow("boom");
  });
});
