"use client";
/* ═══════════════════════════════════════════════════════════════
   SWUpdateNotifier — escucha el hook de actualización del SW y
   emite un toast persistente con acción "Recargar". Se monta en
   GlobalChrome, sin UI propia.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { useServiceWorkerUpdate } from "../hooks/useServiceWorkerUpdate";
import { toast } from "./ui/Toast";

export default function SWUpdateNotifier() {
  const { updateAvailable, accept } = useServiceWorkerUpdate();
  const emittedRef = useRef(false);

  useEffect(() => {
    if (updateAvailable && !emittedRef.current) {
      emittedRef.current = true;
      toast.info("Nueva versión disponible", {
        duration: 0, // persistente hasta que el usuario actúe
        action: { label: "Recargar", onClick: accept },
      });
    }
  }, [updateAvailable, accept]);

  return null;
}
