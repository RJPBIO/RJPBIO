"use client";
import { useMemo, useState } from "react";
import { toast } from "@/components/ui/Toast";
import { DataTable, TableToolbar } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

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
  const [q, setQ] = useState("");

  const filteredTeams = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teams;
    return teams.filter((t) => {
      const managerEmail = managersById[t.managerId] || "";
      return (t.name || "").toLowerCase().includes(needle) || managerEmail.toLowerCase().includes(needle);
    });
  }, [teams, q, managersById]);

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

  const columns = [
    {
      key: "name", label: "Equipo",
      render: (t) => editing === t.id
        ? <Input value={name} onChange={(e) => setName(e.target.value)} style={{ minHeight: 32, padding: `${space[1]}px ${space[2]}px`, fontSize: font.size.md }} />
        : <span style={{ fontWeight: font.weight.semibold, color: cssVar.text }}>{t.name}</span>,
    },
    { key: "members", label: "Miembros", width: 100, render: (t) => <span style={{ fontFamily: cssVar.fontMono }}>{t._members || 0}</span> },
    {
      key: "manager", label: "Manager",
      render: (t) => editing === t.id
        ? <Input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="email@…" style={{ minHeight: 32, padding: `${space[1]}px ${space[2]}px`, fontSize: font.size.md }} />
        : (managersById[t.managerId] || (t.managerId ? <code style={{ fontFamily: cssVar.fontMono, color: cssVar.textMuted }}>{t.managerId.slice(0, 8) + "…"}</code> : "—")),
    },
    {
      key: "k", label: "k-anonymity", width: 180,
      render: (t) => {
        const n = t._members || 0;
        return n >= 5
          ? <Badge variant="success" size="sm">✓ cohorte visible</Badge>
          : <Badge variant="warn" size="sm">faltan {5 - n}</Badge>;
      },
    },
    {
      key: "__actions", label: "", align: "right", width: 200,
      render: (t) => editing === t.id ? (
        <span style={{ display: "inline-flex", gap: space[1] }}>
          <Button size="sm" variant="primary" onClick={() => saveEdit(t.id)}>Guardar</Button>
          <Button size="sm" variant="ghost"   onClick={() => setEditing(null)}>Cancelar</Button>
        </span>
      ) : (
        <span style={{ display: "inline-flex", gap: space[1] }}>
          <Button size="sm" variant="ghost"  onClick={() => startEdit(t)}>Editar</Button>
          <Button size="sm" variant="danger" onClick={() => removeTeam(t)}>Eliminar</Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <form
        onSubmit={createTeam}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: space[2],
          padding: space[4], marginBottom: space[4],
          background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.md,
          alignItems: "end",
        }}
      >
        <label style={{ display: "block" }}>
          <span style={labelStyle}>Nombre</span>
          <Input name="name" placeholder="ej. Operaciones" required maxLength={60} />
        </label>
        <label style={{ display: "block" }}>
          <span style={labelStyle}>Manager (opcional)</span>
          <Input name="managerEmail" placeholder="email@empresa.com" type="email" />
        </label>
        <Button type="submit" variant="primary" disabled={creating}>
          {creating ? "Creando…" : "Crear equipo"}
        </Button>
      </form>

      {teams.length > 0 && (
        <TableToolbar>
          <div style={{ flex: "1 1 240px", minWidth: 200 }}>
            <Input
              type="search"
              value={q}
              placeholder="Buscar por nombre o manager…"
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar equipos"
            />
          </div>
          {q && (
            <span style={{ color: cssVar.textDim, fontSize: font.size.sm }}>
              {filteredTeams.length} de {teams.length}
            </span>
          )}
        </TableToolbar>
      )}

      <DataTable
        columns={columns}
        rows={filteredTeams}
        getKey={(t) => t.id}
        emptyTitle={q ? "Sin coincidencias" : "Sin equipos todavía"}
        emptyDescription={q ? "Ningún equipo coincide con la búsqueda actual." : "Crea el primer equipo usando el formulario de arriba."}
      />

      {unassigned > 0 && (
        <p style={{ marginTop: space[3], fontSize: font.size.sm, color: cssVar.textDim }}>
          {unassigned} miembro{unassigned === 1 ? "" : "s"} sin equipo asignado.
          Asigna desde <a href="/admin/members" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>Miembros</a>.
        </p>
      )}
    </>
  );
}

const labelStyle = {
  display: "block", fontSize: 12, color: "var(--bi-text-dim)",
  fontWeight: 600, marginBottom: 4,
};
