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
  // Phase 7 SP-Q-1 — primitive dedicated #18 Crisis tier sensory anchor
  //  (Phases 1+2+3 grounding 5-4-3-2-1 con mode visual/auditory/tactile
  //  + input + affirmation + voice-led + skip option).
  "crisis_sensory_anchor",
  // Phase 7 SP-Q-4 — #18 Phase 4 reusa physiological_sigh_orb F1 flagship
  //  dedicated del #15 (doble inhalación + exhalación prolongada).
  "physiological_sigh_orb",
  // Phase 7 SP-Q-5 — primitive dedicated #18 Phase 5 "¿Estoy Aquí?"
  //  (presence rings concéntricas + central dot crosshair + mantra
  //  word-by-word "Estoy aquí. En este momento." + hold-press 3s +
  //  palmas conflict prevention 8ª vez consecutiva).
  "presence_anchor_commitment",
  // Phase 7 SP-R-1 — primitive dedicated #19 Phase 1 "Exhalación
  //  Vagal Silenciosa" (exhalación larga + lengua al paladar × 3 +
  //  resonance orb + anillos emanando + cycle counter, SIN sonido).
  "vagal_vocalization",
  // Phase 7 SP-R-2 — primitive dedicated #19 Phase 2 "Apnea +
  //  Frente" (in:3 / hold:5 frontal press / ex:6 × 3 + 3 satélites
  //  trigeminales pulsando durante apnea + cycle counter).
  "apnea_frontal_press",
  // Phase 7 SP-R-3 — primitive dedicated #19 Phase 3 "Estás Aquí"
  //  (mantra word-by-word "Estoy aquí. Estoy a salvo." + safety
  //  halo 4 arcos cardinales + hold-press 3s + palmas conflict
  //  prevention 9ª vez: mano libre al pecho, pulgar en botón).
  "panic_anchor_closure",
  // Phase 7 SP-S-1 — primitive dedicated #20 Phase 1 "Sacudida
  //  Física" (energy core con jitter + bursting particles radiales
  //  + 8 radial lines pulsing + countdown 25s; phone-conflict
  //  resolution: sacude mano libre).
  "kinetic_release",
  // Phase 7 SP-S-2 — primitive dedicated #20 Phase 2 "Descarga
  //  Isométrica" (tense 10s orb compresses + density rings →
  //  release 10s burst particles + orb expands + step dots).
  "isometric_release",
  // Phase 7 SP-S-3 — primitive dedicated #20 Phase 3 "Re-encuadre"
  //  (central focal point + 3 branching paths to chips verticales
  //  + thinking window 4s + selected-path highlight).
  "reencuadre_choice",
  // Phase 7 SP-S-4 — primitive dedicated #20 Phase 4 "Acción Micro"
  //  (pill-shape hold button + 5 momentum chevrons advancing +
  //  5 MIN label mono + palmas conflict resolution 10ª vez:
  //  mano libre al pecho, pulgar en botón).
  "micro_action_momentum",
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

      it("último acto usa primitive hold_press_button o dedicated commitment (cierre crisis)", () => {
        // Phase 7 SP-Q-5 / SP-R-3 / SP-S-4: #18 P5 → presence_anchor_commitment;
        //   #19 P3 → panic_anchor_closure; #20 P4 → micro_action_momentum
        //   dedicated. Otros crisis tier siguen hold_press_button shared.
        const lastPhase = proto.ph[proto.ph.length - 1];
        const lastAct = lastPhase.iExec[lastPhase.iExec.length - 1];
        const expectedMap = {
          18: "presence_anchor_commitment",
          19: "panic_anchor_closure",
          20: "micro_action_momentum",
        };
        const expected = expectedMap[id] || "hold_press_button";
        expect(lastAct.ui.primitive).toBe(expected);
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
  it("#18 Emergency Reset usa crisis_sensory_anchor (visual + auditivo + tactile, SP-Q-1/2/3)", () => {
    // Phase 7 SP-Q-1/2/3: #18 Phases 1+2+3 migrated a crisis_sensory_anchor
    // con modes visual/auditory/tactile respectively. Total 3 actos sensory.
    const p = P.find((x) => x.id === 18);
    const anchorActs = flatActs(p).filter((a) =>
      a.ui?.primitive === "object_anchor_prompt"
      || a.ui?.primitive === "crisis_sensory_anchor"
      || a.ui?.primitive === "text_emphasis_voice"  // Phase 3 originalmente
    );
    // 3 phases sensory grounding (visual + auditivo + tactile)
    expect(anchorActs.length).toBeGreaterThanOrEqual(3);
  });

  it("#18 Emergency Reset usa breath_orb double_inhale o physiological_sigh_orb (SP-Q-4 wraps shared)", () => {
    // Phase 7 SP-Q-4: #18 Phase 4 migrated a physiological_sigh_orb (F1 flagship
    // dedicated heredado del #15 Suspiro Fisiológico). Acepta cualquiera por
    // contract evolutivo.
    const p = P.find((x) => x.id === 18);
    const breathAct = flatActs(p).find((a) =>
      a.ui?.primitive === "breath_orb"
      || a.ui?.primitive === "physiological_sigh_orb"
    );
    expect(breathAct).toBeDefined();
    if (breathAct.ui.primitive === "breath_orb") {
      expect(breathAct.ui.props.double_inhale).toBe(true);
    }
  });

  // Phase 5 SP1: #19 refactorizado — dive reflex con agua fría eliminado.
  // El protocolo NO debe usar facial_cold_prompt ni mencionar agua/lavabo.
  it("#19 Panic Interrupt NO usa facial_cold_prompt (refactor sin agua)", () => {
    const p = P.find((x) => x.id === 19);
    expect(flatActs(p).some((a) => a.ui?.primitive === "facial_cold_prompt")).toBe(false);
  });

  it("#19 Panic Interrupt usa vocal_with_haptic o vagal_vocalization (SP-R-1 wraps)", () => {
    // Phase 7 SP-R-1: #19 Phase 1 migrated a vagal_vocalization dedicated.
    const p = P.find((x) => x.id === 19);
    expect(flatActs(p).some((a) =>
      a.ui?.primitive === "vocal_with_haptic"
      || a.ui?.primitive === "vagal_vocalization"
    )).toBe(true);
  });

  it("#19 Panic Interrupt usa breath_orb o apnea_frontal_press (apnea voluntaria + presión trigeminal)", () => {
    // Phase 7 SP-R-2: Phase 2 migrated a apnea_frontal_press dedicated.
    const p = P.find((x) => x.id === 19);
    expect(flatActs(p).some((a) =>
      a.ui?.primitive === "breath_orb"
      || a.ui?.primitive === "apnea_frontal_press"
    )).toBe(true);
  });

  it("#20 Block Break usa shake_hands_prompt o kinetic_release (SP-S-1 wraps shared)", () => {
    // Phase 7 SP-S-1: #20 Phase 1 migrated a kinetic_release dedicated.
    const p = P.find((x) => x.id === 20);
    expect(flatActs(p).some((a) =>
      a.ui?.primitive === "shake_hands_prompt"
      || a.ui?.primitive === "kinetic_release"
    )).toBe(true);
  });

  it("#20 Block Break usa isometric_grip_prompt o isometric_release (SP-S-2 wraps shared)", () => {
    // Phase 7 SP-S-2: #20 Phase 2 migrated a isometric_release dedicated.
    const p = P.find((x) => x.id === 20);
    expect(flatActs(p).some((a) =>
      a.ui?.primitive === "isometric_grip_prompt"
      || a.ui?.primitive === "isometric_release"
    )).toBe(true);
  });

  it("#20 Block Break usa chip_selector o reencuadre_choice (SP-S-3 wraps shared)", () => {
    // Phase 7 SP-S-3: #20 Phase 3 migrated a reencuadre_choice dedicated.
    const p = P.find((x) => x.id === 20);
    expect(flatActs(p).some((a) =>
      a.ui?.primitive === "chip_selector"
      || a.ui?.primitive === "reencuadre_choice"
    )).toBe(true);
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
