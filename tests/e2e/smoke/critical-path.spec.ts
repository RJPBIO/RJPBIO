/**
 * Phase 6E SP-B — Smoke E2E critical path.
 *
 * 1 test que corre en CI vía `npm run test:e2e:smoke`. Verifica el
 * flow más crítico del producto post-Phase 6D: post-onboarding state
 * → primera sesión → Tab Hoy nunca stuck. Si este test falla, hay un
 * bug crítico que rompe la experiencia primary del usuario.
 *
 * Uses setupPostOnboarding (state setup via store directo) en lugar
 * de ejecutar Welcome + Calibration step-by-step. Razón: el bug bajo
 * test (Bug-48) vive en HomeV2/ColdStartView/LearningView (post-
 * onboarding), no en el flow del onboarding mismo. Setear welcomeDone
 * via store es equivalente a usuario que completó welcome — el state
 * resultante es el mismo, sin gastar 9+ clicks + transiciones flaky.
 *
 * Para tests del onboarding flow real (cuando ese flow contenga el
 * bug bajo test), usar completeWelcome + skipAllCalibration helpers.
 *
 * Suite completa con boundary cases vive en
 * tests/e2e/onboarding-to-multi-sessions.spec.ts (manual).
 */
import { test, expect } from "@playwright/test";
import {
  setupPostOnboarding,
  simulateCompleteSession,
  assertHomeViewportNotEmpty,
  getStoreState,
  flushStoreToIDB,
} from "../utils/helpers";

test.describe.configure({ mode: "serial" });

test.describe("SP-B smoke — onboarding to first session", () => {
  test("post-onboarding skip-all → Tab Hoy → primera sesión → viewport con contenido", async ({ page }) => {
    // 1. Setup post-onboarding skip-all (state como user que skipea calibration)
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });

    // 2. Tab Hoy debe mostrar ColdStart con cards iniciales
    await assertHomeViewportNotEmpty(page);
    const initialCards = await page.locator("[data-v2-onboarding-row]").count();
    expect(initialCards).toBeGreaterThan(0);

    await page.screenshot({
      path: "screenshots/phase6e-spb-e2e/smoke-01-coldstart-initial.png",
      fullPage: true,
    });

    // 3. Simular primera sesión vía store directo
    await simulateCompleteSession(page, { intent: "calma", coherence: 60 });
    await flushStoreToIDB(page);
    await page.reload();
    await page.waitForSelector("[data-v2-root]", { timeout: 8000 });

    // 4. CRÍTICO: viewport NUNCA vacío post-primera-sesión
    await assertHomeViewportNotEmpty(page);

    // 5. State real verificado
    const state = await getStoreState(page);
    expect(Array.isArray(state?.history)).toBe(true);
    expect((state?.history as unknown[]).length).toBe(1);

    await page.screenshot({
      path: "screenshots/phase6e-spb-e2e/smoke-02-post-1-session.png",
      fullPage: true,
    });
  });
});
