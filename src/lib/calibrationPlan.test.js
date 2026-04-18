import { describe, it, expect } from "vitest";
import { CALIBRATION_STEPS, calibrationState } from "./calibrationPlan";

describe("calibrationState", () => {
  it("0 sesiones: step 1 current, 0% y no completado", () => {
    const s = calibrationState(0);
    expect(s.currentStep).toBe(1);
    expect(s.completed).toBe(false);
    expect(s.percent).toBe(0);
    expect(s.steps[0].state).toBe("current");
    expect(s.steps[1].state).toBe("pending");
    expect(s.steps[2].state).toBe("pending");
  });

  it("1 sesión: step 1 done, step 2 current", () => {
    const s = calibrationState(1);
    expect(s.currentStep).toBe(2);
    expect(s.completed).toBe(false);
    expect(s.percent).toBe(33);
    expect(s.steps[0].state).toBe("done");
    expect(s.steps[1].state).toBe("current");
    expect(s.steps[2].state).toBe("pending");
  });

  it("2 sesiones: step 3 current", () => {
    const s = calibrationState(2);
    expect(s.steps[2].state).toBe("current");
    expect(s.completed).toBe(false);
    expect(s.percent).toBe(67);
  });

  it("3 sesiones: completado, 100% y todo done", () => {
    const s = calibrationState(3);
    expect(s.completed).toBe(true);
    expect(s.percent).toBe(100);
    expect(s.steps.every((x) => x.state === "done")).toBe(true);
  });

  it("4+ sesiones: satura, sigue completado", () => {
    const s = calibrationState(50);
    expect(s.completed).toBe(true);
    expect(s.percent).toBe(100);
  });

  it("negativos/NaN caen a 0 sesiones", () => {
    expect(calibrationState(-5).currentStep).toBe(1);
    expect(calibrationState(NaN).currentStep).toBe(1);
  });

  it("expone los steps canónicos", () => {
    expect(CALIBRATION_STEPS).toHaveLength(3);
    expect(CALIBRATION_STEPS.map((s) => s.intent)).toEqual(["calma", "enfoque", "energia"]);
  });
});
