"use client";

/* BookDemoTrigger — tiny client button that dispatches `bio-demo:open`.
   Use anywhere a marketing surface wants a one-click demo ask without
   sending the visitor to /demo. The drawer itself is mounted once in
   the root layout. */

export default function BookDemoTrigger({ label, className = "bi-nav-cta-ghost", children, style, ariaLabel }) {
  const open = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("bio-demo:open"));
  };
  return (
    <button type="button" onClick={open} className={className} aria-label={ariaLabel || label} style={style}>
      {children || label}
    </button>
  );
}
