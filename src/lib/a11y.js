"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — A11y PRIMITIVES
   ═══════════════════════════════════════════════════════════════
   - useReducedMotion: respects prefers-reduced-motion, SSR-safe.
   - useFocusTrap: WAI-ARIA dialog focus trap (Tab/Shift+Tab/Escape).
   - onActivate: keyboard activation handler (Enter/Space) for divs
     that must stay as non-button (rare — prefer <button>).
   - KEY: named keyboard constants.
   - announce: aria-live polite announcer for screen readers.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, useCallback } from "react";

export const KEY = {
  ENTER: "Enter",
  SPACE: " ",
  ESC: "Escape",
  TAB: "Tab",
  UP: "ArrowUp",
  DOWN: "ArrowDown",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
};

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    try { mq.addEventListener("change", on); } catch { mq.addListener(on); }
    return () => { try { mq.removeEventListener("change", on); } catch { mq.removeListener(on); } };
  }, []);
  return reduced;
}

export function usePrefersColorScheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setDark(mq.matches);
    on();
    try { mq.addEventListener("change", on); } catch { mq.addListener(on); }
    return () => { try { mq.removeEventListener("change", on); } catch { mq.removeListener(on); } };
  }, []);
  return dark;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(",");

export function useFocusTrap(active, onEscape) {
  const ref = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    lastFocused.current = document.activeElement;

    const root = ref.current;
    if (!root) return;

    const focusables = () => Array.from(root.querySelectorAll(FOCUSABLE)).filter(
      (el) => !el.hasAttribute("inert") && el.offsetParent !== null
    );
    const first = focusables()[0];
    if (first) first.focus({ preventScroll: true });
    else root.setAttribute("tabindex", "-1"), root.focus({ preventScroll: true });

    function onKey(e) {
      if (e.key === KEY.ESC && onEscape) { e.stopPropagation(); onEscape(); return; }
      if (e.key !== KEY.TAB) return;
      const list = focusables();
      if (!list.length) { e.preventDefault(); return; }
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      try { lastFocused.current?.focus?.({ preventScroll: true }); } catch {}
    };
  }, [active, onEscape]);

  return ref;
}

export function onActivate(handler) {
  return (e) => {
    if (e.key === KEY.ENTER || e.key === KEY.SPACE) {
      e.preventDefault();
      handler(e);
    }
  };
}

export function announce(message, priority = "polite") {
  if (typeof document === "undefined" || !message) return;
  const id = priority === "assertive" ? "bi-live-assertive" : "bi-live-polite";
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement("div");
    node.id = id;
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", priority);
    node.setAttribute("aria-atomic", "true");
    Object.assign(node.style, {
      position: "absolute", width: "1px", height: "1px",
      padding: "0", margin: "-1px", overflow: "hidden",
      clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: "0",
    });
    document.body.appendChild(node);
  }
  node.textContent = "";
  requestAnimationFrame(() => { node.textContent = message; });
}

export function useAnnounce() {
  return useCallback(announce, []);
}

export const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function focusRing(color = "#059669") {
  return {
    outline: "none",
    boxShadow: `0 0 0 3px ${color}66, 0 0 0 5px ${color}26`,
  };
}
