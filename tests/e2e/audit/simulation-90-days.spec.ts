/**
 * SIMULATION 90 DÍAS — PREMIUM HEURISTICS CAPTURE PASS
 *
 * READ-ONLY analysis pass. NO modifica código source. NO modifica tests.
 * Solo:
 *   1. Onboarding real con clicks (welcome + calibration via testids).
 *   2. 270 sesiones simuladas (3/día × 90 días) — sampling real en
 *      días 1, 30, 60, 90 (intenta UI click); resto via store directo.
 *   3. Captura cada 7 días + hitos críticos (cohort transitions, reloads,
 *      program reeval, completion, exploration final por todas las pages).
 *   4. State assertions en hitos cohort y persistencia.
 *
 * Estructura emparenta audit-30-days.spec.ts pero amplía a 90 días con
 * énfasis en captura visual + categorización de findings PAH (Premium
 * App Heuristics — 10 dimensiones evaluadas off-line desde las capturas).
 */
import { test, expect, type ConsoleMessage } from "@playwright/test";
import {
  resetAppState,
  waitForStoreReady,
  simulateCompleteSession,
  flushStoreToIDB,
  getStoreState,
  completeWelcome,
  skipAllCalibration,
} from "../utils/helpers";

const SHOTS_BASE = "screenshots/simulation-90-days";

type Severity = "critical" | "high" | "medium" | "low";
type Category = "bug" | "incoherence" | "premium-gap" | "enhancement";
type Finding = {
  category: Category;
  severity: Severity;
  dimension: string;
  description: string;
  evidence: string;
  day: number | null;
  ts: number;
};

test.describe.configure({ mode: "serial" });

test("Simulation 90 días premium analysis", async ({ page }) => {
  // 90 days x 3 sessions = 270 store ops (~150ms each) + 4 real sessions
  // + ~40 captures (~1.5s each fullPage) + reloads. Budget: ~12 min.
  test.setTimeout(900_000);

  const findings: Finding[] = [];
  const captures: { path: string; label: string; week: number | null; milestone: string | null }[] = [];
  const consoleErrors: { text: string; location?: unknown; day: number | null }[] = [];
  let currentDay: number | null = null;

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Download the React DevTools/i.test(text)) return;
    if (/Failed to load resource/i.test(text)) return;
    consoleErrors.push({ text, location: msg.location(), day: currentDay });
  });

  async function capture(label: string, week: number | null = null, milestone: string | null = null) {
    const dir = milestone
      ? "milestones"
      : week !== null
        ? `week-${String(week).padStart(2, "0")}`
        : "misc";
    const path = `${SHOTS_BASE}/${dir}/${label}.png`;
    try {
      await page.screenshot({ path, fullPage: true, timeout: 10000 });
      captures.push({ path, label, week, milestone });
    } catch (err) {
      report(
        "bug",
        "low",
        "capture-infra",
        `screenshot fallo en ${label}: ${(err as Error).message.slice(0, 120)}`,
        path
      );
    }
  }

  function report(
    category: Category,
    severity: Severity,
    dimension: string,
    description: string,
    evidence: string
  ) {
    findings.push({
      category,
      severity,
      dimension,
      description,
      evidence,
      day: currentDay,
      ts: Date.now(),
    });
    // eslint-disable-next-line no-console
    console.warn(`[FINDING][${severity.toUpperCase()}][${dimension}] D${currentDay ?? "-"}: ${description}`);
  }

  // ===========================================================================
  // DÍA 0 — ONBOARDING REAL
  // ===========================================================================
  currentDay = 0;
  await resetAppState(page);
  await page.goto("/app", { waitUntil: "networkidle" });
  await waitForStoreReady(page, 15000);
  await capture("01-fresh-app", null, "onboarding");

  // Welcome real flow
  let welcomeOk = false;
  try {
    await completeWelcome(page, "calma");
    welcomeOk = true;
  } catch (err) {
    report(
      "bug",
      "critical",
      "onboarding",
      `Welcome flow falló: ${(err as Error).message.slice(0, 200)}`,
      "completeWelcome helper"
    );
  }
  await capture("02-post-welcome", null, "onboarding");

  // Calibration steps capture before skipping
  if (welcomeOk) {
    try {
      // Visible step counter — captura inicial calibration
      await page.waitForSelector("[data-v2-calibration]", { timeout: 5000 });
      await capture("03-calibration-mounted", null, "onboarding");
      await skipAllCalibration(page);
      await capture("04-calibration-end", null, "onboarding");
    } catch (err) {
      report(
        "bug",
        "critical",
        "onboarding",
        `Calibration skip falló: ${(err as Error).message.slice(0, 200)}`,
        "skipAllCalibration helper"
      );
    }
  }

  // Tab Hoy fresh state — debe mostrar ColdStartView
  await page.waitForTimeout(500);
  await capture("05-tab-hoy-day0", null, "onboarding");

  const initialState = await getStoreState(page);
  if (!initialState?.welcomeDone) {
    report(
      "bug",
      "high",
      "state-consistency",
      `Day 0: welcomeDone=${initialState?.welcomeDone} tras onboarding`,
      "post-onboarding state"
    );
  }

  // ===========================================================================
  // DÍA 1-90: 3 SESIONES POR DÍA + CAPTURAS PERIÓDICAS
  // ===========================================================================
  let cumulativeSessions = 0;

  for (let day = 1; day <= 90; day++) {
    currentDay = day;

    for (let sessionOfDay = 1; sessionOfDay <= 3; sessionOfDay++) {
      const isSamplingDay = [1, 30, 60, 90].includes(day) && sessionOfDay === 1;

      if (isSamplingDay) {
        // Real session attempt via UI clicks (no completamos audio real;
        // mounted state + fallback al store-direct).
        try {
          await page.goto("/app", { waitUntil: "domcontentloaded" });
          await waitForStoreReady(page, 8000);
          await page.waitForTimeout(400);

          // Phase 6H Premium-Fix4 L-2 — selector update. Antes:
          //   "[data-v2-action] button, button:has-text('Empezar sesión')..."
          // El producto NO usa literal "Empezar sesión" — copy es derivado
          // del intent ("Tu primera sesión", "Reinicio Parasimpático", etc).
          // Selector canónico es `[data-v2-action]` (PersonalizedView ActionCard
          // panel + ColdStartView ActionRow). `.first()` cubre ambos casos.
          const sessionCta = page.locator("[data-v2-action]").first();

          const visible = await sessionCta.isVisible({ timeout: 2000 }).catch(() => false);
          if (visible) {
            await sessionCta.click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(1500);
            await capture(`day${String(day).padStart(2, "0")}-real-session-mounted`, null, "milestones");
          } else {
            report(
              "incoherence",
              "low",
              "discoverability",
              `Day ${day}: no se encontró [data-v2-action] visible para sampling real`,
              `day${day} sampling`
            );
          }
        } catch (err) {
          report(
            "bug",
            "medium",
            "transitions",
            `Day ${day} sampling click falló: ${(err as Error).message.slice(0, 120)}`,
            `day${day}`
          );
        }
        // Independientemente del UI flow, completamos via store
        await simulateCompleteSession(page);
      } else {
        await simulateCompleteSession(page);
      }

      cumulativeSessions++;
    }

    await flushStoreToIDB(page);

    // Hitos cohort transitions (post-flush, mismo day)
    if (cumulativeSessions === 5) {
      await page.goto("/app", { waitUntil: "domcontentloaded" });
      await waitForStoreReady(page, 8000);
      await page.waitForTimeout(500);
      await capture(`milestone-coldstart-to-learning-d${day}`, null, "milestones");
      const learningVisible = await page
        .locator("[data-v2-learning-progress]")
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!learningVisible) {
        report(
          "bug",
          "critical",
          "cohort-transitions",
          `Day ${day}: NO transition a LearningView tras 5 sesiones`,
          `milestone-coldstart-to-learning-d${day}.png`
        );
      }
    }

    if (cumulativeSessions === 14) {
      // Threshold real personalized = 14 (memo: feedback_neural_threshold N=14)
      await page.goto("/app", { waitUntil: "domcontentloaded" });
      await waitForStoreReady(page, 8000);
      await page.waitForTimeout(500);
      await capture(`milestone-learning-to-personalized-d${day}`, null, "milestones");
      const heroVisible = await page
        .locator("[data-v2-hero]")
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (!heroVisible) {
        report(
          "bug",
          "critical",
          "cohort-transitions",
          `Day ${day}: NO transition a PersonalizedView tras 14 sesiones (N=14 threshold)`,
          `milestone-learning-to-personalized-d${day}.png`
        );
      }
    }

    // Captura semanal (días 7, 14, 21, ...)
    const weekNum = day / 7;
    if (Number.isInteger(weekNum) || day === 1 || day === 90) {
      const week = Math.max(0, Math.floor(day / 7));
      await page.goto("/app", { waitUntil: "domcontentloaded" });
      await waitForStoreReady(page, 8000);
      await page.waitForTimeout(400);
      await capture(`d${String(day).padStart(2, "0")}-tab-hoy`, week);

      const state = await getStoreState(page);
      const histLen = Array.isArray(state?.history) ? (state!.history as unknown[]).length : 0;
      if (histLen !== cumulativeSessions) {
        report(
          "bug",
          "high",
          "state-consistency",
          `Day ${day}: history.length=${histLen} vs cumulativeSessions=${cumulativeSessions}`,
          `d${day}-tab-hoy.png`
        );
      }
    }

    // Reload cada 15 días (validar persistencia)
    if (day % 15 === 0) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForStoreReady(page, 10000);
      await page.waitForTimeout(500);
      await capture(`reload-d${String(day).padStart(2, "0")}`, null, "milestones");
      const state = await getStoreState(page);
      const histLen = Array.isArray(state?.history) ? (state!.history as unknown[]).length : 0;
      if (histLen !== cumulativeSessions) {
        report(
          "bug",
          "critical",
          "persistence",
          `Day ${day} reload: state perdido. history=${histLen} vs ${cumulativeSessions}`,
          `reload-d${day}.png`
        );
      }
    }

    // Día 14: program re-eval (si programa activo)
    if (day === 14) {
      await page.goto("/app/program/today", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await capture("milestone-d14-program-reeval", null, "milestones");
    }

    // Día 28: program completion check
    if (day === 28) {
      await page.goto("/app/program/today", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await capture("milestone-d28-program-completion", null, "milestones");
    }
  }

  currentDay = 90;

  // ===========================================================================
  // POST-90: EXPLORATION PREMIUM
  // ===========================================================================
  // Página principal (Tab Hoy en estado final)
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await waitForStoreReady(page, 8000);
  await page.waitForTimeout(800);
  await capture("final-tab-hoy", null, "premium-analysis");

  // Tabs via bottom nav
  const tabs = ["datos", "coach", "perfil"] as const;
  for (const tab of tabs) {
    try {
      await page.goto("/app", { waitUntil: "domcontentloaded" });
      await waitForStoreReady(page, 8000);
      await page.waitForTimeout(400);
      await page.locator(`[data-v2-tab="${tab}"]`).first().click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      await capture(`final-tab-${tab}`, null, "premium-analysis");
    } catch (err) {
      report(
        "bug",
        "medium",
        "navigation",
        `Tab ${tab} no respondió a click: ${(err as Error).message.slice(0, 120)}`,
        `final-tab-${tab}.png`
      );
    }
  }

  // App pages dedicadas
  const appPages: { route: string; label: string }[] = [
    { route: "/app/programs", label: "programs-list" },
    { route: "/app/program/today", label: "program-today" },
    { route: "/app/program/timeline", label: "program-timeline" },
    { route: "/app/wellbeing", label: "wellbeing" },
    { route: "/app/resources/crisis", label: "crisis-resources" },
  ];
  for (const pg of appPages) {
    try {
      await page.goto(pg.route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await capture(`final-${pg.label}`, null, "premium-analysis");
    } catch (err) {
      report(
        "bug",
        "medium",
        "navigation",
        `Page ${pg.route} fallo navegación: ${(err as Error).message.slice(0, 120)}`,
        `final-${pg.label}.png`
      );
    }
  }

  // Admin pages (smoke — esperamos 401 sin auth, capturamos lo que sea)
  const adminPages = [
    { route: "/admin", label: "admin-root" },
    { route: "/admin/reportes/ejecutivo", label: "admin-reportes-ejecutivo" },
    { route: "/admin/programs/adherence", label: "admin-programs-adherence" },
    { route: "/admin/wellbeing/aggregate", label: "admin-wellbeing-aggregate" },
    { route: "/admin/health", label: "admin-health" },
  ];
  for (const pg of adminPages) {
    try {
      await page.goto(pg.route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      await capture(`final-${pg.label}`, null, "premium-analysis");
    } catch (err) {
      report(
        "bug",
        "low",
        "navigation",
        `Admin page ${pg.route} fallo: ${(err as Error).message.slice(0, 120)}`,
        `final-${pg.label}.png`
      );
    }
  }

  // Public pages para contexto premium (referencia DNA canónica)
  const publicPages = [
    { route: "/", label: "public-home" },
    { route: "/pricing", label: "public-pricing" },
    { route: "/trust", label: "public-trust" },
  ];
  for (const pg of publicPages) {
    try {
      await page.goto(pg.route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await capture(`final-${pg.label}`, null, "premium-analysis");
    } catch {
      // public pages opcionales — ignorar errores
    }
  }

  // ===========================================================================
  // FINAL REPORT
  // ===========================================================================
  const finalState = await getStoreState(page);
  const finalHistLen = Array.isArray(finalState?.history) ? (finalState!.history as unknown[]).length : 0;

  const aggregate = {
    cumulativeSessions,
    finalHistLen,
    findingsCount: findings.length,
    consoleErrorsCount: consoleErrors.length,
    capturesCount: captures.length,
    findingsBySeverity: {
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
    },
    findings,
    captures: captures.map((c) => c.path),
    consoleErrors: consoleErrors.slice(0, 50),
  };

  // eslint-disable-next-line no-console
  console.log("\n=== SIMULATION 90 DÍAS COMPLETED ===");
  // eslint-disable-next-line no-console
  console.log(`Cumulative sessions: ${cumulativeSessions}`);
  // eslint-disable-next-line no-console
  console.log(`Final state.history.length: ${finalHistLen}`);
  // eslint-disable-next-line no-console
  console.log(`Findings: ${findings.length} (C${aggregate.findingsBySeverity.critical}/H${aggregate.findingsBySeverity.high}/M${aggregate.findingsBySeverity.medium}/L${aggregate.findingsBySeverity.low})`);
  // eslint-disable-next-line no-console
  console.log(`Console errors: ${consoleErrors.length}`);
  // eslint-disable-next-line no-console
  console.log(`Captures: ${captures.length}`);
  // eslint-disable-next-line no-console
  console.log("SIMULATION_AGGREGATE_JSON:" + JSON.stringify(aggregate));

  // El test no falla por findings — es read-only analysis. Solo verifica
  // que la simulation completó.
  expect(cumulativeSessions).toBe(270);
  expect(captures.length).toBeGreaterThan(20);
});
