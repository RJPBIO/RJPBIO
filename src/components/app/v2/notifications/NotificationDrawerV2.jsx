"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { csrfFetch } from "../profile/modals/ModalShell";
import { colors, typography, spacing, radii } from "../tokens";

// Phase 6D SP4c — NotificationDrawerV2: drawer right-side para
// notificaciones del user. Wired al endpoint REAL /api/notifications/recent
// (existente, Sprint 25 — Notification model per-user con readAt). Si una
// notificación tiene `href`, tap dispara navigation. Mark-all-read POST
// /api/v1/me/notifications/read-all (existente).
//
// Reemplaza el stub `onBellClick = () => console.log("bell click")`
// (Bug-10). El drawer se mounta vía AppV2Root state lifted.
//
// Diferencia con `src/components/ui/NotificationsBell.jsx` legacy:
//   - DrawerV2 usa ADN v2 + tokens v2 (dark, phosphorCyan, mono accents)
//   - Mounted desde shell V2 (AppV2Root), no global chrome
//   - Sin localStorage cache (read directo del server)

export default function NotificationDrawerV2({ open, onClose, onNavigate }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);

  // Fetch al abrir — refresca cada vez para que el user vea estado actual.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/notifications/recent", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setError(res.status === 401 ? "unauth" : "fail");
          return;
        }
        const j = await res.json();
        if (cancelled) return;
        setItems(Array.isArray(j?.items) ? j.items : []);
        setUnread(j?.unreadCount || 0);
      } catch {
        if (!cancelled) setError("network");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // ESC cierra
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleMarkAllRead = async () => {
    if (unread === 0 || marking) return;
    setMarking(true);
    try {
      await csrfFetch("/api/v1/me/notifications/read-all", { method: "POST" });
      // Optimista: marca todos como readAt:now en local.
      setItems((prev) => prev.map((n) => n.readAt ? n : { ...n, readAt: Date.now() }));
      setUnread(0);
    } catch {
      // No mostrar error catastrófico — el user puede reintentar al re-abrir.
    } finally {
      setMarking(false);
    }
  };

  const handleItemClick = (item) => {
    // Mark single as read (best-effort)
    if (!item.readAt) {
      csrfFetch(`/api/v1/me/notifications/${encodeURIComponent(item.id)}/read`, { method: "POST" })
        .catch(() => {});
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, readAt: Date.now() } : n));
      setUnread((u) => Math.max(0, u - 1));
    }
    if (item.href) {
      onNavigate?.({ target: item.href });
      onClose?.();
    }
  };

  if (!open) return null;

  return (
    <div
      data-v2-notification-drawer
      role="dialog"
      aria-modal="true"
      aria-label="Notificaciones"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 110,
        // Phase 6D SP4b — Bug-28 excepción documentada. Drawer overlay
        // necesita separación visual de la pantalla detrás sin opacarla
        // completamente; blur sutil mantiene contexto de qué tab activo.
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <aside
        style={{
          width: "100%",
          maxWidth: 420,
          height: "100%",
          background: colors.bg.base,
          borderInlineStart: `0.5px solid ${colors.separator}`,
          display: "flex",
          flexDirection: "column",
          paddingBlockStart: "max(env(safe-area-inset-top), 16px)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: spacing.s24,
            paddingBlock: spacing.s16,
            borderBlockEnd: `0.5px solid ${colors.separator}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: colors.text.muted,
                fontWeight: typography.weight.medium,
              }}
            >
              NOTIFICACIONES
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.subtitleMin,
                fontWeight: typography.weight.medium,
                color: colors.text.strong,
                letterSpacing: "-0.005em",
              }}
            >
              {unread > 0 ? `${unread} sin leer` : "Al día"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            data-testid="drawer-close"
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              color: colors.text.secondary,
              cursor: "pointer",
              padding: spacing.s8,
              margin: -spacing.s8,
            }}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && <DrawerStatus message="Cargando…" />}
          {!loading && error === "unauth" && (
            <DrawerStatus
              message="Sin sesión"
              subMessage="Inicia sesión para ver tus notificaciones."
            />
          )}
          {!loading && error && error !== "unauth" && (
            <DrawerStatus
              message="No se pudo cargar"
              subMessage="Intenta cerrar y abrir de nuevo."
            />
          )}
          {!loading && !error && items.length === 0 && (
            <DrawerStatus
              message="Sin notificaciones"
              subMessage="Aquí aparecerán tus avisos del sistema, recordatorios y logros."
            />
          )}
          {!loading && !error && items.length > 0 && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {items.map((n, i) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  isLast={i === items.length - 1}
                  onClick={() => handleItemClick(n)}
                />
              ))}
            </ul>
          )}
        </div>

        {!loading && !error && unread > 0 && (
          <footer
            style={{
              borderBlockStart: `0.5px solid ${colors.separator}`,
              padding: spacing.s16,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={marking}
              data-testid="drawer-mark-all-read"
              style={{
                appearance: "none",
                background: "transparent",
                border: "none",
                color: colors.accent.phosphorCyan,
                cursor: marking ? "default" : "pointer",
                padding: "8px 4px",
                fontFamily: typography.familyMono,
                fontSize: typography.size.microCaps,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: typography.weight.medium,
                opacity: marking ? 0.5 : 1,
              }}
            >
              {marking ? "Marcando…" : "Marcar todo como leído"}
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}

function NotificationItem({ notification, isLast, onClick }) {
  const isRead = !!notification.readAt;
  const isClickable = !!notification.href;
  const ageStr = formatRelative(notification.at);

  const Tag = isClickable ? "button" : "div";
  return (
    <li>
      <Tag
        type={isClickable ? "button" : undefined}
        onClick={isClickable ? onClick : undefined}
        data-testid={`notification-item-${notification.id}`}
        style={{
          appearance: "none",
          width: "100%",
          textAlign: "start",
          background: isRead ? "transparent" : "rgba(34,211,238,0.04)",
          border: "none",
          borderBlockEnd: isLast ? "none" : `0.5px solid ${colors.separator}`,
          paddingInline: spacing.s24,
          paddingBlock: spacing.s16,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          cursor: isClickable ? "pointer" : "default",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isRead && (
            <span
              aria-hidden="true"
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: colors.accent.phosphorCyan,
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.bodyMin,
              fontWeight: typography.weight.medium,
              color: colors.text.strong,
              letterSpacing: "-0.005em",
              lineHeight: 1.3,
            }}
          >
            {notification.title}
          </span>
        </div>
        {notification.body && (
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: colors.text.secondary,
              lineHeight: 1.4,
              paddingInlineStart: 14,
            }}
          >
            {notification.body}
          </span>
        )}
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.06em",
            color: colors.text.muted,
            fontWeight: typography.weight.regular,
            paddingInlineStart: 14,
          }}
        >
          {ageStr}
        </span>
      </Tag>
    </li>
  );
}

function DrawerStatus({ message, subMessage }) {
  return (
    <article
      style={{
        margin: spacing.s24,
        padding: spacing.s24 - 4,
        background: "transparent",
        border: `0.5px dashed ${colors.separator}`,
        borderRadius: radii.panelLg,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.medium,
          color: colors.text.secondary,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
        }}
      >
        {message}
      </span>
      {subMessage && (
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.regular,
            color: colors.text.muted,
            lineHeight: 1.4,
          }}
        >
          {subMessage}
        </span>
      )}
    </article>
  );
}

function formatRelative(ts) {
  if (!ts) return "—";
  const ms = Date.now() - ts;
  const m = Math.floor(ms / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d}d`;
  return `hace ${Math.floor(d / 30)} meses`;
}
