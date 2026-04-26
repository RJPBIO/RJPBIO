export const dynamic = "force-dynamic";
import { auth } from "@/server/auth";
import { listAllMaintenances, isPlatformAdmin } from "@/server/maintenance";
import MaintenanceClient from "./MaintenanceClient";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "Maintenance · Admin" };

export default async function MaintenancePage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!isPlatformAdmin(session.user.email)) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          Maintenance windows — platform admin only
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Solo emails en <code>PLATFORM_ADMIN_EMAILS</code> pueden programar maintenance.
        </p>
      </main>
    );
  }

  const rows = await listAllMaintenances({ limit: 200 });
  const windows = rows.map((w) => ({
    id: w.id, title: w.title, body: w.body,
    status: w.status, components: w.components || [],
    scheduledStart: w.scheduledStart.toISOString(),
    scheduledEnd: w.scheduledEnd.toISOString(),
    actualStart: w.actualStart ? w.actualStart.toISOString() : null,
    actualEnd: w.actualEnd ? w.actualEnd.toISOString() : null,
    notifiedT24: w.notifiedT24,
    notifiedT0: w.notifiedT0,
    notifiedComplete: w.notifiedComplete,
  }));

  return <MaintenanceClient initial={windows} />;
}
