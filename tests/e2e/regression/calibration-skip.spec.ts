/**
 * Phase 6G Fix1 — Calibration skip individual (P0-2).
 *
 * Reproductor del bug donde la auditoría detectó que el helper E2E
 * `skipAllCalibration` no podía avanzar desde paso 1 (PSS-4). Root
 * cause real: el helper buscaba selector `[data-v2-onboarding-calibration]`
 * pero el componente NeuralCalibrationV2 usa `[data-v2-calibration]`.
 * Fix aplicado en tests/e2e/utils/helpers.ts.
 *
 * Este spec valida que el botón "Saltar este instrumento" SÍ funciona
 * en producción (no era bug de UI; el handler handleSkipInstrument
 * ya hacía setStep(s+1) correctamente desde Phase 6).
 */
import { test, expect } from "@playwright/test";
import { resetAppState, completeWelcome } from "../utils/helpers";

test.describe.configure({ mode: "serial" });
test.setTimeout(60_000);

test.describe("Phase 6G Fix1 — Calibration skip individual P0-2", () => {
  test("Skip individual avanza step PSS-4 → rMEQ → MAIA-2 → HRV → Resumen", async ({ page }) => {
    await resetAppState(page);
    await page.goto("/app", { waitUntil: "networkidle" });
    await completeWelcome(page, "calma");

    // Calibration mounted con `data-v2-calibration` (post-fix selector)
    await expect(page.locator("[data-v2-calibration]")).toBeVisible({ timeout: 5000 });

    // Step 1 PSS-4: counter "01 / 05"
    await expect(page.getByTestId("calibration-step-counter")).toHaveText("01 / 05");

    // Tap "Saltar este instrumento" → debe avanzar a step 2 rMEQ
    await page.getByTestId("calibration-skip-instrument").click();
    await expect(page.getByTestId("calibration-step-counter")).toHaveText("02 / 05", { timeout: 3000 });

    // Step 2 rMEQ → step 3 MAIA-2
    await page.getByTestId("calibration-skip-instrument").click();
    await expect(page.getByTestId("calibration-step-counter")).toHaveText("03 / 05", { timeout: 3000 });

    // Step 3 MAIA-2 → step 4 HRV
    await page.getByTestId("calibration-skip-instrument").click();
    await expect(page.getByTestId("calibration-step-counter")).toHaveText("04 / 05", { timeout: 3000 });

    // Step 4 HRV: skip button es distinto (data-testid="hrv-skip")
    await page.getByTestId("hrv-skip").click();
    await page.waitForTimeout(200);
    // Necesita CTA "Siguiente" para avanzar tras hrvSkipped=true
    await page.getByTestId("calibration-cta").click();
    await expect(page.getByTestId("calibration-step-counter")).toHaveText("05 / 05", { timeout: 3000 });
  });

  test("skipAllCalibration helper avanza 4 instrumentos + Empezar (post-fix)", async ({ page }) => {
    await resetAppState(page);
    await page.goto("/app", { waitUntil: "networkidle" });
    await completeWelcome(page, "calma");

    // Pre-fix: el helper buscaba [data-v2-onboarding-calibration] (no existe)
    // → no encontraba botones → no avanzaba → timeout 8s.
    // Post-fix: helper busca [data-v2-calibration] → encuentra "Saltar este
    // instrumento" → click → avanza step.
    const { skipAllCalibration } = await import("../utils/helpers");
    await skipAllCalibration(page);

    // ASSERTION: tras skipAllCalibration completo, AppV2Root está mounted
    await expect(page.locator("[data-v2-root]")).toBeVisible({ timeout: 5000 });

    // Calibration modal NO visible
    const calibVisible = await page
      .locator("[data-v2-calibration]")
      .isVisible()
      .catch(() => false);
    expect(calibVisible).toBe(false);
  });
});
