/* useStore.tier4-migration.test — Phase Polish-Tier-4 Capa 1.
   Verifica el backfill defensive del campo `dimensions` en entries
   de history previos (v17 → v18). Preserva preexistente + idempotente
   + safe sobre history vacío/null. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockSavedState = null;

vi.mock("../lib/storage", async () => {
  const real = await vi.importActual("../lib/storage");
  return {
    ...real,
    saveState: vi.fn(async () => {}),
    loadState: vi.fn(async () => mockSavedState),
    clearAll: vi.fn(async () => {}),
    outboxAdd: vi.fn(async () => {}),
    getSyncChannel: () => null,
  };
});

import { useStore } from "./useStore";

beforeEach(() => {
  mockSavedState = null;
  useStore.setState({
    _userId: null,
    _loaded: false,
    history: [],
    totalSessions: 0,
  });
});

afterEach(() => vi.clearAllMocks());

describe("Tier-4 Capa-1 — store v17→v18 migration backfill", () => {
  it("entries v17 sin field dimensions → backfilled con null (additive)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 17,
      history: [
        { ts: 1, p: "Reset", c: 60, r: 50, bioQ: 65 },
        { ts: 2, p: "Foco", c: 65, r: 55, bioQ: 70 },
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist).toHaveLength(2);
    expect(hist[0]).toHaveProperty("dimensions");
    expect(hist[0].dimensions).toBeNull();
    expect(hist[1].dimensions).toBeNull();
  });

  it("entries con dimensions previas (v18 hot-path) preservadas, NO sobrescritas", async () => {
    mockSavedState = {
      _userId: null,
      _v: 17,
      history: [
        { ts: 1, p: "X", c: 60, r: 50, bioQ: 65, dimensions: { foco: 70, calma: 60, energia: 65 } },
        { ts: 2, p: "Y", c: 65, r: 55, bioQ: 70 }, // sin dimensions, debe quedar null
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist[0].dimensions).toEqual({ foco: 70, calma: 60, energia: 65 });
    expect(hist[1].dimensions).toBeNull();
  });

  it("history vacío → no crash, sin cambios", async () => {
    mockSavedState = {
      _userId: null,
      _v: 17,
      history: [],
      totalSessions: 0,
    };
    await useStore.getState().init({});
    expect(useStore.getState().history).toEqual([]);
  });

  it("history null → no crash en migration backfill (defensive)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 17,
      history: null,
      totalSessions: 0,
    };
    // Migration path shouldn't throw aún si history es null; el store
    // mantiene el null tal cual (otras safeguards downstream tratan null vs []).
    await expect(useStore.getState().init({})).resolves.not.toThrow();
    const h = useStore.getState().history;
    expect(h === null || Array.isArray(h)).toBe(true);
  });

  it("STORE_VERSION post-migration es 20 (Phase 7 F0-3 bumped, latest)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 17,
      history: [{ ts: 1, p: "X", c: 60, r: 50, bioQ: 65 }],
      totalSessions: 1,
    };
    await useStore.getState().init({});
    expect(useStore.getState()._v).toBe(20);
  });

  it("idempotent: re-init con state ya v18 NO modifica entries", async () => {
    mockSavedState = {
      _userId: null,
      _v: 18,
      history: [
        { ts: 1, p: "X", c: 60, r: 50, bioQ: 65, dimensions: null },
        { ts: 2, p: "Y", c: 65, r: 55, bioQ: 70, dimensions: { foco: 65, calma: 55, energia: 60 } },
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist[0].dimensions).toBeNull();
    expect(hist[1].dimensions).toEqual({ foco: 65, calma: 55, energia: 60 });
  });
});
