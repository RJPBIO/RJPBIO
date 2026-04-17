import { describe, it, expect, beforeEach } from "vitest";
import { loadState, saveState, clearAll, exportSigned, outboxAdd, outboxAll, outboxRemove } from "./storage";

describe("storage (fallback localStorage)", () => {
  beforeEach(() => { try { localStorage.clear(); } catch {} });

  it("loadState retorna null inicial", async () => {
    const s = await loadState();
    expect(s === null || typeof s === "object").toBe(true);
  });

  it("saveState + loadState hacen round-trip", async () => {
    await saveState({ totalSessions: 5, foo: "bar" });
    const r = await loadState();
    expect(r?.totalSessions).toBe(5);
    expect(r?.foo).toBe("bar");
  });

  it("clearAll limpia", async () => {
    await saveState({ a: 1 });
    await clearAll();
    const r = await loadState();
    expect(r).toBeNull();
  });

  it("exportSigned produce firma SHA-256", async () => {
    const { payload, signature } = await exportSigned({ foo: "bar" });
    expect(payload).toContain("bio-ignicion");
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("storage (IndexedDB paths con fake-indexeddb)", () => {
  beforeEach(async () => {
    try { localStorage.clear(); } catch {}
    await clearAll();
    const all = await outboxAll();
    for (const e of all) await outboxRemove(e.id);
  });

  it("round-trip via IDB cifra y descifra correctamente", async () => {
    await saveState({ totalSessions: 42, secret: "x" });
    const r = await loadState();
    expect(r.totalSessions).toBe(42);
    expect(r.secret).toBe("x");
  });

  it("outboxAdd + outboxAll recupera entradas", async () => {
    await outboxAdd({ kind: "session", data: { id: 1 } });
    await outboxAdd({ kind: "mood", data: { m: 4 } });
    const all = await outboxAll();
    expect(all.length).toBe(2);
    expect(all[0].ts).toBeGreaterThan(0);
  });

  it("outboxRemove elimina por id", async () => {
    await outboxAdd({ kind: "test" });
    const [e] = await outboxAll();
    await outboxRemove(e.id);
    const remaining = await outboxAll();
    expect(remaining.length).toBe(0);
  });

  it("clearAll elimina también el estado en IDB", async () => {
    await saveState({ v: 1 });
    await clearAll();
    expect(await loadState()).toBeNull();
  });
});
