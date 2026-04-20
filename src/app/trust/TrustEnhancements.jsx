"use client";

import { useEffect, useState } from "react";

export default function TrustEnhancements({ copyToast, topLabel }) {
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const chips = Array.from(document.querySelectorAll("[data-trust-chip]"));
    const sections = chips
      .map((c) => {
        const href = c.getAttribute("href") || "";
        if (!href.startsWith("#")) return null;
        return document.getElementById(href.slice(1));
      })
      .filter(Boolean);

    const setActive = (id) => {
      chips.forEach((c) => {
        const active = c.getAttribute("href") === `#${id}`;
        c.classList.toggle("is-active", active);
        if (active) {
          try {
            c.scrollIntoView({ block: "nearest", inline: "center" });
          } catch (_) {}
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-120px 0px -80% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));

    const onScroll = () => {
      const h = document.documentElement;
      const top = h.scrollTop || document.body.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(1, top / max) : 0);
      setShowTop(top > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onClick = (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;
      const text = btn.getAttribute("data-copy");
      if (!text) return;
      const done = () => {
        setToast(true);
        window.clearTimeout(onClick._t);
        onClick._t = window.setTimeout(() => setToast(false), 1800);
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {});
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          done();
        } catch (_) {}
        document.body.removeChild(ta);
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      window.clearTimeout(onClick._t);
    };
  }, []);

  return (
    <>
      <div
        className="bi-trust-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />
      <button
        type="button"
        className={`bi-trust-top${showTop ? " is-visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={topLabel}
      >
        <span aria-hidden="true">↑</span>
      </button>
      <div
        className={`bi-trust-toast${toast ? " is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {copyToast}
      </div>
    </>
  );
}
