/* ═══════════════════════════════════════════════════════════════
   Test guard — prohíbe el anti-patrón orgId vs userId∈members.

   Las NeuralSessions se escriben con orgId = personal-{userId} (ver
   /api/sync/outbox/route.js:137). Cualquier query "todas las sesiones
   del B2B org" debe pasar primero por memberships → userIds, no por
   `where: { orgId }` directo. La 4a vez que apareció este bug
   (Sprints 55/57/59/62) generó la abstracción `findSessionsForOrgMembers`
   en src/server/org-neural-sessions.js. Este test cierra la puerta.

   Si necesitas DOS queries en Promise.all que comparten memberIds (caso
   admin/page.jsx con sesiones-actuales + sesiones-previas para el KPI
   Retorno Saludable), saca los memberIds con `getActiveOrgMemberIds` y
   úsalos inline — eso pasa el guard porque el patrón prohibido es
   `neuralSession.<op>({ where: { orgId } })` literal.
   ═══════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = "src";
const ALLOWED_FILES = new Set([
  // El helper canónico SÍ puede tocar el shape — es su trabajo.
  ["src", "server", "org-neural-sessions.js"].join(sep),
  // Este archivo (el guard mismo) menciona el patrón en strings.
  ["src", "server", "org-neural-sessions.test.js"].join(sep),
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      out.push(...walk(full));
    } else if (/\.(jsx?|tsx?|mjs|cjs)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// Match: neuralSession.<op>({ where: { orgId ...
// Cubre findMany, findFirst, findUnique, count, aggregate, deleteMany, etc.
const ANTI_PATTERN = /neuralSession\.\w+\(\s*\{\s*[^}]*where\s*:\s*\{\s*orgId\b/;

describe("anti-pattern guard: NeuralSession queried by orgId", () => {
  it("ningún archivo de producción consulta neuralSession por orgId directo", () => {
    const offenders = [];
    for (const file of walk(ROOT)) {
      // Saltar tests para no atrapar fixtures en otros .test.*
      if (/\.test\.(jsx?|tsx?)$/.test(file)) continue;
      if (ALLOWED_FILES.has(file)) continue;
      const src = readFileSync(file, "utf8");
      if (ANTI_PATTERN.test(src)) {
        // Aislar la línea para reporte humano
        const lines = src.split(/\r?\n/);
        const matched = lines
          .map((ln, i) => ({ ln, n: i + 1 }))
          .filter(({ ln }) => ANTI_PATTERN.test(ln))
          .map(({ ln, n }) => `${file}:${n}  ${ln.trim().slice(0, 120)}`);
        offenders.push(...matched);
      }
    }
    expect(offenders, [
      "Anti-patrón detectado: NeuralSession se está consultando por orgId.",
      "Las sesiones viven en personal-org del user, no en B2B-org.",
      "Usar findSessionsForOrgMembers(orgId, opts) de @/server/org-neural-sessions.",
      "Si necesitas memberIds inline (para Promise.all compartido), usar",
      "getActiveOrgMemberIds(orgId) y filtrar con userId∈memberIds.",
      "",
      "Ofensores:",
      ...offenders,
    ].join("\n")).toEqual([]);
  });
});
