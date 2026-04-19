import { describe, it, expect } from "vitest";
import { logResidual, calibration, calibrationByArm, calibratePrediction } from "./residuals";

describe("logResidual", () => {
  it("inicializa desde undefined", () => {
    const s = logResidual(undefined, { predicted: 1, actual: 1.5 });
    expect(s.history).toHaveLength(1);
    expect(s.history[0].residual).toBe(0.5);
  });
  it("ignora no-finitos sin romper", () => {
    const s = logResidual({ history: [] }, { predicted: NaN, actual: 1 });
    expect(s.history).toHaveLength(0);
  });
  it("recorta a 100 entradas", () => {
    let s = { history: [] };
    for (let i = 0; i < 150; i++) s = logResidual(s, { predicted: 0, actual: 1 });
    expect(s.history).toHaveLength(100);
  });
  it("no muta la entrada", () => {
    const s = { history: [{ predicted: 1, actual: 2, residual: 1, ts: 0 }] };
    logResidual(s, { predicted: 0, actual: 0 });
    expect(s.history).toHaveLength(1);
  });
});

describe("calibration", () => {
  it("no está listo con menos de 5 datos", () => {
    const s = { history: [{ predicted: 1, actual: 2, residual: 1 }] };
    const c = calibration(s);
    expect(c.ready).toBe(false);
  });
  it("calcula bias/MAE/RMSE con suficientes datos", () => {
    const hist = Array.from({ length: 10 }, (_, i) => ({
      predicted: 0, actual: 1, residual: 1,
    }));
    const c = calibration({ history: hist });
    expect(c.ready).toBe(true);
    expect(c.bias).toBe(1);
    expect(c.mae).toBe(1);
    expect(c.rmse).toBe(1);
  });
  it("detecta bias negativo (motor sobre-predice)", () => {
    const hist = Array.from({ length: 10 }, () => ({
      predicted: 2, actual: 1, residual: -1,
    }));
    const c = calibration({ history: hist });
    expect(c.bias).toBe(-1);
  });
});

describe("calibrationByArm", () => {
  it("agrupa por armId con n>=3", () => {
    const hist = [
      { predicted: 0, actual: 1, residual: 1, armId: "calma" },
      { predicted: 0, actual: 1, residual: 1, armId: "calma" },
      { predicted: 0, actual: 1, residual: 1, armId: "calma" },
      { predicted: 0, actual: 0, residual: 0, armId: "reset" },
      { predicted: 0, actual: 0, residual: 0, armId: "reset" },
    ];
    const by = calibrationByArm({ history: hist });
    expect(by.calma.bias).toBe(1);
    expect(by.reset).toBeUndefined(); // n<3
  });
});

describe("calibratePrediction", () => {
  const mkHist = (n, residual, armId = null) => ({
    history: Array.from({ length: n }, () => ({
      predicted: 0, actual: residual, residual, armId,
    })),
  });

  it("no ajusta si no hay datos suficientes", () => {
    const raw = { predictedDelta: 1 };
    const out = calibratePrediction({ history: [] }, raw);
    expect(out.calibrated).toBe(false);
    expect(out.predictedDelta).toBe(1);
  });
  it("ajusta por sesgo global cuando hay >=5 datos", () => {
    const raw = { predictedDelta: 1 };
    const out = calibratePrediction(mkHist(10, 0.5), raw);
    expect(out.calibrated).toBe(true);
    expect(out.predictedDelta).toBeCloseTo(1.5, 2);
    expect(out.calibrationSource).toBe("global");
  });
  it("prefiere sesgo por brazo cuando n>=5", () => {
    const hist = {
      history: [
        ...mkHist(10, 0.5).history,  // global bias +0.5
        ...mkHist(5, -0.8, "reset").history, // arm=reset bias -0.8
      ],
    };
    const out = calibratePrediction(hist, { predictedDelta: 1 }, { armId: "reset" });
    expect(out.calibrationSource).toBe("arm");
    expect(out.predictedDelta).toBeCloseTo(0.2, 2);
  });
  it("passthrough si la predicción no es válida", () => {
    expect(calibratePrediction(mkHist(10, 1), null)).toBeNull();
  });
});
