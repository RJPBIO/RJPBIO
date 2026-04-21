#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Pre-build hook: applies pending Prisma migrations iff a real
   database is configured. Skips silently when DATABASE_URL is empty
   (dev uses the in-memory adapter per .env.example), so local
   `npm run build` keeps working without a postgres instance.

   In prod (Vercel / CI) DATABASE_URL is always set, so every deploy
   now guarantees the schema matches the code being shipped. A failing
   migration aborts the build — that is the correct behavior; shipping
   code against a stale schema caused the reason this hook exists.
   ═══════════════════════════════════════════════════════════════ */

import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.log("[migrate] DATABASE_URL unset — skipping migrate deploy (in-memory mode)");
  process.exit(0);
}

console.log("[migrate] DATABASE_URL detected — running `prisma migrate deploy`");
const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
