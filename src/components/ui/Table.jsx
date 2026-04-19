"use client";
import { cssVar, radius, space, font } from "./tokens";

/**
 * DataTable — tabla tokenizada con sticky header, empty/loading states y
 * celdas alineables. Recibe `columns` (label, key, render?, align?, width?) y
 * `rows`. Si `loading`, pinta skeleton rows. Si vacío y no loading, muestra
 * `emptyTitle` + `emptyDescription` + `emptyAction`.
 */
export function DataTable({
  columns = [],
  rows = [],
  loading = false,
  skeletonRows = 6,
  getKey = (r, i) => r?.id || i,
  onRowClick,
  emptyTitle = "Nada que mostrar",
  emptyDescription,
  emptyAction,
  dense = false,
  zebra = true,
}) {
  const headStyle = {
    position: "sticky", top: 0, zIndex: 1,
    background: cssVar.surface2,
    borderBottom: `1px solid ${cssVar.border}`,
    padding: `${space[2]}px ${space[3]}px`,
    textAlign: "left",
    color: cssVar.textMuted,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    textTransform: "uppercase",
    letterSpacing: font.tracking.caps,
    whiteSpace: "nowrap",
  };
  const cellPad = dense ? `${space[2]}px ${space[3]}px` : `${space[3]}px ${space[3]}px`;

  const isEmpty = !loading && rows.length === 0;

  return (
    <div
      className="bi-table-wrap"
      style={{
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        background: cssVar.surface,
        overflow: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 560 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{ ...headStyle, textAlign: c.align || "left", width: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: skeletonRows }).map((_, i) => (
            <tr key={`sk-${i}`}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: cellPad, borderBottom: `1px solid ${cssVar.border}` }}>
                  <span className="bi-skeleton" style={{
                    display: "inline-block", width: `${40 + ((i * 7 + c.key.length) % 40)}%`, height: 12,
                    borderRadius: radius.sm,
                    background: `linear-gradient(90deg, ${cssVar.surface2} 0%, ${cssVar.border} 50%, ${cssVar.surface2} 100%)`,
                    backgroundSize: "200% 100%",
                    animation: "bi-shimmer 1.4s ease-in-out infinite",
                  }} />
                </td>
              ))}
            </tr>
          ))}

          {!loading && rows.map((r, i) => (
            <tr
              key={getKey(r, i)}
              onClick={onRowClick ? () => onRowClick(r, i) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
              aria-label={onRowClick && r?.ariaLabel ? r.ariaLabel : undefined}
              className={onRowClick ? "bi-table-row-clickable" : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(r, i); } } : undefined}
              style={{
                background: zebra && i % 2 === 1 ? cssVar.surface2 : "transparent",
                cursor: onRowClick ? "pointer" : "default",
                transition: "background .12s ease",
              }}
            >
              {columns.map((c) => (
                <td key={c.key} style={{
                  padding: cellPad, borderBottom: `1px solid ${cssVar.border}`,
                  color: cssVar.text, fontSize: font.size.md, textAlign: c.align || "left",
                  verticalAlign: "middle",
                }}>
                  {c.render ? c.render(r, i) : r[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}

          {isEmpty && (
            <tr>
              <td colSpan={columns.length} style={{ padding: space[8], textAlign: "center" }}>
                <div style={{ display: "inline-flex", flexDirection: "column", gap: space[3], alignItems: "center", color: cssVar.textMuted }}>
                  <span aria-hidden style={{
                    width: 48, height: 48, borderRadius: radius.full,
                    background: `radial-gradient(closest-side, var(--bi-accent) 0%, transparent 70%)`,
                    opacity: 0.25,
                  }} />
                  <div style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>{emptyTitle}</div>
                  {emptyDescription && <div style={{ fontSize: font.size.sm, color: cssVar.textMuted, maxWidth: 320, lineHeight: font.leading.normal }}>{emptyDescription}</div>}
                  {emptyAction && <div style={{ marginTop: space[2] }}>{emptyAction}</div>}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TableToolbar({ children, style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: space[3], flexWrap: "wrap",
      padding: `${space[3]}px 0`,
      ...style,
    }}>
      {children}
    </div>
  );
}
