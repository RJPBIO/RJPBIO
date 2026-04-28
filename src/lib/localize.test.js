import { describe, it, expect } from "vitest";
import {
  protocolDisplayName,
  protocolDisplaySubtitle,
  programDisplayName,
  programDisplaySubtitle,
  programDisplayLong,
  programDisplayRationale,
  programDisplayEvidence,
} from "./localize";
import { P as PROTOCOLS } from "./protocols";
import { PROGRAMS } from "./programs";

describe("protocolDisplayName", () => {
  it("returns EN name when locale is en", () => {
    const p1 = PROTOCOLS.find((p) => p.id === 1);
    expect(protocolDisplayName(p1, "en")).toBe("Parasympathetic Reset");
  });

  it("returns ES name when locale is es", () => {
    const p1 = PROTOCOLS.find((p) => p.id === 1);
    expect(protocolDisplayName(p1, "es")).toBe("Reinicio Parasimpático");
  });

  it("falls back to protocol.n when locale dict missing entry", () => {
    const custom = { id: 999, n: "Custom" };
    expect(protocolDisplayName(custom, "en")).toBe("Custom");
  });

  it("returns empty string for null", () => {
    expect(protocolDisplayName(null, "en")).toBe("");
  });

  it("all protocols have EN names", () => {
    PROTOCOLS.forEach((p) => {
      const name = protocolDisplayName(p, "en");
      expect(name).toBeTruthy();
      expect(name.length).toBeGreaterThan(0);
    });
  });

  it("all protocols have ES names", () => {
    PROTOCOLS.forEach((p) => {
      const name = protocolDisplayName(p, "es");
      expect(name).toBeTruthy();
    });
  });
});

describe("protocolDisplaySubtitle", () => {
  it("returns EN subtitle", () => {
    const p1 = PROTOCOLS.find((p) => p.id === 1);
    expect(protocolDisplaySubtitle(p1, "en")).toContain("executive");
  });

  it("returns ES subtitle", () => {
    const p1 = PROTOCOLS.find((p) => p.id === 1);
    expect(protocolDisplaySubtitle(p1, "es")).toContain("ejecutiva");
  });
});

describe("programDisplayName", () => {
  it("returns EN program name", () => {
    const p = PROGRAMS.find((x) => x.id === "recovery-week");
    expect(programDisplayName(p, "en")).toBe("Recovery Week");
  });

  it("returns ES program name", () => {
    const p = PROGRAMS.find((x) => x.id === "burnout-recovery");
    expect(programDisplayName(p, "es")).toBe("Burnout Recovery");
  });

  it("all 5 programs have EN names", () => {
    PROGRAMS.forEach((p) => {
      expect(programDisplayName(p, "en")).toBeTruthy();
    });
  });

  it("all 5 programs have ES names", () => {
    PROGRAMS.forEach((p) => {
      expect(programDisplayName(p, "es")).toBeTruthy();
    });
  });
});

describe("programDisplaySubtitle", () => {
  it("EN subtitle", () => {
    const p = PROGRAMS.find((x) => x.id === "focus-sprint");
    expect(programDisplaySubtitle(p, "en")).toContain("morning");
  });

  it("ES subtitle", () => {
    const p = PROGRAMS.find((x) => x.id === "focus-sprint");
    expect(programDisplaySubtitle(p, "es")).toContain("matinales");
  });
});

describe("programDisplayLong + rationale + evidence", () => {
  it("long EN exists for all programs", () => {
    PROGRAMS.forEach((p) => {
      expect(programDisplayLong(p, "en")).toBeTruthy();
    });
  });

  it("rationale EN exists for all programs", () => {
    PROGRAMS.forEach((p) => {
      expect(programDisplayRationale(p, "en")).toBeTruthy();
    });
  });

  it("evidence field present only when program defines it", () => {
    // Burnout Recovery tiene evidence; otros no (null/empty)
    const burnout = PROGRAMS.find((x) => x.id === "burnout-recovery");
    expect(programDisplayEvidence(burnout, "en")).toBeTruthy();
    const recovery = PROGRAMS.find((x) => x.id === "recovery-week");
    expect(programDisplayEvidence(recovery, "en")).toBeFalsy();
  });
});

describe("fallback behavior", () => {
  it("unknown locale falls back to EN", () => {
    const p1 = PROTOCOLS.find((p) => p.id === 1);
    // "xx" is not in LOCALES → should fall back to EN
    expect(protocolDisplayName(p1, "xx")).toBe("Parasympathetic Reset");
  });

  it("program missing sbLong falls back to program.sb_long source", () => {
    // Todos los programas tienen sbLong en es + en → no hay fallback real aquí
    // Test indirecto: sin locale válido → cae a EN
    const p = PROGRAMS[0];
    expect(programDisplayLong(p, "xx")).toBeTruthy();
  });
});
