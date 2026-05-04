"use client";
import { useStore } from "@/store/useStore";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, TextLink, ScrollPad } from "../primitives";
import { typography, colors, spacing, radii } from "../../tokens";
import { relativeTime } from "../fixtures";

// Phase 6D SP3 — fixtures cleanup. Antes leía FIXTURE_NOM35 que decía
// "Riesgo medio · hace 60 días" para todos los users — fake. Ahora deriva
// del store.nom035Results (poblado por el flow oficial NOM-035 cuando exista
// — handler "take-nom35" sigue stub hasta SP4).
//
// Si el array está vacío, mostramos empty state honesto. Si tiene resultados,
// usamos el más reciente para "última evaluación: hace X" + nivel.

export default function Nom35View({ onBack, onNavigate }) {
  const nom035Results = useStore((s) => s.nom035Results || []);
  const last = pickLatest(nom035Results);

  return (
    <>
      <SubRouteHeader title="NOM-035 STPS" onBack={onBack} />
      <ScrollPad>
        <Section paddingBottom={spacing.s24}>
          <article
            style={{
              background: "transparent",
              border: `0.5px solid ${colors.separator}`,
              borderRadius: radii.panel,
              padding: spacing.s16,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.caption,
                fontWeight: typography.weight.regular,
                color: colors.text.secondary,
                lineHeight: 1.5,
              }}
            >
              Texto pendiente de validación legal vs DOF. Esta evaluación tiene propósito informativo. Para acta oficial firmable, contacta a tu administrador.
            </p>
          </article>
        </Section>

        <Section paddingBottom={48}>
          <Kicker>NOM-035 STPS · GUÍA III</Kicker>
          <Card>
            <StatLine
              value={last
                ? `Última evaluación: ${relativeTime(last.ts)} · ${last.level || "—"}`
                : "Sin evaluación previa"}
              caption="72 ítems · 5 niveles · 10 dominios"
            />
            <PillButton onClick={() => onNavigate && onNavigate({ action: "take-nom35" })}>
              {last ? "Tomar de nuevo" : "Tomar evaluación"}
            </PillButton>
            {last && (
              <TextLink onClick={() => onNavigate && onNavigate({ target: "/app/profile/nom35/report" })}>
                VER REPORTE PERSONAL →
              </TextLink>
            )}
          </Card>
        </Section>
      </ScrollPad>
    </>
  );
}

function pickLatest(results) {
  if (!Array.isArray(results) || results.length === 0) return null;
  let best = null;
  for (const r of results) {
    if (!r || typeof r.ts !== "number") continue;
    if (!best || r.ts > best.ts) best = r;
  }
  return best;
}
