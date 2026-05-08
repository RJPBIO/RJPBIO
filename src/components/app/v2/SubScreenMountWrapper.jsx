"use client";
/* ═══════════════════════════════════════════════════════════════
   SubScreenMountWrapper — Phase Polish-Sub-Screens-Motion Capa 2
   ═══════════════════════════════════════════════════════════════
   Reusable mount fade-in wrapper para sub-screens (DataV2, ProfileV2,
   sub-views Profile como EngineHealthView, NeuralSettings, etc).
   Pattern Apple sub-view emergence — opacity 0→1 + translateY 12→0
   con curva spring.

   Reduced-motion: instant mount sin animation (a11y).

   API:
     <SubScreenMountWrapper delay={0}>
       <SubViewContent />
     </SubScreenMountWrapper>
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { easing } from "./tokens";

const MOUNT_TRANSITION_MS = 320;

export default function SubScreenMountWrapper({ children, delay = 0, testid }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(reduce);

  useEffect(() => {
    if (reduce) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [reduce, delay]);

  return (
    <div
      data-v2-sub-screen-mount
      data-mounted={mounted ? "true" : "false"}
      data-testid={testid || "sub-screen-mount"}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: reduce
          ? "none"
          : `opacity ${MOUNT_TRANSITION_MS}ms ${easing.spring}, transform ${MOUNT_TRANSITION_MS}ms ${easing.spring}`,
        willChange: reduce ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
