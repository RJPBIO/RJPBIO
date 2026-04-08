"use client";
import { useEffect } from "react";

/**
 * useTheme — Syncs neural state to CSS variables via data attributes.
 * Drop this in any component and the entire app reacts to brain state.
 * 
 * Usage: useTheme(brain.systemState, isDark);
 * 
 * CSS reads: [data-state="optimal"] { --bio-sa: #059669; }
 *            [data-theme="dark"] { --bio-bg: #0A0D14; }
 */
export function useTheme(brainState, isDark) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-state", brainState || "functional");
    root.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [brainState, isDark]);
}
