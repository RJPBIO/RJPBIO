#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Re-walks the audit hash-chain for a given org and reports pass/fail.
   Uses the same pure helpers the server writer does (src/lib/audit-chain.js)
   so a mismatch here is ALWAYS evidence of tampering, never drift.

   Usage:
     verify-audit --org=<orgId>
     ORG_ID=<id> npm run verify:audit

   Exit: 0 ok, 1 tampered, 2 usage.
   ═══════════════════════════════════════════════════════════════ */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { recomputeRow } from "../src/lib/audit-chain.js";

const orgId = process.argv.find((a) => a.startsWith("--org="))?.slice(6) || process.env.ORG_ID;
if (!orgId) {
  console.error("usage: verify-audit --org=<orgId>");
  process.exit(2);
}

const prisma = new PrismaClient();
const hmacKey = process.env.AUDIT_HMAC_KEY || null;

const rows = await prisma.auditLog.findMany({
  where: { orgId },
  orderBy: { ts: "asc" },
});

let prev = null, ok = 0, badHash = 0, badSeal = 0;
for (const r of rows) {
  const { expectedHash, expectedSeal, storedSeal } = recomputeRow(r, prev, hmacKey);
  if (r.hash !== expectedHash) {
    badHash++;
    console.error(`TAMPERED hash id=${r.id} action=${r.action} ts=${r.ts?.toISOString?.() ?? r.ts}`);
  } else if (expectedSeal && storedSeal !== expectedSeal) {
    badSeal++;
    console.error(`TAMPERED seal id=${r.id} action=${r.action}`);
  } else {
    ok++;
  }
  prev = r.hash;
}

const hmacState = hmacKey ? "enforced" : "skipped (AUDIT_HMAC_KEY unset)";
console.log(`chain ok=${ok} bad_hash=${badHash} bad_seal=${badSeal} total=${rows.length} seal=${hmacState}`);

await prisma.$disconnect();
process.exit(badHash + badSeal ? 1 : 0);
