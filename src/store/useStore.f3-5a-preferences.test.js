/* useStore.f3-5a-preferences.test — Phase 7 F3.5-A Capa-2.
   Verifica:
   1) STORE_VERSION 20→21 bump.
   2) preferences field defensive backfill empty object.
   3) setPreference action: set/update/preserve.
   4) Defensive contracts. */
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
    preferences: {},
  });
});

afterEach(() => vi.clearAllMocks());

describe("F3.5-A Capa-2 — store v20→v21 migration", () => {
  it("STORE_VERSION post-migration es 21 (Phase 7 F3.5-A)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 20,
      history: [],
      totalSessions: 0,
    };
    await useStore.getState().init({});
    expect(useStore.getState()._v).toBe(22);
  });

  it("estado pre-v21 sin preferences → backfill empty object", async () => {
    mockSavedState = {
      _userId: null,
      _v: 20,
      history: [],
      // sin preferences field
    };
    await useStore.getState().init({});
    expect(useStore.getState().preferences).toEqual({});
  });

  it("estado pre-v21 con preferences null/array/string → reset a empty object (defensive)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 20,
      history: [],
      preferences: null,
    };
    await useStore.getState().init({});
    expect(useStore.getState().preferences).toEqual({});
  });

  it("estado pre-v21 con preferences existente preservado", async () => {
    mockSavedState = {
      _userId: null,
      _v: 20,
      history: [],
      preferences: { someKey: true, otherKey: 42 },
    };
    await useStore.getState().init({});
    expect(useStore.getState().preferences).toEqual({ someKey: true, otherKey: 42 });
  });

  it("estado pre-Tier-4 (v17) sin nada → migration cumulativa hasta v21", async () => {
    mockSavedState = {
      _userId: null,
      _v: 17,
      history: [{ ts: 1, p: "X", c: 60, r: 50, bioQ: 65 }],
      totalSessions: 1,
    };
    await useStore.getState().init({});
    const s = useStore.getState();
    expect(s._v).toBe(22);
    // v18 dimensions backfill
    expect(s.history[0].dimensions).toBeNull();
    // v19 actsLog backfill
    expect(s.history[0].actsLog).toBeNull();
    // v20 postSessionFeedback backfill
    expect(s.history[0].postSessionFeedback).toBeNull();
    // v21 preferences backfill
    expect(s.preferences).toEqual({});
  });

  it("idempotent: re-init con state ya v21 NO modifica preferences", async () => {
    mockSavedState = {
      _userId: null,
      _v: 21,
      history: [],
      preferences: { dontShowAgainReset1Intro: true, customKey: "value" },
    };
    await useStore.getState().init({});
    expect(useStore.getState().preferences).toEqual({
      dontShowAgainReset1Intro: true,
      customKey: "value",
    });
  });
});

describe("F3.5-A Capa-2 — setPreference action", () => {
  it("Sets dontShowAgainReset1Intro true", () => {
    useStore.setState({ preferences: {} });
    useStore.getState().setPreference("dontShowAgainReset1Intro", true);
    expect(useStore.getState().preferences.dontShowAgainReset1Intro).toBe(true);
  });

  it("Update existing key: replace value", () => {
    useStore.setState({ preferences: { foo: "old" } });
    useStore.getState().setPreference("foo", "new");
    expect(useStore.getState().preferences.foo).toBe("new");
  });

  it("Preserves existing keys when adding new one", () => {
    useStore.setState({ preferences: { existing: 42 } });
    useStore.getState().setPreference("dontShowAgainReset1Intro", true);
    expect(useStore.getState().preferences).toEqual({
      existing: 42,
      dontShowAgainReset1Intro: true,
    });
  });

  it("Defensive: invalid key (non-string) → no-op", () => {
    useStore.setState({ preferences: { foo: 1 } });
    useStore.getState().setPreference(null, true);
    useStore.getState().setPreference(42, true);
    useStore.getState().setPreference("", true);
    expect(useStore.getState().preferences).toEqual({ foo: 1 });
  });

  it("Defensive: preferences shape malformed → safe normalize via spread default empty", () => {
    useStore.setState({ preferences: null });
    useStore.getState().setPreference("dontShowAgainReset1Intro", true);
    expect(useStore.getState().preferences).toEqual({ dontShowAgainReset1Intro: true });
  });

  it("Anti-regression: existing store actions intactas (logMood preservada)", () => {
    expect(typeof useStore.getState().logMood).toBe("function");
    expect(typeof useStore.getState().recordSessionOutcome).toBe("function");
    expect(typeof useStore.getState().attachSessionFeedback).toBe("function");
  });
});
