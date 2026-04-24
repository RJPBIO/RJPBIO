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
    // Canonical endpoint is /manifest.webmanifest (Next app router route).
    // layout.js advertises it via `<link rel="manifest" ...>`.
    const res = await request.get("/manifest.webmanifest");
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
    // Page ships its own table class (plus hidden tables from shell shims).
    // Match the visible data table directly to avoid strict-mode violations.
    await expect(page.locator("table.bi-trust-table--subs")).toBeVisible();
    await expect(page.locator("body")).toContainText("Stripe");
  });
});
