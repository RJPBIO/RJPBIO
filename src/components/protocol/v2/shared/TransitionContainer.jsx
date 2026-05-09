"use client";
/* ═══════════════════════════════════════════════════════════════
   TransitionContainer — SP-B-1 Capa 4
   ───────────────────────────────────────────────────────────────
   Cinematic Phase Transitions wrapper with 5 elementos coordinated.
   Foundation reusable para hero flagship redesigns Opción B.

   Decisión arquitectónica (D-A approved): OVERLAY strategy.
   PrimitiveSwitcher en ProtocolPlayer mantiene su `key` original
   (forces remount lifecycle preservado para primitives existing).
   TransitionContainer renderea overlay POR ENCIMA del swap natural
   con particles burst + opacity envelope cuando phase change detected.

   5 elementos coordinated cada inter-phase (600ms total):
     (a) Particles burst (Capa 1 particle system)
     (b) Color shift smooth — handled por primitives via getCyanForPhase
     (c) Eyebrow morph — handled por ScientificEyebrowMorph component
     (d) Audio crossfade — invoked via onAudioCrossfadeRequest callback
     (e) Haptic single soft pulse — hapticProtocolSignature(id, 'phase_shift')

   State machine: idle → outgoing → midpoint → incoming → idle
     - outgoing (0-300ms): primitive fades to 0.3 opacity, particles fade in
     - midpoint (300ms): haptic marker + audio crossfade trigger
     - incoming (450ms): primitive fades back to 1.0
     - idle (600ms): particles fade out, transition complete

   Reduced motion: instant swap, fires haptic + audio markers but skips
   visual envelope (compliance prefers-reduced-motion).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState, useRef, useCallback } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { hapticProtocolSignature } from "@/lib/audio";
import { createParticleSystem } from "@/lib/animations/particleSystem";

const TRANSITION_DURATION_MS = 600;
const MIDPOINT_MS = TRANSITION_DURATION_MS / 2;
const INCOMING_MS = TRANSITION_DURATION_MS * 0.75;

const STATES = Object.freeze({
  IDLE: "idle",
  OUTGOING: "outgoing",
  MIDPOINT: "midpoint",
  INCOMING: "incoming",
});

/**
 * @param {object} props
 * @param {number} props.protocolId — id catalog para hapticProtocolSignature
 * @param {number} props.fromPhaseIdx — phase actual (preserved entre renders)
 * @param {number} props.toPhaseIdx — phase target (cuando cambia, transition arranca)
 * @param {()=>void} [props.onTransitionComplete]
 * @param {(from:number,to:number)=>void} [props.onAudioCrossfadeRequest]
 * @param {React.ReactNode} props.children — primitive actual (ej. PrimitiveSwitcher)
 */
export default function TransitionContainer({
  protocolId,
  fromPhaseIdx,
  toPhaseIdx,
  onTransitionComplete,
  onAudioCrossfadeRequest,
  children,
}) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState(STATES.IDLE);
  const canvasRef = useRef(null);
  const particleSystemRef = useRef(null);
  const lastFromRef = useRef(fromPhaseIdx);
  const lastToRef = useRef(toPhaseIdx);
  const onTransitionCompleteRef = useRef(onTransitionComplete);
  const onAudioCrossfadeRequestRef = useRef(onAudioCrossfadeRequest);
  useEffect(() => { onTransitionCompleteRef.current = onTransitionComplete; }, [onTransitionComplete]);
  useEffect(() => { onAudioCrossfadeRequestRef.current = onAudioCrossfadeRequest; }, [onAudioCrossfadeRequest]);

  const stopParticles = useCallback(() => {
    if (particleSystemRef.current) {
      try { particleSystemRef.current.stop(); } catch { /* noop */ }
      particleSystemRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Skip si no hubo cambio real de phase.
    if (fromPhaseIdx === toPhaseIdx) {
      setState(STATES.IDLE);
      return undefined;
    }
    // Skip si fromPhaseIdx no fue setado todavía (initial mount).
    if (typeof fromPhaseIdx !== "number" || typeof toPhaseIdx !== "number") {
      return undefined;
    }
    // Dedup: same transition pair → skip.
    if (lastFromRef.current === fromPhaseIdx && lastToRef.current === toPhaseIdx && state !== STATES.IDLE) {
      return undefined;
    }
    lastFromRef.current = fromPhaseIdx;
    lastToRef.current = toPhaseIdx;

    if (reduceMotion) {
      // Instant swap. Fire haptic + audio markers sin visual envelope.
      try {
        hapticProtocolSignature(protocolId, "phase_shift", { reducedMotion: true });
      } catch { /* noop */ }
      try {
        if (onAudioCrossfadeRequestRef.current) {
          onAudioCrossfadeRequestRef.current(fromPhaseIdx, toPhaseIdx);
        }
      } catch { /* noop */ }
      setState(STATES.IDLE);
      try {
        if (onTransitionCompleteRef.current) onTransitionCompleteRef.current();
      } catch { /* noop */ }
      return undefined;
    }

    // Visual envelope path.
    setState(STATES.OUTGOING);

    // Initialize particle burst (overlay above primitive swap).
    if (canvasRef.current && !particleSystemRef.current) {
      try {
        particleSystemRef.current = createParticleSystem({
          canvas: canvasRef.current,
          reducedMotion: false,
        });
        if (particleSystemRef.current) {
          particleSystemRef.current.setPhase("exhale", 0.5); // burst outward
          particleSystemRef.current.start();
        }
      } catch { /* noop */ }
    }

    // Audio crossfade trigger early (gain ramp 600ms parallel to visual).
    try {
      if (onAudioCrossfadeRequestRef.current) {
        onAudioCrossfadeRequestRef.current(fromPhaseIdx, toPhaseIdx);
      }
    } catch { /* noop */ }

    const midTimer = setTimeout(() => {
      setState(STATES.MIDPOINT);
      try {
        hapticProtocolSignature(protocolId, "phase_shift", { reducedMotion: false });
      } catch { /* noop */ }
    }, MIDPOINT_MS);

    const inTimer = setTimeout(() => {
      setState(STATES.INCOMING);
    }, INCOMING_MS);

    const completeTimer = setTimeout(() => {
      setState(STATES.IDLE);
      stopParticles();
      try {
        if (onTransitionCompleteRef.current) onTransitionCompleteRef.current();
      } catch { /* noop */ }
    }, TRANSITION_DURATION_MS);

    return () => {
      clearTimeout(midTimer);
      clearTimeout(inTimer);
      clearTimeout(completeTimer);
      stopParticles();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromPhaseIdx, toPhaseIdx, protocolId, reduceMotion]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => stopParticles();
  }, [stopParticles]);

  const showOverlay = state !== STATES.IDLE && !reduceMotion;
  const childOpacity = state === STATES.OUTGOING ? 0.3 : 1;
  const overlayOpacity = state === STATES.MIDPOINT ? 0.8 : (state === STATES.IDLE ? 0 : 0.4);

  return (
    <div
      data-v2-transition-container
      data-testid="transition-container"
      data-state={state}
      data-from-phase={fromPhaseIdx ?? ""}
      data-to-phase={toPhaseIdx ?? ""}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {showOverlay && (
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          aria-hidden="true"
          data-testid="transition-canvas"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 10,
            opacity: overlayOpacity,
            transition: "opacity 200ms cubic-bezier(0.32, 0.72, 0, 1)",
            width: "100%",
            height: "100%",
          }}
        />
      )}
      <div
        data-testid="transition-children-wrap"
        style={{
          opacity: childOpacity,
          transition: reduceMotion ? "none" : "opacity 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const __internals = {
  TRANSITION_DURATION_MS,
  MIDPOINT_MS,
  INCOMING_MS,
  STATES,
};
