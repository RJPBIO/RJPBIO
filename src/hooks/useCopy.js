"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/* Copy-to-clipboard hook with graceful fallback for insecure contexts
   and short-lived "copied" feedback state. */
export function useCopy({ resetMs = 2000 } = {}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = useCallback(async (text) => {
    if (text == null) return false;
    const value = String(text);
    setError(null);
    const schedule = () => {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        schedule();
        return true;
      }
    } catch {}

    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.insetBlockStart = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) { schedule(); return true; }
    } catch (e) {
      setError(e);
    }
    setError(new Error("clipboard-unavailable"));
    return false;
  }, [resetMs]);

  return { copy, copied, error };
}
