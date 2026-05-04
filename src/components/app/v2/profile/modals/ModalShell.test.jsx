/* ModalShell.test — Phase 6D SP4a primitives. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModalShell, { ModalCta, ModalRow, ModalText, readCsrfToken } from "./ModalShell";

describe("ModalShell — Phase 6D SP4a chrome", () => {
  it("renderiza title + eyebrow + children", () => {
    render(
      <ModalShell title="Mi título" eyebrow="EYEBROW · TEST" testId="m">
        <p>contenido</p>
      </ModalShell>
    );
    expect(screen.getByText("Mi título")).toBeTruthy();
    expect(screen.getByText("EYEBROW · TEST")).toBeTruthy();
    expect(screen.getByText("contenido")).toBeTruthy();
  });

  it("backdrop click cierra el modal cuando onClose pasado", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ModalShell title="t" onClose={onClose} testId="m">
        <p>x</p>
      </ModalShell>
    );
    const backdrop = container.querySelector('[data-v2-modal-shell="m"]');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ESC dispara onClose", () => {
    const onClose = vi.fn();
    render(<ModalShell title="t" onClose={onClose}><p>x</p></ModalShell>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("eyebrowTone='danger' usa color danger (no cyan)", () => {
    const { container } = render(
      <ModalShell title="t" eyebrow="DANGER" eyebrowTone="danger">x</ModalShell>
    );
    const eyebrow = container.querySelector("div[style*='letter-spacing']");
    // Verifica que el color contiene rgb(220 (danger) en lugar de 34,211,238 (cyan)
    expect(eyebrow.style.color).toContain("220");
  });

  it("aria-modal y role dialog presentes", () => {
    render(<ModalShell title="t" testId="m">x</ModalShell>);
    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});

describe("ModalCta — variants", () => {
  it("disabled=true bloquea click", () => {
    const onClick = vi.fn();
    render(<ModalCta onClick={onClick} disabled testId="cta">Go</ModalCta>);
    fireEvent.click(screen.getByTestId("cta"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("variant='danger' usa color semantic danger", () => {
    const { container } = render(<ModalCta variant="danger" onClick={() => {}}>Borrar</ModalCta>);
    const btn = container.querySelector("button");
    expect(btn.style.background).toContain("220"); // rgb red
  });

  it("variant='outlined' usa transparent background + border", () => {
    const { container } = render(<ModalCta variant="outlined" onClick={() => {}}>Cancel</ModalCta>);
    const btn = container.querySelector("button");
    expect(btn.style.background).toBe("transparent");
    expect(btn.style.border).toContain("solid");
  });
});

describe("readCsrfToken (Phase 6D SP4a)", () => {
  beforeEach(() => {
    Object.defineProperty(document, "cookie", { writable: true, value: "" });
  });
  afterEach(() => {
    Object.defineProperty(document, "cookie", { writable: true, value: "" });
  });

  it("retorna '' cuando cookie bio-csrf no existe", () => {
    Object.defineProperty(document, "cookie", { writable: true, value: "other=foo" });
    expect(readCsrfToken()).toBe("");
  });

  it("extrae el token de la cookie bio-csrf", () => {
    Object.defineProperty(document, "cookie", { writable: true, value: "other=foo; bio-csrf=ABC123; another=x" });
    expect(readCsrfToken()).toBe("ABC123");
  });

  it("decodifica URI components en el token", () => {
    Object.defineProperty(document, "cookie", { writable: true, value: "bio-csrf=A%2BB%2FC" });
    expect(readCsrfToken()).toBe("A+B/C");
  });
});
