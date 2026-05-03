/* ═══════════════════════════════════════════════════════════════
   protocols.refactor19.test — Phase 5 SP1
   Garantías post-refactor de #19 Panic Interrupt:
   dive reflex con agua fría → 3 mecanismos vagales sin infraestructura.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { P, SCIENCE_DEEP } from "./protocols";

const COLD_WATER_TERMS = [
  "agua fría",
  "agua fria",
  "lavabo",
  "dive reflex",
  "reflejo de inmersión",
  "reflejo de inmersion",
  "frío facial",
  "frio facial",
  "khurana",
];

function flatActs(p) {
  return p.ph.flatMap((ph) => ph.iExec || []);
}

describe("#19 Panic Interrupt — refactor sin agua (Phase 5 SP1)", () => {
  const p = P.find((x) => x.id === 19);

  it("existe en el catálogo", () => {
    expect(p).toBeDefined();
    expect(p.id).toBe(19);
    expect(p.useCase).toBe("crisis");
  });

  it("NO tiene variants (eliminados — ya no hay with/without cold-water)", () => {
    expect(p.variants).toBeUndefined();
  });

  it("tiene exactamente 3 actos", () => {
    expect(flatActs(p).length).toBe(3);
    expect(p.ph.length).toBe(3);
  });

  it("acto 1 usa primitive vocal_with_haptic (no facial_cold_prompt)", () => {
    const act1 = p.ph[0].iExec[0];
    expect(act1.ui.primitive).toBe("vocal_with_haptic");
    expect(act1.type).toBe("vocalization");
  });

  it("acto 2 usa primitive breath_orb con cadence apnea {in:3,h1:5,ex:6,h2:0}", () => {
    const act2 = p.ph[1].iExec[0];
    expect(act2.ui.primitive).toBe("breath_orb");
    expect(act2.type).toBe("breath");
    expect(act2.ui.props?.cadence).toEqual({ in: 3, h1: 5, ex: 6, h2: 0 });
  });

  it("acto 3 usa primitive hold_press_button (commitment cierre)", () => {
    const act3 = p.ph[2].iExec[0];
    expect(act3.ui.primitive).toBe("hold_press_button");
    expect(act3.type).toBe("commitment_motor");
    expect(act3.ui.props?.min_hold_ms).toBeLessThanOrEqual(3000);
  });

  it("NINGÚN acto referencia agua fría / lavabo / dive reflex en text/mechanism", () => {
    flatActs(p).forEach((act, i) => {
      const blob = `${act.text || ""} ${act.mechanism || ""}`.toLowerCase();
      COLD_WATER_TERMS.forEach((term) => {
        expect(
          blob.includes(term),
          `acto ${i} contiene término prohibido "${term}" en text/mechanism`,
        ).toBe(false);
      });
    });
  });

  it("NINGUNA fase referencia agua fría / lavabo en k/i/sc", () => {
    p.ph.forEach((phase, i) => {
      const blob = `${phase.k || ""} ${phase.i || ""} ${phase.sc || ""}`.toLowerCase();
      COLD_WATER_TERMS.forEach((term) => {
        expect(
          blob.includes(term),
          `fase ${i} contiene término prohibido "${term}" en k/i/sc`,
        ).toBe(false);
      });
    });
  });

  it("safety field retenido pero genérico (profesional / emergencia)", () => {
    expect(typeof p.safety).toBe("string");
    expect(p.safety.length).toBeGreaterThan(40);
    const s = p.safety.toLowerCase();
    expect(
      s.includes("profesional") || s.includes("emergencia") || s.includes("911"),
    ).toBe(true);
    // Verifica que el aviso ya no menciona agua fría / dive reflex / arritmia
    // (la contraindicación cardíaca era específica del reflejo de inmersión)
    expect(s.includes("agua fría")).toBe(false);
    expect(s.includes("lavabo")).toBe(false);
    expect(s.includes("dive reflex")).toBe(false);
  });

  it("suma target_ms coherente con duración nominal (~105s, dentro de 95-125s)", () => {
    const total = flatActs(p).reduce((acc, a) => acc + a.duration.target_ms, 0);
    expect(total).toBeGreaterThanOrEqual(95000);
    expect(total).toBeLessThanOrEqual(125000);
  });

  it("TODOS los actos mantienen voice.enabled_default = true (crisis override)", () => {
    flatActs(p).forEach((act, i) => {
      expect(
        act.media?.voice?.enabled_default,
        `acto ${i}.media.voice.enabled_default`,
      ).toBe(true);
    });
  });

  it("TODOS los actos mantienen validate.kind = no_validation", () => {
    flatActs(p).forEach((act, i) => {
      expect(act.validate?.kind, `acto ${i}.validate.kind`).toBe("no_validation");
      expect(act.validate?.reason).toBe("crisis_no_pressure");
    });
  });

  it("acto 1 inicia binaural (action=start, type=calma)", () => {
    const act1 = p.ph[0].iExec[0];
    expect(act1.media.binaural?.action).toBe("start");
    expect(act1.media.binaural?.type).toBe("calma");
  });

  it("acto 3 detiene binaural (action=stop)", () => {
    const act3 = p.ph[2].iExec[0];
    expect(act3.media.binaural?.action).toBe("stop");
  });

  it("mechanism strings citan mecanismos vagales sin agua (Porges 2009 / Lemaitre 2008)", () => {
    const acts = flatActs(p);
    const allMech = acts.map((a) => a.mechanism || "").join(" ");
    // Al menos una cita Porges + Lemaitre presente en los mecanismos
    expect(allMech).toMatch(/Porges/i);
    expect(allMech).toMatch(/Lemaitre/i);
  });
});

describe("#19 SCIENCE_DEEP — actualizado al refactor sin agua", () => {
  const entry = SCIENCE_DEEP[19];

  it("entry existe y es no vacío", () => {
    expect(typeof entry).toBe("string");
    expect(entry.length).toBeGreaterThan(50);
  });

  it("NO menciona dive reflex / agua fría / Heath 1992 / Khurana", () => {
    const lower = entry.toLowerCase();
    COLD_WATER_TERMS.forEach((term) => {
      expect(lower.includes(term), `SCIENCE_DEEP[19] contiene término prohibido "${term}"`).toBe(false);
    });
    expect(lower.includes("heath 1992")).toBe(false);
  });

  it("menciona vagales sin agua (Porges + Lemaitre + apnea / vocalización)", () => {
    expect(entry).toMatch(/Porges/i);
    expect(entry).toMatch(/Lemaitre/i);
    expect(entry).toMatch(/apnea|vocalización|vocalizacion/i);
  });
});
