"use client";
/* ═══════════════════════════════════════════════════════════════
   HRV MONITOR — Web Bluetooth → RR intervals → live HRV
   Compatible with Polar H10, Wahoo TICKR, Garmin HRM-Dual, CooSpo.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";
import { isBleSupported, createHrvSession } from "../lib/ble-hrv";
import { hrvSummary } from "../lib/hrv";

const FULL_DURATION_SEC = 300;
const QUICK_DURATION_SEC = 60;

export default function HRVMonitor({ show, isDark, onClose, onComplete, quickMode = false }) {
  const TARGET_DURATION_SEC = quickMode ? QUICK_DURATION_SEC : FULL_DURATION_SEC;
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [phase, setPhase] = useState("intro");
  const [deviceName, setDeviceName] = useState(null);
  const [battery, setBattery] = useState(null);
  const [liveHr, setLiveHr] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [rrBuffer, setRrBuffer] = useState([]);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const sessionRef = useRef(null);
  const bleAvailable = typeof window !== "undefined" && isBleSupported();

  useEffect(() => () => {
    try { sessionRef.current?.disconnect?.(); } catch {}
  }, []);

  async function handleConnect() {
    setError(null);
    setPhase("connecting");
    const session = createHrvSession({
      onConnect: (info) => {
        setDeviceName(info.name);
        setPhase("measuring");
        announce(`Conectado a ${info.name}. Empieza la medición.`);
      },
      onSample: ({ hr, rrBuffer: buf, elapsedSec }) => {
        setLiveHr(hr);
        setRrBuffer(buf);
        setElapsedSec(elapsedSec);
        if (elapsedSec >= TARGET_DURATION_SEC) {
          finish(buf);
        }
      },
      onBattery: (level) => setBattery(level),
      onDisconnect: () => {
        if (phase === "measuring") {
          setError("Se perdió la conexión con el sensor. Reconecta para reintentar.");
          setPhase("error");
        }
      },
      onError: (e) => {
        if (e.code === "CANCELLED") { setPhase("intro"); return; }
        setError(e.message || "No se pudo conectar.");
        setPhase("error");
      },
    });
    sessionRef.current = session;
    try { await session.connect(); } catch { /* handled in onError */ }
  }

  function finish(buffer) {
    const summary = hrvSummary(buffer);
    setResult(summary);
    setPhase("done");
    try { sessionRef.current?.disconnect?.(); } catch {}
    announce(`Medición completa. RMSSD ${summary.rmssd} ms.`);
  }

  function handleStop() {
    if (rrBuffer.length >= 30) finish(rrBuffer);
    else {
      try { sessionRef.current?.disconnect?.(); } catch {}
      setPhase("intro");
    }
  }

  function handleSave() {
    if (!result?.valid) return;
    onComplete?.({
      ts: Date.now(),
      rmssd: result.rmssd,
      lnRmssd: result.lnRmssd,
      sdnn: result.sdnn,
      pnn50: result.pnn50,
      meanHR: result.meanHR,
      rhr: Math.round(result.meanHR),
      n: result.n,
      durationSec: result.durationSec,
    });
    onClose?.();
  }

  if (!show) return null;

  const progress = Math.min(100, (elapsedSec / TARGET_DURATION_SEC) * 100);

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
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 24 }}>
        <h2 id={titleId} style={{ fontSize: 18, fontWeight: font.weight.black, color: t1, margin: 0 }}>
          Medición HRV
        </h2>
        <button
          onClick={onClose}
          aria-label="Cerrar medición HRV"
          style={{
            border: "none",
            background: "transparent",
            color: t2,
            padding: 8,
            cursor: "pointer",
          }}
        >
          <Icon name="close" size={20} color={t2} aria-hidden="true" />
        </button>
      </header>

      {phase === "intro" && (
        <section aria-label="Preparación" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 16, padding: 20, marginBlockEnd: 16 }}>
            <p style={{ color: t1, fontSize: 14, lineHeight: 1.6, margin: 0, marginBlockEnd: 12 }}>
              Conecta un sensor de frecuencia cardíaca compatible (Polar H10, Wahoo TICKR, Garmin HRM-Dual u otro BLE con Heart Rate Service).
            </p>
            <p style={{ color: t2, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Siéntate cómodo, con la espalda recta. Mantén la medición durante 5 minutos en reposo para una lectura fiable (Task Force 1996, estándar clínico).
            </p>
          </div>

          {!bleAvailable && (
            <div
              role="alert"
              style={{
                background: withAlpha(semantic.warning, 10),
                border: `1px solid ${withAlpha(semantic.warning, 30)}`,
                borderRadius: 12,
                padding: 14,
                marginBlockEnd: 16,
              }}
            >
              <p style={{ color: semantic.warning, fontSize: 12, margin: 0, fontWeight: 700 }}>
                Web Bluetooth no está disponible.
              </p>
              <p style={{ color: t2, fontSize: 11, margin: 0, marginBlockStart: 6, lineHeight: 1.5 }}>
                Usa Chrome, Edge u Opera en desktop/Android con HTTPS. iOS Safari no soporta Web Bluetooth (Apple restriction).
              </p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={!bleAvailable}
            aria-label="Conectar sensor de frecuencia cardíaca"
            style={{
              inlineSize: "100%",
              paddingBlock: 14,
              background: bleAvailable ? brand.primary : bd,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: font.weight.black,
              letterSpacing: 1,
              textTransform: "uppercase",
              cursor: bleAvailable ? "pointer" : "not-allowed",
            }}
          >
            Conectar sensor
          </button>

          <details style={{ marginBlockStart: 24 }}>
            <summary style={{ color: t3, fontSize: 11, cursor: "pointer" }}>Dispositivos probados</summary>
            <ul style={{ color: t3, fontSize: 11, lineHeight: 1.7, marginBlockStart: 8 }}>
              <li>Polar H10, H9, OH1, Verity Sense</li>
              <li>Wahoo TICKR, TICKR X</li>
              <li>Garmin HRM-Dual, HRM-Pro</li>
              <li>CooSpo H6, H808S</li>
              <li>Cualquier strap BLE 4.0+ con Heart Rate Service estándar</li>
            </ul>
          </details>
        </section>
      )}

      {phase === "connecting" && (
        <div role="status" aria-live="polite" style={{ textAlign: "center", padding: 40 }}>
          <motion.div
            animate={reduced ? {} : { rotate: 360 }}
            transition={reduced ? {} : { duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              display: "inline-block",
              inlineSize: 48,
              blockSize: 48,
              border: `3px solid ${bd}`,
              borderBlockStartColor: brand.primary,
              borderRadius: "50%",
              marginBlockEnd: 16,
            }}
          />
          <p style={{ color: t2, fontSize: 13 }}>Esperando sensor…</p>
        </div>
      )}

      {phase === "measuring" && (
        <section aria-label="Medición en curso" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 16, padding: 20, marginBlockEnd: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBlockEnd: 12 }}>
              <span style={{ color: t3, fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                {deviceName || "Sensor"}
              </span>
              {battery !== null && (
                <span style={{ color: t3, fontSize: 10, fontWeight: 700 }}>
                  Batería {battery}%
                </span>
              )}
            </div>

            <div style={{ textAlign: "center", marginBlockEnd: 20 }}>
              <div style={{ color: brand.primary, fontSize: 56, fontWeight: font.weight.black, lineHeight: 1 }}>
                {liveHr || "--"}
              </div>
              <div style={{ color: t3, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBlockStart: 4 }}>
                BPM en vivo
              </div>
            </div>

            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label={`Progreso de medición: ${Math.round(elapsedSec)} de ${TARGET_DURATION_SEC} segundos`}
              style={{ blockSize: 6, background: bd, borderRadius: 3, overflow: "hidden", marginBlockEnd: 8 }}
            >
              <div style={{ blockSize: "100%", inlineSize: `${progress}%`, background: brand.primary, transition: "inline-size .3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t2 }}>
              <span>{formatTime(elapsedSec)}</span>
              <span>{formatTime(TARGET_DURATION_SEC)}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBlockStart: 16 }}>
              <Metric label="Latidos" value={rrBuffer.length} color={t2} />
              <Metric label="Duración" value={`${Math.round(elapsedSec)}s`} color={t2} />
            </div>
          </div>

          <button
            onClick={handleStop}
            aria-label="Detener medición antes de tiempo"
            style={{
              inlineSize: "100%",
              paddingBlock: 12,
              background: "transparent",
              color: t2,
              border: `1px solid ${bd}`,
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Detener {rrBuffer.length >= 30 ? "(guardará lo medido)" : "(descartar)"}
          </button>
        </section>
      )}

      {phase === "done" && result && (
        <section aria-label="Resultado HRV" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div style={{ background: cd, border: `1px solid ${bd}`, borderRadius: 16, padding: 20, marginBlockEnd: 16 }}>
            <div style={{ textAlign: "center", marginBlockEnd: 20 }}>
              <div style={{ color: brand.primary, fontSize: 48, fontWeight: font.weight.black, lineHeight: 1 }}>
                {result.rmssd}
              </div>
              <div style={{ color: t3, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBlockStart: 4 }}>
                RMSSD · ms
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Metric label="SDNN" value={`${result.sdnn} ms`} color={t1} />
              <Metric label="pNN50" value={`${result.pnn50}%`} color={t1} />
              <Metric label="HR media" value={`${result.meanHR} bpm`} color={t1} />
              <Metric label="ln(RMSSD)" value={result.lnRmssd} color={t1} />
            </div>

            {!result.valid && (
              <p
                role="alert"
                style={{
                  marginBlockStart: 16,
                  padding: 12,
                  background: withAlpha(semantic.warning, 10),
                  color: semantic.warning,
                  fontSize: 11,
                  borderRadius: 8,
                }}
              >
                Medición corta (&lt;60 s o &lt;30 latidos). El valor se guarda pero podría ser menos fiable.
              </p>
            )}

            <p style={{ marginBlockStart: 16, color: t3, fontSize: 10, lineHeight: 1.6 }}>
              Rango normativo de referencia (Shaffer &amp; Ginsberg 2017, 5-min en reposo): RMSSD 19-75 ms, SDNN 32-93 ms. Usa tu historial personal como referencia principal.
            </p>
          </div>

          <button
            onClick={handleSave}
            aria-label="Guardar medición HRV en historial"
            style={{
              inlineSize: "100%",
              paddingBlock: 14,
              background: brand.primary,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: font.weight.black,
              letterSpacing: 1,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Guardar medición
          </button>
        </section>
      )}

      {phase === "error" && error && (
        <div role="alert" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div
            style={{
              background: withAlpha(semantic.danger, 10),
              border: `1px solid ${withAlpha(semantic.danger, 30)}`,
              borderRadius: 12,
              padding: 16,
              marginBlockEnd: 16,
            }}
          >
            <p style={{ color: semantic.danger, fontSize: 12, fontWeight: 700, margin: 0 }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => { setPhase("intro"); setError(null); }}
            style={{
              inlineSize: "100%",
              paddingBlock: 12,
              background: "transparent",
              color: t1,
              border: `1px solid ${bd}`,
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
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

function Metric({ label, value, color }) {
  return (
    <div
      role="group"
      aria-label={`${label}: ${value}`}
      style={{
        padding: 10,
        background: "rgba(127, 127, 127, .05)",
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div style={{ color, fontSize: 14, fontWeight: font.weight.black }}>{value}</div>
      <div style={{ color: "rgba(127,127,127,.8)", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", marginBlockStart: 2 }}>
        {label}
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
