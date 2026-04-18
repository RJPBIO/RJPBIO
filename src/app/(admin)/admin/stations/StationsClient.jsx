"use client";
import { useState, useCallback } from "react";

const POLICIES = [
  { v: "ENTRY_EXIT",   l: "Entrada + Salida (recomendado)" },
  { v: "ANY",          l: "Cualquier horario" },
  { v: "MORNING_ONLY", l: "Solo mañana" },
  { v: "EVENING_ONLY", l: "Solo tarde" },
];

// Lee la cookie bio-csrf emitida por el middleware para re-enviarla como
// header en mutaciones (patrón double-submit). Si falta, el server rechaza 403.
function csrfHeaders() {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|; )bio-csrf=([^;]+)/);
  return m ? { "x-csrf-token": decodeURIComponent(m[1]) } : {};
}

export default function StationsClient({ orgId, origin, initial }) {
  const [rows, setRows] = useState(initial || []);
  const [draft, setDraft] = useState({ label: "", location: "", policy: "ENTRY_EXIT" });
  const [busy, setBusy] = useState(false);
  const [justCreated, setJustCreated] = useState(null);

  const create = useCallback(async (e) => {
    e.preventDefault();
    if (!draft.label.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/v1/stations", {
        method: "POST",
        headers: { "content-type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ orgId, ...draft }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "error");
      setRows((x) => [{ ...j.data, lastTapAt: null }, ...x]);
      setJustCreated({ id: j.data.id, label: j.data.label, tapUrl: j.tapUrl });
      setDraft({ label: "", location: "", policy: "ENTRY_EXIT" });
    } catch (err) {
      alert("No se pudo crear: " + err.message);
    } finally {
      setBusy(false);
    }
  }, [draft, orgId]);

  const toggleActive = useCallback(async (id, active) => {
    const r = await fetch(`/api/v1/stations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ active: !active }),
    });
    if (r.ok) setRows((x) => x.map((s) => s.id === id ? { ...s, active: !active } : s));
  }, []);

  const rotate = useCallback(async (id) => {
    if (!confirm("Rotar clave invalidará los tags impresos. ¿Continuar?")) return;
    const r = await fetch(`/api/v1/stations/${id}?action=rotate`, { method: "POST", headers: csrfHeaders() });
    const j = await r.json();
    if (r.ok) setJustCreated({ id, label: rows.find((s) => s.id === id)?.label || "", tapUrl: j.tapUrl, rotated: true });
    else alert("Falló: " + j.error);
  }, [rows]);

  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Estaciones · Tap-to-Ignite</h1>
      <p style={{ color: "#9CA3AF", marginTop: 4, fontSize: 13 }}>
        Cada estación genera una URL firmada para imprimir en QR o grabar en NFC.
        Los empleados tapean para iniciar sesión en 1 segundo.
      </p>

      <form onSubmit={create} style={formStyle}>
        <input
          placeholder="Etiqueta (ej. Recepción piso 3)"
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          style={inputStyle}
          required
          maxLength={80}
        />
        <input
          placeholder="Ubicación (opcional)"
          value={draft.location}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          style={inputStyle}
          maxLength={120}
        />
        <select
          value={draft.policy}
          onChange={(e) => setDraft({ ...draft, policy: e.target.value })}
          style={inputStyle}
        >
          {POLICIES.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
        <button type="submit" disabled={busy} style={btnStyle}>
          {busy ? "Creando…" : "Crear estación"}
        </button>
      </form>

      {justCreated && (
        <div style={bannerStyle}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {justCreated.rotated ? "Clave rotada." : "Estación creada."} Imprime o graba esta URL:
          </div>
          <code style={codeStyle}>{justCreated.tapUrl}</code>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => navigator.clipboard.writeText(justCreated.tapUrl)} style={smallBtn}>
              Copiar URL
            </button>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(justCreated.tapUrl)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ ...smallBtn, textDecoration: "none" }}
            >
              Ver QR
            </a>
            <button onClick={() => setJustCreated(null)} style={smallBtnGhost}>Cerrar</button>
          </div>
          <div style={{ fontSize: 11, color: "#FCA5A5", marginTop: 8 }}>
            Esta URL no se vuelve a mostrar. Si la pierdes, rota la clave y re-imprime.
          </div>
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Etiqueta</th>
            <th style={thStyle}>Ubicación</th>
            <th style={thStyle}>Política</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Último tap</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 24, color: "#6B7280", textAlign: "center" }}>
              Sin estaciones todavía. Crea la primera arriba.
            </td></tr>
          )}
          {rows.map((s) => (
            <tr key={s.id} style={{ borderTop: "1px solid #1F2937" }}>
              <td style={tdStyle}>{s.label}</td>
              <td style={tdStyle}>{s.location || "—"}</td>
              <td style={tdStyle}>{s.policy}</td>
              <td style={tdStyle}>
                <span style={{ color: s.active ? "#34D399" : "#F87171" }}>
                  {s.active ? "Activa" : "Inactiva"}
                </span>
              </td>
              <td style={tdStyle}>{s.lastTapAt ? new Date(s.lastTapAt).toLocaleString() : "—"}</td>
              <td style={tdStyle}>
                <button onClick={() => toggleActive(s.id, s.active)} style={smallBtnGhost}>
                  {s.active ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => rotate(s.id)} style={{ ...smallBtnGhost, marginLeft: 6 }}>
                  Rotar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <details style={{ marginTop: 24, padding: 12, background: "#052E16", borderRadius: 8, fontSize: 13 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>¿Cómo desplegarlas?</summary>
        <ol style={{ lineHeight: 1.7, marginTop: 8 }}>
          <li>Crea una estación por área física (recepción, escritorio, sala, cocina).</li>
          <li>Copia la URL o escanea el QR generado.</li>
          <li>
            Imprime el QR en adhesivo laminado <b>o</b> graba en un tag NFC NDEF tipo URL
            (NTAG213/215 funcionan perfecto).
          </li>
          <li>
            Pégala en el punto físico. El empleado tapea con su celular → se abre la PWA y corre la sesión
            prescrita sin pedir login. 0 fricción.
          </li>
          <li>
            La política <b>Entrada + Salida</b> activa solo en ventanas 05–11 y 16–22 hora local; fuera
            de esas ventanas no cuenta como sesión obligatoria (pero sí como voluntaria).
          </li>
        </ol>
      </details>
    </div>
  );
}

const formStyle   = { display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr auto", gap: 8, marginTop: 16, marginBottom: 16 };
const inputStyle  = { background: "#0B0E14", color: "#ECFDF5", border: "1px solid #064E3B", borderRadius: 8, padding: "8px 10px", fontSize: 14 };
const btnStyle    = { background: "#10B981", color: "#052E16", border: 0, borderRadius: 8, padding: "8px 14px", fontWeight: 700, cursor: "pointer" };
const bannerStyle = { padding: 12, background: "#064E3B", border: "1px solid #10B981", borderRadius: 8, marginBottom: 16 };
const codeStyle   = { display: "block", padding: 8, background: "#0B0E14", borderRadius: 6, wordBreak: "break-all", fontSize: 12 };
const smallBtn    = { background: "#10B981", color: "#052E16", border: 0, borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const smallBtnGhost = { background: "transparent", color: "#A7F3D0", border: "1px solid #065F46", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer" };
const tableStyle  = { width: "100%", borderCollapse: "collapse", marginTop: 8 };
const thStyle     = { textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6EE7B7", borderBottom: "1px solid #064E3B" };
const tdStyle     = { padding: "10px", fontSize: 13 };
