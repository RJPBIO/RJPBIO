"use client";
/* ═══════════════════════════════════════════════════════════════
   ORG DASHBOARD — aggregated team view (privacy-preserving)
   k-anonymity enforced. No individual data visible to employer.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { aggregateTeam, NOM035_CATEGORIES } from "../lib/nom035";
import { aggregateHrvDeltas } from "../lib/hrvDelta";
import { computeProtocolEffectiveness, aggregateTeamCoherence } from "../lib/effectiveness";
import { computeRecoveredHours, computeRoiValue } from "../lib/roi";
import { aggregateInstrument } from "../lib/instruments";

const MIN_K = 5;
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const kickerStyle = (color) => ({
  color,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: -0.05,
  margin: 0,
});

const metricValueStyle = (color) => ({
  fontFamily: MONO,
  fontSize: 32,
  fontWeight: 800,
  color,
  letterSpacing: -0.8,
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
});

const captionStyle = (color) => ({
  fontSize: 11,
  fontWeight: 500,
  color,
  letterSpacing: -0.05,
});

export default function OrgDashboard({
  teamResponses = [],
  sessions = [],
  hrvDeltas = [],
  instrumentResponses = [],
  isDark,
  hourlyLoadedCost,
  currency,
}) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const agg = useMemo(() => aggregateTeam(teamResponses, { minK: MIN_K }), [teamResponses]);

  const hrvAgg = useMemo(
    () => aggregateHrvDeltas(hrvDeltas, { minK: MIN_K }),
    [hrvDeltas]
  );

  const effectiveness = useMemo(
    () => computeProtocolEffectiveness(sessions, { minN: MIN_K }),
    [sessions]
  );

  // Coherencia HRV agregada del equipo (k-anon ≥ MIN_K usuarios únicos).
  // Solo aparece cuando hay suficientes employees usando strap BLE durante
  // protocolos. Indicador objetivo de respuesta autonómica del equipo.
  const teamCoh = useMemo(
    () => aggregateTeamCoherence(sessions, { minK: MIN_K }),
    [sessions]
  );

  const roi = useMemo(() => {
    const hours = computeRecoveredHours({ sessions });
    if (hours.insufficient) return { insufficient: true, n: hours.n, minRequired: hours.minRequired };
    const value = computeRoiValue({
      recoveredHours: hours.recoveredHours,
      hourlyLoadedCost,
      currency,
    });
    return { insufficient: false, ...hours, value };
  }, [sessions, hourlyLoadedCost, currency]);

  const pssAgg = useMemo(
    () => aggregateInstrument(instrumentResponses, "pss-4", { minK: MIN_K }),
    [instrumentResponses]
  );
  const wemwbsAgg = useMemo(
    () => aggregateInstrument(instrumentResponses, "wemwbs-7", { minK: MIN_K }),
    [instrumentResponses]
  );

  const engagement = useMemo(() => {
    const n = sessions.length;
    if (n < MIN_K) return { insufficient: true, n };
    const now = Date.now();
    const last7d = sessions.filter((s) => now - s.ts < 7 * 86400000);
    const last30d = sessions.filter((s) => now - s.ts < 30 * 86400000);
    const uniqueUsers7d = new Set(last7d.map((s) => s.userId || "anon")).size;
    return {
      insufficient: false,
      sessionsTotal: n,
      sessionsLast7d: last7d.length,
      sessionsLast30d: last30d.length,
      uniqueUsers7d,
    };
  }, [sessions]);

  return (
    <section aria-label="Dashboard organizacional" style={{ padding: 20, maxInlineSize: 1000, marginInline: "auto" }}>
      <header style={{ marginBlockEnd: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: font.weight.black, color: t1, margin: 0 }}>
          Dashboard organizacional
        </h1>
        <p style={{ color: t2, fontSize: 12, marginBlockStart: 8, lineHeight: 1.6 }}>
          Métricas agregadas del equipo. Preservamos la privacidad individual con k-anonimato (mínimo {MIN_K} respuestas por agregado).
          Ningún dato personal es visible.
        </p>
      </header>

      <div
        role="region"
        aria-label="Aviso de privacidad"
        style={{
          background: withAlpha(brand.primary, 8),
          border: `1px solid ${withAlpha(brand.primary, 20)}`,
          borderRadius: 12,
          padding: 14,
          marginBlockEnd: 24,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <Icon name="shield" size={16} color={brand.primary} aria-hidden="true" />
        <div>
          <p style={{ color: t1, fontSize: 12, fontWeight: 700, margin: 0, marginBlockEnd: 4 }}>
            Datos agregados, no individuales
          </p>
          <p style={{ color: t2, fontSize: 11, margin: 0, lineHeight: 1.5 }}>
            Si un grupo tiene menos de {MIN_K} respuestas, se omite del reporte (k-anonimato). Los datos no identificables con un empleado particular cumplen con LFPDPPP México y GDPR.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBlockEnd: 24 }}>
        <RoiCard roi={roi} isDark={isDark} />
        <HrvDeltaCard agg={hrvAgg} isDark={isDark} />
        <EffectivenessCard eff={effectiveness} isDark={isDark} />
        <InstrumentCard
          agg={pssAgg}
          title="Estrés percibido (PSS-4)"
          reference="Cohen & Williamson 1988"
          scale="0-16"
          isDark={isDark}
        />
        <InstrumentCard
          agg={wemwbsAgg}
          title="Bienestar (SWEMWBS)"
          reference="Stewart-Brown 2009"
          scale="7-35"
          isDark={isDark}
        />
        <NOMCard agg={agg} isDark={isDark} />
        <EngagementCard eng={engagement} isDark={isDark} />
        <CoherenceCard agg={teamCoh} isDark={isDark} />
      </div>

      <ComplianceCard isDark={isDark} />
    </section>
  );
}

function CoherenceCard({ agg, isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  if (agg.insufficient) {
    return (
      <article style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}>
        <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 10 }}>
          Coherencia HRV (equipo)
        </h3>
        <p style={{ color: t2, fontSize: 12, lineHeight: 1.6, marginBlockStart: 10 }}>
          Insuficientes empleados con strap BLE ({agg.n}/{agg.minK}). Para preservar anonimato se requieren al menos {agg.minK} usuarios únicos midiendo coherencia en sesión.
        </p>
      </article>
    );
  }
  const colorByScore = agg.meanScore >= 70 ? semantic.success : agg.meanScore >= 40 ? brand.primary : semantic.warning;
  return (
    <article
      role="region"
      aria-label="Coherencia HRV agregada del equipo"
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}
    >
      <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 14 }}>
        Coherencia HRV (equipo)
      </h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBlockEnd: 10 }}>
        <div>
          <div style={metricValueStyle(colorByScore)}>{agg.meanScore}</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: t3, letterSpacing: -0.05 }}>
            score promedio (σ={agg.sd})
          </div>
        </div>
        <div style={{ textAlign: "end" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t1 }}>
            {agg.uniqueUsers}
          </div>
          <div style={{ fontSize: 10, color: t3 }}>empleados</div>
        </div>
      </div>
      {agg.topProtocol && (
        <p style={{ color: t2, fontSize: 11, margin: 0, marginBlockStart: 8, lineHeight: 1.5 }}>
          Mejor coherencia: <strong style={{ color: t1, fontWeight: 700 }}>"{agg.topProtocol.name}"</strong> · {agg.topProtocol.meanScore} ({agg.topProtocol.n} sesiones)
        </p>
      )}
      <p style={{ color: t3, fontSize: 10, margin: 0, marginBlockStart: 6, fontStyle: "italic", lineHeight: 1.5 }}>
        Phase-lock breath ↔ HRV. Ref: Lehrer & Gevirtz 2014.
      </p>
    </article>
  );
}

function NOMCard({ agg, isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  if (agg.insufficient) {
    return (
      <article style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}>
        <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 10 }}>
          Riesgo psicosocial (NOM-035)
        </h3>
        <p style={{ color: t2, fontSize: 12, lineHeight: 1.6, marginBlockStart: 10 }}>
          Insuficientes respuestas para mostrar ({agg.n}/{agg.minK}). Para preservar anonimato se requieren al menos {agg.minK} evaluaciones.
        </p>
      </article>
    );
  }
  return (
    <article
      role="region"
      aria-label="Riesgo psicosocial del equipo"
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}
    >
      <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 14 }}>
        Riesgo psicosocial (NOM-035)
      </h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBlockEnd: 10 }}>
        <div>
          <div style={metricValueStyle(t1)}>
            {agg.mean}
          </div>
          <div style={{ fontSize: 11, fontWeight: 500, color: t3, letterSpacing: -0.05 }}>
            puntaje promedio (σ={agg.sd})
          </div>
        </div>
        <div style={{ textAlign: "end" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: agg.highRiskPct > 20 ? semantic.danger : semantic.success }}>
            {agg.highRiskPct}%
          </div>
          <div style={{ fontSize: 10, color: t3 }}>alto riesgo</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBlockStart: 14 }}>
        {Object.entries(agg.distribution).map(([level, count]) => (
          <div key={level} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ color: t2, textTransform: "capitalize" }}>{level.replace("_", " ")}</span>
            <span style={{ color: t1, fontWeight: 700 }}>{count}</span>
          </div>
        ))}
      </div>

      <p style={{ color: t3, fontSize: 10, marginBlockStart: 14 }}>
        N = {agg.n} respuestas · agregación anónima
      </p>
    </article>
  );
}

function EngagementCard({ eng, isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  if (eng.insufficient) {
    return (
      <article style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}>
        <h3 style={kickerStyle(t3)}>
          Adopción
        </h3>
        <p style={{ color: t2, fontSize: 12, marginBlockStart: 10 }}>
          Insuficientes sesiones registradas aún.
        </p>
      </article>
    );
  }
  return (
    <article
      role="region"
      aria-label="Adopción del equipo"
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}
    >
      <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 14 }}>
        Adopción
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Stat value={eng.sessionsLast7d} label="Sesiones / 7d" t1={t1} t3={t3} />
        <Stat value={eng.uniqueUsers7d} label="Usuarios activos / 7d" t1={t1} t3={t3} />
        <Stat value={eng.sessionsLast30d} label="Sesiones / 30d" t1={t1} t3={t3} />
        <Stat value={eng.sessionsTotal} label="Sesiones totales" t1={t1} t3={t3} />
      </div>
    </article>
  );
}

function Stat({ value, label, t1, t3 }) {
  return (
    <div role="group" aria-label={`${label}: ${value}`}>
      <div
        style={{
          fontFamily: MONO,
          color: t1,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: -0.5,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ color: t3, fontSize: 11, fontWeight: 500, letterSpacing: -0.05, marginBlockStart: 4 }}>
        {label}
      </div>
    </div>
  );
}

function ComplianceCard({ isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  return (
    <article
      role="region"
      aria-label="Cumplimiento y privacidad"
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}
    >
      <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 14 }}>
        Cumplimiento y privacidad
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <ComplianceRow ok label="NOM-035-STPS-2018 Guía II (46 ítems)" />
        <ComplianceRow ok label="PSS-4 (Cohen & Williamson 1988) — estrés percibido" />
        <ComplianceRow ok label="SWEMWBS (Stewart-Brown 2009) — bienestar mental" />
        <ComplianceRow ok label="PHQ-2 (Kroenke et al. 2003) — screening depresión" />
        <ComplianceRow ok label="HRV RMSSD (Task Force 1996, Shaffer 2017) con MDC95" />
        <ComplianceRow ok label="k-anonimato k≥5 en todas las agregaciones" />
        <ComplianceRow ok label="LFPDPPP — datos despersonalizados antes del agregado" />
        <ComplianceRow ok label="GDPR Art. 89 — fines estadísticos con medidas técnicas" />
      </ul>
    </article>
  );
}

function ComplianceRow({ ok, label }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "inherit" }}>
      <Icon name="check" size={14} color={ok ? brand.primary : "#999"} aria-hidden="true" />
      <span>{label}</span>
    </li>
  );
}

function RoiCard({ roi, isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  if (roi.insufficient) {
    return (
      <article style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}>
        <h3 style={kickerStyle(t3)}>
          ROI · Horas de foco
        </h3>
        <p style={{ color: t2, fontSize: 12, marginBlockStart: 10 }}>
          {roi.n}/{roi.minRequired} sesiones para reporte (modelo requiere muestra mínima).
        </p>
      </article>
    );
  }
  const hasValue = roi.value && roi.value.totalValue > 0;
  return (
    <article
      role="region"
      aria-label="Retorno de inversión"
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}
    >
      <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 14 }}>
        ROI · Horas de foco recuperadas
      </h3>
      <div style={metricValueStyle(t1)}>
        {roi.recoveredHours}
        <span style={{ fontSize: 14, color: t3, marginInlineStart: 6, fontFamily: "inherit" }}>h</span>
      </div>
      {hasValue && (
        <div style={{ fontSize: 14, fontWeight: 700, color: brand.primary, marginBlockStart: 4 }}>
          ≈ {roi.value.currency} {roi.value.totalValue.toLocaleString()}
        </div>
      )}
      <div style={{ marginBlockStart: 12, fontSize: 10, color: t3, lineHeight: 1.6 }}>
        {roi.n} sesiones · lift observado {(roi.observedLift * 100).toFixed(1)}% (cap {(roi.effectSizeCap * 100).toFixed(0)}%) · factor residual {roi.residualFactor}×
      </div>
      <a
        href="/trust#roi"
        style={{ display: "inline-block", marginBlockStart: 10, fontSize: 10, color: brand.primary, textDecoration: "underline" }}
      >
        Ver metodología
      </a>
    </article>
  );
}

function HrvDeltaCard({ agg, isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  if (agg.insufficient) {
    return (
      <article style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}>
        <h3 style={kickerStyle(t3)}>
          HRV · Δ RMSSD pre/post
        </h3>
        <p style={{ color: t2, fontSize: 12, marginBlockStart: 10 }}>
          {agg.n}/{agg.minK} mediciones emparejadas con sesión. Anima al equipo a conectar un sensor BLE.
        </p>
      </article>
    );
  }
  const liftColor = agg.meanDelta > 0 ? semantic.success : agg.meanDelta < 0 ? semantic.danger : t2;
  return (
    <article
      role="region"
      aria-label="Variación de HRV pre y post sesión"
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}
    >
      <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 14 }}>
        HRV · Δ RMSSD pre/post
      </h3>
      <div style={metricValueStyle(liftColor)}>
        {agg.meanDelta > 0 ? "+" : ""}{agg.meanDelta}
        <span style={{ fontSize: 14, color: t3, marginInlineStart: 6, fontFamily: "inherit" }}>ms</span>
      </div>
      <div style={{ fontSize: 11, color: t3, marginBlockStart: 4 }}>
        IC95% [{agg.ci95Lo}, {agg.ci95Hi}] · σ={agg.sd}
      </div>
      <div style={{ marginBlockStart: 12, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: t2 }}>% con lift vagal</span>
        <span style={{ color: t1, fontWeight: 700 }}>{agg.positivePct}%</span>
      </div>
      <p style={{ color: t3, fontSize: 10, marginBlockStart: 12, lineHeight: 1.5 }}>
        N = {agg.n} · filtro MDC95 (Haley & Fragala-Pinkham 2006) para descartar ruido
      </p>
    </article>
  );
}

function EffectivenessCard({ eff, isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  if (eff.insufficient) {
    return (
      <article style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}>
        <h3 style={kickerStyle(t3)}>
          Efectividad · lift pre/post
        </h3>
        <p style={{ color: t2, fontSize: 12, marginBlockStart: 10 }}>
          {eff.n}/{eff.minN} check-ins post-sesión con pre/post. Se requiere n ≥ {eff.minN}.
        </p>
      </article>
    );
  }
  const sigColor = eff.significant ? semantic.success : t3;
  const magLabel = {
    "no-effect": "sin efecto detectable",
    small: "efecto pequeño",
    moderate: "efecto moderado",
    large: "efecto grande",
  }[eff.magnitude];
  return (
    <article
      role="region"
      aria-label="Efectividad pre y post sesión"
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}
    >
      <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 14 }}>
        Efectividad · lift de estado
      </h3>
      <div style={metricValueStyle(t1)}>
        {eff.meanLift > 0 ? "+" : ""}{eff.meanLift}
      </div>
      <div style={{ fontSize: 11, color: t3, marginBlockStart: 4 }}>
        IC95% [{eff.ci95Lo}, {eff.ci95Hi}] · d={eff.cohensD}
      </div>
      <div style={{ marginBlockStart: 12, fontSize: 11, color: sigColor, fontWeight: 700 }}>
        {magLabel}
      </div>
      <div style={{ marginBlockStart: 8, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: t2 }}>% positivos</span>
        <span style={{ color: t1, fontWeight: 700 }}>{eff.positivePct}%</span>
      </div>
      <p style={{ color: t3, fontSize: 10, marginBlockStart: 12 }}>
        N = {eff.n} pares pre/post · Cohen 1988
      </p>
    </article>
  );
}

function InstrumentCard({ agg, title, reference, scale, isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  if (agg.insufficient) {
    return (
      <article style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}>
        <h3 style={kickerStyle(t3)}>
          {title}
        </h3>
        <p style={{ color: t2, fontSize: 12, marginBlockStart: 10 }}>
          {agg.n}/{agg.minK} respuestas. Invita al equipo a completar la evaluación.
        </p>
      </article>
    );
  }
  return (
    <article
      role="region"
      aria-label={title}
      style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}
    >
      <h3 style={{ ...kickerStyle(t3), marginBlockEnd: 14 }}>
        {title}
      </h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={metricValueStyle(t1)}>{agg.mean}</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: t3, letterSpacing: -0.05 }}>
            promedio (σ={agg.sd})
          </div>
        </div>
        <div style={{ textAlign: "end", color: t3, fontSize: 10 }}>escala {scale}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBlockStart: 14 }}>
        {Object.entries(agg.distribution).map(([level, count]) => (
          <div key={level} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ color: t2, textTransform: "capitalize" }}>{level}</span>
            <span style={{ color: t1, fontWeight: 700 }}>{count}</span>
          </div>
        ))}
      </div>
      <p style={{ color: t3, fontSize: 10, marginBlockStart: 14 }}>
        N = {agg.n} · {reference} · k-anónimo
      </p>
    </article>
  );
}

function resolveTheme(isDark) {
  // fallback reader — duplicates theme.js resolveTheme shape to avoid circular import risk.
  const palette = isDark
    ? { bg: "#0B0E14", card: "#141820", border: "#1E2330", text: { primary: "#E8ECF4", secondary: "#8B95A8", muted: "#4B5568" } }
    : { bg: "#F1F4F9", card: "#FFFFFF", border: "#E2E8F0", text: { primary: "#0F172A", secondary: "#475569", muted: "#94A3B8" } };
  return {
    bg: palette.bg, card: palette.card, border: palette.border,
    t1: palette.text.primary, t2: palette.text.secondary, t3: palette.text.muted,
  };
}
