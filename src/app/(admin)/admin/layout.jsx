import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export const metadata = { title: "Admin" };

const NAV = [
  { href: "/admin", label: "General" },
  { href: "/admin/members", label: "Miembros" },
  { href: "/admin/teams", label: "Equipos" },
  { href: "/admin/billing", label: "Facturación" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/api-keys", label: "API Keys" },
  { href: "/admin/webhooks", label: "Webhooks" },
  { href: "/admin/integrations", label: "Integraciones" },
  { href: "/admin/stations", label: "Estaciones" },
  { href: "/admin/audit", label: "Auditoría" },
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
        <nav>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} style={navStyle} prefetch>
              {n.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 32, fontSize: 11, color: "#6EE7B7" }}>
          {session.user.email}
        </div>
      </aside>
      <section style={{ padding: "28px 36px" }}>{children}</section>
    </div>
  );
}

const navStyle = {
  display: "block", padding: "10px 12px", margin: "2px 0",
  color: "#A7F3D0", textDecoration: "none", borderRadius: 10, fontSize: 14,
};
