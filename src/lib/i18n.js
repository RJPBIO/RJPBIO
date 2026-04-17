/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — i18n ligero
   Sin dependencias. Pluralización básica + interpolación.
   ═══════════════════════════════════════════════════════════════ */

import { es } from "./locales/es";
import { en } from "./locales/en";

export const LOCALES = { es, en };
export const DEFAULT_LOCALE = "es";

function detect() {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const stored = typeof localStorage !== "undefined" ? localStorage.getItem("bio-locale") : null;
  if (stored && LOCALES[stored]) return stored;
  const nav = navigator.language?.slice(0, 2);
  return LOCALES[nav] ? nav : DEFAULT_LOCALE;
}

let current = typeof window === "undefined" ? DEFAULT_LOCALE : detect();
const listeners = new Set();

export function getLocale() { return current; }

export function setLocale(l) {
  if (!LOCALES[l]) return;
  current = l;
  try { localStorage.setItem("bio-locale", l); } catch {}
  listeners.forEach((fn) => fn(l));
}

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key, vars) {
  const dict = LOCALES[current] || LOCALES[DEFAULT_LOCALE];
  let val = key.split(".").reduce((acc, k) => (acc ? acc[k] : null), dict);
  if (val == null) val = key;
  if (vars) {
    val = String(val).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
  }
  return val;
}
