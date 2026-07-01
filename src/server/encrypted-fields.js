/* ═══════════════════════════════════════════════════════════════
   encrypted-fields — capa decrypt-on-read / encrypt-on-write para
   columnas numéricas sensibles cifradas en reposo (kms.encNum).
   ───────────────────────────────────────────────────────────────
   Los numéricos de HRV se agregan APP-SIDE (mean en JS), no en SQL.
   Se cifran al escribir y se descifran al leer, justo en la fuente de
   fetch, para que todo el código downstream vea números (incl. guards
   como `typeof h.rmssd === "number"`). Passthrough sobre filas legacy en
   claro → seguro de activar sin migrar datos viejos.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { encNum, decNum } from "./kms";

const HRV_NUMERIC_FIELDS = ["rmssd", "lnRmssd", "sdnn", "pnn50", "meanHr", "rhr"];

/** Cifra los numéricos de una fila HrvMeasurement antes de persistir. */
export function encryptHrvNumerics(data) {
  if (!data || typeof data !== "object") return data;
  const out = { ...data };
  for (const f of HRV_NUMERIC_FIELDS) out[f] = encNum(out[f]);
  return out;
}

/** Descifra los numéricos de una fila HrvMeasurement leída. */
export function decryptHrvRow(row) {
  if (!row || typeof row !== "object") return row;
  const out = { ...row };
  for (const f of HRV_NUMERIC_FIELDS) out[f] = decNum(out[f]);
  return out;
}

/** Descifra un array de filas HrvMeasurement (usar como .then(decryptHrvRows)). */
export function decryptHrvRows(rows) {
  return Array.isArray(rows) ? rows.map(decryptHrvRow) : rows;
}
