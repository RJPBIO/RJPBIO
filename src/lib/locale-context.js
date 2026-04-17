"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — LOCALE CONTEXT
   ═══════════════════════════════════════════════════════════════
   Detects locale from <html lang>, derives text direction (LTR/RTL)
   for ar/he/fa/ur, exposes a stable hook consumed by components.
   Sets <html dir> imperatively so CSS logical properties reflect.
   ═══════════════════════════════════════════════════════════════ */

import { createContext, useContext, useEffect, useState, useMemo } from "react";

const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

const LocaleContext = createContext({ locale: "es", dir: "ltr" });

export function LocaleProvider({ initialLocale = "es", children }) {
  const [locale, setLocale] = useState(initialLocale);
  const dir = RTL_LOCALES.has(locale.split("-")[0]) ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    const detected = document.documentElement.lang || initialLocale;
    setLocale(detected);
  }, [initialLocale]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dir = dir;
  }, [dir]);

  const value = useMemo(() => ({ locale, dir, setLocale, isRTL: dir === "rtl" }), [locale, dir]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
