/**
 * BIO-IGNICIÓN v9 Neuro-Adaptive Theme Engine
 * Computes visual tokens from neural state in real-time.
 * Every color, speed, and intensity has neuropsychological intent.
 *
 * Color psychology:
 * - Emerald greens → homeostatic balance (optimal)
 * - Deep indigo → cognitive engagement (functional)
 * - Warm amber → sympathetic alert (stressed)
 * - Red → critical arousal (critical)
 */

const STATE_PALETTES = {
  optimal: {
    bg:      { dark: "#060F0D", light: "#EEFAF5" },
    bd:      { dark: "#162E26", light: "#C8E6D8" },
    accent:  "#10B981",
    glow:    "#34D39940",
    orbPrimary: "#10B981",
    orbSecondary: "#34D399",
  },
  functional: {
    bg:      { dark: "#06090F", light: "#F4F6FA" },
    bd:      { dark: "#1A2030", light: "#E2E6F0" },
    accent:  "#6366F1",
    glow:    "#818CF840",
    orbPrimary: "#6366F1",
    orbSecondary: "#818CF8",
  },
  stressed: {
    bg:      { dark: "#100D06", light: "#FBF6EE" },
    bd:      { dark: "#2E2518", light: "#E8D8C0" },
    accent:  "#F59E0B",
    glow:    "#FBBF2440",
    orbPrimary: "#F59E0B",
    orbSecondary: "#FBBF24",
  },
  critical: {
    bg:      { dark: "#100606", light: "#FBF0F0" },
    bd:      { dark: "#2E1818", light: "#E8C0C0" },
    accent:  "#EF4444",
    glow:    "#F8717140",
    orbPrimary: "#EF4444",
    orbSecondary: "#F87171",
  },
};

// Calm states = slower, smoother animations
// Stress states = faster, more urgent animations
const STATE_MOTION = {
  optimal:    { pulse: "5s",  dot: "2.8s", glow: "4s",   ease: "cubic-bezier(0.4, 0, 0.2, 1)" },
  functional: { pulse: "4s",  dot: "2.2s", glow: "3s",   ease: "cubic-bezier(0.4, 0, 0.2, 1)" },
  stressed:   { pulse: "2.5s", dot: "1.5s", glow: "1.8s", ease: "cubic-bezier(0.4, 0, 0.6, 1)" },
  critical:   { pulse: "1.8s", dot: "1s",   glow: "1.2s", ease: "cubic-bezier(0.2, 0, 0.8, 1)" },
};

export function computeTheme(brainState, isDark, protocolColor) {
  const state = brainState || "functional";
  const palette = STATE_PALETTES[state] || STATE_PALETTES.functional;
  const motion = STATE_MOTION[state] || STATE_MOTION.functional;

  return {
    bg: isDark ? palette.bg.dark : palette.bg.light,
    cd: isDark ? "#0C1017" : "#FFFFFF",
    bd: isDark ? palette.bd.dark : palette.bd.light,
    t1: isDark ? "#E8ECF4" : "#0C1222",
    t2: isDark ? "#7B879E" : "#546178",
    t3: isDark ? "#3E4A60" : "#8B96AA",
    ac: protocolColor,
    stateAccent: palette.accent,
    stateGlow: palette.glow,
    orbPrimary: palette.orbPrimary,
    orbSecondary: palette.orbSecondary,
    pulseSpeed: motion.pulse,
    dotSpeed: motion.dot,
    glowSpeed: motion.glow,
    motionEase: motion.ease,
    isDark,
    state,
    isUrgent: state === "critical" || state === "stressed",
  };
}

// When user is in critical/burnout, simplify the UI
export function getUIComplexity(brainState, burnoutRisk) {
  if (burnoutRisk === "alto" || burnoutRisk === "crítico") return "minimal";
  if (brainState === "critical") return "reduced";
  if (brainState === "stressed") return "standard";
  return "full";
}

export { STATE_PALETTES, STATE_MOTION };
