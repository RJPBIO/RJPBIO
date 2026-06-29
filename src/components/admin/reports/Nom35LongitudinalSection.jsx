/* ═══════════════════════════════════════════════════════════════
   Nom35LongitudinalSection — la foto se vuelve tendencia.
   ───────────────────────────────────────────────────────────────
   Renderiza la comparación período-a-período (compareNom35Aggregates):
   trayectoria del riesgo general + qué dominios mejoraron / empeoraron
   entre el período base y el actual. Server component (presentacional).

   Dirección de riesgo: en NOM-035 más puntaje = más riesgo, así que
   "mejoró" = el puntaje bajó. Verde = mejoró, rojo = empeoró, neutro =
   estable. Sin emojis ni glifos genéricos; "→" solo como transición de
   estado (coherente con el resto de /admin).
   ═══════════════════════════════════════════════════════════════ */
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { NIVEL_LABEL } from "@/lib/nom35/longitudinal";
import { nom035TextValidatedByLawyer } from "@/lib/nom35/integrity";

const NIVEL_COLOR = {
  nulo: "var(--bi-ok)",
  bajo: "var(--bi-ok)",
  medio: "var(--bi-warn)",
  alto: "var(--bi-danger)",
  muy_alto: "var(--bi-danger)",
};

const DIR = {
  improved: { label: "Mejoró", color: "var(--bi-ok)" },
  worsened: { label: "Empeoró", color: "var(--bi-danger)" },
  stable: { label: "Estable", color: "var(--bi-text-dim, #8a8a92)" },
};

function NivelChip({ nivel }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `2px ${space[2]}px`,
        borderRadius: radius.sm,
        fontSize: font.size.xs,
        fontWeight: font.weight.semibold,
        color: NIVEL_COLOR[nivel] || cssVar.textMuted,
        border: `1px solid ${NIVEL_COLOR[nivel] || cssVar.border}`,
        background: "transparent",
        whiteSpace: "nowrap",
      }}
    >
      {NIVEL_LABEL[nivel] || nivel}
    </span>
  );
}

function fmtDelta(delta) {
  if (delta === 0) return "0";
  const mag = Math.abs(delta).toFixed(1);
  return delta > 0 ? `+${mag}` : `−${mag}`;
}

// Orden CHRO: lo accionable primero (empeoró, por magnitud) → mejoró
// (valida la intervención) → estable (al final, atenuado).
const DIR_ORDER = { worsened: 0, improved: 1, stable: 2 };

export default function Nom35LongitudinalSection({ comparison, periodDays = 90 }) {
  const h2Style = {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    marginTop: space[6],
  };
  const eyebrow = {
    fontSize: font.size.xs,
    color: cssVar.textDim,
    textTransform: "uppercase",
    letterSpacing: font.tracking.wide,
    fontWeight: font.weight.semibold,
  };

  if (!comparison || !comparison.available) {
    return (
      <section>
        <h2 style={h2Style}>Tendencia longitudinal</h2>
        <div
          style={{
            marginTop: space[3],
            padding: space[5],
            background: cssVar.surface,
            border: `1px dashed ${cssVar.border}`,
            borderRadius: radius.md,
            color: cssVar.textMuted,
            fontSize: font.size.sm,
            lineHeight: 1.5,
          }}
        >
          <div style={{ ...eyebrow, marginBottom: space[2] }}>Aún sin comparativa</div>
          {comparison?.reason ||
            "Se necesitan dos períodos con muestra suficiente (≥5) para comparar."}{" "}
          La tendencia se activa al reaplicar la evaluación tras ~{periodDays} días.
        </div>
      </section>
    );
  }

  const { total, dominios, summary, headline, n } = comparison;
  const dir = DIR[total.direction] || DIR.stable;
  const sorted = (dominios || [])
    .slice()
    .sort((a, b) => {
      const d = (DIR_ORDER[a.direction] ?? 3) - (DIR_ORDER[b.direction] ?? 3);
      if (d !== 0) return d;
      return Math.abs(b.delta) - Math.abs(a.delta);
    });

  return (
    <section>
      <h2 style={h2Style}>Tendencia longitudinal</h2>
      <div style={{ ...eyebrow, marginTop: space[2] }}>
        Período actual ({periodDays} días) vs período anterior
        {n ? ` · N ${n.baseline} → ${n.current}` : ""}
      </div>

      {/* Headline + trayectoria del riesgo general */}
      <div
        style={{
          marginTop: space[3],
          padding: space[5],
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderLeft: `3px solid ${dir.color}`,
          borderRadius: radius.md,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: font.size.md || font.size.base,
            fontWeight: font.weight.semibold,
            color: cssVar.text,
            lineHeight: 1.45,
            letterSpacing: font.tracking.tight,
          }}
        >
          {headline}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: space[3],
            marginTop: space[4],
            flexWrap: "wrap",
          }}
        >
          <NivelChip nivel={total.nivelBaseline} />
          <span style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>→</span>
          <NivelChip nivel={total.nivelCurrent} />
          <span
            style={{
              marginLeft: space[2],
              fontFamily: cssVar.fontMono,
              fontSize: font.size.sm,
              fontWeight: font.weight.bold,
              color: dir.color,
            }}
          >
            {fmtDelta(total.delta)} pts · {dir.label}
          </span>
        </div>
      </div>

      {/* Trayectoria por dominio */}
      <div
        style={{
          marginTop: space[4],
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          overflow: "hidden",
        }}
      >
        {sorted.map((d, i) => {
          const dd = DIR[d.direction] || DIR.stable;
          return (
            <div
              key={d.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: space[3],
                padding: `${space[3]}px ${space[4]}px`,
                borderBlockStart: i === 0 ? "none" : `1px solid ${cssVar.border}`,
                opacity: d.direction === "stable" ? 0.62 : 1,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: font.size.sm,
                    fontWeight: font.weight.semibold,
                    color: cssVar.text,
                    letterSpacing: font.tracking.tight,
                  }}
                >
                  {d.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: space[2],
                    marginTop: 4,
                  }}
                >
                  <NivelChip nivel={d.nivelBaseline} />
                  <span style={{ color: cssVar.textMuted, fontSize: font.size.xs }}>→</span>
                  <NivelChip nivel={d.nivelCurrent} />
                </div>
              </div>
              <span
                style={{
                  fontFamily: cssVar.fontMono,
                  fontSize: font.size.sm,
                  fontWeight: font.weight.bold,
                  color: dd.color,
                  textAlign: "right",
                }}
              >
                {fmtDelta(d.delta)}
              </span>
              <span
                style={{
                  fontSize: font.size.xs,
                  fontWeight: font.weight.semibold,
                  color: dd.color,
                  minWidth: 72,
                  textAlign: "right",
                }}
              >
                {dd.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Resumen + nota legal */}
      <p
        style={{
          marginTop: space[3],
          fontSize: font.size.xs,
          color: cssVar.textMuted,
          lineHeight: 1.5,
        }}
      >
        {summary.improved.length} mejoraron · {summary.worsened.length} empeoraron ·{" "}
        {summary.stable.length} estables. Comparativa anónima agregada (k-anonimato ≥ 5 por
        período).
        {!nom035TextValidatedByLawyer && (
          <> Texto del instrumento pendiente de validación legal vs DOF oficial; uso informativo.</>
        )}
      </p>
    </section>
  );
}
