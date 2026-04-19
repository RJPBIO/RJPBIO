"use client";
import { useEffect, useState } from "react";
import { resolveTapEntry } from "../lib/tapEntry";
import { announce } from "../lib/a11y";

/* Lee la URL al montar y resuelve el intento de entrada (NFC / signed tap /
   legacy deep-link / error). Devuelve el resultado como estado de React.
   El caller lo aplica a su estado local (setPr, setNfcCtx, setEntryDone).
   La lógica de parsing vive en lib/tapEntry.js y se testea sin render. */
export function useTapEntry({ protocols, durationMultiplier = 1 } = {}) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let parsed;
    try {
      const params = new URLSearchParams(window.location.search);
      parsed = resolveTapEntry(params, {
        protocols,
        hour: new Date().getHours(),
        durationMultiplier,
      });
    } catch {
      parsed = { kind: null };
    }
    if (parsed.kind === "error") announce(parsed.message, "assertive");
    setResult(parsed);
    // Solo corre al montar: URL sólo se parsea una vez por sesión,
    // igual que el comportamiento original de los tres useEffects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return result;
}
