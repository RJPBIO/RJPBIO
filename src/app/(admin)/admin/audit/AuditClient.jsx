"use client";
import { useMemo, useState } from "react";
import { DataTable, TableToolbar } from "@/components/ui/Table";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { AUDIT_CATEGORIES, isInCategory, countByCategory } from "@/lib/audit-categories";
// Sprint 28 — Stripe-style search operators
import {
  parseSearchQuery, matchesQuery, highlightMatches, extractHighlightTerms,
  SEARCH_HINT_ES,
} from "@/lib/audit-search";

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

/* Sprint 28 — XSS-safe highlight component (no innerHTML). */
function Highlight({ text, terms }) {
  if (!terms?.length) return text || "";
  const parts = highlightMatches(String(text || ""), terms);
  return parts.map((p, i) =>
    p.match
      ? <mark key={i} style={{ background: "rgba(245, 158, 11, 0.35)", color: "inherit", padding: 0 }}>{p.text}</mark>
      : <span key={i}>{p.text}</span>
  );
}

export default function AuditClient({ rows, chain }) {
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const actions = useMemo(() => Array.from(new Set(rows.map((r) => r.action))).sort(), [rows]);
  const categoryCounts = useMemo(() => countByCategory(rows), [rows]);

  // Sprint 28 — parser Stripe-style: actor:x action:y.* payload:z plain text
  const parsedQuery = useMemo(() => parseSearchQuery(q), [q]);
  const highlightTerms = useMemo(() => extractHighlightTerms(parsedQuery), [parsedQuery]);

  const filtered = useMemo(() => {
    const fromTs = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const toTs   = toDate   ? new Date(toDate   + "T23:59:59.999").getTime() : null;
    return rows.filter((r) => {
      if (category && !isInCategory(r.action, category)) return false;
      if (action && r.action !== action) return false;
      const ts = new Date(r.ts).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      // Sprint 28 — search v2 con operadores + payload-aware
      return matchesQuery(r, parsedQuery);
    });
  }, [rows, parsedQuery, action, category, fromDate, toDate]);

  const hasFilters = Boolean(q || action || category || fromDate || toDate);
  const clearFilters = () => { setQ(""); setAction(""); setCategory(""); setFromDate(""); setToDate(""); setPage(0); };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE);

  const columns = [
    { key: "ts",     label: "Fecha",   width: 180, render: (r) => new Date(r.ts).toLocaleString() },
    { key: "actor",  label: "Actor",   render: (r) => <Highlight text={r.actorEmail || r.actorId || "—"} terms={highlightTerms} /> },
    { key: "action", label: "Acción",  render: (r) => <code style={{ color: cssVar.accent, fontFamily: cssVar.fontMono, fontSize: font.size.sm }}><Highlight text={r.action} terms={highlightTerms} /></code> },
    { key: "target", label: "Target",  render: (r) => <Highlight text={r.target || "—"} terms={highlightTerms} /> },
    { key: "ip",     label: "IP",      render: (r) => <Highlight text={r.ip || "—"} terms={highlightTerms} /> },
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
          <Button onClick={() => download(`audit-${fmtDate(new Date())}.csv`, toCSV(filtered))} variant="secondary" size="sm" disabled={filtered.length === 0}>Exportar CSV</Button>
          <Button onClick={() => download(`audit-${fmtDate(new Date())}.json`, JSON.stringify(filtered, null, 2), "application/json")} variant="secondary" size="sm" disabled={filtered.length === 0}>Exportar JSON</Button>
        </div>
      </header>

      {/* Quickfilter chips por categoría — un click filtra todos los
          eventos de auth/billing/sso/etc. Visualmente prominente arriba
          del toolbar de búsqueda. Compliance officers + auditors STPS
          pueden navegar el log por workflow sin teclear regex. */}
      <div
        role="toolbar"
        aria-label="Filtros rápidos por categoría"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: space[2],
          marginBlockEnd: space[3],
          paddingBlock: space[2],
          borderBlockStart: `1px dashed ${cssVar.border}`,
          borderBlockEnd: `1px dashed ${cssVar.border}`,
        }}
      >
        <CategoryChip
          id=""
          label="Todas"
          count={rows.length}
          active={category === ""}
          onClick={() => { setCategory(""); setPage(0); }}
        />
        {AUDIT_CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.id}
            id={cat.id}
            label={cat.label}
            count={categoryCounts[cat.id] || 0}
            active={category === cat.id}
            onClick={() => { setCategory(category === cat.id ? "" : cat.id); setPage(0); }}
            title={cat.description}
          />
        ))}
        {(categoryCounts.other || 0) > 0 && (
          <CategoryChip
            id="other"
            label="Otros"
            count={categoryCounts.other || 0}
            active={false}
            onClick={() => { setCategory(""); setPage(0); }}
            title="Eventos sin categoría conocida"
            disabled
          />
        )}
      </div>

      <TableToolbar>
        <div style={{ flex: "1 1 240px", minWidth: 200 }}>
          <Input
            type="search" value={q} placeholder={SEARCH_HINT_ES}
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
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} aria-label="Limpiar filtros">
            Limpiar filtros
          </Button>
        )}
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

/* Chip pill — pressed state para feedback visual del filtro activo.
   Disabled para "Otros" (informational, no clickable). */
function CategoryChip({ label, count, active, onClick, title, disabled }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-pressed={active}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        paddingBlock: 6,
        paddingInline: 12,
        borderRadius: 99,
        background: active ? cssVar.accent : cssVar.surface,
        color: active ? cssVar.accentInk : disabled ? cssVar.textDim : cssVar.text,
        border: `1px solid ${active ? cssVar.accent : cssVar.border}`,
        fontSize: font.size.xs,
        fontWeight: active ? font.weight.bold : font.weight.semibold,
        letterSpacing: 0.3,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        textTransform: "uppercase",
        transition: "all .15s ease",
      }}
    >
      {label}
      <span
        aria-hidden="true"
        style={{
          fontFamily: cssVar.fontMono,
          fontWeight: font.weight.bold,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: 0,
          fontSize: 10,
          opacity: 0.85,
        }}
      >
        {count}
      </span>
    </button>
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
