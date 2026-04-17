#!/usr/bin/env node
/* Seed dev data: one org, two users, sample sessions. Safe to re-run. */
import { PrismaClient } from "@prisma/client";
import { randomUUID, createHash } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.org.upsert({
    where: { slug: "demo" },
    update: {},
    create: { id: randomUUID(), name: "Demo Org", slug: "demo", plan: "GROWTH", region: "US", seats: 25 },
  });
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.local" },
    update: {},
    create: { id: randomUUID(), email: "owner@demo.local", name: "Demo Owner", locale: "es" },
  });
  const member = await prisma.user.upsert({
    where: { email: "member@demo.local" },
    update: {},
    create: { id: randomUUID(), email: "member@demo.local", name: "Demo Member", locale: "es" },
  });
  await prisma.membership.upsert({
    where: { userId_orgId: { userId: owner.id, orgId: org.id } },
    update: { role: "OWNER" },
    create: { id: randomUUID(), userId: owner.id, orgId: org.id, role: "OWNER" },
  });
  await prisma.membership.upsert({
    where: { userId_orgId: { userId: member.id, orgId: org.id } },
    update: { role: "MEMBER" },
    create: { id: randomUUID(), userId: member.id, orgId: org.id, role: "MEMBER" },
  });

  const now = Date.now();
  for (let i = 0; i < 10; i++) {
    await prisma.neuralSession.create({
      data: {
        id: randomUUID(),
        orgId: org.id,
        userId: member.id,
        protocol: i % 2 ? "entrada" : "salida",
        durationSec: 60 + (i * 30),
        metricsJson: { hrv: 55 + i, coherence: 0.6 + i / 20 },
        createdAt: new Date(now - i * 86400000),
      },
    });
  }

  const hash = createHash("sha256").update(`seed:${org.id}`).digest("hex");
  await prisma.auditLog.create({
    data: { id: randomUUID(), orgId: org.id, actorId: owner.id, action: "org.seeded", hash, prevHash: null },
  });

  console.log("✓ seeded org=%s owner=%s member=%s", org.slug, owner.email, member.email);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
