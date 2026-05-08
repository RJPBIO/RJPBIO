/**
 * Phase 6I-1 — E2E anti-regression program completion celebration (H-1).
 *
 * Cierra HIGH finding del repo audit: cuando user completa programa
 * adaptativo (Day 28 Burnout Recovery, Day 5 Focus Sprint, etc), antes NO
 * había UI feedback. Ahora <ProgramCompletionSheet/> bottom-up con choreography
 * análogo a Fix3 + dedup persistente per programId.
 *
 * Detection: store action `finalizeProgram({totalRequired})` retorna true →
 * setea pendingProgramCompletionCelebration → HomeV2 mounta sheet.
 */
import { test, expect } from "@playwright/test";
import {
  resetAppState,
  waitForStoreReady,
  setupPostOnboarding,
  flushStoreToIDB,
  getStoreState,
} from "../utils/helpers";

test.describe.configure({ mode: "serial" });

const SHOTS = "screenshots/phase6i-1-program-completion";

test.describe("Phase 6I-1 — Program completion celebration (H-1)", () => {
  test.setTimeout(120_000);

  test("Burnout Recovery 28d: finalizeProgram dispara sheet con copy específico", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    // Setear activeProgram con 28 días completados (preparado para finalize)
    await page.evaluate(() => {
      const s = window.__BIO_STORE__.getState();
      s.startProgram("burnout-recovery");
      // Marcar 28 días directamente via setState para acelerar test
      window.__BIO_STORE__.setState({
        activeProgram: {
          id: "burnout-recovery",
          startedAt: Date.now() - 28 * 86400000,
          completedSessionDays: Array.from({ length: 28 }, (_, i) => i + 1),
        },
      });
    });
    await page.waitForTimeout(300);

    // Trigger finalizeProgram
    await page.evaluate(() => {
      const result = window.__BIO_STORE__.getState().finalizeProgram({ totalRequired: 28 });
      console.log("[test] finalizeProgram result:", result);
    });
    await page.waitForTimeout(800);

    // Sheet visible con copy específico de burnout-recovery
    const sheet = page.locator('[data-testid="program-completion-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet).toHaveAttribute("data-program-id", "burnout-recovery");
    // Strict-mode safe: "BURNOUT RECOVERY" matchea eyebrow + statLabel — uso first()
    await expect(sheet.locator("text=BURNOUT RECOVERY").first()).toBeVisible();
    await expect(sheet.locator("text=/Has completado tu programa de recuperación/i")).toBeVisible();
    await expect(page.locator('[data-testid="program-completion-primary"]')).toBeVisible();
    await expect(page.locator('[data-testid="program-completion-dismiss"]')).toBeVisible();

    // Count-up llega a 28 tras animation (650ms + 200ms delay)
    await page.waitForTimeout(900);
    await expect(page.locator('[data-testid="program-completion-count"]')).toHaveText("28");

    await page.screenshot({
      path: `${SHOTS}/01-burnout-recovery-completion.png`,
      fullPage: true,
    });
  });

  test("Focus Sprint 5d: completion celebra con totalDays=5", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "enfoque" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        activeProgram: {
          id: "focus-sprint",
          startedAt: Date.now() - 5 * 86400000,
          completedSessionDays: [1, 2, 3, 4, 5],
        },
      });
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      window.__BIO_STORE__.getState().finalizeProgram({ totalRequired: 5 });
    });
    await page.waitForTimeout(800);

    const sheet = page.locator('[data-testid="program-completion-sheet"]');
    await expect(sheet).toBeVisible({ timeout: 5000 });
    await expect(sheet).toHaveAttribute("data-program-id", "focus-sprint");
    await expect(sheet.locator("text=FOCUS SPRINT").first()).toBeVisible();
    await page.waitForTimeout(900);
    await expect(page.locator('[data-testid="program-completion-count"]')).toHaveText("5");

    await page.screenshot({
      path: `${SHOTS}/02-focus-sprint-completion.png`,
      fullPage: true,
    });
  });

  test("dismiss CTA limpia pendingCelebration + persiste doneAt[programId]", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        activeProgram: {
          id: "neural-baseline",
          startedAt: Date.now() - 14 * 86400000,
          completedSessionDays: Array.from({ length: 14 }, (_, i) => i + 1),
        },
      });
    });
    await page.evaluate(() => {
      window.__BIO_STORE__.getState().finalizeProgram({ totalRequired: 14 });
    });
    await page.waitForTimeout(800);

    await expect(page.locator('[data-testid="program-completion-sheet"]')).toBeVisible();

    // Dismiss tras CTAs visibles (stagger ~350ms)
    await page.waitForTimeout(500);
    await page.locator('[data-testid="program-completion-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="program-completion-sheet"]')).toBeHidden();

    // State limpio + doneAt timestamp set per-programId
    const state = await getStoreState(page);
    expect(state.pendingProgramCompletionCelebration).toBeNull();
    expect(state.programCompletionCelebrationDoneAt?.["neural-baseline"]).toBeTruthy();
    expect(typeof state.programCompletionCelebrationDoneAt["neural-baseline"]).toBe("number");
  });

  test("reload tras dismiss → NO re-mount sheet (dedup persistido per programId)", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        activeProgram: {
          id: "recovery-week",
          startedAt: Date.now() - 7 * 86400000,
          completedSessionDays: [1, 2, 3, 4, 5, 6, 7],
        },
      });
    });
    await page.evaluate(() => {
      window.__BIO_STORE__.getState().finalizeProgram({ totalRequired: 7 });
    });
    await page.waitForTimeout(800);
    await page.locator('[data-testid="program-completion-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(300);

    await flushStoreToIDB(page);
    await page.reload();
    await waitForStoreReady(page, 10000);
    await page.waitForTimeout(1000);

    // Sheet NO debería aparecer (doneAt[recovery-week] persistido en IDB cifrado)
    await expect(page.locator('[data-testid="program-completion-sheet"]')).toBeHidden({ timeout: 2000 });
  });

  test("Multiple programas separados: cada uno celebrado UNA vez", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    // Programa 1: focus-sprint
    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        activeProgram: {
          id: "focus-sprint",
          startedAt: Date.now() - 5 * 86400000,
          completedSessionDays: [1, 2, 3, 4, 5],
        },
      });
    });
    await page.evaluate(() => window.__BIO_STORE__.getState().finalizeProgram({ totalRequired: 5 }));
    await page.waitForTimeout(800);
    await expect(page.locator('[data-testid="program-completion-sheet"]')).toBeVisible();
    await expect(page.locator('[data-program-id="focus-sprint"]')).toBeVisible();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="program-completion-dismiss"]').click();
    await page.waitForTimeout(300);

    // Programa 2: neural-baseline (diferente programId — debería celebrarse independiente)
    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        activeProgram: {
          id: "neural-baseline",
          startedAt: Date.now() - 14 * 86400000,
          completedSessionDays: Array.from({ length: 14 }, (_, i) => i + 1),
        },
      });
    });
    await page.evaluate(() => window.__BIO_STORE__.getState().finalizeProgram({ totalRequired: 14 }));
    await page.waitForTimeout(800);

    await expect(page.locator('[data-testid="program-completion-sheet"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-program-id="neural-baseline"]')).toBeVisible();
    // Crítico: el SEGUNDO sheet aparece pese a que primer programa ya en doneAt
    // — prueba independencia per-programId. Dismiss segundo + verify ambos en doneAt.
    await page.waitForTimeout(500);
    await page.locator('[data-testid="program-completion-dismiss"]').click({ timeout: 5000 });
    await page.waitForTimeout(500);

    const finalState = await getStoreState(page);
    expect(finalState.programCompletionCelebrationDoneAt?.["focus-sprint"]).toBeTruthy();
    expect(finalState.programCompletionCelebrationDoneAt?.["neural-baseline"]).toBeTruthy();
  });

  test("backdrop click dismiss", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        pendingProgramCompletionCelebration: {
          programId: "executive-presence",
          programName: "Executive Presence",
          totalDays: 10,
          completedAt: Date.now(),
          timestamp: Date.now(),
        },
      });
    });
    await page.waitForTimeout(800);

    await expect(page.locator('[data-testid="program-completion-sheet"]')).toBeVisible();

    const backdrop = page.locator('[data-testid="program-completion-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 }, timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="program-completion-sheet"]')).toBeHidden();
  });

  test("prefers-reduced-motion → sheet mount instant + count-up al target sin animar", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await setupPostOnboarding(page, { intent: "calma" });

    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        pendingProgramCompletionCelebration: {
          programId: "executive-presence",
          programName: "Executive Presence",
          totalDays: 10,
          completedAt: Date.now(),
          timestamp: Date.now(),
        },
      });
    });

    // Sheet aparece sin esperar animation; count-up directo al target
    await expect(page.locator('[data-testid="program-completion-sheet"]')).toBeVisible({ timeout: 1500 });
    await expect(page.locator('[data-testid="program-completion-count"]')).toHaveText("10", { timeout: 1000 });
  });

  test("Capture comparativa: pre-completion vs post-completion mounted", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma" });

    // Pre: programa NO completado (27 días de 28)
    await page.evaluate(() => {
      window.__BIO_STORE__.setState({
        activeProgram: {
          id: "burnout-recovery",
          startedAt: Date.now() - 27 * 86400000,
          completedSessionDays: Array.from({ length: 27 }, (_, i) => i + 1),
        },
      });
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SHOTS}/03-pre-completion-day-27.png`,
      fullPage: true,
    });

    // Trigger finalizeProgram con totalRequired=28 (tira false porque solo 27 hechas)
    const finalizeResult = await page.evaluate(() => {
      return window.__BIO_STORE__.getState().finalizeProgram({ totalRequired: 28 });
    });
    expect(finalizeResult).toBe(false); // 27 < 28

    // Post: agregar día 28 + retry finalize
    await page.evaluate(() => {
      const s = window.__BIO_STORE__.getState();
      window.__BIO_STORE__.setState({
        activeProgram: {
          ...s.activeProgram,
          completedSessionDays: Array.from({ length: 28 }, (_, i) => i + 1),
        },
      });
    });
    await page.evaluate(() => window.__BIO_STORE__.getState().finalizeProgram({ totalRequired: 28 }));
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SHOTS}/04-post-completion-fired.png`,
      fullPage: true,
    });
  });
});
