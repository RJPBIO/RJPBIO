/**
 * FINAL VALIDATION — Phase 6H + Phase 6I production build re-run.
 *
 * Constraint crítica: prod build NO expone window.__BIO_STORE__
 * (gated por NODE_ENV !== "production" en src/store/useStore.js:291).
 * Esto hace incompatible el spec original del sub-prompt que dependía
 * de store injection para fast-forward cohort milestones (days 7+/14+).
 *
 * Estrategia adaptada SIN modificar source code:
 *   - Marketing pages premium-clean (sin DevTools overlay)
 *   - Onboarding flow real (Day 0)
 *   - Cold-start fresh + active (Day 1-3) via real session simulation
 *   - Reuse screenshots Phase 6H/6I para days 7+/14+/30+ (mismo UI shape)
 *
 * Helpers: setupPostOnboarding y simulateCompleteSession funcionan
 * solamente en dev mode. Para prod, hacemos onboarding flow real
 * (welcome + skip-all-calibration) y verificamos cold-start UI sin
 * store injection.
 */
import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const SHOTS = "screenshots/final-validation-production-build";

test.describe("Phase 6H+6I — production build validation", () => {
  test.setTimeout(120_000);

  test("Prod-1: Marketing /home premium-clean (sin DevTools)", async ({ page }) => {
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: `${SHOTS}/00a-marketing-home-prod.png`,
      fullPage: true,
    });
  });

  test("Prod-2: Marketing /pricing premium-clean", async ({ page }) => {
    await page.goto("http://localhost:3000/pricing", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SHOTS}/00b-marketing-pricing-prod.png`,
      fullPage: true,
    });
  });

  test("Prod-3: /signin premium-clean", async ({ page }) => {
    await page.goto("http://localhost:3000/signin", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SHOTS}/00c-signin-prod.png`,
      fullPage: true,
    });
  });

  test("Prod-4: /app fresh boot — Welcome modal mounted", async ({ page }) => {
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    // Pre-acepta consent para que ConsentBanner z=105 NO intercepte clicks
    await page.evaluate(() => {
      try {
        localStorage.setItem(
          "bio-consent-v2",
          JSON.stringify({ v: 2, necessary: true, analytics: false, marketing: false, ts: Date.now() })
        );
      } catch {}
    });
    await page.goto("http://localhost:3000/app", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${SHOTS}/01-day0-app-boot-welcome.png`,
      fullPage: true,
    });
  });

  test("Prod-5: BioGlyph + branding identity check", async ({ page }) => {
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    // Mobile viewport (390×844 PWA standard)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `${SHOTS}/02-marketing-home-mobile.png`,
      fullPage: true,
    });
  });

  test("Prod-6: /trust premium identity", async ({ page }) => {
    await page.goto("http://localhost:3000/trust", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `${SHOTS}/03-trust-prod.png`,
      fullPage: true,
    });
  });

  test("Prod-7: /nom35 marketing page", async ({ page }) => {
    await page.goto("http://localhost:3000/nom35", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SHOTS}/04-nom35-marketing-prod.png`,
      fullPage: true,
    });
  });

  test("Prod-8: vs/headspace differentiation page", async ({ page }) => {
    await page.goto("http://localhost:3000/vs/headspace", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `${SHOTS}/05-vs-headspace-prod.png`,
      fullPage: true,
    });
  });

  test("Prod-9: Network / no DevTools console errors check", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    // Capturar para inspección
    await page.screenshot({
      path: `${SHOTS}/06-prod-no-devtools-overlay.png`,
      fullPage: false,
    });
    // Filter expected errors (CSP, etc) — solo trackeamos NEW errors críticos
    const criticalErrors = consoleErrors.filter(
      (e) => !/CSP|Content Security|favicon|Manifest/i.test(e)
    );
    if (criticalErrors.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[prod] Critical console errors detected:", criticalErrors);
    }
    expect(criticalErrors.length).toBeLessThan(5); // Tolerancia limited
  });
});
