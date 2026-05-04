/* MfaSetupModal.test — Phase 6D SP4b. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MfaSetupModal from "./MfaSetupModal";

beforeEach(() => {
  Object.defineProperty(document, "cookie", { writable: true, value: "bio-csrf=test-token" });
  global.fetch = vi.fn();
});
afterEach(() => { vi.clearAllMocks(); });

describe("MfaSetupModal — step transitions", () => {
  it("step 1 (intro) renderiza eyebrow + CTA 'Empezar setup'", () => {
    render(<MfaSetupModal onClose={() => {}} />);
    expect(screen.getByText(/SEGURIDAD · MFA SETUP/)).toBeTruthy();
    expect(screen.getByText(/Activar autenticación de dos pasos/)).toBeTruthy();
    expect(screen.getByTestId("mfa-setup-start")).toBeTruthy();
  });

  it("Empezar dispara GET /api/auth/mfa/setup y avanza a step 2", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        otpauthURL: "otpauth://totp/...",
        qrDataURL: "data:image/png;base64,FAKE",
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: ["1111-2222", "3333-4444"],
      }),
    });
    render(<MfaSetupModal onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("mfa-setup-start"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/mfa/setup", expect.any(Object));
      expect(screen.getByTestId("mfa-qr-image")).toBeTruthy();
      expect(screen.getByTestId("mfa-secret-text").textContent).toBe("JBSWY3DPEHPK3PXP");
    });
  });

  it("error 409 si MFA ya activo", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 409 });
    render(<MfaSetupModal onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("mfa-setup-start"));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/MFA ya está activo/);
    });
  });

  it("step 2 → step 3: 'Ya lo escaneé' avanza a verify", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        qrDataURL: "data:image/png;base64,FAKE",
        secret: "ABC",
        backupCodes: ["1", "2"],
      }),
    });
    render(<MfaSetupModal onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("mfa-setup-start"));
    await waitFor(() => screen.getByTestId("mfa-setup-qr-continue"));
    fireEvent.click(screen.getByTestId("mfa-setup-qr-continue"));
    await waitFor(() => {
      expect(screen.getByTestId("mfa-setup-code-input")).toBeTruthy();
    });
  });

  it("step 3 verify input acepta solo 6 dígitos numéricos", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qrDataURL: "x", secret: "x", backupCodes: ["1"] }),
    });
    render(<MfaSetupModal onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("mfa-setup-start"));
    await waitFor(() => screen.getByTestId("mfa-setup-qr-continue"));
    fireEvent.click(screen.getByTestId("mfa-setup-qr-continue"));
    const input = await waitFor(() => screen.getByTestId("mfa-setup-code-input"));
    fireEvent.change(input, { target: { value: "abc123def456789" } });
    expect(input.value).toBe("123456");
    expect(screen.getByTestId("mfa-setup-verify-submit").disabled).toBe(false);
  });

  it("verify exitoso avanza a step 4 backup codes", async () => {
    // Step 1 → 2
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        qrDataURL: "x", secret: "x",
        backupCodes: ["BACKUP-01", "BACKUP-02", "BACKUP-03"],
      }),
    });
    // Step 3 verify
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ ok: true }),
    });
    render(<MfaSetupModal onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("mfa-setup-start"));
    await waitFor(() => screen.getByTestId("mfa-setup-qr-continue"));
    fireEvent.click(screen.getByTestId("mfa-setup-qr-continue"));
    const input = await waitFor(() => screen.getByTestId("mfa-setup-code-input"));
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByTestId("mfa-setup-verify-submit"));
    await waitFor(() => {
      expect(screen.getByTestId("mfa-setup-backup-list")).toBeTruthy();
      expect(screen.getByText("BACKUP-01")).toBeTruthy();
      expect(screen.getByText("BACKUP-03")).toBeTruthy();
    });
  });

  it("verify con código inválido muestra error", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ qrDataURL: "x", secret: "x", backupCodes: ["1"] }),
    });
    global.fetch.mockResolvedValueOnce({
      ok: false, status: 401, json: async () => ({ error: "invalid" }),
    });
    render(<MfaSetupModal onClose={() => {}} />);
    fireEvent.click(screen.getByTestId("mfa-setup-start"));
    await waitFor(() => screen.getByTestId("mfa-setup-qr-continue"));
    fireEvent.click(screen.getByTestId("mfa-setup-qr-continue"));
    const input = await waitFor(() => screen.getByTestId("mfa-setup-code-input"));
    fireEvent.change(input, { target: { value: "999999" } });
    fireEvent.click(screen.getByTestId("mfa-setup-verify-submit"));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/Código incorrecto/);
    });
  });

  it("step 4 'He guardado mis códigos' llama onComplete + onClose", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true, json: async () => ({ qrDataURL: "x", secret: "x", backupCodes: ["1"] }),
    });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    const onClose = vi.fn();
    const onComplete = vi.fn();
    render(<MfaSetupModal onClose={onClose} onComplete={onComplete} />);
    fireEvent.click(screen.getByTestId("mfa-setup-start"));
    await waitFor(() => screen.getByTestId("mfa-setup-qr-continue"));
    fireEvent.click(screen.getByTestId("mfa-setup-qr-continue"));
    const input = await waitFor(() => screen.getByTestId("mfa-setup-code-input"));
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.click(screen.getByTestId("mfa-setup-verify-submit"));
    const finishBtn = await waitFor(() => screen.getByTestId("mfa-setup-finish"));
    fireEvent.click(finishBtn);
    expect(onComplete).toHaveBeenCalledWith({ mfaEnabled: true });
    expect(onClose).toHaveBeenCalled();
  });
});
