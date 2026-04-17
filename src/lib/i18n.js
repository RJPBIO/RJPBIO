/* ═══════════════════════════════════════════════════════════════
   i18n global — 12 locales + RTL + ICU plural + Intl formatters
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
    document.documentElement.lang = l;
    document.documentElement.dir = isRTL(l) ? "rtl" : "ltr";
  } catch {}
  listeners.forEach((fn) => fn(l));
}

export function onLocaleChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// ICU-style: "{count, plural, one {# día} other {# días}}"
function pluralize(template, vars) {
  const m = template.match(/^\{(\w+),\s*plural,\s*(.+)\}$/s);
  if (!m) return template;
  const [, key, rules] = m;
  const n = Number(vars?.[key]);
  const pr = new Intl.PluralRules(current).select(n);
  const map = {};
  rules.replace(/(zero|one|two|few|many|other)\s*\{([^}]*)\}/g, (_, k, v) => { map[k] = v; return ""; });
  return (map[pr] || map.other || "").replace(/#/g, String(n));
}

export function t(key, vars) {
  const dict = LOCALES[current] || LOCALES[DEFAULT_LOCALE];
  let val = key.split(".").reduce((acc, k) => (acc ? acc[k] : null), dict);
  if (val == null) val = key;
  if (typeof val === "string" && val.startsWith("{") && val.includes("plural")) return pluralize(val, vars);
  if (vars) val = String(val).replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
  return val;
}

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
