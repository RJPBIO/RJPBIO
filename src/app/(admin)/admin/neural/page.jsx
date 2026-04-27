export const dynamic = "force-dynamic";
import { auth } from "@/server/auth";
import { resolveOrg } from "@/server/tenancy";
import { getOrgNeuralHealth } from "@/server/neural-org-stats";
import NeuralClient from "./NeuralClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { cssVar } from "@/components/ui/tokens";

export const metadata = { title: "Motor neural · Admin" };

export default async function NeuralAdminPage() {
  const session = await auth();
  if (!session?.user) return null;
  const memberships = session?.memberships || [];
  const b2bMembership = memberships.find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && m.org && !m.org.personal
  ) || memberships.find((m) => ["OWNER", "ADMIN"].includes(m.role));
  if (!b2bMembership?.orgId) return null;

  const orgId = b2bMembership.orgId;
  const health = await getOrgNeuralHealth(orgId);

  const orgName = b2bMembership.org?.name || "tu organización";

  return (
    <article style={{ color: cssVar.text }}>
      <PageHeader
        eyebrow="Producto · motor adaptativo"
        italic="Cómo aprende"
        title="el motor en tu organización."
        subtitle={`Salud agregada del motor adaptativo a través de los miembros activos de ${orgName}. Datos suprimidos si k<5 (privacidad por diseño).`}
      />
      <NeuralClient health={health} />
    </article>
  );
}
