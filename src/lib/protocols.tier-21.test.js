/* ═══════════════════════════════════════════════════════════════
   protocols.tier-21.test — Phase 5 SP3
   Garantías de la migración de #21 Threshold Crossing al schema
   multi-acto extendido.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { P, SCIENCE_DEEP, getUseCase } from "./protocols";

const VALID_VALIDATION_KINDS = new Set([
  "min_duration", "breath_cycles", "tap_count", "hold_press",
  "chip_selection", "eye_movement", "ppg_breath_match",
  "visual_completion", "no_validation",
  "pulse_count", "pace_count",
]);

const VALID_PRIMITIVES = new Set([
  "breath_orb", "bilateral_tap_targets", "ocular_dots",
  "ocular_horizontal_metronome", "visual_panoramic_prompt",
  "dual_focus_targets", "body_silhouette_highlight", "posture_visual",
  "isometric_grip_prompt", "chest_percussion_prompt",
  "facial_cold_prompt", "shake_hands_prompt",
  "chip_selector", "hold_press_button", "text_emphasis_voice",
  "silence_cyan_minimal", "object_anchor_prompt",
  "vocal_with_haptic", "transition_dots",
  // Phase 5 SP2
  "doorway_visualizer", "vocal_resonance_visual", "power_pose_visual",
  "walking_pace_indicator", "pulse_match_visual",
]);

const PROTO_ID = 21;

function flatActs(p) {
  return p.ph.flatMap((ph) => ph.iExec || []);
}

describe("#21 Threshold Crossing — migración Phase 5 SP3", () => {
  const p = P.find((x) => x.id === PROTO_ID);

  it("existe en el catálogo con id=21", () => {
    expect(p).toBeDefined();
    expect(p.id).toBe(21);
  });

  it("nombre es 'Threshold Crossing'", () => {
    expect(p.n).toBe("Threshold Crossing");
  });

  it("useCase = 'active' (pool default, no crisis ni training)", () => {
    expect(getUseCase(p)).toBe("active");
  });

  it("intent = 'reset'", () => {
    expect(p.int).toBe("reset");
  });

  it("dificultad = 1", () => {
    expect(p.dif).toBe(1);
  });

  it("color es phosphorCyan #22D3EE", () => {
    expect(p.cl).toBe("#22D3EE");
  });

  it("duración nominal = 120s", () => {
    expect(p.d).toBe(120);
  });

  it("tiene 4 fases", () => {
    expect(p.ph.length).toBe(4);
  });

  it("tiene 4 actos totales (1 por fase)", () => {
    expect(flatActs(p).length).toBe(4);
  });

  it("safety field menciona 'fotosensible' y redirige a #3", () => {
    expect(typeof p.safety).toBe("string");
    expect(p.safety.toLowerCase()).toContain("fotosensible");
    expect(p.safety).toContain("#3");
  });

  it("fases cubren la duración total sin gaps", () => {
    expect(p.ph[0].s).toBe(0);
    for (let i = 1; i < p.ph.length; i++) {
      expect(p.ph[i].s).toBe(p.ph[i - 1].e);
    }
    expect(p.ph[p.ph.length - 1].e).toBe(p.d);
  });

  it("acto 1 usa chip_selector con exactamente 5 chips + min_thinking_ms=5000", () => {
    const act1 = p.ph[0].iExec[0];
    expect(act1.ui.primitive).toBe("chip_selector");
    expect(act1.ui.props.chips.length).toBe(5);
    expect(act1.ui.props.min_thinking_ms).toBe(5000);
    expect(act1.validate.kind).toBe("chip_selection");
    expect(act1.validate.required).toBe(true);
  });

  it("acto 1 chips incluyen ids esperados", () => {
    const ids = p.ph[0].iExec[0].ui.props.chips.map((c) => c.id);
    expect(ids).toEqual([
      "frustration", "fatigue", "pending_decision", "distraction", "other",
    ]);
  });

  it("acto 2 usa doorway_visualizer phase='approach'", () => {
    const act2 = p.ph[1].iExec[0];
    expect(act2.ui.primitive).toBe("doorway_visualizer");
    expect(act2.ui.props.phase).toBe("approach");
    expect(act2.ui.props.duration_ms).toBe(40000);
    expect(act2.ui.props.flash_enabled).toBe(true);
  });

  it("acto 2 valida min_duration ≥24s (3 cycles × 8s — fallback de breath_cycles)", () => {
    // Razón del fallback: doorway_visualizer no emite breath cycle signals,
    // por lo que breath_cycles validation no se cumple bajo active flow.
    // min_duration con 24000ms preserva el timing de 3 ciclos a 4-4 cadence.
    const act2 = p.ph[1].iExec[0];
    expect(act2.validate.kind).toBe("min_duration");
    expect(act2.validate.min_ms).toBe(24000);
  });

  it("acto 3 usa doorway_visualizer phase='cross' con flash_enabled=true", () => {
    const act3 = p.ph[2].iExec[0];
    expect(act3.ui.primitive).toBe("doorway_visualizer");
    expect(act3.ui.props.phase).toBe("cross");
    expect(act3.ui.props.flash_enabled).toBe(true);
  });

  it("acto 4 usa hold_press_button con min_hold_ms=5000 y release_message='Distinto.'", () => {
    const act4 = p.ph[3].iExec[0];
    expect(act4.ui.primitive).toBe("hold_press_button");
    expect(act4.ui.props.min_hold_ms).toBe(5000);
    expect(act4.ui.props.release_message).toBe("Distinto.");
    expect(act4.validate.kind).toBe("hold_press");
  });

  it("primer acto inicia binaural con type='reset'", () => {
    const act1 = p.ph[0].iExec[0];
    expect(act1.media.binaural?.action).toBe("start");
    expect(act1.media.binaural?.type).toBe("reset");
  });

  it("último acto detiene binaural", () => {
    const lastAct = p.ph[p.ph.length - 1].iExec[0];
    expect(lastAct.media.binaural?.action).toBe("stop");
  });

  it("suma target_ms ≈ 114s (28+40+18+28); rango 100-130s", () => {
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBeGreaterThanOrEqual(100000);
    expect(total).toBeLessThanOrEqual(130000);
    expect(total).toBe(28000 + 40000 + 18000 + 28000);
  });

  it("TODOS los actos tienen voice.enabled_default=false (active default)", () => {
    flatActs(p).forEach((act, i) => {
      expect(act.media?.voice?.enabled_default, `acto ${i}.media.voice.enabled_default`).toBe(false);
    });
  });

  it("cada acto tiene type explícito de los nuevos enums (Phase 5 SP1)", () => {
    const types = flatActs(p).map((a) => a.type);
    expect(types[0]).toBe("cognitive_anchor");
    expect(types[1]).toBe("cognitive_segmentation");
    expect(types[2]).toBe("cognitive_segmentation");
    expect(types[3]).toBe("commitment_motor");
  });

  it("cada acto tiene duration {min_ms, target_ms, max_ms}", () => {
    flatActs(p).forEach((act, i) => {
      expect(act.duration, `acto ${i}.duration`).toBeDefined();
      expect(typeof act.duration.min_ms).toBe("number");
      expect(typeof act.duration.target_ms).toBe("number");
      expect(typeof act.duration.max_ms).toBe("number");
      expect(act.duration.min_ms).toBeLessThanOrEqual(act.duration.target_ms);
      expect(act.duration.target_ms).toBeLessThanOrEqual(act.duration.max_ms);
    });
  });

  it("cada acto tiene validate.kind del enum válido (incluye Phase 5 SP1 nuevos)", () => {
    flatActs(p).forEach((act, i) => {
      expect(act.validate, `acto ${i}.validate`).toBeDefined();
      expect(VALID_VALIDATION_KINDS.has(act.validate.kind), `kind="${act.validate.kind}"`).toBe(true);
    });
  });

  it("cada acto tiene ui.primitive del enum válido", () => {
    flatActs(p).forEach((act, i) => {
      expect(act.ui, `acto ${i}.ui`).toBeDefined();
      expect(VALID_PRIMITIVES.has(act.ui.primitive), `primitive="${act.ui.primitive}"`).toBe(true);
    });
  });

  it("cada acto tiene mechanism string no trivial", () => {
    flatActs(p).forEach((act, i) => {
      expect(typeof act.mechanism, `acto ${i}.mechanism`).toBe("string");
      expect(act.mechanism.length).toBeGreaterThan(30);
    });
  });

  it("mechanisms citan Radvansky o Zacks (event segmentation)", () => {
    const allMech = flatActs(p).map((a) => a.mechanism).join(" ");
    expect(allMech).toMatch(/Radvansky|Zacks/i);
  });

  it("SCIENCE_DEEP[21] existe y referencia event segmentation + WCAG", () => {
    const entry = SCIENCE_DEEP[21];
    expect(typeof entry).toBe("string");
    expect(entry.length).toBeGreaterThan(100);
    expect(entry.toLowerCase()).toContain("event segmentation");
    expect(entry.toLowerCase()).toContain("radvansky");
    expect(entry).toMatch(/WCAG/);
  });
});

describe("#21 — invariantes globales del catálogo tras introducción", () => {
  it("getActiveProtocols ahora incluye #21", () => {
    const active = P.filter((x) => getUseCase(x) === "active");
    const ids = active.map((x) => x.id);
    expect(ids).toContain(21);
  });

  it("activeCount incluye #21 (≥14, suma según protocolos active introducidos)", () => {
    const active = P.filter((x) => getUseCase(x) === "active");
    // #21 debe estar; el conteo total puede crecer en SPs siguientes.
    expect(active.map((p) => p.id)).toContain(21);
    expect(active.length).toBeGreaterThanOrEqual(14);
  });

  it("crisis count sigue siendo 3 (#18, #19, #20)", () => {
    const crisis = P.filter((x) => getUseCase(x) === "crisis");
    expect(crisis.length).toBe(3);
  });

  it("training count sigue siendo 2 (#16, #17)", () => {
    const training = P.filter((x) => getUseCase(x) === "training");
    expect(training.length).toBe(2);
  });

  it("catálogo incluye #21 y al menos 19 protocolos", () => {
    const ids = new Set(P.map((p) => p.id));
    expect(ids.has(21)).toBe(true);
    expect(P.length).toBeGreaterThanOrEqual(19);
  });
});
