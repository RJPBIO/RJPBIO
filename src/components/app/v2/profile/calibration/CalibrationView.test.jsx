/* ═══════════════════════════════════════════════════════════════
   CalibrationView.test — Phase 6B SP1
   Verifica lectura de store real (hrvLog + neuralBaseline + resonanceFreq)
   y comportamiento de empty states + CTA dispatchers.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import CalibrationView from "./CalibrationView";
import { useStore } from "@/store/useStore";

function resetStore(patch = {}) {
  // Reset campos relevantes a estado conocido. No tocamos otros para evitar
  // fugas a otros tests si zustand persiste fuera de scope.
  useStore.setState({
    hrvLog: [],
    neuralBaseline: null,
    resonanceFreq: null,
    calibrationHistory: [],
    ...patch,
  });
}

describe("CalibrationView — Phase 6B SP1 store wiring", () => {
  beforeEach(() => {
    resetStore();
  });

  it("muestra empty state HRV cuando hrvLog está vacío", () => {
    render(<CalibrationView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/sin mediciones HRV todavía/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /^nueva medición$/i })).toBeTruthy();
  });

  it("muestra última medición HRV con baseline cuando hay ≥5 mediciones confiables", () => {
    const now = Date.now();
    const hrvLog = Array.from({ length: 6 }, (_, i) => ({
      ts: now - i * 86400000,
      rmssd: 40 + i,
      lnRmssd: Math.log(40 + i),
      sdnn: 35 + i,
      pnn50: 10,
      meanHR: 60,
      n: 35,
      durationSec: 60,
      source: "ble",
    }));
    resetStore({ hrvLog });
    render(<CalibrationView onBack={() => {}} onNavigate={() => {}} />);
    // Última (i=0) es rmssd 40 → "RMSSD 40ms"
    expect(screen.getByText(/RMSSD 40ms/i)).toBeTruthy();
    expect(screen.getByText(/n=6/i)).toBeTruthy();
    expect(screen.getByText(/baseline/i)).toBeTruthy();
  });

  it("filtra entradas no-reliable de cámara con SQI bajo", () => {
    const now = Date.now();
    const hrvLog = [
      // Cámara con SQI bajo: no debe aparecer como última
      { ts: now, rmssd: 99, lnRmssd: Math.log(99), source: "camera", sqi: 30 },
      // BLE legacy reliable (sin source o BLE): debe ganar
      { ts: now - 86400000, rmssd: 50, lnRmssd: Math.log(50), source: "ble" },
    ];
    resetStore({ hrvLog });
    render(<CalibrationView onBack={() => {}} onNavigate={() => {}} />);
    // 99 es la cámara mala — NO debe aparecer
    expect(screen.queryByText(/RMSSD 99ms/i)).toBeNull();
    // 50 es la BLE válida
    expect(screen.getByText(/RMSSD 50ms/i)).toBeTruthy();
  });

  it("CTA HRV dispara onNavigate con action 'new-hrv' (data path)", () => {
    const onNav = vi.fn();
    const now = Date.now();
    resetStore({ hrvLog: [{ ts: now, rmssd: 40, lnRmssd: Math.log(40), source: "ble" }] });
    render(<CalibrationView onBack={() => {}} onNavigate={onNav} />);
    act(() => { screen.getByRole("button", { name: /^nueva medición$/i }).click(); });
    expect(onNav).toHaveBeenCalledWith({ action: "new-hrv" });
  });

  it("CTA HRV dispara onNavigate con action 'new-hrv' (empty path)", () => {
    const onNav = vi.fn();
    render(<CalibrationView onBack={() => {}} onNavigate={onNav} />);
    act(() => { screen.getByRole("button", { name: /^nueva medición$/i }).click(); });
    expect(onNav).toHaveBeenCalledWith({ action: "new-hrv" });
  });

  it("muestra cronotipo cuando neuralBaseline.rmeq existe", () => {
    resetStore({
      neuralBaseline: {
        rmeq: { score: 19, chronotype: "moderately_morning", bestTimeWindow: "morning" },
        timestamp: Date.now() - 86400000,
      },
    });
    render(<CalibrationView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/Más matutino/i)).toBeTruthy();
    expect(screen.getByText(/score 19/i)).toBeTruthy();
  });

  it("muestra empty cronotipo cuando neuralBaseline ausente", () => {
    render(<CalibrationView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/sin calibración de cronotipo/i)).toBeTruthy();
  });

  it("muestra resonancia cuando resonanceFreq > 0", () => {
    resetStore({ resonanceFreq: 5.5 });
    render(<CalibrationView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/5\.5 rpm óptima/i)).toBeTruthy();
  });
});
