/* useStore.f0-3-feedback.test — Phase 7 F0-3 Capa 2.
   Verifica:
   1) attachSessionFeedback patches el último history entry con feedback
      sanitized (whitelist 5 fields + capturedAt).
   2) Defensive contracts: feedback null/array/empty → no-op.
   3) Migration v19→v20 backfill defensive postSessionFeedback null.
   4) Idempotente + safe sobre history vacío/null. */
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

describe("F0-3 Capa-2 — attachSessionFeedback action", () => {
  it("patches último history entry con feedback completo sanitized", () => {
    useStore.setState({
      history: [
        { ts: 1, p: "A", postSessionFeedback: null },
        { ts: 2, p: "B", postSessionFeedback: null },
      ],
    });
    useStore.getState().attachSessionFeedback({
      helpedRating: 5,
      willDoAgain: 4,
      bodySensations: ["relaxed", "clear"],
      sideEffects: ["none"],
      timeToEffect: "immediate",
      capturedAt: 999, // se sobrescribe
    });
    const hist = useStore.getState().history;
    expect(hist[0].postSessionFeedback).toBeNull(); // entry anterior NO tocado
    const fb = hist[1].postSessionFeedback;
    expect(fb).not.toBeNull();
    expect(fb.helpedRating).toBe(5);
    expect(fb.willDoAgain).toBe(4);
    expect(fb.bodySensations).toEqual(["relaxed", "clear"]);
    expect(fb.sideEffects).toEqual(["none"]);
    expect(fb.timeToEffect).toBe("immediate");
    expect(typeof fb.capturedAt).toBe("number");
    expect(fb.capturedAt).not.toBe(999); // sobrescrito a Date.now()
  });

  it("partial feedback (algunos null) preserva semántica", () => {
    useStore.setState({
      history: [{ ts: 1, p: "X", postSessionFeedback: null }],
    });
    useStore.getState().attachSessionFeedback({
      helpedRating: 3,
      willDoAgain: null,
      bodySensations: null,
      sideEffects: null,
      timeToEffect: null,
    });
    const fb = useStore.getState().history[0].postSessionFeedback;
    expect(fb.helpedRating).toBe(3);
    expect(fb.willDoAgain).toBeNull();
    expect(fb.bodySensations).toBeNull();
  });

  it("idempotente: re-attach reemplaza objeto entero", () => {
    useStore.setState({
      history: [{ ts: 1, p: "X", postSessionFeedback: null }],
    });
    useStore.getState().attachSessionFeedback({ helpedRating: 5 });
    expect(useStore.getState().history[0].postSessionFeedback.helpedRating).toBe(5);
    useStore.getState().attachSessionFeedback({ helpedRating: 2, willDoAgain: 3 });
    const fb = useStore.getState().history[0].postSessionFeedback;
    expect(fb.helpedRating).toBe(2);
    expect(fb.willDoAgain).toBe(3);
  });

  it("defensive: feedback null → no-op", () => {
    useStore.setState({
      history: [{ ts: 1, p: "X", postSessionFeedback: null }],
    });
    useStore.getState().attachSessionFeedback(null);
    expect(useStore.getState().history[0].postSessionFeedback).toBeNull();
  });

  it("defensive: feedback array → no-op", () => {
    useStore.setState({
      history: [{ ts: 1, p: "X", postSessionFeedback: null }],
    });
    useStore.getState().attachSessionFeedback([1, 2, 3]);
    expect(useStore.getState().history[0].postSessionFeedback).toBeNull();
  });

  it("defensive: history vacío → no crash", () => {
    useStore.setState({ history: [] });
    expect(() =>
      useStore.getState().attachSessionFeedback({ helpedRating: 5 })
    ).not.toThrow();
    expect(useStore.getState().history).toEqual([]);
  });

  it("defensive: feedback con todos los fields null → no-op (skip-all sin respuesta)", () => {
    useStore.setState({
      history: [{ ts: 1, p: "X", postSessionFeedback: null }],
    });
    useStore.getState().attachSessionFeedback({
      helpedRating: null,
      willDoAgain: null,
      bodySensations: null,
      sideEffects: null,
      timeToEffect: null,
    });
    expect(useStore.getState().history[0].postSessionFeedback).toBeNull();
  });

  it("defensive: feedback con ratings fuera de rango → field clamped a null", () => {
    useStore.setState({
      history: [{ ts: 1, p: "X", postSessionFeedback: null }],
    });
    useStore.getState().attachSessionFeedback({
      helpedRating: 99, // fuera de rango → null
      willDoAgain: 0,   // fuera de rango → null
      timeToEffect: "immediate",
    });
    const fb = useStore.getState().history[0].postSessionFeedback;
    expect(fb.helpedRating).toBeNull();
    expect(fb.willDoAgain).toBeNull();
    expect(fb.timeToEffect).toBe("immediate");
  });

  it("defensive: arrays con tipos no-string filtered", () => {
    useStore.setState({
      history: [{ ts: 1, p: "X", postSessionFeedback: null }],
    });
    useStore.getState().attachSessionFeedback({
      bodySensations: ["relaxed", 123, null, "clear"], // 123 + null filtered
      helpedRating: 4, // need ≥1 valid field para no-no-op
    });
    const fb = useStore.getState().history[0].postSessionFeedback;
    expect(fb.bodySensations).toEqual(["relaxed", "clear"]);
  });

  it("defensive: arrays vacíos → null (no objeto vacío persistido)", () => {
    useStore.setState({
      history: [{ ts: 1, p: "X", postSessionFeedback: null }],
    });
    useStore.getState().attachSessionFeedback({
      bodySensations: [],
      helpedRating: 4,
    });
    const fb = useStore.getState().history[0].postSessionFeedback;
    expect(fb.bodySensations).toBeNull();
    expect(fb.helpedRating).toBe(4);
  });
});

describe("F0-3 Capa-2 — store v19→v20 migration backfill", () => {
  it("entries v19 sin postSessionFeedback → backfilled con null", async () => {
    mockSavedState = {
      _userId: null,
      _v: 19,
      history: [
        { ts: 1, p: "A", c: 60, r: 50, bioQ: 65, dimensions: null, actsLog: null },
        { ts: 2, p: "B", c: 65, r: 55, bioQ: 70, dimensions: null, actsLog: null },
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist).toHaveLength(2);
    [0, 1].forEach((i) => {
      expect(hist[i]).toHaveProperty("postSessionFeedback");
      expect(hist[i].postSessionFeedback).toBeNull();
    });
  });

  it("entries con postSessionFeedback existente preservadas", async () => {
    const realFeedback = {
      helpedRating: 5,
      willDoAgain: 4,
      bodySensations: ["relaxed"],
      sideEffects: ["none"],
      timeToEffect: "immediate",
      capturedAt: 12345,
    };
    mockSavedState = {
      _userId: null,
      _v: 19,
      history: [
        {
          ts: 1, p: "X", c: 60, r: 50, bioQ: 65, dimensions: null, actsLog: null,
          postSessionFeedback: realFeedback,
        },
        { ts: 2, p: "Y", c: 65, r: 55, bioQ: 70, dimensions: null, actsLog: null },
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist[0].postSessionFeedback).toEqual(realFeedback);
    expect(hist[1].postSessionFeedback).toBeNull();
  });

  it("STORE_VERSION post-migration es 21 (Phase 7 F3.5-A bumped, latest)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 19,
      history: [{ ts: 1, p: "X", c: 60, r: 50, bioQ: 65, dimensions: null, actsLog: null }],
      totalSessions: 1,
    };
    await useStore.getState().init({});
    expect(useStore.getState()._v).toBe(22);
  });

  it("entries pre-Tier-4 (v17 sin nada) reciben los 3 backfills en pass único", async () => {
    mockSavedState = {
      _userId: null,
      _v: 17,
      history: [
        { ts: 1, p: "X", c: 60, r: 50, bioQ: 65 }, // sin dims, sin actsLog, sin feedback
      ],
      totalSessions: 1,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist[0].dimensions).toBeNull();
    expect(hist[0].actsLog).toBeNull();
    expect(hist[0].postSessionFeedback).toBeNull();
  });

  it("idempotent: re-init con state ya v20 NO modifica entries", async () => {
    const realFeedback = {
      helpedRating: 5, willDoAgain: 4,
      bodySensations: null, sideEffects: null, timeToEffect: null,
      capturedAt: 111,
    };
    mockSavedState = {
      _userId: null,
      _v: 20,
      history: [
        {
          ts: 1, p: "X", c: 60, r: 50, bioQ: 65,
          dimensions: null, actsLog: null,
          postSessionFeedback: realFeedback,
        },
        {
          ts: 2, p: "Y", c: 65, r: 55, bioQ: 70,
          dimensions: null, actsLog: null,
          postSessionFeedback: null,
        },
      ],
      totalSessions: 2,
    };
    await useStore.getState().init({});
    const hist = useStore.getState().history;
    expect(hist[0].postSessionFeedback).toEqual(realFeedback);
    expect(hist[1].postSessionFeedback).toBeNull();
  });

  it("history vacío + v19 → no crash", async () => {
    mockSavedState = {
      _userId: null,
      _v: 19,
      history: [],
      totalSessions: 0,
    };
    await useStore.getState().init({});
    expect(useStore.getState().history).toEqual([]);
  });
});
