"use client";
/* ═══════════════════════════════════════════════════════════════
   NSDR — Non-Sleep Deep Rest (Yoga Nidra)
   Kjaer et al. 2002 · Datta et al. 2017
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";

const NSDR_SCRIPT = [
  { at: 0, text: "Acuéstate boca arriba. Manos a los lados, palmas hacia arriba. Cierra los ojos suavemente." },
  { at: 15, text: "Toma tres respiraciones profundas. Deja que la espiración sea más larga que la inspiración." },
  { at: 45, text: "Sin controlar la respiración, deja que el cuerpo respire solo." },
  { at: 90, text: "Lleva la atención a la frente. Suaviza el ceño. Afloja los ojos detrás de los párpados." },
  { at: 120, text: "Relaja la mandíbula. Permite que la lengua caiga del paladar. La cara se ablanda." },
  { at: 150, text: "Baja la atención al cuello y los hombros. Suelta cualquier tensión residual." },
  { at: 180, text: "Brazo derecho. Codo derecho. Muñeca derecha. Mano derecha. Cada dedo." },
  { at: 220, text: "Brazo izquierdo. Codo. Muñeca. Mano izquierda. Cada dedo." },
  { at: 260, text: "Pecho. Cada costilla expandiéndose y contrayéndose sin esfuerzo." },
  { at: 300, text: "Abdomen. Diafragma. Centro del cuerpo." },
  { at: 330, text: "Cadera derecha. Muslo derecho. Rodilla. Pantorrilla. Pie derecho." },
  { at: 370, text: "Cadera izquierda. Muslo. Rodilla. Pantorrilla. Pie izquierdo." },
  { at: 420, text: "Todo el cuerpo. Observa el cuerpo completo respirando." },
  { at: 460, text: "Evoca un lugar de paz. No narres — solo permite que las sensaciones lleguen." },
  { at: 510, text: "Sigue respirando. Permanece aquí." },
  { at: 560, text: "Empieza a mover los dedos de manos y pies suavemente." },
  { at: 580, text: "Respira más profundo. Estira los brazos sobre la cabeza si quieres." },
  { at: 595, text: "Gira hacia un costado. Tómate tu tiempo. Abre los ojos cuando estés listo." },
];

const DURATIONS = [
  { minutes: 10, sec: 600, label: "10 min", desc: "Reset breve entre bloques" },
  { minutes: 20, sec: 1200, label: "20 min", desc: "Recuperación profunda (scaled script)" },
];

export default function NSDR({ show, isDark, onClose, onComplete }) {
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [selectedDuration, setSelectedDuration] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [currentLine, setCurrentLine] = useState("");
  const tickRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setSelectedDuration(null); setRunning(false); setElapsed(0); setDone(false); setCurrentLine("");
      if (tickRef.current) clearInterval(tickRef.current);
    }
  }, [show]);

  useEffect(() => {
    if (!running || !selectedDuration) return;
    tickRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const scale = selectedDuration.sec / 600;
        const scaledLines = NSDR_SCRIPT.map((l) => ({ ...l, at: Math.round(l.at * scale) }));
        const last = scaledLines.filter((l) => l.at <= next).slice(-1)[0];
        if (last) setCurrentLine(last.text);
        if (next >= selectedDuration.sec) {
          setRunning(false);
          setDone(true);
          clearInterval(tickRef.current);
          announce("Sesión NSDR completa.");
          onComplete?.({
            ts: Date.now(),
            technique: "nsdr",
            durationSec: selectedDuration.sec,
            startedAt: startedAtRef.current,
          });
        }
        return next;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running, selectedDuration, onComplete]);

  function start(duration) {
    setSelectedDuration(duration);
    setElapsed(0);
    setDone(false);
    startedAtRef.current = Date.now();
    setRunning(true);
    announce(`Iniciando NSDR ${duration.minutes} minutos.`);
  }

  function pause() { setRunning(false); if (tickRef.current) clearInterval(tickRef.current); }
  function resume() { setRunning(true); }

  if (!show) return null;

  const progressPct = selectedDuration ? (elapsed / selectedDuration.sec) * 100 : 0;

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ position: "fixed", inset: 0, background: bg, zIndex: 220, padding: 20, display: "flex", flexDirection: "column" }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 16 }}>
        <h2 id={titleId} style={{ fontSize: 16, fontWeight: font.weight.black, color: t1, margin: 0 }}>
          NSDR · Yoga Nidra
        </h2>
        <button
          onClick={onClose}
          aria-label="Cerrar NSDR"
          style={{ border: "none", background: "transparent", color: t2, padding: 8, cursor: "pointer" }}
        >
          <Icon name="close" size={20} color={t2} aria-hidden="true" />
        </button>
      </header>

      {!selectedDuration && !done && (
        <section aria-label="Seleccionar duración" style={{ flex: 1, maxInlineSize: 500, marginInline: "auto", inlineSize: "100%" }}>
          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 16, marginBlockEnd: 20 }}>
            <p style={{ color: t1, fontSize: 13, lineHeight: 1.6, margin: 0, marginBlockEnd: 8 }}>
              Descanso profundo sin sueño. Barrido corporal guiado que induce estado hipnagógico.
            </p>
            <p style={{ color: t3, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
              Kjaer et al. 2002: incremento de 65% en dopamina endógena (PET) durante yoga nidra. Sin inercia de sueño — diferente a una siesta.
            </p>
          </div>

          <div role="radiogroup" aria-label="Duración de la sesión" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DURATIONS.map((d) => (
              <button
                key={d.minutes}
                role="radio"
                aria-checked="false"
                onClick={() => start(d)}
                style={{
                  inlineSize: "100%",
                  paddingBlock: 18,
                  paddingInline: 20,
                  background: cd,
                  color: t1,
                  border: `1px solid ${bd}`,
                  borderRadius: 14,
                  textAlign: "start",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: font.weight.black, color: brand.primary, marginBlockEnd: 4 }}>{d.label}</div>
                <div style={{ fontSize: 11, color: t2 }}>{d.desc}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedDuration && !done && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24 }}>
          <div style={{ color: brand.primary, fontSize: 60, fontWeight: font.weight.black, lineHeight: 1 }}>
            {formatTime(Math.max(0, selectedDuration.sec - elapsed))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentLine}
              aria-live="polite"
              aria-atomic="true"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={reduced ? {} : { duration: 0.6 }}
              style={{ fontSize: 16, color: t1, textAlign: "center", maxInlineSize: 400, lineHeight: 1.5, minBlockSize: 80 }}
            >
              {currentLine}
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      {done && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: 20 }}>
          <div style={{ color: brand.primary, fontSize: 32, fontWeight: font.weight.black, marginBlockEnd: 12 }}>
            Completado
          </div>
          <p style={{ color: t2, fontSize: 13, maxInlineSize: 340, lineHeight: 1.6 }}>
            Tómate un momento antes de volver a pantallas. Los efectos cognitivos persisten 30-60 min.
          </p>
        </div>
      )}

      {selectedDuration && !done && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          aria-label={`Progreso: ${Math.round(elapsed / 60)} minutos de ${selectedDuration.minutes}`}
          style={{ blockSize: 4, background: bd, borderRadius: 2, overflow: "hidden", marginBlockBlock: 12, marginBlockEnd: 12 }}
        >
          <div style={{ blockSize: "100%", inlineSize: `${progressPct}%`, background: brand.primary, transition: "inline-size .4s" }} />
        </div>
      )}

      {selectedDuration && !done && (
        <div style={{ display: "flex", gap: 10 }}>
          {running ? (
            <button
              onClick={pause}
              aria-label="Pausar"
              style={{ flex: 1, paddingBlock: 14, background: "transparent", color: t1, border: `1px solid ${bd}`, borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Pausar
            </button>
          ) : (
            <button
              onClick={resume}
              aria-label="Continuar"
              style={{ flex: 1, paddingBlock: 14, background: brand.primary, color: "#fff", border: "none", borderRadius: 14, fontSize: 13, fontWeight: font.weight.black, cursor: "pointer" }}
            >
              Continuar
            </button>
          )}
        </div>
      )}

      {done && (
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{ paddingBlock: 14, background: brand.primary, color: "#fff", border: "none", borderRadius: 14, fontSize: 13, fontWeight: font.weight.black, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
        >
          Listo
        </button>
      )}
    </motion.div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
