"use client";
/* ═══════════════════════════════════════════════════════════════
   RESONANCE CALIBRATION — find personal resonance frequency
   Requires BLE HR sensor. Tests 5 rates × 2 min. Picks max HRV amp.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";
import { isBleSupported, createHrvSession } from "../lib/ble-hrv";
import { RESONANCE_RATES, hrvAmplitude, pickResonanceRate, timingsFor } from "../lib/resonance";

const TRIAL_SEC = 120;

export default function ResonanceCalibration({ show, isDark, onClose, onComplete }) {
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);
  const bleAvailable = typeof window !== "undefined" && isBleSupported();

  const [phase, setPhase] = useState("intro");
  const [deviceName, setDeviceName] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [trialElapsed, setTrialElapsed] = useState(0);
  const [trials, setTrials] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [breathPhase, setBreathPhase] = useState("in");

  const sessionRef = useRef(null);
  const bufferRef = useRef([]);
  const trialTimerRef = useRef(null);
  const breathTimerRef = useRef(null);

  useEffect(() => () => cleanup(), []);

  useEffect(() => {
    if (!show) {
      setPhase("intro"); setCurrentIdx(0); setTrialElapsed(0);
      setTrials([]); setResult(null); setError(null);
      cleanup();
    }
  }, [show]);

  useEffect(() => {
    if (phase !== "running") return;
    const rate = RESONANCE_RATES[currentIdx];
    if (!rate) return;
    const timings = timingsFor(rate.bpm);
    let cancelled = false;

    const cycleBreath = () => {
      if (cancelled) return;
      setBreathPhase("in");
      breathTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        setBreathPhase("out");
        breathTimerRef.current = setTimeout(cycleBreath, timings.exMs);
      }, timings.inMs);
    };
    cycleBreath();

    const t0 = Date.now();
    trialTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      setTrialElapsed(elapsed);
      if (elapsed >= TRIAL_SEC) {
        clearInterval(trialTimerRef.current);
        const rrForTrial = [...bufferRef.current];
        bufferRef.current = [];
        const amp = hrvAmplitude(rrForTrial);
        const next = [...trials, { bpm: rate.bpm, rrMs: rrForTrial, amplitude: amp }];
        setTrials(next);
        if (currentIdx + 1 >= RESONANCE_RATES.length) {
          finish(next);
        } else {
          setPhase("between");
          setTrialElapsed(0);
          setTimeout(() => {
            setCurrentIdx((i) => i + 1);
            setPhase("running");
          }, 3000);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      if (trialTimerRef.current) clearInterval(trialTimerRef.current);
      if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
    };
  }, [phase, currentIdx]);

  function cleanup() {
    try { sessionRef.current?.disconnect?.(); } catch {}
    if (trialTimerRef.current) clearInterval(trialTimerRef.current);
    if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
  }

  async function startCalibration() {
    setError(null);
    setPhase("connecting");
    const session = createHrvSession({
      onConnect: (info) => {
        setDeviceName(info.name);
        setPhase("running");
        setCurrentIdx(0);
        bufferRef.current = [];
        announce(`Conectado a ${info.name}. Comienza la calibración.`);
      },
      onSample: ({ rrMs }) => {
        for (const rr of rrMs) bufferRef.current.push(rr);
      },
      onDisconnect: () => {
        if (phase !== "done" && phase !== "intro") {
          setError("Se perdió la conexión con el sensor.");
          setPhase("error");
        }
      },
      onError: (e) => {
        if (e.code === "CANCELLED") { setPhase("intro"); return; }
        setError(e.message || "Error de conexión.");
        setPhase("error");
      },
    });
    sessionRef.current = session;
    try { await session.connect(); } catch { /* handled */ }
  }

  function finish(allTrials) {
    cleanup();
    const pick = pickResonanceRate(allTrials);
    setResult({ pick, trials: allTrials });
    setPhase("done");
    announce(pick ? `Frecuencia de resonancia: ${pick.bpm} respiraciones por minuto.` : "Calibración incompleta.");
  }

  function save() {
    if (!result?.pick) return;
    onComplete?.({
      ts: Date.now(),
      bpm: result.pick.bpm,
      amplitude: result.pick.amplitude,
      rankings: result.pick.rankings,
      confidence: result.pick.confidence,
    });
    onClose?.();
  }

  if (!show) return null;

  const currentRate = RESONANCE_RATES[currentIdx];

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ position: "fixed", inset: 0, background: bg, zIndex: 220, padding: 20, display: "flex", flexDirection: "column", overflowY: "auto" }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 16 }}>
        <h2 id={titleId} style={{ fontSize: 16, fontWeight: font.weight.black, color: t1, margin: 0 }}>
          Calibración de Resonancia
        </h2>
        <button onClick={onClose} aria-label="Cerrar calibración" style={{ border: "none", background: "transparent", color: t2, padding: 8, cursor: "pointer" }}>
          <Icon name="close" size={20} color={t2} aria-hidden="true" />
        </button>
      </header>

      {phase === "intro" && (
        <section aria-label="Preparación" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 16, marginBlockEnd: 16 }}>
            <p style={{ color: t1, fontSize: 13, lineHeight: 1.6, margin: 0, marginBlockEnd: 10 }}>
              Encuentra tu frecuencia de resonancia personal. Respirarás a 5 ritmos distintos (4.5, 5.0, 5.5, 6.0, 6.5 rpm), 2 minutos cada uno.
            </p>
            <p style={{ color: t2, fontSize: 12, lineHeight: 1.5, margin: 0, marginBlockEnd: 10 }}>
              Duración total: ~12 minutos. Requiere sensor de frecuencia cardíaca (BLE).
            </p>
            <p style={{ color: t3, fontSize: 11, lineHeight: 1.5, margin: 0 }}>
              El ritmo que produzca la mayor amplitud de HRV es tu resonancia. A partir de ese momento todos tus protocolos de respiración usarán ESE ritmo personal.
            </p>
          </div>

          {!bleAvailable && (
            <div role="alert" style={{ background: withAlpha(semantic.warning, 10), border: `1px solid ${withAlpha(semantic.warning, 30)}`, borderRadius: 10, padding: 12, marginBlockEnd: 16 }}>
              <p style={{ color: semantic.warning, fontSize: 12, margin: 0, fontWeight: 700 }}>Web Bluetooth no disponible</p>
              <p style={{ color: t2, fontSize: 11, margin: 0, marginBlockStart: 4 }}>Requiere Chrome/Edge en desktop o Android.</p>
            </div>
          )}

          <button
            type="button"
            onClick={startCalibration}
            disabled={!bleAvailable}
            aria-label="Iniciar calibración de resonancia"
            style={{
              inlineSize: "100%", paddingBlock: 14,
              background: bleAvailable ? brand.primary : bd,
              color: "#fff", border: "none", borderRadius: 14,
              fontSize: 13, fontWeight: font.weight.black, letterSpacing: 1, textTransform: "uppercase",
              cursor: bleAvailable ? "pointer" : "not-allowed",
              opacity: bleAvailable ? 1 : 0.55,
            }}
          >
            Conectar sensor e iniciar
          </button>
        </section>
      )}

      {phase === "connecting" && (
        <div role="status" aria-live="polite" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: t2, fontSize: 13 }}>Esperando sensor…</p>
        </div>
      )}

      {phase === "running" && currentRate && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24 }}>
          <p style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>
            Ensayo {currentIdx + 1} de {RESONANCE_RATES.length} · {currentRate.label}
          </p>

          <motion.div
            aria-hidden="true"
            animate={reduced ? {} : { scale: breathPhase === "in" ? 1.35 : 0.9 }}
            transition={reduced ? {} : { duration: breathPhase === "in" ? timingsFor(currentRate.bpm).inMs / 1000 : timingsFor(currentRate.bpm).exMs / 1000, ease: "easeInOut" }}
            style={{
              inlineSize: 160, blockSize: 160, borderRadius: "50%",
              background: `radial-gradient(circle, ${withAlpha(brand.accent, 30)}, ${withAlpha(brand.accent, 10)} 70%)`,
              border: `2px solid ${brand.accent}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{ color: brand.accent, fontSize: 22, fontWeight: font.weight.black }}>
              {breathPhase === "in" ? "Inhala" : "Exhala"}
            </span>
          </motion.div>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={TRIAL_SEC}
            aria-valuenow={Math.round(trialElapsed)}
            aria-label={`Progreso del ensayo: ${Math.round(trialElapsed)} de ${TRIAL_SEC} segundos`}
            style={{ inlineSize: "80%", maxInlineSize: 320, blockSize: 4, background: bd, borderRadius: 2, overflow: "hidden" }}
          >
            <div style={{ blockSize: "100%", inlineSize: `${(trialElapsed / TRIAL_SEC) * 100}%`, background: brand.accent, transition: "inline-size .3s" }} />
          </div>
          <p style={{ color: t2, fontSize: 11 }}>{Math.round(TRIAL_SEC - trialElapsed)}s restantes</p>
        </div>
      )}

      {phase === "between" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <p style={{ color: t1, fontSize: 16, fontWeight: 700 }}>Descanso breve</p>
          <p style={{ color: t2, fontSize: 12 }}>Siguiente ritmo en 3 segundos…</p>
        </div>
      )}

      {phase === "done" && result && (
        <section aria-label="Resultado" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 20, marginBlockEnd: 16, textAlign: "center" }}>
            <p style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 8 }}>
              Tu frecuencia de resonancia
            </p>
            <div style={{ color: brand.accent, fontSize: 56, fontWeight: font.weight.black, lineHeight: 1 }}>
              {result.pick ? result.pick.bpm : "—"}
            </div>
            <p style={{ color: t2, fontSize: 12, marginBlockStart: 6 }}>respiraciones por minuto</p>
            {result.pick && (
              <p style={{ color: t3, fontSize: 11, marginBlockStart: 12 }}>
                Amplitud HRV: {result.pick.amplitude} bpm · Confianza: {result.pick.confidence === "high" ? "alta" : "media"}
              </p>
            )}
          </div>

          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 14, padding: 16, marginBlockEnd: 16 }}>
            <p style={{ color: t3, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBlockEnd: 12 }}>
              Ranking por amplitud
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.trials.sort((a, b) => b.amplitude - a.amplitude).map((t, i) => (
                <div key={t.bpm} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <span style={{ color: t1, fontWeight: i === 0 ? 800 : 600 }}>
                    {t.bpm} rpm{i === 0 ? "  ←  óptimo" : ""}
                  </span>
                  <span style={{ color: t2 }}>{t.amplitude.toFixed(1)} bpm</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={!result.pick}
            aria-label="Guardar frecuencia de resonancia"
            style={{
              inlineSize: "100%", paddingBlock: 14,
              background: result.pick ? brand.primary : bd,
              color: "#fff", border: "none", borderRadius: 14,
              fontSize: 13, fontWeight: font.weight.black, letterSpacing: 1, textTransform: "uppercase",
              cursor: result.pick ? "pointer" : "not-allowed",
              opacity: result.pick ? 1 : 0.55,
            }}
          >
            Guardar
          </button>
        </section>
      )}

      {phase === "error" && error && (
        <div role="alert" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ background: withAlpha(semantic.danger, 10), border: `1px solid ${withAlpha(semantic.danger, 30)}`, borderRadius: 12, padding: 16, marginBlockEnd: 16 }}>
            <p style={{ color: semantic.danger, fontSize: 12, fontWeight: 700, margin: 0 }}>{error}</p>
          </div>
          <button
            onClick={() => { setPhase("intro"); setError(null); }}
            style={{ inlineSize: "100%", paddingBlock: 12, background: "transparent", color: t1, border: `1px solid ${bd}`, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Reintentar
          </button>
        </div>
      )}
    </motion.div>
  );
}
