"use client";

/* PrintButton — calls window.print() so procurement teams can save
   the pricing page as a PDF one-pager. Paired with the @media print
   rules in globals.css that strip chrome and leave the pricing core. */
export default function PrintButton({ label }) {
  return (
    <button
      type="button"
      onClick={() => { if (typeof window !== "undefined") window.print(); }}
      className="bi-video-cta"
      style={{ background: "var(--bi-surface)" }}
      aria-label={label}
    >
      <span className="play" aria-hidden>↧</span>
      {label}
    </button>
  );
}
