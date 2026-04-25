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

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand, bioSignal } from "../lib/theme";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";
import { createCameraCapture, createStreamingAnalyzer } from "../lib/hrv-camera/capture";

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
  const { bg: bgN, card: cdN, border: bdN, t1: t1N, t2: t2N, t3: t3N } = resolveTheme(isDark);
  const lightPalette = resolveTheme(false);
  const bg = screenLightActive ? "#ffffff" : bgN;
  const cd = screenLightActive ? lightPalette.card : cdN;
  const bd = screenLightActive ? lightPalette.border : bdN;
  const t1 = screenLightActive ? lightPalette.t1 : t1N;
  const t2 = screenLightActive ? lightPalette.t2 : t2N;
  const t3 = screenLightActive ? lightPalette.t3 : t3N;

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
    // Durante settling o <20s de medición: cancelar limpio al intro.
    // Tras >=20s: guardar parcial (mejor un dato marginal que perder el esfuerzo).
    if (phaseRef.current === "measuring" && elapsedSec >= 20) {
      finish();
      return;
    }
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
    onClose?.();
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
        background: bg,
        zIndex: 220,
        padding: 20,
        paddingBlockStart: 40,
        overflowY: "auto",
        inlineSize: "100%",
      }}
    >
      {phase !== "measuring" && (
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 24, maxInlineSize: 500, marginInline: "auto" }}>
          <h2
            id={titleId}
            style={{
              fontSize: 22,
              fontWeight: font.weight.black,
              color: t1,
              margin: 0,
              letterSpacing: -0.4,
            }}
          >
            HRV con cámara
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar medición HRV"
            style={{
              border: "none",
              background: "transparent",
              color: t2,
              padding: 12,
              minInlineSize: 44,
              minBlockSize: 44,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={20} color={t2} aria-hidden="true" />
          </button>
        </header>
      )}

      {phase === "intro" && (
        <section aria-label="Preparación" style={{ maxInlineSize: 500, marginInline: "auto" }}>
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
              <p style={{ color: bioSignal.ignition, fontSize: 13, fontWeight: 700, margin: 0, marginBlockEnd: 4 }}>
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
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
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
              fontWeight: 600,
              color: live?.fingerOk ? brand.primary : bioSignal.ignition,
            }}
          >
            {settlingCountdown != null && settlingCountdown > 0 ? settlingCountdown : (live?.fingerOk ? "●" : "·")}
          </motion.div>
          <p
            role="status"
            aria-live="polite"
            style={{ color: t1, fontSize: 17, lineHeight: 1.5, margin: 0, marginBlockEnd: 8, fontWeight: 600 }}
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
                fontWeight: 600,
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

      {phase === "measuring" && (
        <section
          aria-label="Medición en curso"
          style={{
            maxInlineSize: 420,
            marginInline: "auto",
            marginBlockStart: 40,
            textAlign: "center",
          }}
        >
          <motion.div
            animate={reduced || !liveHr ? {} : { scale: [1, 1.035, 1] }}
            transition={reduced || !liveHr ? {} : { duration: 60 / (liveHr || 60), repeat: Infinity, ease: "easeInOut" }}
            style={{
              color: t1,
              fontFamily: MONO,
              fontSize: 96,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: -3,
              marginBlockEnd: 8,
            }}
          >
            {liveHr || "--"}
          </motion.div>
          <div style={{ color: t3, fontSize: 12, letterSpacing: 0.5, marginBlockEnd: 32 }}>bpm</div>

          {/* Finger-placement warning + paused indicator. El reloj está
              congelado cuando paused=true → señalamos con texto claro. */}
          {paused && (
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
                marginBlockEnd: 16,
              }}
            >
              <span style={{ inlineSize: 8, blockSize: 8, borderRadius: "50%", background: bioSignal.ignition }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: t1 }}>
                Pausado — apoya el dedo para continuar
              </span>
            </div>
          )}

          {/* Waveform sparkline */}
          {live?.waveform && live.waveform.length > 10 && (
            <Waveform values={live.waveform} color={brand.primary} height={48} />
          )}

          {/* SQI chip */}
          {liveSqi && (
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
                marginBlockStart: 16,
                marginBlockEnd: 24,
              }}
            >
              <span style={{ inlineSize: 8, blockSize: 8, borderRadius: "50%", background: sqiColor(liveSqi.band) }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: t1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {sqiLabel(liveSqi.band)} · {liveSqi.score}
              </span>
            </div>
          )}

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
              marginBlockEnd: 10,
              marginBlockStart: 16,
            }}
          >
            <motion.div
              initial={{ inlineSize: 0 }}
              animate={{ inlineSize: `${progress}%` }}
              transition={reduced ? { duration: 0 } : { duration: 0.3, ease: "linear" }}
              style={{ blockSize: "100%", background: brand.primary }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 12, color: t3, marginBlockEnd: 32 }}>
            <span>{formatTime(elapsedSec)}</span>
            <span>{formatTime(FULL_DURATION_SEC)}</span>
          </div>

          {torchAvailable && (
            <button
              onClick={toggleTorch}
              aria-pressed={torchOn}
              aria-label={torchOn ? "Apagar flash" : "Encender flash"}
              style={{
                inlineSize: "100%",
                minBlockSize: 40,
                paddingBlock: 10,
                background: "transparent",
                color: t2,
                border: `1px solid ${bd}`,
                borderRadius: 10,
                fontSize: 12,
                cursor: "pointer",
                marginBlockEnd: 12,
              }}
            >
              {torchOn ? "Flash ON" : "Flash OFF"}
            </button>
          )}

          <button
            onClick={handleStop}
            aria-label="Detener medición antes de tiempo"
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
            {elapsedSec >= 20 ? "Detener y guardar" : "Cancelar"}
          </button>
        </section>
      )}

      {phase === "done" && finalResult?.hrv && (
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
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: -1.5,
                textShadow: `0 0 24px ${withAlpha(brand.primary, 35)}`,
                marginBlockEnd: 4,
              }}
            >
              {finalResult.hrv.rmssd}
            </div>
            <div style={{ color: t3, fontSize: 12, marginBlockEnd: 20 }}>RMSSD (ms)</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Metric label="SDNN" value={`${finalResult.hrv.sdnn} ms`} color={t1} />
              <Metric label="pNN50" value={`${finalResult.hrv.pnn50}%`} color={t1} />
              <Metric label="HR media" value={`${Math.round(finalResult.hrv.meanHr)} bpm`} color={t1} />
              <Metric label="ln(RMSSD)" value={finalResult.hrv.lnRmssd} color={t1} />
            </div>

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

          <p style={{ color: t3, fontSize: 11, lineHeight: 1.6, textAlign: "center", marginBlockEnd: 16 }}>
            Cámara PPG · 30 fps · fs=30 Hz · Butterworth 0.7–4 Hz · Task Force 1996
          </p>

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
            <p style={{ color: bioSignal.plasmaPink, fontSize: 13, fontWeight: 700, margin: 0, marginBlockEnd: 4 }}>
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
              fontWeight: 600,
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
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.1 }}>{title}</span>
        {recommended && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
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
      <div style={{ color, fontFamily: MONO, fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>
        {value}
      </div>
      <div style={{ color: "rgba(127,127,127,.8)", fontSize: 11, marginBlockStart: 3 }}>
        {label}
      </div>
    </div>
  );
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
