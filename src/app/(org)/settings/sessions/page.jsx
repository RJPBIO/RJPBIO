import { auth } from "../../../../server/auth";
import { db } from "../../../../server/db";
import { auditLog } from "../../../../server/audit";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function revoke(formData) {
  "use server";
  const id = formData.get("id");
  const orm = await db();
  await orm.session.delete({ where: { id } }).catch(() => {});
}

async function deleteAccount() {
  "use server";
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const userId = session.user.id;
  const orm = await db();
  await orm.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      email: `deleted-${userId}@bio-ignicion.local`,
      name: null,
      image: null,
    },
  });
  const memberships = await orm.membership.findMany({ where: { userId } });
  for (const m of memberships) {
    await auditLog({
      orgId: m.orgId, actorId: userId,
      action: "user.deletion.requested", target: userId, payload: { graceDays: 30 },
    }).catch(() => {});
  }
  await orm.session.deleteMany({ where: { userId } }).catch(() => {});
  redirect("/signin?deleted=1");
}

export default async function Sessions() {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/settings/sessions");
  const orm = await db();
  const items = await orm.session.findMany({
    where: { userId: session.user.id }, orderBy: { expires: "desc" },
  });
  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <h1>Sesiones activas</h1>
      <p style={{ color: "#94A3B8" }}>Revoca cualquier sesión que no reconozcas.</p>
      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr style={{ textAlign: "left", color: "#64748B" }}><th>ID</th><th>Expira</th><th></th></tr></thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} style={{ borderTop: "1px solid #1E293B" }}>
              <td style={{ padding: "8px 0", fontFamily: "ui-monospace" }}>{s.id.slice(0, 12)}…</td>
              <td>{new Date(s.expires).toLocaleString()}</td>
              <td>
                <form action={revoke}>
                  <input type="hidden" name="id" value={s.id} />
                  <button style={{ background: "transparent", color: "#F87171", border: "none", cursor: "pointer" }}>Revocar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr style={{ margin: "32px 0", border: "none", borderTop: "1px solid #1E293B" }} />
      <h2 style={{ fontSize: 18 }}>Mis datos</h2>
      <p style={{ color: "#94A3B8" }}>Descarga todo tu historial (GDPR Art. 15 / LFPDPPP Art. 22).</p>
      <a href="/api/v1/users/me/export" style={{ display: "inline-block", marginRight: 12, padding: "8px 14px", background: "#10B981", color: "#fff", borderRadius: 8, textDecoration: "none" }}>Descargar mis datos</a>
      <form action={deleteAccount} style={{ display: "inline" }}>
        <button type="submit" style={{ padding: "8px 14px", background: "transparent", color: "#F87171", border: "1px solid #7F1D1D", borderRadius: 8, cursor: "pointer" }}>Borrar mi cuenta</button>
      </form>
    </article>
  );
}
