"use client";

/* ═══════════════════════════════════════════════════════════════
   Puente auth ↔ store local.
   signOutAndClear() limpia IDB/localStorage ANTES de redirigir,
   evita que el próximo usuario en el mismo navegador herede datos.
   ═══════════════════════════════════════════════════════════════ */

import { signOut } from "next-auth/react";
import { useStore } from "../store/useStore";

export function useAuthBridge() {
  const resetAll = useStore((s) => s.resetAll);

  async function signOutAndClear(opts) {
    try { await resetAll(); } catch {}
    try { localStorage.removeItem("bio-sync-token"); } catch {}
    return signOut(opts);
  }

  return { signOutAndClear };
}
