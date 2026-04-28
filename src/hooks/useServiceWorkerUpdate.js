"use client";
/* ═══════════════════════════════════════════════════════════════
   useServiceWorkerUpdate — detecta que el SW tiene una versión
   nueva en estado `waiting` y expone `accept()` para activarla.

   Flujo:
     1. `navigator.serviceWorker.register('/sw.js')` — idempotente.
     2. Si al registrar ya hay `registration.waiting`, levantamos
        `updateAvailable=true`.
     3. Escuchamos `updatefound`; al cambiar el nuevo worker a
        `installed` mientras ya hay un controller (= update),
        marcamos disponible.
     4. Escuchamos `controllerchange` global y recargamos una vez
        para que el usuario vea la versión nueva.
     5. `accept()` postMessage SKIP_WAITING al waiting worker — el
        SW atiende y hace `self.skipWaiting()`, luego
        `controllerchange` dispara reload.

   No forzamos reload sin consent: la UI debe llamar accept() desde
   un botón del toast.

   Sprint 80 — `setReloadGate(fn)`: el caller (page.jsx) registra
   un predicado para diferir el reload mientras hay sesión activa.
   Sin esto, aceptar update en OTRA pestaña dispara controllerchange
   global → ESTA pestaña recarga aunque esté corriendo una sesión
   (ts/sec/pi viven en React state, no persistido → sesión muerta).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, useRef } from "react";

// Module-level gate. El caller registra una fn que retorna true
// si el reload debe diferirse (ej: ts==="running" || ts==="paused").
// null = sin gate registrado → reload siempre inmediato (comportamiento
// previo, conservado para callers que no se importan del flujo de sesión).
let _reloadGate = null;
export function setReloadGate(fn) {
  _reloadGate = typeof fn === "function" ? fn : null;
}

export function useServiceWorkerUpdate({ autoRegister = true } = {}) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const waitingRef = useRef(null);
  const reloadingRef = useRef(false);
  const deferredPollRef = useRef(false);

  const markWaiting = useCallback((worker) => {
    if (!worker) return;
    waitingRef.current = worker;
    setUpdateAvailable(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    async function setup() {
      try {
        const reg = autoRegister
          ? await navigator.serviceWorker.register("/sw.js")
          : await navigator.serviceWorker.getRegistration("/sw.js");
        if (cancelled || !reg) return;

        // Caso 1: ya hay un SW esperando (otra pestaña lo instaló).
        if (reg.waiting && navigator.serviceWorker.controller) {
          markWaiting(reg.waiting);
        }

        // Caso 2: una instalación nueva empieza mientras estamos en la página.
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              markWaiting(nw);
            }
          });
        });
      } catch {
        /* registration fallida — silencio; layout.js ya tiene un fallback */
      }
    }

    function onControllerChange() {
      if (reloadingRef.current) return;
      // Sprint 80 — si el gate dice "no aún" (ej: sesión activa),
      // diferimos. Polling 2s hasta que el gate libere. Sin esto,
      // un reload mid-sesión por update en otra tab pierde el estado
      // efímero (ts, sec, pi, sessionData) que vive solo en React.
      if (_reloadGate && _reloadGate()) {
        if (deferredPollRef.current) return;
        deferredPollRef.current = true;
        const tryReload = () => {
          if (_reloadGate && _reloadGate()) {
            setTimeout(tryReload, 2000);
            return;
          }
          reloadingRef.current = true;
          window.location.reload();
        };
        setTimeout(tryReload, 2000);
        return;
      }
      reloadingRef.current = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    setup();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [autoRegister, markWaiting]);

  const accept = useCallback(() => {
    const w = waitingRef.current;
    if (!w) {
      // Fallback: pedir al SW actual que llame skipWaiting (si el SW lo expone).
      try { navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" }); } catch { /* noop */ }
      return;
    }
    try { w.postMessage({ type: "SKIP_WAITING" }); } catch { /* noop */ }
  }, []);

  const dismiss = useCallback(() => setUpdateAvailable(false), []);

  return { updateAvailable, accept, dismiss };
}
