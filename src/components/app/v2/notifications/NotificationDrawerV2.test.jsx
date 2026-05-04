/* NotificationDrawerV2.test — Phase 6D SP4c. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationDrawerV2 from "./NotificationDrawerV2";

beforeEach(() => {
  Object.defineProperty(document, "cookie", { writable: true, value: "bio-csrf=test-token" });
  global.fetch = vi.fn();
});
afterEach(() => { vi.clearAllMocks(); });

describe("NotificationDrawerV2 — render gates", () => {
  it("retorna null cuando open=false", () => {
    const { container } = render(<NotificationDrawerV2 open={false} onClose={() => {}} />);
    expect(container.querySelector("[data-v2-notification-drawer]")).toBeNull();
  });

  it("renderiza chrome cuando open=true", () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], unreadCount: 0 }) });
    render(<NotificationDrawerV2 open onClose={() => {}} />);
    expect(screen.getByText("NOTIFICACIONES")).toBeTruthy();
    expect(screen.getByTestId("drawer-close")).toBeTruthy();
  });

  it("backdrop click cierra drawer", () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], unreadCount: 0 }) });
    const onClose = vi.fn();
    const { container } = render(<NotificationDrawerV2 open onClose={onClose} />);
    const backdrop = container.querySelector("[data-v2-notification-drawer]");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ESC cierra drawer", () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], unreadCount: 0 }) });
    const onClose = vi.fn();
    render(<NotificationDrawerV2 open onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("close button (X) cierra drawer", () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], unreadCount: 0 }) });
    const onClose = vi.fn();
    render(<NotificationDrawerV2 open onClose={onClose} />);
    fireEvent.click(screen.getByTestId("drawer-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("NotificationDrawerV2 — fetch + display", () => {
  it("muestra empty state cuando no hay notifications", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], unreadCount: 0 }) });
    render(<NotificationDrawerV2 open onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/Sin notificaciones/i)).toBeTruthy();
    });
    expect(screen.getByText(/Aquí aparecerán tus avisos/i)).toBeTruthy();
  });

  it("muestra título 'X sin leer' cuando hay unread", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: "n1", at: Date.now(), kind: "system", title: "Bienvenido", body: "", level: "info", href: null, readAt: null },
          { id: "n2", at: Date.now() - 60000, kind: "system", title: "Logro nuevo", body: "", level: "info", href: null, readAt: null },
        ],
        unreadCount: 2,
      }),
    });
    render(<NotificationDrawerV2 open onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("2 sin leer")).toBeTruthy();
    });
  });

  it("renderiza items con title + body + relative time", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: "n1", at: Date.now() - 5 * 60_000, kind: "system", title: "Mi notificación", body: "Detalles aquí", level: "info", href: null, readAt: null },
        ],
        unreadCount: 1,
      }),
    });
    render(<NotificationDrawerV2 open onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText("Mi notificación")).toBeTruthy();
      expect(screen.getByText("Detalles aquí")).toBeTruthy();
      expect(screen.getByText(/hace 5m/)).toBeTruthy();
    });
  });

  it("muestra mensaje de error en 401 (sin sesión)", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
    render(<NotificationDrawerV2 open onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/Sin sesión/)).toBeTruthy();
    });
  });

  it("notificación con href dispara onNavigate al click", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: "n1", at: Date.now(), kind: "system", title: "Click me", body: "", level: "info", href: "/app/profile/calibration", readAt: null },
        ],
        unreadCount: 1,
      }),
    });
    // Mock POST mark-read
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<NotificationDrawerV2 open onClose={onClose} onNavigate={onNavigate} />);
    const item = await waitFor(() => screen.getByTestId("notification-item-n1"));
    fireEvent.click(item);
    expect(onNavigate).toHaveBeenCalledWith({ target: "/app/profile/calibration" });
    expect(onClose).toHaveBeenCalled();
  });

  it("'Marcar todo como leído' button visible solo si unread > 0", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "n1", at: Date.now(), kind: "system", title: "x", body: "", level: "info", href: null, readAt: null }],
        unreadCount: 1,
      }),
    });
    render(<NotificationDrawerV2 open onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId("drawer-mark-all-read")).toBeTruthy();
    });
  });

  it("'Marcar todo' NO visible cuando unread = 0", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ id: "n1", at: Date.now(), kind: "system", title: "x", body: "", level: "info", href: null, readAt: Date.now() }],
        unreadCount: 0,
      }),
    });
    render(<NotificationDrawerV2 open onClose={() => {}} />);
    await waitFor(() => screen.getByText("Al día"));
    expect(screen.queryByTestId("drawer-mark-all-read")).toBeNull();
  });
});
