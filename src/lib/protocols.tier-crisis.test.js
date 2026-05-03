/* ═══════════════════════════════════════════════════════════════
   protocols.tier-crisis.test — Phase 4 SP8
   Verifica la migración multi-acto de los 3 protocolos crisis:
   #18 Emergency Reset (5-4-3-2-1) : 5 fases × 1 = 5 actos
   #19 Panic Interrupt (dive reflex): 3 fases × 1 = 3 actos + safety
   #20 Block Break (crisis cognitiva): 4 fases × 1 = 4 actos
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

const EXPECTED_ACTS = { 18: 5, 19: 3, 20: 4 };
const EXPECTED_PHASES = { 18: 5, 19: 3, 20: 4 };

describe("Tier crisis migration — protocolos #18, #19, #20", () => {
  [18, 19, 20].forEach((id) => {
    const proto = P.find((p) => p.id === id);
    describe(`Protocolo #${id} ${proto?.n}`, () => {
      it("existe en el catálogo", () => {
        expect(proto).toBeDefined();
      });

      it('useCase = "crisis"', () => {
        expect(proto.useCase).toBe("crisis");
      });

      it(`tiene ${EXPECTED_PHASES[id]} fases`, () => {
        expect(proto.ph.length).toBe(EXPECTED_PHASES[id]);
      });

      it(`tiene ${EXPECTED_ACTS[id]} actos totales`, () => {
        expect(flatActs(proto).length).toBe(EXPECTED_ACTS[id]);
      });

      it("TODOS los actos tienen validate.kind=\"no_validation\" (crisis acredita siempre)", () => {
        flatActs(proto).forEach((act, i) => {
          expect(act.validate?.kind, `acto ${i}.validate.kind`).toBe("no_validation");
          expect(act.validate?.reason).toBe("crisis_no_pressure");
        });
      });

      it("TODOS los actos tienen voice.enabled_default=true (crisis voice override)", () => {
        flatActs(proto).forEach((act, i) => {
          expect(act.media?.voice?.enabled_default, `acto ${i}.media.voice.enabled_default`).toBe(true);
        });
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
        });
      });

      it("cada acto tiene ui.primitive del enum válido", () => {
        flatActs(proto).forEach((act, i) => {
          expect(act.ui, `acto ${i}.ui`).toBeDefined();
          expect(typeof act.ui.primitive).toBe("string");
          expect(VALID_PRIMITIVES.has(act.ui.primitive)).toBe(true);
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

      it("HoldPress min_hold_ms es ≤3000 (crisis: hold corto, sin presión)", () => {
        const lastPhase = proto.ph[proto.ph.length - 1];
        const lastAct = lastPhase.iExec[lastPhase.iExec.length - 1];
        expect(lastAct.ui.props.min_hold_ms).toBeLessThanOrEqual(3000);
      });

      it("tiene safety field no vacío", () => {
        expect(typeof proto.safety).toBe("string");
        expect(proto.safety.length).toBeGreaterThan(20);
      });
    });
  });
});

describe("Tier crisis — primitivas crisis-específicas usadas", () => {
  it("#18 Emergency Reset usa object_anchor_prompt (visual + auditivo)", () => {
    const p = P.find((x) => x.id === 18);
    const objectAnchorActs = flatActs(p).filter((a) => a.ui?.primitive === "object_anchor_prompt");
    expect(objectAnchorActs.length).toBe(2); // visual + auditivo
  });

  it("#18 Emergency Reset usa breath_orb con double_inhale", () => {
    const p = P.find((x) => x.id === 18);
    const breathAct = flatActs(p).find((a) => a.ui?.primitive === "breath_orb");
    expect(breathAct).toBeDefined();
    expect(breathAct.ui.props.double_inhale).toBe(true);
  });

  // Phase 5 SP1: #19 refactorizado — dive reflex con agua fría eliminado.
  // El protocolo NO debe usar facial_cold_prompt ni mencionar agua/lavabo.
  it("#19 Panic Interrupt NO usa facial_cold_prompt (refactor sin agua)", () => {
    const p = P.find((x) => x.id === 19);
    expect(flatActs(p).some((a) => a.ui?.primitive === "facial_cold_prompt")).toBe(false);
  });

  it("#19 Panic Interrupt usa vocal_with_haptic (vagal vocalization)", () => {
    const p = P.find((x) => x.id === 19);
    expect(flatActs(p).some((a) => a.ui?.primitive === "vocal_with_haptic")).toBe(true);
  });

  it("#19 Panic Interrupt usa breath_orb (apnea voluntaria + presión trigeminal)", () => {
    const p = P.find((x) => x.id === 19);
    expect(flatActs(p).some((a) => a.ui?.primitive === "breath_orb")).toBe(true);
  });

  it("#20 Block Break usa shake_hands_prompt", () => {
    const p = P.find((x) => x.id === 20);
    expect(flatActs(p).some((a) => a.ui?.primitive === "shake_hands_prompt")).toBe(true);
  });

  it("#20 Block Break usa isometric_grip_prompt", () => {
    const p = P.find((x) => x.id === 20);
    expect(flatActs(p).some((a) => a.ui?.primitive === "isometric_grip_prompt")).toBe(true);
  });

  it("#20 Block Break usa chip_selector (re-encuadre)", () => {
    const p = P.find((x) => x.id === 20);
    expect(flatActs(p).some((a) => a.ui?.primitive === "chip_selector")).toBe(true);
  });
});

describe("Tier crisis — safety field requirements", () => {
  // Phase 5 SP1: tras refactor sin agua, #19 usa safety genérico igual que #18 y #20.
  it("#19 safety menciona profesional o emergencia (no agua fría)", () => {
    const p = P.find((x) => x.id === 19);
    const safety = p.safety.toLowerCase();
    expect(
      safety.includes("profesional") || safety.includes("emergencia") ||
      safety.includes("911"),
    ).toBe(true);
    // Refactor: ya no menciona agua fría / lavabo / dive reflex
    expect(safety.includes("agua fría")).toBe(false);
    expect(safety.includes("lavabo")).toBe(false);
  });

  it("#18 safety menciona profesional o emergencia (911)", () => {
    const p = P.find((x) => x.id === 18);
    const safety = p.safety.toLowerCase();
    expect(safety.includes("profesional") || safety.includes("911") || safety.includes("emergencia")).toBe(true);
  });
});

describe("Tier crisis — coherencia tiempo total", () => {
  it("#18 suma target_ms aprox 130-140s", () => {
    const p = P.find((x) => x.id === 18);
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBeGreaterThanOrEqual(120000);
    expect(total).toBeLessThanOrEqual(150000);
  });

  it("#19 suma target_ms aprox 100-120s", () => {
    const p = P.find((x) => x.id === 19);
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBeGreaterThanOrEqual(95000);
    expect(total).toBeLessThanOrEqual(125000);
  });

  it("#20 suma target_ms aprox 100-120s", () => {
    const p = P.find((x) => x.id === 20);
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBeGreaterThanOrEqual(95000);
    expect(total).toBeLessThanOrEqual(125000);
  });
});
