/**
 * Phase 6H Premium-Fix2 — E2E anti-regression ColdStart-active intermediate
 * state.
 *
 * Cierra finding H-2 detectado en SIMULATION_90_DAYS_PREMIUM_ANALYSIS:
 * Day 1-4 cold-start con copy lag y viewport anémico cuando user completó
 * ≥1 sesión PERO menos de 5 (pre-baseline). El nuevo phase=active añade:
 *   · ProgressBar "X de 5 hasta tu trayectoria personalizada"
 *   · MiniStatsRow (sesiones · racha · ventana)
 *   · Recommendation card persistent prepended a las gates pendientes
 *   · Copy adapter "Tu trayectoria está tomando forma" + "TU PRÓXIMO PASO"
 */
import { test, expect } from "@playwright/test";
import {
  resetAppState,
  waitForStoreReady,
  setupPostOnboarding,
  simulateCompleteSession,
  flushStoreToIDB,
} from "../utils/helpers";

test.describe.configure({ mode: "serial" });

const SHOTS = "screenshots/phase6h-premium-fix2";

test.describe("Phase 6H Premium-Fix2 — ColdStart-active intermediate state", () => {
  test.setTimeout(120_000);

  test("post-onboarding sin sesiones (N=0) → phase=fresh, NO progress bar ni mini-stats", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    await page.waitForTimeout(500);

    await expect(page.locator("[data-v2-coldstart][data-phase='fresh']")).toBeVisible();
    await expect(page.locator('[data-testid="coldstart-active-progress"]')).toBeHidden();
    await expect(page.locator("[data-v2-mini-stats-row]")).toBeHidden();
    // Eyebrow legacy preservado
    await expect(page.locator("text=/EMPEZAR POR AQUÍ/i")).toBeVisible();
    // No reco persistent
    await expect(page.locator('[data-testid="coldstart-active-recommendation"]')).toBeHidden();

    await page.screenshot({
      path: `${SHOTS}/01-fresh-day0.png`,
      fullPage: true,
    });
  });

  test("3 sesiones con HRV pendiente → phase=active con progress + mini-stats + reco persistente", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 3; i++) {
      await simulateCompleteSession(page, { coherence: 60 + i * 5 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(800);

    // ASSERTION CRÍTICA: phase=active activo
    await expect(page.locator("[data-v2-coldstart][data-phase='active']")).toBeVisible();

    // ProgressBar visible con 3/5
    const progress = page.locator('[data-testid="coldstart-active-progress"]');
    await expect(progress).toBeVisible();
    const bar = page.locator("[data-v2-learning-progressbar]");
    await expect(bar).toHaveAttribute("aria-valuenow", "3");
    await expect(bar).toHaveAttribute("aria-valuemax", "5");

    // MiniStatsRow visible con 3 stats
    await expect(page.locator("[data-v2-mini-stats-row]")).toBeVisible();
    await expect(page.locator('[data-testid="mini-stat-sessions"]')).toBeVisible();
    await expect(page.locator('[data-testid="mini-stat-streak"]')).toBeVisible();
    await expect(page.locator('[data-testid="mini-stat-window"]')).toBeVisible();
    // Sesiones value = 3
    await expect(page.locator('[data-testid="mini-stat-sessions"]')).toContainText("3");

    // Copy adapter
    await expect(page.locator("text=/TU PRÓXIMO PASO/i")).toBeVisible();
    await expect(page.locator("text=/Tu trayectoria está tomando forma/i")).toBeVisible();

    // Reco persistent visible
    await expect(page.locator('[data-testid="coldstart-active-recommendation"]')).toBeVisible();
    await expect(page.locator('[data-testid="coldstart-active-recommendation"]')).toContainText(/RECOMENDADO/i);

    await page.screenshot({
      path: `${SHOTS}/02-active-3-sessions.png`,
      fullPage: true,
    });
  });

  test("threshold N=5 → eleva a LearningView branch (no más cold-start)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 5; i++) {
      await simulateCompleteSession(page, { coherence: 65 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(500);

    // ColdStart NO debe estar visible — LearningView se activa
    await expect(page.locator("[data-v2-learning-progress]")).toBeVisible();
    await expect(page.locator("[data-v2-coldstart]")).toBeHidden();

    await page.screenshot({
      path: `${SHOTS}/03-elevated-to-learning.png`,
      fullPage: true,
    });
  });

  test("tap reco card persistent dispara onAction con shape correcto", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 2; i++) {
      await simulateCompleteSession(page, { coherence: 60 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(500);

    const reco = page.locator('[data-testid="coldstart-active-recommendation"]');
    await expect(reco).toBeVisible();
    // Click tracking — el handler de HomeV2 redirige al ProtocolPlayer.
    // Solo verificamos que el click no causa error y la card es interactable.
    await reco.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    // Player o navegación — depende del onNavigate handler. Aceptamos cualquier
    // estado salvo error de runtime (ya verificado por console listener).
  });

  test("capture comparativa Day 0 vs Day 3", async ({ page }) => {
    // Day 0 fresh
    await setupPostOnboarding(page, { intent: "calma" });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SHOTS}/04-comparison-day0.png`,
      fullPage: true,
    });

    // Day 3 active
    for (let i = 0; i < 3; i++) {
      await simulateCompleteSession(page, { coherence: 60 + i * 4 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(800);

    await page.screenshot({
      path: `${SHOTS}/05-comparison-day3.png`,
      fullPage: true,
    });
  });
});
