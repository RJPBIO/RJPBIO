/* ═══════════════════════════════════════════════════════════════
   useAutoSave — persiste periódicamente (default 30 s) y en los
   eventos donde el navegador puede cerrar la pestaña sin aviso:
     - beforeunload / pagehide
     - visibilitychange a "hidden" (iOS/Android backgrounding)

   El callback se guarda en un ref para que cambios de identidad
   (closures nuevas cada render) no re-instalen los listeners.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";

/**
 * @param {boolean}  ready       Gate para arrancar (ej. store.init listo).
 * @param {Function} onSave      Callback a ejecutar al salvar. Recibido como identidad mutable.
 * @param {object}   [options]
 * @param {number}   [options.intervalMs=30000]
 */
export function useAutoSave(ready, onSave, { intervalMs = 30000 } = {}) {
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    const save = () => {
      try {
        saveRef.current?.();
      } catch {
        /* no propagar: la auto-salvada no debe romper la UI */
      }
    };
    const iv = setInterval(save, intervalMs);
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("beforeunload", save);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(iv);
      window.removeEventListener("beforeunload", save);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [ready, intervalMs]);
}
