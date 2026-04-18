"use client";
import { useState } from "react";
import { toast } from "@/components/ui/Toast";

const ALL_SCOPES = [
  { id: "read:sessions",  label: "Leer sesiones" },
  { id: "write:sessions", label: "Escribir sesiones" },
  { id: "read:members",   label: "Leer miembros" },
  { id: "write:members",  label: "Escribir miembros" },
  { id: "read:analytics", label: "Leer analíticas (k-anon)" },
  { id: "read:audit",     label: "Leer audit log" },
];

function csrfHeader() {
  const c = document.cookie.split("; ").find((r) => r.startsWith("bio-csrf="));
  return c ? decodeURIComponent(c.split("=")[1]) : "";
}

function Reveal({ token, onClose }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error("No se pudo copiar"); }
  }
  return (
    <div role="dialog" aria-modal="true" style={overlay}>
      <div style={modal}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Guarda esta clave — solo se muestra una vez</h2>
        <p style={{ color: "#FBBF24", fontSize: 13, marginTop: 8 }}>
          Bio-Ignición no la almacena en claro. Si la pierdes, tendrás que rotarla.
        </p>
        <pre style={pre}>{token}</pre>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={copy} style={btnPrimary}>{copied ? "¡Copiado!" : "Copiar al portapapeles"}</button>
          <button onClick={onClose} style={btnGhost}>Ya la guardé</button>
        </div>
      </div>
    </div>
  );
}

export default function ApiKeysClient({ initial }) {
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState(new Set(["read:sessions"]));
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(null);

  function toggleScope(s) {
    setScopes((curr) => {
      const n = new Set(curr);
      if (n.has(s)) n.delete(s); else n.add(s);
      return n;
    });
  }

  async function create(e) {
    e.preventDefault();
    if (!name.trim() || scopes.size === 0) return;
    setBusy(true);
    try {
      const r = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader() },
        body: JSON.stringify({ name, scopes: [...scopes] }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setKeys((s) => [{ id: j.id, name, prefix: j.prefix, scopes: j.scopes, createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null }, ...s]);
      setRevealed(j.token);
      setName("");
      toast.success("API key creada");
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function rotate(k) {
    if (!confirm(`Rotar "${k.name}"? La clave actual quedará revocada inmediatamente.`)) return;
    try {
      const r = await fetch(`/api/v1/api-keys/${k.id}?action=rotate`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader() },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setKeys((s) => [
        { id: j.id, name: k.name + "·rot", prefix: j.prefix, scopes: j.scopes, createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null },
        ...s.map((x) => x.id === k.id ? { ...x, revokedAt: new Date().toISOString() } : x),
      ]);
      setRevealed(j.token);
      toast.success("Clave rotada");
    } catch (err) { toast.error(err.message); }
  }

  async function revoke(k) {
    if (!confirm(`Revocar "${k.name}"? Cualquier integración que la use dejará de funcionar.`)) return;
    try {
      const r = await fetch(`/api/v1/api-keys/${k.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfHeader() },
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Error"); }
      setKeys((s) => s.map((x) => x.id === k.id ? { ...x, revokedAt: new Date().toISOString() } : x));
      toast.success("Clave revocada");
    } catch (err) { toast.error(err.message); }
  }

  return (
    <>
      <form onSubmit={create} style={{ display: "grid", gap: 10, margin: "16px 0 20px", padding: 14, border: "1px solid #1E293B", borderRadius: 12, background: "#020617" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej. Zapier prod)" required maxLength={80} style={inp} />
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 12, color: "#94A3B8", padding: 0 }}>Permisos (scopes)</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 6, marginTop: 6 }}>
            {ALL_SCOPES.map((s) => (
              <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#E2E8F0", cursor: "pointer" }}>
                <input type="checkbox" checked={scopes.has(s.id)} onChange={() => toggleScope(s.id)} />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button disabled={busy || !name.trim() || scopes.size === 0} style={{ ...btnPrimary, justifySelf: "start", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Creando…" : "Crear clave"}
        </button>
      </form>

      <p style={{ color: "#64748B", fontSize: 12 }}>La clave solo se muestra una vez al crearse. Guárdala en tu gestor de secretos.</p>
      <div className="bi-table-wrap">
        <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ textAlign: "left", color: "#6EE7B7", fontSize: 12 }}>
            <th style={th}>Nombre</th><th style={th}>Prefix</th><th style={th}>Scopes</th>
            <th style={th}>Creada</th><th style={th}>Último uso</th><th style={th}>Estado</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {keys.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, color: "#6B7280", textAlign: "center" }}>
                Sin API keys. Crea la primera arriba.
              </td></tr>
            )}
            {keys.map((k) => (
              <tr key={k.id} style={{ borderTop: "1px solid #1E293B" }}>
                <td style={td}>{k.name}</td>
                <td style={{ ...td, fontFamily: "ui-monospace", color: "#94A3B8" }}>{k.prefix}…</td>
                <td style={{ ...td, color: "#94A3B8", fontSize: 12 }}>{(k.scopes || []).join(", ")}</td>
                <td style={td}>{new Date(k.createdAt).toLocaleDateString()}</td>
                <td style={{ ...td, color: k.lastUsedAt ? "#E2E8F0" : "#64748B" }}>
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "nunca"}
                </td>
                <td style={{ ...td, color: k.revokedAt ? "#F87171" : "#34D399" }}>
                  {k.revokedAt ? "Revocada" : "Activa"}
                </td>
                <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                  {!k.revokedAt && (
                    <>
                      <button onClick={() => rotate(k)} style={btnMiniGhost}>Rotar</button>
                      <button onClick={() => revoke(k)} style={{ ...btnMiniGhost, color: "#FCA5A5", borderColor: "#7F1D1D" }}>Revocar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {revealed && <Reveal token={revealed} onClose={() => setRevealed(null)} />}
    </>
  );
}

const inp = { padding: "8px 10px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0", fontSize: 14 };
const btnPrimary = { padding: "8px 14px", background: "linear-gradient(135deg,#059669,#10B981)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const btnGhost = { padding: "8px 14px", background: "transparent", color: "#A7F3D0", border: "1px solid #334155", borderRadius: 8, cursor: "pointer", fontSize: 13 };
const btnMiniGhost = { padding: "4px 10px", marginInlineEnd: 6, background: "transparent", color: "#A7F3D0", border: "1px solid #334155", borderRadius: 8, cursor: "pointer", fontSize: 12 };
const th = { textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6EE7B7", borderBottom: "1px solid #1E293B" };
const td = { padding: "10px" };
const overlay = { position: "fixed", inset: 0, background: "rgba(2,6,23,.85)", display: "grid", placeItems: "center", zIndex: 100, padding: 20 };
const modal = { width: "min(560px, 100%)", background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,.4)" };
const pre = { marginTop: 14, padding: 14, background: "#020617", border: "1px solid #065F46", borderRadius: 10, fontFamily: "ui-monospace", fontSize: 13, color: "#6EE7B7", wordBreak: "break-all", whiteSpace: "pre-wrap", margin: 0 };
