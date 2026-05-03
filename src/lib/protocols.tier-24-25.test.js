/* ═══════════════════════════════════════════════════════════════
   protocols.tier-24-25.test — Phase 5 SP5
   Garantías de la migración de #24 Bilateral Walking Meditation y
   #25 Cardiac Pulse Match al schema multi-acto extendido.
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
  "doorway_visualizer", "vocal_resonance_visual", "power_pose_visual",
  "walking_pace_indicator", "pulse_match_visual",
]);

function flatActs(p) {
  return p.ph.flatMap((ph) => ph.iExec || []);
}

// ═══════════════════════════════════════════════════════════════
// #24 Bilateral Walking Meditation
// ═══════════════════════════════════════════════════════════════

describe("#24 Bilateral Walking Meditation — migración Phase 5 SP5", () => {
  const p = P.find((x) => x.id === 24);

  it("existe en el catálogo con id=24", () => {
    expect(p).toBeDefined();
    expect(p.id).toBe(24);
    expect(p.n).toBe("Bilateral Walking Meditation");
  });

  it("useCase = 'active', intent = 'reset', dificultad = 1", () => {
    expect(getUseCase(p)).toBe("active");
    expect(p.int).toBe("reset");
    expect(p.dif).toBe(1);
  });

  it("duración nominal = 150s", () => {
    expect(p.d).toBe(150);
  });

  it("tiene 4 fases × 1 acto = 4 actos totales", () => {
    expect(p.ph.length).toBe(4);
    expect(flatActs(p).length).toBe(4);
  });

  it("fases cubren la duración total sin gaps", () => {
    expect(p.ph[0].s).toBe(0);
    for (let i = 1; i < p.ph.length; i++) {
      expect(p.ph[i].s).toBe(p.ph[i - 1].e);
    }
    expect(p.ph[p.ph.length - 1].e).toBe(p.d);
  });

  it("acto 1 usa text_emphasis_voice (preparación)", () => {
    const a = p.ph[0].iExec[0];
    expect(a.ui.primitive).toBe("text_emphasis_voice");
    expect(a.type).toBe("transition");
  });

  it("acto 2 usa walking_pace_indicator pattern='left_only' con target_steps=8", () => {
    const a = p.ph[1].iExec[0];
    expect(a.ui.primitive).toBe("walking_pace_indicator");
    expect(a.ui.props.pattern).toBe("left_only");
    expect(a.ui.props.target_steps).toBe(8);
    expect(a.type).toBe("walking_meditation");
    expect(a.validate.kind).toBe("tap_count");
    expect(a.validate.min_taps).toBe(8);
  });

  it("acto 3 usa walking_pace_indicator pattern='right_only' con target_steps=8", () => {
    const a = p.ph[2].iExec[0];
    expect(a.ui.primitive).toBe("walking_pace_indicator");
    expect(a.ui.props.pattern).toBe("right_only");
    expect(a.ui.props.target_steps).toBe(8);
    expect(a.type).toBe("walking_meditation");
  });

  it("acto 4 usa hold_press_button con release='Aquí. Reset.'", () => {
    const a = p.ph[3].iExec[0];
    expect(a.ui.primitive).toBe("hold_press_button");
    expect(a.ui.props.min_hold_ms).toBe(5000);
    expect(a.ui.props.release_message).toBe("Aquí. Reset.");
    expect(a.type).toBe("commitment_motor");
  });

  it("primer acto inicia binaural type='reset', último stop", () => {
    expect(p.ph[0].iExec[0].media.binaural?.action).toBe("start");
    expect(p.ph[0].iExec[0].media.binaural?.type).toBe("reset");
    expect(p.ph[3].iExec[0].media.binaural?.action).toBe("stop");
  });

  it("suma target_ms = 28+40+40+35 = 143s (rango 130-160s)", () => {
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBe(28000 + 40000 + 40000 + 35000);
    expect(total).toBeGreaterThanOrEqual(130000);
    expect(total).toBeLessThanOrEqual(160000);
  });

  it("mechanisms citan Teut 2013 (walking meditation RCT)", () => {
    const allMech = flatActs(p).map((a) => a.mechanism).join(" ");
    expect(allMech).toMatch(/Teut 2013/i);
  });

  it("TODOS los actos tienen validate.kind del enum válido", () => {
    flatActs(p).forEach((act, i) => {
      expect(VALID_VALIDATION_KINDS.has(act.validate.kind), `acto ${i}.kind`).toBe(true);
    });
  });

  it("TODOS los actos tienen ui.primitive del enum válido", () => {
    flatActs(p).forEach((act, i) => {
      expect(VALID_PRIMITIVES.has(act.ui.primitive), `acto ${i}.primitive`).toBe(true);
    });
  });

  it("SCIENCE_DEEP[24] cita Teut 2013 + reconoce limitaciones de single session", () => {
    const e = SCIENCE_DEEP[24];
    expect(typeof e).toBe("string");
    expect(e.length).toBeGreaterThan(150);
    expect(e).toMatch(/Teut 2013/i);
    expect(e.toLowerCase()).toMatch(/single session|modesto|limitaci/i);
  });

  it("SCIENCE_DEEP[24] NO reclama cambio neuroplástico ni cognición sostenida", () => {
    const e = SCIENCE_DEEP[24].toLowerCase();
    // El protocolo no debe reclamar lo que la single-session evidence no soporta
    if (e.includes("neuroplástic")) {
      expect(e).toMatch(/no se reclama|no reclama/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// #25 Cardiac Pulse Match
// ═══════════════════════════════════════════════════════════════

describe("#25 Cardiac Pulse Match — migración Phase 5 SP5", () => {
  const p = P.find((x) => x.id === 25);

  it("existe en el catálogo con id=25", () => {
    expect(p).toBeDefined();
    expect(p.id).toBe(25);
    expect(p.n).toBe("Cardiac Pulse Match");
  });

  it("useCase = 'active', intent = 'calma', dificultad = 2", () => {
    expect(getUseCase(p)).toBe("active");
    expect(p.int).toBe("calma");
    expect(p.dif).toBe(2);
  });

  it("duración nominal = 150s", () => {
    expect(p.d).toBe(150);
  });

  it("tiene 4 fases × 1 acto = 4 actos totales", () => {
    expect(p.ph.length).toBe(4);
    expect(flatActs(p).length).toBe(4);
  });

  it("fases cubren la duración total sin gaps", () => {
    expect(p.ph[0].s).toBe(0);
    for (let i = 1; i < p.ph.length; i++) {
      expect(p.ph[i].s).toBe(p.ph[i - 1].e);
    }
    expect(p.ph[p.ph.length - 1].e).toBe(p.d);
  });

  it("acto 1 usa text_emphasis_voice (encontrar pulso)", () => {
    const a = p.ph[0].iExec[0];
    expect(a.ui.primitive).toBe("text_emphasis_voice");
    expect(a.type).toBe("cardiac_interoception");
  });

  it("acto 2 usa pulse_match_visual mode='count_only' con interval_ms=30000", () => {
    const a = p.ph[1].iExec[0];
    expect(a.ui.primitive).toBe("pulse_match_visual");
    expect(a.ui.props.mode).toBe("count_only");
    expect(a.ui.props.interval_ms).toBe(30000);
    expect(a.type).toBe("cardiac_interoception");
  });

  it("acto 3 usa pulse_match_visual mode='match_breathing' con target_breaths=5", () => {
    const a = p.ph[2].iExec[0];
    expect(a.ui.primitive).toBe("pulse_match_visual");
    expect(a.ui.props.mode).toBe("match_breathing");
    expect(a.ui.props.target_breaths).toBe(5);
    expect(a.type).toBe("breath");
  });

  it("acto 3 phase.br configurado para resonance breathing (~5.5rpm)", () => {
    // Cycle ms = (in+h1+ex+h2)*1000 ≈ 11000ms ≈ 5.45rpm
    const ph = p.ph[2];
    const cycleMs = ((ph.br?.in || 0) + (ph.br?.h1 || 0) + (ph.br?.ex || 0) + (ph.br?.h2 || 0)) * 1000;
    expect(cycleMs).toBeGreaterThanOrEqual(10000);
    expect(cycleMs).toBeLessThanOrEqual(12000);
  });

  it("acto 4 usa hold_press_button con release='Coherencia. Sigo.'", () => {
    const a = p.ph[3].iExec[0];
    expect(a.ui.primitive).toBe("hold_press_button");
    expect(a.ui.props.min_hold_ms).toBe(5000);
    expect(a.ui.props.release_message).toBe("Coherencia. Sigo.");
    expect(a.type).toBe("commitment_motor");
  });

  it("primer acto inicia binaural type='calma', último stop", () => {
    expect(p.ph[0].iExec[0].media.binaural?.action).toBe("start");
    expect(p.ph[0].iExec[0].media.binaural?.type).toBe("calma");
    expect(p.ph[3].iExec[0].media.binaural?.action).toBe("stop");
  });

  it("suma target_ms = 22+35+60+22 = 139s (rango 125-160s)", () => {
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBe(22000 + 35000 + 60000 + 22000);
    expect(total).toBeGreaterThanOrEqual(125000);
    expect(total).toBeLessThanOrEqual(160000);
  });

  it("mechanisms citan Garfinkel 2015 + Lehrer 2014 + Khalsa 2018", () => {
    const allMech = flatActs(p).map((a) => a.mechanism).join(" ");
    expect(allMech).toMatch(/Garfinkel 2015/i);
    expect(allMech).toMatch(/Lehrer 2014/i);
    expect(allMech).toMatch(/Khalsa 2018/i);
  });

  it("TODOS los actos tienen validate.kind del enum válido", () => {
    flatActs(p).forEach((act, i) => {
      expect(VALID_VALIDATION_KINDS.has(act.validate.kind), `acto ${i}.kind`).toBe(true);
    });
  });

  it("TODOS los actos tienen ui.primitive del enum válido", () => {
    flatActs(p).forEach((act, i) => {
      expect(VALID_PRIMITIVES.has(act.ui.primitive), `acto ${i}.primitive`).toBe(true);
    });
  });

  it("SCIENCE_DEEP[25] cita Schandry 1981 + Garfinkel + Lehrer + Khalsa", () => {
    const e = SCIENCE_DEEP[25];
    expect(typeof e).toBe("string");
    expect(e.length).toBeGreaterThan(150);
    expect(e).toMatch(/Schandry 1981/i);
    expect(e).toMatch(/Garfinkel 2015/i);
    expect(e).toMatch(/Lehrer/i);
    expect(e).toMatch(/Khalsa 2018/i);
  });

  it("SCIENCE_DEEP[25] NO reclama HRV training acute ni mejora cardíaca clínica", () => {
    const e = SCIENCE_DEEP[25].toLowerCase();
    // Si menciona HRV training, debe matizar con limitación
    if (e.includes("hrv training")) {
      expect(e).toMatch(/no se reclama|no reclama|requieren semanas|no .* acute/i);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// Invariantes globales del catálogo
// ═══════════════════════════════════════════════════════════════

describe("Catálogo post-#24-#25: invariantes globales", () => {
  it("getActiveProtocols cuenta ahora 18 (12 base + #15 + #21-#25)", () => {
    const active = P.filter((x) => getUseCase(x) === "active");
    expect(active.length).toBe(18);
  });

  it("crisis count sigue siendo 3 (#18, #19, #20)", () => {
    expect(P.filter((x) => getUseCase(x) === "crisis").length).toBe(3);
  });

  it("training count sigue siendo 2 (#16, #17)", () => {
    expect(P.filter((x) => getUseCase(x) === "training").length).toBe(2);
  });

  it("catálogo total ahora 23 protocolos", () => {
    expect(P.length).toBe(23);
  });

  it("IDs 24 y 25 presentes; cap de IDs sigue siendo 25", () => {
    const ids = new Set(P.map((p) => p.id));
    expect(ids.has(24)).toBe(true);
    expect(ids.has(25)).toBe(true);
    const max = Math.max(...P.map((p) => p.id));
    expect(max).toBeLessThanOrEqual(25);
  });

  it("todos los protocolos #21-#25 tienen useCase 'active'", () => {
    [21, 22, 23, 24, 25].forEach((id) => {
      const proto = P.find((p) => p.id === id);
      expect(getUseCase(proto), `#${id}`).toBe("active");
    });
  });
});
