/* useStore.persist.test — Phase 6D SP6 Bug-37.
   Verifica que saveState (via scheduleSave/saveNow) NO persiste
   campos volátiles (_loaded, _syncing) ni funciones del store. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock storage.saveState antes de importar useStore.
let lastSaved = null;
vi.mock("../lib/storage", async () => {
  const real = await vi.importActual("../lib/storage");
  return {
    ...real,
    saveState: vi.fn(async (state) => { lastSaved = state; }),
    loadState: vi.fn(async () => null),
    clearAll: vi.fn(async () => {}),
    outboxAdd: vi.fn(async () => {}),
    getSyncChannel: () => null,
  };
});

import { useStore } from "./useStore";

beforeEach(() => {
  lastSaved = null;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useStore persist allowlist — Phase 6D SP6 Bug-37", () => {
  it("save() flush sin _loaded ni _syncing", async () => {
    useStore.setState({ _loaded: true, _syncing: false, vCores: 7 });
    useStore.getState().save();
    await vi.advanceTimersByTimeAsync(400);
    expect(lastSaved).not.toBeNull();
    expect(lastSaved._loaded).toBeUndefined();
    expect(lastSaved._syncing).toBeUndefined();
    expect(lastSaved.vCores).toBe(7);
  });

  it("saveNow() filtra _loaded + _syncing y persiste valores reales", async () => {
    useStore.setState({ _loaded: true, _syncing: true, totalSessions: 42 });
    await useStore.getState().saveNow();
    expect(lastSaved._loaded).toBeUndefined();
    expect(lastSaved._syncing).toBeUndefined();
    expect(lastSaved.totalSessions).toBe(42);
  });

  it("filtra funciones del store (no persiste init/save/etc)", async () => {
    useStore.setState({ vCores: 3 });
    useStore.getState().save();
    await vi.advanceTimersByTimeAsync(400);
    expect(typeof lastSaved.init).toBe("undefined");
    expect(typeof lastSaved.save).toBe("undefined");
    expect(typeof lastSaved.completeSession).toBe("undefined");
  });

  it("preserva _userId (necesario para belongsToUser)", async () => {
    useStore.setState({ _userId: "user-abc-123", vCores: 1 });
    useStore.getState().save();
    await vi.advanceTimersByTimeAsync(400);
    expect(lastSaved._userId).toBe("user-abc-123");
  });

  it("debounce: solo última escritura persiste si hay rapid-fire saves", async () => {
    useStore.setState({ vCores: 1 }); useStore.getState().save();
    useStore.setState({ vCores: 2 }); useStore.getState().save();
    useStore.setState({ vCores: 3 }); useStore.getState().save();
    await vi.advanceTimersByTimeAsync(400);
    expect(lastSaved.vCores).toBe(3);
  });
});
