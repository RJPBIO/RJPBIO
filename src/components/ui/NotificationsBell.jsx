"use client";
/* NotificationsBell — campanita global.
   - Escucha CustomEvent("bio-notify:push", { detail: { id?, title, body?, href?, level? } })
     dispatcheado desde cualquier parte (ej. store, toast.info, fetch hooks).
   - Persiste últimas 20 en localStorage para sobrevivir navegación.
   - Marca leídas al abrir el dropdown.
   - No hace polling ni push real: el back-end empuja vía otra capa (SSE/WebPush)
     y esa capa dispara el CustomEvent; así desacoplamos transporte de UI. */
import { useCallback, useEffect, useRef, useState } from "react";

const LS_KEY = "bio-notifications-v1";
const MAX = 20;

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function save(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* empty */ }
}

export default function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const anchor = useRef(null);

  useEffect(() => { setItems(load()); }, []);

  const sync = useCallback(async () => {
    try {
      const since = Number(localStorage.getItem("bio-notifications-since") || 0);
      const url = since
        ? `/api/notifications/recent?since=${since}`
        : "/api/notifications/recent";
      const r = await fetch(url, { credentials: "same-origin" });
      if (!r.ok) return;
      const { items: serverItems = [] } = await r.json();
      if (!serverItems.length) return;
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const additions = serverItems
          .filter((s) => !seen.has(`srv_${s.id}`))
          .map((s) => ({
            id: `srv_${s.id}`,
            title: s.title,
            body: s.body || "",
            href: s.href || null,
            level: s.level || "info",
            at: s.at,
            read: false,
          }));
        if (!additions.length) return prev;
        const next = [...additions, ...prev].slice(0, MAX);
        save(next);
        const latest = Math.max(...additions.map((a) => a.at));
        try { localStorage.setItem("bio-notifications-since", String(latest + 1)); } catch { /* empty */ }
        return next;
      });
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    sync();
    function onVis() { if (!document.hidden) sync(); }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [sync]);

  const add = useCallback((n) => {
    const item = {
      id: n.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(n.title || "Aviso"),
      body: n.body ? String(n.body) : "",
      href: n.href || null,
      level: n.level || "info",
      at: Date.now(),
      read: false,
    };
    setItems((prev) => {
      const next = [item, ...prev].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  useEffect(() => {
    function onPush(e) { add(e.detail || {}); }
    window.addEventListener("bio-notify:push", onPush);
    return () => window.removeEventListener("bio-notify:push", onPush);
  }, [add]);

  useEffect(() => {
    if (!open) return;
    // Marca leídas al abrir (no al hover: evita flicker).
    setItems((prev) => {
      if (!prev.some((x) => !x.read)) return prev;
      const next = prev.map((x) => ({ ...x, read: true }));
      save(next);
      return next;
    });
    function onDocClick(ev) {
      if (anchor.current && !anchor.current.contains(ev.target)) setOpen(false);
    }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const unread = items.filter((x) => !x.read).length;

  return (
    <div ref={anchor} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={btn}
      >
        <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>🔔</span>
        {unread > 0 && (
          <span aria-hidden="true" style={badge}>{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
      {open && (
        <div role="menu" style={panel}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#6EE7B7" }}>Notificaciones</span>
            {items.length > 0 && (
              <button type="button" onClick={() => { setItems([]); save([]); }} style={clearBtn}>Limpiar</button>
            )}
          </div>
          {items.length === 0 ? (
            <p style={{ padding: 16, color: "#94A3B8", fontSize: 13, margin: 0, textAlign: "center" }}>Sin notificaciones.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 340, overflow: "auto" }}>
              {items.map((n) => (
                <li key={n.id} style={{ borderBottom: "1px solid #1E293B" }}>
                  {n.href ? (
                    <a href={n.href} onClick={() => setOpen(false)} style={rowLink}>
                      <Row n={n} />
                    </a>
                  ) : (
                    <div style={{ ...rowLink, cursor: "default" }}><Row n={n} /></div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ n }) {
  const color = n.level === "error" ? "#F87171" : n.level === "warn" ? "#FBBF24" : n.level === "success" ? "#34D399" : "#A7F3D0";
  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
        <strong style={{ fontSize: 13, color: "#E2E8F0" }}>{n.title}</strong>
        <span style={{ marginInlineStart: "auto", fontSize: 11, color: "#64748B" }}>{relTime(n.at)}</span>
      </div>
      {n.body && <p style={{ margin: "4px 0 0 16px", fontSize: 12, color: "#94A3B8" }}>{n.body}</p>}
    </>
  );
}

function relTime(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.round(s / 60)} m`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  return `hace ${Math.round(s / 86400)} d`;
}

const btn = {
  position: "relative", padding: "6px 10px", background: "transparent", color: "#A7F3D0",
  border: "1px solid #064E3B", borderRadius: 10, cursor: "pointer", fontSize: 14,
  display: "inline-flex", alignItems: "center", gap: 4,
};
const badge = {
  position: "absolute", top: -4, insetInlineEnd: -4, minWidth: 18, height: 18, padding: "0 4px",
  background: "#EF4444", color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 800,
  display: "grid", placeItems: "center",
};
const panel = {
  position: "absolute", top: "calc(100% + 6px)", insetInlineEnd: 0, width: 340,
  background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12,
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)", zIndex: 60,
};
const rowLink = {
  display: "block", padding: "10px 12px", textDecoration: "none", color: "inherit",
};
const clearBtn = {
  background: "transparent", color: "#94A3B8", border: 0, fontSize: 11, cursor: "pointer",
};
