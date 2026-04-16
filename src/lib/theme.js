/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — THEME RESOLVER
   ═══════════════════════════════════════════════════════════════
   Resolves design tokens into concrete theme values.
   Replaces all duplicated isDark ternaries across components.
   ═══════════════════════════════════════════════════════════════ */

import { dark, light, brand, alpha, font, space, radius, shadow, z, layout, timer, duration } from "./tokens";

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
export { brand, alpha, font, space, radius, shadow, z, layout, timer, duration };

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

/**
 * Label style preset — the uppercase tracking pattern used everywhere.
 * Returns a style object for spread.
 */
export function labelStyle(color, size = font.size.sm) {
  return {
    fontSize: size,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.caps,
    color,
    textTransform: "uppercase",
  };
}

/**
 * Metric value style preset.
 */
export function metricStyle(color, size = font.size["2xl"]) {
  return {
    fontSize: size,
    fontWeight: font.weight.black,
    color,
    fontFamily: font.family,
    letterSpacing: "-1px",
  };
}
