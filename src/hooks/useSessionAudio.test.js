import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("../lib/audio", () => ({
  startAmbient: vi.fn(),
  stopAmbient: vi.fn(),
  startSoundscape: vi.fn(),
  stopSoundscape: vi.fn(),
  startBinaural: vi.fn(),
  stopBinaural: vi.fn(),
}));

import {
  startAmbient, stopAmbient,
  startSoundscape, stopSoundscape,
  startBinaural, stopBinaural,
} from "../lib/audio";
import { useSessionAudio } from "./useSessionAudio";

function clearAll() {
  [startAmbient, stopAmbient, startSoundscape, stopSoundscape, startBinaural, stopBinaural]
    .forEach((f) => f.mockClear());
}

describe("useSessionAudio", () => {
  beforeEach(() => { clearAll(); });

  it("en running con soundOn y soundscape=off arranca ambient + binaural", () => {
    renderHook(() => useSessionAudio({ timerStatus: "running", soundOn: true, soundscape: "off", intent: "calma" }));
    expect(startAmbient).toHaveBeenCalledTimes(1);
    expect(startSoundscape).not.toHaveBeenCalled();
    expect(startBinaural).toHaveBeenCalledWith("calma");
  });

  it("en running con soundscape=focus arranca soundscape en lugar de ambient", () => {
    renderHook(() => useSessionAudio({ timerStatus: "running", soundOn: true, soundscape: "focus", intent: "enfoque" }));
    expect(startSoundscape).toHaveBeenCalledWith("focus");
    expect(startAmbient).not.toHaveBeenCalled();
    expect(startBinaural).toHaveBeenCalledWith("enfoque");
  });

  it("con soundOn=false no arranca nada aunque esté running", () => {
    renderHook(() => useSessionAudio({ timerStatus: "running", soundOn: false, soundscape: "focus", intent: "calma" }));
    expect(startAmbient).not.toHaveBeenCalled();
    expect(startSoundscape).not.toHaveBeenCalled();
    expect(startBinaural).not.toHaveBeenCalled();
    expect(stopAmbient).toHaveBeenCalled();
  });

  it("al desmontar detiene todo", () => {
    const { unmount } = renderHook(() =>
      useSessionAudio({ timerStatus: "running", soundOn: true, soundscape: "off", intent: "calma" })
    );
    clearAll();
    unmount();
    expect(stopAmbient).toHaveBeenCalled();
    expect(stopSoundscape).toHaveBeenCalled();
    expect(stopBinaural).toHaveBeenCalled();
  });

  it("cambios de soundscape/soundOn/intent NO reinician el audio (solo ts dispara efecto)", () => {
    const { rerender } = renderHook(
      ({ ts, so, ss, i }) => useSessionAudio({ timerStatus: ts, soundOn: so, soundscape: ss, intent: i }),
      { initialProps: { ts: "running", so: true, ss: "off", i: "calma" } }
    );
    clearAll();
    rerender({ ts: "running", so: true, ss: "focus", i: "enfoque" });
    expect(startSoundscape).not.toHaveBeenCalled();
    expect(startAmbient).not.toHaveBeenCalled();
    expect(startBinaural).not.toHaveBeenCalled();
  });

  it("transición running→paused detiene audio", () => {
    const { rerender } = renderHook(
      ({ ts }) => useSessionAudio({ timerStatus: ts, soundOn: true, soundscape: "off", intent: "calma" }),
      { initialProps: { ts: "running" } }
    );
    clearAll();
    rerender({ ts: "paused" });
    expect(stopAmbient).toHaveBeenCalled();
    expect(stopSoundscape).toHaveBeenCalled();
    expect(stopBinaural).toHaveBeenCalled();
  });
});
