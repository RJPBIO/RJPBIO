/* NeuralCalibrationV2.test — Phase 6 quick-fix */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Stable component reference para evitar remount + state loss bajo proxy.
const MOTION_KEYS_FILTER = ["initial","animate","exit","transition","layout","layoutId","whileHover","whileTap","whileFocus","whileDrag","whileInView"];
function MotionPassthrough({ children, ...rest }) {
  const filtered = Object.fromEntries(
    Object.entries(rest).filter(([k]) => !MOTION_KEYS_FILTER.includes(k))
  );
  return <div {...filtered}>{children}</div>;
}
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: () => MotionPassthrough,
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import NeuralCalibrationV2 from "./NeuralCalibrationV2";

function answerAllPss4(values = [2, 2, 2, 2]) {
  values.forEach((v, idx) => {
    fireEvent.click(screen.getByTestId(`pss4-opt-${idx}-${v}`));
  });
}
function clickAdvance() {
  fireEvent.click(screen.getByTestId("calibration-cta"));
}

describe("NeuralCalibrationV2 — Step 1 PSS-4", () => {
  it("renderiza step 1 PSS-4 con counter '01 / 05'", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    expect(screen.getByTestId("calibration-step-counter").textContent).toMatch(/01 \/ 05/);
    expect(screen.getByText(/Estrés percibido/i)).toBeTruthy();
    expect(screen.getByText(/PSS-4/i)).toBeTruthy();
    expect(screen.getByText(/Cohen 1983/i)).toBeTruthy();
  });

  it("muestra 'Pregunta 1 de 4' inicialmente", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    expect(screen.getByTestId("pss4-counter").textContent).toMatch(/Pregunta 1 de 4/i);
  });

  it("PSS-4 tiene 5 opciones (Nunca → Muy frecuentemente)", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    expect(screen.getByTestId("pss4-opt-0-0")).toBeTruthy();
    expect(screen.getByTestId("pss4-opt-0-1")).toBeTruthy();
    expect(screen.getByTestId("pss4-opt-0-2")).toBeTruthy();
    expect(screen.getByTestId("pss4-opt-0-3")).toBeTruthy();
    expect(screen.getByTestId("pss4-opt-0-4")).toBeTruthy();
  });

  it("CTA disabled hasta responder 4 items", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    expect(screen.getByTestId("calibration-cta").disabled).toBe(true);
    fireEvent.click(screen.getByTestId("pss4-opt-0-2"));
    expect(screen.getByTestId("calibration-cta").disabled).toBe(true);
  });
});

describe("NeuralCalibrationV2 — flow completo + scoring", () => {
  function answerAllInstruments() {
    // PSS-4: 4 items, valores 2 cada uno → score directo + reversed
    [0, 1, 2, 3].forEach((idx) => {
      fireEvent.click(screen.getByTestId(`pss4-opt-${idx}-2`));
    });
    clickAdvance(); // → step rmeq
    // rMEQ 5 items
    [0, 1, 2, 3, 4].forEach((idx) => {
      const opts = screen.getAllByRole("radio");
      // pick first option of current item (es siempre el primero del radiogroup activo)
      fireEvent.click(opts[0]);
    });
    clickAdvance(); // → step maia2
    // MAIA-2 8 items
    for (let idx = 0; idx < 8; idx++) {
      fireEvent.click(screen.getByTestId(`maia2-opt-${idx}-3`));
    }
    clickAdvance(); // → hrv
    clickAdvance(); // → summary
  }

  it("flow completo dispara onComplete con baseline shape", () => {
    const onComplete = vi.fn();
    render(<NeuralCalibrationV2 onComplete={onComplete} />);
    answerAllInstruments();
    fireEvent.click(screen.getByTestId("calibration-cta"));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const baseline = onComplete.mock.calls[0][0];
    expect(baseline.pss4).toBeDefined();
    expect(baseline.rmeq).toBeDefined();
    expect(baseline.maia2).toBeDefined();
    expect(baseline.hrvBaseline).toBeNull();
    expect(baseline.recommendations).toBeDefined();
    expect(baseline.timestamp).toBeDefined();
    expect(baseline.version).toBe("v2");
  });

  it("PSS-4 reversed scoring: items 1 y 2 invierten value", () => {
    const onComplete = vi.fn();
    render(<NeuralCalibrationV2 onComplete={onComplete} />);
    // Item 0 (no reversed): seleccionar 0 → score 0
    fireEvent.click(screen.getByTestId("pss4-opt-0-0"));
    // Item 1 (reversed): seleccionar 0 → score 4-0=4
    fireEvent.click(screen.getByTestId("pss4-opt-1-0"));
    // Item 2 (reversed): seleccionar 0 → score 4
    fireEvent.click(screen.getByTestId("pss4-opt-2-0"));
    // Item 3 (no reversed): seleccionar 0 → score 0
    fireEvent.click(screen.getByTestId("pss4-opt-3-0"));
    clickAdvance();
    [0, 1, 2, 3, 4].forEach(() => {
      const opts = screen.getAllByRole("radio");
      fireEvent.click(opts[0]);
    });
    clickAdvance();
    for (let idx = 0; idx < 8; idx++) {
      fireEvent.click(screen.getByTestId(`maia2-opt-${idx}-3`));
    }
    clickAdvance(); // hrv
    clickAdvance(); // summary
    fireEvent.click(screen.getByTestId("calibration-cta"));
    const baseline = onComplete.mock.calls[0][0];
    // Total = 0 + 4 + 4 + 0 = 8 → moderate
    expect(baseline.pss4.score).toBe(8);
    expect(baseline.pss4.profile).toBe("moderate");
  });
});

describe("NeuralCalibrationV2 — instruments structure", () => {
  it("Step 2 rMEQ tiene title 'Cronotipo' y badge 'Adan & Almirall 1991'", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    [0, 1, 2, 3].forEach((idx) => fireEvent.click(screen.getByTestId(`pss4-opt-${idx}-2`)));
    clickAdvance();
    expect(screen.getByText(/Cronotipo/i)).toBeTruthy();
    expect(screen.getByText(/Adan & Almirall 1991/i)).toBeTruthy();
  });

  it("Step 3 MAIA-2 tiene title 'Conciencia interocéptiva' y badge 'Mehling 2018'", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    [0, 1, 2, 3].forEach((idx) => fireEvent.click(screen.getByTestId(`pss4-opt-${idx}-2`)));
    clickAdvance();
    [0, 1, 2, 3, 4].forEach(() => {
      fireEvent.click(screen.getAllByRole("radio")[0]);
    });
    clickAdvance();
    expect(screen.getByText(/Conciencia interocéptiva/i)).toBeTruthy();
    expect(screen.getByText(/Mehling 2018/i)).toBeTruthy();
  });

  it("Step 4 HRV es placeholder con copy honesto", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    [0, 1, 2, 3].forEach((idx) => fireEvent.click(screen.getByTestId(`pss4-opt-${idx}-2`)));
    clickAdvance();
    [0, 1, 2, 3, 4].forEach(() => fireEvent.click(screen.getAllByRole("radio")[0]));
    clickAdvance();
    for (let idx = 0; idx < 8; idx++) fireEvent.click(screen.getByTestId(`maia2-opt-${idx}-3`));
    clickAdvance();
    expect(screen.getByText(/Mediremos tu HRV cuando habilites/i)).toBeTruthy();
    expect(screen.getByTestId("hrv-enable-camera").disabled).toBe(true);
  });

  it("Step 5 summary muestra MAIA-2 bars + recommendation + intentLabel", () => {
    const onComplete = vi.fn();
    render(<NeuralCalibrationV2 onComplete={onComplete} />);
    [0, 1, 2, 3].forEach((idx) => fireEvent.click(screen.getByTestId(`pss4-opt-${idx}-2`)));
    clickAdvance();
    [0, 1, 2, 3, 4].forEach(() => fireEvent.click(screen.getAllByRole("radio")[0]));
    clickAdvance();
    for (let idx = 0; idx < 8; idx++) fireEvent.click(screen.getByTestId(`maia2-opt-${idx}-3`));
    clickAdvance();
    clickAdvance();
    expect(screen.getByTestId("maia2-bars")).toBeTruthy();
    expect(screen.getByText(/CALIBRACIÓN COMPLETA/i)).toBeTruthy();
    expect(screen.getByText(/Tu baseline neural/i)).toBeTruthy();
    expect(screen.getByText(/RECOMENDACIÓN/i)).toBeTruthy();
  });
});

describe("NeuralCalibrationV2 — navigation + a11y", () => {
  it("back button funciona desde step 2", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    [0, 1, 2, 3].forEach((idx) => fireEvent.click(screen.getByTestId(`pss4-opt-${idx}-2`)));
    clickAdvance();
    expect(screen.getByTestId("calibration-step-counter").textContent).toMatch(/02 \/ 05/);
    fireEvent.click(screen.getByTestId("calibration-back"));
    expect(screen.getByTestId("calibration-step-counter").textContent).toMatch(/01 \/ 05/);
  });

  it("skip-instrument avanza al siguiente sin requerir respuestas", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    fireEvent.click(screen.getByTestId("calibration-skip-instrument"));
    expect(screen.getByTestId("calibration-step-counter").textContent).toMatch(/02 \/ 05/);
  });

  it("skip-all en step 1 dispara onSkip", () => {
    const onSkip = vi.fn();
    render(<NeuralCalibrationV2 onComplete={() => {}} onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId("calibration-skip-all"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("dialog tiene role='dialog' aria-modal y aria-labelledby", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("bi-calibration-title");
  });

  it("progress dots reflejan step actual con aria-valuenow", () => {
    render(<NeuralCalibrationV2 onComplete={() => {}} />);
    const pb = screen.getByRole("progressbar");
    expect(pb.getAttribute("aria-valuemax")).toBe("5");
    expect(pb.getAttribute("aria-valuenow")).toBe("1");
  });
});

describe("NeuralCalibrationV2 — recommendation derivation", () => {
  it("PSS-4 high → primaryIntent='calma'", () => {
    const onComplete = vi.fn();
    render(<NeuralCalibrationV2 onComplete={onComplete} />);
    // Items no-reversed: 4 → score 4. Items reversed: 0 → score 4. Total = 16 (high)
    fireEvent.click(screen.getByTestId("pss4-opt-0-4"));
    fireEvent.click(screen.getByTestId("pss4-opt-1-0"));
    fireEvent.click(screen.getByTestId("pss4-opt-2-0"));
    fireEvent.click(screen.getByTestId("pss4-opt-3-4"));
    clickAdvance();
    [0, 1, 2, 3, 4].forEach(() => fireEvent.click(screen.getAllByRole("radio")[0]));
    clickAdvance();
    for (let idx = 0; idx < 8; idx++) fireEvent.click(screen.getByTestId(`maia2-opt-${idx}-3`));
    clickAdvance();
    clickAdvance();
    fireEvent.click(screen.getByTestId("calibration-cta"));
    const baseline = onComplete.mock.calls[0][0];
    expect(baseline.pss4.profile).toBe("high");
    expect(baseline.recommendations.primaryIntent).toBe("calma");
    expect(baseline.recommendations.difficulty).toBe(1);
  });
});
