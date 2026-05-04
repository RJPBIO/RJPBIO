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
    // Phase 6B SP2 — dim variant para borders/ghosts donde queremos
    // presencia cyan menos dominante que el accent puro. RGB de #22D3EE.
    phosphorCyanRgb: "34, 211, 238",
  },
  text: {
    primary: "rgba(245,245,247,0.92)",
    secondary: "rgba(245,245,247,0.62)",
    muted: "rgba(245,245,247,0.38)",
    // Phase 6D SP3 — text.strong: variante de mayor contraste usada en
    // controles activos (Switch ON track) y stat values grandes. Antes
    // vivía como literal rgba(255,255,255,0.96) duplicado en ~6 archivos
    // — Bug-43.
    strong: "rgba(255,255,255,0.96)",
  },
  separator: "rgba(255,255,255,0.06)",
  focusRing: "#22D3EE",
  // Phase 6B SP2 — semantic colors para warning/danger en componentes
  // HRV y screening clínico (PHQ-2 positive, SQI poor, low quality).
  // Mantenemos diferenciación visual contra phosphorCyan: warning naranja
  // ámbar #f59e0b y danger rojo #DC2626 son codificación universal que
  // el usuario ya entiende (no inventamos nuevos colores semánticos).
  semantic: {
    warning: "#f59e0b",
    warningRgb: "245, 158, 11",
    danger: "#DC2626",
    dangerRgb: "220, 38, 38",
    // En ADN v2 success NO es verde separado: el cyan es la única señal
    // positiva del sistema. Esto evita la "cascada de colores semánticos"
    // de productos saturados (verde/amarillo/rojo + cyan). One signal.
    success: "#22D3EE",
    successRgb: "34, 211, 238",
  },
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
  // Phase 6D SP5 Bug-41 — InputBar height hoisted to layout token. Antes
  // CoachDisclaimer hardcodeaba 56px y la altura real era ~68px (textarea
  // minHeight 44 + paddingBlock 12*2). Mantenerlos sincronizados aquí
  // evita drift cuando se ajuste padding o textarea.
  coachInputBarHeight: 68,
};

// Phase 6B SP2 — alpha helper local. Reemplaza `withAlpha` legacy de
// lib/theme.js evitando coupling al sistema viejo de tokens. Acepta hex
// (#RRGGBB) o triplete RGB string ("R, G, B"); devuelve rgba(..., α).
// alphaPct: 0-100 (porcentaje, igual que el helper legacy para minimizar
// fricción durante el sweep).
export function withAlpha(color, alphaPct) {
  const a = Math.max(0, Math.min(100, alphaPct)) / 100;
  if (typeof color === "string" && color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  // Triplete "R, G, B" (los *Rgb tokens de arriba): wrappear directo.
  if (typeof color === "string" && /^\d+\s*,\s*\d+\s*,\s*\d+$/.test(color)) {
    return `rgba(${color}, ${a})`;
  }
  return color;
}

const tokens = { colors, typography, spacing, radii, motion, icon, layout, withAlpha };
export default tokens;
