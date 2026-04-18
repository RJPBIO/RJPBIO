import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { verifyChain } from "@/server/audit";
import AuditClient from "./AuditClient";

export const metadata = { title: "Auditoría · Admin" };

export default async function AuditPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const rows = await orm.auditLog.findMany({ where: { orgId }, orderBy: { ts: "desc" }, take: 2000 });
  const chain = await verifyChain(orgId);
  const plain = rows.map((r) => ({
    id: String(r.id), ts: r.ts, actorId: r.actorId, actorEmail: r.actorEmail,
    action: r.action, target: r.target, ip: r.ip, hash: r.hash, prevHash: r.prevHash, meta: r.meta,
  }));
  return <AuditClient rows={plain} chain={chain} />;
}
