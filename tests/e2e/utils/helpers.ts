/**
 * Phase 6E SP-B — E2E test helpers.
 *
 * Compartido entre smoke (CI) y suite completa (manual). Establece
 * disciplina post-Bug-48: capturas E2E con flow real (clicks reales),
 * NO state injection en welcome/calibration. Solo simulateCompleteSession
 * usa store directo porque ProtocolPlayer real es out-of-scope (60s+
 * de breath cycles, requiere audio context).
 *
 * window.__BIO_STORE__ ya está expuesto en NODE_ENV !== "production"
 * desde src/store/useStore.js:151 (no requirió wiring nuevo).
 */
import { type Page, expect } from "@playwright/test";

declare global {
  interface Window {
    __BIO_STORE__?: {
      getState: () => Record<string, unknown> & {
        _loaded?: boolean;
        history?: unknown[];
        instruments?: unknown[];
        chronotype?: unknown;
        hrvLog?: unknown[];
        totalSessions?: number;
        completeSession?: (r: unknown) => void;
        logHRV?: (h: unknown) => void;
        logInstrument?: (i: unknown) => void;
        setChronotype?: (c: unknown) => void;
      };
      setState: (partial: Record<string, unknown>, replace?: boolean) => void;
    };
  }
}

/**
 * Reset completo de localStorage + IndexedDB.
 * Idempotente: se puede llamar al inicio de cada test sin riesgo.
 *
 * Pre-acepta el GDPR consent para que ConsentBanner (zIndex 105 desde
 * Bug-08 SP5) NO intercepte clicks durante onboarding. Sin esto, el
 * banner aparece sobre el welcome modal y bloquea el flow real.
 */
export async function resetAppState(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    // Pre-accept GDPR consent (necessary only) para evitar que el
    // ConsentBanner z=105 intercepte clicks durante onboarding.
    // Shape esperado por src/lib/consent.js readConsent.
    try {
      localStorage.setItem(
        "bio-consent-v2",
        JSON.stringify({
          v: 2,
          necessary: true,
          analytics: false,
          marketing: false,
          ts: Date.now(),
        })
      );
    } catch {}
    if (typeof indexedDB === "undefined" || !indexedDB.databases) return;
    try {
      const dbs = await indexedDB.databases();
      await Promise.all(
        dbs.map((db) =>
          new Promise<void>((resolve) => {
            if (!db.name) return resolve();
            const req = indexedDB.deleteDatabase(db.name);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
          })
        )
      );
    } catch {
      // browser sin databases() API — ignorar
    }
  });
}

/**
 * Espera a que useStore esté hidratado (init() async completed).
 * Útil después de page.goto / page.reload para evitar race conditions
 * con assertions sobre data del store.
 */
export async function waitForStoreReady(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => window.__BIO_STORE__?.getState?.()?._loaded === true,
    { timeout }
  );
}

/**
 * Snapshot serializable del store (filtra functions).
 * Útil para verificar invariantes del state real post-flow.
 */
export async function getStoreState(page: Page): Promise<Record<string, unknown> | null> {
  return await page.evaluate(() => {
    const state = window.__BIO_STORE__?.getState?.();
    if (!state) return null;
    return JSON.parse(
      JSON.stringify(state, (_key, value) =>
        typeof value === "function" ? undefined : value
      )
    );
  });
}

const INTENT_LABELS: Record<string, string> = {
  calma: "Calma",
  energia: "Energía",
  enfoque: "Enfoque",
  reset: "Reset",
};

/**
 * Setup acelerado al estado post-onboarding "fresh" sin ejecutar
 * el flow Welcome + Calibration step-by-step (que tiene ~9 clicks
 * + transiciones que añaden flakiness sin valor al test).
 *
 * El bug bajo test (Bug-48 ColdStart Stuck) vive POST-onboarding —
 * en HomeV2/ColdStartView/LearningView. Setear el state inicial via
 * store directo es honesto: equivalente a usuario que completó welcome
 * + skip-all calibration. NO afecta el test del bug.
 *
 * Para tests del onboarding flow real (no aplican aquí), usar
 * completeWelcome + completeAllCalibration / skipAllCalibration helpers.
 */
export async function setupPostOnboarding(
  page: Page,
  opts: {
    intent?: string;
    skipAllInstruments?: boolean;
  } = {}
): Promise<void> {
  const { intent = "calma", skipAllInstruments = true } = opts;
  await resetAppState(page);
  await page.goto("/app", { waitUntil: "networkidle" });
  // Defensive: wait for hydration + small delay para evitar
  // "Execution context destroyed" race entre tests serial.
  await waitForStoreReady(page, 10000);
  await page.waitForTimeout(200);
  // Retry evaluate hasta 3 veces si execution context se destroye mid-flight
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.evaluate(
        ({ intent, skipAllInstruments }) => {
          const store = window.__BIO_STORE__;
          if (!store) throw new Error("Store not exposed at window.__BIO_STORE__");
          const partial: Record<string, unknown> = {
            welcomeDone: true,
            firstIntent: intent,
            onboardingComplete: true,
          };
          if (!skipAllInstruments) {
            partial.instruments = [
              { instrumentId: "pss-4", ts: Date.now(), score: 6, level: "moderate" },
              { instrumentId: "maia-2", ts: Date.now(), score: 3, level: "average" },
            ];
            partial.chronotype = {
              type: "intermediate",
              category: "intermediate",
              label: "Intermedio",
              score: 12,
              bestTimeWindow: "midday",
              ts: Date.now(),
            };
          }
          store.setState(partial);
        },
        { intent, skipAllInstruments }
      );
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      await page.waitForTimeout(400);
    }
  }
  if (lastErr) throw lastErr;
  await page.waitForSelector("[data-v2-root]", { timeout: 8000 });
}

/**
 * Click determinístico via DOM directo (page.evaluate).
 * Workaround para CSS overlays / focus rings que interceptan
 * page.locator(...).click() de Playwright. Match por text exact
 * (case-insensitive) o substring opcional.
 */
async function clickButtonByText(
  page: Page,
  text: string | RegExp,
  opts: { exact?: boolean; within?: string } = {}
): Promise<boolean> {
  return await page.evaluate(
    ({ pattern, exact, within, isRegex }) => {
      const root = within ? document.querySelector(within) : document;
      if (!root) return false;
      const buttons = Array.from(root.querySelectorAll("button"));
      const re = isRegex ? new RegExp(pattern, "i") : null;
      const target = buttons.find((b) => {
        const t = (b.textContent || "").trim();
        if (re) return re.test(t);
        return exact ? t.toLowerCase() === pattern.toLowerCase() : t.toLowerCase().includes(pattern.toLowerCase());
      });
      if (!target) return false;
      target.click();
      return true;
    },
    {
      pattern: text instanceof RegExp ? text.source : text,
      isRegex: text instanceof RegExp,
      exact: opts.exact ?? true,
      within: opts.within ?? null,
    }
  );
}

/**
 * Completar Welcome (5 pasos total) con intent seleccionado.
 * Asume page ya en /app y BioIgnitionWelcomeV2 mounted.
 *
 * Estructura BioIgnitionWelcomeV2: 5 pasos numerados XX/05. Pasos 1-4
 * son manifesto/intro con CTA "Continuar →". Paso 5 es intent picker
 * (Calma/Enfoque/Energía/Reset) con CTA "Estoy listo →".
 *
 * Usa clickButtonByText (DOM directo) en lugar de page.click() porque
 * focus rings cyan post-click hacen que Playwright re-targetee al
 * elemento anterior con outline (auto-recovery loop sin progreso).
 */
export async function completeWelcome(
  page: Page,
  intent: keyof typeof INTENT_LABELS = "calma"
): Promise<void> {
  await page.waitForSelector("[data-v2-welcome]", { timeout: 5000 });
  // Avanza pasos 1→5 hasta llegar al intent picker. El primary CTA del
  // último manifesto-step puede ser "Continuar" O "Estoy listo" según
  // viewport (mobile más pasos manifesto). En el step 5 (intent picker)
  // el CTA "Estoy listo" inicialmente está disabled hasta seleccionar
  // intent — ahí salimos del loop.
  for (let attempt = 0; attempt < 8; attempt++) {
    // Detectar paso 5: intent picker (>= 4 buttons NO disabled de tipo card)
    const isIntentStep = await page.evaluate(() => {
      const root = document.querySelector("[data-v2-welcome]");
      if (!root) return false;
      const buttons = Array.from(root.querySelectorAll("button"));
      const intentLabels = ["Calma", "Enfoque", "Energía", "Reset"];
      return intentLabels.every((l) =>
        buttons.some((b) => (b.textContent || "").trim().startsWith(l))
      );
    });
    if (isIntentStep) break;
    // Avanzar manifesto step: click "Continuar" o "Estoy listo" (el que esté visible).
    const advanced = await page.evaluate(() => {
      const root = document.querySelector("[data-v2-welcome]");
      if (!root) return false;
      const buttons = Array.from(root.querySelectorAll("button"));
      // Skip "Saltar introducción" — solo quiere primary advance CTA
      const advance = buttons.find((b) => {
        const t = (b.textContent || "").trim();
        return /^(continuar|estoy\s+listo)/i.test(t) && !/saltar/i.test(t);
      });
      if (!advance) return false;
      (advance as HTMLButtonElement).click();
      return true;
    });
    if (!advanced) break;
    await page.waitForTimeout(400);
  }
  // Paso 5: intent picker. Buttons tienen text "CalmaBajo el ruido"
  // (label + descripción concat). Match por startsWith via DOM directo.
  const intentLabel = INTENT_LABELS[intent] || INTENT_LABELS.calma;
  const pickedIntent = await page.evaluate(({ label }) => {
    const root = document.querySelector("[data-v2-welcome]");
    if (!root) return false;
    const buttons = Array.from(root.querySelectorAll("button"));
    const target = buttons.find((b) => (b.textContent || "").trim().startsWith(label));
    if (!target) return false;
    (target as HTMLButtonElement).click();
    return true;
  }, { label: intentLabel });
  if (!pickedIntent) {
    throw new Error(`Intent picker no encontró label "${intentLabel}"`);
  }
  await page.waitForTimeout(300);
  // CTA final "Estoy listo" — ahora habilitado tras select intent
  await clickButtonByText(page, "Estoy listo", { exact: false, within: "[data-v2-welcome]" });
  // Welcome desaparece, NeuralCalibrationV2 monta
  await page.waitForSelector("[data-v2-onboarding-calibration]", { timeout: 8000 });
}

/**
 * Skip los 4 instrumentos calibration (PSS-4, rMEQ, MAIA-2, HRV).
 * Cada step tiene botón "Saltar..." (skip) o "Siguiente" si no hay skip.
 *
 * Usa clickButtonByText (DOM directo) por mismas razones que
 * completeWelcome — focus rings interfieren con Playwright .click().
 */
export async function skipAllCalibration(page: Page): Promise<void> {
  for (let i = 0; i < 5; i++) {
    // Hard-cap 5 iter: 4 instrumentos (PSS-4, rMEQ, MAIA-2, HRV) + safety
    const clickedSkip = await page.evaluate(() => {
      const root = document.querySelector("[data-v2-onboarding-calibration]");
      if (!root) return false;
      const btns = Array.from(root.querySelectorAll("button"));
      // Prefiere "Saltar este instrumento" / "Saltar (incompleto)" — NO "Saltar calibración" (terminate-all top right)
      const skipInstrument = btns.find((b) => {
        const t = (b.textContent || "").trim().toLowerCase();
        return /saltar/.test(t)
          && !t.includes("calibración")
          && !t.includes("al contenido")
          && !t.includes("introducción");
      });
      if (skipInstrument) {
        (skipInstrument as HTMLButtonElement).click();
        return true;
      }
      // Si no hay skip instrumento, intentar "Siguiente"
      const sig = btns.find((b) => /^siguiente$/i.test((b.textContent || "").trim()));
      if (sig) {
        (sig as HTMLButtonElement).click();
        return true;
      }
      return false;
    });
    if (!clickedSkip) break;
    await page.waitForTimeout(500);
    // Si llegamos al step 5 (resumen "Calibración completa"), salir
    const isFinalStep = await page.evaluate(() => {
      const root = document.querySelector("[data-v2-onboarding-calibration]");
      if (!root) return false;
      return /05\s*\/\s*05/.test(root.textContent || "");
    });
    if (isFinalStep) break;
  }
  // Step 5: resumen "Calibración completa" → "Empezar"
  await clickButtonByText(page, "Empezar", { exact: true });
  await page.waitForSelector("[data-v2-root]", { timeout: 8000 });
}

/**
 * Flush síncrono del store a IDB (saveNow). Necesario antes de
 * page.reload() porque scheduleSave es debounced 300ms — sin esto,
 * reload puede ocurrir antes de que el state se persista, e init()
 * cargará state viejo (e.g. welcomeDone=false → Welcome modal vuelve).
 *
 * useStore.js:103 expone saveNow como action que flushea el debounce
 * y await la persist a IDB.
 */
export async function flushStoreToIDB(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const store = window.__BIO_STORE__;
    if (!store) return;
    const state = store.getState();
    const saveNow = (state as { saveNow?: () => Promise<unknown> }).saveNow;
    if (typeof saveNow === "function") {
      await saveNow();
    }
  });
}

/**
 * Simular completar 1 sesión vía store directo. NO usa ProtocolPlayer
 * real (que requiere 120s de breath cycle + audio context). Refleja
 * el payload exacto que closeSession dispara al final del player.
 */
export async function simulateCompleteSession(
  page: Page,
  opts: {
    protocol?: string;
    intent?: string;
    duration?: number;
    coherence?: number;
  } = {}
): Promise<void> {
  const {
    protocol = "Reinicio Parasimpático",
    intent = "calma",
    duration = 120,
    coherence = 60,
  } = opts;

  await page.evaluate(
    ({ protocol, intent, duration, coherence }) => {
      const store = window.__BIO_STORE__;
      if (!store) throw new Error("Store not exposed at window.__BIO_STORE__");
      const state = store.getState();
      const now = Date.now();
      const histPrev = (state.history as unknown[]) || [];
      const newHist = [
        ...histPrev,
        { ts: now, p: protocol, int: intent, d: duration, c: coherence, bioQ: 50, deltaC: 5 },
      ];
      const ns = newHist.length;
      const dow = new Date().getDay();
      const idx = (dow + 6) % 7;
      const wd = [0, 0, 0, 0, 0, 0, 0];
      wd[idx] = ns;
      if (typeof state.completeSession === "function") {
        state.completeSession({
          eVC: 5,
          nC: coherence,
          nR: 50,
          nE: 50,
          ns,
          nsk: ns,
          nw: wd,
          newHist,
          ach: [],
          totalT: duration,
        });
      } else {
        store.setState({ history: newHist, totalSessions: ns });
      }
    },
    { protocol, intent, duration, coherence }
  );
  // Pequeño wait para que setState propague + scheduleSave debounce
  await page.waitForTimeout(150);
}

/**
 * Simular completion de los gates restantes post-onboarding (HRV +
 * PSS-4 standalone + chronotype). Útil para reproducir Bug-48
 * (todas las gates true → actions=[]).
 */
export async function simulateAllGatesCompleted(page: Page): Promise<void> {
  await page.evaluate(() => {
    const store = window.__BIO_STORE__;
    if (!store) return;
    const state = store.getState();
    const now = Date.now();
    state.logHRV?.({ ts: now, rmssd: 45, sdnn: 50, source: "ble" });
    state.logInstrument?.({
      instrumentId: "pss-4",
      ts: now,
      score: 6,
      level: "moderate",
    });
    state.setChronotype?.({
      type: "intermediate",
      category: "intermediate",
      label: "Intermedio",
      score: 12,
      bestTimeWindow: "midday",
      ts: now,
    });
  });
  await page.waitForTimeout(150);
}

/**
 * ASSERTION CRÍTICA Bug-48 anti-regression.
 * Verifica que Tab Hoy NUNCA renderea solo header + viewport vacío.
 * Al menos UNO de los selectores accionables debe estar presente.
 */
export async function assertHomeViewportNotEmpty(page: Page): Promise<void> {
  // Greeting siempre visible
  await expect(page.locator("[data-v2-greeting], [data-v2-hero]").first()).toBeVisible();

  const actionableSelectors = [
    "[data-v2-onboarding-row]",
    "[data-v2-coldstart-empty]",
    "[data-v2-learning-progress]",
    "[data-v2-recommendation]",
    "[data-v2-hero]",
  ];
  const hasContent = await page.evaluate((selectors) => {
    return selectors.some((sel) => document.querySelector(sel) !== null);
  }, actionableSelectors);
  expect(hasContent).toBe(true);
}
