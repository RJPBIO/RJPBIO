import { describe, it, expect } from "vitest";
import { resolveTapEntry, ERROR_MESSAGES } from "./tapEntry";

const P = [
  { id: 1, n: "Calma-A",   int: "calma",    d: 120 },
  { id: 2, n: "Reset-A",   int: "reset",    d: 90  },
  { id: 3, n: "Energia-A", int: "energia",  d: 120 },
  { id: 4, n: "Enfoque-A", int: "enfoque",  d: 180 },
];

const opts = (over = {}) => ({ protocols: P, hour: 10, durationMultiplier: 1, random: () => 0, ...over });

describe("resolveTapEntry — tap error", () => {
  it("traduce reason conocido", () => {
    const r = resolveTapEntry(new URLSearchParams("tap=error&reason=expired"), opts());
    expect(r.kind).toBe("error");
    expect(r.reason).toBe("expired");
    expect(r.message).toBe(ERROR_MESSAGES.expired);
  });

  it("usa unknown si no hay reason", () => {
    const r = resolveTapEntry(new URLSearchParams("tap=error"), opts());
    expect(r.reason).toBe("unknown");
    expect(r.message).toBe(ERROR_MESSAGES.unknown);
  });

  it("usa unknown si reason no está mapeado", () => {
    const r = resolveTapEntry(new URLSearchParams("tap=error&reason=blorf"), opts());
    expect(r.reason).toBe("blorf");
    expect(r.message).toBe(ERROR_MESSAGES.unknown);
  });
});

describe("resolveTapEntry — signed tap (source=tap)", () => {
  it("MORNING selecciona energía/enfoque", () => {
    const r = resolveTapEntry(new URLSearchParams("source=tap&slot=MORNING&station=S1"), opts({ random: () => 0 }));
    expect(r.kind).toBe("tap");
    expect(r.context.type).toBe("entrada");
    expect(r.context.station).toBe("S1");
    expect(r.protocol.int).toMatch(/energia|enfoque/);
  });

  it("EVENING selecciona calma/reset y type=salida", () => {
    const r = resolveTapEntry(new URLSearchParams("source=tap&slot=EVENING"), opts({ random: () => 0 }));
    expect(r.context.type).toBe("salida");
    expect(r.protocol.int).toMatch(/calma|reset/);
  });

  it("ADHOC (default) selecciona enfoque/reset y type=tap", () => {
    const r = resolveTapEntry(new URLSearchParams("source=tap"), opts({ random: () => 0 }));
    expect(r.context.type).toBe("tap");
    expect(r.protocol.int).toMatch(/enfoque|reset/);
  });

  it("aplica durationMultiplier al seconds", () => {
    const r = resolveTapEntry(new URLSearchParams("source=tap&slot=MORNING"), opts({ durationMultiplier: 0.5, random: () => 0 }));
    expect(r.seconds).toBe(Math.round(r.protocol.d * 0.5));
  });

  it("random inyectable controla la selección del pool", () => {
    const alwaysLast = () => 0.999;
    const r = resolveTapEntry(new URLSearchParams("source=tap&slot=EVENING"), opts({ random: alwaysLast }));
    // Pool EVENING = calma+reset = [P[0], P[1]] → último = Reset-A (id=2)
    expect(r.protocol.id).toBe(2);
  });

  it("fallback a protocols[0] si el pool está vacío", () => {
    const r = resolveTapEntry(
      new URLSearchParams("source=tap&slot=EVENING"),
      opts({ protocols: [P[2], P[3]] }), // sólo energía+enfoque, pool EVENING vacío
    );
    expect(r.protocol.id).toBe(P[2].id);
  });
});

describe("resolveTapEntry — legacy deep-link (NFC/QR)", () => {
  it("entrada matutina (hour<12) tira a energía/enfoque", () => {
    const r = resolveTapEntry(new URLSearchParams("c=Acme&t=entrada&e=u123"), opts({ hour: 9, random: () => 0 }));
    expect(r.kind).toBe("deeplink");
    expect(r.context).toEqual({ company: "Acme", type: "entrada", employee: "u123" });
    expect(r.protocol.int).toMatch(/energia|enfoque/);
  });

  it("entrada vespertina (hour>=12) tira a enfoque/reset", () => {
    const r = resolveTapEntry(new URLSearchParams("c=Acme&t=entrada"), opts({ hour: 15, random: () => 0 }));
    expect(r.protocol.int).toMatch(/enfoque|reset/);
  });

  it("salida tira a calma/reset sin importar la hora", () => {
    const r = resolveTapEntry(new URLSearchParams("c=Acme&t=salida"), opts({ hour: 9, random: () => 0 }));
    expect(r.protocol.int).toMatch(/calma|reset/);
  });

  it("type=exit se trata igual que salida", () => {
    const r = resolveTapEntry(new URLSearchParams("c=Acme&t=exit"), opts({ random: () => 0 }));
    expect(r.protocol.int).toMatch(/calma|reset/);
  });

  it("quirk documentado: URL vacía dispara rama deeplink porque parseDeepLink defaultea type='entrada'", () => {
    const r = resolveTapEntry(new URLSearchParams(""), opts({ random: () => 0 }));
    expect(r.kind).toBe("deeplink");
    expect(r.context.type).toBe("entrada");
  });

  it("returns kind:null si parseDeepLink rechaza la URL (params inválidos)", () => {
    const longUnsafe = "c=" + "@".repeat(200); // excede MAX_LEN
    const r = resolveTapEntry(new URLSearchParams(longUnsafe), opts());
    expect(r.kind).toBe(null);
  });
});

describe("resolveTapEntry — precedencia", () => {
  it("tap=error gana sobre source=tap", () => {
    const r = resolveTapEntry(new URLSearchParams("tap=error&reason=replay&source=tap&slot=MORNING"), opts());
    expect(r.kind).toBe("error");
  });

  it("source=tap gana sobre params legacy c/t/e", () => {
    const r = resolveTapEntry(new URLSearchParams("source=tap&slot=EVENING&c=Acme&t=entrada"), opts({ random: () => 0 }));
    expect(r.kind).toBe("tap");
    expect(r.context.type).toBe("salida");
  });
});
