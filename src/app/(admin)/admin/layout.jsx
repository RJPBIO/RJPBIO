import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import NotificationsBell from "@/components/ui/NotificationsBell";
import AdminNavLink from "@/components/ui/AdminNavLink";
import { getPrimaryBranding } from "@/lib/branding";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const GROUPS = [
  { label: "General", items: [
    { href: "/admin", label: "Resumen" },
  ]},
  { label: "Personas", items: [
    { href: "/admin/members", label: "Miembros" },
    { href: "/admin/teams", label: "Equipos" },
    { href: "/admin/onboarding", label: "Onboarding" },
  ]},
  { label: "Seguridad", items: [
    { href: "/admin/security/policies", label: "Políticas" },
    { href: "/admin/security/sessions", label: "Sesiones" },
    { href: "/admin/security", label: "Reset de MFA" },
    { href: "/admin/sso", label: "SSO" },
    { href: "/admin/audit", label: "Auditoría" },
    { href: "/admin/audit/settings", label: "Audit settings" },
    { href: "/admin/api-keys", label: "API Keys" },
    { href: "/admin/integrations", label: "Integraciones" },
  ]},
  { label: "Producto", items: [
    { href: "/admin/branding", label: "Branding" },
    { href: "/admin/webhooks", label: "Webhooks" },
    { href: "/admin/stations", label: "Estaciones" },
  ]},
  { label: "Cumplimiento", items: [
    { href: "/admin/nom35", label: "NOM-035" },
    { href: "/admin/nom35/documento", label: "Documento oficial" },
    { href: "/admin/compliance/dsar", label: "DSAR" },
  ]},
  { label: "Cuenta", items: [
    { href: "/admin/billing", label: "Facturación" },
  ]},
];

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/admin");
  const adminOrgs = (session.memberships || []).filter((m) => ["OWNER", "ADMIN"].includes(m.role));
  if (!adminOrgs.length) redirect("/app");

  // Sprint 7 polish — enforce requireMfa: si ALGÚN org del usuario lo
  // requiere y el usuario NO tiene MFA configurado, redirige a setup.
  // Excepción: la propia página de MFA setup, para no loop.
  // Best-effort: si la DB falla, dejamos pasar (no bloquear admin por race).
  try {
    const policies = Array.isArray(session.securityPolicies) ? session.securityPolicies : [];
    const orgRequiresMfa = policies.some((p) => p?.requireMfa);
    if (orgRequiresMfa) {
      const orm = await db();
      const user = await orm.user.findUnique({
        where: { id: session.user.id },
        select: { mfaEnabled: true },
      });
      if (!user?.mfaEnabled) {
        redirect("/settings/security/mfa?reason=org-required");
      }
    }
  } catch (e) {
    // Si es un Next redirect, re-throw (no es error, es navegación).
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
    // DB error: continuar sin enforce. La policy se aplica al próximo
    // load cuando la DB esté disponible.
  }

  // Sprint 11 — branding white-label. Si el primer org no-personal tiene
  // logoUrl o customDomain custom, lo usamos en el header del nav.
  // mergeBrandingDefaults retorna defaults si está vacío → no hay
  // sorpresas.
  const branding = getPrimaryBranding(session.memberships || []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100dvh", background: "#0B0E14", color: "#ECFDF5" }}>
      <aside style={{ borderRight: "1px solid #064E3B", padding: 20, background: "#052E16" }}>
        {branding?.logoUrl ? (
          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src={branding.logoUrl}
              alt={branding.orgName || "logo"}
              style={{ maxHeight: 32, maxWidth: 180, objectFit: "contain" }}
            />
          </div>
        ) : (
          <div style={{ fontWeight: 800, letterSpacing: 2, marginBottom: 24 }}>
            {branding?.orgName ? branding.orgName.toUpperCase() : "BIO-IGN · ADMIN"}
          </div>
        )}
        <nav aria-label="Secciones de administración">
          {GROUPS.map((g) => (
            <div key={g.label} style={{ marginBottom: 16 }}>
              <div style={groupLabel}>{g.label}</div>
              {g.items.map((n) => (
                <AdminNavLink
                  key={n.href}
                  href={n.href}
                  style={navStyle}
                  activeStyle={branding?.accentColor
                    ? { ...navActiveStyle, background: `${branding.accentColor}30`, color: "#ECFDF5" }
                    : navActiveStyle}
                >
                  {n.label}
                </AdminNavLink>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 20, fontSize: 11, color: "#6EE7B7", borderBlockStart: "1px solid #064E3B", paddingBlockStart: 14 }}>
          {session.user.email}
        </div>
      </aside>
      <section style={{ padding: "28px 36px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <NotificationsBell />
        </div>
        {children}
      </section>
    </div>
  );
}

const navStyle = {
  display: "block", padding: "8px 12px", margin: "2px 0",
  color: "#A7F3D0", textDecoration: "none", borderRadius: 10, fontSize: 14,
};
const navActiveStyle = {
  background: "#064E3B", color: "#ECFDF5", fontWeight: 700,
};
const groupLabel = {
  fontSize: 10, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700,
  color: "#6EE7B7", padding: "0 12px 6px", marginBlockStart: 4,
};
