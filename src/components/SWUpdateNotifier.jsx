"use client";
/* ═══════════════════════════════════════════════════════════════
   SWUpdateNotifier — emite toast cuando hay nueva versión disponible.
   Toast persistente con acción "Actualizar" — el user reload cuando
   quiera, sin sorpresas mid-session.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { useServiceWorkerUpdate } from "../hooks/useServiceWorkerUpdate";
import { toast } from "./ui/Toast";

export default function SWUpdateNotifier() {
  const { updateAvailable, accept } = useServiceWorkerUpdate();
  const emittedRef = useRef(false);

  useEffect(() => {
    if (!updateAvailable || emittedRef.current) return;
    emittedRef.current = true;
    toast.info("Nueva versión disponible — mejoras y fixes recientes", {
      duration: 0, // persistente hasta que el usuario actúe
      action: { label: "Actualizar", onClick: accept },
    });
  }, [updateAvailable, accept]);

  return null;
}
