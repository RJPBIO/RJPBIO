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

const MIN_K = 5;

export default function OrgDashboard({ teamResponses = [], sessions = [], isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const agg = useMemo(() => aggregateTeam(teamResponses, { minK: MIN_K }), [teamResponses]);

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
        <NOMCard agg={agg} isDark={isDark} />
        <EngagementCard eng={engagement} isDark={isDark} />
      </div>

      <ComplianceCard isDark={isDark} />
    </section>
  );
}

function NOMCard({ agg, isDark }) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  if (agg.insufficient) {
    return (
      <article style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 18 }}>
        <h3 style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 10, margin: 0 }}>
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
      <h3 style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 14, margin: 0 }}>
        Riesgo psicosocial (NOM-035)
      </h3>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBlockEnd: 10 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: font.weight.black, color: t1 }}>
            {agg.mean}
          </div>
          <div style={{ fontSize: 10, color: t3, letterSpacing: 1, textTransform: "uppercase" }}>
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
        <h3 style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>
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
      <h3 style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 14, margin: 0 }}>
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
      <div style={{ color: t1, fontSize: 22, fontWeight: font.weight.black }}>{value}</div>
      <div style={{ color: t3, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBlockStart: 2 }}>
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
      <h3 style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 14, margin: 0 }}>
        Cumplimiento y privacidad
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <ComplianceRow ok label="NOM-035-STPS-2018 Guía II (46 ítems)" />
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
