"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { bioSignal } from "@/lib/theme";
import Icon from "@/components/Icon";
import AmbientLattice from "@/components/AmbientLattice";
import NeuralCore3D from "@/components/brand/NeuralCore3D";
import { useHaptic } from "@/hooks/useHaptic";

const SessionBiofeedback = dynamic(() => import("@/components/SessionBiofeedback"), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   SESSION RUNNER — fullscreen cinematic overlay
   ═══════════════════════════════════════════════════════════════
   ADN aplicado: motes con rayos asimétricos (átomo BIO), ignición
   ceremonial al arrancar (spark explota, orb materializa), capa de
   instrumentación con waveform de respiración, instrucción + por qué
   + neurociencia colapsable, botones signature con inset glow.

   Resiliente: cada campo tiene fallback, props guardadas de entrada,
   no compite con animaciones de hermanos.
   ═══════════════════════════════════════════════════════════════ */

function withAlpha(hex, a) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return hex;
  const n = Math.round((a / 100) * 255).toString(16).padStart(2, "0");
  return `#${h}${n}`;
}

const PH_FALLBACK = { k: "", i: "", l: "", r: "", ic: "focus", sc: "", s: 0, e: 0, br: null };

function Scanline({ reducedMotion }) {
  if (reducedMotion) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: "repeating-linear-gradient(180deg, transparent 0, transparent 3px, rgba(255,255,255,0.014) 3px, rgba(255,255,255,0.014) 4px)",
        opacity: 0.5,
      }}
    />
  );
}

/* ─── Countdown ceremony: forming ring + numeral + spark on 0 ──
   Timing: el padre dispara setCountdown cada 1000ms exactos. Las
   transiciones aquí DEBEN caber holgadas dentro de esa ventana o
   los números se ven cortados. Antes:
     · mode="wait" + spring (stiffness 160, damping 14) → 600-800ms
       por transición. Cada número visible ~200-400ms efectivos.
     · ring duration 0.9s → siempre 100ms detrás del tick siguiente.
   Ahora:
     · sin mode="wait" — el exit y el enter del siguiente corren en
       paralelo (ambos centrados en el mismo punto, no compiten).
     · ease cubic-bezier rápido (260ms enter / 220ms exit) → cada
       número es estable ~700ms en pantalla → respiración del ojo.
     · ring duration 0.55s → siempre completa antes del siguiente tick. */
function CountdownCeremony({ n, accent, reducedMotion }) {
  const ringCirc = 2 * Math.PI * 140;
  return (
    <div style={{ position: "relative", width: 300, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Forming ring: fills as countdown progresses (3→0) */}
      <svg width="300" height="300" viewBox="0 0 300 300" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="150" cy="150" r="140" fill="none" stroke={withAlpha(accent, 15)} strokeWidth="1.5" />
        <motion.circle
          cx="150"
          cy="150"
          r="140"
          fill="none"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={ringCirc}
          initial={{ strokeDashoffset: ringCirc }}
          animate={{ strokeDashoffset: ringCirc * (n / 3) }}
          transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${withAlpha(accent, 70)})` }}
        />
      </svg>
      {/* Pulse halo continuo — keyed a n para que el peak coincida con
          la entrada de cada número. Antes pulsaba a 1s repeat libre,
          desfasado del countdown. Ahora reinicia con cada tick: el
          fade IN del halo coincide con el fade IN del número. Lectura
          ceremonial sincronizada. */}
      <motion.div
        key={`halo-${n}`}
        aria-hidden="true"
        initial={reducedMotion ? { opacity: 0.35 } : { scale: 0.92, opacity: 0.15 }}
        animate={reducedMotion ? { opacity: 0.35 } : { scale: 1.08, opacity: 0.55 }}
        transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "absolute", inset: 40, borderRadius: "50%", background: `radial-gradient(circle, ${withAlpha(accent, 40)}, transparent 70%)`, filter: "blur(20px)" }}
      />
      {/* Anticipation ring — destello one-shot en cada tick.
          Anillo delgado que sale del número, escala y se desvanece.
          Marca el "peso" ceremonial que faltaba: cada número tiene su
          propio evento de revelación, no aparecen "de la nada". */}
      {!reducedMotion && (
        <motion.span
          key={`ant-${n}`}
          aria-hidden="true"
          initial={{ scale: 0.55, opacity: 0.85 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            inset: 70,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            boxShadow: `0 0 24px ${withAlpha(accent, 60)}`,
            pointerEvents: "none",
          }}
        />
      )}
      <AnimatePresence>
        <motion.div
          key={n}
          initial={reducedMotion ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
          animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { scale: 1.45, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            translateX: "-50%",
            translateY: "-50%",
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 180,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1,
            letterSpacing: "-6px",
            textShadow: `0 0 40px ${withAlpha(accent, 95)}, 0 0 90px ${withAlpha(accent, 50)}, 0 4px 0 rgba(0,0,0,0.3)`,
            fontVariantNumeric: "tabular-nums",
            zIndex: 2,
            willChange: "transform, opacity",
          }}
        >
          {n}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Breath waveform (instrumentation layer) ── */
// Cuando isBr=true: amplitud se acopla a bS (respiración real).
// Cuando isBr=false: amplitud basal con pulso sincronizado al ritmo del orb (3.2s),
// así la instrumentación "respira" aunque la fase no lo requiera.
function BreathWaveform({ accent, isBr, bS, reducedMotion }) {
  const amp = isBr ? 6 + (bS - 0.9) * 18 : 4.5;
  return (
    <svg width="100%" height="24" viewBox="0 0 320 24" style={{ opacity: 0.55, pointerEvents: "none", overflow: "visible" }}>
      <motion.path
        d={`M0,12 ${Array.from({ length: 16 }, (_, i) => {
          const x = (i + 1) * 20;
          const y = 12 + (i % 2 === 0 ? -amp : amp);
          return `Q${x - 10},${y} ${x},12`;
        }).join(" ")}`}
        fill="none"
        stroke={accent}
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
        animate={
          reducedMotion
            ? {}
            : isBr
            ? { x: [-20, 0] }
            : { x: [-20, 0], scaleY: [1, 1.7, 1] }
        }
        transition={
          reducedMotion
            ? {}
            : isBr
            ? { duration: 1.8, repeat: Infinity, ease: "linear" }
            : {
                x: { duration: 1.8, repeat: Infinity, ease: "linear" },
                scaleY: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
              }
        }
      />
    </svg>
  );
}

/* ─── Orb: NeuralCore3D + progress corona + countdown ───────────
   El radial-gradient sólido + halo blur previos se reemplazan por
   NeuralCore3D — glass translúcido con la lattice del trademark en
   3D y firings neuronales coreografiados al protocolo. Los rings de
   emanación externos también se retiran (NeuralCore3D los absorbe
   vía su aura cónica + nebula interior, evitando duplicación). */
function Orb({ sec, pct, accent, isBr, bS, reducedMotion, paused, ts, intent, pi, progress, bL, onSparkHit }) {
  const r = 122;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
      <NeuralCore3D
        size={280}
        color={accent}
        state={ts || (paused ? "paused" : "running")}
        breathScale={bS}
        isBreathing={isBr}
        reducedMotion={reducedMotion}
        intent={intent || "enfoque"}
        phaseIndex={pi || 0}
        progress={progress || 0}
        secondTick={sec}
        breathPhase={bL || ""}
        onSparkHit={onSparkHit}
      />
      <svg width="280" height="280" viewBox="0 0 280 280" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}>
        <circle cx="140" cy="140" r={r} fill="none" stroke={withAlpha(accent, 18)} strokeWidth="2.5" />
        <circle
          cx="140"
          cy="140"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.max(0, Math.min(1, pct)))}
          style={{ transition: "stroke-dashoffset .95s linear", filter: `drop-shadow(0 0 10px ${withAlpha(accent, 85)})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 76,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1,
            letterSpacing: "-3px",
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 2px 14px ${withAlpha(accent, 60)}, 0 0 32px ${withAlpha(accent, 30)}`,
          }}
        >
          {sec}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: paused ? "rgba(255,255,255,0.5)" : withAlpha(accent, 95), marginTop: 6 }}>
          {paused ? "En pausa" : "segundos"}
        </div>
      </div>
    </div>
  );
}

/* ─── Phase burst (one-shot on phase transition) ── */
function PhaseBurst({ burstKey, accent, reducedMotion }) {
  if (reducedMotion) return null;
  return (
    <AnimatePresence>
      {burstKey && (
        <>
          <motion.div
            key={`phase-flash-${burstKey}`}
            initial={{ scale: 0.6, opacity: 0.7 }}
            animate={{ scale: 1.35, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${withAlpha(accent, 45)} 0%, ${withAlpha(accent, 18)} 45%, transparent 72%)`,
              filter: "blur(10px)",
              pointerEvents: "none",
              zIndex: 4,
            }}
          />
          <motion.span
            key={`phase-ring-${burstKey}`}
            initial={{ scale: 0.88, opacity: 0.85 }}
            animate={{ scale: 1.32, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 280,
              height: 280,
              borderRadius: "50%",
              border: `1.5px solid ${accent}`,
              pointerEvents: "none",
              zIndex: 4,
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Sealing ceremony (one-shot on session completion) ──
   Inverso de ignición: anillos convergen hacia el centro, destello suave,
   orb pulsa su última brillantez. Puente narrativo antes del IgnitionBurst global. */
function Sealing({ show, accent, reducedMotion }) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {!reducedMotion && [0, 1, 2].map((i) => (
            <motion.span
              key={`seal-ring-${i}`}
              aria-hidden="true"
              initial={{ scale: 1.55, opacity: 0.85 }}
              animate={{ scale: 0.72, opacity: 0 }}
              transition={{ duration: 0.55, delay: i * 0.07, ease: [0.32, 0, 0.15, 1] }}
              style={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: 280,
                height: 280,
                borderRadius: "50%",
                border: `1.5px solid ${accent}`,
                pointerEvents: "none",
                zIndex: 5,
                boxShadow: `0 0 22px ${withAlpha(accent, 60)}`,
              }}
            />
          ))}
          <motion.div
            key="seal-core"
            aria-hidden="true"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 0.95, 0] }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: `radial-gradient(circle, #ffffff 0%, ${withAlpha(accent, 70)} 28%, ${withAlpha(accent, 20)} 60%, transparent 80%)`,
              filter: "blur(2px)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Ignition spark (one-shot on countdown→0 transition) ── */
function IgnitionSpark({ show, accent, reducedMotion }) {
  if (reducedMotion) return null;
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="flash"
            initial={{ scale: 0.12, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: `radial-gradient(circle, #ffffff 0%, ${withAlpha(accent, 85)} 30%, ${withAlpha(accent, 25)} 60%, transparent 80%)`,
              filter: "blur(2px)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
          {[0, 1, 2].map((i) => (
            <motion.span
              key={`ring-${i}`}
              initial={{ scale: 0.6, opacity: 0.95 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.75, delay: i * 0.09, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: 280,
                height: 280,
                borderRadius: "50%",
                border: `1.5px solid ${accent}`,
                pointerEvents: "none",
                zIndex: 5,
              }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Signature button (pause/resume) ── */
function SigButton({ onClick, children, variant = "glass", ariaLabel, accent }) {
  const isPrimary = variant === "primary";
  const haptic = useHaptic();
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={(e) => { haptic("tap"); onClick?.(e); }}
      aria-label={ariaLabel}
      className="bi-runner-btn"
      style={{
        flex: 1,
        maxWidth: 210,
        minHeight: 54,
        padding: "15px 0",
        borderRadius: 99,
        background: isPrimary
          ? `linear-gradient(135deg, ${accent}, ${withAlpha(accent, 78)})`
          : "rgba(255,255,255,0.06)",
        border: isPrimary ? "none" : `1.5px solid ${withAlpha(accent, 50)}`,
        color: isPrimary ? "#041018" : "#fff",
        fontSize: 15,
        fontWeight: isPrimary ? 800 : 700,
        cursor: "pointer",
        letterSpacing: -0.1,
        backdropFilter: "blur(10px)",
        outline: "none",
        boxShadow: isPrimary
          ? `0 4px 22px ${withAlpha(accent, 45)}, inset 0 1px 0 rgba(255,255,255,0.25)`
          : `inset 0 0 0 1px ${withAlpha(accent, 18)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
          ["--bi-focus-accent"]: accent,
      }}
    >
      {children}
    </motion.button>
  );
}

function ResetButton({ onClick, accent }) {
  const haptic = useHaptic();
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={(e) => { haptic("warn"); onClick?.(e); }}
      aria-label="Reiniciar sesión"
      className="bi-runner-btn"
      style={{
        width: 54,
        height: 54,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(255,255,255,0.04)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        backdropFilter: "blur(8px)",
        outline: "none",
        ["--bi-focus-accent"]: accent,
      }}
    >
      <Icon name="reset" size={17} color="rgba(255,255,255,0.72)" />
    </motion.button>
  );
}

/* ─── Anti-cheat prompt (single card, 3 variants) ── */
function AntiCheatPrompt({ idx, accent, breathLabel, reducedMotion, onResolve }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef(null);
  const holdRafRef = useRef(null);
  const haptic = useHaptic();

  const startHold = useCallback(() => {
    holdStartRef.current = Date.now();
    haptic("tap");
    const tick = () => {
      const t = Date.now() - (holdStartRef.current || Date.now());
      setHoldProgress(Math.min(1, t / 2000));
      if (t < 2000 && holdStartRef.current) holdRafRef.current = requestAnimationFrame(tick);
    };
    holdRafRef.current = requestAnimationFrame(tick);
  }, [haptic]);

  const endHold = useCallback(() => {
    if (!holdStartRef.current) return;
    const dur = Date.now() - holdStartRef.current;
    holdStartRef.current = null;
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    setHoldProgress(0);
    if (dur >= 2000) {
      haptic("ok");
      onResolve({ type: "hold", success: true, dur });
    } else {
      onResolve({ type: "hold", success: false, dur });
    }
  }, [onResolve, haptic]);

  useEffect(() => () => { if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current); }, []);

  // base con minBlockSize 48 explícito (antes 13×2 + line-height ≈ 46,
  // borderline para WCAG 2.5.5). bi-runner-btn aplica focus-ring del
  // accent en globals.css.
  const base = {
    width: "100%",
    minBlockSize: 48,
    padding: "13px 16px",
    borderRadius: 14,
    cursor: "pointer",
    background: withAlpha(accent, 8),
    border: `1.5px solid ${withAlpha(accent, 35)}`,
    color: accent,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: -0.1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    position: "relative",
    overflow: "hidden",
    "--bi-focus-accent": accent,
  };

  if (idx === 0) {
    return (
      <motion.div
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: reducedMotion ? 0 : 0.3 }}
        style={{ width: "100%", maxWidth: 320, marginInline: "auto" }}
      >
        <button
          type="button"
          className="bi-runner-btn"
          aria-label="Mantén presionado 2 segundos para verificar presencia"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); startHold(); }}
          onPointerUp={endHold}
          onPointerCancel={endHold}
          style={{ ...base, flexDirection: "column", gap: 8 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.span
              aria-hidden="true"
              animate={reducedMotion ? { opacity: 0.7 } : { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 9, height: 9, borderRadius: "50%", background: accent, display: "inline-block" }}
            />
            Mantén presionado 2s
          </div>
          <div style={{ width: "100%", height: 4, borderRadius: 4, background: withAlpha(accent, 14), overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${holdProgress * 100}%`, background: `linear-gradient(90deg, ${withAlpha(accent, 70)}, ${accent})`, transition: holdProgress === 0 ? "width .2s" : "none" }} />
          </div>
        </button>
      </motion.div>
    );
  }

  if (idx === 1) {
    const isExhale = breathLabel === "EXHALA" || breathLabel === "SOSTÉN";
    return (
      <motion.div
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: reducedMotion ? 0 : 0.3 }}
        style={{ width: "100%", maxWidth: 320, marginInline: "auto" }}
      >
        <button
          type="button"
          className="bi-runner-btn"
          aria-label="Toca al exhalar para sincronizar"
          onClick={() => {
            haptic(isExhale ? "ok" : "tap");
            onResolve({ type: "tapExhale", success: isExhale, phase: breathLabel });
          }}
          style={{ ...base, borderStyle: "dashed", borderColor: withAlpha(accent, isExhale ? 55 : 28) }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: isExhale ? accent : "transparent",
              border: `2px solid ${accent}`,
              transition: "background .2s",
            }}
          />
          <span>{isExhale ? "Toca ahora — exhalando" : "Toca al exhalar"}</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
      style={{ width: "100%", maxWidth: 320, marginInline: "auto" }}
    >
      <button
        type="button"
        className="bi-runner-btn"
        aria-label="Confirma tu presencia"
        onClick={() => { haptic("ok"); onResolve({ type: "presence", success: true }); }}
        style={base}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, opacity: 0.7 }} />
        Confirma tu presencia
      </button>
    </motion.div>
  );
}

export default function SessionRunner({
  show,
  countdown = 0,
  ts,
  sec,
  totalDur,
  pr,
  ph,
  pi = 0,
  bL = "",
  bS = 1,
  bCnt = 0,
  isBr = false,
  ac,
  scienceDeep = "",
  onPause,
  onResume,
  onReset,
  onCheckpointOpen,
  onCheckpointResolve,
  onCheckpointTimeout,
  onVisibilityLoss,
  sealing = false,
  reducedMotion = false,
  onSparkHit = null,
  onBiofeedback = null,
}) {
  const safePh = ph || PH_FALLBACK;
  const safePr = pr || { ph: [], n: "", int: "enfoque", d: 120 };
  const accent = ac || bioSignal.phosphorCyan;
  const paused = ts === "paused";
  const countingDown = countdown > 0;
  const running = ts === "running";
  const pct = useMemo(() => (totalDur > 0 ? (totalDur - sec) / totalDur : 0), [totalDur, sec]);
  const phaseCount = safePr.ph?.length || 0;
  const [showScience, setShowScience] = useState(false);
  const [ignitionPlayed, setIgnitionPlayed] = useState(false);
  const [phaseBurst, setPhaseBurst] = useState(null);
  const [liveMsg, setLiveMsg] = useState("");
  const lastPiRef = useRef(pi);

  useEffect(() => {
    if (!show) { setIgnitionPlayed(false); return; }
    if (running && !ignitionPlayed) {
      const t = setTimeout(() => setIgnitionPlayed(true), 950);
      return () => clearTimeout(t);
    }
  }, [running, show, ignitionPlayed]);

  // Phase transition celebration: fire when pi changes (skip initial mount)
  useEffect(() => {
    if (!show) { lastPiRef.current = pi; setPhaseBurst(null); return; }
    if (lastPiRef.current !== pi && running && ignitionPlayed && !reducedMotion) {
      const stamp = Date.now();
      setPhaseBurst(stamp);
      const t = setTimeout(() => setPhaseBurst((curr) => (curr === stamp ? null : curr)), 900);
      lastPiRef.current = pi;
      return () => clearTimeout(t);
    }
    lastPiRef.current = pi;
  }, [pi, show, running, ignitionPlayed, reducedMotion]);

  /* ── Anti-cheat: jittered CP windows + auto-timeout + visibility ── */
  const cpTimesRef = useRef(null);
  const cpFiredRef = useRef([false, false, false]);
  const [activeCp, setActiveCp] = useState(null);
  const [verifiedFlash, setVerifiedFlash] = useState(null);

  // Reset per-session when overlay closes
  useEffect(() => {
    if (!show) {
      cpTimesRef.current = null;
      cpFiredRef.current = [false, false, false];
      setActiveCp(null);
      setVerifiedFlash(null);
    }
  }, [show]);

  // Compute jittered CP times once the session starts (totalDur known)
  useEffect(() => {
    if (!running || cpTimesRef.current || !totalDur || totalDur < 30) return;
    const jitter = () => (Math.random() - 0.5) * 6;
    cpTimesRef.current = [
      Math.max(6, Math.round(totalDur * 0.25 + jitter())),
      Math.round(totalDur * 0.50 + jitter()),
      Math.min(totalDur - 10, Math.round(totalDur * 0.78 + jitter())),
    ];
  }, [running, totalDur]);

  // Open CP window when elapsed crosses a threshold
  useEffect(() => {
    if (!running || !cpTimesRef.current) return;
    const elapsed = totalDur - sec;
    cpTimesRef.current.forEach((cp, i) => {
      if (!cpFiredRef.current[i] && elapsed >= cp && elapsed < cp + 2) {
        cpFiredRef.current[i] = true;
        setActiveCp({ idx: i, openedAt: Date.now() });
        if (onCheckpointOpen) onCheckpointOpen(i);
      }
    });
  }, [sec, running, totalDur, onCheckpointOpen]);

  // Auto-close CP after 10s if no response
  useEffect(() => {
    if (!activeCp) return;
    const idx = activeCp.idx;
    const t = setTimeout(() => {
      setActiveCp((curr) => (curr && curr.idx === idx ? null : curr));
      if (onCheckpointTimeout) onCheckpointTimeout(idx);
    }, 10000);
    return () => clearTimeout(t);
  }, [activeCp, onCheckpointTimeout]);

  // Pause/close CP immediately on pause or overlay exit
  useEffect(() => {
    if (paused || !show) setActiveCp(null);
  }, [paused, show]);

  // Tab-away detector
  useEffect(() => {
    if (!running) return;
    const handler = () => { if (document.hidden && onVisibilityLoss) onVisibilityLoss(); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [running, onVisibilityLoss]);

  // aria-live: anuncios para lector de pantalla
  useEffect(() => {
    if (!show || !running) return;
    if (safePh.k) setLiveMsg(`Fase ${pi + 1} de ${phaseCount}. ${safePh.k}`);
  }, [pi, show, running, safePh.k, phaseCount]);

  useEffect(() => {
    if (!show || !running || !activeCp) return;
    const cue = activeCp.idx === 0
      ? "Verificación: mantén presionado dos segundos"
      : activeCp.idx === 1
      ? "Verificación: toca al exhalar"
      : "Verificación: confirma tu presencia";
    setLiveMsg(cue);
  }, [activeCp, show, running]);

  useEffect(() => {
    if (verifiedFlash) setLiveMsg("Verificado");
  }, [verifiedFlash]);

  useEffect(() => {
    if (sealing) setLiveMsg("Sesión completada");
    if (paused) setLiveMsg("Sesión en pausa");
  }, [sealing, paused]);

  // Teclado durante running: Space pausa/reanuda, Esc reinicia
  useEffect(() => {
    if (!show || countingDown) return;
    const handler = (e) => {
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (running && onPause) onPause();
        else if (paused && onResume) onResume();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (onReset) onReset();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [show, countingDown, running, paused, onPause, onResume, onReset]);

  const resolveCp = useCallback((payload) => {
    setActiveCp((curr) => {
      if (!curr) return curr;
      if (onCheckpointResolve) onCheckpointResolve(curr.idx, payload);
      if (payload && payload.success) {
        setVerifiedFlash({ idx: curr.idx, ts: Date.now() });
        setTimeout(() => setVerifiedFlash(null), 1200);
      }
      return null;
    });
  }, [onCheckpointResolve]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="session-runner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.35 }}
          role="dialog"
          aria-modal="true"
          aria-label={countingDown ? `Comenzando en ${countdown}` : `Sesión ${safePr.n} en curso`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            background: "radial-gradient(120% 80% at 50% 8%, #0A1322 0%, #050810 62%, #02040A 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "max(20px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom))",
            overflow: "hidden",
          }}
        >
          <AmbientLattice accent={accent} reducedMotion={reducedMotion} opacity={0.4} />
          <Scanline reducedMotion={reducedMotion} />

          {/* Live region for screen readers */}
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}
          >
            {liveMsg}
          </div>

          {/* ═══ TOP — minimal chrome during active; full during countdown ═══ */}
          <div style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: sealing ? 0.2 : 1, transition: "opacity .4s ease" }}>
            {countingDown ? (
              <div aria-hidden="true" style={{ display: "inline-flex", alignItems: "baseline", gap: 3, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", lineHeight: 1, opacity: 0.9 }}>
                <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.55)" }}>BIO</span>
                <span style={{ color: accent, fontWeight: 700, transform: "translateY(-0.08em)", filter: `drop-shadow(0 0 4px ${withAlpha(accent, 70)})` }}>—</span>
                <span style={{ fontWeight: 800, color: "#fff" }}>IGNICIÓN</span>
              </div>
            ) : (
              phaseCount > 0 && (
                <motion.div
                  key={`pill-${pi}`}
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.3 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 16px",
                    borderRadius: 99,
                    background: withAlpha(accent, 10),
                    border: `1px solid ${withAlpha(accent, 28)}`,
                    backdropFilter: "blur(8px)",
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  <Icon name={safePh.ic || "focus"} size={12} color={accent} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 1 }}>
                    FASE {pi + 1} / {phaseCount}
                    {safePh.l ? ` · ${safePh.l.toUpperCase()}` : ""}
                  </span>
                </motion.div>
              )
            )}
          </div>

          {/* ═══ CENTER — countdown ceremony OR orb ═══ */}
          <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {countingDown ? (
              <>
                <CountdownCeremony n={countdown} accent={accent} reducedMotion={reducedMotion} />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3.5, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                  Prepara tu sistema
                </div>
              </>
            ) : (
              <motion.div
                style={{ position: "relative" }}
                animate={sealing && !reducedMotion ? { scale: [1, 1.04, 0.98] } : { scale: 1 }}
                transition={{ duration: sealing ? 0.55 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Orb sec={sec} pct={pct} accent={accent} isBr={isBr} bS={bS} reducedMotion={reducedMotion} paused={paused} ts={ts} intent={safePr.int} pi={pi} progress={pct} bL={bL} onSparkHit={onSparkHit} />
                <IgnitionSpark show={running && !ignitionPlayed} accent={accent} reducedMotion={reducedMotion} />
                <PhaseBurst burstKey={phaseBurst} accent={accent} reducedMotion={reducedMotion} />
                {/* <Sealing> removido — el NeuralCore3D ahora entrega el
                    finale (supernova + shockwaves + radial rays). Los
                    3 anillos contraídos + white core del Sealing legacy
                    competían visualmente con el nuevo collapse. */}
              </motion.div>
            )}
          </div>

          {/* ═══ INSTRUCTION + WAVEFORM + SCIENCE (running only) ═══ */}
          {!countingDown && (
            <div style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 10, marginTop: 8, opacity: sealing ? 0.2 : 1, transition: "opacity .4s ease" }}>
              {/* Live biofeedback (opcional) — solo durante respiración con ciclo declarado */}
              {isBr && safePh.br && !sealing && (
                <SessionBiofeedback
                  breathCycle={safePh.br}
                  elapsedSec={Math.max(0, sec - (safePh.s || 0))}
                  active={running}
                  isDark={true}
                  onComplete={onBiofeedback}
                />
              )}
              {/* Breath label (if active) */}
              <AnimatePresence mode="wait">
                {isBr && bL && (
                  <motion.div
                    key={bL}
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: reducedMotion ? 0 : 0.3 }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: 19, fontWeight: 800, color: accent, letterSpacing: -0.3 }}>
                      {bL.charAt(0) + bL.slice(1).toLowerCase()}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 32,
                        height: 24,
                        padding: "0 9px",
                        borderRadius: 12,
                        background: withAlpha(accent, 26),
                        border: `1px solid ${withAlpha(accent, 42)}`,
                        fontSize: 12,
                        fontWeight: 700,
                        color: accent,
                        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {bCnt}s
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instruction block: k (qué) + i (por qué) */}
              {safePh.k && (
                <motion.div
                  key={`k-${pi}`}
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.35 }}
                  style={{ textAlign: "center", padding: "0 8px" }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.35, letterSpacing: -0.3 }}>
                    {safePh.k}
                  </div>
                  {/* iExec render — acepta 3 formas:
                      (1) Array<{from,to,text}>  → steps cronometrados
                          con highlight del paso activo. El usuario ve
                          el arco completo de la fase y nunca se pierde.
                          Tiempos se escalan automáticamente con durMult
                          (media / normal / larga).
                      (2) string                 → instrucción breve
                          monolítica (legacy iExec o simple phase).
                      (3) undefined              → fallback a safePh.i
                          (texto largo original de selección).
                      La pantalla de selección sigue usando safePh.i. */}
                  {(() => {
                    const raw = safePh.iExec || safePh.i;
                    if (!raw) return null;
                    if (typeof raw === "string") {
                      return (
                        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.62)", maxWidth: 340, marginInline: "auto" }}>
                          {raw}
                        </div>
                      );
                    }
                    if (!Array.isArray(raw) || raw.length === 0) return null;
                    const durMult = safePr && safePr.d > 0 ? totalDur / safePr.d : 1;
                    const elapsedTotal = Math.max(0, totalDur - sec);
                    const phaseStartActual = (safePh.s || 0) * durMult;
                    const phaseElapsedBase = durMult > 0 ? (elapsedTotal - phaseStartActual) / durMult : 0;
                    // Resolución robusta del step activo:
                    //   — Primero busca el step cuyo rango [from, to) contiene el tiempo
                    //     transcurrido (caso normal mid-fase).
                    //   — Si no hay match y elapsedBase < primer from → primer step
                    //     (seguridad ante micro-offsets negativos por float math).
                    //   — Si elapsedBase >= último to → último step sigue activo
                    //     (el momento exacto del fin de fase NO debe dejar todos
                    //     los steps en gris futuro; el user está viendo el último).
                    let activeIdx = raw.findIndex((s) => phaseElapsedBase >= s.from && phaseElapsedBase < s.to);
                    if (activeIdx === -1) {
                      if (phaseElapsedBase < raw[0].from) activeIdx = 0;
                      else activeIdx = raw.length - 1;
                    }
                    return (
                      <div style={{ marginTop: 8, maxWidth: 380, marginInline: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                        {raw.map((step, i) => {
                          const isActive = i === activeIdx;
                          const isPast = i < activeIdx;
                          const fromAct = Math.round(step.from * durMult);
                          const toAct = Math.round(step.to * durMult);
                          return (
                            <div
                              key={i}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "52px 1fr",
                                gap: 10,
                                alignItems: "start",
                                opacity: isActive ? 1 : isPast ? 0.36 : 0.58,
                                transition: "opacity .35s ease",
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                                  fontSize: 10,
                                  letterSpacing: "0.04em",
                                  color: isActive ? accent : "rgba(255,255,255,0.5)",
                                  fontWeight: isActive ? 700 : 500,
                                  paddingTop: 3,
                                  textAlign: "right",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {fromAct}–{toAct}s
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  lineHeight: 1.5,
                                  color: isActive ? "#fff" : "rgba(255,255,255,0.72)",
                                  fontWeight: isActive ? 600 : 400,
                                  textAlign: "left",
                                  letterSpacing: isActive ? -0.05 : 0,
                                }}
                              >
                                {step.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* Waveform — instrumentation layer */}
              {running && !paused && (
                <div style={{ height: 24, marginTop: 2 }}>
                  <BreathWaveform accent={accent} isBr={isBr} bS={bS} reducedMotion={reducedMotion} />
                </div>
              )}

              {/* Anti-cheat checkpoint prompt */}
              <AnimatePresence mode="wait">
                {activeCp && running && !paused && (
                  <AntiCheatPrompt
                    key={`cp-${activeCp.idx}`}
                    idx={activeCp.idx}
                    accent={accent}
                    breathLabel={bL}
                    reducedMotion={reducedMotion}
                    onResolve={resolveCp}
                  />
                )}
                {verifiedFlash && !activeCp && (
                  <motion.div
                    key={`vf-${verifiedFlash.ts}`}
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.25 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 99,
                      background: withAlpha(accent, 14),
                      border: `1px solid ${withAlpha(accent, 36)}`,
                      color: accent,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      marginInline: "auto",
                    }}
                  >
                    <Icon name="check" size={11} color={accent} />
                    Verificado
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Neuroscience collapsible */}
              {(safePh.sc || scienceDeep) && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <button
                    onClick={() => setShowScience((s) => !s)}
                    aria-expanded={showScience}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 99,
                      background: "transparent",
                      border: `1px solid ${withAlpha(accent, 22)}`,
                      color: withAlpha(accent, 95),
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="mind" size={11} color={accent} />
                    Neurociencia
                    <span style={{ fontSize: 10, transform: showScience ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▾</span>
                  </button>
                  <AnimatePresence>
                    {showScience && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: "hidden", width: "100%", marginTop: 8 }}
                      >
                        <div
                          style={{
                            padding: "12px 14px",
                            borderRadius: 12,
                            background: withAlpha(accent, 6),
                            border: `1px solid ${withAlpha(accent, 14)}`,
                            textAlign: "left",
                          }}
                        >
                          {safePh.sc && (
                            <div style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.78)" }}>
                              {safePh.sc}
                            </div>
                          )}
                          {scienceDeep && (
                            <div
                              style={{
                                marginTop: safePh.sc ? 8 : 0,
                                paddingTop: safePh.sc ? 8 : 0,
                                borderTop: safePh.sc ? `1px solid ${withAlpha(accent, 12)}` : "none",
                                fontSize: 11,
                                lineHeight: 1.6,
                                color: "rgba(255,255,255,0.56)",
                              }}
                            >
                              {scienceDeep}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* ═══ BOTTOM — segmented timeline + controls ═══ */}
          <div style={{ position: "relative", zIndex: 3, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 14, opacity: sealing ? 0.2 : 1, transition: "opacity .4s ease" }}>
            {!countingDown && phaseCount > 0 && (
              <div>
                <div role="list" aria-label="Progreso de fases" style={{ display: "flex", gap: 3, height: 5, borderRadius: 3, overflow: "hidden" }}>
                  {safePr.ph.map((p, i) => {
                    const segW = safePr.d > 0 ? ((p.e - p.s) / safePr.d) * 100 : 100 / phaseCount;
                    const isCurr = pi === i;
                    const isDone = i < pi;
                    return (
                      <div
                        key={i}
                        role="listitem"
                        aria-current={isCurr ? "step" : undefined}
                        style={{
                          flex: `0 0 ${segW}%`,
                          background: isDone ? accent : isCurr ? `linear-gradient(90deg, ${accent}, ${withAlpha(accent, 70)})` : withAlpha(accent, 14),
                          transition: "background .35s ease",
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: "flex", marginTop: 6 }}>
                  {safePr.ph.map((p, i) => {
                    const segW = safePr.d > 0 ? ((p.e - p.s) / safePr.d) * 100 : 100 / phaseCount;
                    const isCurr = pi === i;
                    const isDone = i < pi;
                    return (
                      <div
                        key={i}
                        style={{
                          flex: `0 0 ${segW}%`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          opacity: isCurr ? 1 : isDone ? 0.7 : 0.35,
                          transition: "opacity .3s ease",
                          overflow: "hidden",
                        }}
                      >
                        <Icon name={p.ic} size={10} color={isCurr ? accent : "rgba(255,255,255,0.5)"} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {!countingDown && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
                {running && (
                  <>
                    <SigButton onClick={onPause} variant="glass" accent={accent} ariaLabel="Pausar sesión">
                      Pausar
                    </SigButton>
                    <ResetButton onClick={onReset} accent={accent} />
                  </>
                )}
                {paused && (
                  <>
                    <SigButton onClick={onResume} variant="primary" accent={accent} ariaLabel="Continuar sesión">
                      Continuar
                    </SigButton>
                    <ResetButton onClick={onReset} accent={accent} />
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
