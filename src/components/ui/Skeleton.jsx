/* ═══════════════════════════════════════════════════════════════
   SKELETON · loading placeholders
   ───────────────────────────────────────────────────────────────
   Compatible SSR (plain CSS, no JS). Respeta prefers-reduced-motion
   gracias a la regla declarada en globals.css.
   ═══════════════════════════════════════════════════════════════ */
import { radius } from "./tokens";

export function Skeleton({ width = "100%", height = 14, rounded, style = {}, ...rest }) {
  return (
    <span
      aria-hidden="true"
      className="bi-skeleton"
      style={{
        display: "inline-block",
        inlineSize: typeof width === "number" ? `${width}px` : width,
        blockSize: typeof height === "number" ? `${height}px` : height,
        borderRadius: rounded ?? radius.sm,
        background: "linear-gradient(90deg, var(--bi-surface) 0%, var(--bi-surface-2) 50%, var(--bi-surface) 100%)",
        backgroundSize: "200% 100%",
        animation: "bi-shimmer 1.2s ease-in-out infinite",
        ...style,
      }}
      {...rest}
    />
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "8px 6px" }}>
          <Skeleton height={12} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16 }}>
      <Skeleton height={18} width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={`${90 - i * 10}%`} />
      ))}
    </div>
  );
}
