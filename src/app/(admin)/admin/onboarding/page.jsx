import { resolveOrg } from "../../../../server/tenancy";
import { db } from "../../../../server/db";

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
  const hasScim = org.ssoDomain != null && providerIds.has("okta"); // SCIM se configura desde la integración
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
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <h1>Configuración inicial</h1>
      <p style={{ color: "#94A3B8" }}>{done}/{steps.length} completados</p>
      <div style={{ height: 6, background: "#1E293B", borderRadius: 3, marginTop: 8 }}>
        <div style={{ width: `${(done / steps.length) * 100}%`, height: "100%", background: "#10B981", borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <ol style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
        {steps.map((s) => (
          <li key={s.id} style={{ padding: 14, border: "1px solid #1E293B", borderRadius: 10, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: s.done ? "#34D399" : "#E2E8F0" }}>{s.done ? "✓ " : "○ "}{s.label}</span>
            <a href={s.href} style={{ color: "#10B981" }}>{s.done ? "Revisar" : "Ir"}</a>
          </li>
        ))}
      </ol>
    </article>
  );
}
