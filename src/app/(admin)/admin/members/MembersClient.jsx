"use client";
import { useMemo, useState } from "react";
import { toast } from "@/components/ui/Toast";

/* Client-side members table: search, role filter, status filter,
   pagination y export CSV. Recibe rows precalculadas del server. */
const PAGE = 25;

function toCSV(rows) {
  const header = ["email", "name", "role", "since", "scim"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [r.email, r.name || "", r.role, new Date(r.createdAt).toISOString(), r.scimId ? "yes" : "no"]
      .map(esc).join(",")
  );
  return [header.join(","), ...body].join("\r\n");
}

function download(filename, content, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function MembersClient({ initialRows, orgId }) {
  const [rows] = useState(initialRows);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("ALL");
  const [statusF, setStatusF] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleF !== "ALL" && r.role !== roleF) return false;
      if (statusF === "SCIM" && !r.scimId) return false;
      if (statusF === "MANUAL" && r.scimId) return false;
      if (!needle) return true;
      return (r.email || "").toLowerCase().includes(needle) || (r.name || "").toLowerCase().includes(needle);
    });
  }, [rows, q, roleF, statusF]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const allChecked = slice.length > 0 && slice.every((r) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) slice.forEach((r) => next.delete(r.id));
    else slice.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  async function bulkInvite(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const emails = String(data.get("emails") || "").split(/[\s,;]+/).filter(Boolean);
    const role = data.get("role");
    if (!emails.length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/invite/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, emails, role }),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      toast.success(`${j.invited} invitación(es) enviadas${j.skipped ? ` · ${j.skipped} omitidas` : ""}`);
      e.currentTarget.reset();
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      toast.error(err.message || "No se pudo invitar");
    } finally { setBusy(false); }
  }

  async function bulkAction(action) {
    if (!selected.size) return;
    if (!confirm(`Aplicar "${action}" a ${selected.size} miembro(s)?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, ids: Array.from(selected), action }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Acción aplicada a ${selected.size} miembro(s)`);
      setSelected(new Set());
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      toast.error(err.message || "No se pudo ejecutar");
    } finally { setBusy(false); }
  }

  return (
    <>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>Miembros <small style={{ color: "#6EE7B7", fontSize: 14, fontWeight: 400 }}>({filtered.length} de {rows.length})</small></h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => download(`members-${Date.now()}.csv`, toCSV(filtered))} style={btnGhost}>Exportar CSV</button>
        </div>
      </header>

      <details style={{ marginTop: 14, padding: 12, background: "#052E16", borderRadius: 12, border: "1px solid #064E3B" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Invitar (individual o bulk)</summary>
        <form onSubmit={bulkInvite} style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <textarea
            name="emails" required rows={3}
            placeholder="Pega una lista de correos separados por coma, espacio o salto de línea"
            style={{ ...input, fontFamily: "monospace", fontSize: 13 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <select name="role" style={input} defaultValue="MEMBER">
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button disabled={busy} style={btn}>{busy ? "Enviando…" : "Enviar invitaciones"}</button>
          </div>
        </form>
      </details>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "18px 0 12px" }}>
        <input
          type="search" placeholder="Buscar por email o nombre…" value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
          style={{ ...input, flex: 1, minWidth: 220 }}
        />
        <select value={roleF} onChange={(e) => { setRoleF(e.target.value); setPage(0); }} style={input}>
          <option value="ALL">Todos los roles</option>
          <option value="OWNER">Owner</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="MEMBER">Member</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(0); }} style={input}>
          <option value="ALL">Todos</option>
          <option value="SCIM">Sincronizados (SCIM)</option>
          <option value="MANUAL">Manuales (no SCIM)</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: 10, background: "rgba(16,185,129,0.08)", border: "1px solid #10B981", borderRadius: 10, marginBottom: 10 }}>
          <span style={{ fontWeight: 600 }}>{selected.size} seleccionado(s)</span>
          <button onClick={() => bulkAction("remove")} style={{ ...btnGhost, borderColor: "#F87171", color: "#FCA5A5" }}>Eliminar</button>
          <button onClick={() => setSelected(new Set())} style={{ ...btnGhost, marginLeft: "auto" }}>Deseleccionar</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6EE7B7", border: "1px dashed #064E3B", borderRadius: 12 }}>
          No hay miembros que coincidan con los filtros.
        </div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#6EE7B7" }}>
                <th style={th}><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Seleccionar todos" /></th>
                <th style={th}>Email</th>
                <th style={th}>Nombre</th>
                <th style={th}>Rol</th>
                <th style={th}>Desde</th>
                <th style={th}>SCIM</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr key={r.id} style={{ borderBlockStart: "1px solid #064E3B" }}>
                  <td style={td}><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Seleccionar ${r.email}`} /></td>
                  <td style={td}>{r.email}</td>
                  <td style={td}>{r.name || "—"}</td>
                  <td style={td}><span style={rolePill(r.role)}>{r.role}</span></td>
                  <td style={td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td style={td}>{r.scimId ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageCount > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button onClick={() => setPage(0)} disabled={page === 0} style={btnGhost}>«</button>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={btnGhost}>‹</button>
              <span style={{ padding: "8px 12px", color: "#A7F3D0" }}>
                {page + 1} de {pageCount}
              </span>
              <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} style={btnGhost}>›</button>
              <button onClick={() => setPage(pageCount - 1)} disabled={page >= pageCount - 1} style={btnGhost}>»</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

const input = { padding: "10px 12px", borderRadius: 10, background: "#052E16", color: "#ECFDF5", border: "1px solid #064E3B", fontSize: 13 };
const btn = { ...input, background: "linear-gradient(135deg,#059669,#10B981)", border: 0, cursor: "pointer", fontWeight: 700, color: "#fff" };
const btnGhost = { ...input, background: "transparent", cursor: "pointer", fontWeight: 600 };
const th = { padding: "8px 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 };
const td = { padding: "10px" };
const rolePill = (role) => ({
  padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
  background: role === "OWNER" ? "rgba(250,204,21,0.15)" : role === "ADMIN" ? "rgba(244,114,182,0.12)" : "rgba(16,185,129,0.1)",
  color: role === "OWNER" ? "#FACC15" : role === "ADMIN" ? "#F472B6" : "#34D399",
  border: `1px solid ${role === "OWNER" ? "#FACC15" : role === "ADMIN" ? "#F472B6" : "#10B981"}33`,
});
