"use client";
/* PrintButton — Phase 6F SP-D
   Único componente client del reporte ejecutivo. Dispara window.print().
   Aislado para que el resto del árbol pueda quedarse server-side
   (zero JS overhead). */

import { cssVar, font, radius, space, bioSignal } from "@/components/ui/tokens";

export default function PrintButton({ label = "Imprimir reporte" }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
      data-v2-print-button
      data-testid="report-print-button"
      style={{
        appearance: "none",
        background: bioSignal.phosphorCyan,
        color: "var(--bi-bg)",
        border: "none",
        borderRadius: radius.md,
        padding: `${space[3]}px ${space[4]}px`,
        fontFamily: cssVar.fontSans,
        fontSize: font.size.sm,
        fontWeight: font.weight.semibold,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
