/* ═══════════════════════════════════════════════════════════════
   protocols.tier-training.test — Phase 4 SP7
   Verifica la migración multi-acto de los 3 protocolos training/active-extra:
   #15 Suspiro Fisiológico (active extra) : 3 fases × 1 = 3 actos
   #16 Resonancia Vagal     (training)    : 1+4+1 = 6 actos
   #17 NSDR 10 min          (training)    : 1+4+1+1 = 7 actos
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

const EXPECTED_ACTS = { 15: 3, 16: 6, 17: 7 };
const EXPECTED_PHASES = { 15: 3, 16: 3, 17: 4 };
const EXPECTED_USE_CASE = { 15: "active", 16: "training", 17: "training" };

describe("Tier training migration — protocolos #15, #16, #17", () => {
  [15, 16, 17].forEach((id) => {
    const proto = P.find((p) => p.id === id);
    describe(`Protocolo #${id} ${proto?.n}`, () => {
      it("existe en el catálogo", () => {
        expect(proto).toBeDefined();
      });

      it(`useCase = "${EXPECTED_USE_CASE[id]}"`, () => {
        expect(proto.useCase).toBe(EXPECTED_USE_CASE[id]);
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
    });
  });
});

describe("Tier training — TTS override en NSDR (#17)", () => {
  it("TODOS los actos de #17 tienen voice.enabled_default=true (voice-led)", () => {
    const p17 = P.find((p) => p.id === 17);
    flatActs(p17).forEach((act, i) => {
      expect(act.media?.voice?.enabled_default, `acto ${i}.media.voice.enabled_default`).toBe(true);
    });
  });

  it("Ningún acto de #16 tiene voice.enabled_default=true (no voice-led)", () => {
    const p16 = P.find((p) => p.id === 16);
    flatActs(p16).forEach((act, i) => {
      expect(act.media?.voice?.enabled_default !== true, `acto ${i}.media.voice.enabled_default`).toBe(true);
    });
  });
});

describe("Tier training — coherencia tiempo total", () => {
  it("#15 suma target_ms aprox 90s", () => {
    const p = P.find((x) => x.id === 15);
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBeGreaterThanOrEqual(80000);
    expect(total).toBeLessThanOrEqual(95000);
  });

  it("#16 suma target_ms aprox 600s", () => {
    const p = P.find((x) => x.id === 16);
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBeGreaterThanOrEqual(580000);
    expect(total).toBeLessThanOrEqual(620000);
  });

  it("#17 suma target_ms aprox 600s", () => {
    const p = P.find((x) => x.id === 17);
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBeGreaterThanOrEqual(580000);
    expect(total).toBeLessThanOrEqual(620000);
  });
});
