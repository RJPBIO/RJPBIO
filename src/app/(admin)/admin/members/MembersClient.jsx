"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/Toast";
import { DataTable, TableToolbar } from "@/components/ui/Table";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/admin/PageHeader";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const PAGE = 25;

function HeaderCheckbox({ checked, indeterminate, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label="Seleccionar todos en esta página"
      aria-checked={indeterminate ? "mixed" : checked}
      style={{ accentColor: "var(--bi-accent)" }}
    />
  );
}

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

const ROLE_VARIANT = { OWNER: "warn", ADMIN: "danger", MANAGER: "accent", MEMBER: "success", VIEWER: "soft" };

async function getCsrfToken() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

export default function MembersClient({ initialRows, pendingInvites = [], orgId }) {
  const [rows] = useState(initialRows);
  const [pending, setPending] = useState(pendingInvites);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("ALL");
  const [statusF, setStatusF] = useState("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const [busyToken, setBusyToken] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Sprint 36 — Cmd+K action: ?action=invite auto-opens invite form
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("action") === "invite") setInviteOpen(true);
  }, [searchParams]);

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

  const selectedInSlice = slice.reduce((acc, r) => acc + (selected.has(r.id) ? 1 : 0), 0);
  const allChecked = slice.length > 0 && selectedInSlice === slice.length;
  const someChecked = selectedInSlice > 0 && selectedInSlice < slice.length;
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

  async function revokeInvite(token) {
    if (!confirm("¿Revocar esta invitación? El link dejará de funcionar.")) return;
    setBusyToken(token);
    try {
      const csrf = await getCsrfToken();
      const r = await fetch(`/api/v1/invitations/${token}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrf },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      setPending((p) => p.filter((inv) => inv.token !== token));
      toast.success("Invitación revocada");
    } catch (err) {
      toast.error(err?.message || "No se pudo revocar");
    } finally { setBusyToken(null); }
  }

  async function resendInvite(token) {
    setBusyToken(token);
    try {
      const csrf = await getCsrfToken();
      const r = await fetch(`/api/v1/invitations/${token}/resend`, {
        method: "POST",
        headers: { "x-csrf-token": csrf },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (r.status === 429) throw new Error("Demasiados reenvíos — espera unas horas");
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = await r.json();
      // Actualizar expiresAt local con el nuevo del server
      setPending((p) => p.map((inv) =>
        inv.token === token ? { ...inv, expiresAt: j.expiresAt } : inv
      ));
      toast.success("Invitación reenviada");
    } catch (err) {
      toast.error(err?.message || "No se pudo reenviar");
    } finally { setBusyToken(null); }
  }

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
      const skippedTotal = j.skipped && typeof j.skipped === "object"
        ? Object.values(j.skipped).reduce((a, n) => a + (Number(n) || 0), 0)
        : Number(j.skipped) || 0;
      const skipMsg = skippedTotal ? ` · ${skippedTotal} omitidas` : "";
      toast.success(`${j.invited} invitación(es) enviadas${skipMsg}`);
      e.currentTarget.reset();
      setInviteOpen(false);
      // Reload para refresh server-fetched pending invitations.
      // Alternativa: client-side refetch — pero evita drift con server.
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      toast.error(err.message || "No se pudo invitar");
    } finally { setBusy(false); }
  }

  const ACTION_CONFIRM = {
    remove: (n) => `¿Eliminar ${n} miembro(s)? Perderán acceso inmediatamente. Los datos de sesión se conservan según tu política de retención.`,
  };
  async function bulkAction(action) {
    if (!selected.size) return;
    const msg = ACTION_CONFIRM[action]?.(selected.size) || `¿${action} a ${selected.size} miembro(s)?`;
    if (!confirm(msg)) return;
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

  const columns = [
    {
      key: "__check", label: (
        <HeaderCheckbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} />
      ), width: 40,
      render: (r) => (
        <input
          type="checkbox"
          checked={selected.has(r.id)}
          onChange={() => toggle(r.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Seleccionar ${r.email}`}
          style={{ accentColor: "var(--bi-accent)" }}
        />
      ),
    },
    { key: "email", label: "Email", render: (r) => <span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.text }}>{r.email}</span> },
    { key: "name",  label: "Nombre", render: (r) => r.name || "—" },
    { key: "role",  label: "Rol", width: 120, render: (r) => <Badge variant={ROLE_VARIANT[r.role] || "soft"} size="sm">{r.role}</Badge> },
    { key: "createdAt", label: "Desde", width: 140, render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: "scim",  label: "SCIM", width: 80, render: (r) => r.scimId ? <Badge variant="success" size="sm">✓</Badge> : "—" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Personas · roster"
        italic="Tu"
        title="equipo."
        subtitle={`${filtered.length} de ${rows.length} miembros visibles.`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setInviteOpen((v) => !v)}>
              {inviteOpen ? "Cerrar invitación" : "Invitar miembros"}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => download(`members-${Date.now()}.csv`, toCSV(filtered))}>
              Exportar CSV
            </Button>
          </>
        }
      />

      {inviteOpen && (
        <form
          onSubmit={bulkInvite}
          style={{
            display: "grid", gap: space[3], padding: space[4],
            background: cssVar.surface2, borderRadius: radius.md, border: `1px solid ${cssVar.border}`,
            marginBottom: space[4],
          }}
        >
          <label style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: font.size.sm, color: cssVar.textDim, fontWeight: font.weight.semibold, marginBottom: space[1] }}>Correos</span>
            <Textarea
              name="emails" required rows={3}
              placeholder="Pega una lista de correos separados por coma, espacio o salto de línea"
              style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm }}
            />
          </label>
          <div style={{ display: "flex", gap: space[2], alignItems: "flex-end" }}>
            <div style={{ flex: "0 0 180px" }}>
              <span style={{ display: "block", fontSize: font.size.sm, color: cssVar.textDim, fontWeight: font.weight.semibold, marginBottom: space[1] }}>Rol</span>
              <Select name="role" defaultValue="MEMBER">
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </Select>
            </div>
            <Button type="submit" variant="primary" loading={busy} loadingLabel="Enviando…">
              Enviar invitaciones
            </Button>
          </div>
        </form>
      )}

      {/* Invitaciones pendientes — sección visible cuando hay pendientes,
          se oculta al estar vacío. Cada fila tiene Resend + Revoke. */}
      {pending.length > 0 && (
        <section
          aria-labelledby="pending-heading"
          style={{
            marginBlockEnd: space[4],
            padding: space[4],
            borderRadius: radius.md,
            border: `1px dashed ${cssVar.border}`,
            background: cssVar.surface2,
          }}
        >
          <h2
            id="pending-heading"
            style={{
              margin: 0,
              fontSize: font.size.xs,
              fontWeight: font.weight.bold,
              color: cssVar.textDim,
              textTransform: "uppercase",
              letterSpacing: font.tracking.caps,
              marginBlockEnd: space[3],
            }}
          >
            Invitaciones pendientes ({pending.length})
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
            {pending.map((inv) => {
              const expiresAt = new Date(inv.expiresAt);
              const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));
              const isExpired = daysLeft === 0;
              const isBusy = busyToken === inv.token;
              return (
                <li
                  key={inv.token}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: space[3],
                    padding: `${space[2]}px ${space[3]}px`,
                    borderRadius: radius.sm,
                    background: cssVar.surface,
                    border: `1px solid ${cssVar.border}`,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 240px", minInlineSize: 0 }}>
                    <div style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.text, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {inv.email}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: space[2], marginBlockStart: 2, fontSize: font.size.xs, color: cssVar.textMuted }}>
                      <Badge variant={ROLE_VARIANT[inv.role] || "soft"} size="sm">{inv.role}</Badge>
                      <span>
                        {isExpired ? "Expirada" : `Expira en ${daysLeft}d`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: space[2], flexShrink: 0 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resendInvite(inv.token)}
                      disabled={isBusy}
                      loading={isBusy}
                      loadingLabel="Reenviando…"
                    >
                      Reenviar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => revokeInvite(inv.token)}
                      disabled={isBusy}
                    >
                      Revocar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <TableToolbar>
        <div style={{ flex: "1 1 240px", minWidth: 200 }}>
          <Input type="search" value={q} placeholder="Buscar por email o nombre…"
            onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select value={roleF} onChange={(e) => { setRoleF(e.target.value); setPage(0); }} aria-label="Rol">
            <option value="ALL">Todos los roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
          </Select>
        </div>
        <div style={{ minWidth: 200 }}>
          <Select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(0); }} aria-label="Provisionamiento">
            <option value="ALL">Todos</option>
            <option value="SCIM">Sincronizados (SCIM)</option>
            <option value="MANUAL">Manuales (no SCIM)</option>
          </Select>
        </div>
      </TableToolbar>

      {selected.size > 0 && (
        <div style={{
          display: "flex", gap: space[2], alignItems: "center",
          padding: space[3], background: cssVar.accentSoft,
          border: `1px solid ${cssVar.accent}`, borderRadius: radius.md,
          marginBottom: space[3],
        }}>
          <span style={{ fontWeight: font.weight.bold, color: cssVar.text }}>{selected.size} seleccionado(s)</span>
          <Button variant="danger" size="sm" onClick={() => bulkAction("remove")} loading={busy} loadingLabel="Eliminando…">Eliminar</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} disabled={busy} style={{ marginInlineStart: "auto" }}>Deseleccionar</Button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={slice}
        getKey={(r) => r.id}
        emptyTitle="Sin miembros"
        emptyDescription="No hay miembros que coincidan con los filtros actuales."
      />

      {pageCount > 1 && (
        <nav aria-label="Paginación" style={{ display: "flex", gap: space[2], justifyContent: "center", alignItems: "center", marginTop: space[4] }}>
          <Button size="sm" variant="ghost" onClick={() => setPage(0)}                                         disabled={page === 0}                 aria-label="Primera página">«</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(0, p - 1))}                 disabled={page === 0}                 aria-label="Página anterior">‹</Button>
          <span aria-live="polite" aria-atomic="true" style={{ color: cssVar.textDim, fontSize: font.size.sm, padding: `0 ${space[2]}px`, fontFamily: cssVar.fontMono }}>
            {page + 1} / {pageCount}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}     disabled={page >= pageCount - 1} aria-label="Página siguiente">›</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage(pageCount - 1)}                              disabled={page >= pageCount - 1} aria-label="Última página">»</Button>
        </nav>
      )}
    </>
  );
}
