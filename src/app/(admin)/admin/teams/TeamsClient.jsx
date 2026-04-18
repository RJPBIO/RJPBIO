"use client";
import { useState } from "react";
import { toast } from "@/components/ui/Toast";

function csrfHeader() {
  const c = document.cookie.split("; ").find((r) => r.startsWith("bio-csrf="));
  return c ? decodeURIComponent(c.split("=")[1]) : "";
}

export default function TeamsClient({ initial, managersById, unassigned }) {
  const [teams, setTeams] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [creating, setCreating] = useState(false);

  async function createTeam(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCreating(true);
    try {
      const r = await fetch("/api/v1/teams", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader(), accept: "application/json" },
        body: JSON.stringify({ name: fd.get("name"), managerEmail: fd.get("managerEmail") }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Error");
      setTeams((s) => [...s, { ...j.data, _members: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      e.target.reset();
      toast.success("Equipo creado");
    } catch (err) { toast.error(err.message); }
    finally { setCreating(false); }
  }

  function startEdit(t) {
    setEditing(t.id);
    setName(t.name);
    setManagerEmail(managersById[t.managerId] || "");
  }

  async function saveEdit(id) {
    try {
      const r = await fetch(`/api/v1/teams/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader() },
        body: JSON.stringify({ name, managerEmail }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Error");
      setTeams((s) => s.map((t) => t.id === id ? { ...t, name: j.data.name, managerId: j.data.managerId } : t));
      setEditing(null);
      toast.success("Equipo actualizado");
    } catch (err) { toast.error(err.message); }
  }

  async function removeTeam(t) {
    if (!confirm(`¿Eliminar equipo "${t.name}"? Sus ${t._members} miembros quedarán sin equipo.`)) return;
    try {
      const r = await fetch(`/api/v1/teams/${t.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfHeader() },
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Error"); }
      setTeams((s) => s.filter((x) => x.id !== t.id));
      toast.success("Equipo eliminado");
    } catch (err) { toast.error(err.message); }
  }

  return (
    <>
      <form onSubmit={createTeam} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 16, marginBottom: 16 }}>
        <input name="name" placeholder="Nombre (ej. Operaciones)" required maxLength={60} style={input} />
        <input name="managerEmail" placeholder="Email del manager (opcional)" type="email" style={input} />
        <button disabled={creating} style={{ ...btn, opacity: creating ? 0.6 : 1 }}>{creating ? "Creando…" : "Crear equipo"}</button>
      </form>

      <div className="bi-table-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>Equipo</th>
              <th style={th}>Miembros</th>
              <th style={th}>Manager</th>
              <th style={th}>k-anonymity</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, color: "#6B7280", textAlign: "center" }}>
                Sin equipos todavía. Crea el primero arriba.
              </td></tr>
            )}
            {teams.map((t) => {
              const n = t._members || 0;
              const isEdit = editing === t.id;
              return (
                <tr key={t.id} style={{ borderTop: "1px solid #1F2937" }}>
                  <td style={td}>
                    {isEdit
                      ? <input value={name} onChange={(e) => setName(e.target.value)} style={inlineInput} />
                      : t.name}
                  </td>
                  <td style={td}>{n}</td>
                  <td style={td}>
                    {isEdit
                      ? <input value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="email@…" style={inlineInput} />
                      : (managersById[t.managerId] || (t.managerId ? t.managerId.slice(0, 8) + "…" : "—"))}
                  </td>
                  <td style={{ ...td, color: n >= 5 ? "#34D399" : "#F59E0B" }}>
                    {n >= 5 ? "✓ cohorte visible" : `faltan ${5 - n} para reporte`}
                  </td>
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    {isEdit ? (
                      <>
                        <button onClick={() => saveEdit(t.id)} style={btnMini}>Guardar</button>
                        <button onClick={() => setEditing(null)} style={btnMiniGhost}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(t)} style={btnMiniGhost}>Editar</button>
                        <button onClick={() => removeTeam(t)} style={{ ...btnMiniGhost, color: "#FCA5A5", borderColor: "#7F1D1D" }}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unassigned > 0 && (
        <p style={{ marginTop: 12, fontSize: 12, color: "#6EE7B7" }}>
          {unassigned} miembro{unassigned === 1 ? "" : "s"} sin equipo asignado.
          Asigna desde <a href="/admin/members" style={{ color: "#A7F3D0" }}>Miembros</a>.
        </p>
      )}
    </>
  );
}

const input = { padding: "10px 12px", borderRadius: 10, background: "#052E16", color: "#ECFDF5", border: "1px solid #064E3B", fontSize: 14 };
const inlineInput = { ...input, padding: "6px 8px", fontSize: 13, width: "100%" };
const btn = { ...input, background: "linear-gradient(135deg,#059669,#10B981)", border: 0, cursor: "pointer", fontWeight: 700 };
const th = { textAlign: "left", padding: "8px 10px", fontSize: 12, color: "#6EE7B7", borderBottom: "1px solid #064E3B" };
const td = { padding: "10px", fontSize: 13 };
const btnMini = { padding: "4px 10px", marginInlineEnd: 6, background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 };
const btnMiniGhost = { padding: "4px 10px", marginInlineEnd: 6, background: "transparent", color: "#A7F3D0", border: "1px solid #064E3B", borderRadius: 8, cursor: "pointer", fontSize: 12 };
