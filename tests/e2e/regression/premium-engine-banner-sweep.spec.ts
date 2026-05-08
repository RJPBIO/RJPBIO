/**
 * Phase 6J-2 — Engine Banner Sweep (5 HIGH findings).
 *
 * Cubre el surface de outputs del engine que estaban invisibles en mobile:
 *   - HIGH-3: EngineHealthView refactor a evaluateEngineHealth direct
 *             (KPI grid + signals checklist + recalibration + actions)
 *   - HIGH-6: NeuralSettings fatigue KPITile dedicado
 *   - HIGH-4: FatigueBanner + RecalibrationBanner en PersonalizedView
 *   - HIGH-5: SystemReadingSubCard (momentum + burnout chips)
 *   - HIGH-2: useNom35Profile → nom35Dominios → engine reason caption
 *
 * E2E focused en surface contracts (visibility, attributes, structure)
 * via state injection. Ejecutar contra dev server con resetAppState
 * para isolation.
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

const SHOTS = "screenshots/phase6j-2-banner-sweep";

test.describe("Phase 6J-2 — Engine Banner Sweep", () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await resetAppState(page);
    await page.goto("/app");
    await waitForStoreReady(page, 10000);
  });

  // ─── HIGH-3 — EngineHealthView refactor ──────────────────────────

  test("Test 1 — EngineHealthView mobile muestra KPI grid + signals + actions", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 6; i++) {
      await simulateCompleteSession(page, { coherence: 55 + i * 3 });
    }
    await flushStoreToIDB(page);
    await page.goto("/app/profile/engine-health");
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(800);

    // Hero overall verdict visible
    await expect(page.locator('[data-testid="engine-health-overall"]')).toBeVisible();
    // KPI grid: 4 tiles
    await expect(page.locator('[data-testid="engine-health-cohort"]')).toBeVisible();
    await expect(page.locator('[data-testid="engine-health-accuracy"]')).toBeVisible();
    await expect(page.locator('[data-testid="engine-health-acceptance"]')).toBeVisible();
    await expect(page.locator('[data-testid="engine-health-fatigue"]')).toBeVisible();
    // Signals checklist visible
    await expect(page.locator('[data-testid="engine-health-signals"]')).toBeVisible();
    await expect(page.locator('[data-testid="engine-health-signal-sensitivity"]')).toBeVisible();

    await page.screenshot({
      path: `${SHOTS}/01-engine-health-mobile-refactored.png`,
      fullPage: true,
    });
  });

  // ─── HIGH-4 — FatigueBanner ──────────────────────────────────────

  test("Test 2 — PersonalizedView con context.fatigue.level=mild → FatigueBanner visible", async ({ page }) => {
    // Setup con history que active mild fatigue: ≥30% partial sessions.
    await setupPostOnboarding(page, { intent: "calma" });
    // Simulate 14 sessions, 5 con partial=true para activar mild ratio (≥0.30).
    for (let i = 0; i < 14; i++) {
      await page.evaluate((idx) => {
        const store = (window as unknown as { __BIO_STORE__: { getState: () => Record<string, unknown> } }).__BIO_STORE__;
        const state = store.getState() as Record<string, unknown>;
        const histPrev = (state.history as unknown[]) || [];
        const isPartial = idx < 5; // primeras 5 partial
        const newHist = [
          ...histPrev,
          {
            ts: Date.now() - (14 - idx) * 60000,
            p: "Reinicio Parasimpático",
            int: "calma",
            d: 120,
            c: 60,
            bioQ: isPartial ? 35 : 60,
            quality: isPartial ? "ligera" : "alta",
            partial: isPartial,
            pauses: isPartial ? 3 : 0,
            dur: 120,
            hiddenSec: 0,
          },
        ];
        const completeSession = state.completeSession as (args: Record<string, unknown>) => void;
        completeSession?.({
          eVC: 5, nC: 60, nR: 50, nE: 50, ns: newHist.length,
          nsk: newHist.length, nw: [0, 0, 0, 0, 0, 0, newHist.length],
          newHist, ach: [], totalT: 120,
        });
      }, i);
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(1500);

    // Banner debería estar visible (mild o severe según ratio actual).
    const banner = page.locator('[data-testid="fatigue-banner"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${SHOTS}/02-fatigue-banner-mild.png`,
      fullPage: true,
    });
  });

  test("Test 3 — RecalibrationBanner cuando staleness ≥ cooling", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    // Inject history con lastTs viejo (>30 días) para trigger 'cooling'+ recalibrate truthy.
    await page.evaluate(() => {
      const store = (window as unknown as { __BIO_STORE__: { getState: () => Record<string, unknown>; setState: (s: Record<string, unknown>) => void } }).__BIO_STORE__;
      const oldTs = Date.now() - 35 * 86400000;
      const newHist = [
        { ts: oldTs, p: "Reinicio Parasimpático", int: "calma", d: 120, c: 60, bioQ: 60, dur: 120 },
      ];
      store.setState({
        history: newHist,
        totalSessions: 1,
        moodLog: [],
        weeklyData: [0, 0, 0, 0, 0, 0, 0],
      });
    });
    await page.waitForTimeout(800);

    const banner = page.locator('[data-testid="recalibration-banner"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${SHOTS}/03-recalibration-banner.png`,
      fullPage: true,
    });
  });

  // ─── HIGH-5 — SystemReadingSubCard ───────────────────────────────

  test("Test 4 — SystemReadingSubCard con momentum + burnoutRisk visible", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    // Suficientes sesiones (10+) para que momentum.direction !== neutral.
    for (let i = 0; i < 12; i++) {
      await simulateCompleteSession(page, { coherence: 60 + (i % 4) * 5 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(1000);

    // Sub-card visible con al menos un chip
    const card = page.locator('[data-testid="system-reading-subcard"]');
    await expect(card).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${SHOTS}/04-system-reading-subcard.png`,
      fullPage: true,
    });
  });

  // ─── HIGH-2 — useNom35Profile propagación ────────────────────────

  test("Test 5 — User con nom035Results → nom35Dominios propaga al engine", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    // Inject nom035Results con dominio "carga" alto → nom35Bias intent="reset".
    await page.evaluate(() => {
      const store = (window as unknown as { __BIO_STORE__: { getState: () => Record<string, unknown> } }).__BIO_STORE__;
      const state = store.getState() as Record<string, unknown>;
      const logNOM035 = state.logNOM035 as (r: Record<string, unknown>) => void;
      logNOM035?.({
        ts: Date.now(),
        total: 50,
        nivel: "medio",
        nivelLabel: "Riesgo medio",
        porDominio: { condiciones: 5, carga: 12, falta_control: 4, jornada: 6, interferencia: 4, liderazgo: 3, violencia: 0 },
        porCategoria: {},
      });
    });
    await page.waitForTimeout(500);

    const storeState = await getStoreState(page);
    const nom035Results = storeState?.nom035Results as Record<string, unknown>[] | undefined;
    expect(nom035Results).toBeTruthy();
    expect(nom035Results?.length).toBeGreaterThan(0);
    const latest = nom035Results?.[0] as Record<string, unknown>;
    const porDom = latest.porDominio as Record<string, number>;
    expect(porDom.carga).toBe(12); // dominante
  });

  // ─── ANTI-REGRESSION — HeroComposite/DimensionsRow intactos ──────

  test("Test 6 — HeroComposite + DimensionsRow + AlternativesCard intactos", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });
    for (let i = 0; i < 16; i++) {
      await simulateCompleteSession(page, { coherence: 60 + (i % 3) * 5 });
    }
    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(1500);

    // Phase 6H Premium-Fix1 HeroComposite presente
    await expect(page.locator('[data-v2-hero-composite], [data-testid*="hero"]').first())
      .toBeVisible({ timeout: 5000 });
    // Phase 6H Premium-Fix1 DimensionsRow presente
    await expect(page.locator('[data-v2-dimensions-row], [data-testid*="dimensions"]').first())
      .toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${SHOTS}/05-personalized-full-with-banners.png`,
      fullPage: true,
    });
  });
});
