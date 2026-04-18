"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/Toast";

const ALL_EVENTS = [
  "session.completed", "session.started",
  "member.added", "member.removed",
  "station.tap", "billing.overage",
];

function csrfHeader() {
  const c = document.cookie.split("; ").find((r) => r.startsWith("bio-csrf="));
  return c ? decodeURIComponent(c.split("=")[1]) : "";
}

function RevealSecret({ secret, onClose }) {
  return (
    <div role="dialog" aria-modal="true" style={overlay}>
      <div style={modal}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Secret HMAC — guárdalo ahora</h2>
        <p style={{ color: "#FBBF24", fontSize: 13, marginTop: 8 }}>
          Úsalo para verificar firmas <code>webhook-signature</code> en tu receptor. No se vuelve a mostrar completo.
        </p>
        <pre style={pre}>{secret}</pre>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => navigator.clipboard?.writeText(secret).then(() => toast.success("Copiado")).catch(() => {})} style={btnPrimary}>Copiar</button>
          <button onClick={onClose} style={btnGhost}>Ya lo guardé</button>
        </div>
      </div>
    </div>
  );
}

function DeliveriesPanel({ hookId, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/webhooks/${hookId}/deliveries`);
      const j = await r.json();
      setRows(j.data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [hookId]);

  async function retry(did) {
    setRetrying(did);
    try {
      const r = await fetch(`/api/v1/webhooks/${hookId}/deliveries?action=retry&did=${did}`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader() },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Error");
      toast.success("Reintento encolado");
      setTimeout(load, 800);
    } catch (e) { toast.error(e.message); }
    finally { setRetrying(null); }
  }

  return (
    <div role="dialog" aria-modal="true" style={overlay}>
      <div style={{ ...modal, width: "min(900px, 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Últimas entregas</h2>
          <div>
            <button onClick={load} style={btnMiniGhost}>Refrescar</button>
            <button onClick={onClose} style={btnMiniGhost}>Cerrar</button>
          </div>
        </div>
        <div style={{ maxHeight: 500, overflow: "auto", marginTop: 12 }}>
          {loading && <p style={{ color: "#94A3B8", fontSize: 13 }}>Cargando…</p>}
          {!loading && rows.length === 0 && <p style={{ color: "#94A3B8", fontSize: 13 }}>Sin entregas aún. Prueba con "Test ping".</p>}
          {!loading && rows.length > 0 && (
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ textAlign: "left", color: "#6EE7B7" }}>
                <th style={th}>Evento</th><th style={th}>Status</th><th style={th}>Intentos</th>
                <th style={th}>Creado</th><th style={th}>Entregado</th><th style={th}>Error</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} style={{ borderTop: "1px solid #1E293B" }}>
                    <td style={td}>{d.event}</td>
                    <td style={{ ...td, color: d.status >= 200 && d.status < 300 ? "#34D399" : d.status ? "#FCA5A5" : "#94A3B8" }}>
                      {d.status ?? "—"}
                    </td>
                    <td style={td}>{d.attempts}</td>
                    <td style={td}>{new Date(d.createdAt).toLocaleString()}</td>
                    <td style={td}>{d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : "—"}</td>
                    <td style={{ ...td, color: "#FCA5A5", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }} title={d.error || ""}>
                      {d.error ? d.error.slice(0, 60) : ""}
                    </td>
                    <td style={td}>
                      {!d.deliveredAt && (
                        <button onClick={() => retry(d.id)} disabled={retrying === d.id} style={btnMiniGhost}>
                          {retrying === d.id ? "…" : "Reintentar"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WebhooksClient({ initial }) {
  const [hooks, setHooks] = useState(initial);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState(new Set(["session.completed"]));
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [deliveriesFor, setDeliveriesFor] = useState(null);

  function toggleEvent(e) {
    setEvents((c) => { const n = new Set(c); n.has(e) ? n.delete(e) : n.add(e); return n; });
  }

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader() },
        body: JSON.stringify({ url, events: [...events] }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setHooks((s) => [{ id: j.id, url: j.url, events: j.events, active: j.active, secretTail: j.secret.slice(-4), createdAt: new Date().toISOString() }, ...s]);
      setRevealed(j.secret);
      setUrl("");
      toast.success("Webhook creado");
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function toggle(h) {
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader() },
        body: JSON.stringify({ active: !h.active }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setHooks((s) => s.map((x) => x.id === h.id ? { ...x, active: j.active } : x));
    } catch (err) { toast.error(err.message); }
  }

  async function rotate(h) {
    if (!confirm(`Rotar secret de ${h.url}? La firma vieja deja de validar.`)) return;
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}?action=rotate`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader() },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setRevealed(j.secret);
      setHooks((s) => s.map((x) => x.id === h.id ? { ...x, secretTail: j.secret.slice(-4) } : x));
    } catch (err) { toast.error(err.message); }
  }

  async function testPing(h) {
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}?action=test`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader() },
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Error"); }
      toast.success("Ping enviado — revisa entregas");
    } catch (err) { toast.error(err.message); }
  }

  async function remove(h) {
    if (!confirm(`Eliminar webhook ${h.url}?`)) return;
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfHeader() },
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Error"); }
      setHooks((s) => s.filter((x) => x.id !== h.id));
      toast.success("Webhook eliminado");
    } catch (err) { toast.error(err.message); }
  }

  return (
    <>
      <form onSubmit={create} style={{ display: "grid", gap: 10, margin: "16px 0 20px", padding: 14, border: "1px solid #1E293B", borderRadius: 12, background: "#020617" }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tu-endpoint.com/hook" required style={inp} />
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 12, color: "#94A3B8" }}>Eventos</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 6, marginTop: 6 }}>
            {ALL_EVENTS.map((e) => (
              <label key={e} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#E2E8F0", cursor: "pointer" }}>
                <input type="checkbox" checked={events.has(e)} onChange={() => toggleEvent(e)} />
                <code style={{ fontSize: 12 }}>{e}</code>
              </label>
            ))}
          </div>
        </fieldset>
        <button disabled={busy || !url || events.size === 0} style={{ ...btnPrimary, justifySelf: "start", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Creando…" : "Crear webhook"}
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {hooks.length === 0 && <li style={{ padding: 24, color: "#6B7280", textAlign: "center" }}>Sin webhooks todavía.</li>}
        {hooks.map((h) => (
          <li key={h.id} style={{ padding: 14, border: "1px solid #1E293B", borderRadius: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span style={{ fontFamily: "ui-monospace", fontSize: 13, wordBreak: "break-all" }}>{h.url}</span>
              <span style={{ fontSize: 11, color: h.active ? "#34D399" : "#F59E0B" }}>
                {h.active ? "● Activo" : "● Pausado"}
              </span>
            </div>
            <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>
              {(h.events || []).join(" · ")} · secret …{h.secretTail}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => toggle(h)} style={btnMiniGhost}>{h.active ? "Pausar" : "Reactivar"}</button>
              <button onClick={() => testPing(h)} style={btnMiniGhost}>Test ping</button>
              <button onClick={() => setDeliveriesFor(h.id)} style={btnMiniGhost}>Ver entregas</button>
              <button onClick={() => rotate(h)} style={btnMiniGhost}>Rotar secret</button>
              <button onClick={() => remove(h)} style={{ ...btnMiniGhost, color: "#FCA5A5", borderColor: "#7F1D1D" }}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>

      {revealed && <RevealSecret secret={revealed} onClose={() => setRevealed(null)} />}
      {deliveriesFor && <DeliveriesPanel hookId={deliveriesFor} onClose={() => setDeliveriesFor(null)} />}
    </>
  );
}

const inp = { padding: "8px 10px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0", fontSize: 14 };
const btnPrimary = { padding: "8px 14px", background: "linear-gradient(135deg,#059669,#10B981)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const btnGhost = { padding: "8px 14px", background: "transparent", color: "#A7F3D0", border: "1px solid #334155", borderRadius: 8, cursor: "pointer", fontSize: 13 };
const btnMiniGhost = { padding: "4px 10px", background: "transparent", color: "#A7F3D0", border: "1px solid #334155", borderRadius: 8, cursor: "pointer", fontSize: 12 };
const th = { textAlign: "left", padding: "6px 8px", fontSize: 11, color: "#6EE7B7", borderBottom: "1px solid #1E293B" };
const td = { padding: "6px 8px" };
const overlay = { position: "fixed", inset: 0, background: "rgba(2,6,23,.85)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 };
const modal = { width: "min(560px, 100%)", background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,.4)" };
const pre = { marginTop: 14, padding: 14, background: "#020617", border: "1px solid #065F46", borderRadius: 10, fontFamily: "ui-monospace", fontSize: 13, color: "#6EE7B7", wordBreak: "break-all", whiteSpace: "pre-wrap", margin: 0 };
