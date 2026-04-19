/* ═══════════════════════════════════════════════════════════════
   useMidSessionMessages — muestra un mensaje breve al llegar a
   ciertos hitos del countdown:
     - sec === 60: random pick de MID_MSGS (3.5 s)
     - sec === 30: "Últimos 30. Cierra con todo." (3.0 s)

   Se extrajo de page.jsx; la orquestación más pesada del
   phase-runner (speak/haptic/breath-cycle) se queda inline porque
   sus efectos están demasiado entrelazados para un hook aislado.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import { MID_MSGS } from "../lib/constants";

const MID_TRIGGERS = [
  { at: 60, pick: () => MID_MSGS[Math.floor(Math.random() * MID_MSGS.length)], duration: 3500 },
  { at: 30, pick: () => "Últimos 30. Cierra con todo.", duration: 3000 },
];

/**
 * @param {object}   args
 * @param {string}   args.timerStatus          "idle" | "running" | "paused" | "done"
 * @param {number}   args.secondsRemaining     Segundos restantes (sec del timer).
 * @param {Function} args.setMidMsg            setter del mensaje.
 * @param {Function} args.setShowMid           setter del flag de visibilidad.
 */
export function useMidSessionMessages({ timerStatus, secondsRemaining, setMidMsg, setShowMid }) {
  useEffect(() => {
    if (timerStatus !== "running") return;
    const trigger = MID_TRIGGERS.find((t) => t.at === secondsRemaining);
    if (!trigger) return;
    setMidMsg(trigger.pick());
    setShowMid(true);
    const to = setTimeout(() => setShowMid(false), trigger.duration);
    return () => clearTimeout(to);
  }, [secondsRemaining, timerStatus, setMidMsg, setShowMid]);
}
