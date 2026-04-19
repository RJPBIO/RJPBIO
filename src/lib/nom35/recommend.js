/* ═══════════════════════════════════════════════════════════════
   NOM-035 → recomendación de protocolo BIO
   Función pura — sin React, sin window.
   ═══════════════════════════════════════════════════════════════ */

export const NIVEL_LABEL = Object.freeze({
  nulo:     "Nulo",
  bajo:     "Bajo",
  medio:    "Medio",
  alto:     "Alto",
  muy_alto: "Muy alto",
});

const VALID_NIVELES = new Set(["nulo", "bajo", "medio", "alto", "muy_alto"]);

/**
 * Intención recomendada por nivel NOM-35.
 *   medio      → reset  (2 veces al día)
 *   alto       → calma  (≥ 3 veces al día)
 *   muy_alto   → calma  (+ valoración clínica externa)
 *   bajo/nulo  → null   (sin intervención automática)
 */
export function intentForNivel(nivel) {
  if (nivel === "alto" || nivel === "muy_alto") return "calma";
  if (nivel === "medio") return "reset";
  return null;
}

/**
 * Elige un protocolo concreto para el nivel dado.
 * Preferimos dificultad 1 (accesible); si no existe, cualquiera de la intención.
 * Devuelve null si no hay recomendación o no hay protocolos elegibles.
 */
export function recommendProtocolForNivel(nivel, protocols) {
  const intent = intentForNivel(nivel);
  if (!intent || !Array.isArray(protocols) || protocols.length === 0) return null;
  const sameIntent = protocols.filter((p) => p && p.int === intent);
  if (!sameIntent.length) return null;
  const easy = sameIntent.filter((p) => (p.dif ?? 1) === 1);
  const pool = easy.length ? easy : sameIntent;
  return pool.slice().sort((a, b) => (a.d ?? 0) - (b.d ?? 0))[0];
}

/**
 * Texto + metadatos para el banner en BIO.
 */
export function bannerForNivel(nivel) {
  const intent = intentForNivel(nivel);
  if (!intent) return null;
  const label = NIVEL_LABEL[nivel] || nivel;
  const text =
    intent === "calma"
      ? `Tu última NOM-035 marca nivel ${label}. Te sugerimos un protocolo de calma ahora.`
      : `Tu última NOM-035 marca nivel ${label}. Un protocolo de reset te puede ayudar hoy.`;
  return { nivel, intent, label, text };
}

/**
 * Lee el nivel guardado por Nom35Client en localStorage. SSR-safe.
 * Devuelve null si no hay valor o si el valor es inválido.
 */
export function readStoredNom35Level(storage) {
  const s = storage || (typeof window !== "undefined" ? window.localStorage : null);
  if (!s) return null;
  try {
    const v = s.getItem("bio-nom35-level");
    if (!v) return null;
    return VALID_NIVELES.has(v) ? v : null;
  } catch {
    return null;
  }
}
