import { describe, it, expect } from "vitest";
import { buildJournalExport, journalExportFilename } from "./journalExport";

const NOW = new Date(2026, 5, 15, 12, 0, 0).getTime();

const journal = {
  insight: "Tus mejores estados coinciden con Logro; los más bajos con Trabajo.",
  coverage: { total: 3, withReading: 2 },
  byContext: [
    { context: "logro", contextLabel: "Logro", n: 2, meanRmssd: 60, meanZ: 1.1 },
    { context: "trabajo", contextLabel: "Trabajo", n: 2, meanRmssd: 25, meanZ: -0.9 },
  ],
  entries: [
    { ts: NOW - 86400000, context: "logro", contextLabel: "Logro", label: "Cerré el trato", autonomic: { rmssd: 58, lnRmssd: 4.06, z: 1.0, hoursFromEvent: 0.2 } },
    { ts: NOW - 2 * 86400000, context: "trabajo", contextLabel: "Trabajo", label: "", autonomic: null },
  ],
};

describe("buildJournalExport", () => {
  it("serializa metadata + summary + momentos", () => {
    const x = buildJournalExport(journal, { now: NOW });
    expect(x.app).toBe("bio-ignicion");
    expect(x.kind).toBe("autonomic-journal");
    expect(x.version).toBe(1);
    expect(x.exportedAt).toMatch(/^2026-06-15T/);
    expect(x.summary.total).toBe(3);
    expect(x.summary.withReading).toBe(2);
    expect(x.summary.byContext).toHaveLength(2);
    expect(x.moments).toHaveLength(2);
  });

  it("incluye fecha ISO y huella por momento (o null)", () => {
    const x = buildJournalExport(journal, { now: NOW });
    expect(x.moments[0].date).toMatch(/^2026-06-14T/);
    expect(x.moments[0].autonomic.rmssd).toBe(58);
    expect(x.moments[1].autonomic).toBeNull();
  });

  it("no rompe con diario vacío/undefined", () => {
    const x = buildJournalExport(null, { now: NOW });
    expect(x.moments).toEqual([]);
    expect(x.summary.total).toBe(0);
  });

  it("filename con fecha local", () => {
    expect(journalExportFilename(NOW)).toBe("diario-autonomico-2026-06-15.json");
  });
});
