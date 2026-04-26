export const dynamic = "force-dynamic";
import { auth } from "@/server/auth";
import { gatherHealthSnapshot, isPlatformAdmin } from "@/server/health";
import HealthClient from "./HealthClient";
import { cssVar, font, space } from "@/components/ui/tokens";

export const metadata = { title: "Health · Admin" };

export default async function HealthPage() {
  const session = await auth();
  if (!session?.user) return null;
  if (!isPlatformAdmin(session.user.email)) {
    return (
      <main style={{ padding: space[6], color: cssVar.text }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.bold, margin: 0 }}>
          Health monitoring — platform admin only
        </h1>
        <p style={{ color: cssVar.textMuted, marginTop: space[2] }}>
          Esta sección agrega métricas de toda la plataforma. Solo accesible
          si tu email está en <code>PLATFORM_ADMIN_EMAILS</code>.
        </p>
      </main>
    );
  }

  const snapshot = await gatherHealthSnapshot();
  return <HealthClient initial={snapshot} />;
}
