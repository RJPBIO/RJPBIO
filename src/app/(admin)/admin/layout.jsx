import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getPrimaryBranding } from "@/lib/branding";
import AdminBackdrop from "@/components/admin/AdminBackdrop";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminCommandPalette from "@/components/admin/AdminCommandPalette";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/admin");
  const adminMemberships = (session.memberships || []).filter((m) => ["OWNER", "ADMIN"].includes(m.role));
  if (!adminMemberships.length) redirect("/app");

  // Sprint 7 polish — enforce requireMfa: si ALGÚN org del usuario lo
  // requiere y el usuario NO tiene MFA configurado, redirige a setup.
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
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
  }

  const branding = getPrimaryBranding(session.memberships || []);
  const primaryMembership = adminMemberships.find((m) => !m.org?.personal) || adminMemberships[0];
  const orgName = primaryMembership?.org?.name || branding?.orgName || "—";
  const plan = primaryMembership?.org?.plan;
  const role = primaryMembership?.role;

  return (
    <div className="bi-admin-shell">
      <AdminBackdrop />
      <AdminSidebar
        branding={branding}
        userEmail={session.user.email}
        userRole={role}
      />
      <main className="bi-admin-main">
        <AdminTopbar
          orgName={orgName}
          plan={plan}
          userName={session.user.name || session.user.email}
          userEmail={session.user.email}
          userRole={role}
        />
        <div className="bi-admin-content">
          {children}
        </div>
      </main>
      <AdminCommandPalette />
    </div>
  );
}
