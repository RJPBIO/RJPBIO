export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import BrandingClient from "./BrandingClient";
import { cssVar, font, space } from "@/components/ui/tokens";
import { mergeBrandingDefaults } from "@/lib/branding";

export const metadata = { title: "Branding · Admin" };

export default async function BrandingPage() {
  const session = await auth();
  // Solo OWNER puede modificar branding (escritura). ADMIN puede ver
  // la página (preview + plan info) pero el form está disabled vía API
  // que devuelve 403.
  const ownerOrAdmin = (session?.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && m.org && !m.org.personal
  );
  if (!ownerOrAdmin) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          Branding no disponible
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Solo OWNER o ADMIN del org puede ver branding (escritura solo OWNER).
        </p>
      </main>
    );
  }

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: ownerOrAdmin.orgId },
    select: { id: true, name: true, branding: true, plan: true },
  });
  if (!org) return null;

  return (
    <BrandingClient
      orgId={org.id}
      orgName={org.name}
      plan={org.plan}
      canEdit={ownerOrAdmin.role === "OWNER"}
      initial={mergeBrandingDefaults(org.branding)}
    />
  );
}
