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
//
// Sprint 84 — calibración basada en audit del codebase (no diseño aspiracional):
//   · `eyebrow: 10` legitima 115 instancias usadas en mono caps muy pequeñas
//     (kicker dot+label, status badges). Acepta limitación a11y a cambio
//     de jerarquía visual — usar SOLO en caps con tracking abierto.
//   · `label: 13` legitima 88 instancias (entre sm:12 y base:14) usadas
//     en captions de cards y chips de metadata.
//   · `tracking.subtle: -0.05px` legitima 148 instancias (subtle tightening
//     en body text, mono captions, números sans).
//   · `tracking.snugTight: -0.1px` legitima 66 instancias (más firme que
//     subtle, usado en titles 14-18px y mono numérico medium).
//   El nombre `snugTight` evita colisión semántica con `leading.snug` (1.35).
export const font = {
  family: "var(--font-sans), 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",

  size: {
    eyebrow: 10,   // mono caps tiny (kicker labels) — usar con tracking caps
    xs: 11,
    sm: 12,
    label: 13,     // chip metadata, card captions — entre sm y base
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
    subtle: "-0.05px",   // body/mono captions — barely-perceivable tightening
    snugTight: "-0.1px", // display 14-18px, mono medium numbers
    tight: "-0.5px",     // headlines, hero text
    normal: "0",
    wide: "0.5px",
    wider: "1px",
    widest: "2px",
    caps: "3px",         // uppercase labels
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
  // Text-safe variant of phosphor cyan for use as small-text color on the
  // light --bi-bg (#F1F4F9). Brand cyan fails WCAG AA (1.63:1); cyan-800
  // lands at ~5.9:1 while staying inside the trademark family. Use for
  // kicker labels, numeric footnote chips, inline citations.
  phosphorCyanInk: "#155E75",
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
// Intent-anchored palette — cada intent fisiológica tiene su hue distintivo.
// `enfoque` usa phosphorCyan (ADN azul del marketing site) para presencia de marca.
// `reset` usa neuralViolet (neural/brain integration). Emerald para calma parasimpática.
// Amber para energia (activación térmica). Used within protocol-scoped UI
// (orb, phase card, protocol badge) y vía `pr.cl` en cada protocolo.
export const protoColor = {
  calma: "#059669",     // emerald — parasimpático, enfriamiento
  enfoque: "#22D3EE",   // phosphorCyan — marca, claridad prefrontal
  energia: "#F59E0B",   // amber — activación térmica
  reset: "#8B5CF6",     // neuralViolet — reintegración cognitiva
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

// ─── Dim Theme (PWA — Apple HIG-grade neutral dark) ──────
// Sprint 97 — refactor crítico: este palette es lo que ve el USER en
// la PWA dark mode. Los componentes hacen style={{background: dark.bg}}
// con valores literales de aquí, bypass total de CSS vars.
//
// El palette previo era emerald-undertone heavy (bg #0A130E green-
// tinted, surface verde, text-secondary pastel-verde #A7F3D0!) — user
// reportó "verde raro, no es modo dark normal". Yo intenté fix en
// CSS vars (Sprints 94/95/96) pero la PWA no las usa — los Sprints
// no surtieron efecto porque la palette JS aquí seguía verde.
//
// Apple iOS 13+ / macOS Big Sur+ dark reference:
//   systemBackground:           #000000
//   secondarySystemBackground:  #1C1C1E  (systemGray6)
//   tertiarySystemBackground:   #2C2C2E  (systemGray5)
//   label.primary:              #FFFFFF
//   label.secondary:            rgba(235,235,245,0.6)
//   label.tertiary:             rgba(235,235,245,0.3)
//
// El brand cyan #22D3EE se mantiene como signal — viene via
// bioSignal.phosphorCyan o el accent del orb. Bg neutral no compite.
export const dark = {
  bg:      "#000000",   // pure black, OLED-optimal + max contrast cyan
  card:    "#1C1C1E",   // Apple systemGray6
  surface: "#2C2C2E",   // Apple systemGray5 (elevated chrome)
  // Sprint 98 — solid hex en lugar de rgba para compat con withAlpha
  // (string concat patrón en CorrelationMatrix:221, StreakCalendar:265).
  // Sprint 100 — subtle cyan undertone vs pure neutral. User reportó
  // "mucho gris seco, sin color" — cards Apple-correct pero muertas.
  // Apple Music/Health usan brand-tinted borders sutiles para inyectar
  // identity en chrome neutral. R31 G34 B39 = imperceptible blue tint
  // a la luz directa, perceptible en uso prolongado como "cards bio".
  border:  "#1F2227",   // brand-cyan-tinted dark border (era #1F1F1F)
  text: {
    primary:   "#FFFFFF",
    // Apple label.secondary = rgba(235,235,245,0.6) over #000.
    // Equivalente solid: #8E8E93 (Apple systemGray, official iOS dark
    // mode secondary text color). withAlpha-safe.
    secondary: "#8E8E93",
    // Apple label.tertiary = rgba(235,235,245,0.3) over #000.
    // Equivalente solid: #48484A (Apple systemGray3 dark).
    muted:     "#48484A",
  },
  overlay: "rgba(0, 0, 0, 0.96)",
  glass:   "rgba(28, 28, 30, 0.92)", // glassmorphism over systemGray6
};

// ─── Light Theme — Apple HIG-grade neutral ───────────────
// Sprint 99 — refactor paralelo al Sprint 97/98 (dark theme).
// Antes: Tailwind slate palette con 3 problemas:
//   1. surface (#F8FAFC) MÁS CLARO que bg (#F1F4F9) — jerarquía
//      invertida vs Apple regla (surfaces elevated SE oscurecen
//      ligeramente sobre bg claro).
//   2. Slate cool/blue tint en TODOS los grises. Apple light es
//      chromatically neutral (warm-ish gray, no blue).
//   3. Border slate-200 #E2E8F0 muy claro vs Apple separator
//      #C6C6C8 → separators casi invisibles.
//
// Apple iOS 13+ / macOS Big Sur+ light reference:
//   systemGroupedBackground:    #F2F2F7  (groupedBackground for
//                                          screens with cards on bg)
//   systemBackground (cards):   #FFFFFF
//   separator:                  #C6C6C8
//   label.primary:              #000000
//   label.secondary:            #3C3C43  (rgba 0.6 over white)
//   label.tertiary:             #3C3C4399 (rgba 0.3 ≈ #8E8E93)
//
// Bio's PWA layout = cards-on-background → systemGroupedBackground
// is the correct bg choice.
export const light = {
  bg:      "#F2F2F7",   // Apple systemGroupedBackground
  card:    "#FFFFFF",   // Apple systemBackground (clean white)
  surface: "#F9F9FA",   // Sprint 99 — solo ligeramente más oscuro
                        // que card para diferenciar elevations sin
                        // invertir jerarquía vs bg.
  // Sprint 100 — subtle cyan undertone (paralelo dark). Apple separator
  // base #C6C6C8 + bump azul para brand identity en cards light.
  border:  "#C5CAD2",   // brand-cyan-tinted light border
  text: {
    primary:   "#000000",   // Apple label.primary (era #0F172A slate)
    // Apple label.secondary = rgba(60,60,67,0.6). Solid hex
    // equivalente para compat con withAlpha (string concat patrón
    // del codebase, ver Sprint 98 contexto):
    secondary: "#3C3C43",   // Apple label.secondary equiv
    // Apple label.tertiary = rgba(60,60,67,0.3) ≈ #8E8E93.
    muted:     "#8E8E93",   // Apple label.tertiary equiv
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
  countdown: 10000,
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
