#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * SP-1.5 dev-clear — limpia state local (history/feedback/mood/hrv) de un
 * test user. Wrapper alrededor de dev-seed.mjs --clear con flags ergonómicos.
 *
 * USO:
 *   node scripts/dev-clear.mjs --email owner@demo.local
 *   node scripts/dev-clear.mjs --email owner@demo.local --keep-account
 *
 *   --keep-account: no toca el User row en DB (default behavior — actualmente
 *                   este script SIEMPRE preserva el User row porque solo
 *                   limpia IndexedDB local. Flag retenido por compatibilidad
 *                   con SP-1.5 prompt; semánticamente es no-op).
 */

import process from "node:process";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { email: null, keepAccount: true, baseUrl: "http://localhost:3000" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") args.email = argv[++i];
    else if (a === "--keep-account") args.keepAccount = true;
    else if (a === "--base-url") args.baseUrl = argv[++i];
    else if (a === "-h" || a === "--help") {
      console.log(`
dev-clear — limpia state local del test user.

USO:
  node scripts/dev-clear.mjs --email <email>
  node scripts/dev-clear.mjs --email <email> --keep-account

Solo limpia IndexedDB local. Preserva el User row en DB.
Para borrar el User row de DB, usar Prisma Studio o SQL manual.
`);
      process.exit(0);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (!args.email) {
  console.error("✗ --email <email> es requerido. Use --help.");
  process.exit(2);
}

const seedScript = path.join(__dirname, "dev-seed.mjs");
const result = spawnSync("node", [seedScript, "--email", args.email, "--clear", "--base-url", args.baseUrl], {
  stdio: "inherit",
});
process.exit(result.status ?? 0);

export { parseArgs };
