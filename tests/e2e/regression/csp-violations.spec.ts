/**
 * Phase 6G Fix2 P1-3 — CSP violations reduction.
 *
 * Pre-Fix2: 337 console errors mayoría CSP style-src violations
 * (Next.js Turbopack HMR inyecta <style> sin nonce). Post-Fix2:
 * middleware aplica style-src 'unsafe-inline' SOLO en dev (NODE_ENV
 * !== 'production'). Production mantiene strict 'self' + nonce.
 *
 * Goal: < 50 CSP-related console errors en navegación 4-5 pages.
 */
import { test, expect } from "@playwright/test";
import { resetAppState, setupPostOnboarding } from "../utils/helpers";

test.describe.configure({ mode: "serial" });
test.setTimeout(90_000);

test("Phase 6G Fix2 P1-3 — CSP style-src violations < 50 en dev", async ({ page }) => {
  const cspViolations: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      // Filtrar específicamente violations de style-src (no script-src ni
      // otras CSP categorías que deben seguir strict).
      if (/Content Security Policy.*style-src/i.test(t)) {
        cspViolations.push(t);
      }
    }
  });

  await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });

  // Navegar varias pages para trigger styling
  await page.goto("/app/programs", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.goto("/app/wellbeing", { waitUntil: "networkidle" }).catch(() => null);
  await page.waitForTimeout(800);
  await page.goto("/app", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  console.log(`[CSP audit] style-src violations totales: ${cspViolations.length}`);

  // Pre-Fix2 baseline: ~89 unique × 5 nav = ~300+ instances.
  // Post-Fix2 dev fix: 'unsafe-inline' en style-src dev → 0 violations.
  // Threshold defensivo en 50 por si Next.js cambia HMR mechanism.
  expect(cspViolations.length).toBeLessThan(50);
});
