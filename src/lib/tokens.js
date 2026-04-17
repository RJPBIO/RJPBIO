/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════
   Clinical precision instrument.
   Reference: Withings · Tesla dark · NEJM · elite lab report.
   No warmth. No decoration. Every value has a function.
   ═══════════════════════════════════════════════════════════════ */

// ─── Typography ──────────────────────────────────────────
// Single family. Precision sans-serif. Never rounded, never friendly.
// Numbers use weight 300 with wide tracking — lightness = precision.
export const font = {
  family: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",

  size: {
    xs: 10,
    sm: 11,
    base: 13,
    md: 15,
    lg: 17,
    xl: 20,
    "2xl": 24,
    "3xl": 32,
    "4xl": 40,
    hero: 56,
  },

  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 800,
  },

  leading: {
    none: 1,
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.7,
  },

  tracking: {
    tight: "-0.02em",
    normal: "0",
    wide: "0.04em",
    wider: "0.08em",
    widest: "0.12em",
    caps: "0.12em",   // uppercase labels — the only cap spec
  },
};

// ─── Spacing Scale ───────────────────────────────────────
// Discipline: more space than the competitors use.
// The value trades decoration for confidence.
export const space = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
};

// ─── Border Radius ───────────────────────────────────────
// Small and consistent. Large radii = toy. Small radii = instrument.
export const radius = {
  sm: 6,       // badges
  md: 10,      // buttons
  lg: 12,      // cards
  xl: 14,
  "2xl": 16,
  full: 9999,  // pills
};

// ─── Shadows ─────────────────────────────────────────────
// Elevation by contrast, not by shadow. Shadows used minimally.
export const shadow = {
  sm: "none",
  md: "none",
  lg: "none",
  glow: (color) => `0 0 0 1px ${color}20`,
};

// ─── Brand Colors ────────────────────────────────────────
// Teal — the color of ignition. Used with discipline.
// CTAs, active metrics, live session state only. Never decorative.
export const brand = {
  primary: "#0F766E",    // deep teal — clinical, refined
  secondary: "#6366F1",
  accent: "#0D9488",
};

// ─── Semantic Colors ─────────────────────────────────────
// Desaturated. Never aggressive. Same discipline as teal.
export const semantic = {
  success: "#0F766E",    // teal lineage
  warning: "#B45309",    // dark amber — never bright
  danger:  "#B91C1C",    // desaturated red — never agressive
  info:    "#6366F1",
};

// ─── Protocol Colors ─────────────────────────────────────
export const protoColor = {
  calma:   "#0F766E",
  enfoque: "#6366F1",
  energia: "#B45309",
  reset:   "#0D9488",
};

// ─── Opacity Scale ───────────────────────────────────────
export const alpha = {
  0:   "00",
  2:   "05",
  4:   "0A",
  6:   "0F",
  8:   "14",
  10:  "1A",
  12:  "1F",
  15:  "26",
  20:  "33",
  25:  "40",
  30:  "4D",
  40:  "66",
  50:  "80",
  60:  "99",
  70:  "B3",
  80:  "CC",
  90:  "E6",
  95:  "F2",
  100: "FF",
};

// ─── Light Theme — clinical white, cold temperature ──────
export const light = {
  bg:      "#F8F9FB",   // cold near-white, not beige
  card:    "#FFFFFF",
  surface: "#F2F4F7",
  border:  "#E5E7EB",   // used at opacity 12% via 0.5px stroke
  text: {
    primary:   "#0A0E14",   // cold black — never pure
    secondary: "#6B7280",
    muted:     "#9CA3AF",
  },
  overlay: "rgba(248, 249, 251, 0.96)",
  glass:   "rgba(255, 255, 255, 0.92)",
};

// ─── Dark Theme — deep blue-black, Tesla dashboard ───────
export const dark = {
  bg:      "#0C0F14",   // deep blue-dark — never pure black
  card:    "#141820",
  surface: "#1A1E28",
  border:  "#232836",
  text: {
    primary:   "#ECF0F8",
    secondary: "#9AA3B2",
    muted:     "#5B6472",
  },
  overlay: "rgba(12, 15, 20, 0.96)",
  glass:   "rgba(20, 24, 32, 0.92)",
};

// ─── Animation Durations ─────────────────────────────────
// 280ms is the instrument tempo. Faster feels cheap. Slower feels slow.
export const duration = {
  instant: "0.12s",
  fast:    "0.18s",
  normal:  "0.28s",     // canonical — transitions, fades
  slow:    "0.4s",
  slower:  "0.6s",
};

export const easing = {
  clinical: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",   // precision ease-out
  linear:   "linear",
};

// ─── Z-Index Scale ───────────────────────────────────────
export const z = {
  base: 1,
  sticky: 50,
  nav: 60,
  overlay: 200,
  modal: 210,
  postSession: 220,
  flash: 230,
  countdown: 240,
};

// ─── Layout Constants ────────────────────────────────────
export const layout = {
  maxWidth: 430,
  bottomNav: 72,
  contentPadding: 20,       // lateral — never 16
  bottomSafe: 120,
  tapMinHeight: 52,         // minimum tappable height
  cardPadding: 24,          // interior of cards
  sectionGap: 32,           // between sections
};

// ─── Timer Sizes ─────────────────────────────────────────
export const timer = {
  idle: 240,
  active: 190,
  orbSize: 200,
};
