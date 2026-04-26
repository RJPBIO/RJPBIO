export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import PoliciesClient from "./PoliciesClient";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "Políticas de seguridad · Admin" };

export default async function PoliciesPage() {
  const session = await auth();
  // Solo OWNER toca policies — security-critical (igual que SSO).
  const ownerMembership = (session?.memberships || []).find(
    (m) => m.role === "OWNER" && m.org && !m.org.personal
  );
  if (!ownerMembership) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          Políticas no disponibles
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Solo el OWNER del organización puede configurar políticas de seguridad
          (MFA obligatorio, allowlist de IPs, TTL de sesión). Si necesitas habilitarlas,
          pídele al owner que lo haga desde aquí.
        </p>
      </main>
    );
  }

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: ownerMembership.orgId },
    select: {
      id: true,
      name: true,
      plan: true,
      requireMfa: true,
      sessionMaxAgeMinutes: true,
      ipAllowlist: true,
      ipAllowlistEnabled: true,
    },
  });
  if (!org) return null;

  return (
    <PoliciesClient
      orgId={org.id}
      orgName={org.name}
      plan={org.plan}
      initial={{
        requireMfa: !!org.requireMfa,
        sessionMaxAgeMinutes: org.sessionMaxAgeMinutes,
        ipAllowlist: org.ipAllowlist || [],
        ipAllowlistEnabled: !!org.ipAllowlistEnabled,
      }}
    />
  );
}
