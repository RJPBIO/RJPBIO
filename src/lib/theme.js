/**
 * BIO-IGNICIÓN Neuro-Adaptive Theme Engine
 * Computes visual tokens from neural state in real-time.
 * Every color, speed, and intensity has neuropsychological intent.
 */

// ═══ STATE → COLOR MAPPING ═══
// Based on color psychology + neurofeedback research:
// - Cool blues → parasympathetic activation (calm)
// - Warm ambers → sympathetic alert (stress)  
// - Greens → homeostatic balance (optimal)
// - Deep indigo → cognitive engagement (focus)

const STATE_PALETTES = {
  optimal: {
    bg:      { dark: "#071210", light: "#EEFAF5" },
    bd:      { dark: "#1A2E28", light: "#C8E6D8" },
    accent:  "#059669",
    glow:    "#34D39940",
    orbPrimary: "#059669",
    orbSecondary: "#34D399",
  },
  functional: {
    bg:      { dark: "#0A0D14", light: "#F0F2F8" },
    bd:      { dark: "#1C2030", light: "#DEE2ED" },
    accent:  "#6366F1",
    glow:    "#818CF840",
    orbPrimary: "#6366F1",
    orbSecondary: "#818CF8",
  },
  stressed: {
    bg:      { dark: "#120E07", light: "#FBF6EE" },
    bd:      { dark: "#2E2518", light: "#E8D8C0" },
    accent:  "#D97706",
    glow:    "#FBBF2440",
    orbPrimary: "#D97706",
    orbSecondary: "#FBBF24",
  },
  critical: {
    bg:      { dark: "#120808", light: "#FBF0F0" },
    bd:      { dark: "#2E1818", light: "#E8C0C0" },
    accent:  "#DC2626",
    glow:    "#F8717140",
    orbPrimary: "#DC2626",
    orbSecondary: "#F87171",
  },
};

// ═══ STATE → MOTION MAPPING ═══
// Calm states = slower, smoother animations
// Stress states = faster, more urgent animations
const STATE_MOTION = {
  optimal:    { pulse: "5s",  dot: "2.8s", glow: "4s",   ease: "cubic-bezier(0.4, 0, 0.2, 1)" },
  functional: { pulse: "4s",  dot: "2.2s", glow: "3s",   ease: "cubic-bezier(0.4, 0, 0.2, 1)" },
  stressed:   { pulse: "2.5s", dot: "1.5s", glow: "1.8s", ease: "cubic-bezier(0.4, 0, 0.6, 1)" },
  critical:   { pulse: "1.8s", dot: "1s",   glow: "1.2s", ease: "cubic-bezier(0.2, 0, 0.8, 1)" },
};

// ═══ THEME COMPUTER ═══
export function computeTheme(brainState, isDark, protocolColor) {
  const state = brainState || "functional";
  const palette = STATE_PALETTES[state] || STATE_PALETTES.functional;
  const motion = STATE_MOTION[state] || STATE_MOTION.functional;

  return {
    // Colors
    bg: isDark ? palette.bg.dark : palette.bg.light,
    cd: isDark ? "#141820" : "#FFFFFF",
    bd: isDark ? palette.bd.dark : palette.bd.light,
    t1: isDark ? "#E8ECF4" : "#0F172A",
    t2: isDark ? "#8B95A8" : "#475569",
    t3: isDark ? "#4B5568" : "#94A3B8",
    ac: protocolColor,

    // State-specific
    stateAccent: palette.accent,
    stateGlow: palette.glow,
    orbPrimary: palette.orbPrimary,
    orbSecondary: palette.orbSecondary,

    // Motion
    pulseSpeed: motion.pulse,
    dotSpeed: motion.dot,
    glowSpeed: motion.glow,
    motionEase: motion.ease,

    // Computed
    isDark,
    state,
    isUrgent: state === "critical" || state === "stressed",
  };
}

// ═══ URGENCY → UI SIMPLIFICATION ═══
// When user is in critical/burnout, simplify the UI
export function getUIComplexity(brainState, burnoutRisk) {
  if (burnoutRisk === "alto" || burnoutRisk === "crítico") return "minimal";
  if (brainState === "critical") return "reduced";
  if (brainState === "stressed") return "standard";
  return "full";
}

export { STATE_PALETTES, STATE_MOTION };
