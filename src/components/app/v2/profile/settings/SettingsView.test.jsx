/* SettingsView.test — Phase 6D SP6 wiring real al store. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SettingsView from "./SettingsView";
import { useStore } from "@/store/useStore";

const initialState = useStore.getState();

beforeEach(() => {
  useStore.setState({
    ...initialState,
    remindersEnabled: false,
    weeklySummaryEnabled: true,
    masterVolume: 1,
    musicBedOn: true,
    binauralOn: true,
    voiceOn: false,
    voiceRate: 0.83,
    hapticOn: true,
    reducedMotionOverride: "auto",
  }, true);
});

afterEach(() => { cleanup(); });

describe("SettingsView — Phase 6D SP6 wiring real", () => {
  it("renderiza chrome con todas las secciones", () => {
    render(<SettingsView onBack={() => {}} />);
    expect(screen.getByText("Ajustes")).toBeTruthy();
    expect(screen.getByText("NOTIFICACIONES")).toBeTruthy();
    expect(screen.getByText("AUDIO")).toBeTruthy();
    expect(screen.getByText("VOZ")).toBeTruthy();
    expect(screen.getByText("HAPTIC")).toBeTruthy();
    expect(screen.getByText("VISUAL")).toBeTruthy();
  });

  it("lee remindersEnabled del store al mount", () => {
    useStore.setState({ remindersEnabled: true });
    render(<SettingsView onBack={() => {}} />);
    const switchEl = screen.getByLabelText("Recordatorio diario");
    expect(switchEl.getAttribute("aria-checked")).toBe("true");
  });

  it("lee voiceOn del store al mount", () => {
    useStore.setState({ voiceOn: false });
    render(<SettingsView onBack={() => {}} />);
    const switchEl = screen.getByLabelText("Voz TTS");
    expect(switchEl.getAttribute("aria-checked")).toBe("false");
  });

  it("toggle remindersEnabled dispatch updateSettings", () => {
    render(<SettingsView onBack={() => {}} />);
    const switchEl = screen.getByLabelText("Recordatorio diario");
    expect(useStore.getState().remindersEnabled).toBe(false);
    fireEvent.click(switchEl);
    expect(useStore.getState().remindersEnabled).toBe(true);
  });

  it("toggle musicBedOn persiste al store", () => {
    render(<SettingsView onBack={() => {}} />);
    const switchEl = screen.getByLabelText("Música ambiental");
    expect(useStore.getState().musicBedOn).toBe(true);
    fireEvent.click(switchEl);
    expect(useStore.getState().musicBedOn).toBe(false);
  });

  it("toggle reducedMotionOverride mapea on/auto correctamente", () => {
    render(<SettingsView onBack={() => {}} />);
    const switchEl = screen.getByLabelText("Reducir movimiento");
    expect(useStore.getState().reducedMotionOverride).toBe("auto");
    fireEvent.click(switchEl);
    expect(useStore.getState().reducedMotionOverride).toBe("on");
    fireEvent.click(switchEl);
    expect(useStore.getState().reducedMotionOverride).toBe("auto");
  });

  it("NO usa fixture INITIAL_SETTINGS_LOCAL legacy (regresión SP3)", () => {
    // Setear todo a "off" en store. Si el componente leyera fixture, los
    // toggles aparecerían "on" del INITIAL_SETTINGS_LOCAL.
    useStore.setState({
      remindersEnabled: false,
      musicBedOn: false,
      binauralOn: false,
      voiceOn: false,
      hapticOn: false,
    });
    render(<SettingsView onBack={() => {}} />);
    expect(screen.getByLabelText("Recordatorio diario").getAttribute("aria-checked")).toBe("false");
    expect(screen.getByLabelText("Música ambiental").getAttribute("aria-checked")).toBe("false");
    expect(screen.getByLabelText("Beats binaurales").getAttribute("aria-checked")).toBe("false");
    expect(screen.getByLabelText("Voz TTS").getAttribute("aria-checked")).toBe("false");
  });
});
