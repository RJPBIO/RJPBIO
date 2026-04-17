import { auth } from "../../../../server/auth";
import { resolveOrg } from "../../../../server/tenancy";
import { requireMembership } from "../../../../server/rbac";
import { db } from "../../../../server/db";
import { writeAudit } from "../../../../server/audit";
import { randomUUID, randomBytes } from "node:crypto";

export const dynamic = "force-dynamic";

async function createHook(formData) {
  "use server";
  const session = await auth();
  const org = await resolveOrg();
  const guard = await requireMembership(session, org.id, "webhook.create");
  if (guard) return;
  await db().webhook.create({
    data: {
      id: randomUUID(),
      orgId: org.id,
      url: formData.get("url"),
      secret: "whsec_" + randomBytes(24).toString("base64url"),
      events: (formData.get("events") || "session.completed").toString().split(",").map((s) => s.trim()),
      active: true,
    },
  });
  await writeAudit({ orgId: org.id, actorId: session.user.id, action: "webhook.created" });
}

async function toggle(formData) {
  "use server";
  const id = formData.get("id");
  const active = formData.get("active") === "true";
  await db().webhook.update({ where: { id }, data: { active: !active } });
}

export default async function Webhooks() {
  const org = await resolveOrg();
  const hooks = await db().webhook.findMany({ where: { orgId: org.id } });
  return (
    <article style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <h1>Webhooks</h1>
      <form action={createHook} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, margin: "16px 0" }}>
        <input name="url" placeholder="https://..." required style={inp} />
        <input name="events" defaultValue="session.completed,member.added" style={inp} />
        <button style={btn}>Crear</button>
      </form>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {hooks.map((h) => (
          <li key={h.id} style={{ padding: 12, border: "1px solid #1E293B", borderRadius: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "ui-monospace", fontSize: 13 }}>{h.url}</span>
              <form action={toggle}><input type="hidden" name="id" value={h.id} /><input type="hidden" name="active" value={String(h.active)} />
                <button style={{ background: "transparent", color: h.active ? "#10B981" : "#F87171", border: "none" }}>{h.active ? "Activo" : "Pausado"}</button>
              </form>
            </div>
            <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{(h.events || []).join(" · ")}</div>
          </li>
        ))}
      </ul>
    </article>
  );
}
const inp = { padding: "8px 10px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" };
const btn = { padding: "8px 14px", background: "#10B981", border: "none", borderRadius: 8, color: "#fff" };
