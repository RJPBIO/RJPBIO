/* recommendationExtract.test — Phase 6H Fix-A1.
   Cubre defensive extraction chain: shape engine real (primary.protocol)
   + legacy/mock shape (primary flat) + edge cases (null, Protocol direct). */
import { describe, it, expect } from "vitest";
import {
  extractPrimaryProtocol,
  extractPrimaryProtocolId,
  extractPrimaryReason,
  isEngineRecommendation,
} from "./recommendationExtract";

// Engine real shape (neural.js:809): primary = { protocol, score, reason }
const ENGINE_REAL = {
  primary: {
    protocol: { id: 1, n: "Reinicio Parasimpático", d: 120, int: "calma" },
    score: 73.5,
    reason: "Tu sistema necesita regulación parasimpática",
  },
  alternatives: [
    {
      protocol: { id: 4, n: "Pulse Shift", d: 90, int: "energia" },
      score: 65.2,
      reason: "Ciclo circadiano favorable para activación",
    },
  ],
  need: "calma",
};

// Legacy/mock shape (LearningView.bugfix.test.jsx:148): primary flat sin wrapper
const LEGACY_MOCK = {
  primary: { id: 4, n: "Pulse Shift", int: "energia" },
};

describe("extractPrimaryProtocol — Phase 6H Fix-A1", () => {
  it("engine real shape → returns protocol object con id", () => {
    const proto = extractPrimaryProtocol(ENGINE_REAL);
    expect(proto).toBeTruthy();
    expect(proto.id).toBe(1);
    expect(proto.n).toBe("Reinicio Parasimpático");
    expect(proto.int).toBe("calma");
  });

  it("legacy shape (primary flat sin wrapper) → returns primary as Protocol fallback", () => {
    const proto = extractPrimaryProtocol(LEGACY_MOCK);
    expect(proto).toBeTruthy();
    expect(proto.id).toBe(4);
    expect(proto.n).toBe("Pulse Shift");
  });

  it("null recommendation → returns null", () => {
    expect(extractPrimaryProtocol(null)).toBeNull();
    expect(extractPrimaryProtocol(undefined)).toBeNull();
  });

  it("recommendation sin primary → returns null", () => {
    expect(extractPrimaryProtocol({ alternatives: [] })).toBeNull();
  });

  it("primary sin protocol ni id → returns null", () => {
    expect(extractPrimaryProtocol({ primary: { score: 50 } })).toBeNull();
  });

  it("recommendation es Protocol-shaped directo (edge defensive) → returns it", () => {
    const directProto = { id: 2, n: "Activación Cognitiva", d: 90, int: "enfoque" };
    const result = extractPrimaryProtocol(directProto);
    expect(result).toBeTruthy();
    expect(result.id).toBe(2);
  });

  it("primary.protocol.id null pero primary.id válido → cae al legacy path", () => {
    const mixed = {
      primary: {
        protocol: { id: null, n: "X" }, // protocol present pero id inválido
        id: 5,                            // legacy id válido
        n: "X",
      },
    };
    const proto = extractPrimaryProtocol(mixed);
    expect(proto.id).toBe(5);
  });

  it("preserva propiedades adicionales del protocol (d, int, ph, etc.)", () => {
    const proto = extractPrimaryProtocol(ENGINE_REAL);
    expect(proto.d).toBe(120);
    expect(proto.int).toBe("calma");
  });
});

describe("extractPrimaryProtocolId — Phase 6H Fix-A1", () => {
  it("engine real shape → returns id numerico", () => {
    expect(extractPrimaryProtocolId(ENGINE_REAL)).toBe(1);
  });

  it("legacy shape → returns id desde primary flat", () => {
    expect(extractPrimaryProtocolId(LEGACY_MOCK)).toBe(4);
  });

  it("null/undefined/sin-primary → returns null", () => {
    expect(extractPrimaryProtocolId(null)).toBeNull();
    expect(extractPrimaryProtocolId(undefined)).toBeNull();
    expect(extractPrimaryProtocolId({})).toBeNull();
  });

  it("id=0 (numeric falsy edge) tratado como válido", () => {
    const r = { primary: { protocol: { id: 0, n: "Test" } } };
    expect(extractPrimaryProtocolId(r)).toBe(0);
  });
});

describe("extractPrimaryReason — Phase 6H Fix-A1", () => {
  it("engine real shape con reason → returns string", () => {
    expect(extractPrimaryReason(ENGINE_REAL))
      .toBe("Tu sistema necesita regulación parasimpática");
  });

  it("legacy shape sin reason → returns null", () => {
    expect(extractPrimaryReason(LEGACY_MOCK)).toBeNull();
  });

  it("null/undefined → returns null", () => {
    expect(extractPrimaryReason(null)).toBeNull();
    expect(extractPrimaryReason(undefined)).toBeNull();
  });

  it("reason vacío string → returns null (treated as falsy)", () => {
    const r = { primary: { protocol: { id: 1 }, reason: "" } };
    expect(extractPrimaryReason(r)).toBeNull();
  });

  it("reason no-string (e.g. null) → returns null", () => {
    const r1 = { primary: { protocol: { id: 1 }, reason: null } };
    const r2 = { primary: { protocol: { id: 1 }, reason: undefined } };
    const r3 = { primary: { protocol: { id: 1 } } }; // no reason field
    expect(extractPrimaryReason(r1)).toBeNull();
    expect(extractPrimaryReason(r2)).toBeNull();
    expect(extractPrimaryReason(r3)).toBeNull();
  });

  it("engine real samples (varios reasons) → todos extracted correctly", () => {
    const samples = [
      "Tu historial muestra +1.2 puntos con este protocolo",
      "Readiness elevado (78): ventana para trabajo cognitivo exigente",
      "Reportaste tensión alta: regulación parasimpática antes de cualquier carga",
      "Prioridad: reducir riesgo de agotamiento sostenido",
    ];
    for (const reason of samples) {
      const r = { primary: { protocol: { id: 1 }, reason } };
      expect(extractPrimaryReason(r)).toBe(reason);
    }
  });
});

describe("isEngineRecommendation — Phase 6H Fix-A1", () => {
  it("engine real shape → true", () => {
    expect(isEngineRecommendation(ENGINE_REAL)).toBe(true);
  });

  it("legacy shape (primary flat sin protocol) → false", () => {
    expect(isEngineRecommendation(LEGACY_MOCK)).toBe(false);
  });

  it("null/undefined → false", () => {
    expect(isEngineRecommendation(null)).toBe(false);
    expect(isEngineRecommendation(undefined)).toBe(false);
  });

  it("primary.protocol existe pero protocol.id null → false", () => {
    const r = { primary: { protocol: { n: "X" } } };
    expect(isEngineRecommendation(r)).toBe(false);
  });

  it("matches engine real samples del adaptiveProtocolEngine", () => {
    // Snapshot del shape real del engine (neural.js:809)
    const engineLike = {
      primary: {
        protocol: { id: 1, n: "Reinicio Parasimpático", d: 120, int: "calma" },
        score: 73.5,
        reason: "Tu sistema necesita regulación parasimpática",
      },
      alternatives: [],
      need: "calma",
      context: { circadian: "morning" },
    };
    expect(isEngineRecommendation(engineLike)).toBe(true);
  });
});

// ===========================================================================
// Phase 6I-3 — extractAlternatives, extractAlternativeProtocol, extractAlternativeReason
// ===========================================================================
import {
  extractAlternatives,
  extractAlternativeProtocol,
  extractAlternativeReason,
} from "./recommendationExtract";

// Engine real alternatives sample (neural.js:816)
const ENGINE_REAL_ALTS = {
  primary: {
    protocol: { id: 1, n: "Reinicio Parasimpático", d: 120, int: "calma" },
    score: 80,
    reason: "primary reason",
  },
  alternatives: [
    {
      protocol: { id: 4, n: "Pulse Shift", d: 90, int: "energia" },
      score: 65.2,
      reason: "Ciclo circadiano favorable para activación",
    },
    {
      protocol: { id: 2, n: "Activación Cognitiva", d: 90, int: "enfoque" },
      score: 60.0,
      reason: "Tu historial muestra +0.8 puntos con este protocolo",
    },
  ],
  need: "calma",
};

describe("extractAlternatives — Phase 6I-3", () => {
  it("engine real shape con 2 alternatives → returns array length 2", () => {
    expect(extractAlternatives(ENGINE_REAL_ALTS)).toHaveLength(2);
  });

  it("engine alternatives preservan protocol shape completo", () => {
    const alts = extractAlternatives(ENGINE_REAL_ALTS);
    expect(alts[0].protocol.id).toBe(4);
    expect(alts[0].protocol.n).toBe("Pulse Shift");
    expect(alts[0].score).toBe(65.2);
    expect(alts[0].reason).toMatch(/Ciclo circadiano/);
  });

  it("null recommendation → empty array", () => {
    expect(extractAlternatives(null)).toEqual([]);
    expect(extractAlternatives(undefined)).toEqual([]);
  });

  it("recommendation sin alternatives field → empty array", () => {
    expect(extractAlternatives({ primary: {} })).toEqual([]);
  });

  it("alternatives es null/undefined/no-array → empty array", () => {
    expect(extractAlternatives({ alternatives: null })).toEqual([]);
    expect(extractAlternatives({ alternatives: undefined })).toEqual([]);
    expect(extractAlternatives({ alternatives: "string-not-array" })).toEqual([]);
    expect(extractAlternatives({ alternatives: 42 })).toEqual([]);
    expect(extractAlternatives({ alternatives: { 0: "obj-not-array" } })).toEqual([]);
  });

  it("alternatives empty array → empty array", () => {
    expect(extractAlternatives({ alternatives: [] })).toEqual([]);
  });

  it("alternative sin protocol.id ni id → filtered out", () => {
    const r = {
      alternatives: [
        { protocol: { id: 4, n: "Valid" }, score: 70 },
        { score: 60, reason: "no protocol" }, // invalid
        null, // invalid
        { protocol: {}, score: 50 }, // protocol sin id → invalid
      ],
    };
    expect(extractAlternatives(r)).toHaveLength(1);
    expect(extractAlternatives(r)[0].protocol.id).toBe(4);
  });

  it("alternative legacy shape (id directo, sin protocol wrapper) → preserved", () => {
    const r = {
      alternatives: [
        { id: 4, n: "Pulse Shift", int: "energia" }, // Protocol flat
      ],
    };
    expect(extractAlternatives(r)).toHaveLength(1);
    expect(extractAlternatives(r)[0].id).toBe(4);
  });

  it("mixed alternatives (some valid some invalid) → solo valid filtered", () => {
    const r = {
      alternatives: [
        { protocol: { id: 1, n: "A" }, score: 70 }, // valid engine
        { id: 2, n: "B" }, // valid legacy flat
        { protocol: { n: "no id" }, score: 60 }, // invalid
        null, // invalid
        undefined, // invalid
      ],
    };
    expect(extractAlternatives(r)).toHaveLength(2);
  });

  it("returns NEW array (no muta original)", () => {
    const original = ENGINE_REAL_ALTS.alternatives;
    const alts = extractAlternatives(ENGINE_REAL_ALTS);
    expect(alts).not.toBe(original); // new reference
    expect(original).toHaveLength(2); // original intact
  });
});

describe("extractAlternativeProtocol — Phase 6I-3", () => {
  it("alt con protocol.id (engine real) → returns protocol", () => {
    const alt = { protocol: { id: 4, n: "Pulse Shift", d: 90 }, score: 70 };
    const p = extractAlternativeProtocol(alt);
    expect(p.id).toBe(4);
    expect(p.n).toBe("Pulse Shift");
    expect(p.d).toBe(90);
  });

  it("alt legacy shape (id directo) → returns alt as protocol", () => {
    const alt = { id: 5, n: "Legacy", int: "calma" };
    expect(extractAlternativeProtocol(alt)).toBe(alt);
  });

  it("alt null/undefined → null", () => {
    expect(extractAlternativeProtocol(null)).toBeNull();
    expect(extractAlternativeProtocol(undefined)).toBeNull();
  });

  it("alt no-object → null", () => {
    expect(extractAlternativeProtocol("string")).toBeNull();
    expect(extractAlternativeProtocol(42)).toBeNull();
  });

  it("alt sin protocol.id ni id → null", () => {
    expect(extractAlternativeProtocol({ score: 50 })).toBeNull();
    expect(extractAlternativeProtocol({ protocol: { n: "no id" } })).toBeNull();
  });

  it("alt protocol.id=0 → preserved (0 es id válido defensive)", () => {
    const alt = { protocol: { id: 0, n: "Zero" }, score: 70 };
    expect(extractAlternativeProtocol(alt).id).toBe(0);
  });
});

describe("extractAlternativeReason — Phase 6I-3", () => {
  it("alt con reason string non-empty → returns string", () => {
    const alt = { protocol: { id: 4 }, score: 70, reason: "Test reason" };
    expect(extractAlternativeReason(alt)).toBe("Test reason");
  });

  it("alt sin reason field → null", () => {
    expect(extractAlternativeReason({ protocol: { id: 4 }, score: 70 })).toBeNull();
  });

  it("alt con reason vacío string → null", () => {
    expect(extractAlternativeReason({ reason: "" })).toBeNull();
    expect(extractAlternativeReason({ reason: "   " })).toBeNull(); // whitespace only
  });

  it("alt con reason no-string → null", () => {
    expect(extractAlternativeReason({ reason: null })).toBeNull();
    expect(extractAlternativeReason({ reason: undefined })).toBeNull();
    expect(extractAlternativeReason({ reason: 42 })).toBeNull();
    expect(extractAlternativeReason({ reason: { text: "obj" } })).toBeNull();
  });

  it("alt null/undefined → null", () => {
    expect(extractAlternativeReason(null)).toBeNull();
    expect(extractAlternativeReason(undefined)).toBeNull();
  });

  it("engine real samples (4 reasons distintas) → extracted correctly", () => {
    const samples = [
      "Ciclo circadiano favorable para activación",
      "Tu historial muestra +0.8 puntos con este protocolo",
      "Readiness elevado (72): ventana para trabajo cognitivo exigente",
      "Recuperación de momentum recomendada",
    ];
    for (const reason of samples) {
      const alt = { protocol: { id: 1 }, score: 70, reason };
      expect(extractAlternativeReason(alt)).toBe(reason);
    }
  });
});
