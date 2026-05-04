"use client";
/* Nom35TrendsPanel — Phase 6F SP-D
   10 sparklines weekly por dominio NOM-035 oficial. Suppressed cells
   (k<5) muestran texto "Sin datos". Recharts client-side. */

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { DOMINIOS } from "@/lib/nom35/items";
import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";
import SectionHeader from "./SectionHeader";

const NIVEL_LABELS = {
  nulo: "Nulo / despreciable",
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  muy_alto: "Muy alto",
};

const DOMINIO_LIST = Object.values(DOMINIOS);

export default function Nom35TrendsPanel({ summary, trends }) {
  const summarySuppressed = !summary || summary.suppressed;

  return (
    <section
      data-v2-nom35-trends
      style={{
        marginBlockStart: space[6],
        marginBlockEnd: space[5],
      }}
    >
      <SectionHeader
        eyebrow="NOM-035 · 10 dominios"
        italic="Riesgo psicosocial."
        title={
          summarySuppressed
            ? "Sin muestra suficiente"
            : `Nivel agregado: ${NIVEL_LABELS[summary.nivelPromedio] || "Medio"}`
        }
        subtitle="Evolución semanal · k-anon ≥ 5 por celda · 10 dominios oficiales DOF"
      />
      {summarySuppressed && (
        <p style={{
          color: cssVar.textMuted,
          fontSize: font.size.sm,
          marginBlockEnd: space[3],
        }}>
          Se requieren mínimo 5 respuestas NOM-035 para mostrar tendencias.
        </p>
      )}
      <div
        data-v2-nom35-trends-grid
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: space[3],
        }}
      >
        {DOMINIO_LIST.map((dominio) => (
          <DominioCard
            key={dominio.id}
            dominio={dominio}
            data={trends?.[dominio.id]}
          />
        ))}
      </div>
    </section>
  );
}

function DominioCard({ dominio, data }) {
  const validData = Array.isArray(data)
    ? data.filter((d) => !d.suppressed && Number.isFinite(d.value))
    : [];
  const hasData = validData.length >= 2;

  return (
    <article
      data-v2-dominio-card
      data-suppressed={!hasData}
      style={{
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        padding: space[3],
        display: "flex",
        flexDirection: "column",
        gap: space[2],
      }}
    >
      <div
        style={{
          fontFamily: cssVar.fontMono,
          fontSize: font.size.xs,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: cssVar.textDim,
          fontWeight: font.weight.semibold,
        }}
      >
        {dominio.label}
      </div>
      {hasData ? (
        <div style={{ height: 64 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={validData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={bioSignal.phosphorCyan}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "var(--bi-surface-2)",
                  border: `1px solid var(--bi-border)`,
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
                labelStyle={{ display: "none" }}
                formatter={(v) => [v, "score"]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p style={{
          color: cssVar.textMuted,
          fontSize: font.size.sm,
          margin: 0,
          lineHeight: 1.4,
        }}>
          Sin datos suficientes en este periodo
        </p>
      )}
    </article>
  );
}
