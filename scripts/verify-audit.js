#!/usr/bin/env node
/* Re-walks the audit hash-chain for an org and prints pass/fail. */
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const orgId = process.argv.find((a) => a.startsWith("--org="))?.slice(6) || process.env.ORG_ID;
if (!orgId) { console.error("usage: verify-audit --org=<orgId>"); process.exit(2); }

const prisma = new PrismaClient();

function canonical(o) { return JSON.stringify(o, Object.keys(o).sort()); }
function sha256(s) { return createHash("sha256").update(s).digest("hex"); }

const entries = await prisma.auditLog.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } });
let prev = null, ok = 0, bad = 0;
for (const e of entries) {
  const payload = { orgId: e.orgId, actorId: e.actorId, action: e.action, target: e.target, meta: e.meta, createdAt: e.createdAt, prevHash: prev };
  const expected = sha256(canonical(payload));
  if (expected === e.hash) ok++; else { bad++; console.error(`TAMPERED: ${e.id} action=${e.action}`); }
  prev = e.hash;
}
console.log(`chain ok=${ok} bad=${bad} total=${entries.length}`);
await prisma.$disconnect();
process.exit(bad ? 1 : 0);
