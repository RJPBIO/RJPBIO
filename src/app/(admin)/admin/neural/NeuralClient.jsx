"use client";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { KPITile } from "@/components/admin/KPITile";
import { cssVar, space, font, radius } from "@/components/ui/tokens";

const VERDICT_TONE = {
  mature: { variant: "success", label: "Maduro" },
  developing: { variant: "soft", label: "En desarrollo" },
  early: { variant: "warn", label: "Temprano" },
  "at-risk": { variant: "danger", label: "En riesgo" },
};

const ACTION_VARIANT = { ok: "success", info: "info", warn: "warn", danger: "danger" };

export default function NeuralClient({ health }) {
  if (!health) {
    return <Alert kind="warn">No fue posible cargar la salud del motor.</Alert>;
  }
  if (health.suppressed) {
    return (
      <Alert kind="info">
        <strong>Datos suprimidos por privacidad.</strong>{" "}
        {health.reason || `Necesitas ≥5 miembros activos para reportar agregados.`}
      </Alert>
    );
  }

  const v = VERDICT_TONE[health.verdict] || VERDICT_TONE.developing;
  return (
    <>
      <section style={{ marginBlockStart: space[3], display: "flex", gap: space[2], flexWrap: "wrap", alignItems: "center" }}>
        <Badge variant={v.variant} size="md">{v.label}</Badge>
        <span style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
          {health.activeMembers} miembro(s) activo(s) · {health.activeIn30d} en últimos 30 días · {health.totalSessions.toLocaleString()} sesiones acumuladas
        </span>
      </section>

      {/* KPI tiles row 1: maturity */}
      <section style={{
        marginBlockStart: space[5],
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: space[3],
      }}>
        <KPITile
          label="Cold-start"
          value={health.maturity.coldStart}
          sub={`${(health.maturityPct.coldStart * 100).toFixed(0)}% del org`}
          tone={health.maturityPct.coldStart >= 0.5 ? "warn" : "neutral"}
        />
        <KPITile
          label="Learning"
          value={health.maturity.learning}
          sub={`${(health.maturityPct.learning * 100).toFixed(0)}% del org`}
          tone="signal"
        />
        <KPITile
          label="Personalized"
          value={health.maturity.personalized}
          sub={`${(health.maturityPct.personalized * 100).toFixed(0)}% del org`}
          tone={health.maturityPct.personalized >= 0.5 ? "success" : "neutral"}
          glow={health.maturityPct.personalized >= 0.5}
        />
        <KPITile
          label="Avg sesiones / user"
          value={health.avgSessionsPerUser}
          sub="acumulado anual"
          tone="signal"
        />
      </section>

      {/* KPI tiles row 2: staleness */}
      <h2 style={h2Style}>Staleness — quién necesita recalibrar</h2>
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: space[3],
      }}>
        <KPITile label="Fresh (≤7d)" value={health.staleness.fresh} tone="success" />
        <KPITile label="Active (8-14d)" value={health.staleness.active} tone="signal" />
        <KPITile label="Cooling (15-30d)" value={health.staleness.cooling} tone={health.staleness.cooling > 0 ? "warn" : "neutral"} />
        <KPITile label="Stale (31-60d)" value={health.staleness.stale} tone={health.staleness.stale > 0 ? "warn" : "neutral"} glow={health.staleness.stale > 0} />
        <KPITile label="Abandoned (60+d)" value={health.staleness.abandoned} tone={health.staleness.abandoned > 0 ? "danger" : "neutral"} glow={health.staleness.abandoned > 0} />
      </section>

      <Alert kind={health.recalibrationPct >= 0.3 ? "warn" : "info"} style={{ marginBlockStart: space[3] }}>
        <strong>{health.recalibrationNeeded}</strong> de {health.activeMembers} miembros ({(health.recalibrationPct * 100).toFixed(0)}%) deberían recalibrar su motor con una sesión de re-baseline.
      </Alert>

      {/* Top protocols */}
      {health.topProtocols.length > 0 && (
        <>
          <h2 style={h2Style}>Top protocolos del org</h2>
          <ol style={{
            listStyle: "none", padding: 0, margin: 0,
            display: "grid", gap: space[2],
          }}>
            {health.topProtocols.map((p, i) => (
              <li key={p.protocol} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: space[3],
                padding: space[3],
                background: cssVar.surface,
                border: `1px solid ${cssVar.border}`,
                borderRadius: radius.sm,
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: space[2] }}>
                  <span style={{
                    width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: cssVar.accentSoft,
                    color: cssVar.accent,
                    borderRadius: radius.full,
                    fontSize: font.size.xs,
                    fontWeight: font.weight.bold,
                    fontFamily: cssVar.fontMono,
                  }}>{i + 1}</span>
                  <span style={{ fontWeight: font.weight.semibold }}>{p.protocol}</span>
                </span>
                <span style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
                  {p.count} sesiones · {(p.share * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      {/* Sprint 46 — Effectiveness por protocolo */}
      {Array.isArray(health.protocolEffectiveness) && health.protocolEffectiveness.length > 0 && (
        <>
          <h2 style={h2Style}>Effectiveness por protocolo</h2>
          <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: -8, marginBlockEnd: space[3] }}>
            Mood delta promedio (post − pre) cuando ambos están reportados. Protocolos con &lt;5 usuarios distintos quedan suprimidos por privacidad.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
            {health.protocolEffectiveness.map((p) => (
              <ProtocolEffectivenessRow key={p.protocol} item={p} />
            ))}
          </ul>
        </>
      )}

      {/* Action items */}
      <h2 style={h2Style}>Acciones recomendadas</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
        {health.actions.map((a, i) => (
          <li key={i} style={{
            padding: space[3],
            background: cssVar.surface,
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.sm,
            display: "flex", gap: space[3], alignItems: "flex-start",
          }}>
            <Badge variant={ACTION_VARIANT[a.kind] || "soft"} size="sm">{a.kind}</Badge>
            <div>
              <div style={{ fontWeight: font.weight.semibold, color: cssVar.text }}>{a.title}</div>
              <div style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: 2 }}>{a.detail}</div>
            </div>
          </li>
        ))}
      </ul>

      <p style={{ marginBlockStart: space[5], fontSize: font.size.xs, color: cssVar.textMuted }}>
        Snapshot del {new Date(health.now).toLocaleString()}. La data se calcula al cargar la página
        (no es streaming). El motor adaptativo opera client-side per-user; aquí ves el agregado anonimizado.
      </p>
    </>
  );
}

function ProtocolEffectivenessRow({ item }) {
  if (item.suppressed) {
    return (
      <li style={{
        padding: space[3],
        background: cssVar.surface,
        border: `1px dashed ${cssVar.border}`,
        borderRadius: radius.sm,
        display: "flex", gap: space[3], alignItems: "center",
        opacity: 0.65,
      }}>
        <span style={{ fontWeight: font.weight.semibold, flex: 1 }}>{item.protocol}</span>
        <span style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
          {item.count} sesión(es) · {item.distinctUsers} user(s) · suprimido (k&lt;5)
        </span>
      </li>
    );
  }
  const tone = (item.moodDelta ?? 0) > 0.5 ? "success"
    : (item.moodDelta ?? 0) > 0 ? "signal"
    : "warn";
  const toneColor = { success: "#10B981", signal: "#22D3EE", warn: "#D97706" }[tone];
  const deltaSign = (item.moodDelta ?? 0) >= 0 ? "+" : "";
  return (
    <li style={{
      padding: space[3],
      background: cssVar.surface,
      border: `1px solid ${cssVar.border}`,
      borderRadius: radius.sm,
      display: "grid",
      gridTemplateColumns: "1fr auto auto auto",
      gap: space[3],
      alignItems: "center",
    }}>
      <span style={{ fontWeight: font.weight.semibold, color: cssVar.text }}>
        {item.protocol}
      </span>
      <span style={{
        fontFamily: cssVar.fontMono,
        fontSize: font.size.sm,
        color: cssVar.textMuted,
        whiteSpace: "nowrap",
      }}>
        {item.count} sesiones · {item.distinctUsers} users
      </span>
      {typeof item.moodDelta === "number" ? (
        <span style={{
          fontFamily: cssVar.fontMono,
          fontWeight: font.weight.bold,
          color: toneColor,
          fontSize: font.size.md,
          whiteSpace: "nowrap",
        }}>
          {deltaSign}{item.moodDelta} mood
        </span>
      ) : (
        <span style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>—</span>
      )}
      {typeof item.hitRate === "number" && (
        <span style={{
          fontFamily: cssVar.fontMono,
          fontSize: font.size.sm,
          color: cssVar.textMuted,
          whiteSpace: "nowrap",
        }}>
          hit {(item.hitRate * 100).toFixed(0)}% (n={item.moodSampleSize})
        </span>
      )}
    </li>
  );
}

const h2Style = {
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  marginBlockStart: 32,
  marginBlockEnd: 12,
  color: "var(--bi-text)",
};
