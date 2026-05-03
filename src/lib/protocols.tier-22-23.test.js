/* ═══════════════════════════════════════════════════════════════
   protocols.tier-22-23.test — Phase 5 SP4
   Garantías de la migración de #22 Vagal Hum Reset y #23 Power
   Pose Activation al schema multi-acto extendido.
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
// #22 Vagal Hum Reset
// ═══════════════════════════════════════════════════════════════

describe("#22 Vagal Hum Reset — migración Phase 5 SP4", () => {
  const p = P.find((x) => x.id === 22);

  it("existe en el catálogo con id=22", () => {
    expect(p).toBeDefined();
    expect(p.id).toBe(22);
    expect(p.n).toBe("Vagal Hum Reset");
  });

  it("useCase = 'active'", () => {
    expect(getUseCase(p)).toBe("active");
  });

  it("intent = 'calma' y dificultad = 1", () => {
    expect(p.int).toBe("calma");
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

  it("acto 1 usa breath_orb con cadence 4-0-4-0", () => {
    const a = p.ph[0].iExec[0];
    expect(a.ui.primitive).toBe("breath_orb");
    expect(a.ui.props.cadence).toEqual({ in: 4, h1: 0, ex: 4, h2: 0 });
    expect(a.validate.kind).toBe("min_duration");
  });

  it("acto 2 usa vocal_resonance_visual con target_hums=4 y validate tap_count=4", () => {
    const a = p.ph[1].iExec[0];
    expect(a.ui.primitive).toBe("vocal_resonance_visual");
    expect(a.ui.props.target_hums).toBe(4);
    expect(a.ui.props.hum_duration_ms).toBe(10000);
    expect(a.validate.kind).toBe("tap_count");
    expect(a.validate.min_taps).toBe(4);
    expect(a.type).toBe("vocal_resonance");
  });

  it("acto 2 mechanism cita Porges 2009 + Maniscalco 2003", () => {
    const a = p.ph[1].iExec[0];
    expect(a.mechanism).toMatch(/Porges/i);
    expect(a.mechanism).toMatch(/Maniscalco/i);
  });

  it("acto 3 usa silence_cyan_minimal y type interoception", () => {
    const a = p.ph[2].iExec[0];
    expect(a.ui.primitive).toBe("silence_cyan_minimal");
    expect(a.type).toBe("interoception");
    expect(a.mechanism).toMatch(/Khalsa/i);
  });

  it("acto 4 usa hold_press_button con min_hold_ms=5000 y release_message correcto", () => {
    const a = p.ph[3].iExec[0];
    expect(a.ui.primitive).toBe("hold_press_button");
    expect(a.ui.props.min_hold_ms).toBe(5000);
    expect(a.ui.props.release_message).toBe("Calma. Sigo.");
    expect(a.type).toBe("commitment_motor");
  });

  it("primer acto inicia binaural type='calma', último acto stop", () => {
    const first = p.ph[0].iExec[0];
    const last = p.ph[p.ph.length - 1].iExec[0];
    expect(first.media.binaural?.action).toBe("start");
    expect(first.media.binaural?.type).toBe("calma");
    expect(last.media.binaural?.action).toBe("stop");
  });

  it("suma target_ms = 30+50+35+32 = 147s (rango 130-160s)", () => {
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBe(30000 + 50000 + 35000 + 32000);
    expect(total).toBeGreaterThanOrEqual(130000);
    expect(total).toBeLessThanOrEqual(160000);
  });

  it("TODOS los actos tienen voice.enabled_default=false (active default)", () => {
    flatActs(p).forEach((act, i) => {
      expect(act.media?.voice?.enabled_default ?? false, `acto ${i}`).toBe(false);
    });
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

  it("SCIENCE_DEEP[22] referencia Porges + Maniscalco + Khalsa", () => {
    const e = SCIENCE_DEEP[22];
    expect(typeof e).toBe("string");
    expect(e.length).toBeGreaterThan(150);
    expect(e).toMatch(/Porges/i);
    expect(e).toMatch(/Maniscalco/i);
    expect(e).toMatch(/Khalsa/i);
  });

  it("SCIENCE_DEEP[22] NO reclama efecto inmunológico (sólo lo cita para descartarlo)", () => {
    const e = SCIENCE_DEEP[22].toLowerCase();
    // Si se menciona "boost inmunológico", debe ir acompañado de un disclaimer
    // ("no se reclama" / "no" antes del término).
    if (e.match(/boost inmunol/)) {
      expect(e).toMatch(/no se reclama|no reclama/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// #23 Power Pose Activation
// ═══════════════════════════════════════════════════════════════

describe("#23 Power Pose Activation — migración Phase 5 SP4", () => {
  const p = P.find((x) => x.id === 23);

  it("existe en el catálogo con id=23", () => {
    expect(p).toBeDefined();
    expect(p.id).toBe(23);
    expect(p.n).toBe("Power Pose Activation");
  });

  it("useCase = 'active'", () => {
    expect(getUseCase(p)).toBe("active");
  });

  it("intent = 'energia' y dificultad = 2", () => {
    expect(p.int).toBe("energia");
    expect(p.dif).toBe(2);
  });

  it("duración nominal = 120s", () => {
    expect(p.d).toBe(120);
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

  it("acto 1 usa power_pose_visual con phase='posture_alignment' y target_holds=0", () => {
    const a = p.ph[0].iExec[0];
    expect(a.ui.primitive).toBe("power_pose_visual");
    expect(a.ui.props.phase).toBe("posture_alignment");
    expect(a.ui.props.target_holds).toBe(0);
    expect(a.type).toBe("power_posture");
  });

  it("acto 2 usa breath_orb con cadence 4-0-4-0 y validate breath_cycles=4", () => {
    const a = p.ph[1].iExec[0];
    expect(a.ui.primitive).toBe("breath_orb");
    expect(a.ui.props.cadence).toEqual({ in: 4, h1: 0, ex: 4, h2: 0 });
    expect(a.validate.kind).toBe("breath_cycles");
    expect(a.validate.min_cycles).toBe(4);
  });

  it("acto 3 usa power_pose_visual con phase='isometric_holds' y 3 ciclos", () => {
    const a = p.ph[2].iExec[0];
    expect(a.ui.primitive).toBe("power_pose_visual");
    expect(a.ui.props.phase).toBe("isometric_holds");
    expect(a.ui.props.target_holds).toBe(3);
    expect(a.ui.props.hold_duration_ms).toBe(10000);
    expect(a.ui.props.release_duration_ms).toBe(5000);
    expect(a.type).toBe("motor_isometric");
  });

  it("acto 4 usa hold_press_button con release_message='Próxima hora activa.'", () => {
    const a = p.ph[3].iExec[0];
    expect(a.ui.primitive).toBe("hold_press_button");
    expect(a.ui.props.min_hold_ms).toBe(5000);
    expect(a.ui.props.release_message).toBe("Próxima hora activa.");
    expect(a.type).toBe("commitment_motor");
  });

  it("primer acto inicia binaural type='energia', último acto stop", () => {
    const first = p.ph[0].iExec[0];
    const last = p.ph[p.ph.length - 1].iExec[0];
    expect(first.media.binaural?.action).toBe("start");
    expect(first.media.binaural?.type).toBe("energia");
    expect(last.media.binaural?.action).toBe("stop");
  });

  it("suma target_ms = 30+35+30+22 = 117s (rango 100-130s)", () => {
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBe(30000 + 35000 + 30000 + 22000);
    expect(total).toBeGreaterThanOrEqual(100000);
    expect(total).toBeLessThanOrEqual(130000);
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

  it("mechanisms citan Cuddy 2018 (no Carney 2010 sin matización)", () => {
    const allMech = flatActs(p).map((a) => a.mechanism).join(" ");
    expect(allMech).toMatch(/Cuddy 2018/i);
  });

  it("framing científico HONESTO: NO reclama 'increases testosterone'", () => {
    const allMech = flatActs(p).map((a) => a.mechanism).join(" ").toLowerCase();
    const allSc = p.ph.map((ph) => ph.sc).join(" ").toLowerCase();
    const science = SCIENCE_DEEP[23].toLowerCase();
    [allMech, allSc].forEach((blob) => {
      expect(blob).not.toMatch(/increases testosterone/);
      expect(blob).not.toMatch(/aumenta testosterona/);
      expect(blob).not.toMatch(/eleva cortisol/);
    });
    // SCIENCE_DEEP puede mencionar "testosterone" para CONTEXTUALIZAR el claim
    // disputed; debe asociarse explícitamente a Carney 2010 + Ranehill 2015 +
    // "no se replica".
    if (science.includes("testosterona")) {
      expect(science).toMatch(/no se replica/i);
    }
  });

  it("SCIENCE_DEEP[23] cita Carney 2010 + Ranehill 2015 (replication failure)", () => {
    const e = SCIENCE_DEEP[23];
    expect(e).toMatch(/Carney/i);
    expect(e).toMatch(/Ranehill/i);
    expect(e.toLowerCase()).toMatch(/no se replica|disputed|p-curve/);
  });
});

// ═══════════════════════════════════════════════════════════════
// Invariantes globales del catálogo
// ═══════════════════════════════════════════════════════════════

describe("Catálogo post-#22-#23: invariantes globales", () => {
  it("getActiveProtocols incluye #22 y #23 (≥16 activos)", () => {
    const active = P.filter((x) => getUseCase(x) === "active");
    const ids = active.map((p) => p.id);
    expect(ids).toContain(22);
    expect(ids).toContain(23);
    expect(active.length).toBeGreaterThanOrEqual(16);
  });

  it("crisis count sigue siendo 3 (#18, #19, #20)", () => {
    expect(P.filter((x) => getUseCase(x) === "crisis").length).toBe(3);
  });

  it("training count sigue siendo 2 (#16, #17)", () => {
    expect(P.filter((x) => getUseCase(x) === "training").length).toBe(2);
  });

  it("catálogo incluye #22 y #23 (≥21 protocolos)", () => {
    const ids = new Set(P.map((p) => p.id));
    expect(ids.has(22)).toBe(true);
    expect(ids.has(23)).toBe(true);
    expect(P.length).toBeGreaterThanOrEqual(21);
  });
});
