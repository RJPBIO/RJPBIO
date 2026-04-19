import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { anonymize } from "@/server/analytics";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export const metadata = { title: "Equipo" };
export const dynamic = "force-dynamic";

export default async function TeamPage({ searchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/team");
  const mgr = session.memberships.find((m) => ["OWNER","ADMIN","MANAGER"].includes(m.role));
  if (!mgr) redirect("/");
  const sp = await searchParams;
  const orm = await db();
  const teams = await orm.team.findMany({ where: { orgId: mgr.orgId } });
  const teamId = sp?.team || teams[0]?.id;
  const from = new Date(Date.now() - 30 * 86400_000);
  const sessions = await orm.neuralSession.findMany({
    where: { orgId: mgr.orgId, ...(teamId ? { teamId } : {}), completedAt: { gte: from } },
  });
  const agg = anonymize(sessions, { k: 5, epsilon: 1.0 });

  return (
    <main style={{
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      background: cssVar.bg,
      minHeight: "100dvh",
      fontFamily: cssVar.fontSans,
    }}>
      <header style={{ marginBottom: space[4] }}>
        <h1 style={{
          margin: 0,
          fontSize: font.size["2xl"],
          fontWeight: font.weight.black,
          letterSpacing: font.tracking.tight,
        }}>
          Panel de equipo
        </h1>
        <p style={{
          color: cssVar.textMuted,
          fontSize: font.size.sm,
          marginTop: space[1],
          lineHeight: 1.5,
        }}>
          Datos agregados con k-anonymity ≥5 y noise diferencial (ε=1.0). Nunca se identifican individuos.
        </p>
      </header>

      {teams.length > 0 && (
        <nav
          aria-label="Filtrar por equipo"
          style={{
            display: "flex",
            gap: space[2],
            margin: `${space[3]}px 0 ${space[4]}px`,
            flexWrap: "wrap",
          }}
        >
          {teams.map((t) => {
            const active = t.id === teamId;
            return (
              <a
                key={t.id}
                href={`/team?team=${t.id}`}
                aria-current={active ? "page" : undefined}
                style={{
                  padding: `${space[2]}px ${space[4]}px`,
                  borderRadius: radius.full,
                  border: `1px solid ${active ? cssVar.accent : cssVar.border}`,
                  background: active ? cssVar.accentSoft : "transparent",
                  color: active ? cssVar.accent : cssVar.textDim,
                  textDecoration: "none",
                  fontSize: font.size.sm,
                  fontWeight: font.weight.semibold,
                  transition: "background .15s ease, border-color .15s ease",
                }}
              >
                {t.name}
              </a>
            );
          })}
        </nav>
      )}

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: space[4],
      }}>
        <Stat label="Sesiones (30d)" v={sessions.length} />
        <Stat label="Cohortes visibles" v={agg.buckets.length} />
        <Stat label="Suprimidas" v={agg.suppressed} sub="<5 usuarios" />
        <Stat label="k" v={agg.k} sub="anonymity" />
      </section>

      <h2 style={{
        marginTop: space[6],
        fontSize: font.size.lg,
        fontWeight: font.weight.bold,
        letterSpacing: font.tracking.tight,
      }}>
        Tendencias por día
      </h2>

      <div style={{
        marginTop: space[3],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: font.size.sm,
        }}>
          <thead>
            <tr style={{ background: cssVar.surface2 }}>
              <th style={thStyle}>Día</th>
              <th style={thStyle}>Usuarios</th>
              <th style={thStyle}>Sesiones</th>
              <th style={thStyle}>Δ coherencia</th>
              <th style={thStyle}>Δ mood</th>
            </tr>
          </thead>
          <tbody>
            {agg.buckets.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: space[6], textAlign: "center", color: cssVar.textMuted }}>
                  Sin cohortes visibles todavía. Se requieren ≥5 usuarios por día.
                </td>
              </tr>
            )}
            {agg.buckets.map((b, i) => (
              <tr key={i} style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
                <td style={tdStyle}>{b.day}</td>
                <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.uniqueUsers}</td>
                <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.sessions}</td>
                <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.avgCoherenciaDelta?.toFixed(1) ?? "—"}</td>
                <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.avgMoodDelta?.toFixed(2) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Stat({ label, v, sub }) {
  return (
    <div style={{
      padding: space[4],
      borderRadius: radius.md,
      background: cssVar.accentSoft,
      border: `1px solid ${cssVar.border}`,
    }}>
      <div style={{
        fontSize: font.size.xs,
        color: cssVar.textDim,
        textTransform: "uppercase",
        letterSpacing: font.tracking.wide,
        fontWeight: font.weight.semibold,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        margin: `${space[1]}px 0`,
        color: cssVar.text,
        fontFamily: cssVar.fontMono,
      }}>
        {v}
      </div>
      {sub && (
        <div style={{ fontSize: font.size.xs, color: cssVar.textMuted }}>{sub}</div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: `${space[3]}px ${space[4]}px`,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
};

const tdStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  color: cssVar.text,
};
