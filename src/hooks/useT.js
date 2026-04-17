"use client";
import { useEffect, useState } from "react";
import { t, getLocale, setLocale, onLocaleChange } from "../lib/i18n";

export function useT() {
  const [locale, setLoc] = useState(() => getLocale());
  useEffect(() => onLocaleChange(setLoc), []);
  return { t, locale, setLocale };
}
