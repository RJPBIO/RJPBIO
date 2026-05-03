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

      it("último acto usa primitive hold_press_button (commitment cierre)", () => {
        const lastPhase = proto.ph[proto.ph.length - 1];
        const lastAct = lastPhase.iExec[lastPhase.iExec.length - 1];
        expect(lastAct.ui.primitive).toBe("hold_press_button");
      });
    });
  });
});

describe("Tier 2 — primitivas nuevas usadas (Tier 2 introduce más variedad)", () => {
  it("#7 HyperShift usa chest_percussion_prompt", () => {
    const p = P.find((x) => x.id === 7);
    expect(flatActs(p).some((a) => a.ui?.primitive === "chest_percussion_prompt")).toBe(true);
  });

  it("#7 HyperShift usa isometric_grip_prompt", () => {
    const p = P.find((x) => x.id === 7);
    expect(flatActs(p).some((a) => a.ui?.primitive === "isometric_grip_prompt")).toBe(true);
  });

  it("#8 Lightning Focus usa ocular_horizontal_metronome", () => {
    const p = P.find((x) => x.id === 8);
    expect(flatActs(p).some((a) => a.ui?.primitive === "ocular_horizontal_metronome")).toBe(true);
  });

  it("#9 Steel Core Reset usa posture_visual", () => {
    const p = P.find((x) => x.id === 9);
    expect(flatActs(p).some((a) => a.ui?.primitive === "posture_visual")).toBe(true);
  });

  it("#11 Body Anchor usa body_silhouette_highlight (descendente)", () => {
    const p = P.find((x) => x.id === 11);
    const bodyAct = flatActs(p).find((a) => a.ui?.primitive === "body_silhouette_highlight");
    expect(bodyAct).toBeDefined();
    // Verifica que es body scan descendente (head primero)
    expect(bodyAct.ui.props.highlight_progression[0]).toBe("head");
  });

  it("#10 Sensory Wake usa body_silhouette_highlight (ascendente)", () => {
    const p = P.find((x) => x.id === 10);
    const bodyAct = flatActs(p).find((a) => a.ui?.primitive === "body_silhouette_highlight");
    expect(bodyAct).toBeDefined();
    // Verifica que es body scan ascendente (feet primero)
    expect(bodyAct.ui.props.highlight_progression[0]).toBe("feet");
  });

  it("#12 Neural Ascension usa posture_visual (5 puntos)", () => {
    const p = P.find((x) => x.id === 12);
    const postureAct = flatActs(p).find((a) => a.ui?.primitive === "posture_visual");
    expect(postureAct).toBeDefined();
    expect(postureAct.ui.props.points.length).toBe(5);
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
