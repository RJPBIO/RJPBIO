export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import SsoClient from "./SsoClient";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "SSO · Admin" };

export default async function SsoPage() {
  const session = await auth();
  // SOLO OWNER puede ver/configurar SSO — security-critical
  const ownerMembership = (session?.memberships || []).find(
    (m) => m.role === "OWNER" && m.org && !m.org.personal
  );
  if (!ownerMembership) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          SSO no disponible
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Solo el OWNER del organización puede configurar federation. Si necesitas habilitarlo,
          pídele al owner que lo configure desde aquí.
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
      ssoDomain: true,
      ssoProvider: true,
      ssoMetadata: true,
      plan: true,
    },
  });
  if (!org) return null;

  return (
    <SsoClient
      orgId={org.id}
      orgName={org.name}
      plan={org.plan}
      initial={{
        domain: org.ssoDomain || "",
        provider: org.ssoProvider || "",
        metadata: org.ssoMetadata || null,
      }}
    />
  );
}
