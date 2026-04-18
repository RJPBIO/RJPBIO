/* ═══════════════════════════════════════════════════════════════
   i18n global — 12 locales + RTL + ICU plural + Intl formatters
   ═══════════════════════════════════════════════════════════════
   `t(key, vars)` resuelve contra el locale activo, luego cae a EN,
   finalmente a la propia key. `tLocale(locale, key, vars)` es la
   variante server-side sin estado global (lee solo el locale pasado).
   ═══════════════════════════════════════════════════════════════ */

import { es } from "./locales/es";
import { en } from "./locales/en";
import { pt } from "./locales/pt";
import { fr } from "./locales/fr";
import { de } from "./locales/de";
import { it } from "./locales/it";
import { nl } from "./locales/nl";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { zh } from "./locales/zh";
import { ar } from "./locales/ar";
import { he } from "./locales/he";

export const LOCALES = { es, en, pt, fr, de, it, nl, ja, ko, zh, ar, he };
export const RTL = new Set(["ar", "he", "fa", "ur"]);
export const DEFAULT_LOCALE = "es";
export const FALLBACK_LOCALE = "en";

// Labels nativos para el selector (auto-referenciales: cada uno en su idioma).
export const LOCALE_LABELS = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  nl: "Nederlands",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  ar: "العربية",
  he: "עברית",
};

function detect() {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem("bio-locale");
    if (stored && LOCALES[stored]) return stored;
  } catch {}
  const langs = navigator.languages || [navigator.language];
  for (const l of langs) {
    const code = l?.slice(0, 2).toLowerCase();
    if (LOCALES[code]) return code;
  }
  return DEFAULT_LOCALE;
}

let current = typeof window === "undefined" ? DEFAULT_LOCALE : detect();
const listeners = new Set();

export function getLocale() { return current; }
export function isRTL(l = current) { return RTL.has(l); }

export function setLocale(l) {
  if (!LOCALES[l]) return;
  current = l;
  try {
    localStorage.setItem("bio-locale", l);
    // Cookie duplicada para SSR (1 año, SameSite=Lax, no HttpOnly porque el cliente la escribe).
    document.cookie = `bio-locale=${l}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = l;
    document.documentElement.dir = isRTL(l) ? "rtl" : "ltr";
  } catch {}
  listeners.forEach((fn) => fn(l));
}

export function onLocaleChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// ICU-style: "{count, plural, one {# día} other {# días}}"
function pluralize(template, vars, locale) {
  const m = template.match(/^\{(\w+),\s*plural,\s*(.+)\}$/s);
  if (!m) return template;
  const [, key, rules] = m;
  const n = Number(vars?.[key]);
  const pr = new Intl.PluralRules(locale).select(n);
  const map = {};
  rules.replace(/(zero|one|two|few|many|other)\s*\{([^}]*)\}/g, (_, k, v) => { map[k] = v; return ""; });
  return (map[pr] || map.other || "").replace(/#/g, String(n));
}

function resolvePath(dict, key) {
  if (!dict) return null;
  return key.split(".").reduce((acc, k) => (acc ? acc[k] : null), dict);
}

function interpolate(str, vars) {
  if (!vars || typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

// Núcleo puro: resuelve `key` contra un locale dado, con fallback a EN y luego key.
export function tLocale(locale, key, vars) {
  let val = resolvePath(LOCALES[locale], key);
  if (val == null && locale !== FALLBACK_LOCALE) val = resolvePath(LOCALES[FALLBACK_LOCALE], key);
  if (val == null) val = key;
  if (typeof val === "string" && val.startsWith("{") && val.includes("plural")) {
    return pluralize(val, vars, locale);
  }
  return interpolate(val, vars);
}

export function t(key, vars) { return tLocale(current, key, vars); }

// ─── Intl helpers ───────────────────────────────────────
export function fmtDate(d, opts) { return new Intl.DateTimeFormat(current, opts).format(new Date(d)); }
export function fmtNumber(n, opts) { return new Intl.NumberFormat(current, opts).format(n); }
export function fmtRelative(date) {
  const rtf = new Intl.RelativeTimeFormat(current, { numeric: "auto" });
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  for (const [u, s] of units) if (Math.abs(diff) >= s || u === "second") return rtf.format(Math.round(diff / s), u);
}
export function fmtCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat(current, { style: "currency", currency }).format(amount);
}

// Variantes server-side: aceptan locale explícito (no dependen del estado global).
export function fmtDateL(locale, d, opts) { return new Intl.DateTimeFormat(locale, opts).format(new Date(d)); }
export function fmtCurrencyL(locale, amount, currency = "USD") {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
