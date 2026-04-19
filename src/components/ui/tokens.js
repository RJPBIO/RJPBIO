/* ═══════════════════════════════════════════════════════════════
   UI primitives · token adaptor
   ───────────────────────────────────────────────────────────────
   Server components no pueden leer prefers-color-scheme en SSR.
   Resolvemos colores vía variables CSS declaradas en globals.css
   (bloque .bi-surface*). Esto permite un solo render que responde
   a prefers-color-scheme y a la clase .theme-dark/.theme-light que
   ponga el ThemeToggle.

   Los hex que quedan aquí son solo brand + bio-signal — colores
   "semánticos" que no cambian con el tema.
   ═══════════════════════════════════════════════════════════════ */
import { brand, bioSignal, radius, space, font, shadow } from "@/lib/tokens";

export const cssVar = {
  bg:        "var(--bi-bg)",
  surface:   "var(--bi-surface)",
  surface2:  "var(--bi-surface-2)",
  border:    "var(--bi-border)",
  borderStrong: "var(--bi-border-strong)",
  text:      "var(--bi-text)",
  textDim:   "var(--bi-text-dim)",
  textMuted: "var(--bi-text-muted)",
  accent:    "var(--bi-accent)",
  accentSoft:"var(--bi-accent-soft)",
  accentInk: "var(--bi-accent-ink)",
  danger:    "var(--bi-danger)",
  warn:      "var(--bi-warn)",
  success:   "var(--bi-success)",
  focusRing: "var(--bi-focus-ring)",
  fontSans:  "var(--font-sans)",
  fontMono:  "var(--font-mono)",
};

export { brand, bioSignal, radius, space, font, shadow };
