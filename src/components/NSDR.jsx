"use client";
/* ═══════════════════════════════════════════════════════════════
   NSDR — Non-Sleep Deep Rest (Yoga Nidra)
   Kjaer et al. 2002 · Datta et al. 2017
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveTheme, withAlpha } from "../lib/theme";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";

/* ── Identidad NSDR — violet/indigo (rest threshold) ───────────── */
const VIOLET = "#A78BFA";
const VIOLET_DEEP = "#7C3AED";
const AMBER = "#F59E0B";

const NSDR_SCRIPT = [
  { at: 0,   text: "Acuéstate boca arriba. Manos a los lados, palmas hacia arriba. Cierra los ojos suavemente.", region: "settle" },
  { at: 15,  text: "Toma tres respiraciones profundas. Deja que la espiración sea más larga que la inspiración.", region: "breath" },
  { at: 45,  text: "Sin controlar la respiración, deja que el cuerpo respire solo.", region: "breath" },
  { at: 90,  text: "Lleva la atención a la frente. Suaviza el ceño. Afloja los ojos detrás de los párpados.", region: "head" },
  { at: 120, text: "Relaja la mandíbula. Permite que la lengua caiga del paladar. La cara se ablanda.", region: "head" },
  { at: 150, text: "Baja la atención al cuello y los hombros. Suelta cualquier tensión residual.", region: "neck" },
  { at: 180, text: "Brazo derecho. Codo derecho. Muñeca derecha. Mano derecha. Cada dedo.", region: "armR" },
  { at: 220, text: "Brazo izquierdo. Codo. Muñeca. Mano izquierda. Cada dedo.", region: "armL" },
  { at: 260, text: "Pecho. Cada costilla expandiéndose y contrayéndose sin esfuerzo.", region: "chest" },
  { at: 300, text: "Abdomen. Diafragma. Centro del cuerpo.", region: "abdomen" },
  { at: 330, text: "Cadera derecha. Muslo derecho. Rodilla. Pantorrilla. Pie derecho.", region: "legR" },
  { at: 370, text: "Cadera izquierda. Muslo. Rodilla. Pantorrilla. Pie izquierdo.", region: "legL" },
  { at: 420, text: "Todo el cuerpo. Observa el cuerpo completo respirando.", region: "whole" },
  { at: 460, text: "Evoca un lugar de paz. No narres — solo permite que las sensaciones lleguen.", region: "drift" },
  { at: 510, text: "Sigue respirando. Permanece aquí.", region: "drift" },
  { at: 560, text: "Empieza a mover los dedos de manos y pies suavemente.", region: "wake" },
  { at: 580, text: "Respira más profundo. Estira los brazos sobre la cabeza si quieres.", region: "wake" },
  { at: 595, text: "Gira hacia un costado. Tómate tu tiempo. Abre los ojos cuando estés listo.", region: "wake" },
];

const DURATIONS = [
  { minutes: 10, sec: 600,  label: "10", desc: "Reset breve entre bloques cognitivos" },
  { minutes: 20, sec: 1200, label: "20", desc: "Recuperación profunda completa" },
];

/* ── Glyph signature: dome (cuerpo horizontal bajo cúpula) ─────── */
function DomeGlyph({ size = 18, color = VIOLET, reduced }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <motion.path
        d="M 2.5 13 Q 9 4.5 15.5 13"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        animate={reduced ? {} : { opacity: [0.55, 1, 0.55] }}
        transition={reduced ? {} : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <line x1="2" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
      <motion.circle
        cx="9" cy="13" r="1.4"
        fill={color}
        animate={reduced ? {} : { opacity: [0.7, 1, 0.7] }}
        transition={reduced ? {} : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

/* ── Body Rail: silueta humana vertical con regiones activables ── */
function BodyRail({ activeRegion, reduced }) {
  const isWhole = activeRegion === "whole" || activeRegion === "drift";
  const isWake = activeRegion === "wake";
  const accent = isWake ? AMBER : VIOLET;

  const fillFor = (r) => {
    if (isWhole || isWake) return withAlpha(accent, 55);
    if (activeRegion === r) return withAlpha(accent, 70);
    return withAlpha(accent, 6);
  };
  const strokeFor = (r) => {
    if (isWhole || isWake) return withAlpha(accent, 60);
    if (activeRegion === r) return accent;
    return withAlpha(accent, 22);
  };
  const pulse = (r) =>
    !reduced && activeRegion === r
      ? { animate: { opacity: [0.7, 1, 0.7] }, transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }
      : {};

  return (
    <svg width="44" height="200" viewBox="0 0 44 200" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id="nsdrBodyAura" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      {(isWhole || isWake) && (
        <motion.ellipse
          cx="22" cy="100" rx="26" ry="105"
          fill="url(#nsdrBodyAura)"
          animate={reduced ? {} : { opacity: [0.35, 0.7, 0.35] }}
          transition={reduced ? {} : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* Cabeza */}
      <motion.circle
        cx="22" cy="14" r="9.5"
        fill={fillFor("head")} stroke={strokeFor("head")} strokeWidth="1"
        {...pulse("head")}
      />
      {/* Cuello */}
      <motion.rect
        x="18.5" y="23.5" width="7" height="6" rx="1.6"
        fill={fillFor("neck")} stroke={strokeFor("neck")} strokeWidth="1"
        {...pulse("neck")}
      />
      {/* Pecho/torso */}
      <motion.path
        d="M 9 32 Q 7 36 11 40 L 11 70 Q 13 76 17 78 L 27 78 Q 31 76 33 70 L 33 40 Q 37 36 35 32 Z"
        fill={fillFor("chest")} stroke={strokeFor("chest")} strokeWidth="1"
        {...pulse("chest")}
      />
      {/* Brazo derecho (lado izquierdo del SVG) */}
      <motion.path
        d="M 9 36 Q 5 50 4 80 L 3 110 L 6 110 L 7.5 88 Q 9 60 12 38 Z"
        fill={fillFor("armR")} stroke={strokeFor("armR")} strokeWidth="1"
        {...pulse("armR")}
      />
      {/* Brazo izquierdo (lado derecho del SVG) */}
      <motion.path
        d="M 35 36 Q 39 50 40 80 L 41 110 L 38 110 L 36.5 88 Q 35 60 32 38 Z"
        fill={fillFor("armL")} stroke={strokeFor("armL")} strokeWidth="1"
        {...pulse("armL")}
      />
      {/* Abdomen */}
      <motion.path
        d="M 13 78 L 31 78 L 31 108 Q 31 114 27 116 L 17 116 Q 13 114 13 108 Z"
        fill={fillFor("abdomen")} stroke={strokeFor("abdomen")} strokeWidth="1"
        {...pulse("abdomen")}
      />
      {/* Pierna derecha */}
      <motion.path
        d="M 14 116 L 21.5 116 L 21 184 Q 20.5 188 17.5 188 L 14.5 188 Q 12.5 187 12.5 183 L 13.5 130 Z"
        fill={fillFor("legR")} stroke={strokeFor("legR")} strokeWidth="1"
        {...pulse("legR")}
      />
      {/* Pierna izquierda */}
      <motion.path
        d="M 22.5 116 L 30 116 L 30.5 130 L 31.5 183 Q 31.5 187 29.5 188 L 26.5 188 Q 23.5 188 23 184 Z"
        fill={fillFor("legL")} stroke={strokeFor("legL")} strokeWidth="1"
        {...pulse("legL")}
      />
    </svg>
  );
}

/* ── Breathing Capsule: ancla visual respiratoria ──────────────── */
function BreathingCapsule({ reduced, accent = VIOLET, paused = false }) {
  const breathDur = paused ? 0 : 14;
  return (
    <div style={{ position: "relative", inlineSize: 168, blockSize: 244, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        animate={reduced || paused ? {} : { scale: [1, 1.06, 1], opacity: [0.25, 0.5, 0.25] }}
        transition={reduced || paused ? {} : { duration: breathDur, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inlineSize: 168, blockSize: 244, borderRadius: 84,
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${withAlpha(accent, 40)} 0%, transparent 70%)`,
          filter: "blur(22px)",
        }}
      />
      <motion.div
        animate={reduced || paused ? {} : { scale: [1, 1.04, 1] }}
        transition={reduced || paused ? {} : { duration: breathDur, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inlineSize: 116, blockSize: 184, borderRadius: 58,
          background: `linear-gradient(180deg, ${withAlpha(accent, 32)} 0%, ${withAlpha(accent, 16)} 50%, ${withAlpha(accent, 6)} 100%)`,
          border: `0.5px solid ${withAlpha(accent, 45)}`,
          boxShadow: `0 0 60px ${withAlpha(accent, 38)}, inset 0 1.5px 0 ${withAlpha("#fff", 12)}, inset 0 -32px 60px ${withAlpha(accent, 20)}`,
          backdropFilter: "blur(8px)",
        }}
      />
      <motion.div
        animate={reduced || paused ? {} : { scale: [1, 1.1, 1], opacity: [0.65, 1, 0.65] }}
        transition={reduced || paused ? {} : { duration: breathDur, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inlineSize: 50, blockSize: 84, borderRadius: 25,
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${withAlpha(accent, 70)} 0%, ${withAlpha(accent, 28)} 60%, transparent 100%)`,
        }}
      />
    </div>
  );
}

export default function NSDR({ show, isDark, onClose, onComplete }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [selectedDuration, setSelectedDuration] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [currentLine, setCurrentLine] = useState("");
  const [currentRegion, setCurrentRegion] = useState("settle");
  const tickRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setSelectedDuration(null); setRunning(false); setElapsed(0); setDone(false);
      setCurrentLine(""); setCurrentRegion("settle");
      if (tickRef.current) clearInterval(tickRef.current);
    }
  }, [show]);

  useEffect(() => {
    if (!running || !selectedDuration) return;
    tickRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        const scale = selectedDuration.sec / 600;
        const last = NSDR_SCRIPT
          .map((l) => ({ ...l, atScaled: Math.round(l.at * scale) }))
          .filter((l) => l.atScaled <= next)
          .slice(-1)[0];
        if (last) { setCurrentLine(last.text); setCurrentRegion(last.region); }
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
    setCurrentLine(NSDR_SCRIPT[0].text);
    setCurrentRegion("settle");
    startedAtRef.current = Date.now();
    setRunning(true);
    announce(`Iniciando NSDR ${duration.minutes} minutos.`);
  }

  function pause() { setRunning(false); if (tickRef.current) clearInterval(tickRef.current); }
  function resume() { setRunning(true); }

  if (!show) return null;

  const progressPct = selectedDuration ? (elapsed / selectedDuration.sec) * 100 : 0;
  const remainingSec = selectedDuration ? Math.max(0, selectedDuration.sec - elapsed) : 0;
  const isWakeStage = currentRegion === "wake";
  const stageAccent = isWakeStage ? AMBER : VIOLET;

  /* ── Background ambient: violet wash, deep indigo base ─────── */
  const bgGradient = useMemo(
    () => `
      radial-gradient(ellipse 70% 60% at 50% 0%, ${withAlpha(VIOLET, 14)} 0%, transparent 55%),
      radial-gradient(ellipse 90% 60% at 50% 100%, ${withAlpha(isWakeStage ? AMBER : VIOLET_DEEP, 10)} 0%, transparent 60%),
      linear-gradient(180deg, #0c0a1a 0%, #08080A 100%)
    `,
    [isWakeStage]
  );

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, background: bgGradient, zIndex: 220,
        padding: "20px 20px 24px", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ─── Header — dome glyph como signature (no bullet pulse) ─── */}
      <header style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBlockEnd: selectedDuration ? 8 : 22,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
            <DomeGlyph size={16} color={stageAccent} reduced={reduced} />
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 9, fontWeight: 500,
              color: stageAccent, letterSpacing: "0.30em", textTransform: "uppercase",
              textShadow: `0 0 6px ${withAlpha(stageAccent, 50)}`,
            }}>
              NSDR · YOGA NIDRA · KJAER 2002
            </span>
          </span>
          <h2 id={titleId} style={{
            fontSize: 19, fontWeight: 300, color: t1,
            letterSpacing: -0.4, lineHeight: 1.1, margin: 0,
          }}>
            {!selectedDuration && !done && "Descanso profundo"}
            {selectedDuration && !done && (isWakeStage ? "Despertando" : "En descanso")}
            {done && "Sesión completa"}
          </h2>
        </div>

        <button
          onClick={onClose}
          aria-label="Cerrar NSDR"
          style={{
            inlineSize: 38, blockSize: 38, flexShrink: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(180deg, ${withAlpha(stageAccent, 18)} 0%, ${withAlpha(stageAccent, 6)} 100%)`,
            border: `0.5px solid ${withAlpha(stageAccent, 38)}`,
            borderRadius: "50%",
            color: stageAccent,
            cursor: "pointer",
            boxShadow: `inset 0 1px 0 ${withAlpha("#fff", 8)}`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13"><path d="M3 3 L10 10 M10 3 L3 10" stroke={stageAccent} strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </header>

      {/* ═══ SETUP STATE ═══ */}
      {!selectedDuration && !done && (
        <section
          aria-label="Seleccionar duración NSDR"
          style={{ flex: 1, maxInlineSize: 520, marginInline: "auto", inlineSize: "100%", display: "flex", flexDirection: "column" }}
        >
          {/* Hero card con capsule preview */}
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? {} : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              background: `
                linear-gradient(180deg, ${withAlpha(VIOLET, 8)} 0%, ${withAlpha(VIOLET_DEEP, 4)} 100%),
                linear-gradient(180deg, rgba(20,18,32,0.72) 0%, rgba(14,12,22,0.62) 100%)
              `,
              border: `0.5px solid ${withAlpha(VIOLET, 24)}`,
              borderRadius: 22,
              padding: "20px 18px",
              marginBlockEnd: 16,
              overflow: "hidden",
              boxShadow: `0 1px 0 ${withAlpha("#fff", 6)} inset, 0 24px 60px ${withAlpha("#000", 50)}, 0 0 50px ${withAlpha(VIOLET, 10)}`,
              backdropFilter: "blur(14px)",
              minBlockSize: 156,
            }}
          >
            {/* Decorative breathing orb at right */}
            <div style={{ position: "absolute", inset: "-24px -48px -24px auto", inlineSize: 170, opacity: 0.85 }} aria-hidden="true">
              <motion.div
                animate={reduced ? {} : { scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
                transition={reduced ? {} : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  inlineSize: "100%", blockSize: "100%",
                  background: `radial-gradient(ellipse 50% 50% at 60% 50%, ${withAlpha(VIOLET, 50)} 0%, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />
            </div>

            <div style={{ position: "relative", maxInlineSize: 280 }}>
              <p style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 9, fontWeight: 500, color: withAlpha(VIOLET, 85),
                letterSpacing: "0.24em", textTransform: "uppercase",
                margin: 0, marginBlockEnd: 10,
              }}>
                Hipnagógico · sin inercia
              </p>
              <p style={{ color: t1, fontSize: 14, lineHeight: 1.55, fontWeight: 400, margin: 0, marginBlockEnd: 12 }}>
                Barrido corporal guiado que induce el umbral entre vigilia y sueño sin perder consciencia.
              </p>
              <p style={{
                color: t3, fontSize: 11, lineHeight: 1.55, margin: 0,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                letterSpacing: 0.1,
              }}>
                +65% dopamina endógena · PET imaging
              </p>
            </div>
          </motion.div>

          {/* Selector de duración — dos tiles horizontales con dome glyph */}
          <div role="radiogroup" aria-label="Duración" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DURATIONS.map((d, i) => (
              <motion.button
                key={d.minutes}
                role="radio"
                aria-checked="false"
                onClick={() => start(d)}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduced ? {} : { duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={reduced ? {} : { y: -1 }}
                style={{
                  inlineSize: "100%",
                  display: "flex", alignItems: "center", gap: 16,
                  paddingBlock: 16, paddingInline: 18,
                  background: `
                    linear-gradient(180deg, rgba(20,18,32,0.72) 0%, rgba(14,12,22,0.58) 100%)
                  `,
                  color: t1,
                  border: `0.5px solid ${withAlpha(VIOLET, 22)}`,
                  borderRadius: 18,
                  textAlign: "start",
                  cursor: "pointer",
                  backdropFilter: "blur(12px)",
                  boxShadow: `0 1px 0 ${withAlpha("#fff", 5)} inset, 0 12px 32px ${withAlpha("#000", 40)}`,
                }}
              >
                {/* IconTile dimensional con dome glyph */}
                <div style={{
                  position: "relative", flexShrink: 0,
                  inlineSize: 46, blockSize: 46,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(180deg, ${withAlpha(VIOLET, 22)} 0%, ${withAlpha(VIOLET_DEEP, 10)} 100%)`,
                  border: `0.5px solid ${withAlpha(VIOLET, 38)}`,
                  borderRadius: 13,
                  boxShadow: `inset 0 1px 0 ${withAlpha("#fff", 14)}, inset 0 -7px 14px ${withAlpha(VIOLET, 14)}, 0 3px 12px ${withAlpha(VIOLET, 18)}`,
                }}>
                  <DomeGlyph size={22} color={VIOLET} reduced={reduced} />
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 21, fontWeight: 500, color: t1,
                      letterSpacing: -0.6, fontVariantNumeric: "tabular-nums", lineHeight: 1,
                    }}>
                      {d.label}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 9, fontWeight: 500, color: withAlpha(VIOLET, 90),
                      letterSpacing: "0.24em", textTransform: "uppercase",
                    }}>
                      MIN
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: t2, letterSpacing: -0.05, lineHeight: 1.4 }}>
                    {d.desc}
                  </span>
                </div>

                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M5 3 L9 7 L5 11" stroke={withAlpha(VIOLET, 70)} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ RUNNING STATE ═══ */}
      {selectedDuration && !done && (
        <div style={{
          flex: 1, position: "relative",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 24, paddingBlockStart: 8,
        }}>
          {/* Body Rail flotante a la izquierda */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", insetInlineStart: 4, insetBlockStart: "50%",
              transform: "translateY(-50%)",
              opacity: 0.92,
            }}
          >
            <BodyRail activeRegion={currentRegion} reduced={reduced} />
          </div>

          {/* Capsule respiratoria — ancla central */}
          <BreathingCapsule reduced={reduced} accent={stageAccent} paused={!running} />

          {/* Narración */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentLine}
              aria-live="polite"
              aria-atomic="true"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={reduced ? {} : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: 15,
                color: t1,
                textAlign: "center",
                maxInlineSize: 380,
                marginInline: "auto",
                lineHeight: 1.6,
                minBlockSize: 80,
                fontWeight: 300,
                letterSpacing: -0.1,
                paddingInline: 12,
              }}
            >
              {currentLine}
            </motion.p>
          </AnimatePresence>

          {/* Countdown sutil */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontVariantNumeric: "tabular-nums",
          }}>
            <span style={{
              fontSize: 9, fontWeight: 500, color: withAlpha(stageAccent, 80),
              letterSpacing: "0.30em", textTransform: "uppercase",
            }}>
              Restante
            </span>
            <span style={{
              fontSize: 22, fontWeight: 400, color: t1,
              letterSpacing: -0.6,
            }}>
              {formatTime(remainingSec)}
            </span>
          </div>
        </div>
      )}

      {/* ═══ DONE STATE ═══ */}
      {done && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center", textAlign: "center",
          gap: 20, padding: 20,
        }}>
          {/* Sunrise glyph — amber dome con halo */}
          <div style={{ position: "relative", inlineSize: 120, blockSize: 120 }}>
            <motion.div
              animate={reduced ? {} : { scale: [1, 1.15, 1], opacity: [0.45, 0.85, 0.45] }}
              transition={reduced ? {} : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(circle, ${withAlpha(AMBER, 50)} 0%, transparent 70%)`,
                filter: "blur(18px)",
              }}
            />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <defs>
                  <radialGradient id="nsdrSunrise" cx="50%" cy="100%" r="80%">
                    <stop offset="0%" stopColor={AMBER} stopOpacity={0.75} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                  </radialGradient>
                </defs>
                <rect x="0" y="20" width="80" height="60" fill="url(#nsdrSunrise)" />
                <line x1="6" y1="62" x2="74" y2="62" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 14 62 Q 40 22 66 62" stroke={AMBER} strokeWidth="1.6" strokeLinecap="round" fill="none" />
                <circle cx="40" cy="62" r="2.2" fill={AMBER} />
              </svg>
            </div>
          </div>

          <div style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 9, fontWeight: 500, color: AMBER,
            letterSpacing: "0.30em", textTransform: "uppercase",
          }}>
            Recuperación cognitiva activa
          </div>
          <p style={{
            color: t1, fontSize: 17, fontWeight: 300, letterSpacing: -0.3,
            lineHeight: 1.5, maxInlineSize: 360, margin: 0,
          }}>
            Tómate un momento antes de volver a pantallas.
          </p>
          <p style={{
            color: t3, fontSize: 12, lineHeight: 1.6, maxInlineSize: 320, margin: 0,
            letterSpacing: -0.05,
          }}>
            Los efectos cognitivos (atención, memoria, aprendizaje motor) persisten 30–60 min.
          </p>
        </div>
      )}

      {/* ═══ Bottom: progress + controls ═══ */}
      {selectedDuration && !done && (
        <div style={{ marginBlockStart: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPct)}
            aria-label={`Progreso: ${Math.round(elapsed / 60)} de ${selectedDuration.minutes} minutos`}
            style={{
              position: "relative",
              blockSize: 3, borderRadius: 2,
              background: withAlpha(stageAccent, 10),
              overflow: "hidden",
              boxShadow: `inset 0 0 0 0.5px ${withAlpha(stageAccent, 18)}`,
            }}
          >
            <motion.div
              style={{
                blockSize: "100%",
                inlineSize: `${progressPct}%`,
                background: `linear-gradient(90deg, ${withAlpha(stageAccent, 70)} 0%, ${stageAccent} 100%)`,
                boxShadow: `0 0 12px ${withAlpha(stageAccent, 60)}`,
                transition: "inline-size .8s linear",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {running ? (
              <button
                onClick={pause}
                aria-label="Pausar"
                style={{
                  flex: 1, paddingBlock: 14,
                  background: `linear-gradient(180deg, rgba(20,18,32,0.72) 0%, rgba(14,12,22,0.58) 100%)`,
                  color: t1,
                  border: `0.5px solid ${withAlpha(stageAccent, 28)}`,
                  borderRadius: 14,
                  fontSize: 11, fontWeight: 600,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  letterSpacing: "0.24em", textTransform: "uppercase",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                }}
              >
                Pausar
              </button>
            ) : (
              <button
                onClick={resume}
                aria-label="Continuar"
                style={{
                  flex: 1, paddingBlock: 14,
                  background: `linear-gradient(180deg, ${withAlpha(stageAccent, 50)} 0%, ${withAlpha(VIOLET_DEEP, 60)} 100%)`,
                  color: "#fff",
                  border: `0.5px solid ${withAlpha("#fff", 18)}`,
                  borderRadius: 14,
                  fontSize: 11, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  letterSpacing: "0.24em", textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: `0 8px 24px ${withAlpha(stageAccent, 30)}, inset 0 1px 0 ${withAlpha("#fff", 18)}`,
                }}
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      )}

      {done && (
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            minBlockSize: 48, paddingBlock: 14, marginBlockStart: 12,
            background: `linear-gradient(180deg, ${withAlpha(AMBER, 65)} 0%, ${withAlpha("#D97706", 70)} 100%)`,
            color: "#fff",
            border: `0.5px solid ${withAlpha("#fff", 22)}`,
            borderRadius: 16,
            fontSize: 12, fontWeight: 700,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            letterSpacing: "0.30em", textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: `0 12px 32px ${withAlpha(AMBER, 32)}, inset 0 1px 0 ${withAlpha("#fff", 22)}`,
          }}
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
