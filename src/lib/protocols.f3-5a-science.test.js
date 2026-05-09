/* protocols.f3-5a-science.test — Phase 7 F3.5-A Capa-1.
   Verifica SCIENCE_DEEP entry #1 refactored con citations precisas. */
import { describe, it, expect } from "vitest";
import { SCIENCE_DEEP } from "./protocols";

describe("F3.5-A Capa-1 — SCIENCE_DEEP entry #1 refactored", () => {
  it("SCIENCE_DEEP[1] sigue siendo string (no shape change)", () => {
    expect(typeof SCIENCE_DEEP[1]).toBe("string");
    expect(SCIENCE_DEEP[1].length).toBeGreaterThan(200);
  });

  it("Cita Russo et al. 2017 Breathe ERS con DOI", () => {
    const text = SCIENCE_DEEP[1];
    expect(text).toMatch(/Russo et al\. 2017/);
    expect(text).toMatch(/Breathe ERS/);
    expect(text).toMatch(/10\.1183\/20734735\.009817/);
  });

  it("Cita Porges 2022 Frontiers in Integrative Neuroscience con DOI", () => {
    const text = SCIENCE_DEEP[1];
    expect(text).toMatch(/Porges 2022/);
    expect(text).toMatch(/Frontiers in Integrative Neuroscience/);
    expect(text).toMatch(/10\.3389\/fnint\.2022\.871227/);
  });

  it("Cita Ma et al. 2017 Frontiers in Psychology RCT N=40", () => {
    const text = SCIENCE_DEEP[1];
    expect(text).toMatch(/Ma et al\. 2017/);
    expect(text).toMatch(/Frontiers in Psychology/);
    expect(text).toMatch(/N=40/);
    expect(text).toMatch(/8 semanas/);
  });

  it("Cita Lemaitre et al. 2025 Adv Resp Med RCT box 4-4-4-4", () => {
    const text = SCIENCE_DEEP[1];
    expect(text).toMatch(/Lemaitre et al\. 2025/);
    expect(text).toMatch(/Advances in Respiratory Medicine|Adv Resp Med/);
    expect(text).toMatch(/box 4-4-4-4/);
  });

  it("Menciona VVC + neuroception of safety + 3.75 brpm rate precise", () => {
    const text = SCIENCE_DEEP[1];
    expect(text).toMatch(/VVC|complejo vagal ventral/);
    expect(text).toMatch(/neuroception of safety/);
    expect(text).toMatch(/3\.75 brpm/);
  });

  it("Menciona mecanismos físicos: RSA + cardiorespiratory coupling + baroreflex", () => {
    const text = SCIENCE_DEEP[1];
    expect(text).toMatch(/RSA|respiratory sinus arrhythmia/);
    expect(text).toMatch(/cardiorespiratory coupling/);
    expect(text).toMatch(/baroreflex/);
  });

  it("Phase 2 cognitive descarga preserved (Lieberman affect labeling)", () => {
    const text = SCIENCE_DEEP[1];
    expect(text).toMatch(/Lieberman 2007|affect labeling/);
    expect(text).toMatch(/rumiación|cingulado/);
  });

  it("Anti-regression: SCIENCE_DEEP[2..25] sin afectar (otros protocolos intactos)", () => {
    expect(typeof SCIENCE_DEEP[2]).toBe("string");
    expect(typeof SCIENCE_DEEP[15]).toBe("string");
    expect(typeof SCIENCE_DEEP[25]).toBe("string");
    expect(SCIENCE_DEEP[2]).toMatch(/coherencia cardíaca/);
    expect(SCIENCE_DEEP[15]).toMatch(/Balban/);
    expect(SCIENCE_DEEP[25]).toMatch(/Schandry/);
  });
});
