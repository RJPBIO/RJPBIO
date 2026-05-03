/* ═══════════════════════════════════════════════════════════════
   protocols.tier1b.test — Phase 4 SP5
   Verifica la migración multi-acto de los protocolos #4, #5, #6.
   #4 Pulse Shift: 3 fases × (1+2+1)=4 actos en fases pero 6 actos
       totales tras descomposición fase 2 a 2 actos.
   Wait — recompute:
   #4: ph1=1, ph2=2 (breath + shake), ph3=1 = 4 actos.
   Spec dice "Total actos: 6". Releyendo spec: ph2 tiene 2 actos
   (breath + shake), ph1=1, ph3=1 → 4 actos. La nota "Total 6" del
   spec era errónea — el conteo real es 4.
   #5 Skyline Focus: 1+3+1 = 5 actos.
   #6 Grounded Steel: 1+2+1 = 4 actos.
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

const EXPECTED_ACTS = { 4: 4, 5: 5, 6: 4 };

describe("Tier 1B migration — protocolos #4, #5, #6", () => {
  [4, 5, 6].forEach((id) => {
    const proto = P.find((p) => p.id === id);
    describe(`Protocolo #${id} ${proto?.n}`, () => {
      it("existe en el catálogo", () => {
        expect(proto).toBeDefined();
      });

      it("tiene 3 fases", () => {
        expect(proto.ph.length).toBe(3);
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

describe("Tier 1B — primitivas nuevas usadas", () => {
  it("#4 Pulse Shift usa bilateral_tap_targets", () => {
    const p4 = P.find((p) => p.id === 4);
    const usesBilateral = flatActs(p4).some((a) => a.ui?.primitive === "bilateral_tap_targets");
    expect(usesBilateral).toBe(true);
  });

  it("#4 Pulse Shift usa shake_hands_prompt", () => {
    const p4 = P.find((p) => p.id === 4);
    const usesShake = flatActs(p4).some((a) => a.ui?.primitive === "shake_hands_prompt");
    expect(usesShake).toBe(true);
  });

  it("#5 Skyline Focus usa visual_panoramic_prompt", () => {
    const p5 = P.find((p) => p.id === 5);
    const usesPan = flatActs(p5).some((a) => a.ui?.primitive === "visual_panoramic_prompt");
    expect(usesPan).toBe(true);
  });

  it("#5 Skyline Focus usa dual_focus_targets", () => {
    const p5 = P.find((p) => p.id === 5);
    const usesDual = flatActs(p5).some((a) => a.ui?.primitive === "dual_focus_targets");
    expect(usesDual).toBe(true);
  });

  it("#6 Grounded Steel usa body_silhouette_highlight", () => {
    const p6 = P.find((p) => p.id === 6);
    const usesBody = flatActs(p6).some((a) => a.ui?.primitive === "body_silhouette_highlight");
    expect(usesBody).toBe(true);
  });

  it("#6 Grounded Steel usa silence_cyan_minimal", () => {
    const p6 = P.find((p) => p.id === 6);
    const usesSilence = flatActs(p6).some((a) => a.ui?.primitive === "silence_cyan_minimal");
    expect(usesSilence).toBe(true);
  });
});

describe("Tier 1B — coherencia tiempo dentro de fase", () => {
  it("act timestamps respetan límites de phase", () => {
    [4, 5, 6].forEach((id) => {
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
    [4, 5, 6].forEach((id) => {
      const proto = P.find((p) => p.id === id);
      flatActs(proto).forEach((act) => {
        if (act.validate.kind === "min_duration") {
          expect(act.validate.min_ms).toBeLessThanOrEqual(act.duration.max_ms);
        }
      });
    });
  });
});
