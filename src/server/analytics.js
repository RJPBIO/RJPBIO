/* ═══════════════════════════════════════════════════════════════
   Analytics con k-anonymity (k=5) y noise diferencial opcional.
   Server-only wrapper — la lógica pura vive en lib/analytics-anonymize
   para que sea testeable sin import "server-only".
   Resultado: agregados por cohorte nunca exponen usuarios únicos.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
export { anonymize, dayKey, laplaceNoise } from "../lib/analytics-anonymize";
