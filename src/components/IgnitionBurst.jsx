"use client";
/* ═══════════════════════════════════════════════════════════════
   IGNITION BURST — el momento-firma al completar una sesión
   ═══════════════════════════════════════════════════════════════
   El nombre del producto es IGNICIÓN. Completar una sesión debe
   VERSE como ignición: chispa central → anillos emanando →
   partículas radiando → fade. Sustituye el flash plano anterior.

   Contrato:
   - Duración: ~1.6s (respeta `reducedMotion`: entonces 0.4s fade).
   - Usa colores bio-signal (phosphor cyan + ignition gold), NO el
     color del protocolo, porque es identidad de marca, no de sesión.
   - z-index = flash (por encima de todo contenido de app).
   - Pasa `onDone` para que el padre avance a PostSession.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bioSignal, z } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";

const PARTICLE_COUNT = 14;

export default function IgnitionBurst({ show, onDone, accent }) {
  const reduced = useReducedMotion();
  const spark = bioSignal.ignition;
  const signal = accent || bioSignal.phosphorCyan;
  const violet = bioSignal.neuralViolet;

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, reduced ? 420 : 1600);
    return () => clearTimeout(t);
  }, [show, onDone, reduced]);

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    const dist = 160 + Math.random() * 120;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size: 2 + Math.random() * 4,
      delay: 0.08 + Math.random() * 0.12,
      color: i % 3 === 0 ? spark : i % 3 === 1 ? signal : violet,
    };
  });

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
            background: `radial-gradient(circle at center, ${signal}18 0%, ${bioSignal.deepField}00 60%)`,
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
                background: `radial-gradient(circle, ${spark}, ${signal}, transparent)`,
                filter: "blur(2px)",
              }}
            />
          ) : (
            <div style={{ position: "relative", width: 0, height: 0 }}>
              {/* Chispa central — destello que colapsa y explota */}
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 1.1, 0.9, 1], opacity: [1, 1, 0.9, 0] }}
                transition={{ duration: 1.4, times: [0, 0.25, 0.5, 1], ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: -50,
                  top: -50,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${spark} 0%, ${signal} 35%, transparent 70%)`,
                  filter: "blur(3px)",
                  boxShadow: `0 0 80px ${spark}, 0 0 160px ${signal}`,
                }}
              />

              {/* Anillos de onda — 3 escalonados, emanación */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`ring-${i}`}
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 6 + i * 1.5, opacity: 0 }}
                  transition={{ duration: 1.4, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute",
                    left: -60,
                    top: -60,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    border: `2px solid ${i === 0 ? spark : i === 1 ? signal : violet}`,
                    boxShadow: `0 0 24px ${i === 0 ? spark : signal}`,
                  }}
                />
              ))}

              {/* Partículas radiando — 14 puntos que viajan hacia fuera */}
              {particles.map((p) => (
                <motion.div
                  key={`p-${p.id}`}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{ x: p.x, y: p.y, scale: [0, 1, 0.4], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
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

              {/* Etiqueta "IGNICIÓN" que aparece brevemente */}
              <motion.div
                initial={{ y: 40, opacity: 0, letterSpacing: "0.4em" }}
                animate={{ y: 60, opacity: [0, 1, 1, 0], letterSpacing: ["0.4em", "0.7em", "0.7em", "0.9em"] }}
                transition={{ duration: 1.4, times: [0, 0.3, 0.7, 1], delay: 0.18 }}
                style={{
                  position: "absolute",
                  left: "-50vw",
                  top: 0,
                  width: "100vw",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: spark,
                  textTransform: "uppercase",
                  textShadow: `0 0 16px ${spark}`,
                  pointerEvents: "none",
                }}
              >
                Ignición
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
