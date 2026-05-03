/* ═══════════════════════════════════════════════════════════════
   protocols.tier1a.test — Phase 4 SP4
   Verifica la migración multi-acto de los protocolos #1, #2, #3.
   Cada uno: 5 actos extendidos (1 breath + 3 cognitivos + 1 motor).
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

describe("Tier 1A migration — protocolos #1, #2, #3", () => {
  const TIER1A_IDS = [1, 2, 3];

  TIER1A_IDS.forEach((id) => {
    const proto = P.find((p) => p.id === id);
    describe(`Protocolo #${id} ${proto?.n}`, () => {
      it("existe en el catálogo", () => {
        expect(proto).toBeDefined();
      });

      it("tiene 3 fases (Fase 1 + Fase 2 + Fase 3)", () => {
        expect(proto.ph.length).toBe(3);
      });

      it("tiene 5 actos totales (1 + 3 + 1)", () => {
        const acts = flatActs(proto);
        expect(acts.length).toBe(5);
      });

      it("Fase 1 tiene 1 acto", () => {
        expect(proto.ph[0].iExec.length).toBe(1);
      });

      it("Fase 2 tiene 3 actos sub-divididos", () => {
        expect(proto.ph[1].iExec.length).toBe(3);
      });

      it("Fase 3 tiene 1 acto", () => {
        expect(proto.ph[2].iExec.length).toBe(1);
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

      it("cada acto tiene media config (voice/breath_ticks/binaural)", () => {
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

      it("Fase 1 acto usa primitive breath_orb", () => {
        expect(proto.ph[0].iExec[0].ui.primitive).toBe("breath_orb");
      });

      it("Fase 3 acto usa primitive hold_press_button", () => {
        expect(proto.ph[2].iExec[0].ui.primitive).toBe("hold_press_button");
      });

      it("primer acto inicia binaural con type === protocol.int", () => {
        const firstAct = proto.ph[0].iExec[0];
        expect(firstAct.media.binaural?.action).toBe("start");
        expect(firstAct.media.binaural?.type).toBe(proto.int);
      });

      it("último acto detiene binaural", () => {
        const lastAct = proto.ph[2].iExec[0];
        expect(lastAct.media.binaural?.action).toBe("stop");
      });
    });
  });
});

describe("Tier 1A — coherencia de tiempo", () => {
  it("la suma de actos de cada protocolo respeta los límites de fase", () => {
    [1, 2, 3].forEach((id) => {
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

  it("validate.min_ms es razonable vs duration.min_ms (no exceeds duration)", () => {
    [1, 2, 3].forEach((id) => {
      const proto = P.find((p) => p.id === id);
      proto.ph.forEach((phase) => {
        phase.iExec.forEach((act) => {
          if (act.validate.kind === "min_duration") {
            expect(act.validate.min_ms).toBeLessThanOrEqual(act.duration.target_ms + 5000);
          }
        });
      });
    });
  });
});
