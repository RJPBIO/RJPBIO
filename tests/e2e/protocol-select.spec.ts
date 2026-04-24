import { test, expect } from "@playwright/test";

test.describe("Protocol selection — PWA /app", () => {
  test.setTimeout(120_000);
  test.beforeEach(async ({ context }) => {
    // Seed onboarded state so /app skips Welcome + Calibration overlays.
    await context.addInitScript(() => {
      const state = {
        totalSessions: 5,
        streak: 0,
        todaySessions: 0,
        lastDate: null,
        weeklyData: [0, 0, 0, 0, 0, 0, 0],
        achievements: [],
        vCores: 0,
        history: [],
        totalTime: 0,
        favs: [],
        onboardingComplete: true,
        soundOn: false,
        hapticOn: false,
      };
      localStorage.setItem("bio-g2", JSON.stringify(state));
    });
  });
  test("sheet opens and selecting a protocol updates main button", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
    page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

    await page.goto("/app", { waitUntil: "domcontentloaded" });

    // Bottom nav appears after mount.
    await expect(page.getByRole("tab", { name: /Ignición/i })).toBeVisible({ timeout: 15_000 });

    // Dismiss Return Card overlay if present — it takes focus on entry.
    const abrir = page.getByRole("button", { name: /abrir la app/i });
    if (await abrir.count()) await abrir.first().click().catch(() => {});

    // The "change protocol" button has an accessible name containing the
    // current protocol and a chevron-down icon. Match by visible label pattern.
    const trigger = page.locator('button').filter({ hasText: /fases|pick/i }).first();
    await expect(trigger).toBeVisible({ timeout: 10_000 });
    await trigger.click();

    // Sheet opens — dialog role visible.
    const dialog = page.getByRole("dialog", { name: /protocolos/i });
    await expect(dialog).toBeVisible();

    // Click the first listitem button inside the list.
    const items = page.locator("[data-proto-item]");
    const n = await items.count();
    expect(n).toBeGreaterThan(0);

    const firstItem = items.first();
    const firstItemAria = await firstItem.getAttribute("aria-label");
    const firstItemName = (firstItemAria || "").split(".")[0].trim();

    await firstItem.click();

    // Sheet should close.
    await expect(dialog).toBeHidden({ timeout: 3_000 });

    // Main button should now reflect the selected protocol name.
    await expect(page.getByText(firstItemName, { exact: false })).toBeVisible();

    if (logs.some((l) => l.includes("[pageerror]"))) {
      console.log("CAPTURED LOGS:\n" + logs.join("\n"));
    }
  });
});
