/* EngineHealthView.test — Phase 6J-2 HIGH-3.
   Cubre que el view invoca evaluateEngineHealth(state) directo y
   surfaces todos los outputs (accuracy, acceptance, signals, fatigue,
   recalibration, actions). */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import EngineHealthView from "./EngineHealthView";
import { useStore } from "@/store/useStore";

beforeEach(() => {
  // Reset store estable para cada test.
  const st = useStore.getState();
  st.history?.length && useStore.setState({ history: [] });
  useStore.setState({
    history: [],
    moodLog: [],
    banditArms: {},
    predictionResiduals: { history: [] },
    totalSessions: 0,
  });
});

afterEach(() => cleanup());

describe("EngineHealthView — Phase 6J-2 HIGH-3 refactor", () => {
  it("totalSessions=0 → empty state visible (Sin datos)", () => {
    render(<EngineHealthView />);
    expect(document.body.textContent).toMatch(/Sin datos/);
    expect(document.body.textContent).toMatch(/empieza a aprender/);
  });

  it("totalSessions=10 → renderea hero overall + KPI grid", () => {
    useStore.setState({
      totalSessions: 10,
      history: Array.from({ length: 10 }, (_, i) => ({
        ts: Date.now() - i * 86400000, p: "test", c: 60, bioQ: 60,
      })),
      moodLog: Array.from({ length: 8 }, (_, i) => ({
        ts: Date.now() - i * 86400000, mood: 4, pre: 3, proto: "test",
      })),
    });
    render(<EngineHealthView />);
    // Hero overall verdict (puede ser healthy/operational/calibrating según data)
    expect(document.querySelector('[data-testid="engine-health-overall"]')).toBeTruthy();
    // KPI tiles
    expect(document.querySelector('[data-testid="engine-health-cohort"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="engine-health-accuracy"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="engine-health-acceptance"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="engine-health-fatigue"]')).toBeTruthy();
  });

  it("renderea 5 personalization signals", () => {
    useStore.setState({
      totalSessions: 5,
      history: Array.from({ length: 5 }, (_, i) => ({
        ts: Date.now() - i * 86400000, p: "test", c: 60, bioQ: 60,
      })),
      moodLog: Array.from({ length: 5 }, (_, i) => ({
        ts: Date.now() - i * 86400000, mood: 4, pre: 3, proto: "test",
      })),
    });
    render(<EngineHealthView />);
    expect(document.querySelector('[data-testid="engine-health-signals"]')).toBeTruthy();
    // Los 5 signals con sus testids
    expect(document.querySelector('[data-testid="engine-health-signal-sensitivity"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="engine-health-signal-peakWindow"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="engine-health-signal-weeklyDensity"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="engine-health-signal-residualCalibration"]')).toBeTruthy();
    expect(document.querySelector('[data-testid="engine-health-signal-bandit"]')).toBeTruthy();
  });

  it("personalization signal active → data-active='true'", () => {
    // Con 5 moodLog con pre, signal sensitivity = true
    useStore.setState({
      totalSessions: 5,
      history: Array.from({ length: 5 }, (_, i) => ({
        ts: Date.now() - i * 86400000, p: "test", c: 60, bioQ: 60,
      })),
      moodLog: Array.from({ length: 5 }, (_, i) => ({
        ts: Date.now() - i * 86400000, mood: 4, pre: 3, proto: "test",
      })),
    });
    render(<EngineHealthView />);
    const sensSignal = document.querySelector('[data-testid="engine-health-signal-sensitivity"]');
    expect(sensSignal.getAttribute("data-active")).toBe("true");
  });

  it("recalibrationNeeded=true (history old) → muestra recalibration banner inline", () => {
    // history con lastTs muy viejo (>30 días) trigger 'cooling'+ con recalibrate truthy
    const oldTs = Date.now() - 35 * 86400000;
    useStore.setState({
      totalSessions: 10,
      history: [{ ts: oldTs, p: "test", c: 60, bioQ: 60 }],
      moodLog: [],
    });
    render(<EngineHealthView />);
    expect(document.querySelector('[data-testid="engine-health-recalibration"]')).toBeTruthy();
  });

  it("actions[] poblada → renderea action rows", () => {
    // cold-start activa el action item "Cold start activo"
    useStore.setState({
      totalSessions: 2,
      history: Array.from({ length: 2 }, (_, i) => ({ ts: Date.now() - i * 86400000, p: "test", c: 60 })),
      moodLog: [],
    });
    render(<EngineHealthView />);
    const actions = document.querySelector('[data-testid="engine-health-actions"]');
    expect(actions).toBeTruthy();
    // Al menos 1 action rendered
    expect(actions.querySelectorAll('[data-testid^="engine-health-action-"]').length).toBeGreaterThan(0);
  });

  it("schemaVersion footer visible", () => {
    useStore.setState({
      totalSessions: 5,
      history: Array.from({ length: 5 }, (_, i) => ({ ts: Date.now() - i * 86400000, p: "test" })),
    });
    render(<EngineHealthView />);
    expect(document.body.textContent).toMatch(/Schema v1/);
  });

  it("fatigue.level='none' → KPI tile muestra 'Estable'", () => {
    useStore.setState({
      totalSessions: 5,
      history: Array.from({ length: 5 }, (_, i) => ({
        ts: Date.now() - i * 86400000, p: "test", c: 60, bioQ: 60, partial: false, pauses: 0,
      })),
    });
    render(<EngineHealthView />);
    const fatigueTile = document.querySelector('[data-testid="engine-health-fatigue"]');
    expect(fatigueTile.textContent).toMatch(/Estable/);
  });
});
