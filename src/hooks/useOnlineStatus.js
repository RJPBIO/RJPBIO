"use client";
/* ═══════════════════════════════════════════════════════════════
   useOnlineStatus — suscribe a los eventos online/offline y expone
   el estado como boolean. Defaults a `true` en SSR para no parpadear.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Valor real al montar (el default true era para SSR).
    setOnline(navigator.onLine !== false);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return online;
}
