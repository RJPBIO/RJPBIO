// Tokens scoped al PROTOTYPE_V2 — Tactical Premium Dark estricto.
// NO importar tokens globales aqui. NO mutar nada de src/lib/tokens.js
// ni globals.css. Todo lo que el v2 use vive aqui.
// Especificaciones congeladas por Decision 4 (sub-prompt 1).

export const colors = {
  bg: {
    base: "#08080A",
    raised: "rgba(255,255,255,0.03)",
  },
  accent: {
    phosphorCyan: "#22D3EE",
  },
  text: {
    primary: "rgba(245,245,247,0.92)",
    secondary: "rgba(245,245,247,0.62)",
    muted: "rgba(245,245,247,0.38)",
  },
  separator: "rgba(255,255,255,0.06)",
  focusRing: "#22D3EE",
};

export const typography = {
  family: '"Inter Tight", "Sohne", system-ui, -apple-system, "Segoe UI", sans-serif',
  familyMono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
  size: {
    displayHero: 128,
    displayHeroMin: 96,
    title: 48,
    titleMin: 32,
    subtitle: 19,
    subtitleMin: 17,
    body: 15,
    bodyMin: 14,
    caption: 13,
    microCaps: 11,
  },
  weight: {
    light: 200,
    regular: 400,
    medium: 500,
  },
  letterSpacing: {
    displayHero: "-0.045em",
    displayHeroLoose: "-0.04em",
    title: "-0.02em",
    body: "0",
    microCaps: "0.12em",
  },
  lineHeight: {
    displayHero: 1.0,
    title: 1.1,
    body: 1.5,
    caption: 1.4,
  },
};

export const spacing = {
  s8: 8,
  s16: 16,
  s24: 24,
  s32: 32,
  s48: 48,
  s64: 64,
  s96: 96,
};

export const radii = {
  iconBox: 10,
  pill: 12,
  panel: 14,
  panelLg: 16,
};

export const surfaces = {
  iconBox: "rgba(255,255,255,0.04)",
  rowHover: "rgba(255,255,255,0.05)",
  navBg: "rgba(8,8,10,0.8)",
  navBlur: "blur(20px)",
  accentBorder: "rgba(34,211,238,0.15)",
  accentBorderSoft: "rgba(34,211,238,0.7)",
};

export const motion = {
  duration: {
    tap: 120,
    fadeUp: 240,
    enter: 280,
    exit: 200,
  },
  ease: {
    out: "cubic-bezier(0.22, 1, 0.36, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
  fadeUp: {
    translateY: 8,
    staggerMs: 70,
  },
  tap: {
    scale: 0.98,
  },
  hover: {
    opacityBoost: 0.05,
  },
};

export const icon = {
  strokeWidth: 1.5,
  size: 20,
};

export const layout = {
  bottomNavHeight: 64,
  maxContentWidth: 720,
  contentPadInline: 24,
  contentPadInlineMobile: 20,
};

const tokens = { colors, typography, spacing, radii, motion, icon, layout };
export default tokens;
