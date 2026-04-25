"use client";
import { useEffect, useRef } from "react";
import { wireBackgroundSync, flushOutbox, pullRemote, triggerDrain } from "../lib/sync";
import { useStore } from "../store/useStore";

/* useSync — orquesta el ciclo de sync en /app:
   1. Hydrate al primer mount (pull server state, mergear local)
   2. Background sync (online events, visibility, service worker)
   3. Drain inicial post-hydrate (envía outbox pendiente)

   Re-hydrate solo se hace UNA vez por sesión de browser; para
   forzar otro pull el usuario tendría que recargar o re-login. */
export function useSync() {
  const hydratedRef = useRef(false);
  useEffect(() => {
    const getCurrentUserId = () => useStore.getState()._userId ?? null;

    // 1. Background sync wiring (online, visibility, SW periodic)
    wireBackgroundSync({ getCurrentUserId });

    // 2. Hydrate + initial drain — corre asíncrono sin bloquear render.
    //    El store ya cargó del IndexedDB; pullRemote merge server data
    //    con last-write-wins y persiste el resultado en saveState (que
    //    el store init reads). Re-hidratamos el store a mano después.
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      (async () => {
        try {
          const userId = getCurrentUserId();
          // Hydrate server → IndexedDB (merge)
          const merged = await pullRemote({ currentUserId: userId });
          // Si hubo merge, refresh el store de Zustand desde el IndexedDB
          if (merged) {
            useStore.setState({ ...merged, _loaded: true });
          }
          // Drain pending outbox
          await flushOutbox({ currentUserId: userId });
        } catch {
          // Sync failure no bloquea — local-first sigue funcionando
        }
      })();
    }

    // 3. Online event redundante (wireBackgroundSync ya escucha, pero
    //    aquí explícito para legacy compatibility).
    const onOnline = () =>
      flushOutbox({ currentUserId: getCurrentUserId() }).catch(() => {});
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
}

/* useDrainOnUpdate — hook auxiliar para disparar drain debounced
   después de eventos que añaden al outbox (completeSession, etc.).
   Se puede llamar desde cualquier componente como side-effect. */
export function useDrainOnUpdate() {
  return () => {
    const userId = useStore.getState()._userId ?? null;
    triggerDrain(() => userId);
  };
}
