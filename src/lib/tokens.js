/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════
   Single source of truth for all visual values.
   No magic numbers. Every value traces back here.
   ═══════════════════════════════════════════════════════════════ */

// ─── Typography Scale ────────────────────────────────────
// Modular scale, base 12px, ratio ~1.2
export const font = {
  family: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",

  size: {
    xs: 10,
    sm: 11,
    base: 12,
    md: 13,
    lg: 15,
    xl: 17,
    "2xl": 22,
    "3xl": 30,
    "4xl": 38,
    hero: 52,
  },

  weight: {
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
    relaxed: 1.7,
  },

  tracking: {
    tight: "-0.5px",
    normal: "0",
    wide: "0.5px",
    wider: "1px",
    widest: "2px",
    caps: "3px",    // for uppercase labels
  },
};

// ─── Spacing Scale ───────────────────────────────────────
// 4px base grid. Every spacing value is a multiple of 4.
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
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
  full: 9999,
};

// ─── Shadows ─────────────────────────────────────────────
export const shadow = {
  sm: "0 2px 8px",
  md: "0 4px 16px",
  lg: "0 8px 30px",
  glow: (color) => `0 0 20px ${color}40`,
};

// ─── Brand Colors ────────────────────────────────────────
// Fixed brand identity — does NOT change per protocol
export const brand = {
  primary: "#059669",
  secondary: "#6366F1",
  accent: "#0D9488",
};

// ─── Semantic Colors ─────────────────────────────────────
export const semantic = {
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#6366F1",
};

// ─── Protocol Colors ─────────────────────────────────────
// Only used within protocol-scoped UI (orb, phase card, protocol badge)
export const protoColor = {
  calma: "#059669",
  enfoque: "#6366F1",
  energia: "#D97706",
  reset: "#0D9488",
};

// ─── Opacity Scale ───────────────────────────────────────
// Consistent alpha values instead of random hex suffixes
export const alpha = {
  0: "00",
  2: "05",
  4: "0A",
  6: "0F",
  8: "14",
  10: "1A",
  12: "1F",
  15: "26",
  20: "33",
  25: "40",
  30: "4D",
  40: "66",
  50: "80",
  60: "99",
  70: "B3",
  80: "CC",
  90: "E6",
  95: "F2",
  100: "FF",
};

// ─── Dark Theme ──────────────────────────────────────────
export const dark = {
  bg:      "#0B0E14",
  card:    "#141820",
  surface: "#1A1E28",
  border:  "#1E2330",
  text: {
    primary:   "#E8ECF4",
    secondary: "#8B95A8",
    muted:     "#4B5568",
  },
  overlay: "rgba(11, 14, 20, 0.96)",
  glass:   "rgba(20, 24, 32, 0.92)",
};

// ─── Light Theme ─────────────────────────────────────────
export const light = {
  bg:      "#F1F4F9",
  card:    "#FFFFFF",
  surface: "#F8FAFC",
  border:  "#E2E8F0",
  text: {
    primary:   "#0F172A",
    secondary: "#475569",
    muted:     "#94A3B8",
  },
  overlay: "rgba(255, 255, 255, 0.96)",
  glass:   "rgba(255, 255, 255, 0.92)",
};

// ─── Animation Durations ─────────────────────────────────
export const duration = {
  fast: "0.15s",
  normal: "0.25s",
  slow: "0.4s",
  slower: "0.8s",
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
  bottomNav: 72,         // unified nav height (metrics + tabs)
  contentPadding: 20,    // horizontal page padding
  bottomSafe: 120,       // padding-bottom for scroll content (was 180 with double chrome)
};

// ─── Timer Sizes ─────────────────────────────────────────
export const timer = {
  idle: 240,
  active: 190,
  orbSize: 200,
};
