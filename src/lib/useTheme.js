"use client";
import { useEffect } from "react";

/**
 * useTheme — Syncs neural state to CSS variables via data attributes.
 * The entire app reacts to brain state through CSS custom properties
 * defined in globals.css under [data-state="..."] and [data-theme="..."].
 *
 * Usage: useTheme(brain.systemState, isDark);
 */
export function useTheme(brainState, isDark) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-state", brainState || "functional");
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [brainState, isDark]);
}
