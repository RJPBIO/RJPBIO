/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — DB adapter
   Estrategia: Prisma en producción; memoria en dev/test.
   Selección por DATABASE_URL. Toda capa servidor pasa por aquí.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

let clientPromise;

async function buildPrisma() {
  const { PrismaClient } = await import("@prisma/client");
  const g = globalThis;
  if (!g.__prisma) {
    // Serverless-friendly URL: agrega pgbouncer=true + connection_limit=1
    // si no están presentes. Necesario cuando DATABASE_URL apunta a un
    // transaction-mode pooler (Supabase, Neon, PgBouncer) — sin estos
    // flags, Prisma usa prepared statements que conflictúan con el pooler
    // y throw "prepared statement \"s0\" already exists" en cold starts.
    // Innocuo si la DB es conexión directa.
    let url = process.env.DATABASE_URL;
    if (url && !/[?&]pgbouncer=/.test(url)) {
      url += (url.includes("?") ? "&" : "?") + "pgbouncer=true&connection_limit=1";
    }
    g.__prisma = new PrismaClient({
      log: ["error", "warn"],
      ...(url ? { datasourceUrl: url } : {}),
    });
  }
  return g.__prisma;
}

function buildMemory() {
  const tables = new Map();
  const seq = new Map();
  const get = (t) => { if (!tables.has(t)) tables.set(t, new Map()); return tables.get(t); };
  const nextId = (t) => { const n = (seq.get(t) || 0) + 1; seq.set(t, n); return `${t}_${n}`; };
  return {
    $transaction: async (fns) => Promise.all(fns.map((f) => f(this))),
    org: tableApi(get, nextId, "Org"),
    user: tableApi(get, nextId, "User"),
    membership: tableApi(get, nextId, "Membership"),
    team: tableApi(get, nextId, "Team"),
    invitation: tableApi(get, nextId, "Invitation"),
    auditLog: tableApi(get, nextId, "AuditLog"),
    neuralSession: tableApi(get, nextId, "NeuralSession"),
    webhook: tableApi(get, nextId, "Webhook"),
    webhookDelivery: tableApi(get, nextId, "WebhookDelivery"),
    apiKey: tableApi(get, nextId, "ApiKey"),
    integration: tableApi(get, nextId, "Integration"),
    account: tableApi(get, nextId, "Account"),
    session: tableApi(get, nextId, "Session"),
    // Phase 6F SP-A — programas adaptativos persistidos.
    programAssignment: tableApi(get, nextId, "ProgramAssignment"),
    // Phase 6F SP-A — agregado porque endpoint /me/program/reEval crea
    // rows en tabla Instrument (PSS-4 mid-program). Otros usos de Instrument
    // (lectura para snapshot) ya pasan por safeFindMany resiliente.
    instrument: tableApi(get, nextId, "Instrument"),
    // Phase 6F SP-C — buildExecutiveReport consulta hrvMeasurement +
    // nom35Response per-user para trends y correlation. Memory adapter
    // expone los tableApi para que los tests puedan exercer todas las
    // ramas sin Prisma real.
    hrvMeasurement: tableApi(get, nextId, "HrvMeasurement"),
    nom35Response: tableApi(get, nextId, "Nom35Response"),
    // Phase 6F SP-E — wellbeing trends (early-warning detection).
    // Necesario para que cron burnout-scan tests + endpoints exerzan
    // create/findFirst/findMany sin Prisma real.
    burnoutScore: tableApi(get, nextId, "BurnoutScore"),
  };
}

function tableApi(get, nextId, name) {
  return {
    async create({ data }) {
      const id = data.id || nextId(name);
      const row = { id, createdAt: new Date(), ...data };
      get(name).set(id, row);
      return row;
    },
    async findUnique({ where }) {
      const rows = Array.from(get(name).values());
      return rows.find((r) => Object.entries(where).every(([k, v]) => r[k] === v)) || null;
    },
    async findFirst({ where = {} } = {}) {
      const rows = Array.from(get(name).values());
      return rows.find((r) => match(r, where)) || null;
    },
    async findMany({ where = {}, orderBy, take, skip = 0 } = {}) {
      let rows = Array.from(get(name).values()).filter((r) => match(r, where));
      if (orderBy) {
        const [k, dir] = Object.entries(orderBy)[0];
        rows = rows.sort((a, b) => (a[k] > b[k] ? 1 : -1) * (dir === "desc" ? -1 : 1));
      }
      if (skip) rows = rows.slice(skip);
      if (take) rows = rows.slice(0, take);
      return rows;
    },
    async update({ where, data }) {
      const row = await this.findUnique({ where });
      if (!row) throw new Error(`${name} not found`);
      Object.assign(row, data, { updatedAt: new Date() });
      return row;
    },
    async delete({ where }) {
      const row = await this.findUnique({ where });
      if (row) get(name).delete(row.id);
      return row;
    },
    async count({ where = {} } = {}) {
      return Array.from(get(name).values()).filter((r) => match(r, where)).length;
    },
    async groupBy({ by, where = {}, _count }) {
      const rows = Array.from(get(name).values()).filter((r) => match(r, where));
      const grouped = new Map();
      for (const r of rows) {
        const k = by.map((f) => r[f]).join("∥");
        grouped.set(k, (grouped.get(k) || 0) + 1);
      }
      return Array.from(grouped.entries()).map(([k, c]) => {
        const parts = k.split("∥");
        const entry = Object.fromEntries(by.map((f, i) => [f, parts[i]]));
        if (_count) entry._count = { _all: c };
        return entry;
      });
    },
  };
}

function match(row, where) {
  for (const [k, v] of Object.entries(where)) {
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      if (v.in && !v.in.includes(row[k])) return false;
      if (v.gte && !(row[k] >= v.gte)) return false;
      if (v.lte && !(row[k] <= v.lte)) return false;
      if (v.contains && !String(row[k] || "").includes(v.contains)) return false;
    } else if (row[k] !== v) return false;
  }
  return true;
}

export async function db() {
  if (!clientPromise) {
    clientPromise = process.env.DATABASE_URL && process.env.NODE_ENV !== "test"
      ? buildPrisma()
      : Promise.resolve(buildMemory());
  }
  return clientPromise;
}

/* ─── RLS · contexto de tenant (Fase 1, plumbing) ─────────────────
   Ejecuta `fn(tx)` dentro de una transacción con el contexto de tenant
   seteado vía set_config(..., is_local=true) — el equivalente a SET LOCAL
   que SÍ funciona a través de un pooler en modo transacción (Supabase/
   PgBouncer): el setting vive solo dentro de esta transacción / conexión.

   HOY es NO-OP funcional: las políticas RLS aún no están habilitadas
   (Fase 2, requiere migraciones + staging). Setear el contexto ahora es
   inofensivo y deja el plumbing listo. Las settings se leen en políticas
   como current_setting('app.user_id', true).

   En el adaptador de memoria (dev/test) no hay transacciones reales ni
   set_config → se llama fn(orm) directo.

   @param {{userId?:string, orgIds?:string[], role?:string}} ctx
   @param {(client:any)=>Promise<T>} fn
   @returns {Promise<T>}
*/
export async function withTenant(ctx, fn) {
  const orm = await db();
  // Memory adapter: sin $executeRaw → contexto no aplica, ejecuta directo.
  if (typeof orm.$executeRaw !== "function" || typeof orm.$transaction !== "function") {
    return fn(orm);
  }
  const userId = ctx?.userId ?? "";
  const orgIds = Array.isArray(ctx?.orgIds) ? ctx.orgIds.join(",") : "";
  const memberIds = Array.isArray(ctx?.memberIds) ? ctx.memberIds.join(",") : "";
  const role = ctx?.role ?? "";
  return orm.$transaction(async (tx) => {
    // Parametrizado (no interpolación) → sin riesgo de inyección.
    await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.org_ids', ${orgIds}, true)`;
    await tx.$executeRaw`SELECT set_config('app.member_ids', ${memberIds}, true)`;
    await tx.$executeRaw`SELECT set_config('app.role', ${role}, true)`;
    return fn(tx);
  });
}
