"use client";
/* ═══════════════════════════════════════════════════════════════
   HRV MONITOR — Web Bluetooth → RR intervals → live HRV
   Compatible with Polar H10, Wahoo TICKR, Garmin HRM-Dual, CooSpo.

   Elevado a identidad BIO-IGNICIÓN: frame con corner brackets,
   mono blueprint en kickers y números, gradientes bio-signal,
   44-min tap targets y errores en plasmaPink.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand, bioSignal } from "../lib/theme";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";
import { isBleSupported, createHrvSession } from "../lib/ble-hrv";
import { hrvSummary } from "../lib/hrv";

const FULL_DURATION_SEC = 300;
const QUICK_DURATION_SEC = 60;
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function CornerBrackets({ color, size = 10 }) {
  const L = size;
  const common = { position: "absolute", inlineSize: L, blockSize: L, pointerEvents: "none" };
  return (
    <>
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 6, insetBlockStart: 6, borderInlineStart: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 6, insetBlockStart: 6, borderInlineEnd: `1px solid ${color}`, borderBlockStart: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineStart: 6, insetBlockEnd: 6, borderInlineStart: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
      <span aria-hidden="true" style={{ ...common, insetInlineEnd: 6, insetBlockEnd: 6, borderInlineEnd: `1px solid ${color}`, borderBlockEnd: `1px solid ${color}` }} />
    </>
  );
}

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
  const cornerStroke = withAlpha(brand.primary, isDark ? 32 : 26);
  const errorStroke = withAlpha(bioSignal.plasmaPink, isDark ? 42 : 32);

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
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBlockEnd: 24, maxInlineSize: 500, marginInline: "auto" }}>
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: 3,
              color: brand.primary,
              textTransform: "uppercase",
              marginBlockEnd: 2,
              opacity: 0.9,
            }}
          >
            ▸ Sensor · Biometría
          </div>
          <h2
            id={titleId}
            style={{
              fontSize: 20,
              fontWeight: font.weight.black,
              color: t1,
              margin: 0,
              letterSpacing: -0.3,
            }}
          >
            Medición HRV
          </h2>
        </div>
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

      {phase === "intro" && (
        <section aria-label="Preparación" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div
            style={{
              position: "relative",
              background: cd,
              border: `1px solid ${bd}`,
              borderRadius: 16,
              padding: 20,
              marginBlockEnd: 16,
              overflow: "hidden",
            }}
          >
            <CornerBrackets color={cornerStroke} />
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: 3,
                color: brand.primary,
                textTransform: "uppercase",
                marginBlockEnd: 8,
                opacity: 0.85,
              }}
            >
              ▸ Protocolo · Task Force {quickMode ? "60s" : "5-min"}
            </div>
            <p style={{ color: t1, fontSize: 14, lineHeight: 1.6, margin: 0, marginBlockEnd: 12 }}>
              Conecta un sensor de frecuencia cardíaca compatible (Polar H10, Wahoo TICKR, Garmin HRM-Dual u otro BLE con Heart Rate Service).
            </p>
            <p style={{ color: t2, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              Siéntate cómodo, con la espalda recta. Mantén la medición durante {quickMode ? "1 minuto" : "5 minutos"} en reposo para una lectura fiable (Task Force 1996, estándar clínico).
            </p>
          </div>

          {!bleAvailable && (
            <div
              role="alert"
              style={{
                position: "relative",
                background: withAlpha(bioSignal.ignition, 10),
                border: `1px solid ${withAlpha(bioSignal.ignition, 40)}`,
                borderRadius: 12,
                padding: 14,
                marginBlockEnd: 16,
                overflow: "hidden",
              }}
            >
              <CornerBrackets color={withAlpha(bioSignal.ignition, 50)} size={8} />
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: bioSignal.ignition,
                  margin: 0,
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                ▸ Web Bluetooth no disponible
              </p>
              <p style={{ color: t2, fontSize: 11, margin: 0, marginBlockStart: 6, lineHeight: 1.5 }}>
                Usa Chrome, Edge u Opera en desktop/Android con HTTPS. iOS Safari no soporta Web Bluetooth (restricción de Apple).
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleConnect}
            disabled={!bleAvailable}
            aria-label="Conectar sensor de frecuencia cardíaca"
            style={{
              inlineSize: "100%",
              minBlockSize: 48,
              paddingBlock: 14,
              background: bleAvailable
                ? `linear-gradient(135deg, ${brand.primary}, ${bioSignal.phosphorCyan})`
                : bd,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: bleAvailable ? "pointer" : "not-allowed",
              opacity: bleAvailable ? 1 : 0.55,
              boxShadow: bleAvailable ? `0 12px 30px -14px ${withAlpha(brand.primary, 90)}` : "none",
            }}
          >
            ▸ Conectar sensor
          </button>

          <details style={{ marginBlockStart: 24 }}>
            <summary
              style={{
                fontFamily: MONO,
                color: t3,
                fontSize: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              ▸ Dispositivos probados
            </summary>
            <ul style={{ color: t3, fontSize: 11, lineHeight: 1.7, marginBlockStart: 8, paddingInlineStart: 18 }}>
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
        <div
          role="status"
          aria-live="polite"
          style={{ textAlign: "center", padding: 40, maxInlineSize: 500, marginInline: "auto" }}
        >
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
              boxShadow: `0 0 20px ${withAlpha(brand.primary, 30)}`,
            }}
          />
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: 3,
              color: brand.primary,
              textTransform: "uppercase",
              marginBlockEnd: 4,
            }}
          >
            ▸ Handshake
          </div>
          <p style={{ color: t2, fontSize: 13, margin: 0 }}>Esperando sensor…</p>
        </div>
      )}

      {phase === "measuring" && (
        <section aria-label="Medición en curso" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div
            style={{
              position: "relative",
              background: cd,
              border: `1px solid ${bd}`,
              borderRadius: 16,
              padding: 20,
              marginBlockEnd: 16,
              overflow: "hidden",
            }}
          >
            <CornerBrackets color={cornerStroke} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBlockEnd: 16,
                paddingBlockEnd: 10,
                borderBlockEnd: `1px dashed ${withAlpha(brand.primary, isDark ? 22 : 16)}`,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  color: t3,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                ▸ {deviceName || "Sensor"}
              </span>
              {battery !== null && (
                <span
                  style={{
                    fontFamily: MONO,
                    color: battery < 20 ? bioSignal.plasmaPink : t3,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                  }}
                >
                  BAT · {battery}%
                </span>
              )}
            </div>

            <div style={{ textAlign: "center", marginBlockEnd: 20 }}>
              <motion.div
                animate={reduced || !liveHr ? {} : { scale: [1, 1.04, 1] }}
                transition={reduced || !liveHr ? {} : { duration: 60 / (liveHr || 60), repeat: Infinity, ease: "easeInOut" }}
                style={{
                  color: brand.primary,
                  fontFamily: MONO,
                  fontSize: 56,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: -1.5,
                  textShadow: liveHr ? `0 0 24px ${withAlpha(brand.primary, 40)}` : "none",
                }}
              >
                {liveHr || "--"}
              </motion.div>
              <div
                style={{
                  fontFamily: MONO,
                  color: t3,
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  marginBlockStart: 6,
                }}
              >
                ▸ BPM · En vivo
              </div>
            </div>

            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label={`Progreso de medición: ${Math.round(elapsedSec)} de ${TARGET_DURATION_SEC} segundos`}
              style={{
                position: "relative",
                blockSize: 6,
                background: withAlpha(brand.primary, isDark ? 14 : 10),
                borderRadius: 3,
                overflow: "hidden",
                marginBlockEnd: 8,
              }}
            >
              <motion.div
                initial={{ inlineSize: 0 }}
                animate={{ inlineSize: `${progress}%` }}
                transition={reduced ? { duration: 0 } : { duration: 0.3, ease: "linear" }}
                style={{
                  blockSize: "100%",
                  background: `linear-gradient(90deg, ${brand.primary}, ${bioSignal.phosphorCyan})`,
                  borderRadius: 3,
                  boxShadow: `0 0 10px ${withAlpha(brand.primary, 60)}`,
                }}
              />
              {[25, 50, 75].map((pct) => (
                <span
                  key={pct}
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    insetInlineStart: `${pct}%`,
                    insetBlockStart: 0,
                    inlineSize: 1,
                    blockSize: "100%",
                    background: withAlpha(isDark ? "#FFFFFF" : "#000000", 18),
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: 1,
                color: t2,
              }}
            >
              <span>{formatTime(elapsedSec)}</span>
              <span>{formatTime(TARGET_DURATION_SEC)}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBlockStart: 16 }}>
              <Metric label="Latidos" value={rrBuffer.length} color={t1} />
              <Metric label="Duración" value={`${Math.round(elapsedSec)}s`} color={t1} />
            </div>
          </div>

          <button
            onClick={handleStop}
            aria-label="Detener medición antes de tiempo"
            style={{
              inlineSize: "100%",
              minBlockSize: 44,
              paddingBlock: 12,
              background: "transparent",
              color: t2,
              border: `1px solid ${bd}`,
              borderRadius: 12,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            ▸ Detener {rrBuffer.length >= 30 ? "· Guardar" : "· Descartar"}
          </button>
        </section>
      )}

      {phase === "done" && result && (
        <section aria-label="Resultado HRV" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div
            style={{
              position: "relative",
              background: cd,
              border: `1px solid ${bd}`,
              borderRadius: 16,
              padding: 20,
              marginBlockEnd: 16,
              overflow: "hidden",
            }}
          >
            <CornerBrackets color={cornerStroke} />

            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: 3,
                color: brand.primary,
                textTransform: "uppercase",
                textAlign: "center",
                marginBlockEnd: 6,
                opacity: 0.9,
              }}
            >
              ▸ Registro completo
            </div>

            <div style={{ textAlign: "center", marginBlockEnd: 20 }}>
              <div
                style={{
                  color: brand.primary,
                  fontFamily: MONO,
                  fontSize: 48,
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: -1.5,
                  textShadow: `0 0 24px ${withAlpha(brand.primary, 40)}`,
                }}
              >
                {result.rmssd}
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  color: t3,
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  marginBlockStart: 6,
                }}
              >
                ▸ RMSSD · ms
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
                  background: withAlpha(bioSignal.ignition, 10),
                  color: bioSignal.ignition,
                  fontFamily: MONO,
                  fontSize: 11,
                  lineHeight: 1.5,
                  letterSpacing: 0.3,
                  borderRadius: 8,
                  border: `1px solid ${withAlpha(bioSignal.ignition, 30)}`,
                }}
              >
                ▸ Medición corta (&lt;60 s o &lt;30 latidos). El valor se guarda pero podría ser menos fiable.
              </p>
            )}

            <p
              style={{
                marginBlockStart: 16,
                fontFamily: MONO,
                color: t3,
                fontSize: 9,
                letterSpacing: 0.5,
                lineHeight: 1.6,
                textTransform: "uppercase",
              }}
            >
              ▸ Referencia · Shaffer &amp; Ginsberg 2017 · 5-min reposo · RMSSD 19-75 ms · SDNN 32-93 ms
            </p>
          </div>

          <button
            onClick={handleSave}
            aria-label="Guardar medición HRV en historial"
            style={{
              inlineSize: "100%",
              minBlockSize: 48,
              paddingBlock: 14,
              background: `linear-gradient(135deg, ${brand.primary}, ${bioSignal.phosphorCyan})`,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: `0 12px 30px -14px ${withAlpha(brand.primary, 90)}`,
            }}
          >
            ▸ Guardar medición
          </button>
        </section>
      )}

      {phase === "error" && error && (
        <div role="alert" style={{ maxInlineSize: 500, marginInline: "auto" }}>
          <div
            style={{
              position: "relative",
              background: withAlpha(bioSignal.plasmaPink, 10),
              border: `1px solid ${withAlpha(bioSignal.plasmaPink, 35)}`,
              borderRadius: 12,
              padding: 16,
              marginBlockEnd: 16,
              overflow: "hidden",
            }}
          >
            <CornerBrackets color={errorStroke} size={8} />
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: 3,
                color: bioSignal.plasmaPink,
                textTransform: "uppercase",
                marginBlockEnd: 6,
                fontWeight: 700,
              }}
            >
              ▸ Error
            </div>
            <p
              style={{
                color: t1,
                fontSize: 12,
                fontWeight: 600,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          </div>
          <button
            onClick={() => { setPhase("intro"); setError(null); }}
            style={{
              inlineSize: "100%",
              minBlockSize: 44,
              paddingBlock: 12,
              background: "transparent",
              color: t1,
              border: `1px solid ${bd}`,
              borderRadius: 12,
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            ▸ Reintentar
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
        position: "relative",
        padding: 12,
        background: "rgba(127, 127, 127, .05)",
        border: `1px solid ${withAlpha(brand.primary, 10)}`,
        borderRadius: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          color,
          fontFamily: MONO,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: -0.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: MONO,
          color: "rgba(127,127,127,.8)",
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBlockStart: 3,
        }}
      >
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
