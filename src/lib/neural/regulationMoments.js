/* ═══════════════════════════════════════════════════════════════
   REGULATION MOMENTS — un solo momento de regulación, en su momento.
   ───────────────────────────────────────────────────────────────
   Generaliza la "transición a casa" a un motor de momentos: detecta el
   momento relevante (hora + estado autonómico vs norma personal) y propone
   UN protocolo enmarcado para ese momento. Surfacea solo uno (prioridad),
   sin amontonar cards.

   Momentos:
     · pre_sueno      (noche)            → Suspiro Fisiológico (#15)
     · transicion_casa(tarde + bajo)     → Transición a casa (#26)
     · despertar      (mañana + bajo)    → Activación Cognitiva (#2)
     · creatividad    (día + listo)      → Activación Cognitiva (#2)

   HONESTIDAD: es heurística (hora + desviación del gemelo). NO es la "firma
   de flow" personal ni "calibración contra tu sueño" — eso necesita datos
   etiquetados / wearables que aún no existen. El outcome real se marca en el
   diario. La detección afina conforme se acumulan datos.
   ═══════════════════════════════════════════════════════════════ */

import { buildAutonomicTwin } from "./autonomicTwin";

function moment(situation, protocolId, eyebrow, message, ctaLabel) {
  return { detected: true, id: situation, situation, protocolId, eyebrow, message, ctaLabel };
}

export function detectRegulationMoment({ hrvLog, now = Date.now() } = {}) {
  const h = new Date(now).getHours();
  let dir = null;
  try {
    dir = buildAutonomicTwin(Array.isArray(hrvLog) ? hrvLog : [], { now }).deviation?.direction || null;
  } catch {
    dir = null;
  }

  // Prioridad de mayor a menor especificidad temporal.
  // Pre-sueño: 21:00–02:59 (la noche manda, sin importar el estado).
  if (h >= 21 || h < 3) {
    return moment(
      "pre_sueno",
      15,
      "Antes de dormir",
      "Es hora de bajar el sistema. Unos minutos para preparar un descanso más profundo, no para resolver nada más.",
      "Bajar para dormir · 3 min"
    );
  }
  // Transición a casa: 17:00–20:59 + por debajo de tu norma (modo trabajo).
  if (h >= 17 && h < 21 && dir === "below") {
    return moment(
      "transicion_casa",
      26,
      "Transición a casa",
      "Llegas a casa con el sistema todavía en modo trabajo. Tres minutos para cruzar el umbral y llegar presente.",
      "Cruzar el umbral · 3 min"
    );
  }
  // Despertar: 05:00–09:59 + por debajo de tu norma (sistema aún dormido).
  if (h >= 5 && h < 10 && dir === "below") {
    return moment(
      "despertar",
      2,
      "Arranque del día",
      "Tu sistema aún está despertando. Sube despacio antes del primer estímulo del día: claridad, no reacción.",
      "Activar el día · 3 min"
    );
  }
  // Ventana creativa: 09:00–17:59 + estado listo (en tu rango o por encima).
  if (h >= 9 && h < 18 && (dir === "within" || dir === "above")) {
    return moment(
      "creatividad",
      2,
      "Ventana creativa",
      "Tu sistema está en el equilibrio que precede tu mejor trabajo: ni apagado ni acelerado. Entra en foco antes de empezar.",
      "Entrar en foco · 3 min"
    );
  }

  return { detected: false, reason: "Sin un momento de regulación destacado ahora." };
}
