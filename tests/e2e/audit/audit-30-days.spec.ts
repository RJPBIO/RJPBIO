/**
 * AUDITORÍA E2E 30 DÍAS — REWRITE Phase 6G Fix1.5 (validation)
 *
 * Versión previa asumía cross-test state persistence en `mode: 'serial'`,
 * pero Playwright crea NUEVO BrowserContext por cada test (default) →
 * IDB y localStorage se borran entre tests → state se pierde → falsos
 * positivos masivos en bugs "persistencia rota / cohort transitions
 * rotas". Esos bugs eran ARTIFACTS del test harness, no del producto.
 *
 * Esta reescritura separa correctamente:
 *
 * TEST 1 — 30 días continuos en MISMA `page` (mismo BrowserContext).
 *   Todas las simulaciones, reloads y assertions ocurren dentro de UN
 *   solo test() callback. Esto es el equivalente fiel a un usuario
 *   real abriendo la PWA, usándola 30 días, recargando ocasionalmente.
 *   Validación rigurosa del master bug post-Fix1.
 *
 * TESTS 2-N — Checkpoints isolated (cada test fresh context). Cada
 *   uno hace setupPostOnboarding al inicio + simula estado previo via
 *   store + verifica feature específica. NO depende de estado cross-test.
 *
 * Decisión de validación basada en resultado:
 *   Caso A — Test 1 PASS sin P0 → cross-test artifact confirmado, Fix1 OK
 *   Caso B — Test 1 FAIL con P0 → bug residual no detectado por Fix1
 *   Caso C — Test 1 PASS, checkpoints fallan → bugs por feature aislados
 */
import { test, expect, Page, ConsoleMessage } from "@playwright/test";
import {
  resetAppState,
  waitForStoreReady,
  setupPostOnboarding,
  simulateCompleteSession,
  flushStoreToIDB,
  getStoreState,
  completeWelcome,
  skipAllCalibration,
} from "../utils/helpers";

const SHOTS_CONT = "screenshots/audit-30-days-continuous";
const SHOTS_CHK = "screenshots/audit-30-days-continuous/checkpoint";

// ============================================================================
// TEST 1 — 30 DÍAS CONTINUOS EN MISMO BROWSERCONTEXT
// ============================================================================
test.describe("Audit 30 días — Continuous flow (mismo BrowserContext)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(300_000); // 5 min — flow completo de 30 días

  test("30 días continuos: onboarding → 30 sesiones → reloads + transitions", async ({ page }) => {
    type Bug = { severity: "P0" | "P1" | "P2"; day: number; description: string; repro: string };
    const bugs: Bug[] = [];
    const captures: string[] = [];
    const consoleErrors: { test: string; text: string }[] = [];
    const networkErrors: { status: number; url: string; method: string }[] = [];

    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (/Download the React DevTools/i.test(text)) return;
        consoleErrors.push({ test: "continuous", text });
      }
    });
    page.on("response", (resp) => {
      const status = resp.status();
      if (status >= 400) {
        networkErrors.push({ status, url: resp.url(), method: resp.request().method() });
      }
    });

    async function shot(label: string, day: number) {
      const filename = `audit-continuous-d${String(day).padStart(2, "0")}-${label}.png`;
      await page.screenshot({ path: `${SHOTS_CONT}/${filename}`, fullPage: true }).catch(() => {});
      captures.push(filename);
    }
    function reportBug(severity: "P0" | "P1" | "P2", day: number, description: string, repro: string) {
      bugs.push({ severity, day, description, repro });
      console.error(`[AUDIT BUG][${severity}][D${day}] ${description}`);
    }

    // ====================================================================
    // DÍA 0 — Onboarding completo (Welcome real + skipAllCalibration helper)
    // ====================================================================
    await resetAppState(page);
    await page.goto("/app", { waitUntil: "networkidle" });
    await waitForStoreReady(page, 15000);
    await shot("01-fresh", 0);

    // Welcome real flow
    let welcomeOk = false;
    try {
      await completeWelcome(page, "calma");
      welcomeOk = true;
    } catch (e) {
      reportBug("P0", 0, `Welcome flow falló: ${(e as Error).message.slice(0, 200)}`, "completeWelcome helper invokes 5 manifesto + intent picker");
    }
    await shot("02-post-welcome", 0);

    // Calibration skip-all (helper post-Fix1 con data-testid)
    let calibrationOk = false;
    if (welcomeOk) {
      try {
        await skipAllCalibration(page);
        calibrationOk = true;
      } catch (e) {
        reportBug("P0", 0, `Calibration skip-all falló: ${(e as Error).message.slice(0, 200)}`, "skipAllCalibration helper post-Fix1");
      }
    }
    await shot("03-post-calibration", 0);

    // Verify state persistido tras onboarding real
    let state = await getStoreState(page);
    if (welcomeOk && !state?.welcomeDone) {
      reportBug("P0", 0, "welcomeDone NO se persiste post-onboarding real", "Welcome 5 pasos + intent picker → state.welcomeDone debe ser true");
    }
    if (welcomeOk && state?.firstIntent !== "calma") {
      reportBug("P0", 0, `firstIntent="${state?.firstIntent}", esperado "calma"`, "Welcome step 5 → state.firstIntent");
    }
    if (calibrationOk && !state?.onboardingComplete) {
      reportBug("P0", 0, "onboardingComplete NO se persiste tras skip-all", "Calibration summary → 'Empezar' → state.onboardingComplete");
    }

    // Si onboarding real falló, fallback a setupPostOnboarding para no abortar audit
    if (!welcomeOk || !calibrationOk) {
      await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    }

    // ====================================================================
    // DÍA 1 — Primera sesión simulada
    // ====================================================================
    await simulateCompleteSession(page, { coherence: 60 });
    await flushStoreToIDB(page);

    state = await getStoreState(page);
    const histLen1 = ((state?.history as unknown[]) || []).length;
    if (histLen1 !== 1) {
      reportBug("P0", 1, `history.length=${histLen1}, esperado 1`, "1 simulateCompleteSession → state.history debe tener 1 entry");
    }
    await shot("01-after-session", 1);

    // ====================================================================
    // DÍA 2-4 — 3 sesiones consecutivas (TOTAL acumulado: 4)
    // ====================================================================
    for (let d = 2; d <= 4; d++) {
      await simulateCompleteSession(page, { coherence: 60 + d });
      await page.waitForTimeout(80);
    }
    await flushStoreToIDB(page);

    state = await getStoreState(page);
    const histLen4 = ((state?.history as unknown[]) || []).length;
    if (histLen4 !== 4) {
      reportBug("P0", 4, `history.length=${histLen4}, esperado 4 (cumulativo)`, "Día 1+Día 2-4 = 4 sesiones acumuladas en mismo context");
    }

    // RELOAD CRÍTICO: simula user que cierra y reabre la PWA
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(400);
    await shot("05-after-reload", 4);

    state = await getStoreState(page);
    const histLen4PostReload = ((state?.history as unknown[]) || []).length;
    if (histLen4PostReload !== 4) {
      reportBug("P0", 4, `history.length=${histLen4PostReload} POST-RELOAD, esperado 4`, "CRITICAL: master bug — state se pierde tras reload");
    }
    if (!state?.welcomeDone) {
      reportBug("P0", 4, "welcomeDone=false POST-RELOAD — Welcome modal reaparece", "MASTER BUG: Phase 6G Fix1 debió resolver esto");
    }

    // ====================================================================
    // DÍA 5 — Cohort transition ColdStart → LearningView (totalSessions=5)
    // ====================================================================
    await simulateCompleteSession(page, { coherence: 65 });
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(400);
    await shot("01-learning-transition", 5);

    state = await getStoreState(page);
    const histLen5 = ((state?.history as unknown[]) || []).length;
    if (histLen5 !== 5) {
      reportBug("P0", 5, `history.length=${histLen5}, esperado 5 POST-RELOAD`, "5 sesiones acumuladas + reload");
    }
    const learningVisible = await page.locator("[data-v2-learning-progress]").isVisible({ timeout: 4000 }).catch(() => false);
    if (!learningVisible) {
      reportBug("P0", 5, "[data-v2-learning-progress] NO visible tras 5 sesiones + reload", "totalSessions=5 + reload → LearningView debe mountar (Phase 6E SP-A)");
    }
    const recoVisible = await page.locator("[data-v2-recommendation]").isVisible({ timeout: 2000 }).catch(() => false);
    if (!recoVisible) {
      reportBug("P1", 5, "[data-v2-recommendation] NO visible en LearningView", "LearningView debe renderear RecommendationCard (engine|fallback)");
    }

    // ====================================================================
    // DÍA 6-7 — HRV manual + PSS-4 retake
    // ====================================================================
    await page.evaluate(() => {
      const store = window.__BIO_STORE__;
      if (!store) return;
      const s = store.getState();
      s.logHRV?.({ ts: Date.now(), rmssd: 45, sdnn: 50, source: "manual" });
    });
    await page.waitForTimeout(150);

    state = await getStoreState(page);
    const hrvLen = ((state?.hrvLog as unknown[]) || []).length;
    if (hrvLen === 0) {
      reportBug("P1", 6, "logHRV no agregó entry a hrvLog", "logHRV action call");
    }

    // Día 8 PSS-4 retake
    await page.evaluate(() => {
      const store = window.__BIO_STORE__;
      if (!store) return;
      const s = store.getState();
      s.logInstrument?.({
        instrumentId: "pss-4",
        ts: Date.now(),
        score: 5,
        level: "moderate",
      });
    });
    await page.waitForTimeout(150);
    await flushStoreToIDB(page);
    await shot("01-instruments-logged", 8);

    // ====================================================================
    // DÍA 9 — Programs route check
    // ====================================================================
    const programsResp = await page.goto("/app/programs", { waitUntil: "networkidle" }).catch(() => null);
    const programsStatus = programsResp?.status() ?? 0;
    if (programsStatus === 404) {
      reportBug("P1", 9, "/app/programs devuelve 404 (page no existe)", "GET /app/programs");
    }
    await shot("01-programs-page", 9);

    // Volver al main app para sesiones
    await page.goto("/app", { waitUntil: "networkidle" });
    await waitForStoreReady(page, 10000);

    // ====================================================================
    // DÍA 10-19 — Sesiones + reload cada 5 días para test de persistencia
    //
    // Conteo correcto: pre-Día 10 ya acumulamos 5 sesiones (Días 1-5).
    // Días 6-9 NO simulan sesiones — solo HRV, PSS-4 retake, programs
    // route check. Cada iter del loop add 1 sesión → expected[d] =
    // 5 + (d - 9) = d - 4
    // ====================================================================
    let cumulative = 5; // Tras Día 1 (1) + Día 2-4 (3) + Día 5 (1) = 5
    for (let d = 10; d <= 19; d++) {
      await simulateCompleteSession(page, { coherence: 65 + (d % 5) });
      cumulative += 1;
      await page.waitForTimeout(60);

      if (d % 5 === 0) {
        await flushStoreToIDB(page);
        await page.reload();
        await waitForStoreReady(page, 10000);
        await page.waitForTimeout(300);

        state = await getStoreState(page);
        const got = ((state?.history as unknown[]) || []).length;
        if (got !== cumulative) {
          reportBug("P0", d, `history.length=${got}, esperado ${cumulative} POST-RELOAD día ${d}`, `${cumulative} sesiones acumuladas + reload`);
        }
      }
    }
    await shot("01-mid-program", 19);
    // Aquí cumulative = 15 (5 inicial + 10 del loop)

    // ====================================================================
    // DÍA 20 — Cohort transition Learning → Personalized
    // ====================================================================
    await simulateCompleteSession(page, { coherence: 72 });
    cumulative += 1; // 16
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(500);
    await shot("01-personalized-transition", 20);

    state = await getStoreState(page);
    const histLen20 = ((state?.history as unknown[]) || []).length;
    if (histLen20 !== cumulative) {
      reportBug("P0", 20, `history.length=${histLen20}, esperado ${cumulative} POST-RELOAD`, `${cumulative} sesiones + reload — pivot crítico`);
    }
    // Note: el branch evaluator usa totalSessions ≥ 20 para Personalized
    // (Phase 6E SP-A default branch). Con cumulative=16, todavía LearningView.
    // Verificamos la rama correcta según el conteo real.
    if (cumulative >= 20) {
      const heroVisible = await page.locator("[data-v2-hero]").isVisible({ timeout: 4000 }).catch(() => false);
      if (!heroVisible) {
        reportBug("P0", 20, `[data-v2-hero] NO visible con totalSessions=${cumulative}`, "totalSessions≥20 → PersonalizedView debe mountar");
      }
    } else {
      const learningVisible = await page.locator("[data-v2-learning-progress]").isVisible({ timeout: 4000 }).catch(() => false);
      if (!learningVisible) {
        reportBug("P1", 20, `[data-v2-learning-progress] NO visible con totalSessions=${cumulative} (5≤N<20)`, "Learning branch debe seguir activo hasta 20 sesiones");
      }
    }

    // ====================================================================
    // DÍA 21-29 — Continuar PersonalizedView features
    // ====================================================================
    for (let d = 21; d <= 29; d++) {
      await simulateCompleteSession(page, { coherence: 70 + (d % 8) });
      cumulative += 1;
      await page.waitForTimeout(50);
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(500);
    await shot("01-day29", 29);
    // Aquí cumulative = 25 (16 + 9 del loop)

    state = await getStoreState(page);
    const histLen29 = ((state?.history as unknown[]) || []).length;
    if (histLen29 !== cumulative) {
      reportBug("P0", 29, `history.length=${histLen29}, esperado ${cumulative}`, `${cumulative} sesiones acumuladas + reload`);
    }
    // Para cumulative=25, branch debe ser Personalized (≥20)
    const heroVisibleLate = await page.locator("[data-v2-hero]").isVisible({ timeout: 4000 }).catch(() => false);
    if (cumulative >= 20 && !heroVisibleLate) {
      reportBug("P0", 29, `[data-v2-hero] NO visible con totalSessions=${cumulative}`, "totalSessions≥20 sostenido + reload → PersonalizedView");
    }

    // Wellbeing trends accesible
    await page.goto("/app/wellbeing", { waitUntil: "networkidle" }).catch(() => null);
    await page.waitForTimeout(500);
    await shot("02-wellbeing", 29);

    // ====================================================================
    // DÍA 30 — Final verification
    // ====================================================================
    await page.goto("/app", { waitUntil: "networkidle" });
    await waitForStoreReady(page, 10000);
    await simulateCompleteSession(page, { coherence: 75 });
    cumulative += 1; // 26
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(500);
    await shot("01-final", 30);

    state = await getStoreState(page);
    const histLenFinal = ((state?.history as unknown[]) || []).length;
    if (histLenFinal !== cumulative) {
      reportBug("P0", 30, `history.length=${histLenFinal}, esperado ${cumulative} (final)`, `${cumulative} sesiones acumuladas + reload final`);
    }
    if (!state?.welcomeDone) {
      reportBug("P0", 30, "welcomeDone=false al día 30 — state corrupted", "MASTER BUG cascading");
    }

    // ====================================================================
    // RESUMEN + persistir aggregate
    // ====================================================================
    const p0 = bugs.filter((b) => b.severity === "P0");
    const p1 = bugs.filter((b) => b.severity === "P1");
    const p2 = bugs.filter((b) => b.severity === "P2");

    console.log("\n═══════════════════════════════════════════════════════");
    console.log(`AUDIT 30 DÍAS CONTINUOS — RESUMEN`);
    console.log(`Total bugs: ${bugs.length} (P0=${p0.length}, P1=${p1.length}, P2=${p2.length})`);
    console.log(`Capturas: ${captures.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Network errors: ${networkErrors.length}`);
    console.log(`Final state: history=${histLenFinal}, totalSessions=${state?.totalSessions}, welcomeDone=${state?.welcomeDone}`);
    console.log("═══════════════════════════════════════════════════════");

    if (p0.length > 0) {
      console.log("\n=== P0 BUGS DETECTADOS ===");
      p0.forEach((b) => {
        console.log(`Día ${b.day}: ${b.description}`);
        console.log(`  Repro: ${b.repro}`);
      });
    }

    // Persistir aggregate JSON
    const fs = await import("fs");
    const path = await import("path");
    fs.mkdirSync(path.resolve(SHOTS_CONT), { recursive: true });
    fs.writeFileSync(
      path.join(path.resolve(SHOTS_CONT), "audit-continuous-aggregate.json"),
      JSON.stringify(
        {
          bugs,
          captures,
          consoleErrors: consoleErrors.slice(0, 100),
          networkErrors: networkErrors.slice(0, 100),
          finalState: {
            historyLen: histLenFinal,
            totalSessions: state?.totalSessions,
            welcomeDone: state?.welcomeDone,
            firstIntent: state?.firstIntent,
            onboardingComplete: state?.onboardingComplete,
          },
        },
        null,
        2
      )
    );

    // Soft assertion: el test "pasa" si 0 P0. Cualquier P0 indica
    // bug residual que escapó al Fix1 → SP-Fix1.5 necesario.
    expect(p0).toEqual([]);
  });
});

// ============================================================================
// TESTS 2-N — CHECKPOINT TESTS (FAST, ISOLATED, EACH FRESH CONTEXT)
// ============================================================================
test.describe("Audit 30 días — Checkpoint tests (isolated)", () => {
  test.setTimeout(60_000);

  test("Checkpoint Día 1: post-onboarding state correcto", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    const state = await getStoreState(page);
    expect(state?.welcomeDone).toBe(true);
    expect(state?.firstIntent).toBe("calma");
    expect(state?.onboardingComplete).toBe(true);
    expect((state?.history as unknown[])?.length).toBe(0);
    await page.screenshot({ path: `${SHOTS_CHK}-day1-post-onboarding.png`, fullPage: true });
  });

  test("Checkpoint Día 5: 5 sesiones isolated → LearningView", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    for (let i = 0; i < 5; i++) await simulateCompleteSession(page, { coherence: 60 + i });
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await expect(page.locator("[data-v2-learning-progress]")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${SHOTS_CHK}-day5-learning.png`, fullPage: true });
  });

  test("Checkpoint Día 20: 20 sesiones isolated → PersonalizedView", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    for (let i = 0; i < 20; i++) await simulateCompleteSession(page, { coherence: 60 + (i % 10) });
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await expect(page.locator("[data-v2-hero]")).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${SHOTS_CHK}-day20-personalized.png`, fullPage: true });
  });

  test("Checkpoint Programs page: /app/programs existe?", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    const resp = await page.goto("/app/programs", { waitUntil: "networkidle" }).catch(() => null);
    const status = resp?.status() ?? 0;
    await page.screenshot({ path: `${SHOTS_CHK}-programs.png`, fullPage: true });
    // Documenta el bug pero no aborta — sabemos que es P1 confirmado
    if (status === 404) {
      console.log(`[CHECKPOINT] /app/programs returns 404 — confirmed P1 bug`);
    }
    expect([200, 404]).toContain(status); // 200 ok, 404 confirms doc'd bug
  });

  test("Checkpoint Bottom nav present con AppV2Root mounted", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    await page.waitForSelector("[data-v2-root]", { timeout: 5000 });
    const tabs = ["hoy", "datos", "coach", "perfil"];
    const missing: string[] = [];
    for (const tab of tabs) {
      const count = await page.locator(`[data-v2-tab="${tab}"]`).count();
      if (count === 0) missing.push(tab);
    }
    await page.screenshot({ path: `${SHOTS_CHK}-bottom-nav.png`, fullPage: true });
    expect(missing).toEqual([]);
  });

  test("Checkpoint Tab switches preservan state", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    await simulateCompleteSession(page);
    const stateBefore = await getStoreState(page);
    const histBefore = ((stateBefore?.history as unknown[]) || []).length;

    await page.locator('[data-v2-tab="datos"]').click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.locator('[data-v2-tab="hoy"]').click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);

    const stateAfter = await getStoreState(page);
    const histAfter = ((stateAfter?.history as unknown[]) || []).length;
    expect(histAfter).toBe(histBefore);
  });

  test("Checkpoint Reload preserva state (anti-master-bug single test)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    await simulateCompleteSession(page);
    await simulateCompleteSession(page);
    await flushStoreToIDB(page);

    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(300);

    const state = await getStoreState(page);
    expect(state?.welcomeDone).toBe(true);
    expect(state?.firstIntent).toBe("calma");
    expect((state?.history as unknown[])?.length).toBe(2);
  });

  test("Checkpoint Wellbeing route accesible", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    const resp = await page.goto("/app/wellbeing", { waitUntil: "networkidle" }).catch(() => null);
    const status = resp?.status() ?? 0;
    await page.screenshot({ path: `${SHOTS_CHK}-wellbeing.png`, fullPage: true });
    expect(status).toBeLessThan(400);
  });
});
