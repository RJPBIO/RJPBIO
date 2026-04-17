import { auth } from "../../../../server/auth";
import { db } from "../../../../server/db";

export const dynamic = "force-dynamic";

async function revoke(formData) {
  "use server";
  const id = formData.get("id");
  await db().session.delete({ where: { id } }).catch(() => {});
}

export default async function Sessions() {
  const session = await auth();
  if (!session?.user) return null;
  const items = await db().session.findMany({ where: { userId: session.user.id }, orderBy: { expires: "desc" } });
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
              <td><form action={revoke}><input type="hidden" name="id" value={s.id} /><button style={{ background: "transparent", color: "#F87171", border: "none", cursor: "pointer" }}>Revocar</button></form></td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr style={{ margin: "32px 0", border: "none", borderTop: "1px solid #1E293B" }} />
      <h2 style={{ fontSize: 18 }}>Mis datos</h2>
      <p style={{ color: "#94A3B8" }}>Descarga todo tu historial (GDPR Art. 15 / LFPDPPP Art. 22).</p>
      <a href="/api/v1/users/me/export" style={{ display: "inline-block", marginRight: 12, padding: "8px 14px", background: "#10B981", color: "#fff", borderRadius: 8, textDecoration: "none" }}>Descargar mis datos</a>
      <form action="/api/v1/users/me" method="DELETE" style={{ display: "inline" }}>
        <button type="submit" style={{ padding: "8px 14px", background: "transparent", color: "#F87171", border: "1px solid #7F1D1D", borderRadius: 8, cursor: "pointer" }}>Borrar mi cuenta</button>
      </form>
    </article>
  );
}
