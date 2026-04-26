export const dynamic = "force-dynamic";
import { auth } from "@/server/auth";
import { listSessionsForOrg } from "@/server/org-sessions";
import OrgSessionsClient from "./OrgSessionsClient";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "Sesiones del org · Admin" };

export default async function OrgSessionsPage() {
  const session = await auth();
  const adminMembership = (session?.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && m.org && !m.org.personal
  );
  if (!adminMembership) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          Sesiones del org
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Solo OWNER o ADMIN del org puede ver y revocar sesiones de members.
        </p>
      </main>
    );
  }

  const { groups, total } = await listSessionsForOrg(adminMembership.orgId);
  // Date → ISO para serializar a Client component
  const serialized = groups.map((g) => ({
    ...g,
    sessions: g.sessions.map((s) => ({
      ...s,
      createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
      lastSeenAt: s.lastSeenAt instanceof Date ? s.lastSeenAt.toISOString() : s.lastSeenAt,
      expiresAt: s.expiresAt instanceof Date ? s.expiresAt.toISOString() : s.expiresAt,
      revokedAt: s.revokedAt instanceof Date ? s.revokedAt.toISOString() : s.revokedAt,
    })),
  }));

  return (
    <OrgSessionsClient
      orgId={adminMembership.orgId}
      orgName={adminMembership.org?.name || "este org"}
      actorRole={adminMembership.role}
      actorUserId={session.user.id}
      currentJti={session.jti || null}
      initialGroups={serialized}
      initialTotal={total}
    />
  );
}
