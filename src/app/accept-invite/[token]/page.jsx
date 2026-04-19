import { db } from "../../../server/db";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export const dynamic = "force-dynamic";

export default async function AcceptInvite({ params }) {
  const { token } = await params;
  const inv = await db().invitation.findUnique({ where: { token } }).catch(() => null);
  const expired = inv && inv.expiresAt && new Date(inv.expiresAt) < new Date();

  return (
    <main style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      background: cssVar.bg,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
      padding: space[5],
    }}>
      <div style={{
        maxWidth: 420,
        width: "100%",
        padding: space[6],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.lg,
        display: "grid",
        gap: space[3],
      }}>
        {!inv && (
          <>
            <h1 style={titleStyle}>Invitación no encontrada</h1>
            <p style={{ color: cssVar.textMuted, margin: 0 }}>
              El enlace no es válido o ya fue usado.
            </p>
          </>
        )}
        {inv && expired && (
          <>
            <h1 style={titleStyle}>Invitación expirada</h1>
            <p style={{ color: cssVar.textMuted, margin: 0 }}>
              Esta invitación expiró. Pide una nueva al admin.
            </p>
          </>
        )}
        {inv && !expired && (
          <form method="POST" action={`/api/v1/invitations/${token}/accept`} style={{ display: "grid", gap: space[3] }}>
            <h1 style={titleStyle}>Invitación a unirse</h1>
            <p style={{ color: cssVar.textMuted, margin: 0, display: "flex", alignItems: "center", gap: space[2] }}>
              Rol: <Badge variant="accent" size="sm">{inv.role}</Badge>
            </p>
            <Button type="submit" variant="primary" block>Aceptar</Button>
          </form>
        )}
      </div>
    </main>
  );
}

const titleStyle = {
  fontSize: font.size.xl,
  fontWeight: font.weight.bold,
  letterSpacing: font.tracking.tight,
  margin: 0,
};
