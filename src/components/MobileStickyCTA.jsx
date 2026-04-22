"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/* MobileStickyCTA — appears at the bottom of marketing pages on small
   viewports once the user scrolls past the hero (~320px). Respects
   safe-area-inset-bottom and can be dismissed for the session. */
const DISMISS_KEY = "bi-mobile-cta-dismissed";

export default function MobileStickyCTA({ primaryHref, primaryLabel, secondaryHref, secondaryLabel }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch { setDismissed(false); }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      setVisible((window.scrollY || 0) > 320);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (dismissed) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <div
      className="bi-mobile-sticky-cta"
      data-visible={visible ? "true" : "false"}
      role="region"
      aria-label={primaryLabel}
    >
      <Link href={secondaryHref} className="bi-mobile-sticky-cta-secondary">
        {secondaryLabel}
      </Link>
      <Link href={primaryHref} className="bi-mobile-sticky-cta-primary">
        {primaryLabel}
        <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" style={{ marginInlineStart: 6 }}>
          <path d="M1.75 6h7.8M6.9 2.75L9.75 6 6.9 9.25" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar CTA"
        className="bi-mobile-sticky-cta-close"
      >×</button>
    </div>
  );
}
