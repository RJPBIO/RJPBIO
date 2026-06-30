/* ═══════════════════════════════════════════════════════════════
   PRESENCE TRANSITION — del rol profesional al rol personal.
   ───────────────────────────────────────────────────────────────
   Llegas a casa con el sistema nervioso todavía en modo trabajo:
   físicamente presente, autonómicamente ausente. Detecta ese estado
   (tarde-noche + activación simpática sostenida = HRV por debajo de tu
   norma) y propone cruzar el umbral con un protocolo parasimpático
   enmarcado para la transición.

   Tesis del producto: el MECANISMO es el mismo evidenciado (activación
   parasimpática); la especificidad "para el umbral de casa" vive en el
   encuadre (protocolFraming "transicion_casa") y en el outcome (presencia
   en relaciones, vía el diario autonómico — contexto pareja/familia).

   HONESTIDAD: la detección es heurística (hora + desviación del gemelo),
   no un sensor de "modo trabajo". Sin lectura reciente no afirma nada.
   ═══════════════════════════════════════════════════════════════ */

import { buildAutonomicTwin } from "./autonomicTwin";

const HOME_PROTOCOL_ID = 1; // Reinicio Parasimpático
const EVENING_START = 17;
const EVENING_END = 22;

export function buildPresenceTransition({ hrvLog, now = Date.now() } = {}) {
  const hour = new Date(now).getHours();
  const isEvening = hour >= EVENING_START && hour < EVENING_END;
  if (!isEvening) {
    return { detected: false, reason: "Fuera de la ventana de transición a casa (tarde-noche)." };
  }

  const twin = buildAutonomicTwin(Array.isArray(hrvLog) ? hrvLog : [], { now });
  if (!twin.available || !twin.deviation) {
    return {
      detected: false,
      reason: "Mide tu HRV al llegar a casa para detectar tu estado de transición.",
    };
  }
  if (twin.deviation.direction !== "below") {
    return { detected: false, reason: "Tu sistema no muestra activación sostenida ahora." };
  }

  return {
    detected: true,
    protocolId: HOME_PROTOCOL_ID,
    situation: "transicion_casa",
    message:
      "Llegas a casa con el sistema todavía en modo trabajo. Tres minutos para cruzar el umbral y llegar presente.",
  };
}
