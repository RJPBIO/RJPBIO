/* ═══════════════════════════════════════════════════════════════
   locale-server — resolución de locale en Server Components
   ═══════════════════════════════════════════════════════════════
   Orden de preferencia:
   1. Cookie `bio-locale` (escrita por el cliente cuando cambia setLocale).
   2. Header Accept-Language (negociación HTTP estándar).
   3. DEFAULT_LOCALE.
   Cookie gana para honrar la elección explícita del usuario aun cuando
   su navegador reporte otro idioma.
   ═══════════════════════════════════════════════════════════════ */

import { cookies, headers } from "next/headers";
import { LOCALES, DEFAULT_LOCALE, RTL } from "./i18n";

const SUPPORTED = Object.keys(LOCALES);

export async function getServerLocale() {
  try {
    const c = await cookies();
    const fromCookie = c.get("bio-locale")?.value;
    if (fromCookie && SUPPORTED.includes(fromCookie)) return fromCookie;
  } catch {}
  try {
    const h = await headers();
    const al = h.get("accept-language");
    if (al) {
      const head = al.split(",")[0]?.trim().toLowerCase() || "";
      const short = head.split("-")[0];
      if (SUPPORTED.includes(short)) return short;
    }
  } catch {}
  return DEFAULT_LOCALE;
}

export async function getServerLocaleAndDir() {
  const locale = await getServerLocale();
  return { locale, dir: RTL.has(locale) ? "rtl" : "ltr" };
}
