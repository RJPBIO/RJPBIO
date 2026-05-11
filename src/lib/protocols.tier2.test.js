/* ═══════════════════════════════════════════════════════════════
   protocols.tier2.test — Phase 4 SP6
   Verifica la migración multi-acto de los protocolos #7-#12 (Tier 2):
   #7  HyperShift          : 1+1+1 = 3 actos
   #8  Lightning Focus     : 1+2+1 = 4 actos
   #9  Steel Core Reset    : 1+2+1 = 4 actos
   #10 Sensory Wake        : 1+2+1 = 4 actos
   #11 Body Anchor         : 1+2+1 = 4 actos
   #12 Neural Ascension    : 1+1+1+1 = 4 actos (4 fases)
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { P } from "./protocols";

const VALID_VALIDATION_KINDS = new Set([
  "min_duration", "breath_cycles", "tap_count", "hold_press",
  "chip_selection", "eye_movement", "ppg_breath_match",
  "visual_completion", "no_validation",
]);

const VALID_PRIMITIVES = new Set([
  "breath_orb", "bilateral_tap_targets", "ocular_dots",
  "ocular_horizontal_metronome", "visual_panoramic_prompt",
  "dual_focus_targets", "body_silhouette_highlight", "posture_visual",
  "isometric_grip_prompt", "chest_percussion_prompt",
  "facial_cold_prompt", "shake_hands_prompt", "chip_selector",
  "hold_press_button", "text_emphasis_voice", "silence_cyan_minimal",
  "object_anchor_prompt", "vocal_with_haptic", "transition_dots",
  // Phase 7 SP-H-1 — primitive dedicated #7 Phase 1 "Percusión
  // Atencional" (compound motor sternum + breath 3-2-5 + body anchor).
  "emotional_discharge_percussion",
  // Phase 7 SP-H-2 — primitive dedicated #7 Phase 2 "Contracción
  // Isométrica" (fist abre/cierra animation + dynamic state APRIETA/SUELTA
  // + countdown exact + 3-cycle indicator + body anchor "aprieta suave").
  "isometric_discharge",
  // Phase 7 SP-H-3 — primitive dedicated #7 Phase 3 "Reset Cognitivo"
  // (macro-phase A→B + identifies one different action + hold-press 6s
  // + body anchor mental sin manos extras palmas conflict prevention).
  "cognitive_reset_commitment",
  // Phase 7 SP-I-1 — primitive dedicated #8 Phase 1 "Reset Visual"
  // (oculomotor 0.5Hz horizontal sine oscillation + track line +
  // 15-cycle counter + body anchor "cabeza inmóvil solo los ojos").
  "ocular_reset_metronome",
  // Phase 7 SP-I-2 — primitive dedicated #8 Phase 2 "Fijación + Mantra"
  // (focal point + halo peak; mode="fixation" sustained gaze + concentric
  //  rings + countdown; mode="mantra" focal pulsa breath sync + word
  //  emerge per exhale + mantra counter).
  "focal_anchor_mantra",
  // Phase 7 SP-I-3 — primitive dedicated #8 Phase 3 "Lock-in"
  // (60-min badge + 12 segmented arcs lock progressive + hold-press 6s
  //  con palmas conflict prevention).
  "lock_in_commitment",
  // Phase 7 SP-J-1 — primitive dedicated #9 Phase 1 "Exhale Explosivo"
  // (central core compresses inhale → bursts exhale + 3 burst rings
  //  staggered + sound bars vertical sync intensity + cadence 4-0-6-0
  //  × 3 cycles).
  "vagal_burst_exhale",
  // Phase 7 SP-J-2 — primitive dedicated #9 Phase 2 "Núcleo de Acero"
  // dual-mode (mode="activation" 5-stage progression feet→core→spine→
  //  shoulders→head; mode="lateral_breath" body silhouette persists +
  //  ribs lateral expansion ← → sync cadence).
  "steel_core_activation",
  // Phase 7 SP-J-3 — primitive dedicated #9 Phase 3 "Cierre con
  //  Estructura" (body silhouette persists + core column locked +
  //  hold-press 6s + verbal mantra word-by-word emerge "Soy una
  //  columna vertical estable" + palmas conflict prevention).
  "steel_core_column_commitment",
  // Phase 7 SP-K-1 — primitive dedicated #10 Phase 1 "Pulso Respiratorio"
  //  (orb smooth expand inhale + 4 pulsos staccato exhale + pulse train
  //  indicator 4 dots sequential + cadence 1-0-2-0 × 10 cycles).
  "respiratory_pulse_train",
  // Phase 7 SP-K-2 — primitive dedicated #10 Phase 2 "Barrido Sensorial"
  //  dual-mode (mode="body_scan" 6-zone progression ascendente feet→head
  //  + tactile pulse dots muslos; mode="attention_global" all zones lit
  //  + pulse continues subtle).
  "sensory_awake",
  // Phase 7 SP-K-3 — primitive dedicated #10 Phase 3 "Activación
  //  Direccional" (body silhouette + horizontal forward arrow + 3 comets
  //  streaming durante hold + hold-press 5s + palmas conflict prevention).
  "directional_activation_commitment",
  // Phase 7 SP-L-1 — primitive dedicated #11 Phase 1 "Anclaje
  //  Diafragmático" (body silhouette + hand on abdomen SVG + diafragma
  //  expansion sync inhale + energy descent particles hacia suelo
  //  pélvico durante exhale + cadence 4-0-8-0 × 2 cycles).
  "diaphragmatic_anchor",
  // Phase 7 SP-L-2 — primitive dedicated #11 Phase 2 "Relajación
  //  Descendente" dual-mode (mode="body_scan_descent" 7-zone progression
  //  head→feet release per zone; mode="descent_hold" all body lit
  //  sostén interocéptivo).
  "relaxation_descent",
  // Phase 7 SP-L-3 — primitive dedicated #11 Phase 3 "Anclaje Final"
  //  (body silhouette + roots descendiendo desde pies hacia ground +
  //  horizon line + mantra "Aquí. Anclado." + hold-press 6s + palmas
  //  conflict prevention 5ª vez consecutiva).
  "grounding_anchor_commitment",
  // Phase 7 SP-M-1 — primitive dedicated #12 Phase 1 "Respiración
  //  Vertical" (body silhouette + vertical breath beam ascendiendo
  //  abdomen→pecho durante inhale + sustained chest hold 2s + descenso
  //  pecho→abdomen exhale + cadence 4-2-6 × 2 cycles).
  "vertical_breath_ascension",
  // Phase 7 SP-M-2 — primitive dedicated #12 Phase 2 "Alineación
  //  5 Puntos" (body silhouette + 5 postural anchor zones ascending
  //  feet→glutes→spine→shoulders→head + vertical postural axis builds
  //  bottom-up cumulative).
  "postural_alignment",
  // Phase 7 SP-M-3 — primitive dedicated #12 Phase 3 "Apertura
  //  Cognitiva" (focal orb + thought waves radiantes + 3-stage
  //  reflection question→identify→hold + countdown 25s). PRIMER
  //  primitive cognitivo en cadena Tier 2.
  "cognitive_opening",
  // Phase 7 SP-M-4 — primitive dedicated #12 Phase 4 "Commitment
  //  Motor" (body silhouette + 3 verbalization checkmarks sequential
  //  + ascension beam rising per repetition + hold-press 6s + mantra
  //  "Esta es la decisión." × 3 + palmas conflict prevention 6ª vez).
  //  ÚLTIMA Phase Tier 2 dedicated. Cierre del progreso #7-#12.
  "neural_ascension_commitment",
]);

function flatActs(p) {
  return p.ph.flatMap((ph) => ph.iExec || []);
}

const EXPECTED_ACTS = { 7: 3, 8: 4, 9: 4, 10: 4, 11: 4, 12: 4 };
const EXPECTED_PHASES = { 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 4 };

describe("Tier 2 migration — protocolos #7-#12", () => {
  [7, 8, 9, 10, 11, 12].forEach((id) => {
    const proto = P.find((p) => p.id === id);
    describe(`Protocolo #${id} ${proto?.n}`, () => {
      it("existe en el catálogo", () => {
        expect(proto).toBeDefined();
      });

      it(`tiene ${EXPECTED_PHASES[id]} fases`, () => {
        expect(proto.ph.length).toBe(EXPECTED_PHASES[id]);
      });

      it(`tiene ${EXPECTED_ACTS[id]} actos totales`, () => {
        expect(flatActs(proto).length).toBe(EXPECTED_ACTS[id]);
      });

      it("cada acto tiene type explícito", () => {
        flatActs(proto).forEach((act, i) => {
          expect(typeof act.type, `acto ${i}.type`).toBe("string");
          expect(act.type.length).toBeGreaterThan(0);
        });
      });

      it("cada acto tiene duration {min_ms, target_ms, max_ms}", () => {
        flatActs(proto).forEach((act, i) => {
          expect(act.duration, `acto ${i}.duration`).toBeDefined();
          expect(typeof act.duration.min_ms).toBe("number");
          expect(typeof act.duration.target_ms).toBe("number");
          expect(typeof act.duration.max_ms).toBe("number");
          expect(act.duration.min_ms).toBeLessThanOrEqual(act.duration.target_ms);
          expect(act.duration.target_ms).toBeLessThanOrEqual(act.duration.max_ms);
        });
      });

      it("cada acto tiene validate.kind válido", () => {
        flatActs(proto).forEach((act, i) => {
          expect(act.validate, `acto ${i}.validate`).toBeDefined();
          expect(VALID_VALIDATION_KINDS.has(act.validate.kind)).toBe(true);
        });
      });

      it("cada acto tiene ui.primitive del enum válido", () => {
        flatActs(proto).forEach((act, i) => {
          expect(act.ui, `acto ${i}.ui`).toBeDefined();
          expect(typeof act.ui.primitive).toBe("string");
          expect(VALID_PRIMITIVES.has(act.ui.primitive)).toBe(true);
        });
      });

      it("cada acto tiene media config", () => {
        flatActs(proto).forEach((act, i) => {
          expect(act.media, `acto ${i}.media`).toBeDefined();
        });
      });

      it("cada acto tiene mechanism string", () => {
        flatActs(proto).forEach((act, i) => {
          expect(typeof act.mechanism, `acto ${i}.mechanism`).toBe("string");
          expect(act.mechanism.length).toBeGreaterThan(20);
        });
      });

      it("primer acto inicia binaural con type === protocol.int", () => {
        const firstAct = proto.ph[0].iExec[0];
        expect(firstAct.media.binaural?.action).toBe("start");
        expect(firstAct.media.binaural?.type).toBe(proto.int);
      });

      it("último acto detiene binaural", () => {
        const lastPhase = proto.ph[proto.ph.length - 1];
        const lastAct = lastPhase.iExec[lastPhase.iExec.length - 1];
        expect(lastAct.media.binaural?.action).toBe("stop");
      });

      it("último acto usa primitive dedicated (commitment cierre · #7-#12 todos dedicated)", () => {
        // Phase 7 SP-H-3..M-4: protocolos #7-#12 Phase último acto upgraded
        // a primitives dedicated. TODOS los Tier 2 ya tienen commitment
        // dedicated — palmas conflict prevention aplicada 6 veces consecutivas.
        const lastPhase = proto.ph[proto.ph.length - 1];
        const lastAct = lastPhase.iExec[lastPhase.iExec.length - 1];
        const expectedMap = {
          7: "cognitive_reset_commitment",
          8: "lock_in_commitment",
          9: "steel_core_column_commitment",
          10: "directional_activation_commitment",
          11: "grounding_anchor_commitment",
          12: "neural_ascension_commitment",
        };
        const expected = expectedMap[id] || "hold_press_button";
        expect(lastAct.ui.primitive).toBe(expected);
      });
    });
  });
});

describe("Tier 2 — primitivas nuevas usadas (Tier 2 introduce más variedad)", () => {
  it("#7 HyperShift usa chest_percussion_prompt o emotional_discharge_percussion (SP-H-1 wraps shared)", () => {
    // Phase 7 SP-H-1: #7 Phase 1 acto[0] migrated a emotional_discharge_percussion
    // dedicated primitive. Acepta cualquiera para preservar contract evolutivo.
    const p = P.find((x) => x.id === 7);
    expect(flatActs(p).some((a) => a.ui?.primitive === "chest_percussion_prompt"
      || a.ui?.primitive === "emotional_discharge_percussion")).toBe(true);
  });

  it("#7 HyperShift usa isometric_grip_prompt o isometric_discharge (SP-H-2 wraps shared)", () => {
    const p = P.find((x) => x.id === 7);
    expect(flatActs(p).some((a) => a.ui?.primitive === "isometric_grip_prompt"
      || a.ui?.primitive === "isometric_discharge")).toBe(true);
  });

  it("#8 Lightning Focus usa ocular_horizontal_metronome o ocular_reset_metronome (SP-I-1 wraps shared)", () => {
    const p = P.find((x) => x.id === 8);
    expect(flatActs(p).some((a) => a.ui?.primitive === "ocular_horizontal_metronome"
      || a.ui?.primitive === "ocular_reset_metronome")).toBe(true);
  });

  it("#8 Lightning Focus usa visual_panoramic_prompt o focal_anchor_mantra fixation (SP-I-2 wraps shared)", () => {
    // Phase 7 SP-I-2: #8 Phase 2 sub-acto 0 migrated a focal_anchor_mantra
    // mode="fixation" dedicated. Acepta cualquiera por contract evolutivo.
    const p = P.find((x) => x.id === 8);
    expect(flatActs(p).some((a) => a.ui?.primitive === "visual_panoramic_prompt"
      || (a.ui?.primitive === "focal_anchor_mantra" && a.ui?.props?.mode === "fixation"))).toBe(true);
  });

  it("#8 Lightning Focus usa text_emphasis_voice o focal_anchor_mantra mantra (SP-I-2 wraps shared)", () => {
    // Phase 7 SP-I-2: #8 Phase 2 sub-acto 1 migrated a focal_anchor_mantra
    // mode="mantra" dedicated. Acepta cualquiera por contract evolutivo.
    const p = P.find((x) => x.id === 8);
    expect(flatActs(p).some((a) => a.ui?.primitive === "text_emphasis_voice"
      || (a.ui?.primitive === "focal_anchor_mantra" && a.ui?.props?.mode === "mantra"))).toBe(true);
  });

  it("#9 Steel Core Reset usa posture_visual o steel_core_activation activation (SP-J-2 wraps shared)", () => {
    // Phase 7 SP-J-2: #9 Phase 2 sub-acto 0 migrated a steel_core_activation
    // mode="activation" dedicated. Acepta cualquiera por contract evolutivo.
    const p = P.find((x) => x.id === 9);
    expect(flatActs(p).some((a) => a.ui?.primitive === "posture_visual"
      || (a.ui?.primitive === "steel_core_activation" && a.ui?.props?.mode === "activation"))).toBe(true);
  });

  it("#9 Steel Core Reset usa silence_cyan_minimal o steel_core_activation lateral_breath (SP-J-2 wraps shared)", () => {
    // Phase 7 SP-J-2: #9 Phase 2 sub-acto 1 migrated a steel_core_activation
    // mode="lateral_breath" dedicated. Acepta cualquiera por contract evolutivo.
    const p = P.find((x) => x.id === 9);
    expect(flatActs(p).some((a) => a.ui?.primitive === "silence_cyan_minimal"
      || (a.ui?.primitive === "steel_core_activation" && a.ui?.props?.mode === "lateral_breath"))).toBe(true);
  });

  it("#11 Body Anchor usa body_silhouette_highlight o relaxation_descent body_scan_descent (SP-L-2 wraps)", () => {
    // Phase 7 SP-L-2: #11 Phase 2 sub-acto 0 migrated a relaxation_descent
    // mode="body_scan_descent" dedicated. Acepta cualquiera por contract evolutivo.
    const p = P.find((x) => x.id === 11);
    const bodyAct = flatActs(p).find((a) => a.ui?.primitive === "body_silhouette_highlight"
      || (a.ui?.primitive === "relaxation_descent" && a.ui?.props?.mode === "body_scan_descent"));
    expect(bodyAct).toBeDefined();
    if (bodyAct.ui.primitive === "body_silhouette_highlight") {
      expect(bodyAct.ui.props.highlight_progression[0]).toBe("head");
    }
  });

  it("#11 Body Anchor usa silence_cyan_minimal o relaxation_descent descent_hold (SP-L-2 wraps)", () => {
    // Phase 7 SP-L-2: #11 Phase 2 sub-acto 1 migrated a relaxation_descent
    // mode="descent_hold" dedicated. Acepta cualquiera por contract evolutivo.
    const p = P.find((x) => x.id === 11);
    expect(flatActs(p).some((a) => a.ui?.primitive === "silence_cyan_minimal"
      || (a.ui?.primitive === "relaxation_descent" && a.ui?.props?.mode === "descent_hold"))).toBe(true);
  });

  it("#10 Sensory Wake usa body_silhouette_highlight o sensory_awake body_scan (SP-K-2 wraps shared)", () => {
    // Phase 7 SP-K-2: #10 Phase 2 sub-acto 0 migrated a sensory_awake mode
    // body_scan dedicated. Acepta cualquiera por contract evolutivo.
    const p = P.find((x) => x.id === 10);
    const bodyAct = flatActs(p).find((a) => a.ui?.primitive === "body_silhouette_highlight"
      || (a.ui?.primitive === "sensory_awake" && a.ui?.props?.mode === "body_scan"));
    expect(bodyAct).toBeDefined();
    // Si es shared, verifica que es ascendente (feet primero); si es dedicated,
    // el orden está hard-coded en la primitive (feet→head).
    if (bodyAct.ui.primitive === "body_silhouette_highlight") {
      expect(bodyAct.ui.props.highlight_progression[0]).toBe("feet");
    }
  });

  it("#10 Sensory Wake usa silence_cyan_minimal o sensory_awake attention_global (SP-K-2 wraps shared)", () => {
    // Phase 7 SP-K-2: #10 Phase 2 sub-acto 1 migrated a sensory_awake mode
    // attention_global dedicated. Acepta cualquiera por contract evolutivo.
    const p = P.find((x) => x.id === 10);
    expect(flatActs(p).some((a) => a.ui?.primitive === "silence_cyan_minimal"
      || (a.ui?.primitive === "sensory_awake" && a.ui?.props?.mode === "attention_global"))).toBe(true);
  });

  it("#12 Neural Ascension usa posture_visual o postural_alignment (SP-M-2 wraps shared)", () => {
    // Phase 7 SP-M-2: #12 Phase 2 acto migrated a postural_alignment dedicated.
    // Acepta cualquiera por contract evolutivo. postural_alignment hard-codes
    // 5 zones internally (feet→glutes→spine→shoulders→head).
    const p = P.find((x) => x.id === 12);
    const postureAct = flatActs(p).find((a) => a.ui?.primitive === "posture_visual"
      || a.ui?.primitive === "postural_alignment");
    expect(postureAct).toBeDefined();
    if (postureAct.ui.primitive === "posture_visual") {
      expect(postureAct.ui.props.points.length).toBe(5);
    }
  });
});

describe("Tier 2 — coherencia tiempo dentro de fase", () => {
  it("act timestamps respetan límites de phase", () => {
    [7, 8, 9, 10, 11, 12].forEach((id) => {
      const proto = P.find((p) => p.id === id);
      proto.ph.forEach((phase, pIdx) => {
        const phaseDur = phase.e - phase.s;
        phase.iExec.forEach((act, aIdx) => {
          expect(act.from, `proto #${id} ph${pIdx} act${aIdx}.from`).toBeGreaterThanOrEqual(0);
          expect(act.to, `proto #${id} ph${pIdx} act${aIdx}.to`).toBeLessThanOrEqual(phaseDur);
          expect(act.to).toBeGreaterThan(act.from);
        });
      });
    });
  });

  it("validate.min_ms ≤ duration.max_ms en todos los actos", () => {
    [7, 8, 9, 10, 11, 12].forEach((id) => {
      const proto = P.find((p) => p.id === id);
      flatActs(proto).forEach((act) => {
        if (act.validate.kind === "min_duration") {
          expect(act.validate.min_ms).toBeLessThanOrEqual(act.duration.max_ms);
        }
      });
    });
  });
});
