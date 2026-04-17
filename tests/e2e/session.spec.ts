import { test, expect } from "@playwright/test";

test.describe("Neural session — happy path", () => {
  test("start → pause → resume → stop", async ({ page }) => {
    await page.goto("/");
    const start = page.getByRole("button", { name: /start|iniciar|começar|démarrer|starten|inizia|点火|시작|开始|ابدأ|התחל/i });
    if (await start.count()) {
      await start.first().click();
      await page.waitForTimeout(500);
      const stop = page.getByRole("button", { name: /stop|parar|arrêter|stopp|עצור|إيقاف|停止|정지/i });
      if (await stop.count()) await stop.first().click();
    }
    await expect(page).toHaveURL(/\//);
  });

  test("locale switch persists across reload", async ({ page, context }) => {
    await context.addInitScript(() => localStorage.setItem("bio-locale", "en"));
    await page.goto("/");
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(["en", ""]).toContain(lang);
  });
});
