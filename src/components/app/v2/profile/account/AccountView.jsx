"use client";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, PillButton, TextLink, ScrollPad, Row } from "../primitives";
import { typography, spacing, colors } from "../../tokens";
import { FIXTURE_ACCOUNT } from "../fixtures";

export default function AccountView({ onBack, onNavigate }) {
  const acc = FIXTURE_ACCOUNT;
  return (
    <>
      <SubRouteHeader title="Cuenta" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>EMAIL</Kicker>
          <Card>
            <span
              style={{
                fontFamily: typography.family,
                fontSize: typography.size.body,
                fontWeight: typography.weight.regular,
                color: "rgba(255,255,255,0.96)",
              }}
            >
              {acc.email}
            </span>
            <PillButton variant="outlined" onClick={() => onNavigate && onNavigate({ action: "change-email" })}>
              Cambiar email
            </PillButton>
          </Card>
        </Section>

        {acc.hasPassword && (
          <Section>
            <Kicker>CONTRASEÑA</Kicker>
            <Card>
              <span
                style={{
                  fontFamily: typography.family,
                  fontSize: typography.size.body,
                  fontWeight: typography.weight.regular,
                  color: "rgba(255,255,255,0.96)",
                }}
              >
                Última actualización hace tiempo
              </span>
              <PillButton variant="outlined" onClick={() => onNavigate && onNavigate({ action: "change-password" })}>
                Cambiar contraseña
              </PillButton>
            </Card>
          </Section>
        )}

        <Section>
          <Kicker>PROVEEDORES VINCULADOS</Kicker>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {acc.linkedProviders.map((p, i, arr) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.s16,
                  paddingBlock: 14,
                  borderBlockEnd: i === arr.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
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
                    {p.label}
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
                    {p.sub}
                  </span>
                </span>
                <TextLink onClick={() => onNavigate && onNavigate({ action: "unlink-provider", id: p.id })}>
                  DESVINCULAR
                </TextLink>
              </li>
            ))}
          </ul>
        </Section>

        <Section paddingBottom={48}>
          <Kicker>SESIÓN</Kicker>
          <Card>
            <PillButton variant="outlined" onClick={() => onNavigate && onNavigate({ action: "signout-current" })}>
              Cerrar sesión en este dispositivo
            </PillButton>
            <TextLink onClick={() => onNavigate && onNavigate({ action: "signout-all" })}>
              CERRAR SESIÓN EN TODOS LOS DISPOSITIVOS
            </TextLink>
          </Card>
        </Section>
      </ScrollPad>
    </>
  );
}
