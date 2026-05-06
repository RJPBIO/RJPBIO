/* useStore.init.test — Phase 6G Fix1 P0-1 anti-regression.
   Verifica que init() defensivo NO clava state cuando AppV2Root
   llama init() sin userId pero el saved state tiene _userId set
   (e.g. tras login + sync.js identity binding).

   Master bug: prev defined + curr null → era clearAll() → state lost.
   Fix:        prev defined + curr null → preserve state + preserve _userId. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

let mockSavedState = null;
let clearAllCalled = 0;

vi.mock("../lib/storage", async () => {
  const real = await vi.importActual("../lib/storage");
  return {
    ...real,
    saveState: vi.fn(async () => {}),
    loadState: vi.fn(async () => mockSavedState),
    clearAll: vi.fn(async () => { clearAllCalled++; }),
    outboxAdd: vi.fn(async () => {}),
    getSyncChannel: () => null,
  };
});

import { useStore } from "./useStore";

beforeEach(() => {
  mockSavedState = null;
  clearAllCalled = 0;
  // Reset the store to defaults antes de cada test.
  useStore.setState({
    _userId: null,
    _loaded: false,
    welcomeDone: false,
    onboardingComplete: false,
    history: [],
    totalSessions: 0,
    firstIntent: null,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useStore.init() defensive — Phase 6G Fix1 P0-1 master bug", () => {
  it("anonymous → anonymous: preserve state, no clearAll", async () => {
    mockSavedState = {
      _userId: null,
      _v: 16,
      welcomeDone: true,
      firstIntent: "calma",
      history: [{ ts: 1, p: "test" }],
      totalSessions: 1,
    };
    await useStore.getState().init({});
    expect(clearAllCalled).toBe(0);
    expect(useStore.getState().welcomeDone).toBe(true);
    expect(useStore.getState().firstIntent).toBe("calma");
    expect(useStore.getState().history).toHaveLength(1);
    expect(useStore.getState()._userId).toBe(null);
  });

  it("anonymous saved + userId provided → preserve state, attach userId (first login)", async () => {
    mockSavedState = {
      _userId: null,
      _v: 16,
      welcomeDone: true,
      firstIntent: "enfoque",
      history: [{ ts: 1, p: "test" }, { ts: 2, p: "test2" }],
      totalSessions: 2,
    };
    await useStore.getState().init({ userId: "user-real-123" });
    expect(clearAllCalled).toBe(0);
    expect(useStore.getState().welcomeDone).toBe(true);
    expect(useStore.getState().firstIntent).toBe("enfoque");
    expect(useStore.getState().history).toHaveLength(2);
    expect(useStore.getState()._userId).toBe("user-real-123");
  });

  it("same userId match → preserve state", async () => {
    mockSavedState = {
      _userId: "user-real-123",
      _v: 16,
      welcomeDone: true,
      firstIntent: "calma",
      history: [{ ts: 1, p: "test" }],
      totalSessions: 1,
    };
    await useStore.getState().init({ userId: "user-real-123" });
    expect(clearAllCalled).toBe(0);
    expect(useStore.getState().welcomeDone).toBe(true);
    expect(useStore.getState().history).toHaveLength(1);
    expect(useStore.getState()._userId).toBe("user-real-123");
  });

  it("different userId → clearAll for privacy (real user switch)", async () => {
    mockSavedState = {
      _userId: "user-A",
      _v: 16,
      welcomeDone: true,
      firstIntent: "calma",
      history: [{ ts: 1, p: "test" }],
      totalSessions: 1,
    };
    await useStore.getState().init({ userId: "user-B" });
    expect(clearAllCalled).toBe(1);
    expect(useStore.getState().history).toHaveLength(0);
    expect(useStore.getState()._userId).toBe("user-B");
  });

  it("MASTER BUG P0-1: saved authenticated + init({}) ambiguous → preserve state + _userId", async () => {
    // Reproducer del master bug: AppV2Root.useEffect llama store.init?.()
    // sin opts mientras useAuthBridge aún no propaga session, O cuando
    // /api/auth/session da 429. El saved state tiene _userId real.
    // ANTES del fix: belongsToUser devolvía false → clearAll → state lost.
    // DESPUÉS: ambiguous case preserve.
    mockSavedState = {
      _userId: "user-real-123",
      _v: 16,
      welcomeDone: true,
      onboardingComplete: true,
      firstIntent: "calma",
      history: [{ ts: 1, p: "s1" }, { ts: 2, p: "s2" }, { ts: 3, p: "s3" }],
      totalSessions: 3,
    };
    await useStore.getState().init({});  // sin userId → opts.userId === undefined → null
    expect(clearAllCalled).toBe(0);
    expect(useStore.getState().welcomeDone).toBe(true);
    expect(useStore.getState().onboardingComplete).toBe(true);
    expect(useStore.getState().firstIntent).toBe("calma");
    expect(useStore.getState().history).toHaveLength(3);
    expect(useStore.getState().totalSessions).toBe(3);
    // _userId preservado (NO sobrescrito a null) — sync.js puede re-validar
    // identity en próximo pull cuando session esté disponible.
    expect(useStore.getState()._userId).toBe("user-real-123");
  });

  it("fresh user (no saved state): init OK con DS defaults", async () => {
    mockSavedState = null;
    await useStore.getState().init({});
    expect(clearAllCalled).toBe(0);
    expect(useStore.getState()._loaded).toBe(true);
    expect(useStore.getState()._userId).toBe(null);
    expect(useStore.getState().welcomeDone).toBe(false);
  });

  it("init() error doesn't crash, marks _loaded for UI to proceed", async () => {
    const storage = await import("../lib/storage");
    storage.loadState.mockRejectedValueOnce(new Error("IDB blocked"));
    await useStore.getState().init({});
    expect(useStore.getState()._loaded).toBe(true);
  });
});
