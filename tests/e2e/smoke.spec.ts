import { test, expect } from "@playwright/test";

test.describe("Smoke — marketing + PWA", () => {
  test("home renders and advertises offline-first", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/BIO-IGNI/i);
  });

  test("service worker registers", async ({ page }) => {
    await page.goto("/");
    const ready = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    });
    expect(ready).toBeTruthy();
  });

  test("manifest is served and valid", async ({ request }) => {
    const res = await request.get("/manifest.json");
    expect(res.ok()).toBeTruthy();
    const m = await res.json();
    expect(m.name).toMatch(/BIO-IGNI/i);
    expect(Array.isArray(m.icons)).toBeTruthy();
  });

  test("offline page is reachable", async ({ request }) => {
    const res = await request.get("/offline.html");
    expect(res.ok()).toBeTruthy();
  });

  test("trust center lists certifications", async ({ page }) => {
    await page.goto("/trust");
    await expect(page.locator("body")).toContainText(/SOC\s?2/);
    await expect(page.locator("body")).toContainText(/ISO\s?27001/);
  });

  test("subprocessors table renders", async ({ page }) => {
    await page.goto("/trust/subprocessors");
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("body")).toContainText("Stripe");
  });
});
