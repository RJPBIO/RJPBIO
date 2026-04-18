import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { aggregateScores } from "@/lib/nom35/scoring";
import { DOMINIOS, CATEGORIAS } from "@/lib/nom35/items";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import Link from "next/link";

export const metadata = { title: "NOM-035 · Admin" };
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["OWNER", "ADMIN", "MANAGER"]);

const NIVEL_COLOR = {
  nulo:      "var(--bi-ok)",
  bajo:      "var(--bi-ok)",
  medio:     "var(--bi-warn)",
  alto:      "var(--bi-danger)",
  muy_alto:  "var(--bi-danger)",
};
const NIVEL_LABEL = {
  nulo:      "Nulo",
  bajo:      "Bajo",
  medio:     "Medio",
  alto:      "Alto",
  muy_alto:  "Muy alto",
};

export default async function Nom35AdminPage() {
  const session = await auth();
  const mem = (session?.memberships || []).find((m) => ALLOWED.has(m.role));
  if (!mem) return <p style={{ color: cssVar.textMuted }}>No tienes permisos para ver este reporte.</p>;

  const orm = await db();
  const since = new Date(Date.now() - 365 * 86400_000);
  const rows = await orm.nom35Response.findMany({
    where: { orgId: mem.orgId, completedAt: { gte: since } },
    select: { total: true, porDominio: true, porCategoria: true, nivel: true, completedAt: true },
    orderBy: { completedAt: "desc" },
    take: 5000,
  });

  const totalSeats = await orm.membership.count({ where: { orgId: mem.orgId } });
  const agg = aggregateScores(rows, { minN: 5 });
  const coverage = totalSeats ? Math.round((rows.length / totalSeats) * 100) : 0;

  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: space[3] }}>
        <div>
          <h1 style={{ fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, margin: 0, color: cssVar.text }}>
            NOM-035 — Riesgo psicosocial
          </h1>
          <p style={{ color: cssVar.textMuted, marginTop: space[1], fontSize: font.size.sm }}>
            Agregado anónimo (últimos 12 meses). Muestras menores a 5 se suprimen por privacidad.
          </p>
        </div>
        <Link
          href="/admin/nom35/documento"
          style={{
            padding: `${space[2]}px ${space[4]}px`, borderRadius: radius.md,
            background: cssVar.accent, color: cssVar.accentInk,
            textDecoration: "none", fontWeight: font.weight.bold,
            fontSize: font.size.sm,
          }}
        >
          Generar documento oficial →
        </Link>
      </header>

      <section style={grid}>
        <Kpi title="Respuestas" value={rows.length} sub={`de ${totalSeats} miembros (${coverage}% cobertura)`} />
        {agg.suppressed ? (
          <Kpi title="Datos" value="Suprimido" sub={agg.reason} tone="warn" />
        ) : (
          <>
            <Kpi title="Puntaje promedio" value={agg.avgTotal} sub={`Nivel: ${NIVEL_LABEL[agg.nivelPromedio]}`} tone={NIVEL_COLOR[agg.nivelPromedio]} />
            <Kpi title="Alto / Muy alto" value={(agg.nivelCounts.alto || 0) + (agg.nivelCounts.muy_alto || 0)} sub="respondieron con riesgo alto" tone="danger" />
            <Kpi title="Bajo / Nulo" value={(agg.nivelCounts.bajo || 0) + (agg.nivelCounts.nulo || 0)} sub="respondieron con riesgo bajo" tone="ok" />
          </>
        )}
      </section>

      {!agg.suppressed && (
        <>
          <h2 style={h2Style}>Riesgo promedio por dominio</h2>
          <div style={{ marginTop: space[3], background: cssVar.surface, border: `1px solid ${cssVar.border}`, borderRadius: radius.md, overflow: "hidden" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: cssVar.surface2 }}>
                  <th style={thStyle}>Dominio</th>
                  <th style={thStyle}>Categoría</th>
                  <th style={thStyle}>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {(agg.porDominioAltoRiesgo || []).map((row) => {
                  const info = Object.values(DOMINIOS).find((d) => d.id === row.dominio);
                  const cat = info && Object.values(CATEGORIAS).find((c) => c.id === info.categoria);
                  return (
                    <tr key={row.dominio} style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
                      <td style={tdStyle}>{info?.label || row.dominio}</td>
                      <td style={{ ...tdStyle, color: cssVar.textMuted }}>{cat?.label || ""}</td>
                      <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{row.avg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2 style={h2Style}>Distribución de niveles</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: space[3], marginTop: space[3] }}>
            {["nulo", "bajo", "medio", "alto", "muy_alto"].map((n) => (
              <div key={n} style={{
                padding: space[4], borderRadius: radius.md,
                background: cssVar.surface, border: `1px solid ${cssVar.border}`,
              }}>
                <div style={{ fontSize: font.size.xs, color: cssVar.textMuted, textTransform: "uppercase", letterSpacing: font.tracking.wide }}>{NIVEL_LABEL[n]}</div>
                <div style={{ fontSize: font.size["2xl"], fontWeight: font.weight.black, color: NIVEL_COLOR[n], fontFamily: cssVar.fontMono }}>
                  {agg.nivelCounts[n] || 0}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Kpi({ title, value, sub, tone }) {
  const toneMap = { ok: "var(--bi-ok)", warn: "var(--bi-warn)", danger: "var(--bi-danger)" };
  const col = toneMap[tone] || tone || cssVar.text;
  return (
    <div style={{
      padding: space[4], borderRadius: radius.md,
      background: cssVar.accentSoft, border: `1px solid ${cssVar.border}`,
    }}>
      <div style={{ fontSize: font.size.xs, color: cssVar.textDim, textTransform: "uppercase", letterSpacing: font.tracking.wide, fontWeight: font.weight.semibold }}>
        {title}
      </div>
      <div style={{ fontSize: font.size["2xl"], fontWeight: font.weight.black, margin: `${space[1]}px 0`, color: col, fontFamily: cssVar.fontMono }}>
        {value}
      </div>
      <div style={{ fontSize: font.size.xs, color: cssVar.textMuted }}>{sub}</div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: space[3],
  marginTop: space[5],
};
const h2Style = {
  fontSize: font.size.lg, fontWeight: font.weight.bold,
  letterSpacing: font.tracking.tight, marginTop: space[6],
};
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: font.size.sm };
const thStyle = {
  textAlign: "left", padding: `${space[3]}px ${space[4]}px`,
  fontSize: font.size.xs, color: cssVar.textDim, fontWeight: font.weight.semibold,
  textTransform: "uppercase", letterSpacing: font.tracking.wide,
};
const tdStyle = { padding: `${space[3]}px ${space[4]}px`, color: cssVar.text };
