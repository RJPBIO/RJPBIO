/* ═══════════════════════════════════════════════════════════════
   dev-utils — helpers para logging condicional sin contaminar
   producción. Phase 6D SP6 (Bug-24).

   Antes los componentes V2 hacían `console.log("[v2] X active")`
   directo en useEffect → cada mount disparaba ruido en la consola
   del usuario en producción (~6 logs por sesión interactiva).

   devLog/devWarn lo sustituyen: se silencian completamente en
   builds de producción (next.config tree-shake o el process.env
   constant lo elimina como dead code), y mantienen DX en dev.

   No usa logger.* porque ese va a NEXT_PUBLIC_LOG_ENDPOINT cuando
   está configurado (telemetría server-side). Esto NO debe enviar
   debug logs de mount al endpoint externo.

   IMPORTANTE: console.warn/console.error legítimos (errores reales,
   warnings de regresión como Bug-25 "UNHANDLED ACTION") deben
   seguir usando console.* directo, NO devWarn — esos sí deben
   aparecer en producción para troubleshooting.
   ═══════════════════════════════════════════════════════════════ */

const IS_PROD = typeof process !== "undefined" && process.env?.NODE_ENV === "production";

export function devLog(...args) {
  if (IS_PROD) return;
  // eslint-disable-next-line no-console
  console.log(...args);
}

export function devWarn(...args) {
  if (IS_PROD) return;
  // eslint-disable-next-line no-console
  console.warn(...args);
}

export function devInfo(...args) {
  if (IS_PROD) return;
  // eslint-disable-next-line no-console
  console.info(...args);
}
