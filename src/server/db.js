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
  if (!g.__prisma) g.__prisma = new PrismaClient({ log: ["error", "warn"] });
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
