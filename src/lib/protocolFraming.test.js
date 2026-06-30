import { describe, it, expect } from "vitest";
import { buildProtocolFraming, dayPart, VOICE_TONES } from "./protocolFraming";

// Fechas ancla (verificadas): 2026-01-05 lunes, 01-02 viernes, 01-07 miércoles.
const monAM = new Date(2026, 0, 5, 8, 0, 0).getTime();
const friPM = new Date(2026, 0, 2, 18, 0, 0).getTime();
const wed = (h) => new Date(2026, 0, 7, h, 0, 0).getTime();
const P = { id: 1, n: "Reinicio Parasimpático", int: "calma" };

describe("dayPart", () => {
  it("clasifica la hora", () => {
    expect(dayPart(8)).toBe("manana");
    expect(dayPart(13)).toBe("mediodia");
    expect(dayPart(18)).toBe("tarde");
    expect(dayPart(23)).toBe("noche");
    expect(dayPart(3)).toBe("noche");
  });
});

describe("buildProtocolFraming — daypart", () => {
  it("lunes por la mañana → activación", () => {
    const f = buildProtocolFraming({ protocol: P, now: monAM });
    expect(f.eyebrow).toMatch(/Lunes/);
    expect(f.frame).toMatch(/semana/i);
  });
  it("viernes por la tarde → descarga", () => {
    const f = buildProtocolFraming({ protocol: P, now: friPM });
    expect(f.eyebrow).toMatch(/Viernes/);
    expect(f.voiceTone).toBe("discharge");
  });
  it("dayparts genéricos (miércoles)", () => {
    expect(buildProtocolFraming({ protocol: P, now: wed(8) }).eyebrow).toMatch(/Mañana/);
    expect(buildProtocolFraming({ protocol: P, now: wed(13) }).eyebrow).toMatch(/Mediodía/);
    expect(buildProtocolFraming({ protocol: P, now: wed(18) }).eyebrow).toMatch(/Tarde/);
    expect(buildProtocolFraming({ protocol: P, now: wed(23) }).eyebrow).toMatch(/Noche/);
  });
  it("la intención modula el tono de mañana (energia → activación)", () => {
    const calma = buildProtocolFraming({ protocol: { ...P, int: "calma" }, now: wed(8) });
    const energia = buildProtocolFraming({ protocol: { ...P, int: "energia" }, now: wed(8) });
    expect(calma.voiceTone).toBe("focus");
    expect(energia.voiceTone).toBe("activation");
  });
});

describe("buildProtocolFraming — situación (prioridad sobre daypart)", () => {
  it("antes de algo importante → filtro cognitivo, tono focus", () => {
    const f = buildProtocolFraming({ protocol: P, now: friPM, situation: "antes_importante" });
    expect(f.eyebrow).toMatch(/importante/i);
    expect(f.voiceTone).toBe("focus");
    expect(f.frame).not.toMatch(/Viernes/); // la situación gana al daypart
  });
  it("después de algo difícil → cierre, tono descarga", () => {
    const f = buildProtocolFraming({ protocol: P, now: wed(10), situation: "despues_dificil" });
    expect(f.eyebrow).toMatch(/Cierre/i);
    expect(f.voiceTone).toBe("discharge");
  });
  it("transición a casa → cruzar el umbral, tono calm, notable", () => {
    const f = buildProtocolFraming({ protocol: P, now: wed(19), situation: "transicion_casa" });
    expect(f.eyebrow).toMatch(/umbral/i);
    expect(f.frame).toMatch(/presente/i);
    expect(f.voiceTone).toBe("calm");
    expect(f.notable).toBe(true);
  });
  it("creatividad → ventana creativa, tono focus", () => {
    const f = buildProtocolFraming({ protocol: P, now: wed(10), situation: "creatividad" });
    expect(f.eyebrow).toMatch(/creativa/i);
    expect(f.voiceTone).toBe("focus");
    expect(f.notable).toBe(true);
  });
  it("pre-sueño → antes de dormir, tono calm", () => {
    const f = buildProtocolFraming({ protocol: P, now: wed(23), situation: "pre_sueno" });
    expect(f.eyebrow).toMatch(/dormir/i);
    expect(f.voiceTone).toBe("calm");
  });
  it("despertar → arranque del día, tono activation", () => {
    const f = buildProtocolFraming({ protocol: P, now: wed(7), situation: "despertar" });
    expect(f.eyebrow).toMatch(/arranque/i);
    expect(f.voiceTone).toBe("activation");
  });
});

describe("buildProtocolFraming — gemelo autonómico matiza", () => {
  it("below → prioriza recuperar + tono calm", () => {
    const f = buildProtocolFraming({ protocol: P, now: wed(8), twinDirection: "below" });
    expect(f.frame).toMatch(/por debajo de tu norma/);
    expect(f.voiceTone).toBe("calm");
  });
  it("above → buena ventana para exigir", () => {
    const f = buildProtocolFraming({ protocol: P, now: wed(8), twinDirection: "above" });
    expect(f.frame).toMatch(/por encima de tu norma/);
  });
});

describe("buildProtocolFraming — notable (cuándo mostrar el encuadre)", () => {
  it("notable en momentos con señal (lunes-AM, viernes-PM, situación, desviación)", () => {
    expect(buildProtocolFraming({ protocol: P, now: monAM }).notable).toBe(true);
    expect(buildProtocolFraming({ protocol: P, now: friPM }).notable).toBe(true);
    expect(buildProtocolFraming({ protocol: P, now: wed(8), situation: "antes_importante" }).notable).toBe(true);
    expect(buildProtocolFraming({ protocol: P, now: wed(8), twinDirection: "below" }).notable).toBe(true);
  });
  it("NO notable en momentos genéricos (sin fricción a cada sesión)", () => {
    expect(buildProtocolFraming({ protocol: P, now: wed(13) }).notable).toBe(false);
    expect(buildProtocolFraming({ protocol: P, now: wed(8) }).notable).toBe(false);
  });
});

describe("buildProtocolFraming — voz", () => {
  it("mapea voiceTone a rate/pitch del TTS", () => {
    const f = buildProtocolFraming({ protocol: { ...P, int: "energia" }, now: wed(8) });
    expect(f.voice).toEqual(VOICE_TONES.activation);
    expect(f.voice.rate).toBeGreaterThan(1);
  });
  it("siempre devuelve forma completa y source determinista", () => {
    const f = buildProtocolFraming({ protocol: P, now: wed(12) });
    expect(f).toMatchObject({
      eyebrow: expect.any(String),
      frame: expect.any(String),
      voiceTone: expect.any(String),
      source: "deterministic",
    });
    expect(f.voice).toHaveProperty("rate");
  });
});
