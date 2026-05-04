"use client";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, PillButton, ScrollPad } from "../primitives";
import { typography, spacing } from "../../tokens";
import { relativeTime } from "../fixtures";

// Phase 6D SP3 — fixtures cleanup. Antes leía FIXTURE_DATA_REQUESTS que
// inventaba "1 ACCESS request resolved hace 45 días" para todos los users.
// Ahora el history viene del endpoint backend (`/api/v1/me/dsar/history`)
// — wired en SP4. Por SP3 mostramos history vacío, las CTAs principales
// (acceso, portabilidad, eliminación) siguen funcional con sus actions
// (handlers caen en console.log hasta SP4 los wired al endpoint real).

export default function DataRequestsView({ onBack, onNavigate }) {
  const dr = { history: [] };

  return (
    <>
      <SubRouteHeader title="Mis datos" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>ACCESO</Kicker>
          <Card>
            <p
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.bodyMin,
                fontWeight: typography.weight.regular,
                color: "rgba(255,255,255,0.96)",
                lineHeight: 1.5,
              }}
            >
              Recibirás un export JSON completo de tus datos en hasta 24 horas.
            </p>
            <PillButton onClick={() => onNavigate && onNavigate({ action: "dsar-access" })}>
              Solicitar acceso a mis datos
            </PillButton>
          </Card>
        </Section>

        <Section>
          <Kicker>PORTABILIDAD</Kicker>
          <Card>
            <p
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.bodyMin,
                fontWeight: typography.weight.regular,
                color: "rgba(255,255,255,0.96)",
                lineHeight: 1.5,
              }}
            >
              Export en formato portable (JSON) para llevar tus datos a otra plataforma.
            </p>
            <PillButton onClick={() => onNavigate && onNavigate({ action: "dsar-portability" })}>
              Solicitar portabilidad
            </PillButton>
          </Card>
        </Section>

        <Section paddingBottom={48}>
          <Kicker>ELIMINACIÓN</Kicker>
          <Card>
            <p
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.bodyMin,
                fontWeight: typography.weight.regular,
                color: "rgba(255,255,255,0.96)",
                lineHeight: 1.5,
              }}
            >
              Requerirá aprobación de tu administrador si eres miembro de un equipo. Hard-delete en 30 días.
            </p>
            <PillButton variant="outlined" onClick={() => onNavigate && onNavigate({ action: "dsar-erasure" })}>
              Solicitar eliminación de cuenta
            </PillButton>
          </Card>
        </Section>

        {dr.history.length > 0 && (
          <Section paddingBottom={48}>
            <Kicker>HISTORIAL</Kicker>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {dr.history.map((h, i, arr) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.s16,
                    paddingBlock: 12,
                    borderBlockEnd: i === arr.length - 1 ? "none" : "0.5px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span
                      style={{
                        fontFamily: typography.family,
                        fontSize: typography.size.bodyMin,
                        fontWeight: typography.weight.medium,
                        color: "rgba(255,255,255,0.96)",
                        textTransform: "capitalize",
                      }}
                    >
                      {h.kind.toLowerCase()}
                    </span>
                    <span
                      style={{
                        fontFamily: typography.familyMono,
                        fontSize: typography.size.microCaps,
                        letterSpacing: "0.06em",
                        color: "rgba(255,255,255,0.32)",
                        fontWeight: typography.weight.regular,
                      }}
                    >
                      {relativeTime(h.ts)}
                    </span>
                  </span>
                  <span
                    style={{
                      fontFamily: typography.familyMono,
                      fontSize: typography.size.microCaps,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                      fontWeight: typography.weight.medium,
                    }}
                  >
                    {h.status}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </ScrollPad>
    </>
  );
}
