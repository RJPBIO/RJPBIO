"use client";
/* ═══════════════════════════════════════════════════════════════
   BreathOrbExtended — Phase 4 SP2
   Wrapper sobre BreathOrb que sincroniza audio + haptic con cada
   transición de fase del cycle (in → h1 → ex → h2 → repeat).
   Owns the internal cycle timer; calls playBreathTick + hapticBreath
   exactamente una vez por transición.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import BreathOrb from "../../../BreathOrb";
import { playBreathTick, hapticBreath } from "../../../../lib/audio";

const COLOR_BY_INTENT = {
  calma: "#059669",
  enfoque: "#22D3EE",
  energia: "#F59E0B",
  reset: "#8B5CF6",
};

const PHASE_LABEL = { in: "Inhala", h1: "Sostén", ex: "Exhala", h2: "Sostén" };

export default function BreathOrbExtended({
  cadence = { in: 4, h1: 0, ex: 6, h2: 0 },
  intent = "calma",
  enabled = true,
  cycleCountTarget = 0,
  audioEnabled = true,
  hapticEnabled = true,
  onCycleComplete,
  onComplete,
  size = 220,
}) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseSec, setPhaseSec] = useState(0);
  const [cycle, setCycle] = useState(0);
  const lastFiredRef = useRef("");

  const phases = ["in", "h1", "ex", "h2"].filter((p) => (cadence[p] || 0) > 0);
  const currentPhase = phases[phaseIdx % phases.length] || "in";
  const phaseLen = cadence[currentPhase] || 0;

  // Refs evitan re-mounting del interval cada vez que el padre re-renderiza
  // y entrega nuevas function identities para los callbacks.
  const phasesRef = useRef(phases);
  const cadenceRef = useRef(cadence);
  const cycleTargetRef = useRef(cycleCountTarget);
  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { phasesRef.current = phases; cadenceRef.current = cadence; }, [phases, cadence]);
  useEffect(() => { cycleTargetRef.current = cycleCountTarget; }, [cycleCountTarget]);
  useEffect(() => { onCycleCompleteRef.current = onCycleComplete; }, [onCycleComplete]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!enabled || phasesRef.current.length === 0) return undefined;
    const interval = setInterval(() => {
      setPhaseSec((prev) => {
        const ph = phasesRef.current;
        if (ph.length === 0) return prev;
        // Read current phase length from ref (may have changed via parent props).
        // Use a function-form update on phaseIdx so we read the latest value.
        let advanced = false;
        setPhaseIdx((idx) => {
          const cur = ph[idx % ph.length];
          const len = cadenceRef.current[cur] || 0;
          if (prev + 1 >= len) {
            advanced = true;
            const next = (idx + 1) % ph.length;
            if (next === 0) {
              setCycle((c) => {
                const nc = c + 1;
                const cb = onCycleCompleteRef.current;
                if (typeof cb === "function") cb(nc);
                const target = cycleTargetRef.current;
                const done = onCompleteRef.current;
                if (target > 0 && nc >= target && typeof done === "function") done();
                return nc;
              });
            }
            return next;
          }
          return idx;
        });
        return advanced ? 0 : prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const key = `${cycle}-${phaseIdx}`;
    if (lastFiredRef.current === key) return;
    lastFiredRef.current = key;
    if (audioEnabled) {
      try { playBreathTick(currentPhase, intent); } catch { /* noop */ }
    }
    if (hapticEnabled) {
      try { hapticBreath(currentPhase); } catch { /* noop */ }
    }
  }, [phaseIdx, cycle, currentPhase, intent, audioEnabled, hapticEnabled, enabled]);

  if (!enabled) return null;

  const remaining = Math.max(0, phaseLen - phaseSec);
  const breathScale = currentPhase === "in" ? 1 + (phaseSec / Math.max(1, phaseLen)) * 0.45
    : currentPhase === "ex" ? 1.45 - (phaseSec / Math.max(1, phaseLen)) * 0.45
    : currentPhase === "h1" ? 1.45 : 1;

  return (
    <BreathOrb
      type="breath"
      color={COLOR_BY_INTENT[intent] || "#22D3EE"}
      breathScale={breathScale}
      breathLabel={PHASE_LABEL[currentPhase]}
      breathCount={remaining}
      active
      size={size}
    />
  );
}
