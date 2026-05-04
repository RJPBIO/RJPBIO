/* ═══════════════════════════════════════════════════════════════
   InstrumentsView.test — Phase 6B SP1
   Verifica lectura de store.instruments con filtrado por instrumentId
   y CTAs que disparan los actions correctos hacia onNavigate.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import InstrumentsView from "./InstrumentsView";
import { useStore } from "@/store/useStore";

function resetStore(patch = {}) {
  useStore.setState({ instruments: [], ...patch });
}

describe("InstrumentsView — Phase 6B SP1 store wiring", () => {
  beforeEach(() => {
    resetStore();
  });

  it("muestra empty state para los 3 instrumentos cuando no hay mediciones", () => {
    render(<InstrumentsView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/sin mediciones PSS-4/i)).toBeTruthy();
    expect(screen.getByText(/sin mediciones SWEMWBS-7/i)).toBeTruthy();
    expect(screen.getByText(/sin mediciones PHQ-2/i)).toBeTruthy();
    const btns = screen.getAllByRole("button", { name: /tomar test/i });
    expect(btns.length).toBe(3);
  });

  it("muestra última medición PSS-4 cuando existe en store", () => {
    const now = Date.now();
    resetStore({
      instruments: [
        { instrumentId: "pss-4", ts: now - 7 * 86400000, score: 4, level: "low" },
        { instrumentId: "pss-4", ts: now - 1 * 86400000, score: 11, level: "high" },
      ],
    });
    render(<InstrumentsView onBack={() => {}} onNavigate={() => {}} />);
    // Última (más reciente) es score 11 / level high
    expect(screen.getByText(/Score 11\/16/i)).toBeTruthy();
    expect(screen.getByText(/Estrés alto/i)).toBeTruthy();
  });

  it("filtra por instrumentId — entradas de SWEMWBS no aparecen en card PSS-4", () => {
    const now = Date.now();
    resetStore({
      instruments: [
        { instrumentId: "wemwbs-7", ts: now, score: 28, level: "high" },
      ],
    });
    render(<InstrumentsView onBack={() => {}} onNavigate={() => {}} />);
    // PSS-4 sigue empty
    expect(screen.getByText(/sin mediciones PSS-4/i)).toBeTruthy();
    // SWEMWBS-7 aparece con score
    expect(screen.getByText(/Score 28\/35/i)).toBeTruthy();
    expect(screen.getByText(/Bienestar alto/i)).toBeTruthy();
  });

  it("CTA PSS-4 dispara onNavigate con action 'retake-pss4'", () => {
    const onNav = vi.fn();
    resetStore({
      instruments: [{ instrumentId: "pss-4", ts: Date.now(), score: 5, level: "low" }],
    });
    render(<InstrumentsView onBack={() => {}} onNavigate={onNav} />);
    act(() => { screen.getByRole("button", { name: /tomar de nuevo/i }).click(); });
    expect(onNav).toHaveBeenCalledWith({ action: "retake-pss4" });
  });

  it("CTAs disparan los 3 actions correctos para empty state", () => {
    const onNav = vi.fn();
    render(<InstrumentsView onBack={() => {}} onNavigate={onNav} />);
    const btns = screen.getAllByRole("button", { name: /tomar test/i });
    act(() => { btns[0].click(); });
    act(() => { btns[1].click(); });
    act(() => { btns[2].click(); });
    expect(onNav).toHaveBeenCalledWith({ action: "retake-pss4" });
    expect(onNav).toHaveBeenCalledWith({ action: "retake-swemwbs" });
    expect(onNav).toHaveBeenCalledWith({ action: "retake-phq2" });
    expect(onNav).toHaveBeenCalledTimes(3);
  });

  it("PHQ-2 muestra label 'Screening positivo' cuando level=positive", () => {
    resetStore({
      instruments: [
        { instrumentId: "phq-2", ts: Date.now(), score: 4, level: "positive" },
      ],
    });
    render(<InstrumentsView onBack={() => {}} onNavigate={() => {}} />);
    expect(screen.getByText(/Score 4\/6/i)).toBeTruthy();
    expect(screen.getByText(/Screening positivo/i)).toBeTruthy();
  });
});
