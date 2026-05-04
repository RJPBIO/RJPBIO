/* StepUpInline.test — Phase 6D SP4b. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StepUpInline from "./StepUpInline";

beforeEach(() => {
  Object.defineProperty(document, "cookie", { writable: true, value: "bio-csrf=test-token" });
  global.fetch = vi.fn();
});
afterEach(() => { vi.clearAllMocks(); });

describe("StepUpInline — Phase 6D SP4b", () => {
  it("input acepta solo dígitos, máximo 6", () => {
    render(<StepUpInline />);
    const input = screen.getByTestId("stepup-code-input");
    fireEvent.change(input, { target: { value: "abc123def456789" } });
    expect(input.value).toBe("123456");
  });

  it("verify button disabled hasta 6 dígitos válidos", () => {
    render(<StepUpInline />);
    const btn = screen.getByTestId("stepup-verify");
    expect(btn.disabled).toBe(true);
    const input = screen.getByTestId("stepup-code-input");
    fireEvent.change(input, { target: { value: "123" } });
    expect(btn.disabled).toBe(true);
    fireEvent.change(input, { target: { value: "123456" } });
    expect(btn.disabled).toBe(false);
  });

  it("POST /api/auth/mfa/verify con CSRF header al click", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });
    const onSuccess = vi.fn();
    render(<StepUpInline onSuccess={onSuccess} />);
    fireEvent.change(screen.getByTestId("stepup-code-input"), { target: { value: "654321" } });
    fireEvent.click(screen.getByTestId("stepup-verify"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const call = global.fetch.mock.calls[0];
      expect(call[0]).toBe("/api/auth/mfa/verify");
      expect(call[1].method).toBe("POST");
      expect(call[1].headers.get("x-csrf-token")).toBe("test-token");
      const body = JSON.parse(call[1].body);
      expect(body.code).toBe("654321");
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("muestra error con remaining attempts en 401", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 401,
      json: async () => ({ error: "invalid", remaining: 3 }),
    });
    render(<StepUpInline />);
    fireEvent.change(screen.getByTestId("stepup-code-input"), { target: { value: "999999" } });
    fireEvent.click(screen.getByTestId("stepup-verify"));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/3 intentos/i);
    });
  });

  it("muestra mensaje 'bloqueado' en 429", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 429,
      json: async () => ({ error: "locked", retryAfter: 900 }),
    });
    render(<StepUpInline />);
    fireEvent.change(screen.getByTestId("stepup-code-input"), { target: { value: "999999" } });
    fireEvent.click(screen.getByTestId("stepup-verify"));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/bloqueada/i);
    });
  });

  it("NO llama onSuccess si verify falla", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 401, json: async () => ({ error: "invalid", remaining: 4 }),
    });
    const onSuccess = vi.fn();
    render(<StepUpInline onSuccess={onSuccess} />);
    fireEvent.change(screen.getByTestId("stepup-code-input"), { target: { value: "111111" } });
    fireEvent.click(screen.getByTestId("stepup-verify"));
    await waitFor(() => screen.getByRole("alert"));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
