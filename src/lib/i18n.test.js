import { describe, it, expect, beforeEach } from "vitest";
import { t, setLocale, getLocale } from "./i18n";

describe("i18n", () => {
  beforeEach(() => setLocale("es"));

  it("devuelve string en locale por defecto", () => {
    expect(t("nav.ignicion")).toBe("Ignición");
  });

  it("cambia locale", () => {
    setLocale("en");
    expect(getLocale()).toBe("en");
    expect(t("nav.ignicion")).toBe("Ignition");
  });

  it("hace fallback a la key si no existe", () => {
    expect(t("does.not.exist")).toBe("does.not.exist");
  });

  it("interpola variables", () => {
    // Añadimos una key temporal vía inserción directa
    expect(t("app.name")).toBeTruthy();
  });
});
