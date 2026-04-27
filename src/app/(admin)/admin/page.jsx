import Link from "next/link";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { anonymize } from "@/server/analytics";
import { computeRetornoSaludable, compareRetornoSaludable } from "@/lib/retornoSaludable";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const PERIODS = {
  "7":  { days: 7,  label: "7 días"  },
  "30": { days: 30, label: "30 días" },
  "90": { days: 90, label: "90 días" },
};

export default async function AdminHome({ searchParams }) {
  const session = await auth();
  // Si el user es OWNER/ADMIN de varias orgs (típicamente su personal-org +
  // una B2B), preferimos la B2B — el admin existe para gestión de equipo,
  // no para wellness individual (que vive en /app, /account).
  const adminMems = (session?.memberships || []).filter((m) => ["OWNER", "ADMIN"].includes(m.role));
  const orgId = adminMems.find((m) => m.org && !m.org.personal)?.orgId
             ?? adminMems[0]?.orgId
             ?? session?.memberships?.[0]?.orgId;
  if (!orgId) return null;
  const sp = (await searchParams) || {};
  const periodKey = typeof sp.period === "string" && PERIODS[sp.period] ? sp.period : "30";
  const days = PERIODS[periodKey].days;

  const orm = await db();
  const since = new Date(Date.now() - days * 86400_000);
  const prevSince = new Date(Date.now() - days * 2 * 86400_000);
  // Las sesiones del PWA viven en la personal-org del usuario (sync/outbox
  // route las crea ahí). Para que el admin del B2B vea agregados de su
  // equipo, queremos por userId ∈ memberships(orgId) — no por orgId.
  // K-anonymity (k=5) sigue cubriendo: solo se exponen buckets ≥5 únicos.
  const [org, memberships] = await Promise.all([
    orm.org.findUnique({ where: { id: orgId } }),
    orm.membership.findMany({
      where: { orgId, deactivatedAt: null },
      select: { userId: true },
    }),
  ]);
  const memberIds = memberships.map((m) => m.userId);
  const members = memberships.length;
  // Sesiones del periodo actual + anterior para Retorno Saludable.
  // El KPI "Retorno Saludable" requiere userId+completedAt para emparejar
  // sesiones consecutivas del mismo usuario. K-anonymity (k=5) en módulo.
  const [sessions, prevSessionsRaw] = memberIds.length === 0
    ? [[], []]
    : await Promise.all([
        orm.neuralSession.findMany({
          where: { userId: { in: memberIds }, completedAt: { gte: since } },
          select: { id: true, userId: true, teamId: true, completedAt: true, coherenciaDelta: true, moodPre: true, moodPost: true, durationSec: true, protocolId: true, stationId: true, slot: true },
        }),
        orm.neuralSession.findMany({
          where: { userId: { in: memberIds }, completedAt: { gte: prevSince, lt: since } },
          select: { userId: true, completedAt: true },
        }),
      ]);
  const prevSessions = prevSessionsRaw.length;
  const agg = anonymize(sessions, { k: 5 });
  const delta = prevSessions === 0 ? null : ((sessions.length - prevSessions) / prevSessions) * 100;
  // ─── Retorno Saludable (anti-engagement KPI) ────────────────
  // Mide % de sesiones donde el operador NO necesitó volver al protocolo
  // en las siguientes 6h. K-anonymity ≥5 usuarios distintos con ≥2 sesiones.
  // Filosofía: la app desapareciendo de la vida del usuario = la app funcionó.
  const retorno = compareRetornoSaludable(sessions, prevSessionsRaw);

  return (
    <>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: space[3],
      }}>
        <div>
          <h1 style={{
            fontSize: font.size["2xl"],
            fontWeight: font.weight.black,
            letterSpacing: font.tracking.tight,
            margin: 0,
            color: cssVar.text,
          }}>
            {org?.name}
          </h1>
          <p style={{
            color: cssVar.textMuted,
            marginTop: space[1],
            fontSize: font.size.sm,
          }}>
            Plan: <strong style={{ color: cssVar.text }}>{org?.plan}</strong> · Región: {org?.region || "—"}
          </p>
        </div>
        <nav
          aria-label="Periodo"
          style={{
            display: "flex",
            gap: space[0.5],
            background: cssVar.surface2,
            padding: space[0.5],
            borderRadius: radius.full,
            border: `1px solid ${cssVar.border}`,
          }}
        >
          {Object.entries(PERIODS).map(([k, p]) => {
            const active = k === periodKey;
            return (
              <a
                key={k}
                href={`/admin?period=${k}`}
                aria-current={active ? "page" : undefined}
                style={{
                  padding: `${space[1.5]}px ${space[3]}px`,
                  borderRadius: radius.full,
                  fontSize: font.size.xs,
                  fontWeight: font.weight.bold,
                  textDecoration: "none",
                  color: active ? cssVar.accentInk : cssVar.textDim,
                  background: active ? cssVar.accent : "transparent",
                  transition: "background .15s ease, color .15s ease",
                }}
              >
                {p.label}
              </a>
            );
          })}
        </nav>
      </div>

      <section style={grid}>
        <Card title="Miembros" value={members} sub={`de ${org?.seats || 0} asientos`} />
        <Card
          title={`Sesiones (${days}d)`}
          value={sessions.length}
          sub={delta == null ? `${agg.buckets.length} cohortes` : `${delta > 0 ? "+" : ""}${delta.toFixed(0)}% vs periodo anterior`}
          tone={delta == null ? null : delta >= 0 ? "up" : "down"}
        />
        <Card title="Cohortes suprimidas" value={agg.suppressed} sub="k-anonymity k=5" />
        <Card
          title="Engagement"
          value={members > 0 ? (sessions.length / members).toFixed(1) : "0"}
          sub="sesiones/miembro"
        />
      </section>

      {/* ─── Retorno Saludable: KPI de autonomía, no de engagement ─── */}
      <section style={{ ...grid, marginTop: space[3] }}>
        <RetornoCard data={retorno} />
      </section>

      <h2 style={{
        fontSize: font.size.lg,
        fontWeight: font.weight.bold,
        letterSpacing: font.tracking.tight,
        marginTop: space[6],
      }}>
        Actividad por día (cohortes ≥5)
      </h2>

      {agg.buckets.length === 0 ? (
        <div style={{
          marginTop: space[3],
          padding: space[5],
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
        }}>
          <p style={{
            color: cssVar.text,
            fontSize: font.size.sm,
            fontWeight: font.weight.semibold,
            margin: 0,
          }}>
            Sin datos agregados para mostrar.
          </p>
          <p style={{
            color: cssVar.textMuted,
            fontSize: font.size.sm,
            marginTop: space[2],
            marginBottom: 0,
            lineHeight: 1.5,
          }}>
            Bio-Ignición protege la privacidad con k-anonymity (k≥5): cada bucket día/cohorte requiere 5+ miembros activos para mostrarse.{" "}
            {members < 5
              ? `Tu org tiene ${members} miembro${members === 1 ? "" : "s"} — invita ${5 - members} más para activar agregados.`
              : sessions.length === 0
                ? "Aún no hay actividad de tu equipo en este periodo."
                : "Prueba un rango más amplio o pide a tu equipo más actividad regular."}
          </p>
          {members < 5 && (
            <Link
              href="/admin/members"
              style={{
                display: "inline-block",
                marginTop: space[3],
                color: cssVar.accent,
                fontSize: font.size.sm,
                fontWeight: font.weight.semibold,
                textDecoration: "none",
              }}
            >
              Invitar miembros →
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          marginTop: space[3],
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          overflow: "hidden",
        }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: cssVar.surface2 }}>
                <th style={thStyle}>Día</th>
                <th style={thStyle}>Equipo</th>
                <th style={thStyle}>Usuarios</th>
                <th style={thStyle}>Sesiones</th>
                <th style={thStyle}>Δ Coherencia</th>
                <th style={thStyle}>Δ Mood</th>
              </tr>
            </thead>
            <tbody>
              {agg.buckets.slice(-14).map((b, i) => (
                <tr key={i} style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
                  <td style={tdStyle}>{b.day}</td>
                  <td style={{ ...tdStyle, color: cssVar.textMuted }}>{b.teamId || "org"}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.uniqueUsers}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.sessions}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.avgCoherenciaDelta?.toFixed(1) ?? "—"}</td>
                  <td style={{ ...tdStyle, fontFamily: cssVar.fontMono }}>{b.avgMoodDelta?.toFixed(2) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function RetornoCard({ data }) {
  // Card específico para el KPI Retorno Saludable. Estado insufficient
  // muestra una explicación pedagógica — el admin tiene que entender
  // POR QUÉ no hay número, no solo verlo en blanco.
  const { current, deltaPp } = data;
  if (current.insufficient) {
    return (
      <div style={{
        padding: space[4],
        borderRadius: radius.md,
        background: cssVar.accentSoft,
        border: `1px solid ${cssVar.border}`,
        gridColumn: "1 / -1",
      }}>
        <div style={{
          fontSize: font.size.xs,
          color: cssVar.textDim,
          textTransform: "uppercase",
          letterSpacing: font.tracking.wide,
          fontWeight: font.weight.semibold,
        }}>
          Retorno saludable
        </div>
        <div style={{
          fontSize: font.size["2xl"],
          fontWeight: font.weight.black,
          margin: `${space[1]}px 0`,
          color: cssVar.text,
          fontFamily: cssVar.fontMono,
        }}>
          —
        </div>
        <div style={{ fontSize: font.size.xs, color: cssVar.textMuted, lineHeight: 1.5 }}>
          {current.reason === "k_anonymity"
            ? `Necesitamos ≥5 usuarios con 2+ sesiones para mostrar este KPI con privacidad. Actuales: ${current.uniqueUsers}.`
            : "Aún sin sesiones consecutivas evaluables en este periodo."}
        </div>
      </div>
    );
  }
  const tone = deltaPp == null ? null : deltaPp >= 0 ? "up" : "down";
  const subColor = tone === "up" ? cssVar.accent : tone === "down" ? cssVar.warn : cssVar.textMuted;
  const trend = deltaPp == null
    ? `${current.evaluable} sesiones · ${current.uniqueUsers} operadores`
    : `${deltaPp > 0 ? "+" : ""}${deltaPp.toFixed(1)} pp vs periodo anterior`;
  return (
    <div style={{
      padding: space[4],
      borderRadius: radius.md,
      background: cssVar.accentSoft,
      border: `1px solid ${cssVar.border}`,
      gridColumn: "1 / -1",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: space[3] }}>
        <div style={{ minInlineSize: 0, flex: 1 }}>
          <div style={{
            fontSize: font.size.xs,
            color: cssVar.textDim,
            textTransform: "uppercase",
            letterSpacing: font.tracking.wide,
            fontWeight: font.weight.semibold,
          }}>
            Retorno saludable
          </div>
          <div style={{
            fontSize: font.size["2xl"],
            fontWeight: font.weight.black,
            margin: `${space[1]}px 0`,
            color: cssVar.text,
            fontFamily: cssVar.fontMono,
          }}>
            {current.healthyReturnRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: font.size.xs, color: subColor }}>
            {trend}
          </div>
        </div>
        <div style={{
          fontSize: font.size.xs,
          color: cssVar.textMuted,
          lineHeight: 1.5,
          maxInlineSize: 360,
        }}>
          % de sesiones donde el operador <strong style={{ color: cssVar.text }}>no necesitó volver</strong> en {current.gapHours}h.
          Más alto = más autonomía, menos dependencia. Sobre {current.evaluable} pares evaluables · k≥5.
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, sub, tone }) {
  const subColor = tone === "up" ? cssVar.accent : tone === "down" ? cssVar.warn : cssVar.textMuted;
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
        {title}
      </div>
      <div style={{
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        margin: `${space[1]}px 0`,
        color: cssVar.text,
        fontFamily: cssVar.fontMono,
      }}>
        {value}
      </div>
      <div style={{ fontSize: font.size.xs, color: subColor }}>{sub}</div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: space[3],
  marginTop: space[5],
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: font.size.sm,
};

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
