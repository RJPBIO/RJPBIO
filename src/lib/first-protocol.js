/* ═══════════════════════════════════════════════════════════════
   FIRST PROTOCOL BY INTENT
   ═══════════════════════════════════════════════════════════════
   Mapa intent → primer protocolo recomendado para "Tu primera
   sesión" en ColdStart. Compartido entre AppV2Root (handler real
   que lanza ProtocolPlayer) y ColdStartView (label que se muestra
   en el card). Antes vivía duplicado: handler en AppV2Root usaba
   este mapeo, label en ColdStart hardcodeaba "Pulse Shift" — el
   resultado era que el card decía "Pulse Shift" pero al tap
   lanzaba el correcto. Mover acá garantiza coherencia.

   IDs validados contra src/lib/protocols.js:
     1 → Reinicio Parasimpático (calma)
     2 → Activación Cognitiva   (enfoque)
     3 → Reset Ejecutivo        (reset / recuperacion alias)
     4 → Pulse Shift            (energia)
   ═══════════════════════════════════════════════════════════════ */

import { P as PROTOCOLS } from "./protocols";

export const FIRST_PROTOCOL_BY_INTENT = {
  calma: 1,           // Reinicio Parasimpático
  enfoque: 2,         // Activación Cognitiva
  energia: 4,         // Pulse Shift
  reset: 3,           // Reset Ejecutivo
  recuperacion: 3,    // Reset Ejecutivo (alias welcome → engine)
};

// Default: cuando intent es null/undefined o no mapea, sugerimos
// Reinicio Parasimpático (id=1) — el protocolo más universal y
// seguro para alguien sin baseline. Antes el default era 4 (Pulse
// Shift = energia) que solo encaja si el user tenía energia intent.
export const DEFAULT_FIRST_PROTOCOL_ID = 1;

/**
 * Devuelve el objeto Protocol completo (de PROTOCOLS) para el
 * primer-session card según el firstIntent del user.
 * Devuelve null si el catálogo no contiene el id resuelto
 * (defensivo contra catálogos parcialmente cargados).
 */
export function firstProtocolForIntent(intent) {
  const id = FIRST_PROTOCOL_BY_INTENT[intent] || DEFAULT_FIRST_PROTOCOL_ID;
  return PROTOCOLS.find((p) => p.id === id) || null;
}
