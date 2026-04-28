"use client";
/* ═══════════════════════════════════════════════════════════════
   useHaptic — feedback háptico centralizado, respeta preferencias
   ═══════════════════════════════════════════════════════════════
   Antes: cada componente llamaba `navigator.vibrate()` directo,
   ignorando si el usuario desactivó haptics. Resultado: settings
   inconsistentes y vibraciones que el user pidió no recibir.

   Ahora: un solo hook lee `st.hapticOn` (default true) y expone
   patterns nombrados. Todo componente que quiera vibrar usa este
   hook — UNA fuente de verdad.

   Patterns disponibles:
     tap      — toque ligero (10ms)
     beat     — latido detectado (15ms, sutil)
     ok       — confirmación (20-40-20)
     warn     — alerta (40-60-40)
     success  — éxito celebrativo (40-60-40-60-80)
     error    — fallo (100ms sólido)

   Browser support: Android Chrome/Edge nativo. iOS Safari NO soporta
   Vibration API estable — falla silenciosamente. Tablets y desktops
   tampoco. El hook es safe en cualquier entorno.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback } from "react";
import { useStore } from "../store/useStore";

// Sprint 72: piso 30ms en pulsos individuales. Antes tap:10 / beat:15
// quedaban por debajo del umbral perceptual del motor háptico de
// teléfonos modernos (≈ 20-30ms). El user reportaba "no vibran los
// teléfonos" — éste era uno de los culpables.
const PATTERNS = {
  tap: 30,
  beat: 30,
  ok: [40, 40, 40],
  warn: [40, 60, 40],
  success: [40, 60, 40, 60, 80],
  error: 100,
};

export function useHaptic() {
  const enabled = useStore((s) => s.hapticOn !== false);

  const haptic = useCallback(
    (pattern = "tap") => {
      if (!enabled) return false;
      if (typeof navigator === "undefined" || !navigator.vibrate) return false;
      const p = typeof pattern === "string" ? PATTERNS[pattern] : pattern;
      if (p == null) return false;
      try {
        // navigator.vibrate retorna true si se disparó, false si bloqueado
        // (ej. iOS Safari, modo silencio absoluto en algunos Android).
        return navigator.vibrate(p) === true;
      } catch {
        return false;
      }
    },
    [enabled]
  );

  return haptic;
}
