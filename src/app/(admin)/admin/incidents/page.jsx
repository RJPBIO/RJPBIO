export const dynamic = "force-dynamic";
import { auth } from "@/server/auth";
import { listAllIncidents, isPlatformAdmin } from "@/server/incidents";
import IncidentsClient from "./IncidentsClient";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "Incidents · Admin" };

export default async function IncidentsPage() {
  const session = await auth();
  if (!session?.user) return null;

  if (!isPlatformAdmin(session.user.email)) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          Incidents — platform admin only
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Esta sección controla el status page público de BIO-IGNICIÓN para
          todos los tenants. Solo accesible si tu email está en
          <code style={{ marginInline: 4 }}>PLATFORM_ADMIN_EMAILS</code>.
        </p>
      </main>
    );
  }

  const rows = await listAllIncidents({ limit: 200 });
  const incidents = rows.map((i) => ({
    id: i.id,
    title: i.title,
    body: i.body,
    status: i.status,
    severity: i.severity,
    components: i.components || [],
    startedAt: i.startedAt.toISOString(),
    resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null,
    updates: (i.updates || []).map((u) => ({
      id: u.id,
      status: u.status,
      body: u.body,
      createdAt: u.createdAt.toISOString(),
    })),
  }));

  return <IncidentsClient initial={incidents} />;
}
