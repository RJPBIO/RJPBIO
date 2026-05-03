"use client";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, TextLink, ScrollPad } from "../primitives";
import { typography, colors, spacing, radii } from "../../tokens";
import { FIXTURE_NOM35, relativeTime } from "../fixtures";

export default function Nom35View({ onBack, onNavigate }) {
  const n = FIXTURE_NOM35;
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
                color: "rgba(255,255,255,0.72)",
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
              value={n.hasResponse
                ? `Última evaluación: ${relativeTime(n.lastTs)} · ${n.level}`
                : "Sin evaluación previa"}
              caption="72 ítems · 5 niveles · 10 dominios"
            />
            <PillButton onClick={() => onNavigate && onNavigate({ action: "take-nom35" })}>
              {n.hasResponse ? "Tomar de nuevo" : "Tomar evaluación"}
            </PillButton>
            {n.hasResponse && (
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
