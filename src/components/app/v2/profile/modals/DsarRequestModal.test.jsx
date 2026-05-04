/* DsarRequestModal.test — Phase 6D SP4a. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DsarRequestModal from "./DsarRequestModal";

beforeEach(() => {
  // Setup CSRF cookie + fetch mock
  Object.defineProperty(document, "cookie", { writable: true, value: "bio-csrf=test-token" });
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("DsarRequestModal — Phase 6D SP4a por type", () => {
  it("type='access' renderiza GDPR Art. 15 + CTA 'Solicitar acceso'", () => {
    render(<DsarRequestModal type="access" onClose={() => {}} />);
    expect(screen.getByText(/GDPR ART\. 15/i)).toBeTruthy();
    expect(screen.getByText(/Solicitar acceso a tus datos/)).toBeTruthy();
    expect(screen.getByTestId("dsar-submit").textContent).toMatch(/Solicitar acceso/i);
  });

  it("type='portability' renderiza GDPR Art. 20", () => {
    render(<DsarRequestModal type="portability" onClose={() => {}} />);
    expect(screen.getByText(/GDPR ART\. 20/i)).toBeTruthy();
    expect(screen.getByText(/portabilidad de datos/i)).toBeTruthy();
  });

  it("type='erasure' renderiza GDPR Art. 17 + checkbox confirm requerido", () => {
    render(<DsarRequestModal type="erasure" onClose={() => {}} />);
    expect(screen.getByText(/GDPR ART\. 17/i)).toBeTruthy();
    expect(screen.getByTestId("dsar-erasure-confirm")).toBeTruthy();
    // Submit disabled hasta que checkbox esté checked
    expect(screen.getByTestId("dsar-submit").disabled).toBe(true);
  });

  it("type='erasure' habilita submit tras checkbox check", () => {
    render(<DsarRequestModal type="erasure" onClose={() => {}} />);
    const checkbox = screen.getByTestId("dsar-erasure-confirm");
    fireEvent.click(checkbox);
    expect(screen.getByTestId("dsar-submit").disabled).toBe(false);
  });

  it("type='erasure' usa variant danger en CTA", () => {
    const { container } = render(<DsarRequestModal type="erasure" onClose={() => {}} />);
    const submit = screen.getByTestId("dsar-submit");
    // background style contiene 220 (rgb red — semantic.danger #DC2626) cuando enabled
    fireEvent.click(screen.getByTestId("dsar-erasure-confirm"));
    expect(submit.style.background).toContain("220");
  });
});

describe("DsarRequestModal — submit flow", () => {
  it("POST /api/v1/me/dsar con kind ACCESS al submit", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ ok: true, request: { id: "r1", kind: "ACCESS" } }),
    });
    render(<DsarRequestModal type="access" onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("dsar-submit"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/me/dsar",
        expect.objectContaining({ method: "POST" })
      );
    });
    const call = global.fetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.kind).toBe("ACCESS");
  });

  it("incluye CSRF header x-csrf-token", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 201, json: async () => ({ ok: true, request: { id: "r1" } }),
    });
    render(<DsarRequestModal type="portability" onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("dsar-submit"));
    await waitFor(() => {
      const call = global.fetch.mock.calls[0];
      const headers = call[1].headers;
      // headers es Headers instance — get() es la API estándar
      expect(headers.get("x-csrf-token")).toBe("test-token");
    });
  });

  it("muestra success state tras 201", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 201,
      json: async () => ({ ok: true, request: { id: "r1", kind: "PORTABILITY" } }),
    });
    render(<DsarRequestModal type="portability" onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("dsar-submit"));
    await waitFor(() => {
      expect(screen.getByText(/Solicitud creada/i)).toBeTruthy();
    });
    expect(screen.getByTestId("dsar-success-close")).toBeTruthy();
  });

  it("muestra error en 401", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 401, json: async () => ({ error: "unauthorized" }),
    });
    render(<DsarRequestModal type="access" onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("dsar-submit"));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/Sesión expirada/i);
    });
  });

  it("muestra error en 422 invalid", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 422,
      json: async () => ({ error: "invalid_request", message: "Bad input" }),
    });
    render(<DsarRequestModal type="access" onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("dsar-submit"));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
  });

  it("onComplete + onClose se llaman al cerrar success", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, status: 201,
      json: async () => ({ ok: true, request: { id: "r1" } }),
    });
    const onClose = vi.fn();
    const onComplete = vi.fn();
    render(<DsarRequestModal type="access" onClose={onClose} onComplete={onComplete} />);
    fireEvent.click(screen.getByTestId("dsar-submit"));
    await waitFor(() => screen.getByTestId("dsar-success-close"));
    fireEvent.click(screen.getByTestId("dsar-success-close"));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
