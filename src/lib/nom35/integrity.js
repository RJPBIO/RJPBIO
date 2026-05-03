/* ═══════════════════════════════════════════════════════════════
   NOM-035 — integrity check + legal-validation flag (Sprint S1.7)
   ═══════════════════════════════════════════════════════════════
   El texto literal de los 72 ítems de Guía III debe coincidir con
   el publicado en el DOF (23-oct-2018, Anexo III). Hoy items.js
   tiene un comentario "debe validarse antes de imprimir actas".
   Este módulo:

   1. Computa SHA-256 de la lista canónica de ítems (id|text|dominio
      |reverse). Cualquier edición accidental al texto cambia el hash.
   2. Almacena el hash "known good" en NOM35_ITEMS_HASH_EXPECTED.
      Si alguien edita ITEMS sin actualizar el constante, los tests
      lanzan al CI — forzamos que cualquier cambio de texto sea
      DELIBERADO y review-able.
   3. Expone `nom035TextValidatedByLawyer` = false. ESTE FLAG NO LO
      ENCIENDE EL CÓDIGO — solo un humano con review legal debe
      poner true. En false, la app puede mostrar disclaimer en
      reportes oficiales.

   IMPORTANTE: este módulo NO certifica validez legal del texto.
   Solo certifica integridad (que no hubo edits accidentales). El
   review legal vs DOF oficial debe hacerlo un abogado / STPS auditor.
   ═══════════════════════════════════════════════════════════════ */

import { ITEMS } from "./items";

/**
 * Hash determinístico de los ítems. Usa Web Crypto si está disponible
 * (edge runtime), Node crypto fallback. Ambos producen el mismo SHA-256
 * sobre los mismos bytes input.
 *
 * Forma canónica: `${id}|${text}|${dominio}|${reverse?1:0}\n` por ítem,
 * sorted by id ascendente. JSON.stringify sería frágil (orden de keys);
 * un join de campos discretos elimina ambigüedad.
 */
function canonicalForm() {
  const sorted = [...ITEMS].sort((a, b) => a.id - b.id);
  return sorted.map((it) => `${it.id}|${it.text}|${it.dominio}|${it.reverse ? 1 : 0}`).join("\n");
}

/**
 * Synchronously compute SHA-256 hex. Usa node:crypto cuando disponible
 * (server, scripts), Web Crypto async path para edge.
 *
 * @returns {Promise<string>} hex digest
 */
export async function computeNom35ItemsHash() {
  const text = canonicalForm();
  const buf = new TextEncoder().encode(text);
  // Web Crypto path (edge / browser).
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Node crypto fallback.
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * "Known good" hash. Si editas ITEMS deliberadamente, recalcula y
 * actualiza este valor en el mismo PR. Tests del módulo `integrity.test.js`
 * fallan si discrepan — esa es la señal de que tu cambio es deliberado
 * y necesita re-validación legal.
 *
 * Para regenerar: `node -e 'import("./src/lib/nom35/integrity.js").then(m => m.computeNom35ItemsHash().then(console.log))'`
 *
 * Sprint S1.7 — hash inicial computado sobre items.js v1 (DOF 2018 Guía III, 72 ítems).
 */
export const NOM35_ITEMS_HASH_EXPECTED =
  "70fab3d724534f63f2e2b16717fa4128551586c322a990fe0756fc154e06eb17";

/**
 * Flag que SOLO un humano con review legal debe poner en true,
 * después de validar uno-a-uno los 72 ítems vs el DOF Anexo III.
 *
 * NO LO MODIFIQUE EL CÓDIGO. NO LO MODIFIQUE NINGÚN AGENTE LLM.
 *
 * Mientras esté en false:
 * - Reportes oficiales (Nom35PersonalReport.jsx, /admin/nom35/documento)
 *   DEBEN mostrar disclaimer "Texto pendiente de validación legal vs DOF".
 * - Las actas firmadas para STPS NO se generan o se marcan "DRAFT".
 * - El UI de admin puede operar normalmente para uso interno.
 */
export const nom035TextValidatedByLawyer = false;

/**
 * Verifica integridad en runtime. Devuelve `{ ok, current, expected }`.
 * Útil para boot checks o `/api/health`.
 *
 * @returns {Promise<{ok: boolean, current: string, expected: string, mismatch?: true}>}
 */
export async function verifyNom35Integrity() {
  const current = await computeNom35ItemsHash();
  const expected = NOM35_ITEMS_HASH_EXPECTED;
  return {
    ok: current === expected,
    current,
    expected,
    ...(current !== expected ? { mismatch: true } : {}),
  };
}
