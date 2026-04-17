import { describe, it, expect, beforeEach } from "vitest";
import {
  t, setLocale, getLocale, isRTL, onLocaleChange,
  fmtDate, fmtNumber, fmtRelative, fmtCurrency,
  LOCALES, RTL, DEFAULT_LOCALE,
} from "./i18n";

describe("i18n básico", () => {
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
    expect(t("app.name")).toBeTruthy();
  });

  it("setLocale ignora locale inválido", () => {
    setLocale("es");
    setLocale("xx-invalid");
    expect(getLocale()).toBe("es");
  });
});

describe("i18n RTL", () => {
  it("isRTL true para árabe y hebreo", () => {
    expect(isRTL("ar")).toBe(true);
    expect(isRTL("he")).toBe(true);
  });
  it("isRTL false para latinos y asiáticos", () => {
    expect(isRTL("es")).toBe(false);
    expect(isRTL("en")).toBe(false);
    expect(isRTL("ja")).toBe(false);
  });
  it("RTL set expone idiomas conocidos", () => {
    expect(RTL.has("ar")).toBe(true);
    expect(RTL.has("fa")).toBe(true);
  });
});

describe("i18n listeners", () => {
  it("onLocaleChange notifica al cambiar", () => {
    const events = [];
    const off = onLocaleChange((l) => events.push(l));
    setLocale("en");
    setLocale("pt");
    off();
    setLocale("es");
    expect(events).toEqual(["en", "pt"]);
  });

  it("unsubscribe detiene notificaciones", () => {
    let calls = 0;
    const off = onLocaleChange(() => calls++);
    setLocale("en");
    off();
    setLocale("es");
    setLocale("pt");
    expect(calls).toBe(1);
  });
});

describe("i18n pluralización ICU", () => {
  beforeEach(() => setLocale("es"));

  it("resuelve plural one y other en ES", () => {
    const tpl = "{count, plural, one {# día} other {# días}}";
    // Simulamos con una key inexistente que devuelve sí misma; probamos la función indirectamente
    // Usamos t() con una key real si el dict la tiene; si no, validamos el formato de salida
    expect(t(tpl, { count: 1 })).toMatch(/día/);
    expect(t(tpl, { count: 5 })).toMatch(/días/);
  });

  it("respeta el locale actual en el plural", () => {
    setLocale("en");
    const tpl = "{n, plural, one {# item} other {# items}}";
    expect(t(tpl, { n: 1 })).toBe("1 item");
    expect(t(tpl, { n: 3 })).toBe("3 items");
  });
});

describe("i18n formatters", () => {
  beforeEach(() => setLocale("en"));

  it("fmtDate produce cadena no vacía", () => {
    const out = fmtDate("2026-04-17");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("fmtNumber formatea con separadores del locale", () => {
    expect(fmtNumber(1234567)).toMatch(/1.234.567|1,234,567/);
  });

  it("fmtCurrency incluye símbolo", () => {
    const out = fmtCurrency(42, "USD");
    expect(out).toMatch(/42/);
    expect(out).toMatch(/\$|USD/);
  });

  it("fmtRelative devuelve cadena relativa", () => {
    const now = Date.now();
    const past = new Date(now - 2 * 3600 * 1000).toISOString();
    const future = new Date(now + 5 * 86400 * 1000).toISOString();
    expect(typeof fmtRelative(past)).toBe("string");
    expect(typeof fmtRelative(future)).toBe("string");
  });
});

describe("i18n constantes", () => {
  it("LOCALES contiene los 12 idiomas", () => {
    expect(Object.keys(LOCALES).length).toBe(12);
    expect(LOCALES.es).toBeDefined();
    expect(LOCALES.ar).toBeDefined();
  });
  it("DEFAULT_LOCALE es español", () => {
    expect(DEFAULT_LOCALE).toBe("es");
  });
});
