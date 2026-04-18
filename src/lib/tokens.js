/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════
   Single source of truth for all visual values.
   No magic numbers. Every value traces back here.
   ═══════════════════════════════════════════════════════════════ */

// ─── Typography Scale ────────────────────────────────────
// Modular scale, base 14px, ratio ~1.2. Benchmark: Linear (14), Stripe (14),
// Apple HIG body (17). La escala previa arrancaba en 9-11 — anti-legibilidad
// en mobile. xs/sm se reservan para captions, kbd y eyebrows en caps.
// Font families bind to next/font CSS variables declared in layout.js.
export const font = {
  family: "var(--font-sans), 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",

  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    "2xl": 22,
    "3xl": 30,
    "4xl": 40,
    hero: 56,
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

// ─── Bio-Signal Palette (identity) ───────────────────────
// Bioluminescent accents that layer ON TOP of brand/protocol colors.
// Used for: ignition moments, signal indicators, dataviz glow,
// neural-spark glyph. These are what make the app look like an
// instrument, not a wellness template.
export const bioSignal = {
  phosphorCyan: "#22D3EE",   // primary bio-electric signal
  ghostCyan:    "#A5F3FC",   // pale halo
  neuralViolet: "#8B5CF6",   // brain/cognition signal
  plasmaPink:   "#F472B6",   // ignition peak
  signalAmber:  "#FBBF24",   // readiness/warning
  plasmaRed:    "#F43F5E",   // critical
  deepField:    "#050810",   // pre-ignition void (darker than bg)
  ignition:     "#FDE68A",   // the spark itself (pale gold)
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

// ─── Motion Vocabulary (identity) ────────────────────────
// Signature motion: everything emanates from the neural core.
// These are the reusable springs/curves that define the app's feel.
// Don't invent new springs in components — reach for these first.
export const motion = {
  // Breath-like spring: slow, organic, used for core + halos
  breath: { type: "spring", stiffness: 30, damping: 20, mass: 1.2 },
  // Ignition spring: firm, punctual, used for bursts + flashes
  ignition: { type: "spring", stiffness: 220, damping: 18, mass: 0.9 },
  // Emanation: used for ripples/rings radiating from a point
  emanate: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
  // Tap: micro-response for button feedback
  tap: { type: "spring", stiffness: 500, damping: 30 },
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
  maxWidthTablet: 720,
  maxWidthDesktop: 1120,
  bottomNav: 68,         // bottom nav height
  metricsBar: 52,        // metrics bar height
  contentPadding: 20,    // horizontal page padding
  contentPaddingTablet: 32,
  contentPaddingDesktop: 48,
  bottomSafe: 180,       // padding-bottom for scroll content
};

// ─── Timer Sizes ─────────────────────────────────────────
export const timer = {
  idle: 220,
  active: 180,
  orbSize: 200,
};
