"use client";
import { useStore } from "@/store/useStore";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Card, ScrollPad, TextLink } from "../primitives";
import { typography, colors, spacing } from "../../tokens";

// Phase 6D SP3 — fixtures cleanup. Antes leía FIXTURE_PRIVACY (orgs hard-
// coded "Cuenta personal" + permisos owner) y FIXTURE_PRIVACY_B2B (Acme
// pre-mockeado con admin access). Ahora deriva del store:
//
//   - El user actual SIEMPRE tiene "Cuenta personal" (user-level org).
//   - Memberships B2B se cargan desde backend en el futuro (SP4 wires
//     el endpoint /api/v1/users/me/memberships). Hasta entonces NO
//     mostramos orgs falsas.
//
// El contenido educativo (k≥5, "qué ve tu empresa") es copy del producto,
// no fixture — se mantiene íntegro porque comunica la política de privacidad
// real de Bio-Ignición.
//
// devOverride b2b sigue funcional vía prop b2b: muestra link "IR A CONSOLA
// ADMIN" para preview, pero NO inyecta orgs falsas en la lista.

export default function PrivacyView({ onBack, onNavigate, b2b = false }) {
  // Memberships hasta SP4 wire al endpoint real: solo personal-1.
  // El user real, una vez SP4 conecte useSession, verá sus orgs B2B
  // reales aquí. Por ahora cero invención.
  const userEmail = useStore((s) => s._userEmail);
  const memberships = buildMemberships({ userEmail, b2b });

  return (
    <>
      <SubRouteHeader title="Privacidad y empresa" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>MIS MEMBRESÍAS</Kicker>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {memberships.map((m, i) => (
              <li
                key={m.orgId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.s16,
                  paddingBlock: 14,
                  borderBlockEnd: i === memberships.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
                }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: typography.family,
                      fontSize: typography.size.bodyMin,
                      fontWeight: typography.weight.medium,
                      color: colors.text.primary,
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
                      color: colors.text.secondary,
                      fontWeight: typography.weight.medium,
                    }}
                  >
                    ROL · {m.role}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {b2b && (
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
                color: colors.text.primary,
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
                    color: colors.text.primary,
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
                    color: it.visible ? colors.text.secondary : colors.text.muted,
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

// Phase 6D SP3 — defaults conservadores. Personal-org siempre presente
// (toda cuenta tiene un personal-org como user-level container). Orgs B2B
// se cargarán desde backend en SP4 (devOverride b2b=true sigue mostrando
// preview de "Acme · admin" pero solo cuando explícitamente habilitado).
function buildMemberships({ userEmail, b2b }) {
  const list = [
    { orgId: "personal-1", orgName: "Cuenta personal", role: "OWNER" },
  ];
  if (b2b) {
    list.push({ orgId: "preview-org", orgName: "Empresa (preview)", role: "ADMIN" });
  }
  return list;
}
