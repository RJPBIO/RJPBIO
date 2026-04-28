"use client";
/* ═══════════════════════════════════════════════════════════════
   SESSION BIOFEEDBACK — live HR + coherence durante un protocolo
   ═══════════════════════════════════════════════════════════════
   Mientras el usuario corre un protocolo de respiración (calma,
   coherencia, etc.), conectamos opcionalmente a un strap BLE y
   mostramos en tiempo real:

     — HR actual (latidos/min)
     — Score de coherencia 0-100 (phase-lock entre breath cycle y RSA)
     — Indicador de beat (haptic + visual cuando se detecta latido)

   Al finalizar la sesión, devolvemos el snapshot final vía
   `onComplete({ score, amplitude, phaseLock, n, hrSamples })` para
   que el padre lo guarde en el historial.

   Diferenciador real: ningún competidor consumer (Calm, Headspace)
   mide HRV durante la sesión. HeartMath / Inner Balance lo hacen pero
   con hardware propio. Nosotros con un Polar H10 BLE — open ecosystem.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { resolveTheme, withAlpha, brand, bioSignal } from "../lib/theme";
import { useReducedMotion } from "../lib/a11y";
import { isBleSupported, createHrvSession } from "../lib/ble-hrv";
import { createCoherenceTracker } from "../lib/coherence";
import { breathCycleLength } from "../lib/breathCycle";
import { track } from "../lib/telemetry";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

/**
 * @param {object} props
 * @param {{in:number,h1:number,ex:number,h2:number}|null} props.breathCycle
 * @param {number} props.elapsedSec — tiempo desde inicio del protocolo
 * @param {boolean} props.active — true mientras la sesión está corriendo
 * @param {boolean} props.isDark
 * @param {(result: object) => void} [props.onComplete] — al finalizar
 */
export default function SessionBiofeedback({ breathCycle, elapsedSec, active, isDark, onComplete }) {
  const reduced = useReducedMotion();
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  const [phase, setPhase] = useState("idle"); // idle | connecting | live | error
  const [hr, setHr] = useState(null);
  const [coherenceData, setCoherenceData] = useState(null);
  const [error, setError] = useState(null);
  const [beatPulse, setBeatPulse] = useState(0);

  const sessionRef = useRef(null);
  const trackerRef = useRef(null);
  const lastBeatTsRef = useRef(0);

  const bleAvailable = typeof window !== "undefined" && isBleSupported();
  const cycleLength = breathCycle ? breathCycleLength(breathCycle) : 0;

  // Push breath phase cada vez que cambia elapsedSec (lo recibe del padre).
  useEffect(() => {
    if (phase !== "live" || cycleLength <= 0) return;
    const phaseFrac = (elapsedSec % cycleLength) / cycleLength;
    trackerRef.current?.pushBreath(phaseFrac);
    // Recompute coherence on every breath update (cheap O(n) over window).
    const c = trackerRef.current?.coherence();
    if (c) setCoherenceData(c);
  }, [elapsedSec, phase, cycleLength]);

  // Si la sesión termina mientras estamos live, finalize.
  useEffect(() => {
    if (!active && phase === "live") {
      finalize();
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount.
  useEffect(() => () => {
    try { sessionRef.current?.disconnect?.(); } catch {}
  }, []);

  async function handleConnect() {
    if (!bleAvailable) {
      setError("Web Bluetooth no disponible. Usa Chrome/Edge desktop o Android.");
      setPhase("error");
      return;
    }
    setError(null);
    setPhase("connecting");
    track("biofeedback.connect.requested");

    const tracker = createCoherenceTracker({ windowMs: 30000 });
    trackerRef.current = tracker;

    const session = createHrvSession({
      onConnect: () => {
        setPhase("live");
        track("biofeedback.connected");
      },
      onSample: ({ hr: liveHr, rrMs }) => {
        setHr(liveHr);
        const ts = Date.now();
        for (const ibi of rrMs) {
          tracker.pushBeat(ibi, ts);
        }
        if (rrMs.length > 0) {
          lastBeatTsRef.current = ts;
          setBeatPulse((p) => p + 1);
        }
      },
      onDisconnect: () => {
        if (phase === "live") {
          setError("Strap desconectado. Reintenta para reanudar el biofeedback.");
          setPhase("error");
        }
      },
      onError: (e) => {
        if (e.code === "CANCELLED") {
          setPhase("idle");
          return;
        }
        setError(e.message || "Error con sensor");
        setPhase("error");
      },
    });
    sessionRef.current = session;

    try {
      await session.connect();
    } catch {
      // handled by onError
    }
  }

  function finalize() {
    const tracker = trackerRef.current;
    if (!tracker) return;
    const result = tracker.coherence();
    try { sessionRef.current?.disconnect?.(); } catch {}
    if (result) {
      track("biofeedback.session.completed", {
        score: result.score,
        n: result.n,
      });
      onComplete?.(result);
    }
    setPhase("idle");
  }

  // Sin Web Bluetooth (iOS Safari, etc.) y aún en idle → no hay nada útil
  // que mostrar. Antes solo se ocultaba en pre-sesión (active=false), pero
  // durante la ejecución también dejaba un contenedor vacío con borde y
  // padding flotando arriba de la fase. Si BLE no existe y nunca entramos
  // a connecting/live/error, no renderizamos nada.
  if (!bleAvailable && phase === "idle") return null;

  return (
    <motion.div
      role="region"
      aria-label="Biofeedback en tiempo real"
      style={{
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: 12,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBlockEnd: 12,
        position: "relative",
      }}
    >
      {/* Estados */}
      {phase === "idle" && bleAvailable && !active && (
        <>
          <div style={{ flex: 1, fontSize: 12, color: t2, lineHeight: 1.4 }}>
            <strong style={{ color: t1, fontWeight: 700 }}>Biofeedback en vivo</strong>{" "}
            <span>— conecta tu strap BLE para ver coherencia en tiempo real durante el protocolo.</span>
          </div>
          <button
            type="button"
            onClick={handleConnect}
            aria-label="Conectar strap Bluetooth para biofeedback"
            style={{
              padding: "8px 14px",
              minBlockSize: 36,
              background: brand.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: -0.05,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Conectar
          </button>
        </>
      )}

      {phase === "connecting" && (
        <div style={{ flex: 1, fontSize: 12, color: t2 }}>
          Esperando sensor BLE…
        </div>
      )}

      {phase === "live" && (
        <>
          {/* Beat indicator */}
          <motion.div
            key={beatPulse}
            initial={reduced ? { opacity: 1 } : { scale: 0.7, opacity: 0.5 }}
            animate={reduced ? {} : { scale: 1, opacity: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 0.2 }}
            style={{
              inlineSize: 10,
              blockSize: 10,
              borderRadius: "50%",
              background: brand.primary,
              boxShadow: `0 0 8px ${withAlpha(brand.primary, 60)}`,
              flexShrink: 0,
            }}
            aria-hidden="true"
          />

          {/* HR */}
          <div style={{ minInlineSize: 64 }}>
            <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: t1, lineHeight: 1 }}>
              {hr ?? "—"}
            </div>
            <div style={{ fontSize: 10, color: t3, marginBlockStart: 2 }}>bpm</div>
          </div>

          {/* Coherence score with bar */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBlockEnd: 4 }}>
              <span style={{ fontSize: 10, color: t3, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>
                Coherencia
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 18,
                  fontWeight: 600,
                  color: coherenceColor(coherenceData?.score),
                  lineHeight: 1,
                  marginInlineStart: "auto",
                }}
              >
                {coherenceData?.score ?? "—"}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={coherenceData?.score ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                blockSize: 4,
                background: withAlpha(t3, 18),
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ inlineSize: `${coherenceData?.score ?? 0}%` }}
                transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  blockSize: "100%",
                  background: coherenceColor(coherenceData?.score),
                  boxShadow: coherenceData?.score >= 70 ? `0 0 8px ${withAlpha(coherenceColor(coherenceData?.score), 50)}` : "none",
                }}
              />
            </div>
          </div>
        </>
      )}

      {phase === "error" && error && (
        <>
          <div style={{ flex: 1, fontSize: 12, color: bioSignal.plasmaPink ?? "#ef4444" }}>
            {error}
          </div>
          <button
            onClick={() => { setError(null); setPhase("idle"); }}
            style={{
              padding: "6px 12px",
              minBlockSize: 32,
              background: "transparent",
              color: t1,
              border: `1px solid ${bd}`,
              borderRadius: 8,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </>
      )}
    </motion.div>
  );
}

function coherenceColor(score) {
  if (score == null) return "#9ca3af";
  if (score >= 70) return bioSignal.coherence ?? "#3b82f6";
  if (score >= 40) return brand.primary;
  return bioSignal.ignition ?? "#f59e0b";
}
