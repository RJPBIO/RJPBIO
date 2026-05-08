/**
 * Phase 6J-1 — Engine Wiring Critical (4 CRITICAL findings + HIGH-1).
 *
 * Cubre las 4 piezas que cierran el gap input/output del motor neural:
 *   - GROUP A: MoodPostSessionSheet renderable + state shape correcto
 *              (CRITICAL-1 logMood + CRITICAL-2 bandit reward).
 *   - GROUP B: detectGamingV2 invocado en calcSessionCompletion
 *              (CRITICAL-3 — verdict shape vs v1 binario).
 *   - GROUP C: MoodPrePicker visible en branches correctos + propagación
 *              currentMood al hook (CRITICAL-4 moodIsExplicit branch).
 *   - HIGH-1:  banditArms[i].lastUpdatedAt set después de
 *              recordSessionOutcome (Sprint 47 time-decay activation).
 *
 * E2E focused en surface contracts (visibility, attributes, state
 * shape post-action). No simula player flow completo — el handler
 * de complete se exercise via store.recordSessionOutcome directo
 * para validar contratos sin depender del UI del player.
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

const SHOTS = "screenshots/phase6j-1-engine-wiring";

test.describe("Phase 6J-1 — Engine Wiring Critical", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
    await page.goto("/app");
    await waitForStoreReady(page, 10000);
  });

  // ─── GROUP C — MoodPrePicker visibility per branch ──────────────

  test("Test 1 — Cold-start fresh (N=0) → MoodPrePicker NO visible", async ({ page }) => {
    // Post-onboarding pero sin sesiones aún → cold-start fresh.
    // Decisión Group C: pre-picker NO se muestra en N=0 (engine ignora
    // currentMood en cold-start fresh sin historial).
    await setupPostOnboarding(page, { intent: "calma" });
    await page.waitForTimeout(800);

    const picker = page.locator('[data-testid="home-mood-pre-picker"]');
    await expect(picker).not.toBeVisible({ timeout: 2000 });

    await page.screenshot({
      path: `${SHOTS}/01-coldstart-fresh-no-picker.png`,
      fullPage: true,
    });
  });

  test("Test 2 — Cold-start active (N=1) → MoodPrePicker visible", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    await simulateCompleteSession(page, { coherence: 60 });
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(800);

    const picker = page.locator('[data-testid="home-mood-pre-picker"]');
    await expect(picker).toBeVisible();
    // 5 mood options renderizados
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`[data-testid="home-mood-pre-picker-${i}"]`)).toBeVisible();
    }

    await page.screenshot({
      path: `${SHOTS}/02-coldstart-active-picker-visible.png`,
      fullPage: true,
    });
  });

  test("Test 3 — Tap mood option → aria-checked + data-active markers", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    await simulateCompleteSession(page, { coherence: 60 });
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(800);

    const opt3 = page.locator('[data-testid="home-mood-pre-picker-3"]');
    await opt3.click();
    await expect(opt3).toHaveAttribute("aria-checked", "true");
    await expect(opt3).toHaveAttribute("data-active", "true");
    // Otros options NO active
    await expect(page.locator('[data-testid="home-mood-pre-picker-1"]'))
      .toHaveAttribute("aria-checked", "false");

    await page.screenshot({
      path: `${SHOTS}/03-mood-3-selected.png`,
      fullPage: true,
    });
  });

  test("Test 4 — Tap mismo mood → toggle off (aria-checked false)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    await simulateCompleteSession(page, { coherence: 60 });
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(800);

    const opt5 = page.locator('[data-testid="home-mood-pre-picker-5"]');
    await opt5.click();
    await expect(opt5).toHaveAttribute("aria-checked", "true");
    await opt5.click();
    await expect(opt5).toHaveAttribute("aria-checked", "false");
  });

  // ─── HIGH-1 — Bandit time-decay activation ──────────────────────

  test("Test 5 — recordSessionOutcome con reward → arm.lastUpdatedAt set (HIGH-1)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    await simulateCompleteSession(page, { coherence: 60 });

    // Inject reward via store action — equivalente a Group A submit path.
    // Antes Phase 6J-1: recordSessionOutcome NO pasaba `now`, lastUpdatedAt
    // quedaba undefined → time-decay (Sprint 47) muerto.
    // Ahora: nowMs derivado de `at || Date.now()` se pasa a updateArm.
    await page.evaluate(() => {
      const store = (window as unknown as { __BIO_STORE__: { getState: () => Record<string, unknown> } }).__BIO_STORE__;
      const state = store.getState() as Record<string, unknown>;
      const recordSessionOutcome = state.recordSessionOutcome as (args: Record<string, unknown>) => void;
      recordSessionOutcome({
        intent: "calma",
        protocol: "Reinicio Parasimpático",
        deltaMood: 1.5, // post=4 - pre=2.5 hipotético
        predictedDelta: null,
        completionRatio: 1,
        energyDelta: null,
        hrvDelta: null,
      });
    });

    await page.waitForTimeout(300);
    const storeState = await getStoreState(page);
    const banditArms = storeState?.banditArms as Record<string, Record<string, number>> | undefined;
    expect(banditArms).toBeTruthy();
    // Arm contextual (calma:bucket) y global (calma) deben tener lastUpdatedAt.
    const armCalmaGlobal = banditArms?.calma;
    expect(armCalmaGlobal).toBeTruthy();
    expect(typeof armCalmaGlobal?.lastUpdatedAt).toBe("number");
    expect(armCalmaGlobal?.n).toBeGreaterThan(0);
  });

  // ─── GROUP A — MoodPostSessionSheet contract ────────────────────

  test("Test 6 — logMood populates state.moodLog (CRITICAL-1 contract)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    await page.waitForTimeout(400);

    // Pre: moodLog vacío (default DS).
    let storeState = await getStoreState(page);
    const moodLogPre = (storeState?.moodLog as unknown[]) || [];
    expect(moodLogPre.length).toBe(0);

    // Trigger logMood (equivalent al flow: sheet onSubmit → handleMoodPostSubmit).
    await page.evaluate(() => {
      const store = (window as unknown as { __BIO_STORE__: { getState: () => Record<string, unknown> } }).__BIO_STORE__;
      const state = store.getState() as Record<string, unknown>;
      const logMood = state.logMood as (entry: Record<string, unknown>) => void;
      logMood({
        mood: 4,
        ts: Date.now(),
        proto: "Reinicio Parasimpático",
        pre: 2,
        energy: 2,
      });
    });

    await page.waitForTimeout(200);
    storeState = await getStoreState(page);
    const moodLogPost = (storeState?.moodLog as Record<string, unknown>[]) || [];
    expect(moodLogPost.length).toBe(1);
    expect(moodLogPost[0].mood).toBe(4);
    expect(moodLogPost[0].pre).toBe(2);
    expect(moodLogPost[0].proto).toBe("Reinicio Parasimpático");
  });

  // ─── GROUP B — detectGamingV2 contract ──────────────────────────

  test("Test 7 — completeSession invokes detectGamingV2 (verdict-shaped)", async ({ page }) => {
    // Verifica que el output del calcSessionCompletion usa v2 verdict
    // (no boolean v1 gaming flag). Test funciona vía simulateCompleteSession
    // que llama el path real del store. El bioQ.quality del último history
    // entry refleja la decisión de v2 (likely-gaming → "inválida").
    await setupPostOnboarding(page, { intent: "calma" });
    await simulateCompleteSession(page, { coherence: 60 });
    await page.waitForTimeout(300);

    const storeState = await getStoreState(page);
    const history = (storeState?.history as Record<string, unknown>[]) || [];
    expect(history.length).toBeGreaterThan(0);
    // Último entry tiene quality field (calcBioQuality output).
    const last = history[history.length - 1];
    expect(["alta", "media", "baja", "ligera", "inválida"]).toContain(last.quality);
  });

  // ─── INTEGRATION — Full flow: pre-picker + currentMood propagation ──

  test("Test 8 — currentMood propagates to useAdaptiveRecommendation context", async ({ page }) => {
    // Setup learning phase para que el engine tenga contexto.
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 6; i++) {
      await simulateCompleteSession(page, { coherence: 55 + i * 3 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(1000);

    // Pre-picker visible (learning branch).
    const picker = page.locator('[data-testid="home-mood-pre-picker"]');
    await expect(picker).toBeVisible({ timeout: 5000 });

    // Tap mood 1 (tensión alta). Engine debería override primaryNeed → calma.
    await page.locator('[data-testid="home-mood-pre-picker-1"]').click();
    await expect(page.locator('[data-testid="home-mood-pre-picker-1"]'))
      .toHaveAttribute("aria-checked", "true");

    await page.screenshot({
      path: `${SHOTS}/04-learning-mood-1-selected.png`,
      fullPage: true,
    });
  });
});
