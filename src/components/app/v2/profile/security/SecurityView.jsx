"use client";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, StatLine, PillButton, TextLink, ScrollPad } from "../primitives";
import { typography, colors, spacing } from "../../tokens";
import { FIXTURE_SECURITY, relativeTime } from "../fixtures";

export default function SecurityView({ onBack, onNavigate }) {
  const sec = FIXTURE_SECURITY;
  return (
    <>
      <SubRouteHeader title="Seguridad" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>AUTENTICACIÓN DE DOS FACTORES</Kicker>
          <Card>
            <StatLine
              value={sec.mfaEnabled ? "MFA activo" : "MFA no configurado"}
              caption={sec.mfaEnabled ? `Configurado ${relativeTime(sec.mfaSetupTs)}` : "Recomendado para mayor seguridad"}
            />
            {sec.mfaEnabled ? (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <PillButton variant="outlined" onClick={() => onNavigate && onNavigate({ action: "mfa-backup-codes" })}>
                  Ver códigos de respaldo
                </PillButton>
                <TextLink onClick={() => onNavigate && onNavigate({ action: "mfa-disable" })}>
                  DESACTIVAR MFA
                </TextLink>
              </div>
            ) : (
              <PillButton onClick={() => onNavigate && onNavigate({ action: "mfa-setup" })}>
                Configurar TOTP
              </PillButton>
            )}
          </Card>
        </Section>

        <Section>
          <Kicker>SESIONES ACTIVAS</Kicker>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {sec.sessions.map((s, i) => (
              <li
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.s16,
                  paddingBlock: 14,
                  borderBlockEnd: i === sec.sessions.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
                }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: typography.family,
                      fontSize: typography.size.bodyMin,
                      fontWeight: typography.weight.medium,
                      color: "rgba(255,255,255,0.96)",
                    }}
                  >
                    {s.device}{s.current ? " · esta sesión" : ""}
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
                    {s.location} · {relativeTime(s.lastSeen)}
                  </span>
                </span>
                {!s.current && (
                  <TextLink onClick={() => onNavigate && onNavigate({ action: "revoke-session", id: s.id })}>
                    CERRAR SESIÓN
                  </TextLink>
                )}
              </li>
            ))}
          </ul>
        </Section>

        <Section paddingBottom={48}>
          <Kicker>DISPOSITIVOS CONFIABLES</Kicker>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {sec.trustedDevices.map((d, i) => (
              <li
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.s16,
                  paddingBlock: 14,
                  borderBlockEnd: i === sec.trustedDevices.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
                }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: typography.family,
                      fontSize: typography.size.bodyMin,
                      fontWeight: typography.weight.medium,
                      color: "rgba(255,255,255,0.96)",
                    }}
                  >
                    {d.label}
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
                    Agregado {relativeTime(d.addedTs)}
                  </span>
                </span>
                <TextLink onClick={() => onNavigate && onNavigate({ action: "remove-trusted-device", id: d.id })}>
                  QUITAR
                </TextLink>
              </li>
            ))}
          </ul>
        </Section>
      </ScrollPad>
    </>
  );
}
