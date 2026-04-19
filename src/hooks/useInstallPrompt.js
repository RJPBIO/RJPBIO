"use client";
/* ═══════════════════════════════════════════════════════════════
   useInstallPrompt — captura `beforeinstallprompt` y expone un API
   accionable para mostrar un banner propio de instalación.

   Política de aparición:
     - El evento llegó (navegador elegible: Chrome/Edge/Samsung, etc.)
     - El usuario no está ya en modo standalone (PWA instalada)
     - No fue descartado hace menos de `dismissCooldownMs`
     - El usuario demostró engagement mínimo (prop `engaged`)

   Persistimos el dismissal en localStorage para que sobreviva al
   recargar pero caduque pasado el cooldown. Evitamos spamear.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useRef } from "react";

const DISMISS_KEY = "bio-install-dismissed-at";
const DEFAULT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function readDismissedAt() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeDismissedAt(ts) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, String(ts));
  } catch {
    /* storage bloqueado: no es crítico */
  }
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
    // iOS Safari
    if (window.navigator?.standalone === true) return true;
  } catch { /* noop */ }
  return false;
}

/**
 * @param {object}  [options]
 * @param {boolean} [options.engaged=true] Gate de engagement (ej. totalSessions>=1).
 * @param {number}  [options.dismissCooldownMs]
 */
export function useInstallPrompt({ engaged = true, dismissCooldownMs = DEFAULT_COOLDOWN_MS } = {}) {
  const [promptable, setPromptable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const deferredRef = useRef(null);

  const cooldownActive = useCallback(() => {
    const ts = readDismissedAt();
    if (!ts) return false;
    return Date.now() - ts < dismissCooldownMs;
  }, [dismissCooldownMs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    function onBip(e) {
      e.preventDefault();
      deferredRef.current = e;
      if (!cooldownActive()) setPromptable(true);
    }
    function onInstalled() {
      setInstalled(true);
      setPromptable(false);
      deferredRef.current = null;
    }
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [cooldownActive]);

  // Si cambia `engaged` a true y ya hay deferred event sin cooldown, mostrar.
  useEffect(() => {
    if (engaged && deferredRef.current && !cooldownActive()) {
      setPromptable(true);
    } else if (!engaged) {
      setPromptable(false);
    }
  }, [engaged, cooldownActive]);

  const install = useCallback(async () => {
    const ev = deferredRef.current;
    if (!ev) return { outcome: "unavailable" };
    try {
      await ev.prompt();
      const choice = await ev.userChoice;
      deferredRef.current = null;
      setPromptable(false);
      if (choice?.outcome === "dismissed") writeDismissedAt(Date.now());
      return choice || { outcome: "unknown" };
    } catch {
      setPromptable(false);
      return { outcome: "error" };
    }
  }, []);

  const dismiss = useCallback(() => {
    writeDismissedAt(Date.now());
    setPromptable(false);
  }, []);

  const visible = promptable && engaged && !installed;
  return { visible, installed, install, dismiss };
}
