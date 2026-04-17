#!/usr/bin/env node
/* Rotates a tenant data key: generates a new DEK, wraps it, re-encrypts
   sensitive columns, and updates Org.brandingJson.encryption.wrapped.
   The old key is kept for 30 days (grace window). */
import { PrismaClient } from "@prisma/client";
import { newTenantKey, decrypt, encrypt, unwrapDataKey } from "../src/server/kms.js";

const tenant = process.argv.find((a) => a.startsWith("--tenant="))?.slice(9);
if (!tenant) { console.error("usage: rotate-data-key --tenant=<orgId>"); process.exit(2); }

const prisma = new PrismaClient();
const org = await prisma.org.findUnique({ where: { id: tenant } });
if (!org) { console.error("org not found"); process.exit(1); }

const oldWrapped = org.brandingJson?.encryption?.wrapped;
const oldDek = oldWrapped ? (await unwrapDataKey(oldWrapped)).toString("base64") : null;
const fresh = await newTenantKey();

// re-encrypt sample: neural session metrics (extend as more encrypted columns land)
const sessions = await prisma.neuralSession.findMany({ where: { orgId: tenant } });
for (const s of sessions) {
  const m = s.metricsJson;
  if (m && typeof m === "object" && m.__cipher) {
    const plain = decrypt(m.__cipher, oldDek);
    const reEnc = encrypt(plain, fresh.dek);
    await prisma.neuralSession.update({ where: { id: s.id }, data: { metricsJson: { __cipher: reEnc } } });
  }
}

await prisma.org.update({
  where: { id: tenant },
  data: { brandingJson: { ...(org.brandingJson || {}), encryption: { wrapped: fresh.wrapped, rotatedAt: new Date().toISOString(), previousWrapped: oldWrapped || null } } },
});

console.log("rotated", tenant, "sessions=", sessions.length);
await prisma.$disconnect();
