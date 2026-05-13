#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * SP-1.5 dev-seed — pobla test account con N sesiones fictionales realistas.
 *
 * ARQUITECTURA — leer antes de modificar:
 *
 *   El store del PWA es local-first IndexedDB cifrado (src/store/useStore.js,
 *   STORE_VERSION = 21). state.history vive en el browser del usuario, NO en
 *   Postgres/Prisma. Las tablas Prisma (NeuralSession) almacenan agregados
 *   B2B k-anónimos ≥ 5 — distintas del state.history per-user.
 *
 *   Implicación: NO podemos poblar PersonalizedView desde Prisma directo.
 *   Approach correcto: lanzar Playwright headless, autenticar con cookie,
 *   esperar `window.__BIO_STORE__` (exposed by useStore.js:357 en NODE_ENV
 *   !== "production"), inyectar history entries via setState + flush IDB.
 *
 *   El script reconstruye entries con el mismo shape que produce
 *   _buildHistoryEntry (src/lib/neural.js:1573), garantizando que el engine
 *   adaptativo + dataMaturity + sparklines + per-month averages + acceptance
 *   metric leerán datos compatibles.
 *
 * USO:
 *   node scripts/dev-seed.mjs --email owner@demo.local --sessions 30
 *   node scripts/dev-seed.mjs --email owner@demo.local --sessions 14
 *   node scripts/dev-seed.mjs --email owner@demo.local --clear
 *
 * DISTRIBUCIÓN HONEST:
 *   - 70% completed (bioQ.quality: "alta"|"premium")
 *   - 20% partial (bioQ.quality: "estándar"|"ligera", isPartial: true)
 *   - 10% skipped (no entry — gap de día sin sessions)
 *
 * STREAK REALISTA:
 *   - 1-2 días con 2 sessions (multi-session day)
 *   - Gaps ocasionales de 1-2 días (rompen streak, recuperan)
 *   - 30 sessions → streak final ~14-18 días (no 30 lineal)
 *
 * HRV EVOLUCIÓN:
 *   - rmssd inicial ~38-45 ms, final ~50-58 ms
 *   - daily variance ±8 ms
 *
 * SAFETY:
 *   - Refuse if DATABASE_URL contains "supabase.com" or "prod" o ".vercel-postgres.com"
 *   - Refuse if NODE_ENV === "production"
 *   - Refuse if base URL no es localhost
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ─── Args parsing ──────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { email: null, sessions: 30, clear: false, baseUrl: "http://localhost:3000", startDate: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") args.email = argv[++i];
    else if (a === "--sessions") args.sessions = parseInt(argv[++i], 10);
    else if (a === "--clear") args.clear = true;
    else if (a === "--base-url") args.baseUrl = argv[++i];
    else if (a === "--start-date") args.startDate = argv[++i];
    else if (a === "--help" || a === "-h") { printHelp(); process.exit(0); }
  }
  return args;
}

function printHelp() {
  console.log(`
dev-seed — pobla test account con N sesiones fictionales realistas.

USO:
  node scripts/dev-seed.mjs --email <email> --sessions <N>
  node scripts/dev-seed.mjs --email <email> --clear

OPCIONES:
  --email <email>      Email del test user (requerido). Debe existir ya en DB.
  --sessions <N>       N de sesiones a generar (default 30).
  --clear              Borra todo state local (history, feedback, actsLog).
  --base-url <url>     Base URL del PWA (default http://localhost:3000).
  --start-date <date>  Fecha de la primera sesión (ISO, default = hoy - N días).
  -h, --help           Esta ayuda.

ESTADOS RESULTANTES (N → dataMaturity):
  0   → cold-start fresh (BioIgnitionWelcomeV2 onboarding)
  1-4 → cold-start active (ColdStartView)
  5-13→ learning (LearningView)
  14+ → personalized (PersonalizedView)

REQUISITO: el user debe existir ya en DB. Crear con:
  npm run seed   (genera owner@demo.local + member@demo.local)
  o via signup OAuth manual.
`);
}

// ─── Safety guards ─────────────────────────────────────────────────
function assertSafetyGuards(args) {
  if (process.env.NODE_ENV === "production") {
    console.error("✗ NODE_ENV=production detected — refusing to run seed.");
    process.exit(2);
  }
  if (!args.baseUrl.startsWith("http://localhost") && !args.baseUrl.startsWith("http://127.0.0.1")) {
    console.error(`✗ Refusing non-localhost base URL: ${args.baseUrl}`);
    process.exit(2);
  }
  const dbUrl = process.env.DATABASE_URL || "";
  if (/supabase\.com|\.vercel-postgres\.com|prod|production/i.test(dbUrl)) {
    console.error(`✗ DATABASE_URL points to production-looking host. Aborting.`);
    process.exit(2);
  }
  if (!args.email) {
    console.error("✗ --email <email> is required. Use --help.");
    process.exit(2);
  }
}

// ─── Auth: load AUTH_SECRET + DB user + encode JWT cookie ─────────
async function generateAuthCookie(email) {
  const envLocalPath = path.join(PROJECT_ROOT, ".env.local");
  if (existsSync(envLocalPath)) {
    const env = readFileSync(envLocalPath, "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("✗ AUTH_SECRET missing in env. Set in .env.local or as env var.");
    process.exit(3);
  }
  const { encode } = await import("next-auth/jwt");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`✗ User ${email} not found in DB. Run \`npm run seed\` or sign up first.`);
    await prisma.$disconnect();
    process.exit(3);
  }
  const epoch = (user.sessionEpoch ?? 0);
  const maxAge = 8 * 60 * 60;
  const tokenPayload = {
    sub: user.id, name: user.name, email: user.email,
    locale: user.locale, timezone: user.timezone, epoch,
    lastValidatedAt: Date.now(),
  };
  const cookieValue = await encode({
    token: tokenPayload, secret, salt: "authjs.session-token", maxAge,
  });
  // Persist UserSession row so server-side jti validation pasa.
  const { decode } = await import("next-auth/jwt");
  const decoded = await decode({ token: cookieValue, secret, salt: "authjs.session-token" });
  if (decoded?.jti) {
    await prisma.userSession.upsert({
      where: { jti: decoded.jti },
      update: { expiresAt: new Date(Date.now() + maxAge * 1000) },
      create: {
        userId: user.id, jti: decoded.jti,
        ip: "127.0.0.1", userAgent: "dev-seed-script",
        label: "Dev seed (script)",
        expiresAt: new Date(Date.now() + maxAge * 1000),
      },
    }).catch(() => null);
  }
  await prisma.$disconnect();
  return { cookieValue, userId: user.id };
}

// ─── Realistic history entries generator (pure) ───────────────────
const PROTOCOLS = [
  // Names match P[].n (src/lib/protocols.js)
  { n: "Reinicio Parasimpático", intent: "calma", d: 120 },
  { n: "Coherencia Cardíaca",    intent: "calma", d: 120 },
  { n: "Pulse Shift",            intent: "energia", d: 120 },
  { n: "Suspiro Fisiológico",    intent: "calma", d: 30 },
  { n: "Resonancia Cardíaca",    intent: "calma", d: 600 },
  { n: "Visión Panorámica",      intent: "enfoque", d: 150 },
  { n: "Foco Dual",              intent: "enfoque", d: 150 },
  { n: "Pulso Cardíaco",         intent: "calma", d: 180 },
  { n: "NSDR Express",           intent: "calma", d: 600 },
  { n: "Vagal Hum Reset",        intent: "calma", d: 150 },
];

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function buildHistoryEntries({ sessions, startDateMs, seed = 42 }) {
  const rand = seededRandom(seed);
  const entries = [];
  let cursor = startDateMs;
  let cumCoherence = 50;
  let cumResilience = 45;
  let cumCapacity = 40;
  let baselineRmssd = 38;
  let dayIdx = 0;

  for (let i = 0; i < sessions; i++) {
    // Distribution: 70% complete, 20% partial, 10% gap (skipped — no entry)
    const roll = rand();

    // Day gap logic — ~10% of sessions, skip a day (1-2 days).
    if (roll < 0.10 && i > 0) {
      cursor += (1 + Math.floor(rand() * 2)) * 24 * 3600 * 1000;
      dayIdx++;
    }

    // Multi-session day logic — ~15% chance of 2 sessions same day.
    const isMultiSession = rand() < 0.15 && i > 0;
    if (!isMultiSession) {
      cursor += (12 + rand() * 24) * 3600 * 1000;
    } else {
      cursor += (1 + rand() * 4) * 3600 * 1000;
    }

    const protocolIdx = Math.floor(rand() * PROTOCOLS.length);
    const protocol = PROTOCOLS[protocolIdx];

    const isPartial = roll < 0.30 && roll >= 0.10; // 20% partial
    const completeness = isPartial ? 0.4 + rand() * 0.35 : 0.85 + rand() * 0.15;

    // bioQ tier
    let bioQScore, quality;
    if (isPartial) {
      bioQScore = 30 + Math.floor(rand() * 25);
      quality = bioQScore < 45 ? "ligera" : "estándar";
    } else {
      bioQScore = 70 + Math.floor(rand() * 26);
      quality = bioQScore < 85 ? "alta" : "premium";
    }

    // HRV evolution + variance
    const trend = (i / sessions) * 12; // +12 ms over N sessions
    const variance = (rand() - 0.5) * 16; // ±8 ms
    const rmssd = Math.max(20, Math.min(80, baselineRmssd + trend + variance));

    // Dimensions evolution
    cumCoherence = Math.max(20, Math.min(95, cumCoherence + (rand() - 0.4) * 4));
    cumResilience = Math.max(20, Math.min(95, cumResilience + (rand() - 0.3) * 4));
    cumCapacity = Math.max(20, Math.min(95, cumCapacity + (rand() - 0.4) * 4));

    // eVC computation honest (mimicking calcSessionCompletion)
    const eVC = Math.max(3, Math.round(
      (5 + (rand() * 10) + (rand() * 6)) * (quality === "premium" ? 1.4 : quality === "alta" ? 1.2 : quality === "estándar" ? 1.0 : 0.7)
    ));

    // Circadian period from hour
    const hour = new Date(cursor).getHours();
    const circadian = hour < 6 ? "night"
      : hour < 11 ? "morning"
      : hour < 17 ? "day"
      : hour < 22 ? "evening" : "night";

    entries.push({
      p: protocol.n,
      ts: Math.round(cursor),
      vc: eVC,
      c: Math.round(cumCoherence),
      r: Math.round(cumResilience),
      dur: Math.round(protocol.d * (isPartial ? completeness : 1)),
      ctx: "manual",
      bioQ: bioQScore,
      quality,
      interactions: Math.floor(8 + rand() * 18),
      motionSamples: Math.floor(80 + rand() * 140),
      pauses: isPartial ? Math.floor(rand() * 3) : (rand() < 0.2 ? 1 : 0),
      burnoutIdx: +(0.12 + rand() * 0.28).toFixed(3),
      circadian,
      bioSignal: Math.round(50 + rand() * 35),
      partial: isPartial,
      hiddenSec: isPartial ? Math.floor(rand() * 8) : 0,
      completeness: +completeness.toFixed(2),
      dimensions: {
        foco: Math.round(cumCoherence),
        calma: Math.round(cumResilience),
        energia: Math.round(cumCapacity),
      },
      actsLog: null,
      actsCompleted: null,
      actsSkipped: null,
      actsFailed: null,
      postSessionFeedback: null,
      // Synthetic rmssd attached for moodLog correlation (NO en _buildHistoryEntry
      // real, pero algunos consumers via separate hrvLog. Lo dejamos como meta.)
      _seedMeta: { rmssd: Math.round(rmssd) },
    });

    if (!isMultiSession) dayIdx++;
  }
  return entries;
}

function buildMoodLog(entries, seed = 99) {
  const rand = seededRandom(seed);
  return entries.map((e) => ({
    ts: e.ts,
    proto: e.p,
    pre: 2 + Math.floor(rand() * 3), // 2-4
    mood: Math.max(1, Math.min(5, 3 + Math.floor((rand() - 0.4) * 3))),
    intent: PROTOCOLS.find((p) => p.n === e.p)?.intent || "calma",
  }));
}

function buildHrvLog(entries) {
  return entries
    .filter((e) => e._seedMeta?.rmssd != null)
    .map((e) => ({
      ts: e.ts,
      rmssd: e._seedMeta.rmssd,
      rhr: Math.round(58 + ((e._seedMeta.rmssd - 38) * -0.3)),
      source: "ppg",
      sqi: 65 + Math.floor(Math.random() * 25),
    }));
}

function computeStreak(entries) {
  if (entries.length === 0) return 0;
  const days = Array.from(new Set(entries.map((e) => new Date(e.ts).toDateString())));
  days.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const cur = new Date(days[i - 1]).getTime();
    const prev = new Date(days[i]).getTime();
    if (cur - prev > 86400000 + 3600000) break; // gap > 1 día = ruptura
    streak++;
  }
  return streak;
}

// ─── Playwright runtime: drive browser + inject IDB ──────────────
async function injectViaPlaywright({ baseUrl, cookieValue, payload, clear }) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (e) {
    console.error("✗ playwright no instalado. Esperado en devDependencies.");
    console.error("  Run: npx playwright install chromium");
    process.exit(4);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: 390, height: 844 },
  });

  // Inject NextAuth session cookie. Host parsed para localhost.
  const urlObj = new URL(baseUrl);
  await context.addCookies([{
    name: "authjs.session-token",
    value: cookieValue,
    domain: urlObj.hostname,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  }]);

  const page = await context.newPage();
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" && !/eval\(\) is not supported|HMR|Fast Refresh|favicon/.test(text)) {
      console.log(`  [browser:${msg.type()}] ${text}`);
    }
  });

  console.log("→ Navegando a /app …");
  await page.goto("/app", { waitUntil: "domcontentloaded" });

  console.log("→ Esperando window.__BIO_STORE__ …");
  await page.waitForFunction(() => typeof window !== "undefined" && !!window.__BIO_STORE__, null, { timeout: 30000 });

  if (clear) {
    console.log("→ CLEAR mode: limpiando store + IDB …");
    await page.evaluate(async () => {
      const store = window.__BIO_STORE__.getState();
      if (typeof store.saveNow === "function") {
        // Reset to defaults via importData with empty {} + flag
        store.update({
          history: [],
          moodLog: [],
          hrvLog: [],
          rhrLog: [],
          totalSessions: 0,
          streak: 0,
          bestStreak: 0,
          todaySessions: 0,
          lastDate: null,
          weeklyData: [0,0,0,0,0,0,0],
          coherencia: 50, resiliencia: 50, capacidad: 50,
          achievements: [],
          vCores: 0,
          totalTime: 0,
          firstDone: false,
          neuralBaseline: null,
          calibrationHistory: [],
          banditArms: {},
          predictionResiduals: { history: [] },
          activeProgram: null,
          programHistory: [],
          instruments: [],
          nom035Results: [],
          pendingCelebration: null,
          cohortCelebrationDoneAt: {},
          pendingProgramCompletionCelebration: null,
          programCompletionCelebrationDoneAt: {},
          pendingStreakMilestoneCelebration: null,
          streakMilestoneDoneAt: {},
          lastMonthlyDigestShown: 0,
        });
        await store.saveNow();
      }
      return true;
    });
    console.log("✓ Cleared.");
  } else {
    console.log(`→ Inyectando ${payload.entries.length} entries + moodLog + hrvLog …`);
    const result = await page.evaluate(async (data) => {
      const store = window.__BIO_STORE__.getState();
      // Strip _seedMeta (no es parte del shape persistido del entry).
      const cleanEntries = data.entries.map((e) => {
        const { _seedMeta, ...rest } = e;
        return rest;
      });
      const lastEntry = cleanEntries[cleanEntries.length - 1];
      const lastDate = lastEntry ? new Date(lastEntry.ts).toDateString() : null;
      const weeklyData = [0,0,0,0,0,0,0];
      const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      for (const e of cleanEntries) {
        if (e.ts >= weekAgo) {
          const d = new Date(e.ts).getDay();
          const idx = d === 0 ? 6 : d - 1;
          weeklyData[idx]++;
        }
      }
      store.update({
        history: cleanEntries,
        moodLog: data.moodLog,
        hrvLog: data.hrvLog,
        rhrLog: data.hrvLog.map((h) => ({ ts: h.ts, rhr: h.rhr, source: h.source, sqi: h.sqi })),
        totalSessions: cleanEntries.length,
        streak: data.streak,
        bestStreak: Math.max(data.streak, data.bestStreak || data.streak),
        todaySessions: cleanEntries.filter((e) => new Date(e.ts).toDateString() === new Date().toDateString()).length,
        lastDate,
        weeklyData,
        coherencia: lastEntry?.c ?? 50,
        resiliencia: lastEntry?.r ?? 50,
        capacidad: lastEntry?.dimensions?.energia ?? 50,
        vCores: cleanEntries.reduce((sum, e) => sum + (e.vc || 0), 0),
        totalTime: cleanEntries.reduce((sum, e) => sum + (e.dur || 0), 0),
        firstDone: cleanEntries.length > 0,
        // Mark onboarding complete so AppV2Root muestra HomeV2 directo, no BioIgnitionWelcomeV2.
        onboardingComplete: true,
        welcomeDone: true,
        firstIntent: cleanEntries.length > 0 ? "calma" : null,
        neuralBaseline: {
          coherencia: 50, resiliencia: 50, capacidad: 50,
          ts: cleanEntries[0]?.ts || Date.now(),
        },
      });
      await store.saveNow();
      // Verify post-save
      const fresh = window.__BIO_STORE__.getState();
      return {
        totalSessions: fresh.totalSessions,
        streak: fresh.streak,
        historyLen: fresh.history.length,
      };
    }, payload);
    console.log(`✓ Inyectado. totalSessions=${result.totalSessions}, streak=${result.streak}, historyLen=${result.historyLen}`);
  }

  await context.close();
  await browser.close();
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  assertSafetyGuards(args);

  console.log(`bio-ignición dev-seed — ${args.clear ? "CLEAR" : `${args.sessions} sessions`} for ${args.email}`);
  console.log(`  base URL: ${args.baseUrl}`);

  const { cookieValue, userId } = await generateAuthCookie(args.email);
  console.log(`  auth: cookie generada para userId=${userId}`);

  if (args.clear) {
    await injectViaPlaywright({ baseUrl: args.baseUrl, cookieValue, payload: null, clear: true });
    console.log("✓ Done.");
    return;
  }

  const startDateMs = args.startDate
    ? new Date(args.startDate).getTime()
    : Date.now() - args.sessions * 86400000;

  const entries = buildHistoryEntries({ sessions: args.sessions, startDateMs });
  const moodLog = buildMoodLog(entries);
  const hrvLog = buildHrvLog(entries);
  const streak = computeStreak(entries);
  const bestStreak = streak;

  console.log(`  generated: ${entries.length} entries · streak=${streak} · ${moodLog.length} mood · ${hrvLog.length} hrv`);

  await injectViaPlaywright({
    baseUrl: args.baseUrl,
    cookieValue,
    payload: { entries, moodLog, hrvLog, streak, bestStreak },
    clear: false,
  });

  console.log("✓ Done. Reload http://localhost:3000/app — debería renderear " + (
    args.sessions === 0 ? "BioIgnitionWelcome" :
    args.sessions < 5 ? "ColdStartView (active)" :
    args.sessions < 14 ? "LearningView" :
    "PersonalizedView"
  ));
}

// Gate: solo correr main() cuando se invoca via `node scripts/dev-seed.mjs`,
// NO cuando vitest importa el módulo para testear las puras helpers exportadas.
const invokedDirectly = (() => {
  try {
    const here = fileURLToPath(import.meta.url);
    const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : null;
    return argv1 && path.resolve(here) === argv1;
  } catch {
    return false;
  }
})();

if (invokedDirectly) {
  main().catch((e) => {
    console.error("✗ dev-seed failed:");
    console.error(e);
    process.exit(1);
  });
}

// Exports for unit testing + reuse from capture-pwa-mockups.mjs.
export {
  parseArgs,
  assertSafetyGuards,
  buildHistoryEntries,
  buildMoodLog,
  buildHrvLog,
  computeStreak,
  seededRandom,
};
