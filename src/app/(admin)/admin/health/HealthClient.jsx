"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/admin/PageHeader";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import {
  summarizeService, formatLatency, formatCounter, overallSystemHealth,
} from "@/lib/health-metrics";

const TONE_VARIANT = {
  success: "success",
  warn: "warn",
  danger: "danger",
  soft: "soft",
  neutral: "neutral",
};

function StatusCard({ name, probe, description }) {
  const s = summarizeService(probe);
  return (
    <div style={{
      padding: space[4],
      background: cssVar.surface,
      border: `1px solid ${cssVar.border}`,
      borderRadius: radius.md,
      borderLeft: `3px solid ${
        s.tone === "success" ? "#10B981" :
        s.tone === "warn" ? "#F59E0B" :
        s.tone === "danger" ? "#EF4444" : "#94A3B8"
      }`,
    }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: space[2] }}>
        <strong style={{ color: cssVar.text }}>{name}</strong>
        <Badge variant={TONE_VARIANT[s.tone] || "soft"} size="sm">{s.label}</Badge>
      </header>
      <p style={{ margin: `${space[1]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.xs, fontFamily: cssVar.fontMono }}>
        {s.detail}
      </p>
      {description && (
        <p style={{ margin: `${space[1]}px 0 0`, color: cssVar.textDim, fontSize: font.size.xs }}>
          {description}
        </p>
      )}
    </div>
  );
}

function MetricCard({ title, big, sub, tone = "soft" }) {
  return (
    <div style={{
      padding: space[4],
      background: cssVar.surface,
      border: `1px solid ${cssVar.border}`,
      borderRadius: radius.md,
    }}>
      <p style={{
        margin: 0,
        color: cssVar.textDim,
        fontSize: font.size.xs,
        textTransform: "uppercase",
        letterSpacing: font.tracking.wide,
        fontWeight: font.weight.semibold,
      }}>
        {title}
      </p>
      <p style={{
        margin: `${space[2]}px 0 0`,
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        color: tone === "danger" ? "var(--bi-danger)"
          : tone === "warn" ? "#F59E0B"
          : cssVar.text,
        fontFamily: cssVar.fontMono,
        lineHeight: 1,
      }}>
        {big}
      </p>
      {sub && (
        <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.xs }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function HourBars({ buckets }) {
  if (!buckets?.length) return null;
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 60, padding: `${space[2]}px 0` }}>
      {buckets.map((b, i) => {
        const h = (b.count / max) * 100;
        return (
          <div
            key={i}
            title={`${new Date(b.hour).toLocaleString()}: ${b.count}`}
            style={{
              flex: 1,
              height: `${Math.max(2, h)}%`,
              background: b.count > 0 ? `var(--bi-accent)` : cssVar.border,
              borderRadius: 1,
              opacity: b.count > 0 ? 0.85 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

export default function HealthClient({ initial }) {
  const [snap, setSnap] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/v1/health/metrics", { cache: "no-store" });
      if (r.ok) setSnap(await r.json());
    } catch { /* no-op */ }
    finally { setLoading(false); }
  }

  // Auto-refresh cada 30s.
  useEffect(() => {
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
  }, []);

  const services = [snap.services.db, snap.services.redis, snap.services.postmark];
  const overall = overallSystemHealth(services);
  const wRate = snap.metrics.webhook?.rate;
  const aRate = snap.metrics.auth?.successRate?.rate;

  return (
    <article>
      <PageHeader
        eyebrow="Plataforma · observability"
        italic="Plataforma"
        title="en señal."
        subtitle={`Auto-refresh cada 30s · snapshot ${new Date(snap.snapshotAt).toLocaleTimeString()}`}
        actions={
          <>
            <Badge variant={TONE_VARIANT[overall.tone]} size="sm">{overall.label}</Badge>
            <Button variant="ghost" size="sm" onClick={refresh} loading={loading}>
              Refresh
            </Button>
          </>
        }
      />

      <Alert kind="info" style={{ marginBlockEnd: space[5] }}>
        Platform admin dashboard. Métricas agregadas de TODOS los orgs.
        Para per-org metrics, ver <a href="/admin/audit" style={{ color: cssVar.accent }}>/admin/audit</a> o
        <a href="/admin/compliance" style={{ color: cssVar.accent, marginInlineStart: 4 }}>/admin/compliance</a>.
      </Alert>

      {/* Services */}
      <h2 style={{ margin: `${space[5]}px 0 ${space[3]}px`, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>
        Servicios
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: space[3] }}>
        <StatusCard name="Database" probe={snap.services.db} description="Postgres via Prisma; SELECT 1 probe." />
        <StatusCard name="Redis" probe={snap.services.redis} description={snap.services.redis?.detail === "not_configured" ? "REDIS_URL no configurado — rate limit fallback memory." : "Upstash; PING probe."} />
        <StatusCard name="Postmark" probe={snap.services.postmark} description={snap.services.postmark?.detail === "not_configured" ? "Token no configurado — emails skipped." : "Token configurado."} />
      </div>

      {/* Webhooks */}
      <h2 style={{ margin: `${space[5]}px 0 ${space[3]}px`, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>
        Webhooks (24h)
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: space[3] }}>
        <MetricCard
          title="Total deliveries"
          big={formatCounter(snap.metrics.webhook?.total || 0)}
          sub={`${snap.metrics.webhook?.success || 0} ok · ${snap.metrics.webhook?.failed || 0} failed`}
        />
        <MetricCard
          title="Success rate"
          big={wRate === null ? "—" : `${wRate}%`}
          tone={wRate === null ? "soft" : wRate >= 95 ? "success" : wRate >= 80 ? "warn" : "danger"}
          sub={wRate === null ? "Sin entregas en 24h" : "Threshold elite: ≥95%"}
        />
        <div style={{
          gridColumn: "span 2",
          padding: space[4],
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
        }}>
          <p style={{ margin: 0, color: cssVar.textDim, fontSize: font.size.xs, textTransform: "uppercase", letterSpacing: font.tracking.wide, fontWeight: font.weight.semibold }}>
            Deliveries por hora (24h)
          </p>
          <HourBars buckets={snap.metrics.webhook?.buckets || []} />
        </div>
      </div>

      {/* Auth */}
      <h2 style={{ margin: `${space[5]}px 0 ${space[3]}px`, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>
        Auth (24h)
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: space[3] }}>
        <MetricCard
          title="Signins exitosos"
          big={formatCounter(snap.metrics.auth?.successRate?.signins || 0)}
        />
        <MetricCard
          title="Failures"
          big={formatCounter(snap.metrics.auth?.successRate?.failures || 0)}
          tone={(snap.metrics.auth?.successRate?.failures || 0) > 50 ? "warn" : "soft"}
        />
        <MetricCard
          title="Success rate"
          big={aRate === null ? "—" : `${aRate}%`}
          tone={aRate === null ? "soft" : aRate >= 95 ? "success" : aRate >= 80 ? "warn" : "danger"}
        />
        <MetricCard
          title="Total events"
          big={formatCounter(snap.metrics.auth?.events?.total || 0)}
          sub={`${Object.keys(snap.metrics.auth?.events?.byAction || {}).length} action types`}
        />
      </div>

      {/* Sessions */}
      <h2 style={{ margin: `${space[5]}px 0 ${space[3]}px`, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>
        Sesiones
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: space[3] }}>
        <MetricCard
          title="Activas (total)"
          big={formatCounter(snap.metrics.sessions?.total || 0)}
          sub="No revoked + no expired"
        />
        <MetricCard
          title="Nuevas 24h"
          big={formatCounter(snap.metrics.sessions?.recent24h || 0)}
        />
      </div>

      {/* Audit chain */}
      <h2 style={{ margin: `${space[5]}px 0 ${space[3]}px`, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>
        Audit chain status
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: space[3] }}>
        <MetricCard
          title="Orgs verified"
          big={formatCounter(snap.metrics.audit?.verified || 0)}
          sub={`de ${snap.metrics.audit?.total || 0} total`}
          tone="success"
        />
        <MetricCard
          title="Tampered"
          big={formatCounter(snap.metrics.audit?.tampered || 0)}
          tone={(snap.metrics.audit?.tampered || 0) > 0 ? "danger" : "soft"}
        />
        <MetricCard
          title="Never verified"
          big={formatCounter(snap.metrics.audit?.neverVerified || 0)}
          tone={(snap.metrics.audit?.neverVerified || 0) > 0 ? "warn" : "soft"}
          sub="Recomienda OWNER ejecutar verify"
        />
      </div>

      {snap.metrics.audit?.tampered > 0 && (
        <Alert kind="error" style={{ marginBlockStart: space[3] }}>
          <strong>Alerta:</strong> {snap.metrics.audit.tampered} org(s) tienen audit chain
          marcado como TAMPERED. Investigación inmediata recomendada.
        </Alert>
      )}
    </article>
  );
}
