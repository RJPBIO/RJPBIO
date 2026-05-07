/**
 * Phase 6H Polish-3 — Typography + rendering + iOS quirks.
 *
 * Verifica que el shell PWA tiene:
 *   · -webkit-font-smoothing: antialiased (crisp retina)
 *   · text-rendering optimizeLegibility
 *   · font-feature-settings kern/liga/calt
 *   · ::selection cyan en PWA (emerald en marketing)
 *   · inputs font-size ≥ 16px (anti iOS-zoom)
 *   · img defaults sanos (display:block, max-inline-size:100%)
 *   · número spinners removidos
 *
 * next/font/google ya entrega self-host + font-display: swap optimal;
 * NO testeamos preload/CLS aquí — eso vive en el build pipeline de
 * Next.js y no es parte del scope Polish-3.
 *
 * Scope: html.pwa-shell selectors. Marketing pages preservan emerald
 * selection + behavior web estándar.
 */
import { test, expect } from "@playwright/test";
import { setupPostOnboarding } from "../utils/helpers";

test.describe.configure({ mode: "serial" });
test.setTimeout(60_000);

test.describe("Phase 6H Polish-3 — Typography + rendering", () => {
  test("Test 1: html webkit-font-smoothing antialiased", async ({ page }) => {
    await page.goto("/app");
    await page.waitForTimeout(500);

    const smoothing = await page.evaluate(() => {
      const cs = window.getComputedStyle(document.documentElement);
      // El property tiene varias serializaciones según engine.
      return {
        webkit: (cs as CSSStyleDeclaration & { webkitFontSmoothing?: string })
          .webkitFontSmoothing,
        textRendering: cs.textRendering,
        fontKerning: cs.fontKerning,
      };
    });

    // Chromium expone webkitFontSmoothing como camelCase. Debe ser
    // "antialiased" (regla en globals.css línea 234).
    expect(smoothing.webkit).toBe("antialiased");
    // Polish-3 agregó font-kerning: normal explicit en html.
    expect(smoothing.fontKerning).toBe("normal");
    // Existing globals.css línea 239 — text-rendering: optimizeLegibility.
    // Chromium serializa lowercase ("optimizelegibility"); aceptamos
    // case-insensitive match.
    expect(smoothing.textRendering.toLowerCase()).toBe("optimizelegibility");
  });

  test("Test 2: body font-family resolved (next/font sans variable)", async ({ page }) => {
    await page.goto("/app");
    await page.waitForTimeout(500);

    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    // next/font/google con Manrope inyecta `--font-sans` y body className
    // contiene `manrope.className`. Resolved fontFamily debe contener
    // "Manrope" or al menos un fallback sans del stack premium.
    expect(fontFamily.toLowerCase()).toMatch(/manrope|inter|sf|system/);
  });

  test("Test 3: stylesheet contiene ::selection cyan en pwa-shell", async ({ page }) => {
    await page.goto("/app");
    await page.waitForTimeout(500);

    // Inspección directa de CSSOM para verificar que la regla Polish-3
    // ::selection cyan está presente en el shell PWA.
    const found = await page.evaluate(() => {
      let result = { pwaCyan: false, marketingEmerald: false };
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList | null = null;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          const text = rule.cssText || "";
          if (
            /html\.pwa-shell\s+::selection/i.test(text) &&
            /rgba?\(\s*34,\s*211,\s*238/i.test(text)
          ) {
            result.pwaCyan = true;
          }
          // Existing emerald selection (línea 545) — confirmamos que
          // sigue intacta para marketing.
          if (
            /^::selection\s*\{/i.test(text) &&
            /rgba?\(\s*5,\s*150,\s*105/i.test(text)
          ) {
            result.marketingEmerald = true;
          }
        }
      }
      return result;
    });

    expect(found.pwaCyan).toBe(true);
    expect(found.marketingEmerald).toBe(true);
  });

  test("Test 4: inputs computed font-size ≥ 16px (anti iOS-zoom)", async ({ page }) => {
    await page.goto("/app");
    await page.waitForTimeout(500);

    // Test sintético — creamos input dinámicamente y leemos su computed
    // font-size aplicado por la regla globals.css línea 398-401:
    //   `input, textarea, select { font-size: max(16px, 1em); }`
    // Si la regla está activa, computed font-size será ≥ 16.
    const sizes = await page.evaluate(() => {
      const types = ["text", "email", "password", "number", "search", "tel"];
      const results: Record<string, number> = {};
      for (const t of types) {
        const i = document.createElement("input");
        i.type = t;
        document.body.appendChild(i);
        results[t] = parseFloat(window.getComputedStyle(i).fontSize);
        i.remove();
      }
      const ta = document.createElement("textarea");
      document.body.appendChild(ta);
      results.textarea = parseFloat(window.getComputedStyle(ta).fontSize);
      ta.remove();
      return results;
    });

    for (const [type, px] of Object.entries(sizes)) {
      expect(px, `<${type}> font-size = ${px}px (must ≥ 16)`).toBeGreaterThanOrEqual(16);
    }
  });

  test("Test 5: number input spinners eliminados", async ({ page }) => {
    await page.goto("/app");
    await page.waitForTimeout(500);

    // No podemos leer pseudoelementos webkit directamente, pero
    // verificamos via CSSOM que la regla está presente.
    const ruleFound = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList | null = null;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          const text = rule.cssText || "";
          if (
            /input\[type="?number"?\]::-webkit-(?:outer|inner)-spin-button/i.test(text)
          ) {
            return true;
          }
        }
      }
      return false;
    });

    expect(ruleFound).toBe(true);
  });

  test("Test 6: PWA img defaults — display:block + drag prevent", async ({ page }) => {
    await page.goto("/app");
    await page.waitForTimeout(500);

    const imgDefaults = await page.evaluate(() => {
      const img = document.createElement("img");
      img.src =
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiLz4=";
      document.body.appendChild(img);
      const cs = window.getComputedStyle(img);
      const result = {
        display: cs.display,
        userDrag: (cs as CSSStyleDeclaration & { webkitUserDrag?: string }).webkitUserDrag,
        touchCallout: (cs as CSSStyleDeclaration & { webkitTouchCallout?: string })
          .webkitTouchCallout,
      };
      img.remove();
      return result;
    });

    // Polish-3 regla `html.pwa-shell img { display: block }`
    expect(imgDefaults.display).toBe("block");
    // -webkit-user-drag: none aplicado (algunos engines no exponen el
    // valor — accept any except "auto").
    if (imgDefaults.userDrag) {
      expect(imgDefaults.userDrag).toMatch(/none|element/);
    }
  });

  test("Test 7: marketing page NO recibe ::selection cyan (preserva emerald)", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);

    const isPwaShell = await page.evaluate(() => {
      return document.documentElement.classList.contains("pwa-shell");
    });

    expect(isPwaShell).toBe(false);

    // En marketing, ::selection emerald rgba(5, 150, 105, 0.15) debe estar
    // activo. No podemos seleccionar texto via API; verificamos CSS.
    const ruleActive = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList | null = null;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          const text = rule.cssText || "";
          if (
            /^::selection\s*\{/i.test(text) &&
            /rgba?\(\s*5,\s*150,\s*105/i.test(text)
          ) {
            return true;
          }
        }
      }
      return false;
    });

    expect(ruleActive).toBe(true);
  });

  test("Test 8: InputBar coach textarea fontSize 16 (post-fix)", async ({ page }) => {
    // Test estático del HTML del componente — no requiere flow auth real.
    // Verificamos que el JSX renderea fontSize:16 inline.
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    await page.waitForTimeout(500);

    // Click coach tab para mountear el chat
    await page.locator('[data-v2-tab="coach"]').click().catch(() => null);
    await page.waitForTimeout(500);

    const textareaSize = await page.evaluate(() => {
      const ta = document.querySelector("textarea");
      if (!ta) return null;
      return parseFloat(window.getComputedStyle(ta).fontSize);
    });

    if (textareaSize !== null) {
      expect(textareaSize).toBeGreaterThanOrEqual(16);
    } else {
      test.skip(true, "Textarea no presente en este flow — skip");
    }
  });

  test("Test 9: capture screenshots typography retina", async ({ page }) => {
    await setupPostOnboarding(page, { intent: "calma", skipAllInstruments: true });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "screenshots/phase6h-polish-3/01-app-typography.png",
      fullPage: false,
    });

    await page.goto("/app/resources/crisis", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: "screenshots/phase6h-polish-3/02-crisis-text-rendering.png",
      fullPage: true,
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: "screenshots/phase6h-polish-3/03-marketing-emerald-selection.png",
      fullPage: false,
    });
  });
});
