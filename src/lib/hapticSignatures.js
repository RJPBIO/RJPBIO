/* ═══════════════════════════════════════════════════════════════
   Phase 7 F0-4 — HAPTIC SIGNATURE FRAMEWORK PER-PROTOCOL
   ───────────────────────────────────────────────────────────────
   Data-driven catalog: cada uno de los 23 protocolos en P[] tiene
   firma vibratoria única por phase kind. Pattern: arrays de duraciones
   ms para Web Vibration API (índices pares = pulso, impares = pausa).

   Phase kinds canon:
     - breath_inhale: pulso para fase inhala
     - breath_hold:   pulso para mantén/sostén
     - breath_exhale: pulso para fase exhala
     - phase_shift:   marker entre fases del protocolo
     - completion:    pulso final post-session

   intensity_modifier: scalar 0.7-1.3. Calma soft 0.7-0.9, foco/energia
   sharp 1.1-1.3, reset/crisis mid-range 0.95-1.15. El wrapper interno
   `vibrate()` en audio.js aplica además el user pref _hapticIntensity
   (light/medium/strong) → scaling chain final:
     pattern[i] × signature.intensity_modifier × options.intensity × _hapticIntensity

   Player wiring DEFER F1 Flagship #15 + Phase 2 scaling. Este SP solo
   establece el framework (catalog + helper). Existing hapticBreath/
   hapticPhase/hapticSignature siguen activas para 22 protocolos no-flagship.

   Floor 30ms (Sprint 72): consumir vibrate() wrapper aplica este floor
   automáticamente. El catalog usa valores nominales (no se preocupa
   por el floor — el wrapper lo garantiza on-call).

   Cap 500ms por pulso: límite operativo (UX + battery). Tests verifican.
   ═══════════════════════════════════════════════════════════════ */

/** @typedef {("breath_inhale"|"breath_hold"|"breath_exhale"|"phase_shift"|"completion")} HapticPhaseKind */

/**
 * @typedef {object} HapticSignature
 * @property {number[]} breath_inhale
 * @property {number[]} breath_hold
 * @property {number[]} breath_exhale
 * @property {number[]} phase_shift
 * @property {number[]} completion
 * @property {number} intensity_modifier — scalar 0.7–1.3 baseline tone-of-protocol
 */

export const HAPTIC_SIGNATURES = {
  // ─── CALMA (softer, longer, descending) ──────────────────
  1: { // Reinicio Parasimpático (box 4-4-4-4)
    breath_inhale: [40, 30, 80],
    breath_hold:   [200],
    breath_exhale: [120, 80, 40],
    phase_shift:   [60, 60, 60, 60],
    completion:    [200, 100, 200],
    intensity_modifier: 0.85,
  },
  6: { // Grounded Steel
    breath_inhale: [50, 40, 100],
    breath_hold:   [240],
    breath_exhale: [140, 100, 50],
    phase_shift:   [80, 60, 80],
    completion:    [240, 120, 240],
    intensity_modifier: 0.80,
  },
  11: { // Body Anchor
    breath_inhale: [60, 30, 120],
    breath_hold:   [220],
    breath_exhale: [160, 80, 40],
    phase_shift:   [50, 50, 50, 50, 50],
    completion:    [220, 100, 220],
    intensity_modifier: 0.85,
  },
  15: { // Suspiro Fisiológico (FLAGSHIP) — doble-inhalación pattern única
    breath_inhale: [40, 20, 30, 20, 80],
    breath_hold:   [80],
    breath_exhale: [200, 100, 60, 40],
    phase_shift:   [60, 40, 60],
    completion:    [120, 80, 120, 80, 200],
    intensity_modifier: 0.90,
  },
  16: { // Resonancia Vagal (5.5 rpm)
    breath_inhale: [200, 100, 200],
    breath_hold:   [100],
    breath_exhale: [200, 100, 200, 100, 200],
    phase_shift:   [100, 100, 100],
    completion:    [300, 150, 300],
    intensity_modifier: 0.75,
  },
  17: { // NSDR 10 min
    breath_inhale: [80, 40, 160],
    breath_hold:   [300],
    breath_exhale: [200, 80, 40],
    phase_shift:   [40, 40, 40, 40, 40, 40],
    completion:    [300, 150, 100, 50, 200],
    intensity_modifier: 0.70,
  },
  22: { // Vagal Hum Reset (hum-pattern)
    breath_inhale: [60, 30, 90],
    breath_hold:   [120],
    breath_exhale: [180, 60, 90, 60, 90],
    phase_shift:   [60, 30, 60, 30, 60],
    completion:    [180, 90, 180, 90, 180],
    intensity_modifier: 0.80,
  },

  // ─── FOCO / ENFOQUE (sharper, staccato, ascending) ───────
  2: { // Activación Cognitiva
    breath_inhale: [50, 20, 50, 20, 100],
    breath_hold:   [80],
    breath_exhale: [80, 50, 30],
    phase_shift:   [40, 30, 40, 30, 60],
    completion:    [60, 40, 60, 40, 100],
    intensity_modifier: 1.15,
  },
  5: { // Skyline Focus
    breath_inhale: [40, 20, 60, 20, 80],
    breath_hold:   [100],
    breath_exhale: [60, 40, 30],
    phase_shift:   [30, 30, 30, 60],
    completion:    [50, 30, 50, 30, 80],
    intensity_modifier: 1.20,
  },
  8: { // Lightning Focus (rapid staccato)
    breath_inhale: [30, 20, 30, 20, 30, 20, 80],
    breath_hold:   [60],
    breath_exhale: [50, 30, 20],
    phase_shift:   [25, 25, 25, 50],
    completion:    [40, 30, 40, 30, 80],
    intensity_modifier: 1.30,
  },

  // ─── ENERGIA (mid-range, rhythmic, building) ─────────────
  4: { // Pulse Shift
    breath_inhale: [60, 30, 60, 30, 100],
    breath_hold:   [80],
    breath_exhale: [80, 50, 40],
    phase_shift:   [50, 50, 50, 50],
    completion:    [80, 60, 80, 60, 120],
    intensity_modifier: 1.10,
  },
  10: { // Sensory Wake
    breath_inhale: [50, 30, 70, 30, 100],
    breath_hold:   [100],
    breath_exhale: [100, 60, 40],
    phase_shift:   [60, 40, 60, 40],
    completion:    [100, 60, 100, 60, 150],
    intensity_modifier: 1.10,
  },
  20: { // Block Break (crisis-energia)
    breath_inhale: [40, 30, 50, 30, 80],
    breath_hold:   [80],
    breath_exhale: [80, 50, 30],
    phase_shift:   [40, 40, 40, 40],
    completion:    [80, 50, 80, 50, 120],
    intensity_modifier: 1.20,
  },
  23: { // Power Pose Activation
    breath_inhale: [60, 40, 80, 40, 120],
    breath_hold:   [100],
    breath_exhale: [100, 60, 50],
    phase_shift:   [80, 50, 80],
    completion:    [120, 80, 120, 80, 200],
    intensity_modifier: 1.25,
  },

  // ─── RESET (mid-range, transition-emphasized) ────────────
  3: { // Reset Ejecutivo
    breath_inhale: [50, 30, 70],
    breath_hold:   [120],
    breath_exhale: [100, 60, 40],
    phase_shift:   [70, 50, 70, 50, 70],
    completion:    [100, 60, 100, 60, 150],
    intensity_modifier: 1.00,
  },
  7: { // HyperShift
    breath_inhale: [40, 30, 60, 30, 80],
    breath_hold:   [80],
    breath_exhale: [80, 50, 40],
    phase_shift:   [60, 40, 60, 40, 80],
    completion:    [80, 60, 80, 60, 120],
    intensity_modifier: 1.15,
  },
  9: { // Steel Core Reset
    breath_inhale: [50, 30, 80, 30, 100],
    breath_hold:   [120],
    breath_exhale: [100, 60, 50],
    phase_shift:   [80, 60, 80, 60, 100],
    completion:    [120, 80, 120, 80, 180],
    intensity_modifier: 1.10,
  },
  12: { // Neural Ascension
    breath_inhale: [50, 30, 60, 30, 80],
    breath_hold:   [100],
    breath_exhale: [80, 50, 40],
    phase_shift:   [60, 50, 60, 50, 80],
    completion:    [100, 70, 100, 70, 150],
    intensity_modifier: 1.05,
  },
  21: { // Threshold Crossing
    breath_inhale: [40, 30, 50, 30, 70],
    breath_hold:   [90],
    breath_exhale: [70, 40, 30],
    phase_shift:   [50, 40, 50, 40, 70],
    completion:    [80, 60, 80, 60, 120],
    intensity_modifier: 1.10,
  },
  24: { // Bilateral Walking Meditation
    breath_inhale: [60, 30, 60, 30, 60],
    breath_hold:   [60],
    breath_exhale: [60, 30, 60, 30, 60],
    phase_shift:   [40, 30, 40, 30, 40, 30],
    completion:    [80, 50, 80, 50, 80],
    intensity_modifier: 1.05,
  },
  25: { // Cardiac Pulse Match (advanced flagship — heartbeat-matched)
    breath_inhale: [80, 40, 80, 40, 120],
    breath_hold:   [100],
    breath_exhale: [120, 60, 80, 60, 120],
    phase_shift:   [60, 60, 60, 60, 60],
    completion:    [200, 100, 200, 100, 300],
    intensity_modifier: 0.85,
  },

  // ─── CRISIS (slow, deliberate, deep) ─────────────────────
  18: { // Emergency Reset
    breath_inhale: [80, 50, 100],
    breath_hold:   [200],
    breath_exhale: [150, 100, 80],
    phase_shift:   [100, 80, 100],
    completion:    [200, 100, 200, 100, 300],
    intensity_modifier: 0.75,
  },
  19: { // Panic Interrupt
    breath_inhale: [60, 40, 80],
    breath_hold:   [150],
    breath_exhale: [120, 80, 60],
    phase_shift:   [80, 60, 80],
    completion:    [150, 100, 150, 100, 250],
    intensity_modifier: 0.80,
  },
  26: { // Transición a casa (reset suave, box 4-4-4-4 + grounding)
    breath_inhale: [40, 30, 80],
    breath_hold:   [200],
    breath_exhale: [120, 80, 40],
    phase_shift:   [60, 60, 60, 60],
    completion:    [200, 100, 200],
    intensity_modifier: 0.85,
  },
};

/**
 * Default fallback signature — usado cuando protocolId no está en catalog
 * o cuando el caller pasa un id inválido. Conservative middle-ground;
 * audible pero no dramatic. NO marca un protocolo específico — es la
 * señal "haptic genérica" para pre-flagship o protocolos no-instrumentados.
 */
export const DEFAULT_SIGNATURE = {
  breath_inhale: [40, 30, 60],
  breath_hold:   [120],
  breath_exhale: [80, 50, 30],
  phase_shift:   [60, 50, 60],
  completion:    [120, 80, 120],
  intensity_modifier: 1.0,
};

/**
 * Lookup helper. Defensive: cualquier input no-numérico, null, undefined,
 * o id no-en-catalog → DEFAULT_SIGNATURE (nunca tira excepción ni undefined).
 *
 * @param {number} protocolId
 * @returns {HapticSignature}
 */
export function getHapticSignature(protocolId) {
  if (typeof protocolId !== "number" || !Number.isFinite(protocolId)) {
    return DEFAULT_SIGNATURE;
  }
  return HAPTIC_SIGNATURES[protocolId] || DEFAULT_SIGNATURE;
}

/**
 * Phase kinds reconocidos (canon F0-4). Útil para iteration o tests.
 */
export const HAPTIC_PHASE_KINDS = [
  "breath_inhale",
  "breath_hold",
  "breath_exhale",
  "phase_shift",
  "completion",
];
