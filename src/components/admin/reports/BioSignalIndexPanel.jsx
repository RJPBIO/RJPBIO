/* ═══════════════════════════════════════════════════════════════
   BioSignalIndexPanel — tu org vs el promedio de tu industria.
   ───────────────────────────────────────────────────────────────
   Convierte la métrica interna en competitiva. Estados honestos: pide
   industria si falta; "en formación" si la cohorte no tiene masa (k-anon).
   Server component presentacional; ADN admin (cssVar/font/space).
   ═══════════════════════════════════════════════════════════════ */
import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";

const COMP_LABEL = { nom35: "NOM-035", mood: "Ánimo", hrv: "HRV", engagement: "Uso" };

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontFamily: cssVar.fontMono,
        fontSize: font.size.xs,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: bioSignal.phosphorCyanInk,
        fontWeight: font.weight.semibold,
      }}
    >
      {children}
    </div>
  );
}

function Shell({ children }) {
  return (
    <section
      data-v2-biosignal-index
      style={{
        padding: space[5],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        display: "flex",
        flexDirection: "column",
        gap: space[4],
      }}
    >
      {children}
    </section>
  );
}

export default function BioSignalIndexPanel({ report }) {
  if (!report) return null;

  // Estado: falta industria.
  if (!report.available) {
    return (
      <Shell>
        <Eyebrow>BioSignal Index</Eyebrow>
        <p style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text, letterSpacing: font.tracking.tight }}>
          {report.reason || "Benchmark no disponible."}
        </p>
        {report.needsCohort && (
          <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: 1.5 }}>
            En Ajustes de la organización, define industria, tamaño y turno. El benchmark se construye con tu cohorte de forma anónima (k-anonimato).
          </p>
        )}
      </Shell>
    );
  }

  const { myIndex, cohort, comparison, components, benchmarkReady, minOrgs } = report;
  const deltaColor = comparison?.available
    ? comparison.delta >= 8 ? "var(--bi-ok)" : comparison.delta <= -8 ? "var(--bi-danger)" : cssVar.textMuted
    : cssVar.textMuted;

  // Escala 0-100 para la barra: banda p25-p75 + media + marcador de la org.
  const pct = (v) => `${Math.max(0, Math.min(100, Number(v) || 0))}%`;

  return (
    <Shell>
      <Eyebrow>BioSignal Index · {report.org?.industry}</Eyebrow>

      <div style={{ display: "flex", alignItems: "baseline", gap: space[3], flexWrap: "wrap" }}>
        <span style={{ fontSize: font.size["3xl"], fontWeight: font.weight.black, color: cssVar.text, fontFamily: cssVar.fontMono, letterSpacing: font.tracking.tight }}>
          {myIndex ?? "—"}
        </span>
        <span style={{ fontSize: font.size.sm, color: cssVar.textMuted }}>/ 100 · tu organización</span>
      </div>

      {benchmarkReady && comparison?.available ? (
        <>
          <p style={{ margin: 0, fontSize: font.size.md || font.size.base, fontWeight: font.weight.semibold, color: cssVar.text, letterSpacing: font.tracking.tight, lineHeight: 1.4 }}>
            Promedio de tu industria: <span style={{ fontFamily: cssVar.fontMono }}>{cohort.mean}</span> ·{" "}
            <span style={{ color: deltaColor, fontFamily: cssVar.fontMono }}>
              {comparison.delta >= 0 ? "+" : "−"}{Math.abs(comparison.delta)}
            </span>{" "}
            <span style={{ color: deltaColor }}>{comparison.label}</span> · percentil {comparison.percentile}
          </p>

          {/* Barra: banda intercuartil + media + tu org */}
          <div style={{ position: "relative", height: 36 }}>
            <div style={{ position: "absolute", insetInline: 0, top: 16, height: 4, borderRadius: 2, background: cssVar.surface2 || "rgba(0,0,0,0.06)" }} />
            <div style={{ position: "absolute", left: pct(cohort.p25), width: pct(cohort.p75 - cohort.p25), top: 14, height: 8, borderRadius: 4, background: "rgba(34,211,238,0.18)", border: `1px solid rgba(34,211,238,0.4)` }} />
            <div style={{ position: "absolute", left: pct(cohort.mean), top: 10, width: 2, height: 16, marginInlineStart: -1, background: cssVar.textMuted }} title="media industria" />
            <div style={{ position: "absolute", left: pct(myIndex), top: 8, width: 14, height: 14, marginInlineStart: -7, borderRadius: "50%", background: bioSignal.phosphorCyan, boxShadow: `0 0 10px ${bioSignal.phosphorCyan}`, border: "2px solid #fff" }} title="tu org" />
          </div>
          <div style={{ fontSize: font.size.xs, color: cssVar.textDim }}>
            Banda = rango intercuartil de tu industria (n={cohort.n} orgs). Punto = tu org.
          </div>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: 1.5 }}>
          Benchmark de industria <strong>en formación</strong>: se activa cuando haya al menos {minOrgs} organizaciones de tu industria con datos suficientes. Tu índice ya se calcula; la comparativa aparece al alcanzar masa (anónima, k-anonimato).
        </p>
      )}

      {/* Componentes del índice */}
      {components && Object.keys(components).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: space[3], paddingBlockStart: space[2], borderBlockStart: `1px solid ${cssVar.border}` }}>
          {Object.entries(components).map(([k, v]) => (
            <span key={k} style={{ fontSize: font.size.xs, color: cssVar.textMuted }}>
              {COMP_LABEL[k] || k}: <span style={{ color: cssVar.text, fontFamily: cssVar.fontMono }}>{v}</span>
            </span>
          ))}
        </div>
      )}

      <p style={{ margin: 0, fontSize: font.size.xs, color: cssVar.textDim, lineHeight: 1.5 }}>
        Índice compuesto de señales de bienestar/autonómicas (NOM-035, ánimo, HRV, uso) — orientativo, no clínico. Comparativa anónima agregada (k-anonimato).
      </p>
    </Shell>
  );
}
