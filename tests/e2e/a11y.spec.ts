import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/privacy", "/trust", "/trust/subprocessors", "/vs", "/vs/headspace", "/vs/calm"];

test.describe("Accessibility — WCAG 2.2 AA", () => {
  for (const path of PAGES) {
    test(`no axe violations on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Next hydrates + the home page can self-navigate (scroll anchors,
      // smooth-scroll init) after DOMContentLoaded, racing axe's
      // page.evaluate. Let the load event + a short settle time pass.
      await page.waitForLoadState("load").catch(() => {});
      await page.waitForTimeout(400);
      // Scan with limited retries for "Execution context was destroyed"
      // which axe-core-playwright documents as inherent to HMR/hydration.
      let results: Awaited<ReturnType<InstanceType<typeof AxeBuilder>["analyze"]>> | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
          break;
        } catch (err) {
          if (attempt === 2) throw err;
          await page.waitForTimeout(500);
        }
      }
      expect(results!.violations, JSON.stringify(results!.violations, null, 2)).toEqual([]);
    });
  }
});
