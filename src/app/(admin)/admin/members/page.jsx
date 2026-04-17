import { db } from "@/server/db";
import { auth } from "@/server/auth";

export default async function MembersPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER","ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const memberships = await orm.membership.findMany({ where: { orgId } });
  const rows = await Promise.all(memberships.map(async (m) => {
    const u = await orm.user.findUnique({ where: { id: m.userId } });
    return { ...m, email: u?.email, name: u?.name };
  }));

  return (
    <>
      <h1>Miembros ({rows.length})</h1>
      <form action="/api/invite" method="post" style={{ display: "flex", gap: 8, margin: "12px 0 24px" }}>
        <input name="email" type="email" placeholder="email@empresa.com" required style={input} />
        <select name="role" style={input}>
          <option value="MEMBER">Member</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <button style={btn}>Invitar</button>
      </form>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr><th>Email</th><th>Nombre</th><th>Rol</th><th>Desde</th><th>SCIM</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.email}</td><td>{r.name || "—"}</td><td>{r.role}</td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td>{r.scimId ? "✓" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

const input = { padding: "10px 12px", borderRadius: 10, background: "#052E16", color: "#ECFDF5", border: "1px solid #064E3B" };
const btn = { ...input, background: "linear-gradient(135deg,#059669,#10B981)", border: 0, cursor: "pointer", fontWeight: 700 };
