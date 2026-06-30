/* ═══════════════════════════════════════════════════════════════
   JOURNAL EXPORT — eres dueño de tu diario fisiológico.
   ───────────────────────────────────────────────────────────────
   Serializa el diario autonómico (momentos + su huella + agregado por
   contexto) a un objeto exportable/portable. Función pura — el trigger
   de descarga vive en la UI. Todo local; el export es del usuario.
   ═══════════════════════════════════════════════════════════════ */

const iso = (ts) => {
  const n = Number(ts);
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
};

/**
 * @param {object} journal — salida de buildAutonomicJournal
 * @param {object} [opts] — { now }
 */
export function buildJournalExport(journal, opts = {}) {
  const j = journal || {};
  const now = opts.now ?? 0;
  const entries = Array.isArray(j.entries) ? j.entries : [];

  return {
    app: "bio-ignicion",
    kind: "autonomic-journal",
    version: 1,
    exportedAt: iso(now),
    summary: {
      total: j.coverage?.total ?? entries.length,
      withReading: j.coverage?.withReading ?? entries.filter((e) => e?.autonomic).length,
      insight: j.insight || null,
      byContext: (j.byContext || []).map((c) => ({
        context: c.context,
        label: c.contextLabel,
        n: c.n,
        meanRmssd: c.meanRmssd,
        meanZ: c.meanZ,
      })),
    },
    moments: entries.map((e) => ({
      ts: e.ts,
      date: iso(e.ts),
      context: e.context || null,
      contextLabel: e.contextLabel || null,
      label: e.label || "",
      autonomic: e.autonomic
        ? {
            rmssd: e.autonomic.rmssd,
            lnRmssd: e.autonomic.lnRmssd,
            z: e.autonomic.z,
            hoursFromEvent: e.autonomic.hoursFromEvent,
          }
        : null,
    })),
  };
}

/** Nombre de archivo sugerido (fecha local del export). */
export function journalExportFilename(now) {
  const d = iso(now);
  const day = d ? d.slice(0, 10) : "export";
  return `diario-autonomico-${day}.json`;
}
