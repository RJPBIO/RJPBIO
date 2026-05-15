/* ═══════════════════════════════════════════════════════════════
   SectionKicker — hairline rule + mono caps label.
   ───────────────────────────────────────────────────────────────
   Shared section-intro primitive. Replaces the plain `<div style={
   kickerStyle}>{text}</div>` pattern that lived inline on each
   marketing page.

   El kicker pasa de texto suelto a un elemento compuesto: hairline
   rule + label mono. Es el detalle "diseñado" que usan Linear /
   Vercel / Stripe — pequeño, pero hace que cada intro de sección
   lea como intencional, no como texto por defecto.

   Props:
     children     — el texto del kicker (string)
     tone="ink"   — phosphorCyanInk (sobre fondo claro, WCAG-AA)
     tone="bright"— phosphorCyan (sobre darkframe)
     align="left" — sin centrar (variante editorial)
   ═══════════════════════════════════════════════════════════════ */

import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";

export default function SectionKicker({ children, tone = "ink", align = "center" }) {
  const color = tone === "bright" ? bioSignal.phosphorCyan : bioSignal.phosphorCyanInk;
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      marginBlockEnd: space[3],
      marginInline: align === "left" ? "0" : undefined,
    }}>
      <span aria-hidden style={{
        inlineSize: 22,
        blockSize: 1,
        background: color,
        opacity: 0.55,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: cssVar.fontMono,
        fontSize: font.size.xs,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        fontWeight: font.weight.bold,
      }}>
        {children}
      </span>
    </div>
  );
}
