"use client";
/* ═══════════════════════════════════════════════════════════════
   HRV CAMERA MEASURE — Finger-on-lens PPG → RR intervals → HRV
   Sin hardware extra: cámara trasera + flash LED como fuente de
   luz roja. Ruta gratis, en cualquier smartphone con torch.

   DNA: neural-performance-first. La fase measuring es zona sagrada
   — el usuario debe permanecer quieto con el dedo apoyado. UI
   mínima: un solo número (bpm live) + progreso + SQI chip. No
   chrome decorativo que le distraiga.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { colors, withAlpha } from "./app/v2/tokens";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";
import { createCameraCapture, createStreamingAnalyzer } from "../lib/hrv-camera/capture";
import { computeHrvInsight, buildHrvBaseline } from "../lib/hrv-camera/insight";
import { useStore } from "../store/useStore";
import { track } from "../lib/telemetry";
import { useHaptic } from "../hooks/useHaptic";

// Phase 6B SP2 — Shim de compatibilidad legacy → tokens v2.
// Mantiene firma de brand/bioSignal/font para preservar los styles del
// componente sin reescribir su estructura sensorial (Sprints 73-80).
const brand = { primary: colors.accent.phosphorCyan };
const bioSignal = {
  phosphorCyan: colors.accent.phosphorCyan,
  ignition: colors.semantic.warning,
  plasmaPink: colors.semantic.danger,
  // coherence se usa en chips de "above baseline" → cyan brand v2.
  coherence: colors.accent.phosphorCyan,
};
const font = {
  weight: { thin: 200, light: 200, regular: 400, medium: 500, semibold: 500, bold: 500, black: 500 },
};

const FULL_DURATION_SEC = 60;
const SETTLING_TIMEOUT_MS = 30000; // si en 30s no detectamos dedo, abortar
const FINGER_LOST_GRACE_MS = 1500; // tolerancia antes de pausar el timer
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// iOS Safari no permite controlar el flash con la cámara abierta (hardware
// exclusivo). Tampoco soporta Web Bluetooth. Detectamos iOS para ofrecer
// dos rutas alternativas: pantalla-como-luz (frontal) o luz externa (trasera).
function detectIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPad en iPadOS 13+ se reporta como Mac; el check de maxTouchPoints
  // discrimina iPads reales.
  if (/iP(ad|hone|od)/.test(ua)) return true;
  if (ua.includes("Macintosh") && navigator.maxTouchPoints > 1) return true;
  return false;
}

export default function HRVCameraMeasure({ show, isDark, onClose, onComplete, onUseBLE }) {
  const reduced = useReducedMotion();
  const haptic = useHaptic();
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [phase, setPhase] = useState("intro"); // intro | requesting | settling | measuring | done | error
  // mode: "torch" (Android: trasera + LED) | "screen-light" (iOS: frontal + pantalla blanca) | "ambient" (trasera, sol/lámpara)
  const [mode, setMode] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [live, setLive] = useState(null);
  const [error, setError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [settlingCountdown, setSettlingCountdown] = useState(null);

  const isIOS = typeof window !== "undefined" ? detectIOS() : false;

  // Cuando el modo es "screen-light", el modal se convierte en una fuente
  // de luz: fondo blanco puro, paleta clara forzada. Se aplica desde
  // "requesting" en adelante (incluye settling y measuring) — evita el
  // flash visual de transición. En done/error volvemos a la paleta normal.
  const screenLightActive =
    mode === "screen-light" && (phase === "requesting" || phase === "settling" || phase === "measuring");
  // Phase 6B SP2 — superficies tokens v2 (dark canon). Para screen-light
  // forzamos paleta clara temporal (la pantalla ES la fuente de luz hacia
  // el dedo en el modo iOS); en cualquier otro caso, dark canónico.
  const bgN = colors.bg.base;
  const cdN = colors.bg.raised;
  const bdN = colors.separator;
  const t1N = colors.text.primary;
  const t2N = colors.text.secondary;
  const t3N = colors.text.muted;
  const bg = screenLightActive ? "#ffffff" : bgN;
  const cd = screenLightActive ? "rgba(0,0,0,0.04)" : cdN;
  const bd = screenLightActive ? "rgba(0,0,0,0.08)" : bdN;
  const t1 = screenLightActive ? "rgba(0,0,0,0.92)" : t1N;
  const t2 = screenLightActive ? "rgba(0,0,0,0.62)" : t2N;
  const t3 = screenLightActive ? "rgba(0,0,0,0.4)" : t3N;

  const captureRef = useRef(null);
  const analyzerRef = useRef(null);
  const startedAtRef = useRef(0);
  const fingerOkStreakRef = useRef(0);
  const phaseRef = useRef("intro");
  const startingRef = useRef(false); // race guard contra doble-click
  const settlingStartTsRef = useRef(0);
  const measureElapsedMsRef = useRef(0); // acumulador con pausa por finger-loss
  const lastUpdateTsRef = useRef(0);
  const fingerLostSinceRef = useRef(0);
  const wakeLockRef = useRef(null);
  const lastVibratedPeakTsRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [brightnessHint, setBrightnessHint] = useState(false);

  // Wake Lock: evita que iOS/Android apaguen la pantalla durante la
  // medición. Crítico en modo screen-light (la pantalla ES la luz);
  // también útil en todos los modos para no perder el stream de cámara
  // si el user no toca durante 30-60s. iOS Safari 16.4+ lo soporta.
  async function acquireWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // ignorado — mejor esfuerzo
    }
  }
  async function releaseWakeLock() {
    try {
      await wakeLockRef.current?.release?.();
    } catch {
      // ignorado
    }
    wakeLockRef.current = null;
  }

  useEffect(() => {
    // Re-adquirir wake lock cuando la pestaña vuelve a visible mid-medición.
    function onVis() {
      if (document.visibilityState === "visible" &&
          (phaseRef.current === "settling" || phaseRef.current === "measuring") &&
          !wakeLockRef.current) {
        acquireWakeLock();
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => () => {
    // Sprint 80 — torch off explícito antes de stop(). En Chrome stock
    // de algunos Android, track.stop() libera la cámara pero el LED
    // queda encendido hasta que la página recarga. setTorch(false) es
    // idempotente y barato; siempre lo intentamos primero.
    try { captureRef.current?.setTorch?.(false); } catch {}
    try { captureRef.current?.stop?.(); } catch {}
    releaseWakeLock();
  }, []);

  const cameraAvailable = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  function setPhaseSafe(p) {
    phaseRef.current = p;
    setPhase(p);
  }

  async function handleStart(startMode = "torch") {
    if (startingRef.current) return; // race guard
    startingRef.current = true;
    setMode(startMode);
    setError(null);
    setElapsedSec(0);
    setLive(null);
    setFinalResult(null);
    setPaused(false);
    fingerOkStreakRef.current = 0;
    measureElapsedMsRef.current = 0;
    lastUpdateTsRef.current = 0;
    fingerLostSinceRef.current = 0;
    setPhaseSafe("requesting");

    const analyzer = createStreamingAnalyzer({
      fs: 30,
      windowSec: FULL_DURATION_SEC,
      updateMs: 500,
      onUpdate: (u) => {
        setLive(u);
        const nowTs = Date.now();

        if (phaseRef.current === "settling") {
          // Auto-avanzar cuando hay 2s consecutivos de dedo bien apoyado.
          if (u.fingerOk) {
            fingerOkStreakRef.current += 1;
            const countdown = Math.max(0, 4 - Math.floor(fingerOkStreakRef.current / 2));
            setSettlingCountdown(countdown);
            if (fingerOkStreakRef.current >= 8) startMeasurement();
          } else {
            fingerOkStreakRef.current = 0;
            setSettlingCountdown(null);
          }
          // Hint específico screen-light: si tras 6s+ no hay finger-ok y
          // la pantalla aparenta no estar al máximo (proxy: red channel
          // no logra dominancia), surface "¿Brillo al máximo?".
          if (
            startMode === "screen-light" &&
            !u.fingerOk &&
            settlingStartTsRef.current &&
            nowTs - settlingStartTsRef.current > 6000
          ) {
            if (!brightnessHint) setBrightnessHint(true);
          }
          // Timeout duro: 30s sin lograr dedo apoyado → abortar.
          if (settlingStartTsRef.current && nowTs - settlingStartTsRef.current > SETTLING_TIMEOUT_MS) {
            const hint =
              startMode === "screen-light"
                ? "No detectamos el dedo. Sube el brillo al máximo y apoya la yema sobre la lente frontal."
                : startMode === "ambient"
                ? "No detectamos el dedo. Necesitas luz más fuerte (sol directo o lámpara cerca)."
                : "No detectamos el dedo. Verifica que cubras lente + flash y reintenta.";
            setError(hint);
            try { captureRef.current?.setTorch?.(false); } catch {}
            try { captureRef.current?.stop?.(); } catch {}
            releaseWakeLock();
            setPhaseSafe("error");
          }
        } else if (phaseRef.current === "measuring") {
          // Haptic feedback por latido — vibra brevemente cuando el
          // analyzer detecta un nuevo pico. Solo si no está pausado y
          // el pico es reciente (<1.5s) para evitar vibrar por picos
          // viejos que aún están en la ventana. Respeta reduced-motion.
          if (
            u.lastPeakTs &&
            u.lastPeakTs !== lastVibratedPeakTsRef.current &&
            !reduced &&
            !paused &&
            u.fingerOk
          ) {
            const ageMs = Date.now() - u.lastPeakTs;
            if (ageMs < 1500) haptic("beat");
            lastVibratedPeakTsRef.current = u.lastPeakTs;
          }

          // Pausa el reloj cuando el dedo se cae. Damos un grace de 1.5s
          // para tolerar micro-ajustes; pasado eso, el progreso se congela
          // hasta que vuelva a estar OK. Datos sin dedo NO cuentan tiempo.
          const lastTs = lastUpdateTsRef.current || nowTs;
          const dt = nowTs - lastTs;
          lastUpdateTsRef.current = nowTs;

          if (u.fingerOk) {
            fingerLostSinceRef.current = 0;
            if (paused) setPaused(false);
            measureElapsedMsRef.current += dt;
          } else {
            if (fingerLostSinceRef.current === 0) fingerLostSinceRef.current = nowTs;
            const lostFor = nowTs - fingerLostSinceRef.current;
            if (lostFor < FINGER_LOST_GRACE_MS) {
              measureElapsedMsRef.current += dt; // grace
            } else {
              if (!paused) setPaused(true);
              // No incrementamos elapsed → el progreso se congela
            }
          }
          const elapsed = measureElapsedMsRef.current / 1000;
          setElapsedSec(elapsed);
          if (elapsed >= FULL_DURATION_SEC) finish();
        }
      },
    });
    analyzerRef.current = analyzer;

    const facingMode = startMode === "screen-light" ? "user" : "environment";
    const cap = createCameraCapture({ facingMode });
    captureRef.current = cap;
    try {
      await cap.start({
        onSample: (v, ts, meta) => {
          if (startedAtRef.current === 0) startedAtRef.current = ts;
          analyzer.pushSample(v, ts, meta);
        },
        onError: () => {},
      });
      // Solo intentamos encender torch en modo "torch" (Android con LED
      // controlable). En screen-light/ambient el torch es inaccesible o
      // irrelevante.
      if (startMode === "torch") {
        const ok = await cap.setTorch(true);
        setTorchOn(ok);
        setTorchAvailable(cap.isTorchSupported());
      } else {
        setTorchOn(false);
        setTorchAvailable(false);
      }
      settlingStartTsRef.current = Date.now();
      acquireWakeLock();
      setPhaseSafe("settling");
      announce(
        startMode === "screen-light"
          ? "Apoya el dedo sobre la cámara frontal. Sube el brillo al máximo."
          : startMode === "ambient"
          ? "Apoya el dedo sobre la cámara trasera bajo luz fuerte."
          : "Apoya el dedo sobre la cámara trasera y el flash."
      );
    } catch (err) {
      setError(err?.message || "No se pudo iniciar la cámara.");
      setPhaseSafe("error");
    } finally {
      startingRef.current = false;
    }
  }

  function startMeasurement() {
    // Descartar las samples del settling → baseline limpio para la
    // medición. El filtro IIR también se reinicia, evitando carga
    // de samples donde el dedo aún se estaba acomodando.
    analyzerRef.current?.reset?.();
    measureElapsedMsRef.current = 0;
    lastUpdateTsRef.current = Date.now();
    fingerLostSinceRef.current = 0;
    setElapsedSec(0);
    setSettlingCountdown(null);
    setPaused(false);
    setPhaseSafe("measuring");
    track("hrv.measure.started", { source: "camera", mode });
    announce("Medición iniciada. Mantente quieto durante 60 segundos.");
  }

  async function toggleTorch() {
    const cap = captureRef.current;
    if (!cap) return;
    const ok = await cap.setTorch(!torchOn);
    if (ok) setTorchOn(!torchOn);
  }

  function finish() {
    const a = analyzerRef.current;
    const cap = captureRef.current;
    if (!a) return;
    const result = a.finish();
    setFinalResult(result);
    setPhaseSafe("done");
    try { cap?.setTorch?.(false); } catch {}
    try { cap?.stop?.(); } catch {}
    releaseWakeLock();
    const hrv = result.hrv;
    if (hrv) announce(`Medición completa. RMSSD ${hrv.rmssd} ms.`);
  }

  function handleStop() {
    // Sprint 76 — handleStop SIEMPRE cancela al intro, nunca guarda
    // datos parciales. Antes (≥20s mostraba "Detener y guardar" y
    // llamaba finish()) un usuario impaciente podía guardar mediciones
    // incompletas que contaminaban su histórico (RMSSD calculado con
    // <60s tiene CI95 ancho y sesgo conocido). Ahora la medición solo
    // se guarda cuando completa los 60s naturalmente vía finish().
    try { captureRef.current?.setTorch?.(false); } catch {}
    try { captureRef.current?.stop?.(); } catch {}
    releaseWakeLock();
    setPhaseSafe("intro");
    setElapsedSec(0);
    setLive(null);
    setSettlingCountdown(null);
    setBrightnessHint(false);
    fingerOkStreakRef.current = 0;
  }

  function handleSave() {
    const hrv = finalResult?.hrv;
    const sqi = finalResult?.sqi;
    if (!hrv) return;
    track("hrv.measure.saved", {
      source: "camera",
      mode,
      sqi: sqi?.score,
      sqiBand: sqi?.band,
      durationSec: Math.round(finalResult?.elapsedSec || 0),
    });
    onComplete?.({
      ts: Date.now(),
      rmssd: hrv.rmssd,
      lnRmssd: hrv.lnRmssd,
      sdnn: hrv.sdnn,
      pnn50: hrv.pnn50,
      meanHR: hrv.meanHr,
      rhr: Math.round(hrv.meanHr),
      n: hrv.n,
      durationSec: finalResult?.elapsedSec,
      source: "camera",
      sqi: sqi?.score,
      sqiBand: sqi?.band,
    });
    // Sprint 73 — flush síncrono del debounce (300ms) ANTES de mostrar
    // pantalla "saved". Antes: si el user fuerza salida con back-button
    // dentro de los 300ms, scheduleSave nunca dispara → datos perdidos.
    // saveNow() flushea inmediatamente; queda persistido en IDB antes
    // de que cualquier navegación pueda interferir.
    try { useStore.getState().saveNow?.(); } catch {}
    // Confirmación visual — cierra el loop emocional y confirma que el
    // dato entró al historial. Sprint 73 agrega botón explícito
    // "Continuar" en la pantalla saved (antes solo había auto-close
    // 1500ms y el user quedaba atorado si quería salir antes).
    setPhaseSafe("saved");
    announce("Medición guardada en tu historial.");
    // Auto-close se mantiene como fallback (1.8s, un poco más largo
    // para que el user pueda leer el resultado sin sentirse apurado).
    setTimeout(() => onClose?.(), 1800);
  }

  if (!show) return null;

  const progress = Math.min(100, (elapsedSec / FULL_DURATION_SEC) * 100);
  const liveHr = live?.hrv?.meanHr ? Math.round(live.hrv.meanHr) : null;
  const liveSqi = live?.sqi ?? null;

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        // Glass dark + cyan accent radial
        background: `radial-gradient(ellipse 70% 80% at 50% 0%, ${withAlpha(brand.primary, 18)} 0%, transparent 55%), linear-gradient(180deg, #0a0a10 0%, #08080A 100%)`,
        zIndex: 220,
        padding: "20px 20px 60px",
        paddingBlockStart: 40,
        overflowY: "auto",
        inlineSize: "100%",
      }}
    >
      {phase !== "measuring" && phase !== "saved" && (
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 24, maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5 }}>
                <motion.span
                  animate={reduced ? {} : { scale: [1, 2.4, 1], opacity: [0.55, 0, 0.55] }}
                  transition={reduced ? {} : { duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                  style={{ position: "absolute", inset: 0, borderRadius: "50%", background: brand.primary }}
                />
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${brand.primary} 55%)`, boxShadow: `0 0 8px ${brand.primary}` }} />
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 9, fontWeight: 500,
                color: brand.primary, letterSpacing: "0.30em", textTransform: "uppercase",
                textShadow: `0 0 6px ${withAlpha(brand.primary, 50)}`,
              }}>
                Cámara · Sin sensor BLE
              </span>
            </span>
            <h2 id={titleId} style={{
              fontSize: 19, fontWeight: 200, color: t1,
              letterSpacing: -0.4, lineHeight: 1.1, margin: 0,
            }}>
              HRV con cámara
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar medición HRV"
            style={{
              inlineSize: 38, blockSize: 38,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: `linear-gradient(180deg, ${withAlpha(brand.primary, 18)} 0%, ${withAlpha(brand.primary, 6)} 100%)`,
              border: `0.5px solid ${withAlpha(brand.primary, 38)}`,
              borderRadius: "50%",
              color: brand.primary,
              cursor: "pointer",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
              <path d="M3 3 L10 10 M10 3 L3 10" stroke={brand.primary} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>
      )}

      {phase === "intro" && (
        <section aria-label="Preparación" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ marginBlockEnd: 16 }}>
            <PhoneIllustration
              mode={isIOS ? "screen-light" : "torch"}
              t1={t1}
              t3={t3}
              accent={brand.primary}
            />
          </div>
          <div
            style={{
              background: cd,
              border: `1px solid ${bd}`,
              borderRadius: 16,
              padding: 20,
              marginBlockEnd: 16,
            }}
          >
            <p style={{ color: t1, fontSize: 15, lineHeight: 1.55, margin: 0, marginBlockEnd: 12 }}>
              {isIOS
                ? "En iPhone el flash no se puede activar con la cámara abierta. Tienes dos rutas válidas — elige la que prefieras."
                : "Apoya la yema del dedo índice sobre la cámara trasera y el flash LED. Mantén presión firme pero sin aplastar; cubre lente + flash por completo."}
            </p>
            <p style={{ color: t2, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Siéntate cómodo y quieto durante {Math.round(FULL_DURATION_SEC)} s. La cámara detecta las micro-pulsaciones rojas de tu sangre sistólica sin hardware extra.
            </p>
          </div>

          {!cameraAvailable && (
            <div
              role="alert"
              style={{
                background: withAlpha(bioSignal.ignition, 10),
                border: `1px solid ${withAlpha(bioSignal.ignition, 35)}`,
                borderRadius: 12,
                padding: 14,
                marginBlockEnd: 16,
              }}
            >
              <p style={{ color: bioSignal.ignition, fontSize: 13, fontWeight: 500, margin: 0, marginBlockEnd: 4 }}>
                Cámara no disponible
              </p>
              <p style={{ color: t2, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                Requiere HTTPS y un navegador con acceso a getUserMedia. Desktop o Android Chrome recomendados.
              </p>
            </div>
          )}

          {isIOS ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <ModeButton
                primary
                recommended
                disabled={!cameraAvailable || phase === "requesting"}
                onClick={() => handleStart("screen-light")}
                title="Pantalla como luz"
                subtitle="Dedo sobre cámara frontal. Sube el brillo al máximo antes de empezar."
                t1={t1}
                t2={t2}
                t3={t3}
                bd={bd}
              />
              <ModeButton
                disabled={!cameraAvailable || phase === "requesting"}
                onClick={() => handleStart("ambient")}
                title="Luz del sol o lámpara"
                subtitle="Dedo sobre cámara trasera, bajo luz fuerte (sol directo o linterna externa)."
                t1={t1}
                t2={t2}
                t3={t3}
                bd={bd}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleStart("torch")}
              disabled={!cameraAvailable || phase === "requesting"}
              aria-label="Iniciar medición HRV con cámara"
              style={{
                inlineSize: "100%",
                minBlockSize: 48,
                paddingBlock: 14,
                background: cameraAvailable ? brand.primary : bd,
                color: colors.bg.base,
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: -0.1,
                cursor: cameraAvailable && phase !== "requesting" ? "pointer" : "not-allowed",
                opacity: cameraAvailable && phase !== "requesting" ? 1 : 0.55,
              }}
            >
              {phase === "requesting" ? "Solicitando…" : "Permitir cámara y empezar"}
            </button>
          )}

          {onUseBLE && !isIOS && (
            <button
              type="button"
              onClick={() => { onClose?.(); onUseBLE(); }}
              aria-label="Usar sensor Bluetooth en lugar de la cámara"
              style={{
                inlineSize: "100%",
                minBlockSize: 40,
                paddingBlock: 10,
                marginBlockStart: 12,
                background: "transparent",
                color: t2,
                border: "none",
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ¿Tienes sensor Bluetooth? Medir con strap BLE
            </button>
          )}

          {/* Modo validación: cámara + BLE simultáneo. Solo se muestra
              si ambos APIs están disponibles (Android Chrome/Edge desktop). */}
          {!isIOS && cameraAvailable && typeof navigator !== "undefined" && navigator.bluetooth && (
            <a
              href="/lab/hrv-validation"
              style={{
                display: "block",
                inlineSize: "100%",
                minBlockSize: 40,
                paddingBlock: 10,
                marginBlockStart: 12,
                background: "transparent",
                color: t3,
                border: "none",
                fontSize: 12,
                cursor: "pointer",
                textAlign: "center",
                textDecoration: "underline",
                opacity: 0.85,
              }}
              aria-label="Modo validación: comparar cámara contra strap BLE"
            >
              ¿Quieres validar precisión? Cámara + strap BLE simultáneo
            </a>
          )}

          <details style={{ marginBlockStart: 20 }}>
            <summary style={{ color: t3, fontSize: 13, cursor: "pointer" }}>
              Cómo funciona
            </summary>
            <p style={{ color: t3, fontSize: 12, lineHeight: 1.7, marginBlockStart: 8 }}>
              A 30 fps, leemos el canal rojo medio del centro de la imagen. El volumen sanguíneo con cada sístole cambia la luz reflejada lo suficiente para detectar el latido (PPG). Un filtro Butterworth 0.7–4 Hz limpia la señal, detección de picos con refractario fisiológico produce IBIs, y validamos ectópicos antes de calcular RMSSD/SDNN según protocolo Task Force 1996. Resolución temporal = 33 ms (precisión de RMSSD menor que un strap BLE; suficiente para tendencias diarias).
            </p>
          </details>
        </section>
      )}

      {phase === "requesting" && (
        <div role="status" aria-live="polite" style={{ textAlign: "center", padding: 40, maxInlineSize: 500, marginInline: "auto" }}>
          <motion.div
            animate={reduced ? {} : { rotate: 360 }}
            transition={reduced ? {} : { duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              display: "inline-block",
              inlineSize: 40,
              blockSize: 40,
              border: `3px solid ${bd}`,
              borderBlockStartColor: brand.primary,
              borderRadius: "50%",
              marginBlockEnd: 16,
            }}
          />
          <p style={{ color: t2, fontSize: 14, margin: 0 }}>Solicitando cámara…</p>
        </div>
      )}

      {phase === "settling" && (
        <section
          aria-label="Acomodar el dedo sobre la cámara"
          style={{
            maxInlineSize: 420,
            marginInline: "auto",
            marginBlockStart: 40,
            textAlign: "center",
          }}
        >
          <motion.div
            animate={reduced || !live?.fingerOk ? {} : { scale: [1, 1.04, 1] }}
            transition={reduced ? {} : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              inlineSize: 120,
              blockSize: 120,
              borderRadius: "50%",
              marginInline: "auto",
              marginBlockEnd: 24,
              background: live?.fingerOk
                ? withAlpha(brand.primary, 20)
                : withAlpha(bioSignal.ignition, 15),
              border: `2px solid ${live?.fingerOk ? brand.primary : withAlpha(bioSignal.ignition, 40)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
              fontSize: 40,
              fontWeight: 500,
              color: live?.fingerOk ? brand.primary : bioSignal.ignition,
            }}
          >
            {settlingCountdown != null && settlingCountdown > 0 ? settlingCountdown : (live?.fingerOk ? "●" : "·")}
          </motion.div>
          <p
            role="status"
            aria-live="polite"
            style={{ color: t1, fontSize: 17, lineHeight: 1.5, margin: 0, marginBlockEnd: 8, fontWeight: 500 }}
          >
            {live?.fingerOk
              ? (settlingCountdown && settlingCountdown > 0 ? `Listos en ${settlingCountdown}…` : "Detectado. Iniciando…")
              : mode === "screen-light"
              ? "Apoya el dedo sobre la cámara frontal"
              : mode === "ambient"
              ? "Apoya el dedo sobre la cámara trasera"
              : "Apoya el dedo sobre la lente y el flash"}
          </p>
          <p style={{ color: t2, fontSize: 13, lineHeight: 1.5, margin: 0, marginBlockEnd: 16 }}>
            {live?.fingerOk
              ? "Mantén el dedo firme. Respira natural, sin guiarte."
              : mode === "screen-light"
              ? "Apoya la yema sobre la cámara frontal (parte superior del teléfono). La pantalla ilumina; la cámara captura el reflejo."
              : mode === "ambient"
              ? "Necesitas luz fuerte (sol directo o lámpara potente sobre el dedo)."
              : "Cubre lente + flash con la yema, presión firme pero relajada."}
          </p>

          {/* Hint específico cuando llevamos rato sin detectar en screen-light */}
          {brightnessHint && !live?.fingerOk && mode === "screen-light" && (
            <div
              role="status"
              aria-live="polite"
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 999,
                background: withAlpha(bioSignal.ignition, 12),
                border: `1px solid ${withAlpha(bioSignal.ignition, 35)}`,
                marginBlockEnd: 24,
                fontSize: 12,
                fontWeight: 500,
                color: t1,
              }}
            >
              ¿Brillo al máximo? La pantalla debe emitir la luz hacia el dedo.
            </div>
          )}
          {!brightnessHint && <div style={{ marginBlockEnd: 24 }} />}
          <button
            onClick={handleStop}
            aria-label="Cancelar medición"
            style={{
              inlineSize: "100%",
              minBlockSize: 44,
              paddingBlock: 12,
              background: "transparent",
              color: t3,
              border: "none",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </section>
      )}

      {phase === "measuring" && (() => {
        // Sprint 76 — UX rework de la pantalla de medición.
        //
        // PRINCIPIO CLÍNICO: NO modular el estado del usuario durante
        // la medición. NO breathing pacer, NO audio rítmico, NO haptic
        // sincronizado al ritmo cardíaco. La medición debe reflejar el
        // estado natural del usuario; cualquier prescripción rítmica
        // contamina la lectura. Esta pantalla solo INFORMA, nunca dirige.
        //
        // Cambios vs Sprint 73:
        //  · Narrativa honesta rotativa (refuerza "respira natural")
        //  · Comparación contextual debajo del bpm (última, baseline)
        //  · SQI chip con hint accionable (qué hacer si calidad baja)
        //  · Solo botón "Cancelar" (eliminado "Detener y guardar"
        //    porque incentivaba mediciones incompletas que contaminaban
        //    el histórico)
        //  · Flash y opciones secundarias arriba (no compiten con el
        //    foco principal)
        const stage =
          elapsedSec < 12 ? 0 : elapsedSec < 28 ? 1 : elapsedSec < 45 ? 2 : 3;
        const narrative = paused
          ? null // el chip de "Pausado" reemplaza la narrativa
          : [
              "Respira como sea natural — esto mide tu estado real",
              "Mantén el dedo apoyado · no fuerces nada",
              "Casi listo · tu HRV se está estabilizando",
              "Últimos segundos · sostén la calma",
            ][stage];

        const recentForContext = (useStore.getState().hrvLog || [])
          .filter((e) => e && typeof e.rmssd === "number")
          .sort((a, b) => b.ts - a.ts);
        const lastEntry = recentForContext[0] || null;
        const baselineRecent = (() => {
          if (recentForContext.length < 5) return null;
          const last30d = recentForContext.filter((e) => Date.now() - e.ts < 30 * 86_400_000);
          if (last30d.length < 5) return null;
          const xs = last30d.map((e) => e.rmssd);
          const m = xs.reduce((a, b) => a + b, 0) / xs.length;
          return Math.round(m);
        })();

        const sqiHint = (() => {
          if (!liveSqi) return null;
          const band = liveSqi.band;
          if (band === "good" || band === "high") return "Señal limpia — sigue así";
          if (band === "ok" || band === "medium") return "Apoya el dedo más firme y centrado en la cámara";
          return "Apóyalo más firme · busca más luz si es de noche";
        })();

        return (
        <section
          aria-label="Medición en curso"
          style={{
            maxInlineSize: 440,
            marginInline: "auto",
            marginBlockStart: 24,
            textAlign: "center",
            position: "relative",
            paddingBlockEnd: 40,
          }}
        >
          {/* Header secundario discreto: Flash si aplica. Antes vivía al
              fondo compitiendo con Cancelar. */}
          {torchAvailable && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBlockEnd: 16 }}>
              <button
                onClick={toggleTorch}
                aria-pressed={torchOn}
                aria-label={torchOn ? "Apagar flash" : "Encender flash"}
                style={{
                  paddingBlock: 6,
                  paddingInline: 10,
                  background: "transparent",
                  color: t3,
                  border: `1px solid ${bd}`,
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Flash {torchOn ? "ON" : "OFF"}
              </button>
            </div>
          )}

          {/* Beat-synced halo (passive, sólo confirma que detectamos peak;
              NO prescribe ritmo) */}
          {!reduced && live?.lastPeakTs && !paused && live?.fingerOk && (
            <motion.div
              key={live.lastPeakTs}
              aria-hidden="true"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: [0.85, 1.05, 1.15], opacity: [0, 0.18, 0] }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "absolute",
                insetInlineStart: "50%",
                insetBlockStart: 42,
                inlineSize: 240,
                blockSize: 240,
                marginInlineStart: -120,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${withAlpha(brand.primary, 100)} 0%, transparent 65%)`,
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          )}

          {/* Number bpm pulsante al ritmo del corazón del USUARIO (no
              prescriptivo; refleja su tasa actual). */}
          <motion.div
            animate={reduced || !liveHr ? {} : { scale: [1, 1.035, 1] }}
            transition={reduced || !liveHr ? {} : { duration: 60 / (liveHr || 60), repeat: Infinity, ease: "easeInOut" }}
            style={{
              color: t1,
              fontFamily: MONO,
              fontSize: 104,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: -3,
              marginBlockEnd: 4,
              position: "relative",
              zIndex: 1,
            }}
          >
            {liveHr || "--"}
          </motion.div>
          <div style={{ color: t3, fontSize: 11, letterSpacing: 1.2, fontWeight: 500, textTransform: "uppercase", marginBlockEnd: 14 }}>bpm</div>

          {/* Comparación contextual — solo si hay datos previos. Da
              motivación implícita sin distraer. Mono. */}
          {(lastEntry || baselineRecent != null) && (
            <div
              style={{
                display: "inline-flex",
                gap: 18,
                padding: "8px 14px",
                background: withAlpha(t1, 4),
                borderRadius: 8,
                marginBlockEnd: 22,
                fontFamily: MONO,
                fontSize: 11,
                color: t3,
                letterSpacing: 0.3,
              }}
            >
              {lastEntry && (
                <span>
                  Última <span style={{ color: t1, fontWeight: 500 }}>{Math.round(lastEntry.rmssd)} ms</span>
                </span>
              )}
              {baselineRecent != null && (
                <span>
                  Baseline <span style={{ color: t1, fontWeight: 500 }}>{baselineRecent} ms</span>
                </span>
              )}
            </div>
          )}

          {/* Estado: pausado o narrativa rotativa. Mutuamente exclusivos. */}
          {paused ? (
            <div
              role="alert"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: withAlpha(bioSignal.ignition, 15),
                border: `1px solid ${withAlpha(bioSignal.ignition, 40)}`,
                marginBlockEnd: 18,
              }}
            >
              <span style={{ inlineSize: 8, blockSize: 8, borderRadius: "50%", background: bioSignal.ignition }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: t1 }}>
                Pausado — apoya el dedo para continuar
              </span>
            </div>
          ) : (
            narrative && (
              <motion.p
                key={stage}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  fontSize: 12.5,
                  color: t2,
                  lineHeight: 1.55,
                  fontStyle: "italic",
                  marginBlockEnd: 18,
                  maxInlineSize: 320,
                  marginInline: "auto",
                }}
              >
                {narrative}
              </motion.p>
            )
          )}

          {/* Waveform — visualización pasiva del PPG. Label arriba para
              que el usuario sepa qué está viendo. */}
          {live?.waveform && live.waveform.length > 10 && (
            <div style={{ marginBlockEnd: 18 }}>
              <div style={{ fontSize: 9, fontWeight: 500, color: t3, letterSpacing: 1.2, textTransform: "uppercase", marginBlockEnd: 6, textAlign: "start" }}>
                Tu pulso · señal en vivo
              </div>
              <Waveform values={live.waveform} color={brand.primary} height={48} />
            </div>
          )}

          {/* SQI chip con HINT accionable. Antes solo decía "media · 65"
              y el usuario no sabía qué hacer. */}
          {liveSqi && (
            <div style={{ marginBlockEnd: 26 }}>
              <div
                aria-label={`Calidad de señal: ${liveSqi.band}, puntaje ${liveSqi.score}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: withAlpha(sqiColor(liveSqi.band), 15),
                  border: `1px solid ${withAlpha(sqiColor(liveSqi.band), 40)}`,
                }}
              >
                <span style={{ inlineSize: 8, blockSize: 8, borderRadius: "50%", background: sqiColor(liveSqi.band) }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: t1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Calidad: {sqiLabel(liveSqi.band)}
                </span>
              </div>
              {sqiHint && (
                <div style={{ fontSize: 11, color: t3, marginBlockStart: 6, lineHeight: 1.4, maxInlineSize: 320, marginInline: "auto" }}>
                  {sqiHint}
                </div>
              )}
            </div>
          )}

          {/* Progress + tiempo */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            style={{
              blockSize: 3,
              background: withAlpha(t3, 20),
              borderRadius: 2,
              overflow: "hidden",
              marginBlockEnd: 8,
            }}
          >
            <motion.div
              initial={{ inlineSize: 0 }}
              animate={{ inlineSize: `${progress}%` }}
              transition={reduced ? { duration: 0 } : { duration: 0.3, ease: "linear" }}
              style={{ blockSize: "100%", background: brand.primary }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: t3, marginBlockEnd: 32 }}>
            <span>{formatTime(elapsedSec)}</span>
            <span style={{ color: t2 }}>de {formatTime(FULL_DURATION_SEC)}</span>
          </div>

          {/* Sprint 76 — eliminado "Detener y guardar". Antes el botón
              cambiaba a este texto después de 20s y permitía guardar
              datos incompletos que contaminaban el histórico. Ahora SOLO
              "Cancelar" hasta que la medición termine sola en 60s. */}
          <button
            onClick={handleStop}
            aria-label="Cancelar medición"
            style={{
              minInlineSize: 120,
              paddingBlock: 10,
              paddingInline: 18,
              background: "transparent",
              color: t3,
              border: `1px solid ${bd}`,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 0.3,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </section>
        );
      })()}

      {phase === "done" && finalResult?.hrv && (() => {
        // Compute trend & interpretation vs personal baseline (excludes
        // current measurement — entry hasn't been saved yet).
        const hrvLog = useStore.getState().hrvLog || [];
        const baseline14d = buildHrvBaseline(hrvLog, 14);
        const insight = computeHrvInsight({
          currentLnRmssd: finalResult.hrv.lnRmssd,
          baseline14d,
        });
        return (
        <section aria-label="Resultado HRV" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div
            style={{
              background: cd,
              border: `1px solid ${bd}`,
              borderRadius: 16,
              padding: 24,
              marginBlockEnd: 16,
              textAlign: "center",
            }}
          >
            <div style={{ color: t3, fontSize: 12, marginBlockEnd: 8 }}>Medición completa</div>
            <div
              style={{
                color: brand.primary,
                fontFamily: MONO,
                fontSize: 56,
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: -1.5,
                textShadow: `0 0 24px ${withAlpha(brand.primary, 35)}`,
                marginBlockEnd: 4,
              }}
            >
              {finalResult.hrv.rmssd}
            </div>
            <div style={{ color: t3, fontSize: 12, marginBlockEnd: insight ? 12 : 20 }}>RMSSD (ms)</div>

            {/* Trend chip vs baseline 14d. Solo aparece con ≥5 entradas confiables previas. */}
            {insight && (
              <div
                aria-label={`Variación ${insight.deltaPctRmssd}% vs base 14 días`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: withAlpha(comparisonColor(insight.comparison), 12),
                  border: `1px solid ${withAlpha(comparisonColor(insight.comparison), 30)}`,
                  marginBlockEnd: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  color: t1,
                  letterSpacing: 0.2,
                }}
              >
                <span aria-hidden="true">{insight.deltaPctRmssd >= 0 ? "↑" : "↓"}</span>
                <span>
                  {insight.deltaPctRmssd >= 0 ? "+" : ""}{insight.deltaPctRmssd}% vs tu base 14d
                </span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Metric label="SDNN" value={`${finalResult.hrv.sdnn} ms`} color={t1} />
              <Metric label="pNN50" value={`${finalResult.hrv.pnn50}%`} color={t1} />
              <Metric label="HR media" value={`${Math.round(finalResult.hrv.meanHr)} bpm`} color={t1} />
              <Metric label="ln(RMSSD)" value={finalResult.hrv.lnRmssd} color={t1} />
            </div>

            {/* Interpretación humana — conecta el número con qué hacer hoy. */}
            {insight && (
              <p
                style={{
                  color: t2,
                  fontSize: 13,
                  lineHeight: 1.55,
                  marginBlockStart: 16,
                  marginBlockEnd: 0,
                  textAlign: "start",
                  paddingInline: 4,
                }}
              >
                {insight.label}
              </p>
            )}

            {finalResult.sqi && (
              <div style={{ marginBlockStart: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ inlineSize: 8, blockSize: 8, borderRadius: "50%", background: sqiColor(finalResult.sqi.band) }} />
                <span style={{ fontSize: 12, color: t2 }}>
                  Calidad: {sqiLabel(finalResult.sqi.band)} ({finalResult.sqi.score}/100)
                </span>
              </div>
            )}

            {finalResult.sqi && finalResult.sqi.score < 60 && (
              <p
                role="alert"
                style={{
                  marginBlockStart: 16,
                  padding: 12,
                  background: withAlpha(bioSignal.ignition, 10),
                  color: bioSignal.ignition,
                  fontSize: 12,
                  lineHeight: 1.5,
                  borderRadius: 8,
                  textAlign: "start",
                }}
              >
                Calidad de señal limitada. Repite con el dedo más firme sobre el lente + flash para mayor precisión.
              </p>
            )}
          </div>

          <details style={{ marginBlockEnd: 16, textAlign: "center" }}>
            <summary
              style={{
                color: t3,
                fontSize: 11,
                cursor: "pointer",
                listStyle: "none",
                display: "inline-block",
                userSelect: "none",
                opacity: 0.75,
              }}
            >
              Detalles técnicos
            </summary>
            <p style={{ color: t3, fontSize: 11, lineHeight: 1.6, marginBlockStart: 8, marginBlockEnd: 0 }}>
              Cámara PPG · 30 fps · Butterworth 0.7–4 Hz · filtfilt zero-phase · parabolic peak interpolation · Hampel ectopic filter · Task Force 1996
            </p>
          </details>

          {/* Si la calidad fue pobre, "Repetir" pasa a primario y "Guardar" a
              secundario — empuja al user al camino correcto sin bloquearle
              guardar si insiste. */}
          {(() => {
            const lowQuality = finalResult.sqi && finalResult.sqi.score < 60;
            const repeatBtn = (
              <button
                onClick={() => { setPhaseSafe("intro"); setFinalResult(null); setLive(null); setElapsedSec(0); }}
                aria-label="Repetir medición"
                style={{
                  flex: lowQuality ? 2 : 1,
                  minBlockSize: 48,
                  paddingBlock: 14,
                  background: lowQuality ? brand.primary : "transparent",
                  color: lowQuality ? "#fff" : t1,
                  border: lowQuality ? "none" : `1px solid ${bd}`,
                  borderRadius: 14,
                  fontSize: lowQuality ? 15 : 14,
                  fontWeight: lowQuality ? 700 : 600,
                  letterSpacing: lowQuality ? -0.1 : 0,
                  cursor: "pointer",
                }}
              >
                Repetir
              </button>
            );
            const saveBtn = (
              <button
                onClick={handleSave}
                aria-label="Guardar medición HRV en historial"
                style={{
                  flex: lowQuality ? 1 : 2,
                  minBlockSize: 48,
                  paddingBlock: 14,
                  background: lowQuality ? "transparent" : brand.primary,
                  color: lowQuality ? t1 : "#fff",
                  border: lowQuality ? `1px solid ${bd}` : "none",
                  borderRadius: 14,
                  fontSize: lowQuality ? 14 : 15,
                  fontWeight: lowQuality ? 600 : 700,
                  letterSpacing: lowQuality ? 0 : -0.1,
                  cursor: "pointer",
                }}
              >
                {lowQuality ? "Guardar igual" : "Guardar"}
              </button>
            );
            return (
              <div style={{ display: "flex", gap: 8 }}>
                {lowQuality ? <>{saveBtn}{repeatBtn}</> : <>{repeatBtn}{saveBtn}</>}
              </div>
            );
          })()}
        </section>
        );
      })()}

      {phase === "saved" && finalResult?.hrv && (
        <section
          aria-label="Medición guardada"
          role="status"
          aria-live="polite"
          style={{
            maxInlineSize: 420,
            marginInline: "auto",
            marginBlockStart: 60,
            textAlign: "center",
          }}
        >
          <motion.div
            initial={reduced ? { opacity: 1 } : { scale: 0.5, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              inlineSize: 88,
              blockSize: 88,
              borderRadius: "50%",
              marginInline: "auto",
              marginBlockEnd: 24,
              background: withAlpha(brand.primary, 14),
              border: `2px solid ${brand.primary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: brand.primary,
              boxShadow: `0 0 32px ${withAlpha(brand.primary, 30)}`,
            }}
          >
            <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
              <motion.path
                d="M5 12.5 L10 17.5 L19 7.5"
                fill="none"
                stroke={brand.primary}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={reduced ? { duration: 0 } : { duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
          </motion.div>
          <h3
            style={{
              color: t1,
              fontSize: 19,
              fontWeight: font.weight.black,
              letterSpacing: -0.3,
              margin: 0,
              marginBlockEnd: 8,
            }}
          >
            Guardado en tu historial
          </h3>
          <p style={{ color: t2, fontSize: 14, lineHeight: 1.5, margin: 0, marginBlockEnd: 24 }}>
            RMSSD {finalResult.hrv.rmssd} ms · {Math.round(finalResult.hrv.meanHr)} bpm
          </p>
          {/* Sprint 73 — botón explícito. Antes solo había auto-close
              setTimeout(1500). Si el user quería salir antes, no había
              forma obvia (la X del header podía no ser visible en
              algunos viewport mobile). Ahora hay un CTA claro. */}
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Cerrar y volver"
            style={{
              minBlockSize: 48,
              paddingBlock: 14,
              paddingInline: 32,
              background: brand.primary,
              color: colors.bg.base,
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: -0.1,
              cursor: "pointer",
            }}
          >
            Continuar
          </button>
        </section>
      )}

      {phase === "error" && error && (
        <div role="alert" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div
            style={{
              background: withAlpha(bioSignal.plasmaPink, 10),
              border: `1px solid ${withAlpha(bioSignal.plasmaPink, 30)}`,
              borderRadius: 12,
              padding: 16,
              marginBlockEnd: 16,
            }}
          >
            <p style={{ color: bioSignal.plasmaPink, fontSize: 13, fontWeight: 500, margin: 0, marginBlockEnd: 4 }}>
              Error
            </p>
            <p style={{ color: t1, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{error}</p>
          </div>
          <button
            onClick={() => { setPhaseSafe("intro"); setError(null); }}
            style={{
              inlineSize: "100%",
              minBlockSize: 44,
              paddingBlock: 12,
              background: "transparent",
              color: t1,
              border: `1px solid ${bd}`,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Ilustración SVG estilizada del setup. Variantes:
 *   - "torch":         trasera + flash LED (Android default)
 *   - "screen-light":  frontal + pantalla emite luz (iOS recomendado)
 *
 * Diseño: ~120×160 px, monoline + un acento de color, sin texto.
 * El "dedo" se representa como un óvalo overlapping sobre la zona de la cámara.
 */
function PhoneIllustration({ mode = "torch", t1, t3, accent }) {
  const stroke = t1;
  const muted = t3;
  const glow = accent || "#ef4444";

  if (mode === "screen-light") {
    return (
      <svg
        viewBox="0 0 120 160"
        width="100"
        height="134"
        aria-hidden="true"
        style={{ display: "block", marginInline: "auto" }}
      >
        {/* glow rays from screen radiating up to finger */}
        <g opacity="0.45">
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={60}
              y1={50}
              x2={60 + (i - 2) * 14}
              y2={20}
              stroke={glow}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          ))}
        </g>
        {/* phone body */}
        <rect x="14" y="6" width="92" height="148" rx="14" ry="14" fill="none" stroke={stroke} strokeWidth="2" />
        {/* notch / dynamic island */}
        <rect x="48" y="10" width="24" height="6" rx="3" fill={stroke} opacity="0.85" />
        {/* front camera dot */}
        <circle cx="60" cy="13" r="1.6" fill={muted} />
        {/* screen surface — soft white */}
        <rect x="20" y="22" width="80" height="120" rx="8" fill={glow} opacity="0.07" />
        {/* finger overlay (oval) covering top center / camera area */}
        <ellipse cx="60" cy="16" rx="22" ry="14" fill={muted} opacity="0.55" />
        {/* fingertip ridge — subtle highlight */}
        <ellipse cx="60" cy="11" rx="13" ry="3" fill={stroke} opacity="0.18" />
      </svg>
    );
  }

  if (mode === "ambient") {
    return (
      <svg
        viewBox="0 0 140 160"
        width="116"
        height="134"
        aria-hidden="true"
        style={{ display: "block", marginInline: "auto" }}
      >
        {/* sun/lamp on the right */}
        <g opacity="0.7">
          <circle cx="120" cy="34" r="9" fill={glow} opacity="0.25" />
          <circle cx="120" cy="34" r="5" fill={glow} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const r = (deg * Math.PI) / 180;
            const x1 = 120 + Math.cos(r) * 9;
            const y1 = 34 + Math.sin(r) * 9;
            const x2 = 120 + Math.cos(r) * 14;
            const y2 = 34 + Math.sin(r) * 14;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={glow}
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            );
          })}
        </g>
        {/* phone body (rear view) */}
        <rect x="20" y="6" width="76" height="148" rx="12" ry="12" fill="none" stroke={stroke} strokeWidth="2" />
        {/* rear camera lens */}
        <circle cx="44" cy="28" r="8" fill="none" stroke={stroke} strokeWidth="1.6" />
        <circle cx="44" cy="28" r="4" fill={stroke} opacity="0.4" />
        {/* finger overlay */}
        <ellipse cx="44" cy="32" rx="18" ry="12" fill={muted} opacity="0.55" />
        <ellipse cx="44" cy="26" rx="10" ry="2.5" fill={stroke} opacity="0.18" />
      </svg>
    );
  }

  // torch (Android default — back camera + LED flash)
  return (
    <svg
      viewBox="0 0 120 160"
      width="100"
      height="134"
      aria-hidden="true"
      style={{ display: "block", marginInline: "auto" }}
    >
      {/* flash glow */}
      <circle cx="62" cy="42" r="14" fill={glow} opacity="0.18" />
      {/* phone body (rear view) */}
      <rect x="14" y="6" width="92" height="148" rx="14" ry="14" fill="none" stroke={stroke} strokeWidth="2" />
      {/* rear camera lens (left) */}
      <circle cx="44" cy="28" r="8" fill="none" stroke={stroke} strokeWidth="1.6" />
      <circle cx="44" cy="28" r="4" fill={stroke} opacity="0.4" />
      {/* flash LED (right) */}
      <circle cx="62" cy="42" r="3.5" fill={glow} />
      <circle cx="62" cy="42" r="3.5" fill="none" stroke={stroke} strokeWidth="1.2" />
      {/* finger overlay covering both lens + flash */}
      <ellipse cx="53" cy="34" rx="26" ry="14" fill={muted} opacity="0.55" />
      <ellipse cx="53" cy="28" rx="14" ry="3" fill={stroke} opacity="0.18" />
    </svg>
  );
}

function ModeButton({ primary, recommended, disabled, onClick, title, subtitle, t1, t2, t3, bd }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        inlineSize: "100%",
        padding: "14px 16px",
        background: primary ? withAlpha(brand.primary, 8) : "transparent",
        color: t1,
        border: `1.5px solid ${primary ? withAlpha(brand.primary, 45) : bd}`,
        borderRadius: 14,
        textAlign: "start",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.1 }}>{title}</span>
        {recommended && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: brand.primary,
              background: withAlpha(brand.primary, 12),
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Recomendado
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: t2 }}>{subtitle}</div>
    </button>
  );
}

function Waveform({ values, color, height = 40 }) {
  const w = 320;
  const h = height;
  if (!values || values.length < 2) return null;
  let min = Infinity, max = -Infinity;
  for (const v of values) { if (v < min) min = v; if (v > max) max = v; }
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = (i * step).toFixed(1);
    const y = (h - ((v - min) / range) * h * 0.9 - h * 0.05).toFixed(1);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      aria-hidden="true"
      style={{ display: "block", marginBlockStart: 8 }}
    >
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Metric({ label, value, color }) {
  return (
    <div
      role="group"
      aria-label={`${label}: ${value}`}
      style={{
        padding: 12,
        background: "rgba(127, 127, 127, .05)",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div style={{ color, fontFamily: MONO, fontSize: 14, fontWeight: 500, letterSpacing: -0.2 }}>
        {value}
      </div>
      <div style={{ color: "rgba(127,127,127,.8)", fontSize: 11, marginBlockStart: 3 }}>
        {label}
      </div>
    </div>
  );
}

function comparisonColor(comp) {
  if (comp === "above") return bioSignal.coherence ?? "#3b82f6";
  if (comp === "near") return brand.primary;
  if (comp === "below") return bioSignal.ignition ?? "#f59e0b";
  return bioSignal.plasmaPink ?? "#ef4444";
}

function sqiColor(band) {
  if (band === "excellent") return bioSignal.coherence ?? "#3b82f6";
  if (band === "good") return brand.primary;
  if (band === "marginal") return bioSignal.ignition ?? "#f59e0b";
  return bioSignal.plasmaPink ?? "#ef4444";
}

function sqiLabel(band) {
  if (band === "excellent") return "Excelente";
  if (band === "good") return "Buena";
  if (band === "marginal") return "Marginal";
  return "Pobre";
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
