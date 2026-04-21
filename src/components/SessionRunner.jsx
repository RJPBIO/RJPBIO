"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { bioSignal, font, space, radius, z } from "@/lib/theme";
import Icon from "@/components/Icon";

/* ═══════════════════════════════════════════════════════════════
   SESSION RUNNER — fullscreen cinematic overlay
   ═══════════════════════════════════════════════════════════════
   Bulletproof: self-contained, all props guarded, no conditional
   unmounts during session lifecycle. Owns the visual treatment
   of countdown + running + paused states with brand DNA
   (deep-field backdrop, ambient lattice, phosphor accent, emanating
   rings). Idle stays in the existing panel — this takes over the
   viewport the moment a session begins.
   ═══════════════════════════════════════════════════════════════ */

function withAlpha(hex, a) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return hex;
  const n = parseInt(Math.round((a / 100) * 255)).toString(16).padStart(2, "0");
  return `#${h}${n}`;
}

// Safe phase fallback — never throws on undefined ph
const PH_FALLBACK = { k: "", i: "", l: "", r: "", ic: "focus", sc: "", s: 0, e: 0, br: null };

function LatticeBackdrop({ accent, reducedMotion }) {
  // Subtle constellation of motes — the brand atom, scaled down for focus.
  const motes = [
    { cx: 12, cy: 18, r: 1.2, d: 0 },
    { cx: 82, cy: 24, r: 1.6, d: 0.6 },
    { cx: 28, cy: 68, r: 1.4, d: 1.1 },
    { cx: 76, cy: 82, r: 1.0, d: 1.6 },
    { cx: 50, cy: 12, r: 0.9, d: 2.0 },
    { cx: 8, cy: 92, r: 0.8, d: 2.4 },
    { cx: 92, cy: 58, r: 1.1, d: 0.3 },
    { cx: 38, cy: 40, r: 0.7, d: 1.4 },
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35, pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="sr-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.8" />
        </radialGradient>
      </defs>
      {motes.map((m, i) =>
        reducedMotion ? (
          <circle key={i} cx={m.cx} cy={m.cy} r={m.r} fill={accent} opacity={0.6} />
        ) : (
          <motion.circle
            key={i}
            cx={m.cx}
            cy={m.cy}
            r={m.r}
            fill={accent}
            animate={{ opacity: [0.25, 0.75, 0.25] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: m.d }}
          />
        )
      )}
      <rect x="0" y="0" width="100" height="100" fill="url(#sr-vignette)" />
    </svg>
  );
}

function Scanline({ reducedMotion }) {
  if (reducedMotion) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: "repeating-linear-gradient(180deg, transparent 0, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)",
        opacity: 0.5,
      }}
    />
  );
}

function CountdownNumeral({ n, accent }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={n}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.6, opacity: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
        style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: "clamp(140px, 32vw, 220px)",
          fontWeight: 800,
          color: accent,
          lineHeight: 1,
          letterSpacing: "-8px",
          textShadow: `0 0 60px ${withAlpha(accent, 80)}, 0 0 120px ${withAlpha(accent, 40)}`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </motion.div>
    </AnimatePresence>
  );
}

function Orb({ sec, pct, accent, isBr, bS, reducedMotion, paused, ph }) {
  const safeP = ph || PH_FALLBACK;
  const r = 122;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
      {/* Phosphor halo */}
      <motion.div
        aria-hidden="true"
        animate={reducedMotion ? { opacity: paused ? 0.25 : 0.5 } : isBr ? { scale: bS * 1.06, opacity: 0.55 } : paused ? { opacity: 0.3 } : { scale: [1, 1.05, 1], opacity: [0.45, 0.7, 0.45] }}
        transition={isBr ? { scale: { type: "spring", stiffness: 30, damping: 20, mass: 1.2 }, opacity: { duration: 0.6 } } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", inset: -40, borderRadius: "50%", background: `radial-gradient(circle, ${withAlpha(accent, 35)}, ${withAlpha(accent, 12)} 48%, transparent 72%)`, filter: "blur(24px)", pointerEvents: "none" }}
      />
      {/* Emanation rings */}
      {!reducedMotion && !paused && [0, 1].map((i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          initial={{ scale: 0.9, opacity: 0.45 }}
          animate={{ scale: 1.42, opacity: 0 }}
          transition={{ duration: 2.4, delay: i * 1.2, ease: "easeOut", repeat: Infinity }}
          style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${accent}`, pointerEvents: "none" }}
        />
      ))}
      {/* Sphere */}
      <motion.div
        aria-hidden="true"
        animate={reducedMotion ? { scale: paused ? 0.97 : 1 } : isBr ? { scale: bS } : paused ? { scale: 0.97 } : { scale: [1, 1.012, 1] }}
        transition={isBr ? { type: "spring", stiffness: 30, damping: 20, mass: 1.2 } : paused ? { duration: 0.4 } : { duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 28%, ${withAlpha(accent, 50)} 0%, ${withAlpha(accent, 22)} 18%, #0B1320 48%, #050810 88%)`,
          border: `1px solid ${withAlpha(accent, 40)}`,
          boxShadow: `0 24px 80px -18px ${withAlpha(accent, 55)}, inset 0 2px 0 0 rgba(255,255,255,0.12), inset 0 -28px 50px -12px rgba(0,0,0,0.7)`,
          opacity: paused ? 0.75 : 1,
        }}
      />
      {/* Progress ring */}
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
          style={{ transition: "stroke-dashoffset .95s linear", filter: `drop-shadow(0 0 10px ${withAlpha(accent, 80)})` }}
        />
      </svg>
      {/* Center content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 72,
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
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: withAlpha(accent, 95), marginTop: 6 }}>
          {paused ? "En pausa" : "segundos"}
        </div>
      </div>
    </div>
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
  onPause,
  onResume,
  onReset,
  reducedMotion = false,
}) {
  const safePh = ph || PH_FALLBACK;
  const safePr = pr || { ph: [], n: "", int: "enfoque", d: 120 };
  const accent = ac || bioSignal.phosphorCyan;
  const paused = ts === "paused";
  const countingDown = countdown > 0;
  const pct = useMemo(() => (totalDur > 0 ? (totalDur - sec) / totalDur : 0), [totalDur, sec]);
  const phaseCount = safePr.ph?.length || 0;

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
            background: "radial-gradient(120% 80% at 50% 10%, #0A1322 0%, #050810 65%, #03060C 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom))",
            overflow: "hidden",
          }}
        >
          <LatticeBackdrop accent={accent} reducedMotion={reducedMotion} />
          <Scanline reducedMotion={reducedMotion} />

          {/* Top strip — wordmark + phase pill */}
          <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div aria-hidden="true" style={{ display: "inline-flex", alignItems: "baseline", gap: 3, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", lineHeight: 1 }}>
              <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.55)" }}>BIO</span>
              <span style={{ color: accent, fontWeight: 700, transform: "translateY(-0.08em)" }}>—</span>
              <span style={{ fontWeight: 800, color: "#fff" }}>IGNICIÓN</span>
            </div>
            {!countingDown && phaseCount > 0 && (
              <motion.div
                key={pi}
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.3 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: withAlpha(accent, 12),
                  border: `1px solid ${withAlpha(accent, 30)}`,
                  backdropFilter: "blur(6px)",
                }}
              >
                <Icon name={safePh.ic || "focus"} size={12} color={accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: -0.1 }}>
                  Fase {pi + 1}/{phaseCount}
                  {safePh.l ? ` · ${safePh.l}` : ""}
                </span>
              </motion.div>
            )}
          </div>

          {/* Center — countdown OR orb */}
          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            {countingDown ? (
              <>
                <CountdownNumeral n={countdown} accent={accent} />
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
                  Prepara tu sistema
                </div>
              </>
            ) : (
              <>
                <Orb sec={sec} pct={pct} accent={accent} isBr={isBr} bS={bS} reducedMotion={reducedMotion} paused={paused} ph={safePh} />
                {/* Breath label (if active) */}
                <AnimatePresence mode="wait">
                  {isBr && bL && (
                    <motion.div
                      key={bL}
                      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={{ duration: reducedMotion ? 0 : 0.3 }}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span style={{ fontSize: 18, fontWeight: 700, color: accent, letterSpacing: -0.2 }}>
                        {bL.charAt(0) + bL.slice(1).toLowerCase()}
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 28,
                          height: 22,
                          padding: "0 8px",
                          borderRadius: 11,
                          background: withAlpha(accent, 28),
                          border: `1px solid ${withAlpha(accent, 40)}`,
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
                {/* Phase instruction */}
                {safePh.k && (
                  <motion.div
                    key={`phk-${pi}`}
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.35 }}
                    style={{ maxWidth: 340, textAlign: "center", padding: "0 16px" }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.4, letterSpacing: -0.2 }}>
                      {safePh.k}
                    </div>
                    {safePh.i && (
                      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.65)" }}>
                        {safePh.i}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Bottom — phase timeline + controls */}
          <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 14 }}>
            {!countingDown && phaseCount > 0 && (
              <div role="list" aria-label="Progreso de fases" style={{ display: "flex", gap: 3, height: 4, borderRadius: 2, overflow: "hidden" }}>
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
            )}
            {!countingDown && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}>
                {ts === "running" && (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onPause}
                      aria-label="Pausar sesión"
                      style={{
                        flex: 1,
                        maxWidth: 200,
                        minHeight: 52,
                        padding: "14px 0",
                        borderRadius: 99,
                        background: "rgba(255,255,255,0.08)",
                        border: `1.5px solid ${withAlpha(accent, 45)}`,
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: "pointer",
                        letterSpacing: -0.1,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      Pausar
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onReset}
                      aria-label="Reiniciar sesión"
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="reset" size={17} color="rgba(255,255,255,0.7)" />
                    </motion.button>
                  </>
                )}
                {paused && (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onResume}
                      aria-label="Continuar sesión"
                      style={{
                        flex: 1,
                        maxWidth: 200,
                        minHeight: 52,
                        padding: "14px 0",
                        borderRadius: 99,
                        background: `linear-gradient(135deg, ${accent}, ${withAlpha(accent, 75)})`,
                        border: "none",
                        color: "#041018",
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                        letterSpacing: -0.1,
                        boxShadow: `0 4px 18px ${withAlpha(accent, 40)}`,
                      }}
                    >
                      Continuar
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onReset}
                      aria-label="Terminar sesión"
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="reset" size={17} color="rgba(255,255,255,0.7)" />
                    </motion.button>
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
