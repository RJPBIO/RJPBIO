#!/usr/bin/env node
/* eslint-disable no-console */
/*
 * SP-1.5 capture-pwa-mockups — genera 5 screenshots reales para uso en /why
 * marketing como mockups interiores via <MockupFrame screenshot=… />.
 *
 * Pre-requisito: dev server corriendo + test account seeded con N=20+ sessions.
 *
 *   node scripts/dev-seed.mjs --email owner@demo.local --sessions 20
 *   node scripts/capture-pwa-mockups.mjs --email owner@demo.local
 *
 * Output: public/screenshots/why/*.png  (5 PNGs, iPhone 15 Pro 393×852 viewport).
 *
 * Capturas planificadas:
 *   01-hrv-cold-active.png       — HRV reading inline (PWA Home cold-start active)
 *   02-session-in-progress.png   — ProtocolPlayer mid-cycle (Reset1 Phase 1)
 *   03-biosignal-index.png       — Data tab composite dashboard
 *   04-nom035-export.png         — Reporte NOM-035 (admin route, dummy state)
 *   05-streak-lally.png          — Profile streak Lally framing card
 *
 * Settings Playwright:
 *   - device: iPhone 15 Pro preset (393×852, scale 3, devicePixelRatio 3)
 *   - reducedMotion: 'reduce' (forced — sin esto framer-motion timeouts)
 *   - color scheme: dark inherit from PWA's html.theme-dim
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import process from "node:process";
import {
  buildHistoryEntries,
  buildMoodLog,
  buildHrvLog,
  computeStreak,
} from "./dev-seed.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "screenshots", "why");

function parseArgs(argv) {
  const args = { email: null, baseUrl: "http://localhost:3000", only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email") args.email = argv[++i];
    else if (a === "--base-url") args.baseUrl = argv[++i];
    else if (a === "--only") args.only = argv[++i];
    else if (a === "-h" || a === "--help") {
      console.log(`
capture-pwa-mockups — generates 5 PNG screenshots para /why mockups.

USO:
  node scripts/capture-pwa-mockups.mjs --email <email>
  node scripts/capture-pwa-mockups.mjs --email <email> --only 02-session-in-progress

Pre-requisito: \`npm run dev\` + seed previo con N=20+ sessions.
`);
      process.exit(0);
    }
  }
  return args;
}

function assertSafety(args) {
  if (process.env.NODE_ENV === "production") {
    console.error("✗ NODE_ENV=production — refusing.");
    process.exit(2);
  }
  if (!args.baseUrl.startsWith("http://localhost") && !args.baseUrl.startsWith("http://127.0.0.1")) {
    console.error(`✗ non-localhost base URL: ${args.baseUrl}`);
    process.exit(2);
  }
  if (!args.email) {
    console.error("✗ --email <email> es requerido.");
    process.exit(2);
  }
}

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
    console.error("✗ AUTH_SECRET missing.");
    process.exit(3);
  }
  const { encode } = await import("next-auth/jwt");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`✗ User ${email} not found.`);
    await prisma.$disconnect();
    process.exit(3);
  }
  const epoch = user.sessionEpoch ?? 0;
  const maxAge = 8 * 60 * 60;
  const tokenPayload = {
    sub: user.id, name: user.name, email: user.email,
    locale: user.locale, timezone: user.timezone, epoch,
    lastValidatedAt: Date.now(),
  };
  const cookieValue = await encode({
    token: tokenPayload, secret, salt: "authjs.session-token", maxAge,
  });
  await prisma.$disconnect();
  return cookieValue;
}

// Helper: dismiss cookie consent banner if present. El banner overlay-ea las
// capturas (visible en SP-1 baseline + SP-1.5 round 1). Click "Aceptar todo"
// solo si el botón está visible para no fallar silenciosamente.
async function dismissCookieBanner(page) {
  const acceptBtn = page.locator('button:has-text("Aceptar todo"), button:has-text("Accept all")').first();
  if (await acceptBtn.count()) {
    await acceptBtn.click({ timeout: 2000 }).catch(() => null);
    await page.waitForTimeout(400);
  }
}

// Selectores reales en BottomNavV2.jsx — usa data-v2-nav + data-v2-tab.
// `data-testid` NO existe en este shell; se descubrió en SP-1.5 TASK 4.
const SEL_BOTTOM_NAV = "[data-v2-nav]";
const SEL_TAB = (id) => `[data-v2-tab="${id}"]`;

// Captures planificadas — cada una describe ruta + interacciones + filename.
const CAPTURES = [
  {
    name: "01-hrv-cold-active",
    description: "HRV reading inline (PersonalizedView home, seeded)",
    navigate: "/app",
    waitFor: { selector: SEL_BOTTOM_NAV, timeout: 15000 },
    interactions: async (page) => {
      await dismissCookieBanner(page);
      await page.waitForTimeout(800);
    },
  },
  {
    name: "02-session-in-progress",
    description: "Home + recommendation card mid-fold (mini protocol preview)",
    navigate: "/app",
    waitFor: { selector: SEL_BOTTOM_NAV, timeout: 15000 },
    interactions: async (page) => {
      await dismissCookieBanner(page);
      // Scroll para revelar recommendation card debajo del fold.
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(800);
    },
  },
  {
    name: "03-biosignal-index",
    description: "Data tab composite dashboard",
    navigate: "/app",
    waitFor: { selector: SEL_BOTTOM_NAV, timeout: 15000 },
    interactions: async (page) => {
      await dismissCookieBanner(page);
      const dataTab = page.locator(SEL_TAB("datos")).first();
      if (await dataTab.count()) {
        await dataTab.click().catch(() => null);
        await page.waitForTimeout(1500);
      }
    },
  },
  {
    name: "04-nom035-export",
    description: "NOM-035 reporte preview (admin route)",
    navigate: "/admin/nom35/documento",
    waitFor: { selector: "body", timeout: 15000 },
    interactions: async (page) => {
      await dismissCookieBanner(page);
      await page.waitForTimeout(1500);
    },
  },
  {
    name: "05-streak-lally",
    description: "Profile streak card",
    navigate: "/app",
    waitFor: { selector: SEL_BOTTOM_NAV, timeout: 15000 },
    interactions: async (page) => {
      await dismissCookieBanner(page);
      const profileTab = page.locator(SEL_TAB("perfil")).first();
      if (await profileTab.count()) {
        await profileTab.click().catch(() => null);
        await page.waitForTimeout(1500);
      }
    },
  },
];

async function capture(args) {
  let chromium, devices;
  try {
    ({ chromium, devices } = await import("playwright"));
  } catch {
    console.error("✗ playwright no instalado.");
    process.exit(4);
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const cookieValue = await generateAuthCookie(args.email);
  console.log(`✓ Auth cookie generada para ${args.email}.`);

  const iphone15Pro = devices["iPhone 15 Pro"] || {
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iphone15Pro,
    baseURL: args.baseUrl,
    reducedMotion: "reduce",
    colorScheme: "dark",
  });

  const urlObj = new URL(args.baseUrl);
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
    const t = msg.text();
    if (msg.type() === "error" && !/eval\(\) is not supported|HMR|Fast Refresh|favicon/.test(t)) {
      console.log(`  [browser:${msg.type()}] ${t}`);
    }
  });

  // Warmup pass — first /app navigation incurre fonts-load + HMR + bundle
  // warmup (~10-15s en dev). Hacemos pre-navigation throwaway + inyectamos
  // seed history inline para que las capturas siguientes muestren
  // PersonalizedView (no BioIgnitionWelcomeV2). El IDB de Playwright es
  // per-context y NO persiste entre script runs — por eso dev-seed.mjs solo
  // no basta para tener data al capturar; el capture script tiene que seed-
  // ear en su MISMO browser context.
  try {
    console.log("→ Warmup navigation + seed in-context …");
    await page.goto("/app", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForFunction(
      () => typeof window !== "undefined" && !!window.__BIO_STORE__,
      null,
      { timeout: 30000 },
    );

    const sessions = 20;
    const startDateMs = Date.now() - sessions * 86400000;
    const entries = buildHistoryEntries({ sessions, startDateMs });
    const moodLog = buildMoodLog(entries);
    const hrvLog = buildHrvLog(entries);
    const streak = computeStreak(entries);

    await page.evaluate(async (data) => {
      const store = window.__BIO_STORE__.getState();
      const cleanEntries = data.entries.map((e) => {
        const { _seedMeta, ...rest } = e;
        return rest;
      });
      const lastEntry = cleanEntries[cleanEntries.length - 1];
      const lastDate = lastEntry ? new Date(lastEntry.ts).toDateString() : null;
      const weeklyData = [0, 0, 0, 0, 0, 0, 0];
      const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      for (const e of cleanEntries) {
        if (e.ts >= weekAgo) {
          const d = new Date(e.ts).getDay();
          weeklyData[d === 0 ? 6 : d - 1]++;
        }
      }
      store.update({
        history: cleanEntries,
        moodLog: data.moodLog,
        hrvLog: data.hrvLog,
        rhrLog: data.hrvLog.map((h) => ({
          ts: h.ts, rhr: h.rhr, source: h.source, sqi: h.sqi,
        })),
        totalSessions: cleanEntries.length,
        streak: data.streak,
        bestStreak: data.streak,
        todaySessions: cleanEntries.filter(
          (e) => new Date(e.ts).toDateString() === new Date().toDateString(),
        ).length,
        lastDate,
        weeklyData,
        coherencia: lastEntry?.c ?? 50,
        resiliencia: lastEntry?.r ?? 50,
        capacidad: lastEntry?.dimensions?.energia ?? 50,
        vCores: cleanEntries.reduce((s, e) => s + (e.vc || 0), 0),
        totalTime: cleanEntries.reduce((s, e) => s + (e.dur || 0), 0),
        firstDone: true,
        onboardingComplete: true,
        welcomeDone: true,
        firstIntent: "calma",
        neuralBaseline: {
          coherencia: 50, resiliencia: 50, capacidad: 50,
          ts: cleanEntries[0]?.ts || Date.now(),
        },
      });
      await store.saveNow();
    }, { entries, moodLog, hrvLog, streak });

    console.log(`  ✓ seed inyectado in-context (${entries.length} entries · streak=${streak})`);
    await page.waitForTimeout(2000); // settle post-seed + animation reset
  } catch (e) {
    console.log(`  ⚠ warmup/seed falló (continuando con capturas en cold-start): ${e.message}`);
  }

  const results = [];
  const captures = args.only
    ? CAPTURES.filter((c) => c.name === args.only)
    : CAPTURES;

  if (captures.length === 0) {
    console.error(`✗ --only "${args.only}" no matchea ningún capture.`);
    await browser.close();
    process.exit(2);
  }

  for (const c of captures) {
    const outPath = path.join(OUTPUT_DIR, `${c.name}.png`);
    console.log(`→ [${c.name}] ${c.description}`);
    console.log(`  navigate: ${c.navigate}`);
    try {
      await page.goto(c.navigate, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (c.waitFor) {
        await page.waitForSelector(c.waitFor.selector, { timeout: c.waitFor.timeout }).catch(() => {
          console.log(`  ⚠ waitFor selector "${c.waitFor.selector}" no encontrado (continuando)`);
        });
      }
      await c.interactions(page);
      // animations:disabled previene RAF loops en framer-motion del marketing
      // o IntersectionObserver-based reveals. timeout 25s defensive.
      await page.screenshot({
        path: outPath,
        type: "png",
        animations: "disabled",
        timeout: 25000,
      });
      console.log(`  ✓ ${path.relative(PROJECT_ROOT, outPath)}`);
      results.push({ name: c.name, ok: true, path: outPath });
    } catch (e) {
      console.log(`  ✗ Falló: ${e.message}`);
      results.push({ name: c.name, ok: false, error: e.message });
    }
  }

  await context.close();
  await browser.close();

  console.log("\n─ RESUMEN ──────────────────────────────────────");
  for (const r of results) {
    console.log(`  ${r.ok ? "✓" : "✗"} ${r.name}${r.error ? ` (${r.error})` : ""}`);
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`${ok}/${results.length} capturas exitosas`);
  if (ok < results.length) process.exit(5);
}

// Gate: solo correr capture() cuando se invoca via CLI, no cuando se importa.
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
  const args = parseArgs(process.argv.slice(2));
  assertSafety(args);
  capture(args).catch((e) => {
    console.error("✗ capture-pwa-mockups failed:");
    console.error(e);
    process.exit(1);
  });
}

export { parseArgs, CAPTURES };
