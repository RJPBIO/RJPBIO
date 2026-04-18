/* ═══════════════════════════════════════════════════════════════
   useCommandKey — atajo Cmd/Ctrl+K para abrir/cerrar la Command
   Palette. Toca `uiSound.open`/`uiSound.close` como side-effect al
   togglear, manteniendo la paridad acústica que tenía page.jsx.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import { uiSound } from "../lib/uiSound";

/**
 * @param {(updater:(prev:boolean)=>boolean)=>void} setShowCmd  Setter del estado de visibilidad.
 * @param {boolean} soundOn  Si el usuario tiene sonido activo (gate de uiSound).
 */
export function useCommandKey(setShowCmd, soundOn) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onCmdKey(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setShowCmd((v) => {
          const nv = !v;
          uiSound[nv ? "open" : "close"](soundOn);
          return nv;
        });
      }
    }
    window.addEventListener("keydown", onCmdKey);
    return () => window.removeEventListener("keydown", onCmdKey);
  }, [setShowCmd, soundOn]);
}
