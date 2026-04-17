/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — THEME RESOLVER
   ═══════════════════════════════════════════════════════════════
   Clinical precision instrument.
   Typography presets tuned for NEJM-level sobriety.
   Metrics: weight 300 + wide tracking = precision, not weight.
   ═══════════════════════════════════════════════════════════════ */

import { dark, light, brand, semantic, alpha, font, space, radius, shadow, z, layout, timer, duration, easing } from "./tokens";

export function resolveTheme(isDark) {
  const palette = isDark ? dark : light;
  return {
    bg: palette.bg,
    card: palette.card,
    surface: palette.surface,
    border: palette.border,
    t1: palette.text.primary,
    t2: palette.text.secondary,
    t3: palette.text.muted,
    overlay: palette.overlay,
    glass: palette.glass,
    scrim: isDark ? "rgba(12,15,20,.72)" : "rgba(10,14,20,.48)",
    brand: brand.primary,
    isDark,
  };
}

export { brand, semantic, alpha, font, space, radius, shadow, z, layout, timer, duration, easing };

export function withAlpha(hex, pct) {
  return hex + (alpha[pct] || alpha[10]);
}

// Hairline border — 0.5px is the clinical specification
export function hairline(isDark) {
  return isDark ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(10,14,20,0.08)";
}

// ─── Typography Presets ──────────────────────────────────
// Clinical instrument specification.
// Two weights per screen maximum.

export const ty = {
  /**
   * UPPERCASE LABEL — section headers, metric names, categories.
   * 10–11px · 600 · tracking 0.12em · UPPERCASE.
   * The ONLY uppercase usage in the system.
   */
  label: (color) => ({
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.caps,
    color,
    textTransform: "uppercase",
  }),

  /**
   * LARGE METRIC — the soul of the system.
   * Weight 300 + wide tracking. Lightness communicates precision.
   * Minimum 48px for the primary metric per screen.
   */
  metric: (color, size = font.size["3xl"]) => ({
    fontSize: size,
    fontWeight: font.weight.light,
    color,
    fontFamily: font.family,
    letterSpacing: "-0.01em",
    lineHeight: font.leading.none,
    fontVariantNumeric: "tabular-nums",
  }),

  /**
   * METRIC SMALL — secondary data points.
   * Still light weight — consistency of the instrument.
   */
  metricSm: (color, size = font.size.xl) => ({
    fontSize: size,
    fontWeight: font.weight.light,
    color,
    letterSpacing: "-0.01em",
    lineHeight: font.leading.none,
    fontVariantNumeric: "tabular-nums",
  }),

  /**
   * TITLE — card titles, protocol names, action labels.
   * Medium weight — readable without warmth.
   */
  title: (color) => ({
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
    color,
    letterSpacing: font.tracking.tight,
  }),

  /**
   * BODY — descriptions, instructions that aren't session phase text.
   * 15px / 400 / leading 1.6 — NEJM-grade body.
   */
  body: (color) => ({
    fontSize: font.size.md,
    fontWeight: font.weight.normal,
    color,
    lineHeight: font.leading.relaxed,
  }),

  /**
   * INSTRUCTION — session phase text.
   * 20–24px · weight 300 · wider tracking · centered.
   * Induces calm by form before content.
   */
  instruction: (color) => ({
    fontSize: font.size.xl,
    fontWeight: font.weight.light,
    color,
    letterSpacing: font.tracking.wide,
    lineHeight: font.leading.snug,
    textAlign: "center",
  }),

  /**
   * CAPTION — timestamps, metadata, secondary info.
   */
  caption: (color) => ({
    fontSize: font.size.sm,
    fontWeight: font.weight.normal,
    color,
    lineHeight: font.leading.snug,
  }),

  /**
   * HEADING — screen and sheet titles.
   * Light weight. Precision over weight.
   */
  heading: (color) => ({
    fontSize: font.size.xl,
    fontWeight: font.weight.light,
    color,
    letterSpacing: font.tracking.tight,
    lineHeight: font.leading.tight,
  }),

  /**
   * HERO HEADING — screen hero titles.
   */
  heroHeading: (color) => ({
    fontSize: font.size["2xl"],
    fontWeight: font.weight.light,
    color,
    letterSpacing: font.tracking.tight,
    lineHeight: font.leading.tight,
  }),

  /**
   * BUTTON — CTA labels.
   * 13px · 600 · tracking 0.12em · UPPERCASE.
   */
  button: {
    fontSize: font.size.base,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.caps,
    textTransform: "uppercase",
  },

  /**
   * BUTTON SM — secondary buttons and links.
   */
  buttonSm: {
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.wider,
    textTransform: "uppercase",
  },

  /**
   * BADGE — small inline tags.
   */
  badge: (color, bg) => ({
    fontSize: font.size.xs,
    fontWeight: font.weight.semibold,
    letterSpacing: font.tracking.wide,
    color,
    background: bg,
    padding: "2px 6px",
    borderRadius: radius.sm,
    textTransform: "uppercase",
  }),
};
