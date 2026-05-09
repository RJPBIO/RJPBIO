/* useStore.f0-2-migration.test — Phase 7 F0-2 Capa 2.
   Verifica el backfill defensive de los 4 fields de telemetría granular
   (actsLog/actsCompleted/actsSkipped/actsFailed) en entries de history
   previos durante migration v18→v19. Defensive null backfill (sin
   synthetic compute), preserva preexistente, idempotente, safe sobre
   history vacío/null. Mismo patrón que Tier-4 (v17→v18). */
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

describe("F0-2 Capa-2 — store v18→v19 migration backfill", () => {
  it("entries v18 sin field actsLog → backfilled con null (4 fields)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 18,
      history: [
        { ts: 1, p: "Reset", c: 60, r: 50, bioQ: 65, dimensions: { foco: 70, calma: 60, energia: 65 } },
        { ts: 2, p: "Foco", c: 65, r: 55, bioQ: 70, dimensions: null },
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist).toHaveLength(2);
    [0, 1].forEach((i) => {
      expect(hist[i]).toHaveProperty("actsLog");
      expect(hist[i].actsLog).toBeNull();
      expect(hist[i].actsCompleted).toBeNull();
      expect(hist[i].actsSkipped).toBeNull();
      expect(hist[i].actsFailed).toBeNull();
    });
  });

  it("entries con actsLog previas (v19 hot-path) preservadas, NO sobrescritas", async () => {
    const realActsLog = [
      { actId: "0-0", status: "completed", validationOutcome: "passed" },
      { actId: "1-0", status: "skipped", validationOutcome: "failed" },
    ];
    mockSavedState = {
      _userId: null,
      _v: 18,
      history: [
        {
          ts: 1, p: "X", c: 60, r: 50, bioQ: 65, dimensions: null,
          actsLog: realActsLog, actsCompleted: 1, actsSkipped: 1, actsFailed: 1,
        },
        { ts: 2, p: "Y", c: 65, r: 55, bioQ: 70, dimensions: null }, // sin actsLog → backfill null
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist[0].actsLog).toEqual(realActsLog);
    expect(hist[0].actsCompleted).toBe(1);
    expect(hist[0].actsSkipped).toBe(1);
    expect(hist[0].actsFailed).toBe(1);
    expect(hist[1].actsLog).toBeNull();
    expect(hist[1].actsCompleted).toBeNull();
  });

  it("entries pre-Tier-4 (v17 sin dimensions) reciben AMBOS backfills en un solo pass", async () => {
    mockSavedState = {
      _userId: null,
      _v: 17,
      history: [
        { ts: 1, p: "X", c: 60, r: 50, bioQ: 65 }, // ni dimensions ni actsLog
      ],
      totalSessions: 1,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist[0].dimensions).toBeNull();
    expect(hist[0].actsLog).toBeNull();
    expect(hist[0].actsCompleted).toBeNull();
    expect(hist[0].actsSkipped).toBeNull();
    expect(hist[0].actsFailed).toBeNull();
  });

  it("history vacío → no crash, sin cambios", async () => {
    mockSavedState = {
      _userId: null,
      _v: 18,
      history: [],
      totalSessions: 0,
    };
    await useStore.getState().init({});
    expect(useStore.getState().history).toEqual([]);
  });

  it("history null → no crash en migration backfill (defensive)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 18,
      history: null,
      totalSessions: 0,
    };
    await expect(useStore.getState().init({})).resolves.not.toThrow();
    const h = useStore.getState().history;
    expect(h === null || Array.isArray(h)).toBe(true);
  });

  it("STORE_VERSION post-migration es 21 (Phase 7 F3.5-A bumped, latest)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 18,
      history: [{ ts: 1, p: "X", c: 60, r: 50, bioQ: 65, dimensions: null }],
      totalSessions: 1,
    };
    await useStore.getState().init({});
    expect(useStore.getState()._v).toBe(21);
  });

  it("idempotent: re-init con state ya v19 NO modifica entries", async () => {
    const realActsLog = [{ actId: "0-0", status: "completed" }];
    mockSavedState = {
      _userId: null,
      _v: 19,
      history: [
        {
          ts: 1, p: "X", c: 60, r: 50, bioQ: 65, dimensions: null,
          actsLog: null, actsCompleted: null, actsSkipped: null, actsFailed: null,
        },
        {
          ts: 2, p: "Y", c: 65, r: 55, bioQ: 70, dimensions: null,
          actsLog: realActsLog, actsCompleted: 1, actsSkipped: 0, actsFailed: 0,
        },
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist[0].actsLog).toBeNull();
    expect(hist[1].actsLog).toEqual(realActsLog);
    expect(hist[1].actsCompleted).toBe(1);
  });
});
