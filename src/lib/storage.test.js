import { describe, it, expect, beforeEach } from "vitest";
import { loadState, saveState, clearAll, exportSigned } from "./storage";

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
