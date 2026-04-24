import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { anonymize } from "@/server/analytics";
import { redirect } from "next/navigation";
import { cssVar, radius, space, font, bioSignal } from "@/components/ui/tokens";

export const metadata = { title: "Equipo" };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

const RANGES = [
  { id: "7d",  label: "7 d",  days: 7  },
  { id: "30d", label: "30 d", days: 30 },
  { id: "90d", label: "90 d", days: 90 },
];
function pickRange(id) { return RANGES.find((r) => r.id === id) || RANGES[1]; }

function weekdayFromISO(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return WEEKDAYS[d.getUTCDay()];
}

function relativeAgo(date) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "hace segundos";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.round(hr / 24);
  return `hace ${day} d`;
}

export default async function TeamPage({ searchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/team");
  const mgr = session.memberships.find((m) => ["OWNER","ADMIN","MANAGER"].includes(m.role));
  if (!mgr) redirect("/app");
  const sp = await searchParams;
  const orm = await db();

  const [org, teams] = await Promise.all([
    orm.org.findUnique({ where: { id: mgr.orgId }, select: { name: true } }),
    orm.team.findMany({ where: { orgId: mgr.orgId } }),
  ]);

  const teamId = sp?.team || teams[0]?.id;
  const rangeId = sp?.range || "30d";
  const range = pickRange(rangeId);

  const [memberCount, sessions] = await Promise.all([
    teamId
      ? orm.membership.count({ where: { orgId: mgr.orgId, teamId } })
      : orm.membership.count({ where: { orgId: mgr.orgId } }),
    orm.neuralSession.findMany({
      where: {
        orgId: mgr.orgId,
        ...(teamId ? { teamId } : {}),
        completedAt: { gte: new Date(Date.now() - range.days * 86400_000) },
      },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const agg = anonymize(sessions, { k: 5, epsilon: 1.0 });
  const selectedTeam = teams.find((t) => t.id === teamId);
  const lastSync = sessions[0]?.completedAt ?? null;
  const lastSyncLabel = relativeAgo(lastSync);

  const totalSessions = agg.buckets.reduce((n, b) => n + b.sessions, 0);
  const avgCoh = agg.buckets.length
    ? +(agg.buckets.reduce((n, b) => n + (b.avgCoherenciaDelta ?? 0), 0) / agg.buckets.length).toFixed(1)
    : null;
  const avgMood = agg.buckets.length
    ? +(agg.buckets.reduce((n, b) => n + (b.avgMoodDelta ?? 0), 0) / agg.buckets.length).toFixed(2)
    : null;
  const sparkSeries = agg.buckets.map((b) => b.sessions);
  const highActivityPct = agg.buckets.length
    ? Math.round((agg.buckets.filter((b) => b.uniqueUsers >= 20).length / agg.buckets.length) * 100)
    : 0;

  const rangeHref = (id) => {
    const params = new URLSearchParams();
    if (teamId) params.set("team", teamId);
    if (id !== "30d") params.set("range", id);
    const qs = params.toString();
    return `/team${qs ? `?${qs}` : ""}`;
  };
  const teamHref = (id) => {
    const params = new URLSearchParams();
    params.set("team", id);
    if (rangeId !== "30d") params.set("range", rangeId);
    return `/team?${params.toString()}`;
  };

  return (
    <main style={{
      padding: `${space[6]}px ${space[4]}px`,
      maxWidth: 1200,
      marginInline: "auto",
      color: cssVar.text,
      background: cssVar.bg,
      minHeight: "100dvh",
      fontFamily: cssVar.fontSans,
    }}>
      <div className="bi-team-context" role="group" aria-label="Contexto">
        <div className="bi-team-context-left">
          <span className="bi-team-org">
            {org?.name || "Organización"} · {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
          </span>
          {lastSyncLabel && (
            <>
              <span className="bi-team-context-sep" aria-hidden>·</span>
              <span className="bi-team-fresh" data-state="fresh">
                <span className="dot" aria-hidden />
                Sincronizado {lastSyncLabel}
              </span>
            </>
          )}
        </div>
        <div className="bi-team-context-right">
          <a href="/trust#trust-principles" className="bi-team-context-link">
            Cómo se agregan los datos →
          </a>
        </div>
      </div>

      <header style={{ marginBottom: space[5] }}>
        <div style={{
          fontFamily: cssVar.fontMono,
          fontSize: font.size.xs,
          color: bioSignal.phosphorCyanInk,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          fontWeight: font.weight.bold,
          marginBlockEnd: space[2],
        }}>
          PANEL · DATOS AGREGADOS
        </div>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(28px, 3.4vw, 40px)",
          fontWeight: font.weight.black,
          letterSpacing: "-0.025em",
          lineHeight: 1.08,
        }}>
          {selectedTeam ? selectedTeam.name : "Panel de equipo"}
        </h1>
        <p style={{
          color: cssVar.textDim,
          fontSize: font.size.sm,
          marginTop: space[2],
          lineHeight: 1.55,
          maxWidth: 680,
        }}>
          Ventana rodante de <strong style={{ color: cssVar.text, fontFamily: cssVar.fontMono }}>{range.label}</strong>.
          Datos agregados con <strong style={{ color: cssVar.text, fontFamily: cssVar.fontMono }}>k-anonymity ≥ 5</strong> y ruido diferencial (<strong style={{ color: cssVar.text, fontFamily: cssVar.fontMono }}>ε = 1.0</strong>).
          Ningún individuo es identificable.
        </p>
      </header>

      {teams.length > 0 && (
        <div className="bi-team-toolbar">
          <nav aria-label="Filtrar por equipo" className="bi-team-tabs">
            {teams.map((t) => {
              const active = t.id === teamId;
              return (
                <a
                  key={t.id}
                  href={teamHref(t.id)}
                  aria-current={active ? "page" : undefined}
                  className="bi-team-tab"
                  data-active={active ? "true" : undefined}
                >
                  {t.name}
                </a>
              );
            })}
          </nav>
          <div className="bi-team-range" role="group" aria-label="Rango de tiempo">
            {RANGES.map((r) => {
              const active = r.id === rangeId;
              return (
                <a
                  key={r.id}
                  href={rangeHref(r.id)}
                  aria-current={active ? "page" : undefined}
                  className="bi-team-range-btn"
                  data-active={active ? "true" : undefined}
                >
                  {r.label}
                </a>
              );
            })}
          </div>
        </div>
      )}

      <section
        aria-label="Resumen"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: space[3],
          marginBlockEnd: space[5],
        }}
      >
        <Stat
          label={`Sesiones · ${range.label}`}
          v={totalSessions}
          tone="primary"
          sub="total observado"
          spark={sparkSeries}
        />
        <Stat
          label="Cohortes visibles"
          v={agg.buckets.length}
          sub={`de ${agg.buckets.length + agg.suppressed} posibles`}
        />
        <Stat
          label="Δ coherencia · media"
          v={avgCoh ?? "—"}
          sub="puntos · vs. baseline"
          delta={avgCoh}
        />
        <Stat
          label="Δ mood · media"
          v={avgMood ?? "—"}
          sub="0..1 · vs. baseline"
          delta={avgMood}
        />
      </section>

      <header style={{
        marginTop: space[6],
        marginBottom: space[3],
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: space[3],
        flexWrap: "wrap",
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: font.size.lg,
            fontWeight: font.weight.bold,
            letterSpacing: "-0.015em",
          }}>
            Tendencias por día
          </h2>
          <span style={{
            fontFamily: cssVar.fontMono,
            fontSize: font.size.xs,
            color: cssVar.textMuted,
            letterSpacing: "0.08em",
            marginInlineStart: 4,
          }}>
            {agg.buckets.length} {agg.buckets.length === 1 ? "día visible" : "días visibles"}
            {agg.suppressed > 0 ? ` · ${agg.suppressed} suprimido${agg.suppressed === 1 ? "" : "s"}` : ""}
          </span>
        </div>
        <div className="bi-team-actions" role="group" aria-label="Acciones">
          <a
            href={`/api/team/export?team=${teamId ?? ""}&range=${rangeId}`}
            className="bi-team-action"
            data-kind="ghost"
          >
            <IconDownload /> Exportar CSV
          </a>
          <a href="#" className="bi-team-action" data-kind="ghost" aria-disabled="true" title="Próximamente">
            <IconLink /> Compartir
          </a>
        </div>
      </header>

      <div className="bi-team-table-wrap" style={{
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
      }}>
        <table className="bi-team-table" style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: font.size.sm,
        }}>
          <thead>
            <tr style={{ background: cssVar.surface2 }}>
              <th style={thStyle}>Día</th>
              <th style={{ ...thStyle, textAlign: "end" }}>Usuarios</th>
              <th style={{ ...thStyle, textAlign: "end" }}>Sesiones</th>
              <th style={{ ...thStyle, textAlign: "end" }}>Δ coherencia</th>
              <th style={{ ...thStyle, textAlign: "end" }}>Δ mood</th>
            </tr>
          </thead>
          <tbody>
            {agg.buckets.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: `${space[7]}px ${space[4]}px`, textAlign: "center" }}>
                  <div style={{
                    fontFamily: cssVar.fontMono,
                    fontSize: font.size.xs,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: cssVar.textMuted,
                    marginBlockEnd: space[2],
                  }}>SIN COHORTES VISIBLES</div>
                  <p style={{
                    margin: 0,
                    color: cssVar.textDim,
                    fontSize: font.size.sm,
                    lineHeight: 1.55,
                    maxWidth: 440,
                    marginInline: "auto",
                  }}>
                    Se requieren al menos <strong style={{ color: cssVar.text, fontFamily: cssVar.fontMono }}>5 usuarios</strong> activos por día para mostrar la cohorte sin romper k-anonymity.
                  </p>
                </td>
              </tr>
            )}
            {agg.buckets.map((b, i) => (
              <tr key={i} className="bi-team-row">
                <td style={tdStyle}>
                  <span>{b.day}</span>
                  <span className="bi-team-weekday" aria-hidden> · {weekdayFromISO(b.day)}</span>
                </td>
                <td style={{ ...tdStyle, fontFamily: cssVar.fontMono, textAlign: "end", fontVariantNumeric: "tabular-nums" }}>{b.uniqueUsers}</td>
                <td style={{ ...tdStyle, fontFamily: cssVar.fontMono, textAlign: "end", fontVariantNumeric: "tabular-nums" }}>{b.sessions}</td>
                <td style={{ ...tdStyle, textAlign: "end" }}>
                  <DeltaCell v={b.avgCoherenciaDelta} digits={1} />
                </td>
                <td style={{ ...tdStyle, textAlign: "end" }}>
                  <DeltaCell v={b.avgMoodDelta} digits={2} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {agg.buckets.length > 0 && (
        <aside className="bi-team-insight" aria-label="Insight">
          <div className="bi-team-insight-kicker">INSIGHT · {range.label}</div>
          <p className="bi-team-insight-body">
            <strong>{selectedTeam?.name || "Equipo"}</strong> registró{" "}
            <strong style={{ fontFamily: cssVar.fontMono }}>{totalSessions}</strong> sesiones en {range.label}
            {avgCoh != null && (
              <>, con Δ coherencia media de{" "}
                <strong style={{ fontFamily: cssVar.fontMono, color: avgCoh >= 0 ? bioSignal.phosphorCyan : cssVar.textDim }}>
                  {avgCoh >= 0 ? "+" : ""}{avgCoh}
                </strong>{" "}pts
              </>
            )}
            . Los días con ≥ 20 usuarios activos concentran el{" "}
            <strong>{highActivityPct}%</strong> de la actividad —
            cadencia sugerida: sesión grupal semanal en el pico.
          </p>
        </aside>
      )}
    </main>
  );
}

function Stat({ label, v, sub, tone = "default", mono = false, spark, delta }) {
  const isPrimary = tone === "primary";
  const isMuted = tone === "muted";
  const hasDelta = typeof delta === "number";
  const deltaPositive = hasDelta && delta >= 0;
  return (
    <div style={{
      padding: `${space[4]}px ${space[4]}px ${space[3]}px`,
      borderRadius: radius.md,
      background: isPrimary
        ? `color-mix(in srgb, ${bioSignal.phosphorCyan} 6%, ${cssVar.surface})`
        : cssVar.surface,
      border: `1px solid ${isPrimary
        ? `color-mix(in srgb, ${bioSignal.phosphorCyan} 35%, ${cssVar.border})`
        : cssVar.border}`,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      {isPrimary && (
        <span aria-hidden style={{
          position: "absolute",
          insetInlineStart: 0,
          insetBlockStart: 0,
          blockSize: 2,
          inlineSize: "36%",
          background: `linear-gradient(90deg, ${bioSignal.phosphorCyan} 0%, transparent 100%)`,
          opacity: 0.7,
        }} />
      )}
      <div style={{
        fontFamily: cssVar.fontMono,
        fontSize: 10.5,
        color: isPrimary ? bioSignal.phosphorCyan : cssVar.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        fontWeight: font.weight.bold,
      }}>
        {label}
      </div>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: space[2],
      }}>
        <span style={{
          fontSize: mono ? font.size.xl : font.size["2xl"],
          fontWeight: font.weight.black,
          margin: `${space[1]}px 0 0`,
          color: isMuted ? cssVar.textDim : cssVar.text,
          fontFamily: cssVar.fontMono,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}>
          {hasDelta && deltaPositive && typeof v === "number" ? `+${v}` : v}
        </span>
        {spark && spark.length > 1 && <Sparkline series={spark} />}
        {hasDelta && (
          <span className="bi-team-stat-delta" data-sign={deltaPositive ? "pos" : "neg"}>
            {deltaPositive ? "▲" : "▼"}
          </span>
        )}
      </div>
      {sub && (
        <div style={{
          fontSize: font.size.xs,
          color: cssVar.textMuted,
          lineHeight: 1.4,
        }}>{sub}</div>
      )}
    </div>
  );
}

function Sparkline({ series }) {
  const W = 80, H = 24, P = 2;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(1, max - min);
  const step = series.length > 1 ? (W - P * 2) / (series.length - 1) : 0;
  const pts = series.map((v, i) => {
    const x = P + i * step;
    const y = P + (H - P * 2) * (1 - (v - min) / span);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const lastX = P + (series.length - 1) * step;
  const lastY = P + (H - P * 2) * (1 - (series[series.length - 1] - min) / span);
  return (
    <svg className="bi-team-spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
      <polyline points={pts} fill="none" stroke={bioSignal.phosphorCyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2" fill={bioSignal.phosphorCyan} />
    </svg>
  );
}

function DeltaCell({ v, digits }) {
  if (v == null) return <span style={{ color: cssVar.textMuted, fontFamily: cssVar.fontMono }}>—</span>;
  const positive = v >= 0;
  return (
    <span className="bi-team-delta" data-sign={positive ? "pos" : "neg"}>
      <span className="arrow" aria-hidden>{positive ? "▲" : "▼"}</span>
      <span className="num">{positive ? "+" : ""}{v.toFixed(digits)}</span>
    </span>
  );
}

function IconDownload() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

const thStyle = {
  textAlign: "start",
  padding: `${space[3]}px ${space[4]}px`,
  fontFamily: cssVar.fontMono,
  fontSize: 10.5,
  color: cssVar.textMuted,
  fontWeight: font.weight.bold,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  borderBlockEnd: `1px solid ${cssVar.border}`,
};

const tdStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  color: cssVar.text,
};
