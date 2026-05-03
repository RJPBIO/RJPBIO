"use client";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, ScrollPad, TextLink } from "../primitives";
import { typography, colors, spacing } from "../../tokens";
import { FIXTURE_PRIVACY, FIXTURE_PRIVACY_B2B } from "../fixtures";

export default function PrivacyView({ onBack, onNavigate, b2b = false }) {
  const p = b2b ? FIXTURE_PRIVACY_B2B : FIXTURE_PRIVACY;

  return (
    <>
      <SubRouteHeader title="Privacidad y empresa" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>MIS MEMBRESÍAS</Kicker>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {p.memberships.map((m, i) => (
              <li
                key={m.orgId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.s16,
                  paddingBlock: 14,
                  borderBlockEnd: i === p.memberships.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
                }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: typography.family,
                      fontSize: typography.size.bodyMin,
                      fontWeight: typography.weight.medium,
                      color: "rgba(255,255,255,0.96)",
                    }}
                  >
                    {m.orgName}
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
                    ROL · {m.role}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {p.hasAdminAccess && (
            <div style={{ marginBlockStart: spacing.s16 }}>
              <TextLink tone="cyan" onClick={() => onNavigate && onNavigate({ target: "/admin" })}>
                IR A CONSOLA ADMIN →
              </TextLink>
            </div>
          )}
        </Section>

        <Section>
          <Kicker>PRIVACIDAD DE TUS DATOS</Kicker>
          <Card transparent>
            <p
              style={{
                margin: 0,
                fontFamily: typography.family,
                fontSize: typography.size.bodyMin,
                fontWeight: typography.weight.regular,
                color: "rgba(255,255,255,0.96)",
                lineHeight: 1.6,
              }}
            >
              Tu uso de Bio-Ignición es siempre privado. Tu empresa solo ve métricas agregadas con privacidad k-anonymity (mínimo 5 personas). Datos individuales nunca se exponen al empleador.
            </p>
          </Card>
        </Section>

        <Section paddingBottom={48}>
          <Kicker>QUÉ VE TU EMPRESA</Kicker>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {[
              { label: "Adopción agregada de la plataforma", visible: true },
              { label: "Métricas NOM-035 agregadas k≥5",     visible: true },
              { label: "Salud del motor agregada k≥5",        visible: true },
              { label: "Sesiones individuales tuyas",         visible: false },
              { label: "HRV / mood / instrumentos individuales", visible: false },
              { label: "Conversaciones con coach",            visible: false },
            ].map((it, i, arr) => (
              <li
                key={it.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.s16,
                  paddingBlock: 12,
                  borderBlockEnd: i === arr.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
                }}
              >
                <span
                  style={{
                    fontFamily: typography.family,
                    fontSize: typography.size.bodyMin,
                    fontWeight: typography.weight.regular,
                    color: "rgba(255,255,255,0.96)",
                  }}
                >
                  {it.label}
                </span>
                <span
                  style={{
                    fontFamily: typography.familyMono,
                    fontSize: typography.size.microCaps,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: it.visible ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.32)",
                    fontWeight: typography.weight.medium,
                  }}
                >
                  {it.visible ? "VISIBLE · K≥5" : "PRIVADO"}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </ScrollPad>
    </>
  );
}
