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
    // Phase 7 SP-B-1 Capa 2 — Color Palette Evolution.
    // Cyan progression per-phase para hero flagship redesigns Opción B.
    // Foundation reusable F1.5 + F2.5 + F4-F23 deep upgrades posteriores.
    // Existing phosphorCyan #22D3EE preserved — additive zero-breaking.
    phosphorCyanByPhase: {
      phase1: "#0E7490", // cyan-deep · Phase 1 vagal entrada
      phase2: "#67E8F9", // cyan-cool · Phase 2 cognitive
      phase3: "#06B6D4", // cyan-warm · Phase 3 commitment
    },
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
  // Aliases legacy (no remover — usados por todo el shell v2).
  s8: 8,
  s16: 16,
  s24: 24,
  s32: 32,
  s48: 48,
  s64: 64,
  s96: 96,

  // Phase 6H Polish-2 — scale base 4px (Apple HIG / Material / Tailwind
  // compatible). Llamamos los pasos por número (s4, s12, s20, etc.)
  // matching la convención `s{px}` ya en uso en este archivo. Code nuevo
  // debe preferir esta scale; los `s8/s16/...` quedan por compat.
  s2: 2,
  s4: 4,
  s6: 6,
  s10: 10,
  s12: 12,
  s14: 14,
  s20: 20,
  s28: 28,
  s40: 40,
  s56: 56,
  s80: 80,
};

// Phase 6H Polish-2 — touch target minimums (Decision B1).
// 44px Apple HIG (iOS), 48px Material (Android default), 56px primary
// CTAs. Components con visual < 44px (ej: Switch 20px, chip 32px)
// deben extender touch area via padding o ::before invisible.
export const touchTarget = {
  min: 44,
  preferred: 48,
  large: 56,
};

// Phase 6H Polish-2 — easing curves consistentes (Decision D).
// motion.ease.out/inOut existing siguen siendo canon para fadeUp/enter
// del shell v2. easing.* es vocabulario tokens-shape estándar industry
// para code nuevo (state changes / mounts / progress).
export const easing = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",        // Material default — state changes
  spring: "cubic-bezier(0.32, 0.72, 0, 1)",         // Apple Magic — mount/dismiss
  decelerate: "cubic-bezier(0, 0, 0.2, 1)",         // entry / fade-in
  accelerate: "cubic-bezier(0.4, 0, 1, 1)",         // exit / fade-out
  linear: "linear",                                  // progress bars / spinners
};

// Phase 6H Polish-2 — animation durations en ms (numbers, no strings)
// para alineación con motion.duration.{tap,fadeUp,enter,exit} existing.
// motion.duration sigue siendo canon del shell v2; duration.* es
// vocabulario complementario para code nuevo.
export const duration = {
  instant: 50,
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500,
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

/**
 * Phase 7 SP-B-1 Capa 2 — Color Palette Evolution helper.
 * Returns cyan hex per phase index (0/1/2). Defensive: out of range,
 * undefined, NaN, non-number → fallback to base phosphorCyan.
 *
 * Foundation reusable: hero flagships Opción B + Phase 2 scaling.
 *
 * @param {number} phaseIdx — 0=Phase1 vagal, 1=Phase2 cognitive, 2=Phase3 commitment
 * @returns {string} hex cyan color
 */
export function getCyanForPhase(phaseIdx) {
  const map = {
    0: colors.accent.phosphorCyanByPhase.phase1,
    1: colors.accent.phosphorCyanByPhase.phase2,
    2: colors.accent.phosphorCyanByPhase.phase3,
  };
  if (typeof phaseIdx !== "number" || !Number.isFinite(phaseIdx)) {
    return colors.accent.phosphorCyan;
  }
  return map[phaseIdx] || colors.accent.phosphorCyan;
}

const tokens = {
  colors, typography, spacing, radii, motion, icon, layout, withAlpha,
  // Phase 6H Polish-2 — exponer en default export para imports {} simples.
  touchTarget, easing, duration,
  // Phase 7 SP-B-1 Capa 2 — Color Palette Evolution helper.
  getCyanForPhase,
};
export default tokens;
