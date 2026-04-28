"use client";
/* ═══════════════════════════════════════════════════════════════
   IGNITION BURST — el momento-firma al completar una sesión
   ═══════════════════════════════════════════════════════════════
   El nombre del producto es IGNICIÓN. Completar una sesión debe
   VERSE como ignición: chispa central → anillos emanando →
   partículas radiando (distribución golden-angle, nunca random) →
   flash de lattice DNA → wordmark monumental con RGB split → fade.

   Contrato:
   - Duración: ~1.6s (respeta `reducedMotion`: entonces 0.4s fade).
   - Paleta: emerald primario + phosphor cyan + ignition gold +
     neural violet. La marca aparece en el momento-firma.
   - z-index = flash (por encima de todo contenido de app).
   - Pasa `onDone` para que el padre avance a PostSession.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bioSignal, brand, z } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";

const PARTICLE_COUNT = 21;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export default function IgnitionBurst({ show, onDone, accent }) {
  const reduced = useReducedMotion();
  const spark = bioSignal.ignition;
  const signal = accent || bioSignal.phosphorCyan;
  const violet = bioSignal.neuralViolet;
  const emerald = brand.primary;

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, reduced ? 420 : 1600);
    return () => clearTimeout(t);
  }, [show, onDone, reduced]);

  // Golden-angle particle distribution — structured, never random.
  const particles = useMemo(() => {
    const palette = [spark, emerald, signal, violet];
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = i * GOLDEN_ANGLE;
      const dist = 140 + (i / PARTICLE_COUNT) * 180;
      return {
        id: i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 2 + (i % 4),
        delay: 0.08 + (i % 5) * 0.035,
        color: palette[i % palette.length],
      };
    });
  }, [spark, emerald, signal, violet]);

  // Lattice plus-marks — brand DNA flash layer.
  const lattice = useMemo(() => {
    const marks = [];
    const cols = 6;
    const rows = 9;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        marks.push({ id: `${c}-${r}`, x: (c + 0.5) / cols, y: (r + 0.5) / rows });
      }
    }
    return marks;
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: z.flash,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `radial-gradient(circle at center, ${emerald}22 0%, ${signal}14 35%, ${bioSignal.deepField}00 70%)`,
          }}
        >
          {reduced ? (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${spark}, ${emerald}, transparent)`,
                filter: "blur(2px)",
              }}
            />
          ) : (
            <>
              {/* Lattice flash — brand DNA cinemática */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1, 1.1] }}
                transition={{ duration: 1.1, times: [0, 0.35, 1], ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 100 150" preserveAspectRatio="xMidYMid slice">
                  {lattice.map((m) => (
                    <path
                      key={m.id}
                      d={`M${m.x * 100 - 0.6} ${m.y * 150} L${m.x * 100 + 0.6} ${m.y * 150} M${m.x * 100} ${m.y * 150 - 0.6} L${m.x * 100} ${m.y * 150 + 0.6}`}
                      stroke={signal}
                      strokeWidth="0.18"
                      opacity="0.55"
                    />
                  ))}
                </svg>
              </motion.div>

              {/* Scanline overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.25, 0] }}
                transition={{ duration: 1.2, times: [0, 0.3, 1] }}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `repeating-linear-gradient(0deg, rgba(16,185,129,0.06) 0px, rgba(16,185,129,0.06) 1px, transparent 1px, transparent 3px)`,
                  pointerEvents: "none",
                }}
              />

              <div style={{ position: "relative", width: 0, height: 0 }}>
                {/* Chispa central — destello que colapsa y explota */}
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 1.2, 0.9, 1], opacity: [1, 1, 0.9, 0] }}
                  transition={{ duration: 1.4, times: [0, 0.22, 0.5, 1], ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute",
                    left: -60,
                    top: -60,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${spark} 0%, ${emerald} 40%, ${signal} 65%, transparent 75%)`,
                    filter: "blur(3px)",
                    boxShadow: `0 0 100px ${spark}, 0 0 200px ${emerald}99`,
                  }}
                />

                {/* Anillos de onda — 4 escalonados con emerald principal */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={`ring-${i}`}
                    initial={{ scale: 0, opacity: 0.85 }}
                    animate={{ scale: 5.5 + i * 1.4, opacity: 0 }}
                    transition={{ duration: 1.4, delay: i * 0.11, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: "absolute",
                      left: -60,
                      top: -60,
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      border: `2px solid ${[spark, emerald, signal, violet][i]}`,
                      boxShadow: `0 0 28px ${[spark, emerald, signal, violet][i]}`,
                    }}
                  />
                ))}

                {/* Anillo conic gradient — signature sofisticado */}
                <motion.div
                  initial={{ scale: 0, opacity: 0.9, rotate: 0 }}
                  animate={{ scale: 3.5, opacity: 0, rotate: 180 }}
                  transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute",
                    left: -80,
                    top: -80,
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background: `conic-gradient(from 0deg, ${emerald}, ${signal}, ${spark}, ${violet}, ${emerald})`,
                    maskImage: "radial-gradient(circle, transparent 64%, black 66%, black 72%, transparent 74%)",
                    WebkitMaskImage: "radial-gradient(circle, transparent 64%, black 66%, black 72%, transparent 74%)",
                  }}
                />

                {/* Partículas golden-angle — 21 puntos estructurados */}
                {particles.map((p) => (
                  <motion.div
                    key={`p-${p.id}`}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{ x: p.x, y: p.y, scale: [0, 1, 0.3], opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: "absolute",
                      left: -p.size / 2,
                      top: -p.size / 2,
                      width: p.size,
                      height: p.size,
                      borderRadius: "50%",
                      background: p.color,
                      boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
                    }}
                  />
                ))}

                {/* Wordmark monumental con RGB split (chromatic aberration) */}
                <div
                  style={{
                    position: "absolute",
                    left: "-50vw",
                    top: 70,
                    width: "100vw",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  {/* R channel — emerald shift */}
                  <motion.div
                    initial={{ opacity: 0, letterSpacing: "0.4em", x: 0 }}
                    animate={{ opacity: [0, 0.55, 0.55, 0], letterSpacing: ["0.4em", "0.55em", "0.6em", "0.8em"], x: [0, -2, -1, 0] }}
                    transition={{ duration: 1.4, times: [0, 0.28, 0.7, 1], delay: 0.2 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      fontSize: 28,
                      fontWeight: 900,
                      color: emerald,
                      textTransform: "uppercase",
                      mixBlendMode: "screen",
                    }}
                  >
                    Ignición
                  </motion.div>
                  {/* B channel — cyan shift */}
                  <motion.div
                    initial={{ opacity: 0, letterSpacing: "0.4em", x: 0 }}
                    animate={{ opacity: [0, 0.55, 0.55, 0], letterSpacing: ["0.4em", "0.55em", "0.6em", "0.8em"], x: [0, 2, 1, 0] }}
                    transition={{ duration: 1.4, times: [0, 0.28, 0.7, 1], delay: 0.2 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      fontSize: 28,
                      fontWeight: 900,
                      color: signal,
                      textTransform: "uppercase",
                      mixBlendMode: "screen",
                    }}
                  >
                    Ignición
                  </motion.div>
                  {/* Main channel */}
                  <motion.div
                    initial={{ opacity: 0, letterSpacing: "0.4em" }}
                    animate={{ opacity: [0, 1, 1, 0], letterSpacing: ["0.4em", "0.55em", "0.6em", "0.8em"] }}
                    transition={{ duration: 1.4, times: [0, 0.28, 0.7, 1], delay: 0.2 }}
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: "#F0FDF4",
                      textTransform: "uppercase",
                      textShadow: `0 0 20px ${spark}, 0 0 40px ${emerald}`,
                    }}
                  >
                    Ignición
                  </motion.div>
                </div>

              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
