"use client";
import { useEffect } from "react";
import { wireBackgroundSync, flushOutbox } from "../lib/sync";
import { useStore } from "../store/useStore";

export function useSync() {
  useEffect(() => {
    // Lee siempre el userId más reciente del store; si el usuario
    // cambia durante la sesión, el próximo flush usa la identidad correcta.
    const getCurrentUserId = () => useStore.getState()._userId ?? null;
    wireBackgroundSync({ getCurrentUserId });
    const onOnline = () => flushOutbox({ currentUserId: getCurrentUserId() }).catch(() => {});
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
}
