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
  // Phase 7 F3 Flagship #1 — primitive dedicated para Reinicio
  // Parasimpático Phase 1 "Entrada Vagal" (BOX 4-4-4-4).
  "parasympathic_reset_orb",
  // Phase 7 SP-B-3 — primitive dedicated para #1 Phase 2 "Descarga
  // Cognitiva" (multi-task wrapper text+chip+text con subActIdx 0/1/2).
  "cognitive_descarga",
  // Phase 7 SP-B-4 — primitive dedicated para #1 Phase 3 "Dirección
  // y Cierre" (multi-task wrapper hold-press + visualization + orb +
  // particles centrifugal + body anchor + scientific eyebrow morph).
  "commitment_motor",
  // Phase 7 SP-C-1 — primitive dedicated para #2 Phase 1 "Coherencia
  // Cardíaca" (HeartMath 6-2-8-0 con inner cardiac pulse + body anchor
  // mano sobre corazón + particles bio-synced).
  "cardiac_coherence_orb",
  // Phase 7 SP-C-2 — primitive dedicated para #2 Phase 2 "Etiquetado
  // Emocional" (multi-task wrapper interocepción + chip emociones +
  // silence sostén con subActIdx 0/1/2).
  "emotional_labeling",
  // Phase 7 SP-C-3 — primitive dedicated para #2 Phase 3 "Visualización
  // Dirigida" (multi-exercise layered: visualización + bilateral eye
  // saccades + hold-press 6s + humming exhale cue + body anchor evolutivo).
  "visualization_commitment",
  // Phase 7 SP-D-1 — primitive dedicated para #3 Phase 1 "Descarga
  // Rápida" (ratio 1:3 inhale:exhale 2-0-6-0 + dramatic deflate orb
  // + cycling release cues físicos rotativos per cycle).
  "descarga_rapida_orb",
  // Phase 7 SP-D-2 — primitive dedicated para #3 Phase 2 "Filtro de
  // Prioridad" (multi-exercise wrapper: text + Eisenhower 2×2 matrix
  // + slots tracker + tongue palate body anchor con subActIdx 0/1/2).
  "priority_filter",
  // Phase 7 SP-D-3 — primitive dedicated para #3 Phase 3 "Compromiso
  // Motor" (multi-exercise: hold-press + free fist body anchor +
  // exhale sync respiratorio + 60-min commitment statement).
  "executive_commitment",
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

      it("Fase 1 acto usa primitive dedicated per protocolo (Tier 1A redesign chain SP-B/C/D)", () => {
        // Phase 7 shape changes verificados Phase 1:
        // - #1 → parasympathic_reset_orb (F3 flagship, BOX 4-4-4-4)
        // - #2 → cardiac_coherence_orb (SP-C-1, HeartMath 6-2-8-0)
        // - #3 → descarga_rapida_orb (SP-D-1, ratio 1:3 2-0-6-0 + deflate)
        const expected = id === 1 ? "parasympathic_reset_orb"
          : id === 2 ? "cardiac_coherence_orb"
          : id === 3 ? "descarga_rapida_orb"
          : "breath_orb";
        expect(proto.ph[0].iExec[0].ui.primitive).toBe(expected);
      });

      it("Fase 3 acto usa primitive dedicated per protocolo (Tier 1A redesign chain SP-B/C/D Phase 3 COMPLETO)", () => {
        // Phase 7 shape changes verificados Phase 3 — Tier 1A 3/3 protocolos:
        // - #1 → commitment_motor (SP-B-4 multi-task hold + viz + orb + anchor)
        // - #2 → visualization_commitment (SP-C-3 multi-exercise: bilateral
        //   saccades + hold + humming + body anchor evolutivo)
        // - #3 → executive_commitment (SP-D-3 multi-exercise: hold + free
        //   fist + exhale sync + 60-min commitment anchor)
        const expected = id === 1 ? "commitment_motor"
          : id === 2 ? "visualization_commitment"
          : id === 3 ? "executive_commitment"
          : "hold_press_button";
        expect(proto.ph[2].iExec[0].ui.primitive).toBe(expected);
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
