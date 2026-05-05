/* burnoutEnhanced — Phase 6F SP-E
   Tests cubren: empty/null snapshot, signals 1-3 mapeados desde base
   assessment, HRV decline signal (active/inactive/insufficient), chrono
   dyssynchrony signal (active/inactive/no chronotype), level by signal
   count, disclaimer SAPTEL siempre presente, wellbeingCopy per level. */

import { describe, it, expect } from "vitest";
import {
  assessBurnoutEnhanced,
  wellbeingCopy,
  WELLBEING_DISCLAIMER,
  ENHANCED_DEFAULTS,
} from "./burnoutEnhanced";

const NOW = Date.parse("2026-05-04T12:00:00Z"); // determinístico para tests
const DAY_MS = 86_400_000;

function dayAgo(n) {
  return new Date(NOW - n * DAY_MS);
}

function makeSession({ daysAgo, pre = 5, post = 5, coh = null }) {
  return {
    completedAt: dayAgo(daysAgo),
    moodPre: pre,
    moodPost: post,
    coherenciaDelta: coh,
  };
}

function makeHrv({ daysAgo, rmssd }) {
  return { rmssd, measuredAt: dayAgo(daysAgo) };
}

describe("assessBurnoutEnhanced — Phase 6F SP-E", () => {
  it("snapshot null/inválido → level=ok, empty signals + disclaimer", () => {
    const r = assessBurnoutEnhanced(null);
    expect(r.level).toBe("ok");
    expect(r.signals).toEqual([]);
    expect(r.insufficient).toBe(true);
    expect(r.snapshot.disclaimer).toBe(WELLBEING_DISCLAIMER);
  });

  it("snapshot vacío (sin sessions) → ok + insufficient", () => {
    const r = assessBurnoutEnhanced({ sessions: [], hrv: [], chronotype: null }, { now: NOW });
    expect(r.level).toBe("ok");
    expect(r.signals).toEqual([]);
    expect(r.snapshot.disclaimer).toBe(WELLBEING_DISCLAIMER);
  });

  it("disclaimer SAPTEL + 'NO es diagnóstico médico' siempre presente", () => {
    const r = assessBurnoutEnhanced({ sessions: [] }, { now: NOW });
    expect(r.snapshot.disclaimer).toMatch(/SAPTEL/);
    expect(r.snapshot.disclaimer).toMatch(/800-290-0024/);
    expect(r.snapshot.disclaimer).toMatch(/NO es diagnóstico/i);
    expect(r.snapshot.disclaimer).toMatch(/Bio-Ignición no es dispositivo médico/);
  });

  it("level=ok cuando 0 signals activas", () => {
    // 10 sesiones consistentes con misma frecuencia, mood estable, eff estable
    const sessions = Array.from({ length: 12 }, (_, i) =>
      makeSession({ daysAgo: i + 1, pre: 6, post: 7, coh: 5 })
    );
    const r = assessBurnoutEnhanced({ sessions }, { now: NOW });
    expect(r.signals).toEqual([]);
    expect(r.level).toBe("ok");
  });

  it("freqDrop signal active cuando frecuencia recent ≪ baseline", () => {
    // Baseline 28d con muchas sesiones; recent 7d con muy pocas → freqDrop alto
    const baseline = Array.from({ length: 18 }, (_, i) =>
      makeSession({ daysAgo: 8 + i, pre: 6, post: 7 })
    );
    const recent = [makeSession({ daysAgo: 6, pre: 6, post: 7 })]; // solo 1
    const sessions = [...baseline, ...recent];
    const r = assessBurnoutEnhanced({ sessions }, { now: NOW });
    expect(r.signals).toContain("freqDrop");
  });

  it("hrvDecline signal active cuando recent < baseline × 0.80", () => {
    // 5 mediciones en baseline window (28d-7d) con rmssd ~50
    // 5 mediciones en recent window (last 7d) con rmssd ~30 → decline 40%
    const baseline = Array.from({ length: 5 }, (_, i) =>
      makeHrv({ daysAgo: 10 + i * 2, rmssd: 50 })
    );
    const recent = Array.from({ length: 5 }, (_, i) =>
      makeHrv({ daysAgo: 1 + i, rmssd: 30 })
    );
    const r = assessBurnoutEnhanced(
      { sessions: [], hrv: [...baseline, ...recent] },
      { now: NOW }
    );
    expect(r.signals).toContain("hrvDecline");
    expect(r.metrics.hrvBaseline28d).toBeCloseTo(50, 0);
    expect(r.metrics.hrvRecent7d).toBeCloseTo(30, 0);
    expect(r.metrics.hrvDeclinePct).toBeGreaterThan(0.20);
  });

  it("hrvDecline signal NOT active cuando decline <20%", () => {
    const baseline = Array.from({ length: 5 }, (_, i) =>
      makeHrv({ daysAgo: 10 + i * 2, rmssd: 50 })
    );
    const recent = Array.from({ length: 5 }, (_, i) =>
      makeHrv({ daysAgo: 1 + i, rmssd: 47 }) // solo -6%
    );
    const r = assessBurnoutEnhanced(
      { sessions: [], hrv: [...baseline, ...recent] },
      { now: NOW }
    );
    expect(r.signals).not.toContain("hrvDecline");
  });

  it("hrvDecline signal NOT active con datos insuficientes (<3 en cualquier window)", () => {
    // Solo 2 baseline → insufficient
    const baseline = [makeHrv({ daysAgo: 15, rmssd: 50 }), makeHrv({ daysAgo: 14, rmssd: 50 })];
    const recent = Array.from({ length: 5 }, (_, i) =>
      makeHrv({ daysAgo: 1 + i, rmssd: 20 })
    );
    const r = assessBurnoutEnhanced(
      { sessions: [], hrv: [...baseline, ...recent] },
      { now: NOW }
    );
    expect(r.signals).not.toContain("hrvDecline");
    expect(r.metrics.hrvBaselineN).toBe(2);
  });

  it("chronoDyssynchrony active cuando ≥7 sesiones consecutivas más recientes fuera de window", () => {
    // Cronotipo definite_morning → deepWork 07:00-11:00.
    // 8 sesiones más recientes a las 22:00 (fuera) → active.
    const sessions = Array.from({ length: 8 }, (_, i) => ({
      completedAt: new Date(NOW - i * DAY_MS - 10 * 3600_000), // 10h ago each day → ~02:00 local
      moodPre: 5,
      moodPost: 6,
    }));
    // NOW = 12:00 UTC; -10h = 02:00 UTC. Tests usan getHours() local = browser TZ.
    // Para forzar fuera-de-window, usamos timestamp 22:00 local explícito.
    const sessionsAt22 = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(NOW - i * DAY_MS);
      d.setHours(22, 0, 0, 0); // 22:00 local — fuera de definite_morning deepWork
      return { completedAt: d, moodPre: 5, moodPost: 6 };
    });
    const r = assessBurnoutEnhanced(
      { sessions: sessionsAt22, chronotype: { type: "definite_morning" } },
      { now: NOW }
    );
    expect(r.signals).toContain("chronoDyssynchrony");
    expect(r.metrics.chronoMisalignedSessions).toBeGreaterThanOrEqual(7);
  });

  it("chronoDyssynchrony NOT active cuando sesiones dentro de window", () => {
    // Cronotipo definite_morning → deepWork 07:00-11:00.
    // Sesiones a las 09:00 (dentro de window) → NO active.
    const sessions = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(NOW - i * DAY_MS);
      d.setHours(9, 0, 0, 0); // 09:00 local — dentro de morning deepWork
      return { completedAt: d, moodPre: 5, moodPost: 6 };
    });
    const r = assessBurnoutEnhanced(
      { sessions, chronotype: { type: "definite_morning" } },
      { now: NOW }
    );
    expect(r.signals).not.toContain("chronoDyssynchrony");
  });

  it("chronoDyssynchrony NOT active sin chronotype", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(NOW - i * DAY_MS);
      d.setHours(22, 0, 0, 0);
      return { completedAt: d, moodPre: 5, moodPost: 6 };
    });
    const r = assessBurnoutEnhanced({ sessions, chronotype: null }, { now: NOW });
    expect(r.signals).not.toContain("chronoDyssynchrony");
  });

  it("level by signal count: 0=ok, 1=watch, 2=warn, 3+=alert", () => {
    // 0 signals
    let r = assessBurnoutEnhanced({ sessions: [] }, { now: NOW });
    expect(r.level).toBe("ok");

    // 1 signal: solo HRV decline
    const hrvBaseline = Array.from({ length: 5 }, (_, i) =>
      makeHrv({ daysAgo: 10 + i * 2, rmssd: 50 })
    );
    const hrvRecent = Array.from({ length: 5 }, (_, i) =>
      makeHrv({ daysAgo: 1 + i, rmssd: 30 })
    );
    r = assessBurnoutEnhanced(
      { sessions: [], hrv: [...hrvBaseline, ...hrvRecent] },
      { now: NOW }
    );
    expect(r.signals.length).toBe(1);
    expect(r.level).toBe("watch");

    // 2 signals: HRV + chrono
    const sessionsOff = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(NOW - i * DAY_MS);
      d.setHours(22, 0, 0, 0);
      return { completedAt: d, moodPre: 5, moodPost: 6 };
    });
    r = assessBurnoutEnhanced(
      {
        sessions: sessionsOff,
        hrv: [...hrvBaseline, ...hrvRecent],
        chronotype: { type: "definite_morning" },
      },
      { now: NOW }
    );
    expect(r.signals.length).toBeGreaterThanOrEqual(2);
    expect(["warn", "alert"]).toContain(r.level);
  });

  it("snapshot.methodology = 'heuristic-retrospective' (NO ML predictive)", () => {
    const r = assessBurnoutEnhanced({ sessions: [] }, { now: NOW });
    expect(r.snapshot.methodology).toBe("heuristic-retrospective");
    expect(r.snapshot.version).toBe("v1");
  });

  it("respeta opts.now para tests determinísticos", () => {
    const customNow = Date.parse("2026-01-01T00:00:00Z");
    const r = assessBurnoutEnhanced({ sessions: [] }, { now: customNow });
    expect(r.snapshot.computedAt.getTime()).toBe(customNow);
  });

  it("ENHANCED_DEFAULTS expone thresholds tunables", () => {
    expect(ENHANCED_DEFAULTS.hrvDeclineThreshold).toBe(0.20);
    expect(ENHANCED_DEFAULTS.chronoDyssynchronySessions).toBe(7);
    expect(ENHANCED_DEFAULTS.hrvBaselineDays).toBe(28);
    expect(ENHANCED_DEFAULTS.hrvRecentDays).toBe(7);
  });
});

describe("wellbeingCopy — Phase 6F SP-E", () => {
  it("retorna copy distinto per level", () => {
    expect(wellbeingCopy("ok").title).toMatch(/wellbeing/i);
    expect(wellbeingCopy("watch").title).toMatch(/observar/i);
    expect(wellbeingCopy("warn").title).toMatch(/agotamiento/i);
    expect(wellbeingCopy("alert").title).toMatch(/agotamiento/i);
  });

  it("watch+warn+alert tienen CTA, ok no tiene CTA", () => {
    expect(wellbeingCopy("ok").cta).toBeNull();
    expect(wellbeingCopy("watch").cta).toBeTruthy();
    expect(wellbeingCopy("warn").cta).toBeTruthy();
    expect(wellbeingCopy("alert").cta).toBeTruthy();
  });

  it("warn CTA apunta a Burnout Recovery program", () => {
    expect(wellbeingCopy("warn").cta.target).toMatch(/program/);
    expect(wellbeingCopy("warn").cta.label).toMatch(/burnout recovery/i);
  });

  it("alert incluye crisisLine SAPTEL", () => {
    expect(wellbeingCopy("alert").crisisLine).toMatch(/SAPTEL/);
    expect(wellbeingCopy("alert").crisisLine).toMatch(/800-290-0024/);
  });

  it("subtitle warn explica 'NO es diagnóstico'", () => {
    expect(wellbeingCopy("warn").subtitle).toMatch(/NO es diagnóstico/i);
  });

  it("severity field per level (info/warn/danger)", () => {
    expect(wellbeingCopy("ok").severity).toBe("info");
    expect(wellbeingCopy("watch").severity).toBe("info");
    expect(wellbeingCopy("warn").severity).toBe("warn");
    expect(wellbeingCopy("alert").severity).toBe("danger");
  });

  it("level desconocido → fallback ok", () => {
    expect(wellbeingCopy("nonexistent")).toEqual(wellbeingCopy("ok"));
    expect(wellbeingCopy(null)).toEqual(wellbeingCopy("ok"));
  });
});

describe("Marketing copy — NO 'burnout score' / 'predicción' / 'diagnóstico'", () => {
  it("ningún copy usa lenguaje 'burnout score' literal", () => {
    for (const level of ["ok", "watch", "warn", "alert"]) {
      const c = wellbeingCopy(level);
      expect(`${c.title} ${c.subtitle}`.toLowerCase()).not.toMatch(/burnout score/);
      expect(`${c.title} ${c.subtitle}`.toLowerCase()).not.toMatch(/predicción/);
    }
  });

  it("disclaimer no usa 'diagnóstico' como afirmación, solo en negación", () => {
    expect(WELLBEING_DISCLAIMER).toMatch(/NO es diagnóstico/i);
  });
});
