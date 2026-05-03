/* ═══════════════════════════════════════════════════════════════
   protocols.shape.test — validación estructural del catálogo

   Tras Sprint 68 (3 protocolos crisis nuevos) y Sprint 69 (campos
   safety/variants), el catálogo tenía 20 protocolos.
   Phase 4 SP1 elimina OMEGA (#13) y OMNIA (#14) → 18 protocolos.
   Los IDs 13 y 14 quedan como gap permanente para integridad
   histórica.

   Este test garantiza que cualquier protocolo nuevo o modificado
   mantiene el shape esperado por la UI, el motor neural y los
   reportes.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { P, SCIENCE_DEEP } from "./protocols";

const REQUIRED_FIELDS = ["id", "n", "ct", "d", "sb", "tg", "cl", "int", "dif", "ph"];
const PHASE_FIELDS = ["l", "r", "s", "e", "k", "i", "sc"];
const VALID_INTENTS = new Set(["calma", "enfoque", "energia", "reset"]);
const RESERVED_IDS = new Set([13, 14]); // OMEGA/OMNIA eliminados Phase4-SP1

describe("protocols catalog shape", () => {
  it("contiene al menos 18 protocolos (post-eliminación OMEGA/OMNIA)", () => {
    expect(P.length).toBeGreaterThanOrEqual(18);
  });

  it("ids únicos, positivos y dentro de [1,25] (gap permanente en 13/14)", () => {
    const ids = P.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(1);
      expect(id).toBeLessThanOrEqual(25);
    });
  });

  it("IDs 13 y 14 están reservados (OMEGA/OMNIA eliminados)", () => {
    const ids = new Set(P.map((p) => p.id));
    RESERVED_IDS.forEach((rid) => {
      expect(ids.has(rid)).toBe(false);
    });
  });

  P.forEach((p) => {
    describe(`#${p.id} ${p.n}`, () => {
      it("tiene todos los campos requeridos", () => {
        for (const f of REQUIRED_FIELDS) {
          expect(p[f], `protocolo ${p.id} no tiene campo "${f}"`).toBeDefined();
        }
      });

      it("intent es válido", () => {
        expect(VALID_INTENTS.has(p.int)).toBe(true);
      });

      it("dificultad entre 1 y 3", () => {
        expect(p.dif).toBeGreaterThanOrEqual(1);
        expect(p.dif).toBeLessThanOrEqual(3);
      });

      it("color empieza con # y es hex válido", () => {
        expect(p.cl).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it("tag (tg) presente y corto", () => {
        expect(typeof p.tg).toBe("string");
        expect(p.tg.length).toBeGreaterThan(0);
        expect(p.tg.length).toBeLessThanOrEqual(3);
      });

      it("phases es array no vacío", () => {
        expect(Array.isArray(p.ph)).toBe(true);
        expect(p.ph.length).toBeGreaterThan(0);
      });

      it("cada phase tiene los campos requeridos", () => {
        p.ph.forEach((phase, i) => {
          for (const f of PHASE_FIELDS) {
            expect(phase[f], `protocolo ${p.id} phase ${i} no tiene "${f}"`).toBeDefined();
          }
        });
      });

      it("phase.e > phase.s", () => {
        p.ph.forEach((phase) => {
          expect(phase.e).toBeGreaterThan(phase.s);
        });
      });

      it("phases cubren la duración total sin gaps ni overlaps", () => {
        // La primera phase empieza en 0
        expect(p.ph[0].s).toBe(0);
        // Cada phase consecutiva empieza donde terminó la anterior
        for (let i = 1; i < p.ph.length; i++) {
          expect(p.ph[i].s).toBe(p.ph[i - 1].e);
        }
        // La última phase termina exactamente en p.d
        expect(p.ph[p.ph.length - 1].e).toBe(p.d);
      });

      it("iExec timestamps están dentro de los bounds de su phase", () => {
        p.ph.forEach((phase, idx) => {
          const phaseDuration = phase.e - phase.s;
          if (!Array.isArray(phase.iExec)) return; // iExec opcional
          phase.iExec.forEach((step, i) => {
            expect(step.from, `phase ${idx} iExec[${i}].from`).toBeGreaterThanOrEqual(0);
            expect(step.to, `phase ${idx} iExec[${i}].to`).toBeLessThanOrEqual(phaseDuration);
            expect(step.to).toBeGreaterThan(step.from);
            expect(typeof step.text).toBe("string");
            expect(step.text.length).toBeGreaterThan(0);
          });
        });
      });

      it("tiene science note (sc) en cada phase", () => {
        p.ph.forEach((phase) => {
          expect(typeof phase.sc).toBe("string");
          expect(phase.sc.length).toBeGreaterThan(20);
        });
      });

      it("tiene SCIENCE_DEEP entry correspondiente", () => {
        expect(SCIENCE_DEEP[p.id]).toBeDefined();
        expect(typeof SCIENCE_DEEP[p.id]).toBe("string");
        expect(SCIENCE_DEEP[p.id].length).toBeGreaterThan(50);
      });

      // Sprint 69 — safety y variants opcionales pero si están deben tener shape correcto
      it("safety (si existe) es string no vacío", () => {
        if (p.safety !== undefined) {
          expect(typeof p.safety).toBe("string");
          expect(p.safety.length).toBeGreaterThan(20);
        }
      });

      it("variants (si existe) tiene shape correcto", () => {
        if (p.variants !== undefined) {
          expect(Array.isArray(p.variants)).toBe(true);
          expect(p.variants.length).toBeGreaterThan(0);
          p.variants.forEach((v, i) => {
            // Phase 4 SP8: variants simplificadas a {id,label}; when/notes opcionales
            expect(typeof v.id, `variant ${i}.id`).toBe("string");
            expect(typeof v.label).toBe("string");
            expect(v.id.length).toBeGreaterThan(0);
            expect(v.label.length).toBeGreaterThan(0);
            if (v.when !== undefined) {
              expect(typeof v.when).toBe("string");
              expect(v.when.length).toBeGreaterThan(0);
            }
            if (v.notes !== undefined) {
              expect(typeof v.notes).toBe("string");
              expect(v.notes.length).toBeGreaterThan(0);
            }
          });
          // ids únicos dentro del protocolo
          const ids = p.variants.map((v) => v.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      });
    });
  });
});

describe("protocolos crisis (Sprint 68/69 + Phase4 SP8 + Phase5 SP1) tienen safety", () => {
  // Los protocolos #18, #19, #20 son los específicos para crisis aguda
  // y DEBEN tener safety preface. Phase 4 SP8 simplificó la coreografía a
  // un acto por fase. Phase 5 SP1 refactorizó #19 (eliminó dive reflex con
  // agua fría) → #19 ya no tiene variants. Ningún crisis tiene variants ahora.
  const crisisIds = [18, 19, 20];
  crisisIds.forEach((id) => {
    it(`#${id} tiene safety preface`, () => {
      const p = P.find((x) => x.id === id);
      expect(p).toBeDefined();
      expect(typeof p.safety).toBe("string");
      expect(p.safety.length).toBeGreaterThan(40);
    });
  });
});
