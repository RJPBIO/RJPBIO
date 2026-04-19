/* ═══════════════════════════════════════════════════════════════
   useSessionAudio — arranca/detiene ambient + soundscape + binaural
   según el estado del timer (`timerStatus`).

   IMPORTANTE: la dependencia es SÓLO timerStatus. Cambios de
   soundscape/soundOn/intent en mitad de la sesión no deben
   reiniciar el audio (evita click al cambiar de selector). Los
   valores se leen vía refs para que el efecto capture el último
   estado cuando arranca.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import {
  startAmbient, stopAmbient,
  startSoundscape, stopSoundscape,
  startBinaural, stopBinaural,
} from "../lib/audio";

/**
 * @param {object}  args
 * @param {string}  args.timerStatus   "idle" | "running" | "paused" | "done"
 * @param {boolean} args.soundOn       Si el usuario tiene sonido activado.
 * @param {string}  args.soundscape    Clave del soundscape activo ("off" o id).
 * @param {string}  args.intent        Intent/protocolo, guía el binaural.
 */
export function useSessionAudio({ timerStatus, soundOn, soundscape, intent }) {
  const soundOnRef = useRef(soundOn);
  const soundscapeRef = useRef(soundscape);
  const intentRef = useRef(intent);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
  useEffect(() => { soundscapeRef.current = soundscape; }, [soundscape]);
  useEffect(() => { intentRef.current = intent; }, [intent]);

  useEffect(() => {
    if (timerStatus === "running" && soundOnRef.current !== false) {
      const ss = soundscapeRef.current || "off";
      if (ss !== "off") startSoundscape(ss);
      else startAmbient();
      startBinaural(intentRef.current);
    } else {
      stopAmbient();
      stopSoundscape();
      stopBinaural();
    }
    return () => {
      stopAmbient();
      stopSoundscape();
      stopBinaural();
    };
  }, [timerStatus]);
}
