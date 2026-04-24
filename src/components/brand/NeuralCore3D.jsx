"use client";
import { motion } from "framer-motion";
import { useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   NeuralCore3D — núcleo sensorial del orb de ignición

   Reemplaza el radial-gradient sólido por una cámara translúcida:
   — Glass sphere (backdrop-filter + borde + highlight sutil)
   — Lattice 3D: 22 motes en distribución de Fibonacci sobre una
     esfera, rotando en Y+X asíncrono → parallax multidimensional
   — Sinapsis: cada mote pulsa con fase independiente; combinado
     se percibe como una red neuronal disparando
   — Color teñido por el protocolo en ejecución (prop `color`)
   — Aura cónica rotando en el aro (energía protocolar)
   — Vignette interna que atenúa los motes detrás del texto central
     para no competir con el countdown

   Diseño: sustituye las 2 capas opacas previas (orb radial-gradient
   + halo interior). Se monta como hermano del resto de capas
   decorativas (beam, ripples, ignition flash, progress ring) que
   se preservan intactas.
   ═══════════════════════════════════════════════════════════════ */

function fibSphere(n) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push({
      x: Math.cos(theta) * r,
      y,
      z: Math.sin(theta) * r,
      phase: (i * 0.9) % (Math.PI * 2),
      dur: 1.6 + ((i * 7) % 13) / 10,
    });
  }
  return pts;
}

export default function NeuralCore3D({
  size = 260,
  color = "#22D3EE",
  state = "idle",
  breathScale = 1,
  isBreathing = false,
  reducedMotion = false,
}) {
  const nodes = useMemo(() => fibSphere(22), []);
  const R = size * 0.36;
  const moteSize = 6;
  const active = state === "running" || state === "paused";

  const sphereAnim = reducedMotion
    ? { scale: 1 }
    : isBreathing
      ? { scale: breathScale }
      : state === "idle"
        ? { scale: [1, 1.015, 1] }
        : active
          ? { scale: [1, 1.008, 1] }
          : { scale: 0.97 };

  const sphereTransition = isBreathing && !reducedMotion
    ? { type: "spring", stiffness: 30, damping: 20, mass: 1.2 }
    : { duration: state === "idle" ? 5 : 3.5, repeat: Infinity, ease: "easeInOut" };

  return (
    <>
      {/* ── Glass sphere (translúcido, no sólido) ─────────────── */}
      <motion.div
        aria-hidden
        animate={sphereAnim}
        transition={sphereTransition}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            `radial-gradient(circle at 50% 22%, rgba(255,255,255,0.09) 0%, rgba(10,19,14,0.14) 42%, rgba(6,8,16,0.30) 85%, rgba(4,6,16,0.42) 100%)`,
          backdropFilter: "blur(14px) saturate(160%)",
          WebkitBackdropFilter: "blur(14px) saturate(160%)",
          border: `1px solid ${color}44`,
          boxShadow:
            `0 30px 80px -24px ${color}55,` +
            `0 10px 30px -10px rgba(0,0,0,0.38),` +
            `inset 0 2px 0 0 rgba(255,255,255,0.12),` +
            `inset 0 -24px 50px -18px rgba(0,0,0,0.5),` +
            `inset 0 0 60px -10px ${color}22`,
          pointerEvents: "none",
          opacity: state === "paused" ? 0.78 : 1,
          transition: "opacity .4s ease, border-color .6s ease, box-shadow .6s ease",
        }}
      />

      {/* ── Aura cónica (energía protocolar rotando en el aro) ─── */}
      {!reducedMotion && (
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: active ? 14 : 18, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "50%",
            background: `conic-gradient(from 0deg, transparent 0%, ${color}40 10%, transparent 24%, transparent 52%, ${color}28 68%, transparent 84%)`,
            maskImage: "radial-gradient(circle, transparent 57%, black 60%, black 62%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 57%, black 60%, black 62%, transparent 65%)",
            pointerEvents: "none",
            opacity: state === "paused" ? 0.3 : 0.85,
            transition: "opacity .4s ease",
          }}
        />
      )}

      {/* ── Lattice neuronal 3D ──────────────────────────────────
          Contenedor con perspective + vignette radial que atenúa
          el centro (el countdown debe leerse limpio). El grupo
          interno rota en Y/X asíncrono → sensación multidimensional. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          perspective: `${size * 2}px`,
          pointerEvents: "none",
          maskImage: "radial-gradient(circle, transparent 0%, transparent 28%, rgba(0,0,0,0.35) 38%, black 55%, black 100%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 0%, transparent 28%, rgba(0,0,0,0.35) 38%, black 55%, black 100%)",
          opacity: state === "paused" ? 0.55 : 1,
          transition: "opacity .4s ease",
        }}
      >
        <motion.div
          animate={
            reducedMotion
              ? {}
              : {
                  rotateY: [0, 360],
                  rotateX: [0, 8, -8, 0],
                }
          }
          transition={{
            rotateY: { duration: state === "idle" ? 28 : 22, repeat: Infinity, ease: "linear" },
            rotateX: { duration: 36, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
          }}
        >
          {nodes.map((n, i) => {
            const cx = size / 2;
            const cy = size / 2;
            return (
              <motion.span
                key={i}
                aria-hidden
                animate={
                  reducedMotion
                    ? { opacity: 0.55 }
                    : {
                        scale: [1, 1.7, 1],
                        opacity: [0.35, 1, 0.35],
                      }
                }
                transition={
                  reducedMotion
                    ? undefined
                    : {
                        duration: n.dur,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: (n.phase / (Math.PI * 2)) * 5,
                      }
                }
                style={{
                  position: "absolute",
                  top: cy - moteSize / 2,
                  left: cx - moteSize / 2,
                  width: moteSize,
                  height: moteSize,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 10px ${color}cc, 0 0 3px #ffffff`,
                  transform: `translate3d(${n.x * R}px, ${n.y * R}px, ${n.z * R}px)`,
                  willChange: reducedMotion ? "auto" : "opacity, transform",
                }}
              />
            );
          })}
        </motion.div>
      </div>
    </>
  );
}
