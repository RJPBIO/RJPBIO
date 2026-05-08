"use client";
/* ═══════════════════════════════════════════════════════════════
   TabTransitionWrapper — Phase Polish-Sub-Screens-Motion Capa 1
   ═══════════════════════════════════════════════════════════════
   Spring fade-out + content-swap + fade-in cuando AppV2Root tab
   activo cambia (Hoy/Datos/Coach/Perfil). Pattern reuse 1:1 de
   RecommendationTransitionWrapper (Polish Tier 1) — mismo snapshot
   pattern y misma curva Apple Magic.

   Cierra gap motion lens identificado en Critical Sim 60D #3:
   sub-screens sin transitions vs HomeV2 polish-rich.

   Reduced motion: instant swap (a11y).

   API:
     <TabTransitionWrapper activeTab={tab}>
       {(displayedTab) => SCREENS[displayedTab]({...props})}
     </TabTransitionWrapper>
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { easing } from "./tokens";

const FADE_OUT_MS = 180;
const FADE_IN_MS = 220;

export default function TabTransitionWrapper({ activeTab, children, testid }) {
  const reduce = useReducedMotion();
  const [displayedTab, setDisplayedTab] = useState(activeTab);
  const [transitioning, setTransitioning] = useState(false);
  const prevTabRef = useRef(activeTab);
  const swapTimer = useRef(null);
  const settleTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  useEffect(() => {
    const sameTab = activeTab === prevTabRef.current;
    if (sameTab || activeTab === undefined) {
      prevTabRef.current = activeTab;
      return;
    }
    if (reduce) {
      setDisplayedTab(activeTab);
      prevTabRef.current = activeTab;
      return;
    }
    setTransitioning(true);
    if (swapTimer.current) clearTimeout(swapTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    swapTimer.current = setTimeout(() => {
      setDisplayedTab(activeTab);
      prevTabRef.current = activeTab;
      settleTimer.current = setTimeout(() => {
        setTransitioning(false);
      }, 16);
    }, FADE_OUT_MS);
  }, [activeTab, reduce]);

  const transitionStyle = reduce
    ? "none"
    : `opacity ${transitioning ? FADE_OUT_MS : FADE_IN_MS}ms ${easing.spring}, transform ${transitioning ? FADE_OUT_MS : FADE_IN_MS}ms ${easing.spring}`;

  return (
    <div
      data-v2-tab-transition
      data-transitioning={transitioning ? "true" : "false"}
      data-active-tab={displayedTab}
      data-testid={testid || "tab-transition"}
      style={{
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? "translateY(8px)" : "translateY(0)",
        transition: transitionStyle,
        willChange: reduce ? "auto" : "opacity, transform",
        minHeight: "100dvh",
      }}
    >
      {typeof children === "function" ? children(displayedTab) : children}
    </div>
  );
}
