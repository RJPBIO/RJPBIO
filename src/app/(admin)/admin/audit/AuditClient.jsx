"use client";
import { useMemo, useState } from "react";

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

  return (
    <>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Auditoría</h1>
          <p style={{ fontSize: 13, margin: "4px 0 0", color: chain.ok ? "#10B981" : "#EF4444" }}>
            {chain.ok ? `● Hash chain verificado · ${chain.entries} entradas` : `● Hash chain ROTO en ${chain.brokenAt}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => download(`audit-${fmtDate(new Date())}.csv`, toCSV(filtered))} style={btnGhost}>Exportar CSV</button>
          <button onClick={() => download(`audit-${fmtDate(new Date())}.json`, JSON.stringify(filtered, null, 2), "application/json")} style={btnGhost}>Exportar JSON</button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
        <input
          type="search" placeholder="Buscar actor, acción, target, IP…"
          value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
          style={input}
        />
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} style={input}>
          <option value="">Todas las acciones</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} style={input} aria-label="Desde" />
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} style={input} aria-label="Hasta" />
      </div>

      <p style={{ fontSize: 12, color: "#6EE7B7", marginTop: 8 }}>
        {filtered.length} de {rows.length} entradas
      </p>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6EE7B7", border: "1px dashed #064E3B", borderRadius: 12 }}>
          Sin entradas que coincidan.
        </div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#6EE7B7" }}>
                <th style={th}>Fecha</th>
                <th style={th}>Actor</th>
                <th style={th}>Acción</th>
                <th style={th}>Target</th>
                <th style={th}>IP</th>
                <th style={th}>Hash</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => (
                <tr
                  key={String(r.id)}
                  onClick={() => setSelected(r)}
                  style={{ cursor: "pointer", borderBlockStart: "1px solid #064E3B" }}
                >
                  <td style={td}>{new Date(r.ts).toLocaleString()}</td>
                  <td style={td}>{r.actorEmail || r.actorId || "—"}</td>
                  <td style={td}><code style={{ color: "#A7F3D0" }}>{r.action}</code></td>
                  <td style={td}>{r.target || "—"}</td>
                  <td style={td}>{r.ip || "—"}</td>
                  <td style={td} title={r.hash}><code>{r.hash?.slice(0, 10)}…</code></td>
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

      {selected && (
        <div
          role="dialog" aria-modal="true" aria-label="Detalle de evento"
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(680px, 100%)", maxHeight: "80vh", overflow: "auto", padding: 24, background: "#0B0E14", border: "1px solid #064E3B", borderRadius: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Evento auditado</h2>
              <button onClick={() => setSelected(null)} style={{ ...btnGhost, padding: "4px 10px" }}>Cerrar</button>
            </div>
            <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "6px 14px", fontSize: 13 }}>
              <dt style={dt}>Fecha</dt><dd style={dd}>{new Date(selected.ts).toISOString()}</dd>
              <dt style={dt}>Acción</dt><dd style={dd}><code>{selected.action}</code></dd>
              <dt style={dt}>Actor</dt><dd style={dd}>{selected.actorEmail || selected.actorId || "—"}</dd>
              <dt style={dt}>Target</dt><dd style={dd}>{selected.target || "—"}</dd>
              <dt style={dt}>IP</dt><dd style={dd}>{selected.ip || "—"}</dd>
              <dt style={dt}>Hash</dt><dd style={{ ...dd, wordBreak: "break-all" }}><code>{selected.hash}</code></dd>
              {selected.prevHash && (<><dt style={dt}>Hash anterior</dt><dd style={{ ...dd, wordBreak: "break-all" }}><code>{selected.prevHash}</code></dd></>)}
              {selected.meta && (<><dt style={dt}>Metadata</dt><dd style={dd}><pre style={{ margin: 0, fontSize: 11, color: "#A7F3D0", background: "#052E16", padding: 10, borderRadius: 6, overflow: "auto" }}>{JSON.stringify(selected.meta, null, 2)}</pre></dd></>)}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}

const input = { padding: "10px 12px", borderRadius: 10, background: "#052E16", color: "#ECFDF5", border: "1px solid #064E3B", fontSize: 13 };
const btnGhost = { ...input, background: "transparent", cursor: "pointer", fontWeight: 600 };
const th = { padding: "8px 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 };
const td = { padding: "8px 10px" };
const dt = { color: "#6EE7B7", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 };
const dd = { margin: 0, color: "#ECFDF5" };
