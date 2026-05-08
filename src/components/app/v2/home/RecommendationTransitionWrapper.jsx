"use client";
/* ═══════════════════════════════════════════════════════════════
   RecommendationTransitionWrapper — Phase Polish-Tier-1 Gap-3
   ═══════════════════════════════════════════════════════════════
   Smooth spring fade-out + content-swap + fade-in cuando la
   recommendation primary id cambia (ej. user picks mood → engine
   recompute → diferente protocol). Reduces "jarring swap" perceived
   por crítico premium en Critical User Simulation 60D.

   Pattern reuse:
   · Linear/Vercel spring physics — cubic-bezier(0.32, 0.72, 0, 1)
     (Apple Magic curve, alias `easing.spring` en tokens v2).
   · Apple Health detail transitions — opacity + small translateY.

   Mecánica:
   · Tracks transitionKey prop. Cuando cambia y NO es el primer
     mount, dispara: opacity 1→0 (180ms) → swap displayed → 1 (220ms).
   · `displayed` es el children rendered (snapshot) durante fade-out
     para evitar mid-fade content jump. Cuando termina fade-out,
     swap a los nuevos children + fade-in.
   · Reduced motion: instant swap, sin animation (a11y).
   · Si transitionKey === undefined, behaviour idempotente (no
     transitions, render direct).

   API:
     <RecommendationTransitionWrapper transitionKey={protocolId}>
       <RecommendationCard ... />
     </RecommendationTransitionWrapper>
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { easing } from "../tokens";

const FADE_OUT_MS = 180;
const FADE_IN_MS = 220;

export default function RecommendationTransitionWrapper({
  transitionKey,
  children,
  testid,
}) {
  const reduce = useReducedMotion();
  const [displayed, setDisplayed] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const prevKeyRef = useRef(transitionKey);
  const swapTimer = useRef(null);
  const settleTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  useEffect(() => {
    const isFirstMount = prevKeyRef.current === undefined && transitionKey !== undefined && displayed === children;
    const sameKey = transitionKey === prevKeyRef.current;

    if (sameKey || transitionKey === undefined || isFirstMount) {
      // Sin cambio de key real — refrescar children sin animation
      // (handles parent re-render con nueva referencia children pero
      // misma recommendation primary id).
      setDisplayed(children);
      prevKeyRef.current = transitionKey;
      return;
    }

    if (reduce) {
      // a11y: prefers-reduced-motion → instant swap.
      setDisplayed(children);
      prevKeyRef.current = transitionKey;
      return;
    }

    // Transition path: fade-out → swap → fade-in.
    setTransitioning(true);
    if (swapTimer.current) clearTimeout(swapTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    swapTimer.current = setTimeout(() => {
      setDisplayed(children);
      prevKeyRef.current = transitionKey;
      // Pequeño beat antes del fade-in para que React commit el
      // displayed swap; sin esto el fade-in arranca con contenido stale.
      settleTimer.current = setTimeout(() => {
        setTransitioning(false);
      }, 16);
    }, FADE_OUT_MS);
  }, [transitionKey, children, reduce, displayed]);

  const transitionStyle = reduce
    ? "none"
    : `opacity ${transitioning ? FADE_OUT_MS : FADE_IN_MS}ms ${easing.spring}, transform ${transitioning ? FADE_OUT_MS : FADE_IN_MS}ms ${easing.spring}`;

  return (
    <div
      data-v2-recommendation-transition
      data-transitioning={transitioning ? "true" : "false"}
      data-testid={testid || "recommendation-transition"}
      style={{
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? "translateY(8px)" : "translateY(0)",
        transition: transitionStyle,
        willChange: reduce ? "auto" : "opacity, transform",
      }}
    >
      {displayed}
    </div>
  );
}
