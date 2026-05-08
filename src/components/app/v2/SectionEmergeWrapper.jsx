"use client";
/* ═══════════════════════════════════════════════════════════════
   SectionEmergeWrapper — Phase Polish-Sub-Screens-Motion Capa 3
   ═══════════════════════════════════════════════════════════════
   IntersectionObserver-based fade-in cuando section enters viewport.
   Stagger delay opcional via staggerIndex (× 50ms) para sequential
   reveal en pages con muchos sections (ej. DataV2).

   Pattern reuse Linear scroll-trigger animations + Apple sub-view
   emergence. NO third-party lib — IntersectionObserver native.

   Reduced-motion: instant emerged sin scroll-trigger ni animation.

   Performance:
   · `observer.unobserve(element)` tras primera intersection (one-shot).
   · `willChange` solo durante animation (post-emerged se quita).
   · `threshold: 0.15 + rootMargin: -10%` requiere ~15% visible para fire.

   API:
     <SectionEmergeWrapper staggerIndex={0}>
       <SectionA />
     </SectionEmergeWrapper>
     <SectionEmergeWrapper staggerIndex={1}>
       <SectionB />
     </SectionEmergeWrapper>
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { easing } from "./tokens";

const EMERGE_TRANSITION_MS = 420;
const STAGGER_PER_INDEX_MS = 50;

export default function SectionEmergeWrapper({ children, staggerIndex = 0, testid }) {
  const reduce = useReducedMotion();
  const [emerged, setEmerged] = useState(reduce);
  const elementRef = useRef(null);

  useEffect(() => {
    if (reduce) {
      setEmerged(true);
      return;
    }
    const el = elementRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Defensive (SSR / older browsers): emerge inmediato cuando IO no available.
      setEmerged(true);
      return;
    }
    let staggerTimer = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          staggerTimer = setTimeout(() => setEmerged(true), Math.max(0, staggerIndex) * STAGGER_PER_INDEX_MS);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => {
      if (staggerTimer) clearTimeout(staggerTimer);
      observer.disconnect();
    };
  }, [reduce, staggerIndex]);

  return (
    <div
      ref={elementRef}
      data-v2-section-emerge
      data-emerged={emerged ? "true" : "false"}
      data-testid={testid || "section-emerge"}
      style={{
        opacity: emerged ? 1 : 0,
        transform: emerged ? "translateY(0)" : "translateY(16px)",
        transition: reduce
          ? "none"
          : `opacity ${EMERGE_TRANSITION_MS}ms ${easing.spring}, transform ${EMERGE_TRANSITION_MS}ms ${easing.spring}`,
        willChange: emerged || reduce ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
