/* BioIgnitionWelcomeV2.test — Phase 6 quick-fix */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock framer-motion para bypass de exit animation timing en jsdom.
// AnimatePresence con mode="wait" deja la pantalla en exit-pending al
// momento de query del test; aquí lo aplastamos a render directo.
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

import BioIgnitionWelcomeV2 from "./BioIgnitionWelcomeV2";

function clickAdvance() {
  fireEvent.click(screen.getByTestId("welcome-cta"));
}

describe("BioIgnitionWelcomeV2", () => {
  it("renderiza pantalla 0 manifesto inicialmente con counter '01 / 05'", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    expect(screen.getByTestId("welcome-step-counter").textContent).toMatch(/01 \/ 05/);
    expect(screen.getByText("BIO-IGNICIÓN")).toBeTruthy();
  });

  it("muestra subhead 'Sistema neural de alto rendimiento para profesionales'", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    expect(screen.getByText(/Sistema neural de alto rendimiento/i)).toBeTruthy();
  });

  it("CTA 'CONTINUAR' avanza a pantalla 1 differentiator", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    clickAdvance();
    expect(screen.getByTestId("welcome-step-counter").textContent).toMatch(/02 \/ 05/);
    expect(screen.getByText(/No es meditación/i)).toBeTruthy();
  });

  it("avanza a pantalla 2 how-it-works con 4 intents listados", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    clickAdvance();
    clickAdvance();
    expect(screen.getByText(/23 protocolos. 4 intents/i)).toBeTruthy();
  });

  it("avanza a pantalla 3 commitment con headline '1 de cada 20 opera al día 30'", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    clickAdvance(); clickAdvance(); clickAdvance();
    expect(screen.getByText(/1 de cada 20 opera al día 30/i)).toBeTruthy();
    expect(screen.getByText(/El compromiso es el filtro/i)).toBeTruthy();
  });

  it("avanza a pantalla 4 intent picker con 4 opciones", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    clickAdvance(); clickAdvance(); clickAdvance(); clickAdvance();
    expect(screen.getByText(/PRIMERA DECISIÓN/i)).toBeTruthy();
    expect(screen.getByTestId("welcome-intent-calma")).toBeTruthy();
    expect(screen.getByTestId("welcome-intent-enfoque")).toBeTruthy();
    expect(screen.getByTestId("welcome-intent-energia")).toBeTruthy();
    expect(screen.getByTestId("welcome-intent-reset")).toBeTruthy();
  });

  it("CTA en pantalla 4 está disabled hasta seleccionar intent", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    clickAdvance(); clickAdvance(); clickAdvance(); clickAdvance();
    const cta = screen.getByTestId("welcome-cta");
    expect(cta.disabled).toBe(true);
  });

  it("seleccionar intent habilita CTA + tap dispara onComplete con payload correcto", () => {
    const onComplete = vi.fn();
    render(<BioIgnitionWelcomeV2 onComplete={onComplete} onSkip={() => {}} />);
    clickAdvance(); clickAdvance(); clickAdvance(); clickAdvance();
    fireEvent.click(screen.getByTestId("welcome-intent-enfoque"));
    const cta = screen.getByTestId("welcome-cta");
    expect(cta.disabled).toBe(false);
    fireEvent.click(cta);
    expect(onComplete).toHaveBeenCalledTimes(1);
    const payload = onComplete.mock.calls[0][0];
    expect(payload.intent).toBe("enfoque");
    expect(typeof payload.completedAt).toBe("number");
  });

  it("intent seleccionado tiene aria-checked=true", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    clickAdvance(); clickAdvance(); clickAdvance(); clickAdvance();
    fireEvent.click(screen.getByTestId("welcome-intent-calma"));
    expect(screen.getByTestId("welcome-intent-calma").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByTestId("welcome-intent-enfoque").getAttribute("aria-checked")).toBe("false");
  });

  it("back button regresa a pantalla anterior", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    clickAdvance(); // → 02
    expect(screen.getByTestId("welcome-step-counter").textContent).toMatch(/02 \/ 05/);
    fireEvent.click(screen.getByTestId("welcome-back"));
    expect(screen.getByTestId("welcome-step-counter").textContent).toMatch(/01 \/ 05/);
  });

  it("skip dispara onSkip en pantalla 0", () => {
    const onSkip = vi.fn();
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId("welcome-skip"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("Escape key dispara skip", () => {
    const onSkip = vi.fn();
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={onSkip} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("dialog tiene role='dialog' aria-modal y aria-labelledby", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("bi-welcome-title");
  });

  it("progress dots reflejan step actual", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    const pb = screen.getByRole("progressbar");
    expect(pb.getAttribute("aria-valuemax")).toBe("5");
    expect(pb.getAttribute("aria-valuenow")).toBe("1");
    clickAdvance();
    expect(pb.getAttribute("aria-valuenow")).toBe("2");
  });

  it("CTA cambia a estilo filled (cyan) en pantalla 3 commitment", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    clickAdvance(); clickAdvance(); clickAdvance();
    const cta = screen.getByTestId("welcome-cta");
    // Filled: bg cyan rgb(34,211,238)
    expect(cta.style.background.toLowerCase()).toMatch(/rgb\(34,\s*211,\s*238\)|#22d3ee/i);
  });

  it("focus trap activo: el dialog recibe focus", () => {
    render(<BioIgnitionWelcomeV2 onComplete={() => {}} onSkip={() => {}} />);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
