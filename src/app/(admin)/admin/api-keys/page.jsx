import { auth } from "../../../../server/auth";
import { resolveOrg } from "../../../../server/tenancy";
import { requireMembership } from "../../../../server/rbac";
import { db } from "../../../../server/db";
import { mintApiKey } from "../../../../server/apikey";
import { auditLog } from "../../../../server/audit";

export const dynamic = "force-dynamic";

async function createKey(formData) {
  "use server";
  const session = await auth();
  const org = await resolveOrg();
  const guard = await requireMembership(session, org.id, "apikey.create");
  if (guard) return;
  const name = formData.get("name");
  const scopes = (formData.get("scopes") || "read:sessions").toString().split(",").map((s) => s.trim());
  const { raw } = await mintApiKey(org.id, name, scopes);
  await auditLog({ orgId: org.id, actorId: session.user.id, action: "apikey.created", payload: { name, scopes } });
  return { raw };
}

async function revokeKey(formData) {
  "use server";
  const session = await auth();
  const org = await resolveOrg();
  const guard = await requireMembership(session, org.id, "apikey.revoke");
  if (guard) return;
  const id = formData.get("id");
  await db().apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  await auditLog({ orgId: org.id, actorId: session.user.id, action: "apikey.revoked", target: id });
}

export default async function ApiKeys() {
  const org = await resolveOrg();
  const keys = await db().apiKey.findMany({ where: { orgId: org.id }, orderBy: { createdAt: "desc" } });
  return (
    <article style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <h1>API keys</h1>
      <form action={createKey} style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <input name="name" required placeholder="Nombre" style={inp} />
        <input name="scopes" defaultValue="read:sessions" style={inp} />
        <button style={btn}>Crear</button>
      </form>
      <p style={{ color: "#64748B", fontSize: 12 }}>La clave solo se muestra una vez al crearse.</p>
      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr style={{ textAlign: "left", color: "#64748B" }}><th>Nombre</th><th>Scopes</th><th>Creada</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.id} style={{ borderTop: "1px solid #1E293B" }}>
              <td style={{ padding: "8px 0" }}>{k.name}</td>
              <td style={{ color: "#94A3B8" }}>{(k.scopes || []).join(", ")}</td>
              <td>{new Date(k.createdAt).toLocaleDateString()}</td>
              <td>{k.revokedAt ? "Revocada" : "Activa"}</td>
              <td>{!k.revokedAt && <form action={revokeKey}><input type="hidden" name="id" value={k.id} /><button style={{ background: "transparent", color: "#F87171", border: "none" }}>Revocar</button></form>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

const inp = { flex: 1, padding: "8px 10px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" };
const btn = { padding: "8px 14px", background: "#10B981", border: "none", borderRadius: 8, color: "#fff" };
