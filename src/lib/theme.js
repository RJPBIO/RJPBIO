/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — THEME RESOLVER
   ═══════════════════════════════════════════════════════════════
   Resolves design tokens into concrete theme values.
   Replaces all duplicated isDark ternaries across components.
   ═══════════════════════════════════════════════════════════════ */

import { dark, light, brand, semantic, alpha, font, space, radius, shadow, z, layout, timer, duration } from "./tokens";

/**
 * Resolve theme colors for current mode.
 * Call once per component, destructure what you need.
 *
 * @param {boolean} isDark
 * @returns {object} Resolved theme object
 */
export function resolveTheme(isDark) {
  const palette = isDark ? dark : light;

  return {
    // ─── Surface colors ───────────────────────────────
    bg: palette.bg,
    card: palette.card,
    surface: palette.surface,
    border: palette.border,

    // ─── Text colors ──────────────────────────────────
    t1: palette.text.primary,
    t2: palette.text.secondary,
    t3: palette.text.muted,

    // ─── Overlays ─────────────────────────────────────
    overlay: palette.overlay,
    glass: palette.glass,
    scrim: isDark ? "rgba(15,23,42,.3)" : "rgba(15,23,42,.15)",

    // ─── Brand (fixed, never changes) ─────────────────
    brand: brand.primary,

    // ─── isDark passthrough for edge cases ─────────────
    isDark,
  };
}

// Re-export tokens for direct access alongside theme
export { brand, semantic, alpha, font, space, radius, shadow, z, layout, timer, duration };

/**
 * Apply alpha to any hex color.
 * Usage: withAlpha("#059669", 20)  → "#05966933"
 *
 * @param {string} hex - Base color (6-char hex)
 * @param {number} pct - Alpha percentage (key from alpha scale)
 * @returns {string} Color with alpha suffix
 */
export function withAlpha(hex, pct) {
  return hex + (alpha[pct] || alpha[10]);
}

/**
 * Generate a subtle gradient for cards.
 * @param {string} base - Card background
 * @param {string} accent - Accent color
 * @param {boolean} isDark
 */
export function cardGradient(base, accent, isDark) {
  return `linear-gradient(145deg, ${base}, ${accent}${isDark ? "08" : "04"})`;
}

// ─── Typography Presets ──────────────────────────────────
// Recurring patterns formalized as spreadable style objects.
// Usage: <div style={{ ...ty.label(t3), marginBottom: 8 }}>

export const ty = {
  /**
   * UPPERCASE LABEL — section headers, badge text, category names.
   * The most overused pattern in the app. Now consistent everywhere.
   * Before: fontSize:10, fontWeight:800, letterSpacing:2-3, textTransform:"uppercase"
   */
  label: (color) => ({
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.caps,
    color,
    textTransform: "uppercase",
  }),

  /**
   * LARGE METRIC — hero numbers, scores, percentages.
   * Before: fontSize:18-34, fontWeight:800, letterSpacing:"-1px"/"-2px"
   */
  metric: (color, size = font.size["2xl"]) => ({
    fontSize: size,
    fontWeight: font.weight.black,
    color,
    fontFamily: font.family,
    letterSpacing: font.tracking.tight,
  }),

  /**
   * CARD TITLE — protocol names, section titles, action labels.
   * Before: fontSize:11-13, fontWeight:700
   */
  title: (color) => ({
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color,
  }),

  /**
   * BODY — descriptions, instructions, phase text.
   * Before: fontSize:11-12, fontWeight:400-500, lineHeight:1.5-1.7
   */
  body: (color) => ({
    fontSize: font.size.base,
    fontWeight: font.weight.normal,
    color,
    lineHeight: font.leading.relaxed,
  }),

  /**
   * CAPTION — timestamps, secondary info, small badges.
   * Before: fontSize:9-10, fontWeight:600, color:t3
   */
  caption: (color) => ({
    fontSize: font.size.sm,
    fontWeight: font.weight.semibold,
    color,
    lineHeight: font.leading.snug,
  }),

  /**
   * HEADING — sheet titles, modal headers.
   * Before: fontSize:15-18, fontWeight:800
   */
  heading: (color) => ({
    fontSize: font.size.xl,
    fontWeight: font.weight.black,
    color,
  }),

  /**
   * HERO HEADING — page titles, big celebration text.
   * Before: fontSize:18-20, fontWeight:800
   */
  heroHeading: (color) => ({
    fontSize: font.size["2xl"],
    fontWeight: font.weight.black,
    color,
    letterSpacing: font.tracking.tight,
  }),

  /**
   * BADGE — small inline tags (último, IA recomienda).
   * Before: fontSize:10, fontWeight:700, padding:"1px 5px"
   */
  badge: (color, bg) => ({
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    color,
    background: bg,
    padding: "1px 6px",
    borderRadius: radius.sm / 2,
  }),

  /**
   * BUTTON — CTA labels, action text.
   * Before: fontSize:10-11, fontWeight:800, letterSpacing:2, textTransform:"uppercase"
   */
  button: {
    fontSize: font.size.base,
    fontWeight: font.weight.black,
    letterSpacing: font.tracking.widest,
    textTransform: "uppercase",
  },
};
