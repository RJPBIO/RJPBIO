"use client";
/* ═══════════════════════════════════════════════════════════════
   Phase 7 SP-B-5 — VagalCouplingReveal
   ───────────────────────────────────────────────────────────────
   Hero cinematic reveal at top of Reset1CompletionCard.

   Visualiza el cambio de estado del sistema nervioso autónomo
   pre→post sesión. NO mide HRV pre (no captured antes del
   protocolo) — usa lenguaje subjetivo "Tu sistema vagal ahora"
   y muestra una animación que captura el patrón de coherencia
   parasimpática post-sesión.

   Animation timeline (5s total, reducedMotion = static coherent):
     Phase A — chaotic (0-1500ms):
       12 particles dispersed con velocidad random, ring pulse
       fast (80bpm sympathetic), color cyan-deep desaturated.
       Representa el estado pre-protocolo "sympathetic baseline".

     Phase B — converge (1500-3500ms):
       Particles easing cubic-bezier toward orbital positions
       en circle r=70. Velocity damping. Pulse rate slows
       80→30bpm. Color lerp deep→warm.

     Phase C — coherent (3500-5000ms):
       Particles en orbital pattern coherent, slow tangential
       motion. Pulse 6bpm (vagal coherence Lehrer-Vaschillo).
       Color cyan-warm full saturation.

   Constraint compliance:
     - Cero emojis. SVG/Canvas2D solo.
     - Cero touch interaction durante reveal.
     - Reduced motion: render frame final coherente directo.
     - Sin volumen: visual silencioso.

   Mecanismo visual:
     - Pulse rate maps to vagal tone (80bpm fast = sympathetic
       activación; 6bpm slow = parasympathetic coherence).
     - Particle coherence maps to autonomic balance.
     - Color saturation maps to vagal afferent strength.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/a11y";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const SIZE = 240;
const ORBITAL_RADIUS = 72;
const PARTICLE_COUNT_FULL = 12;
const PARTICLE_COUNT_LOW = 6;

const PHASE_A_END = 1500;
const PHASE_B_END = 3500;
const PHASE_C_END = 5000;

// Apple Magic curve (used across PWA brand).
function cubicBezier(t, p1x, p1y, p2x, p2y) {
  // Approximation: parametric cubic-bezier via Newton solving on x.
  // For simplicity we use a closed-form ease similar to (0.32, 0.72, 0, 1).
  // Slow-start, fast finish.
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // ease-out-quart approximation matches user perception of cubic-bezier(0.32,0.72,0,1).
  return 1 - Math.pow(1 - t, 4);
}

function detectParticleCount() {
  if (typeof navigator === "undefined") return PARTICLE_COUNT_FULL;
  if (typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4) {
    return PARTICLE_COUNT_LOW;
  }
  return PARTICLE_COUNT_FULL;
}

// Lerp between two hex colors.
function lerpColor(c1, c2, t) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
function hexToRgb(hex) {
  const m = /^#?([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex);
  if (!m) return { r: 34, g: 211, b: 238 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

const COLOR_CHAOTIC = "#0E7490";  // cyan-deep desaturated
const COLOR_COHERENT = "#06B6D4"; // cyan-warm vibrant

function createParticle(idx, total, w, h) {
  // Random initial chaotic position dispersed in canvas.
  const angle = Math.random() * Math.PI * 2;
  const r = (Math.random() * 0.4 + 0.3) * (w / 2);
  // Target orbital position (phase C).
  const orbAngle = total > 0 ? (idx / total) * Math.PI * 2 : 0;
  const targetX = w / 2 + Math.cos(orbAngle) * ORBITAL_RADIUS;
  const targetY = h / 2 + Math.sin(orbAngle) * ORBITAL_RADIUS;
  return {
    sx: w / 2 + Math.cos(angle) * r,
    sy: h / 2 + Math.sin(angle) * r,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    x: 0,
    y: 0,
    targetX,
    targetY,
    orbAngle,
    radius: 1.5 + Math.random() * 1.0,
    baseOpacity: 0.5 + Math.random() * 0.2,
  };
}

/**
 * @param {object} props
 * @param {number|null} [props.hrvDelta] — optional HRV delta in ms (post protocol).
 * @param {()=>void} [props.onAnimationComplete] — fired at PHASE_C_END.
 * @param {string} [props.testId="vagal-coupling-reveal"]
 * @param {boolean} [props.autoPlay=true] — start animation on mount.
 */
export default function VagalCouplingReveal({
  hrvDelta = null,
  onAnimationComplete,
  testId = "vagal-coupling-reveal",
  autoPlay = true,
}) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const particlesRef = useRef([]);
  const [phase, setPhase] = useState("chaotic"); // chaotic | converge | coherent
  const [captionVisible, setCaptionVisible] = useState(false);

  const onCompleteRef = useRef(onAnimationComplete);
  useEffect(() => { onCompleteRef.current = onAnimationComplete; }, [onAnimationComplete]);

  useEffect(() => {
    if (!autoPlay) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    canvas.width = SIZE;
    canvas.height = SIZE;

    let ctx = null;
    try {
      ctx = canvas.getContext("2d");
    } catch (e) {
      // jsdom no implementa Canvas2D — render static fallback (CSS-only).
      setPhase("coherent");
      setCaptionVisible(true);
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
      return undefined;
    }
    if (!ctx) return undefined;

    if (reduceMotion) {
      // Render frame coherente final estático (sin animación).
      const total = detectParticleCount();
      const particles = [];
      for (let i = 0; i < total; i++) {
        const orbAngle = (i / total) * Math.PI * 2;
        particles.push({
          x: SIZE / 2 + Math.cos(orbAngle) * ORBITAL_RADIUS,
          y: SIZE / 2 + Math.sin(orbAngle) * ORBITAL_RADIUS,
          radius: 2.0,
          baseOpacity: 0.6,
        });
      }
      ctx.clearRect(0, 0, SIZE, SIZE);
      // Pulse ring static.
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, ORBITAL_RADIUS + 12, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(6,182,212,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Particles.
      const rgb = hexToRgb(COLOR_COHERENT);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.baseOpacity})`;
        ctx.fill();
      }
      setPhase("coherent");
      setCaptionVisible(true);
      try {
        if (typeof onCompleteRef.current === "function") onCompleteRef.current();
      } catch { /* noop */ }
      return undefined;
    }

    // Initialize particles.
    const total = detectParticleCount();
    const particles = Array.from({ length: total }, (_, i) =>
      createParticle(i, total, SIZE, SIZE),
    );
    particlesRef.current = particles;

    let cancelled = false;
    startRef.current = performance.now();

    const tick = (now) => {
      if (cancelled) return;
      const elapsed = now - startRef.current;
      let currentPhase;
      if (elapsed < PHASE_A_END) currentPhase = "chaotic";
      else if (elapsed < PHASE_B_END) currentPhase = "converge";
      else currentPhase = "coherent";

      setPhase((prev) => (prev !== currentPhase ? currentPhase : prev));

      // Pulse rate maps from 80bpm (chaotic) → 6bpm (coherent).
      // bpm to Hz: bpm/60. Pulse phase = elapsed_ms * (Hz / 1000) * 2π.
      let bpm;
      if (elapsed < PHASE_A_END) {
        bpm = 80; // sympathetic baseline
      } else if (elapsed < PHASE_B_END) {
        const t = (elapsed - PHASE_A_END) / (PHASE_B_END - PHASE_A_END);
        const eased = cubicBezier(t);
        bpm = 80 - eased * (80 - 6);
      } else {
        bpm = 6; // vagal coherence
      }
      const pulsePhase = (elapsed / 1000) * (bpm / 60) * Math.PI * 2;
      const pulseScale = 1.0 + Math.sin(pulsePhase) * 0.18;

      // Color lerp.
      let colorT = 0;
      if (elapsed >= PHASE_A_END && elapsed < PHASE_B_END) {
        colorT = (elapsed - PHASE_A_END) / (PHASE_B_END - PHASE_A_END);
      } else if (elapsed >= PHASE_B_END) {
        colorT = 1;
      }
      const particleColor = lerpColor(COLOR_CHAOTIC, COLOR_COHERENT, colorT);
      const rgb = hexToRgb(colorT === 1 ? COLOR_COHERENT : (colorT === 0 ? COLOR_CHAOTIC : COLOR_COHERENT));

      ctx.clearRect(0, 0, SIZE, SIZE);

      // Pulse ring (reflects bpm).
      const ringR = ORBITAL_RADIUS + 12 + pulseScale * 4;
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = particleColor.replace("rgb", "rgba").replace(")", `, ${0.20 + colorT * 0.25})`);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Update + draw particles.
      for (const p of particles) {
        if (elapsed < PHASE_A_END) {
          // Chaotic — random walk damped.
          p.vx += (Math.random() - 0.5) * 0.12;
          p.vy += (Math.random() - 0.5) * 0.12;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.x = p.x === 0 ? p.sx : p.x + p.vx;
          p.y = p.y === 0 ? p.sy : p.y + p.vy;
          // Bounce off edges softly.
          if (p.x < 30) p.vx += 0.5;
          if (p.x > SIZE - 30) p.vx -= 0.5;
          if (p.y < 30) p.vy += 0.5;
          if (p.y > SIZE - 30) p.vy -= 0.5;
        } else if (elapsed < PHASE_B_END) {
          // Converge — easing toward target.
          const t = (elapsed - PHASE_A_END) / (PHASE_B_END - PHASE_A_END);
          const eased = cubicBezier(t);
          const fromX = p.x === 0 ? p.sx : p.x;
          const fromY = p.y === 0 ? p.sy : p.y;
          // Lerp from current toward orbital target.
          p.x = fromX + (p.targetX - fromX) * eased * 0.08; // soft easing per frame
          p.y = fromY + (p.targetY - fromY) * eased * 0.08;
          // Snap close enough.
          if (Math.abs(p.x - p.targetX) < 0.5) p.x = p.targetX;
          if (Math.abs(p.y - p.targetY) < 0.5) p.y = p.targetY;
        } else {
          // Coherent — slow orbital tangential motion at 6bpm.
          const orbitSpeed = 0.0008;
          p.orbAngle += orbitSpeed * 16; // ~16ms per frame target
          p.targetX = SIZE / 2 + Math.cos(p.orbAngle) * ORBITAL_RADIUS;
          p.targetY = SIZE / 2 + Math.sin(p.orbAngle) * ORBITAL_RADIUS;
          p.x = p.targetX;
          p.y = p.targetY;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.baseOpacity})`;
        ctx.fill();
      }

      // Caption visibility — fade in around 3.8s.
      if (elapsed >= 3800 && !captionVisible) {
        setCaptionVisible(true);
      }

      if (elapsed >= PHASE_C_END) {
        // Animation complete — keep coherent loop running.
        try {
          if (typeof onCompleteRef.current === "function") onCompleteRef.current();
          onCompleteRef.current = null; // single-fire
        } catch { /* noop */ }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, reduceMotion]);

  const hrvText = (typeof hrvDelta === "number" && Number.isFinite(hrvDelta) && Math.abs(hrvDelta) >= 0.5)
    ? `${hrvDelta > 0 ? "+" : "−"}${Math.abs(Math.round(hrvDelta * 10) / 10)} ms HRV`
    : null;

  return (
    <div
      data-v2-vagal-coupling-reveal
      data-testid={testId}
      data-phase={phase}
      role="img"
      aria-label="Visualización de coherencia vagal post-sesión"
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.s12,
        marginBlockEnd: spacing.s24,
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid={`${testId}-canvas`}
        aria-hidden="true"
        style={{
          width: SIZE,
          height: SIZE,
          display: "block",
        }}
      />
      <div
        data-testid={`${testId}-caption`}
        style={{
          opacity: captionVisible ? 1 : 0,
          transform: captionVisible ? "translateY(0)" : "translateY(6px)",
          transition: reduceMotion ? "none" : "all 360ms cubic-bezier(0.32, 0.72, 0, 1)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: spacing.s8,
        }}
      >
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 11,
            fontWeight: typography.weight.medium,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: COLOR_COHERENT,
            opacity: 0.85,
          }}
        >
          Coherencia Vagal
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: 17,
            fontWeight: typography.weight.light,
            letterSpacing: "-0.01em",
            color: colors.text.strong,
            lineHeight: 1.3,
          }}
        >
          Tu sistema vagal ahora.
        </p>
        {hrvText && (
          <span
            data-testid={`${testId}-hrv`}
            style={{
              fontFamily: typography.familyMono,
              fontSize: 12,
              letterSpacing: "0.02em",
              color: colors.text.secondary,
              opacity: 0.85,
            }}
          >
            {hrvText}
          </span>
        )}
      </div>
    </div>
  );
}
