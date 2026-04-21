import { describe, it, expect, vi } from "vitest";
import { buildCommands } from "./commandPalette";

const noopActions = {
  switchTab: vi.fn(),
  go: vi.fn(),
  pause: vi.fn(),
  setTimerStatus: vi.fn(),
  startBinaural: vi.fn(),
  requestWakeLock: vi.fn(),
  playHaptic: vi.fn(),
  setState: vi.fn(),
  setCheckMood: vi.fn(),
  setPostStep: vi.fn(),
  openHistory: vi.fn(),
  openSettings: vi.fn(),
  openCalibration: vi.fn(),
  openHRV: vi.fn(),
  openSigh: vi.fn(),
  openNSDR: vi.fn(),
  selectProtocol: vi.fn(),
};

const baseProtocols = Array.from({ length: 20 }, (_, i) => ({
  id: `p${i}`,
  n: `Protocolo ${i}`,
  d: 120,
  int: ["calma", "enfoque", "energia", "reset"][i % 4],
}));

const baseState = {
  themeMode: "auto",
  soundOn: true,
  hapticOn: true,
  history: [],
};

function ctx(overrides = {}) {
  return {
    timerStatus: "idle",
    tab: "ignicion",
    state: baseState,
    protocol: baseProtocols[0],
    durationMultiplier: 1,
    protocols: baseProtocols,
    actions: noopActions,
    ...overrides,
  };
}

describe("buildCommands", () => {
  it("en idle incluye 'Iniciar sesión'", () => {
    const cmds = buildCommands(ctx({ timerStatus: "idle" }));
    expect(cmds.find((c) => c.id === "act-start")).toBeTruthy();
    expect(cmds.find((c) => c.id === "act-pause")).toBeFalsy();
    expect(cmds.find((c) => c.id === "act-resume")).toBeFalsy();
  });

  it("en running muestra 'Pausar' y no 'Iniciar'", () => {
    const cmds = buildCommands(ctx({ timerStatus: "running" }));
    expect(cmds.find((c) => c.id === "act-pause")).toBeTruthy();
    expect(cmds.find((c) => c.id === "act-start")).toBeFalsy();
  });

  it("en paused muestra 'Reanudar'", () => {
    const cmds = buildCommands(ctx({ timerStatus: "paused" }));
    expect(cmds.find((c) => c.id === "act-resume")).toBeTruthy();
  });

  it("siempre expone navegación a 3 tabs", () => {
    const cmds = buildCommands(ctx());
    const navIds = cmds.filter((c) => c.group === "Navegar").map((c) => c.id);
    expect(navIds).toEqual(["nav-ig", "nav-db", "nav-pf"]);
  });

  it("grupo Protocolos limita a 12 entradas", () => {
    const cmds = buildCommands(ctx());
    const protos = cmds.filter((c) => c.group === "Protocolos");
    expect(protos.length).toBe(12);
  });

  it("grupo Repetir recientes usa últimas 3 del historial en orden inverso", () => {
    const history = [
      { n: "Protocolo 0", date: "hace 3" },
      { n: "Protocolo 1", date: "hace 2" },
      { n: "Protocolo 2", date: "hace 1" },
    ];
    const cmds = buildCommands(
      ctx({ state: { ...baseState, history } })
    );
    const recents = cmds.filter((c) => c.group === "Repetir recientes");
    expect(recents.length).toBe(3);
    expect(recents[0].label).toBe("Protocolo 2");
    expect(recents[2].label).toBe("Protocolo 0");
  });

  it("filtra recientes cuyo protocolo ya no existe", () => {
    const history = [{ n: "Protocolo fantasma" }];
    const cmds = buildCommands(
      ctx({ state: { ...baseState, history } })
    );
    expect(cmds.filter((c) => c.group === "Repetir recientes").length).toBe(0);
  });

  it("toggle de sonido refleja estado actual", () => {
    const on = buildCommands(ctx({ state: { ...baseState, soundOn: true } }));
    const off = buildCommands(ctx({ state: { ...baseState, soundOn: false } }));
    expect(on.find((c) => c.id === "tog-sound").label).toMatch(/encendido/);
    expect(off.find((c) => c.id === "tog-sound").label).toMatch(/apagado/);
  });

  it("toggle de háptica refleja estado actual", () => {
    const off = buildCommands(ctx({ state: { ...baseState, hapticOn: false } }));
    expect(off.find((c) => c.id === "tog-haptic").label).toMatch(/apagada/);
  });

  it("label de tema refleja themeMode", () => {
    const auto = buildCommands(ctx({ state: { ...baseState, themeMode: "auto" } }));
    const dark = buildCommands(ctx({ state: { ...baseState, themeMode: "dark" } }));
    const light = buildCommands(ctx({ state: { ...baseState, themeMode: "light" } }));
    expect(auto.find((c) => c.id === "act-theme").label).toMatch(/autom/);
    expect(dark.find((c) => c.id === "act-theme").label).toMatch(/dim/);
    expect(light.find((c) => c.id === "act-theme").label).toMatch(/claro/);
  });

  it("'Iniciar sesión' enruta a ignicion cuando tab distinto", () => {
    const actions = { ...noopActions, switchTab: vi.fn(), go: vi.fn() };
    vi.useFakeTimers();
    const cmds = buildCommands(
      ctx({ timerStatus: "idle", tab: "dashboard", actions })
    );
    cmds.find((c) => c.id === "act-start").action();
    expect(actions.switchTab).toHaveBeenCalledWith("ignicion");
    vi.advanceTimersByTime(60);
    expect(actions.go).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("'Reanudar' dispara binaural y wake-lock cuando soundOn", () => {
    const actions = {
      ...noopActions,
      setTimerStatus: vi.fn(),
      startBinaural: vi.fn(),
      requestWakeLock: vi.fn(),
      playHaptic: vi.fn(),
    };
    const cmds = buildCommands(
      ctx({
        timerStatus: "paused",
        protocol: { ...baseProtocols[0], int: "calma" },
        actions,
      })
    );
    cmds.find((c) => c.id === "act-resume").action();
    expect(actions.setTimerStatus).toHaveBeenCalledWith("running");
    expect(actions.playHaptic).toHaveBeenCalledWith("go");
    expect(actions.startBinaural).toHaveBeenCalledWith("calma");
    expect(actions.requestWakeLock).toHaveBeenCalled();
  });

  it("'Reanudar' omite binaural si soundOn=false", () => {
    const actions = { ...noopActions, startBinaural: vi.fn() };
    const cmds = buildCommands(
      ctx({
        timerStatus: "paused",
        state: { ...baseState, soundOn: false },
        actions,
      })
    );
    cmds.find((c) => c.id === "act-resume").action();
    expect(actions.startBinaural).not.toHaveBeenCalled();
  });
});
