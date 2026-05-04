/* SectionHeader — Phase 6F SP-D
   Reusable header para cada panel del reporte ejecutivo.
   Server component (no hooks, no recharts). Tokens admin.
   ADN: eyebrow uppercase mono cyan letterspace 0.18em, title light, subtitle muted. */

import { cssVar, font, space, bioSignal } from "@/components/ui/tokens";

export default function SectionHeader({ eyebrow, title, subtitle, italic }) {
  return (
    <header data-v2-section-header style={{
      display: "flex",
      flexDirection: "column",
      gap: space[1],
      marginBlockEnd: space[3],
    }}>
      {eyebrow && (
        <div
          style={{
            fontFamily: cssVar.fontMono,
            fontSize: font.size.xs,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: bioSignal.phosphorCyanInk,
            fontWeight: font.weight.semibold,
          }}
        >
          {eyebrow}
        </div>
      )}
      {title && (
        <h2
          style={{
            fontSize: font.size.xl,
            fontWeight: font.weight.bold,
            letterSpacing: font.tracking.tight,
            lineHeight: 1.1,
            margin: 0,
            color: cssVar.text,
          }}
        >
          {italic && (
            <span className="bi-admin-h1-italic" style={{ marginInlineEnd: ".25em" }}>
              {italic}
            </span>
          )}
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          style={{
            fontSize: font.size.sm,
            color: cssVar.textMuted,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
