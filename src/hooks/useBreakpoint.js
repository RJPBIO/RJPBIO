"use client";
/* ═══════════════════════════════════════════════════════════════
   useBreakpoint — responsive tier detection
   ═══════════════════════════════════════════════════════════════
   Devuelve uno de: "mobile" | "tablet" | "desktop".
   Implementado con matchMedia para evitar listeners de resize.
   SSR-safe: arranca en "mobile" y sincroniza al montar.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

const TABLET_MIN = 720;
const DESKTOP_MIN = 1080;

function detect() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "mobile";
  if (window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches) return "desktop";
  if (window.matchMedia(`(min-width: ${TABLET_MIN}px)`).matches) return "tablet";
  return "mobile";
}

export function useBreakpoint() {
  const [bp, setBp] = useState("mobile");

  useEffect(() => {
    setBp(detect());
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mqTablet = window.matchMedia(`(min-width: ${TABLET_MIN}px)`);
    const mqDesktop = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const onChange = () => setBp(detect());
    mqTablet.addEventListener?.("change", onChange);
    mqDesktop.addEventListener?.("change", onChange);
    return () => {
      mqTablet.removeEventListener?.("change", onChange);
      mqDesktop.removeEventListener?.("change", onChange);
    };
  }, []);

  return bp;
}

export const BREAKPOINTS = { TABLET_MIN, DESKTOP_MIN };
