export const dynamic = "force-dynamic";
import { auth } from "@/server/auth";
import { getCompliancePackForOrg } from "@/server/compliance";
import ComplianceClient from "./ComplianceClient";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "Compliance · Admin" };

export default async function CompliancePage() {
  const session = await auth();
  const adminMembership = (session?.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && m.org && !m.org.personal
  );
  if (!adminMembership) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          Compliance no disponible
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Solo OWNER o ADMIN del org puede ver el dashboard de compliance.
        </p>
      </main>
    );
  }

  const pack = await getCompliancePackForOrg(adminMembership.orgId, {
    actorUserId: session.user.id,
  });
  if (!pack) return null;

  return (
    <ComplianceClient
      orgId={adminMembership.orgId}
      orgName={pack.org?.name || "este org"}
      pack={pack}
    />
  );
}
