import { resolveOrg } from "../../../../server/tenancy";
import { db } from "../../../../server/db";
import { Progress } from "@/components/ui/Progress";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export const dynamic = "force-dynamic";

export default async function Onboarding() {
  const org = await resolveOrg();
  const client = db();
  const [memberCount, hasWebhook, hasApiKey, integrations] = await Promise.all([
    client.membership.count({ where: { orgId: org.id } }),
    client.webhook.count({ where: { orgId: org.id } }).then((n) => n > 0),
    client.apiKey.count({ where: { orgId: org.id, revokedAt: null } }).then((n) => n > 0),
    client.integration.findMany({ where: { orgId: org.id, enabled: true }, select: { provider: true } }),
  ]);
  const providerIds = new Set(integrations.map((i) => i.provider));
  const hasSso = ["okta", "azure-ad", "google-workspace"].some((p) => providerIds.has(p));
  const hasScim = org.ssoDomain != null && providerIds.has("okta");
  const branding = org.branding || {};
  const hasBranding = !!(branding.logoUrl || branding.primaryColor);

  const steps = [
    { id: "branding", label: "Configura marca y dominio custom", href: "/admin/branding", done: hasBranding },
    { id: "sso", label: "Conecta SSO (Okta / Azure AD / Google)", href: "/admin/integrations", done: hasSso },
    { id: "scim", label: "Habilita SCIM 2.0 para aprovisionamiento", href: "/admin/integrations", done: hasScim },
    { id: "members", label: `Invita a tu equipo (${memberCount} miembros)`, href: "/admin/members", done: memberCount > 1 },
    { id: "api", label: "Crea una API key", href: "/admin/api-keys", done: hasApiKey },
    { id: "hook", label: "Registra un webhook", href: "/admin/webhooks", done: hasWebhook },
    { id: "plan", label: "Confirma tu plan y facturación", href: "/admin/billing", done: org.plan !== "FREE" },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <article style={{
      maxWidth: 760,
      margin: "0 auto",
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
    }}>
      <h1 style={{
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
        margin: 0,
      }}>
        Configuración inicial
      </h1>
      <p style={{
        color: cssVar.textMuted,
        fontSize: font.size.sm,
        marginTop: space[2],
      }}>
        {done}/{steps.length} completados
      </p>

      <div style={{ marginTop: space[3] }}>
        <Progress value={done} max={steps.length} tone="accent" size="md" />
      </div>

      <ol style={{
        listStyle: "none",
        padding: 0,
        margin: `${space[5]}px 0 0`,
        display: "grid",
        gap: space[2],
      }}>
        {steps.map((s) => (
          <li
            key={s.id}
            style={{
              padding: space[3],
              border: `1px solid ${s.done ? cssVar.accent : cssVar.border}`,
              borderRadius: radius.md,
              background: s.done ? cssVar.accentSoft : cssVar.surface,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: space[3],
            }}
          >
            <span style={{
              color: s.done ? cssVar.accent : cssVar.text,
              fontWeight: font.weight.medium,
              display: "flex",
              alignItems: "center",
              gap: space[2],
            }}>
              <span aria-hidden style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: radius.full,
                background: s.done ? cssVar.accent : "transparent",
                color: s.done ? cssVar.accentInk : cssVar.textMuted,
                border: s.done ? "none" : `1px solid ${cssVar.border}`,
                fontSize: 12,
                fontWeight: font.weight.bold,
                flexShrink: 0,
              }}>
                {s.done ? "✓" : ""}
              </span>
              <span className="bi-sr-only">{s.done ? "Completado:" : "Pendiente:"}</span>
              {s.label}
            </span>
            <a
              href={s.href}
              style={{
                color: cssVar.accent,
                fontWeight: font.weight.semibold,
                fontSize: font.size.sm,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              {s.done ? "Revisar →" : "Ir →"}
            </a>
          </li>
        ))}
      </ol>
    </article>
  );
}
