/* ProgramReEvalPrompt — Phase 6F SP-B
   Mocks InstrumentRunner para invocar onComplete manualmente y verificar
   POST + error handling + retry flow. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock dynamic InstrumentRunner — render trivial form que expone props
// como atributos data-* y un botón "fake-complete" que invoca onComplete.
let lastRunnerProps = null;
vi.mock("@/components/InstrumentRunner", () => ({
  default: function MockInstrumentRunner(props) {
    lastRunnerProps = props;
    return (
      <div data-testid="mock-runner">
        <button
          data-testid="mock-runner-complete"
          onClick={() =>
            props.onComplete?.({
              instrumentId: "pss-4",
              ts: Date.now(),
              score: 8,
              level: "moderate",
              answers: { q1: 2, q2: 1, q3: 2, q4: 3 },
            })
          }
        >
          Fake complete
        </button>
        <button data-testid="mock-runner-close" onClick={props.onClose}>
          Fake close
        </button>
      </div>
    );
  },
}));

// next/dynamic devuelve sync el componente cuando lo mockeamos así.
vi.mock("next/dynamic", () => ({
  default: (loader) => {
    let Comp = null;
    const mod = loader();
    if (mod && typeof mod.then === "function") {
      mod.then((m) => { Comp = m.default || m; });
    }
    return function Dyn(props) {
      // Al test, el componente real de mock-loader-default se resuelve sync.
      // Si Comp aún no se cargó, retornamos null (loading shim del propio Dyn).
      if (!Comp) {
        // Force-resolve (mock returns sync via mocked path)
        Comp = require("@/components/InstrumentRunner").default;
      }
      return Comp ? <Comp {...props} /> : null;
    };
  },
}));

import ProgramReEvalPrompt from "./ProgramReEvalPrompt";

const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn();
  document.cookie = "bio-csrf=test-token";
  lastRunnerProps = null;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const baseActive = {
  id: "pa_1",
  programId: "burnout-recovery",
  reEvalAt: new Date().toISOString(),
  reEvalCompletedAt: null,
};

describe("ProgramReEvalPrompt — Phase 6F SP-B", () => {
  it("retorna null cuando activeProgram null", () => {
    const { container } = render(<ProgramReEvalPrompt activeProgram={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("retorna null cuando activeProgram sin programId", () => {
    const { container } = render(<ProgramReEvalPrompt activeProgram={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza InstrumentRunner cuando activeProgram válido", () => {
    render(<ProgramReEvalPrompt activeProgram={baseActive} />);
    expect(screen.getByTestId("mock-runner")).toBeInTheDocument();
  });

  it("POST a /api/v1/me/program/reEval con payload correcto al complete", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ ok: true }),
    });
    const onComplete = vi.fn();
    const onClose = vi.fn();
    render(
      <ProgramReEvalPrompt
        activeProgram={baseActive}
        onComplete={onComplete}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId("mock-runner-complete"));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("/api/v1/me/program/reEval");
    expect(init.method).toBe("POST");
    expect(init.headers.get("x-csrf-token")).toBe("test-token");
    expect(init.headers.get("content-type")).toBe("application/json");
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      instrumentId: "pss-4",
      score: 8,
      level: "moderate",
      answers: { q1: 2, q2: 1, q3: 2, q4: 3 },
    });
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("muestra error 'ya no está disponible' si server retorna no_reeval_due", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false, status: 400,
      json: async () => ({ error: "no_reeval_due" }),
    });
    render(<ProgramReEvalPrompt activeProgram={baseActive} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId("mock-runner-complete"));
    await waitFor(() => {
      expect(screen.getByText(/ya no está disponible/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/ERROR AL GUARDAR/i)).toBeInTheDocument();
  });

  it("muestra error 'ya completaste' si server retorna reeval_already_completed", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false, status: 400,
      json: async () => ({ error: "reeval_already_completed" }),
    });
    render(<ProgramReEvalPrompt activeProgram={baseActive} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId("mock-runner-complete"));
    await waitFor(() => {
      expect(screen.getByText(/Ya completaste/i)).toBeInTheDocument();
    });
  });

  it("muestra mensaje de sesión expirada en 401", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false, status: 401,
      json: async () => ({ error: "unauthorized" }),
    });
    render(<ProgramReEvalPrompt activeProgram={baseActive} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId("mock-runner-complete"));
    await waitFor(() => {
      expect(screen.getByText(/sesión expiró/i)).toBeInTheDocument();
    });
  });

  it("retry button limpia error sin cerrar modal", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false, status: 500,
      json: async () => ({}),
    });
    const onClose = vi.fn();
    render(<ProgramReEvalPrompt activeProgram={baseActive} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("mock-runner-complete"));
    await waitFor(() => {
      expect(screen.getByTestId("reeval-retry")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("reeval-retry"));
    await waitFor(() => {
      expect(screen.queryByText(/ERROR AL GUARDAR/i)).toBeNull();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("dismiss button cierra modal después de error", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false, status: 500,
      json: async () => ({}),
    });
    const onClose = vi.fn();
    render(<ProgramReEvalPrompt activeProgram={baseActive} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("mock-runner-complete"));
    await waitFor(() => expect(screen.getByTestId("reeval-dismiss")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("reeval-dismiss"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("close del runner antes de submit invoca onClose", () => {
    const onClose = vi.fn();
    render(<ProgramReEvalPrompt activeProgram={baseActive} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("mock-runner-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("network error genera error genérico", async () => {
    globalThis.fetch.mockRejectedValueOnce(new TypeError("Network down"));
    render(<ProgramReEvalPrompt activeProgram={baseActive} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId("mock-runner-complete"));
    await waitFor(() => {
      expect(screen.getByText(/Network down|No pudimos guardar/i)).toBeInTheDocument();
    });
  });
});
