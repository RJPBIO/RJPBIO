/**
 * Phase 6G Fix1 — Master persistence anti-regression (P0-1).
 *
 * Reproductor + anti-regresión del master bug detectado en auditoría
 * 30 días: cada page.reload() regresaba state a defaults (Welcome
 * reaparecía + cookie banner). Root cause: useStore.init() llamaba
 * clearAll() cuando saved._userId !== null pero opts.userId === null
 * (case ambiguo durante mount inicial / 429 sobre /api/auth/session).
 *
 * Fix en src/store/useStore.js belongsToUser + init: ambiguous case
 * preserva state + _userId. signOutAndClear() sigue siendo el path
 * explícito para wipear cuando el user de verdad cierra sesión.
 *
 * Test 4 (429 simulado) requiere page.route() interception ANTES del
 * reload para que el next-auth fetch reciba 429 durante hidratación.
 */
import { test, expect } from "@playwright/test";
import {
  resetAppState,
  waitForStoreReady,
  setupPostOnboarding,
  simulateCompleteSession,
  flushStoreToIDB,
  getStoreState,
} from "../utils/helpers";

test.describe.configure({ mode: "serial" });
test.setTimeout(60_000);

test.describe("Phase 6G Fix1 — Master persistence anti-regression P0-1", () => {
  test("Test 1: reload tras setupPostOnboarding preserva state (anon)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    const stateBefore = await getStoreState(page);
    expect(stateBefore?.welcomeDone).toBe(true);
    expect(stateBefore?.firstIntent).toBe("calma");
    expect(stateBefore?.onboardingComplete).toBe(true);

    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(300);

    // ASSERTION CRÍTICA: state survives reload
    const stateAfter = await getStoreState(page);
    expect(stateAfter?.welcomeDone).toBe(true);
    expect(stateAfter?.firstIntent).toBe("calma");
    expect(stateAfter?.onboardingComplete).toBe(true);

    // Welcome modal NO visible
    const welcomeVisible = await page
      .locator("[data-v2-welcome]")
      .isVisible()
      .catch(() => false);
    expect(welcomeVisible).toBe(false);
  });

  test("Test 2: 5 sesiones + reload → LearningView (cohort transition P0-3)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });

    for (let i = 0; i < 5; i++) {
      await simulateCompleteSession(page, { coherence: 60 + i });
    }

    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(300);

    // ASSERTION: LearningView mounted (totalSessions=5)
    await expect(page.locator("[data-v2-learning-progress]")).toBeVisible({ timeout: 5000 });

    const state = await getStoreState(page);
    expect((state?.history as unknown[])?.length).toBe(5);
    expect(state?.totalSessions).toBe(5);
  });

  test("Test 3: 20 sesiones + reload → PersonalizedView (cohort transition P0-4)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });

    for (let i = 0; i < 20; i++) {
      await simulateCompleteSession(page, { coherence: 60 + (i % 10) });
    }

    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(300);

    // ASSERTION: PersonalizedView mounted (default branch dataMaturity=personalized)
    await expect(page.locator("[data-v2-hero]")).toBeVisible({ timeout: 5000 });

    const state = await getStoreState(page);
    expect((state?.history as unknown[])?.length).toBe(20);
    expect(state?.totalSessions).toBe(20);
  });

  test("Test 4: 429 simulado en /api/auth/session NO clava state (master bug)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "enfoque", skipAllInstruments: true });

    // Setear state con _userId simulado (post sync.js identity binding):
    // refleja exactamente el escenario producción donde usuario logged-in
    // tiene saved._userId real, y luego AppV2Root mount llama init({})
    // sin userId.
    await page.evaluate(() => {
      const store = window.__BIO_STORE__;
      if (!store) return;
      store.setState({ _userId: "user-real-from-sync" });
    });
    await flushStoreToIDB(page);

    const stateBefore = await getStoreState(page);
    expect(stateBefore?.welcomeDone).toBe(true);
    expect(stateBefore?._userId).toBe("user-real-from-sync");

    // Mock /api/auth/session retornando 429 ANTES del reload
    await page.route("**/api/auth/session", (route) => {
      route.fulfill({
        status: 429,
        headers: { "content-type": "application/json", "retry-after": "30" },
        body: JSON.stringify({ error: "RateLimited" }),
      });
    });

    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(500);

    // ASSERTION CRÍTICA: state NO se borra a pesar de 429.
    // Con bug previo: belongsToUser({_userId:'user-real-from-sync'}, null)
    // = false → clearAll → welcomeDone=false. Welcome modal visible.
    // Con fix: ambiguous case preserve.
    const stateAfter = await getStoreState(page);
    expect(stateAfter?.welcomeDone).toBe(true);
    expect(stateAfter?.firstIntent).toBe("enfoque");
    expect(stateAfter?._userId).toBe("user-real-from-sync");

    const welcomeVisible = await page
      .locator("[data-v2-welcome]")
      .isVisible()
      .catch(() => false);
    expect(welcomeVisible).toBe(false);

    await page.unroute("**/api/auth/session");
  });
});
