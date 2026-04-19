"use client";
import { useMemo, useState } from "react";
import { DataTable, TableToolbar } from "@/components/ui/Table";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const PAGE = 50;

function toCSV(rows) {
  const header = ["ts", "actor", "action", "target", "ip", "hash"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [new Date(r.ts).toISOString(), r.actorEmail || r.actorId || "", r.action, r.target || "", r.ip || "", r.hash || ""]
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

function fmtDate(d) {
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AuditClient({ rows, chain }) {
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() + 86400000 : null;
    return rows.filter((r) => {
      if (action && r.action !== action) return false;
      const ts = new Date(r.ts).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      if (!needle) return true;
      const hay = `${r.actorEmail || ""} ${r.actorId || ""} ${r.action} ${r.target || ""} ${r.ip || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, action, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const columns = [
    { key: "ts",     label: "Fecha",   width: 180, render: (r) => new Date(r.ts).toLocaleString() },
    { key: "actor",  label: "Actor",   render: (r) => r.actorEmail || r.actorId || "—" },
    { key: "action", label: "Acción",  render: (r) => <code style={{ color: cssVar.accent, fontFamily: cssVar.fontMono, fontSize: font.size.sm }}>{r.action}</code> },
    { key: "target", label: "Target",  render: (r) => r.target || "—" },
    { key: "ip",     label: "IP",      render: (r) => r.ip || "—" },
    { key: "hash",   label: "Hash",    render: (r) => <code title={r.hash} style={{ fontFamily: cssVar.fontMono, color: cssVar.textDim, fontSize: font.size.sm }}>{r.hash?.slice(0, 10)}…</code> },
  ];

  return (
    <>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: space[4], flexWrap: "wrap", marginBottom: space[4] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, color: cssVar.text }}>Auditoría</h1>
          <div style={{ display: "inline-flex", alignItems: "center", gap: space[2], marginTop: space[1] }}>
            <Badge variant={chain.ok ? "success" : "danger"} size="sm">
              {chain.ok ? "Cadena verificada" : "Cadena ROTA"}
            </Badge>
            <span style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
              {chain.ok ? `${chain.entries} entradas` : `roto en ${chain.brokenAt}`}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: space[2] }}>
          <Button onClick={() => download(`audit-${fmtDate(new Date())}.csv`, toCSV(filtered))} variant="secondary" size="sm">Exportar CSV</Button>
          <Button onClick={() => download(`audit-${fmtDate(new Date())}.json`, JSON.stringify(filtered, null, 2), "application/json")} variant="secondary" size="sm">Exportar JSON</Button>
        </div>
      </header>

      <TableToolbar>
        <div style={{ flex: "1 1 240px", minWidth: 200 }}>
          <Input
            type="search" value={q} placeholder="Buscar actor, acción, target, IP…"
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} aria-label="Filtrar por acción">
            <option value="">Todas las acciones</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
        <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} aria-label="Desde" style={{ maxWidth: 160 }} />
        <Input type="date" value={toDate}   onChange={(e) => { setToDate(e.target.value); setPage(0); }}   aria-label="Hasta" style={{ maxWidth: 160 }} />
      </TableToolbar>

      <p style={{ fontSize: font.size.sm, color: cssVar.textMuted, margin: `0 0 ${space[3]}px` }}>
        {filtered.length} de {rows.length} entradas
      </p>

      <DataTable
        columns={columns}
        rows={slice}
        getKey={(r) => String(r.id)}
        onRowClick={(r) => setSelected(r)}
        emptyTitle="Sin entradas"
        emptyDescription="No hay eventos que coincidan con los filtros actuales."
      />

      {pageCount > 1 && (
        <nav aria-label="Paginación" style={{ display: "flex", gap: space[2], justifyContent: "center", alignItems: "center", marginTop: space[4] }}>
          <Button size="sm" variant="ghost" onClick={() => setPage(0)}                             disabled={page === 0}                 aria-label="Primera página">«</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(0, p - 1))}     disabled={page === 0}                 aria-label="Página anterior">‹</Button>
          <span aria-live="polite" aria-atomic="true" style={{ color: cssVar.textDim, fontSize: font.size.sm, padding: `0 ${space[2]}px`, fontFamily: cssVar.fontMono }}>
            {page + 1} / {pageCount}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} aria-label="Página siguiente">›</Button>
          <Button size="sm" variant="ghost" onClick={() => setPage(pageCount - 1)}                          disabled={page >= pageCount - 1} aria-label="Última página">»</Button>
        </nav>
      )}

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Evento auditado"
        description={selected ? new Date(selected.ts).toISOString() : undefined}
        size="lg"
        footer={<Button onClick={() => setSelected(null)} variant="secondary" size="sm">Cerrar</Button>}
      >
        {selected && (
          <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: `${space[2]}px ${space[3]}px`, margin: 0, fontSize: font.size.md }}>
            <DtDd label="Acción"><code style={{ fontFamily: cssVar.fontMono, color: cssVar.accent }}>{selected.action}</code></DtDd>
            <DtDd label="Actor">{selected.actorEmail || selected.actorId || "—"}</DtDd>
            <DtDd label="Target">{selected.target || "—"}</DtDd>
            <DtDd label="IP">{selected.ip || "—"}</DtDd>
            <DtDd label="Hash"><code style={{ fontFamily: cssVar.fontMono, wordBreak: "break-all" }}>{selected.hash}</code></DtDd>
            {selected.prevHash && <DtDd label="Hash anterior"><code style={{ fontFamily: cssVar.fontMono, wordBreak: "break-all" }}>{selected.prevHash}</code></DtDd>}
            {selected.meta && (
              <DtDd label="Metadata">
                <pre style={{
                  margin: 0, fontSize: font.size.sm, color: cssVar.textDim,
                  background: cssVar.surface2, padding: space[3], borderRadius: radius.sm,
                  border: `1px solid ${cssVar.border}`, overflow: "auto",
                }}>
                  {JSON.stringify(selected.meta, null, 2)}
                </pre>
              </DtDd>
            )}
          </dl>
        )}
      </Dialog>
    </>
  );
}

function DtDd({ label, children }) {
  return (
    <>
      <dt style={{ color: cssVar.textMuted, fontSize: font.size.xs, textTransform: "uppercase", letterSpacing: font.tracking.caps, fontWeight: font.weight.bold }}>{label}</dt>
      <dd style={{ margin: 0, color: cssVar.text }}>{children}</dd>
    </>
  );
}
