"use client";
import { useEffect, useRef, useState } from "react";

/* PricingSectionNav — sticky pill-bar below the global header with
   scroll-spy. Only rendered on /pricing. Horizontally scrollable on
   narrow viewports. Click → smooth scroll (uses global scroll-padding
   + pricing-scoped scroll-margin). Respects prefers-reduced-motion. */
export default function PricingSectionNav({ items }) {
  const [active, setActive] = useState(items[0]?.id);
  const [visible, setVisible] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const targets = items
      .map((it) => document.getElementById(it.id))
      .filter(Boolean);
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visibles = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles[0]) setActive(visibles[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [items]);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = navRef.current?.querySelector(`[data-id="${active}"]`);
    if (el && navRef.current) {
      const nav = navRef.current;
      const elRect = el.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      if (elRect.left < navRect.left || elRect.right > navRect.right) {
        nav.scrollTo({
          left: el.offsetLeft - nav.clientWidth / 2 + el.clientWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [active]);

  return (
    <div
      className={`bi-pricing-nav${visible ? " is-visible" : ""}`}
      role="navigation"
      aria-label="Secciones de precios"
    >
      <div className="bi-pricing-nav-inner" ref={navRef}>
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            data-id={it.id}
            className={`bi-pricing-nav-item${active === it.id ? " is-active" : ""}`}
            aria-current={active === it.id ? "true" : undefined}
          >
            {it.label}
          </a>
        ))}
      </div>
    </div>
  );
}
