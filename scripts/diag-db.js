#!/usr/bin/env node
/* Diagnóstico verbose de la conexión a Supabase. No expone password.
   Salida muestra hostname, port, user, success/failure code + mensaje. */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import net from "node:net";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL no está set"); process.exit(1); }

const u = new URL(url);
console.log("DATABASE_URL parsed:");
console.log("  protocol:", u.protocol);
console.log("  username:", u.username);
console.log("  password:", u.password ? `(set, length=${u.password.length})` : "(empty)");
console.log("  hostname:", u.hostname);
console.log("  port:    ", u.port);
console.log("  pathname:", u.pathname);
console.log("  search:  ", u.search);
console.log("");

// 1. TCP probe
console.log("→ TCP probe…");
await new Promise((res) => {
  const s = new net.Socket();
  s.setTimeout(8000);
  const t0 = Date.now();
  s.connect(Number(u.port), u.hostname, () => {
    console.log(`  ✓ TCP OK in ${Date.now() - t0}ms`);
    s.destroy(); res();
  });
  s.on("timeout", () => { console.log("  ✗ TCP timeout"); s.destroy(); res(); });
  s.on("error", (e) => { console.log("  ✗ TCP error:", e.code || e.message); res(); });
});

// 2. Prisma probe with full error
console.log("\n→ Prisma probe…");
const { PrismaClient } = await import("@prisma/client");
const p = new PrismaClient({ log: [{ level: "error", emit: "event" }] });
p.$on("error", (e) => console.log("  prisma:error event →", e.message?.split("\n").slice(0, 4).join(" | ")));

try {
  const r = await Promise.race([
    p.$queryRaw`SELECT current_user as u, version() as v`,
    new Promise((_, rej) => setTimeout(() => rej(new Error("client_timeout_25s")), 25000)),
  ]);
  console.log("  ✓ Prisma OK:", r[0]);
} catch (e) {
  console.log("  ✗ Prisma fail");
  console.log("    e.name:        ", e?.name);
  console.log("    e.code:        ", e?.code);
  console.log("    e.errorCode:   ", e?.errorCode);
  console.log("    e.clientVersion:", e?.clientVersion);
  console.log("    e.meta:        ", JSON.stringify(e?.meta));
  const msg = e?.message || "";
  console.log("    e.message (first 8 lines):");
  msg.split("\n").slice(0, 8).forEach((l) => console.log("      |", l));
}
await p.$disconnect();
