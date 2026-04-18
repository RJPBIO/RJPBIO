import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export const metadata = { title: "Admin" };

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
    { href: "/admin/audit", label: "Auditoría" },
    { href: "/admin/api-keys", label: "API Keys" },
    { href: "/admin/integrations", label: "Integraciones" },
  ]},
  { label: "Producto", items: [
    { href: "/admin/branding", label: "Branding" },
    { href: "/admin/webhooks", label: "Webhooks" },
    { href: "/admin/stations", label: "Estaciones" },
  ]},
  { label: "Cuenta", items: [
    { href: "/admin/billing", label: "Facturación" },
  ]},
];

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin");
  const adminOrgs = (session.memberships || []).filter((m) => ["OWNER", "ADMIN"].includes(m.role));
  if (!adminOrgs.length) redirect("/");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100dvh", background: "#0B0E14", color: "#ECFDF5" }}>
      <aside style={{ borderRight: "1px solid #064E3B", padding: 20, background: "#052E16" }}>
        <div style={{ fontWeight: 800, letterSpacing: 2, marginBottom: 24 }}>BIO-IGN · ADMIN</div>
        <nav aria-label="Secciones de administración">
          {GROUPS.map((g) => (
            <div key={g.label} style={{ marginBottom: 16 }}>
              <div style={groupLabel}>{g.label}</div>
              {g.items.map((n) => (
                <Link key={n.href} href={n.href} style={navStyle} prefetch>
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 20, fontSize: 11, color: "#6EE7B7", borderBlockStart: "1px solid #064E3B", paddingBlockStart: 14 }}>
          {session.user.email}
        </div>
      </aside>
      <section style={{ padding: "28px 36px" }}>{children}</section>
    </div>
  );
}

const navStyle = {
  display: "block", padding: "8px 12px", margin: "2px 0",
  color: "#A7F3D0", textDecoration: "none", borderRadius: 10, fontSize: 14,
};
const groupLabel = {
  fontSize: 10, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700,
  color: "#6EE7B7", padding: "0 12px 6px", marginBlockStart: 4,
};
