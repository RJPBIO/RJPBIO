import { db } from "../../../server/db";

export const dynamic = "force-dynamic";

export default async function AcceptInvite({ params }) {
  const { token } = await params;
  const inv = await db().invitation.findUnique({ where: { token } }).catch(() => null);
  const expired = inv && inv.expiresAt && new Date(inv.expiresAt) < new Date();
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 420, padding: 32, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16 }}>
        {!inv && <p>Invitación no encontrada.</p>}
        {inv && expired && <p>Esta invitación expiró. Pide una nueva al admin.</p>}
        {inv && !expired && (
          <form method="POST" action={`/api/v1/invitations/${token}/accept`}>
            <h1 style={{ fontSize: 20 }}>Invitación a unirse</h1>
            <p style={{ color: "#94A3B8" }}>Rol: <b>{inv.role}</b></p>
            <button type="submit" style={{ marginTop: 16, padding: 10, width: "100%", background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600 }}>Aceptar</button>
          </form>
        )}
      </div>
    </main>
  );
}
