"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { evaluateEngineHealth } from "@/lib/neural";
import { PageHeader } from "@/components/admin/PageHeader";
import SegmentedNav from "@/components/admin/SegmentedNav";
import { KPITile } from "@/components/admin/KPITile";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { BioGlyph } from "@/components/BioIgnicionMark";
import { cssVar, space, font, radius, bioSignal } from "@/components/ui/tokens";

const SETTINGS_NAV = [
  { href: "/settings/sessions", label: "Sesiones" },
  { href: "/settings/security/mfa", label: "MFA" },
  { href: "/settings/sso", label: "SSO" },
  { href: "/settings/data-requests", label: "Mis datos (GDPR)" },
  { href: "/settings/neural", label: "Motor adaptativo" },
];

const MATURITY_LABEL = {
  "cold-start": "Cold-start",
  learning: "Aprendiendo",
  personalized: "Personalizado",
};
const MATURITY_TONE = {
  "cold-start": "neutral",
  learning: "signal",
  personalized: "success",
};
const OVERALL_TONE = {
  healthy: "success",
  operational: "signal",
  calibrating: "warn",
  underperforming: "warn",
  stale: "warn",
  "cold-start": "soft",
};
const OVERALL_LABEL = {
  healthy: "Saludable",
  operational: "Operativo",
  calibrating: "Calibrando",
  underperforming: "Bajo rendimiento",
  stale: "Datos antiguos",
  "cold-start": "Iniciando",
};
const STALENESS_LABEL = {
  fresh: "Reciente",
  active: "Activo",
  cooling: "Enfriando",
  stale: "Antiguo",
  "no-data": "Sin datos",
};
const ACTION_KIND_VARIANT = {
  ok: "success",
  info: "info",
  warn: "warn",
  danger: "danger",
};
const SIGNAL_LABELS = {
  sensitivity: "Sensibilidad por protocolo",
  peakWindow: "Ventana óptima personal",
  weeklyDensity: "Patrón semanal",
  residualCalibration: "Calibración de predicciones",
  bandit: "Exploración personalizada",
};

export default function NeuralSettingsClient() {
  const state = useStore();
  const [health, setHealth] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHealth(evaluateEngineHealth(state));
  }, [state]);

  if (!mounted || !health) {
    return (
      <article className="bi-admin-shell" style={{ maxWidth: 880, margin: "0 auto", padding: `${space[6]}px ${space[4]}px`, color: cssVar.text }}>
        <PageHeader
          eyebrow="Cuenta · motor adaptativo"
          italic="Cómo aprende"
          title="el motor sobre ti."
          subtitle="Cargando datos locales del motor adaptativo…"
        />
      </article>
    );
  }

  const overall = OVERALL_LABEL[health.overall] || health.overall;
  const overallTone = OVERALL_TONE[health.overall] || "soft";

  return (
    <article className="bi-admin-shell" style={{ maxWidth: 880, margin: "0 auto", padding: `${space[6]}px ${space[4]}px`, color: cssVar.text }}>
      <PageHeader
        eyebrow="Cuenta · motor adaptativo"
        italic="Cómo aprende"
        title="el motor sobre ti."
        subtitle={`Tus datos locales nunca salen de este dispositivo. Lo que ves aquí se calcula en tu propia sesión sin enviarse al servidor.`}
        actions={
          <Badge variant={overallTone} size="md">{overall}</Badge>
        }
      />
      <SegmentedNav items={SETTINGS_NAV} ariaLabel="Sub-navegación de cuenta" />

      {/* Recalibration banner si aplica */}
      {health.recalibrationNeeded && (
        <Alert kind={health.recalibrationSeverity === "hard" ? "warn" : "info"} style={{ marginBlockStart: space[3] }}>
          <strong>
            {health.recalibrationSeverity === "hard"
              ? `${health.staleness.days} días de pausa.`
              : "Datos en proceso de enfriamiento."}
          </strong>{" "}
          {health.recalibrationSeverity === "hard"
            ? "Tus patrones pueden haber cambiado — comencemos con una sesión corta para recalibrar."
            : "Una sesión nos ayuda a confirmar que tus protocolos siguen siendo los más efectivos."}
        </Alert>
      )}

      {/* Maturity row */}
      <h2 style={h2Style}>Madurez del motor</h2>
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: space[3],
      }}>
        <KPITile
          label="Estado actual"
          value={MATURITY_LABEL[health.dataMaturity] || health.dataMaturity}
          sub={`${health.totalSessions} sesiones acumuladas`}
          tone={MATURITY_TONE[health.dataMaturity] || "neutral"}
          glow={health.dataMaturity === "personalized"}
        />
        <KPITile
          label="Última actividad"
          value={STALENESS_LABEL[health.staleness.status] || "—"}
          sub={typeof health.staleness.days === "number" ? `${health.staleness.days} día(s)` : "Sin datos"}
          tone={
            health.staleness.status === "stale" ? "warn"
            : health.staleness.status === "cooling" ? "warn"
            : health.staleness.status === "fresh" ? "success"
            : "neutral"
          }
        />
        {typeof health.predictionAccuracy?.hitRate === "number" && (
          <KPITile
            label="Precisión predicciones"
            value={`${(health.predictionAccuracy.hitRate * 100).toFixed(0)}%`}
            sub={`Error medio ${health.predictionAccuracy.meanError} · n=${health.predictionAccuracy.sampleSize}`}
            tone={
              health.predictionAccuracy.status === "good" ? "success"
              : health.predictionAccuracy.status === "fair" ? "signal"
              : "warn"
            }
            glow={health.predictionAccuracy.status === "good"}
          />
        )}
        <KPITile
          label="Personalización"
          value={`${(health.personalization.value * 100).toFixed(0)}%`}
          sub={`${health.personalization.activeSignals} de 5 señales activas`}
          tone={
            health.personalization.status === "strong" ? "success"
            : health.personalization.status === "developing" ? "signal"
            : "neutral"
          }
        />
      </section>

      {/* Personalization checklist */}
      <h2 style={h2Style}>Lo que sabe el motor sobre ti</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
        {Object.entries(health.personalization.signals).map(([key, active]) => (
          <li key={key} style={{
            display: "flex",
            alignItems: "center",
            gap: space[3],
            padding: space[3],
            background: cssVar.surface,
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.sm,
          }}>
            <span aria-hidden style={{
              width: 22, height: 22, borderRadius: radius.full,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: active ? bioSignal.phosphorCyan : "transparent",
              color: active ? "#041019" : cssVar.textMuted,
              border: active ? "none" : `1px solid ${cssVar.border}`,
              fontSize: 12, fontWeight: font.weight.bold,
              boxShadow: active ? `0 0 12px ${bioSignal.phosphorCyan}` : "none",
              flexShrink: 0,
            }}>
              {active ? "✓" : "·"}
            </span>
            <span style={{
              flex: 1,
              color: active ? cssVar.text : cssVar.textMuted,
              fontWeight: active ? font.weight.semibold : font.weight.medium,
              fontSize: font.size.sm,
            }}>
              {SIGNAL_LABELS[key] || key}
            </span>
            <span style={{
              fontSize: font.size.xs,
              fontFamily: cssVar.fontMono,
              color: active ? bioSignal.phosphorCyanInk : cssVar.textMuted,
              textTransform: "uppercase",
              letterSpacing: font.tracking.wide,
              fontWeight: font.weight.bold,
            }}>
              {active ? "Activa" : "Pendiente"}
            </span>
          </li>
        ))}
      </ul>

      {/* Action items */}
      <h2 style={h2Style}>Sugerencias para tu motor</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
        {health.actions.map((a, i) => (
          <li key={i} style={{
            padding: space[3],
            background: cssVar.surface,
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.sm,
            display: "flex", gap: space[3], alignItems: "flex-start",
          }}>
            <Badge variant={ACTION_KIND_VARIANT[a.kind] || "soft"} size="sm">{a.kind}</Badge>
            <div>
              <div style={{ fontWeight: font.weight.semibold, color: cssVar.text }}>{a.title}</div>
              <div style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: 2 }}>{a.detail}</div>
            </div>
          </li>
        ))}
      </ul>

      {/* Privacy callout */}
      <div style={{
        marginBlockStart: space[5],
        padding: space[4],
        background: cssVar.accentSoft,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        display: "flex", gap: space[3], alignItems: "flex-start",
      }}>
        <span style={{ flexShrink: 0 }}>
          <BioGlyph size={28} />
        </span>
        <div>
          <div style={{ fontWeight: font.weight.semibold, color: cssVar.text }}>
            Privacidad por diseño
          </div>
          <div style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: 4, lineHeight: 1.5 }}>
            Toda esta evaluación se calcula localmente en tu dispositivo. El motor adaptativo
            opera sobre tu state cifrado en IndexedDB. Lo único que el servidor recibe son
            los timestamps y deltas de mood agregados que ya consentiste compartir
            (ver <a href="/settings/data-requests" style={{ color: cssVar.accent }}>Mis datos · GDPR</a>).
          </div>
        </div>
      </div>

      <p style={{ marginBlockStart: space[4], fontSize: font.size.xs, color: cssVar.textMuted }}>
        Schema v{health.schemaVersion} · evaluado en tu dispositivo · sin envío al servidor.
      </p>
    </article>
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
