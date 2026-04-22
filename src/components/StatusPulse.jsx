"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* StatusPulse — live operational signal. Pulls /api/health every 60s,
   renders a pulsing cyan dot + terse label. Green ≈ operational, amber
   degraded, red outage. Cheap, no external deps. */

const POLL_MS = 60_000;

export default function StatusPulse({ labelOk, labelDegraded, labelOutage, labelChecking }) {
  const [state, setState] = useState("checking");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let timer;
    const check = async () => {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 4500);
        const r = await fetch("/api/health", { cache: "no-store", signal: ctrl.signal });
        clearTimeout(to);
        if (!mounted.current) return;
        if (r.ok) {
          const body = await r.json().catch(() => null);
          setState(body?.status === "ok" ? "ok" : "degraded");
        } else {
          setState("outage");
        }
      } catch {
        if (mounted.current) setState("outage");
      }
    };
    check();
    timer = setInterval(check, POLL_MS);
    return () => { mounted.current = false; clearInterval(timer); };
  }, []);

  const palette = {
    ok:        { dot: "#22D3EE", halo: "rgba(34,211,238,0.55)", label: labelOk        || "All systems operational" },
    degraded:  { dot: "#F59E0B", halo: "rgba(245,158,11,0.55)",  label: labelDegraded  || "Partial degradation" },
    outage:    { dot: "#EF4444", halo: "rgba(239,68,68,0.55)",   label: labelOutage    || "Service incident" },
    checking:  { dot: "#94A3B8", halo: "rgba(148,163,184,0.45)", label: labelChecking  || "Checking…" },
  }[state];

  return (
    <Link
      href="/status"
      aria-label={palette.label}
      className="bi-status-pulse"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        textDecoration: "none",
        color: "inherit",
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid color-mix(in srgb, ${palette.dot} 28%, var(--bi-border))`,
        background: `color-mix(in srgb, ${palette.dot} 6%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="bi-status-pulse-dot"
        style={{
          position: "relative",
          inlineSize: 8,
          blockSize: 8,
          borderRadius: 999,
          background: palette.dot,
          boxShadow: `0 0 10px ${palette.halo}`,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 999,
            boxShadow: `0 0 0 2px ${palette.halo}`,
            animation: state === "ok" ? "biPulseRing 2.4s ease-out infinite" : "none",
            opacity: state === "ok" ? 1 : 0,
          }}
        />
      </span>
      <span>{palette.label}</span>
    </Link>
  );
}
