"use client";
/* ═══════════════════════════════════════════════════════════════
   HRV VALIDATION LAB — cámara vs BLE strap simultáneo
   ═══════════════════════════════════════════════════════════════
   Modo de validación honesto. El usuario apoya el dedo en la cámara
   Y lleva un strap BLE (Polar H10, Wahoo TICKR, etc.) AL MISMO TIEMPO.
   Medimos durante 60 s en paralelo y reportamos:

     — HR cámara vs HR BLE: diferencia, % error, dentro/fuera de
       tolerancia ±5%
     — RMSSD cámara vs RMSSD BLE: diferencia, % error, tolerancia ±30%
     — SDNN cámara vs SDNN BLE
     — Status: pass / fail según tolerancias clínicas estándar

   Múltiples sesiones se agregan vía aggregateValidationSessions →
   reporta MAE, Pearson r y Bland-Altman bias/LoA.

   Sin esto, cualquier claim de precisión vs ECG/strap es no-validado.
   Esta es LA herramienta de no-humo.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, font, brand, bioSignal } from "../lib/theme";
import { useReducedMotion, useFocusTrap, announce } from "../lib/a11y";
import { isBleSupported, createHrvSession } from "../lib/ble-hrv";
import { hrvSummary } from "../lib/hrv";
import { createCameraCapture, createStreamingAnalyzer } from "../lib/hrv-camera/capture";
import { compareMeasurements, aggregateValidationSessions } from "../lib/hrv-camera/validation";

const DURATION_SEC = 60;
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const STORAGE_KEY = "bio-validation-sessions";

function loadSessions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSession(s) {
  if (typeof window === "undefined") return;
  try {
    const all = [...loadSessions(), s].slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignored
  }
}

export default function HRVValidationLab({ show, isDark, onClose }) {
  const reduced = useReducedMotion();
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const titleId = useId();
  const ref = useFocusTrap(show, onClose);

  const [phase, setPhase] = useState("intro"); // intro | connecting | settling | measuring | done | error
  const [bleStatus, setBleStatus] = useState("idle"); // idle | connecting | live | done
  const [camStatus, setCamStatus] = useState("idle");
  const [bleHr, setBleHr] = useState(null);
  const [camHr, setCamHr] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [sessions, setSessions] = useState(() => loadSessions());

  const bleRef = useRef(null);
  const camRef = useRef(null);
  const camAnalyzerRef = useRef(null);
  const bleBufferRef = useRef([]);
  const startedAtRef = useRef(0);
  const phaseRef = useRef("intro");

  const cameraAvailable = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const bleAvailable = typeof window !== "undefined" && isBleSupported();

  useEffect(() => () => {
    try { camRef.current?.stop?.(); } catch {}
    try { bleRef.current?.disconnect?.(); } catch {}
  }, []);

  function setPhaseSafe(p) {
    phaseRef.current = p;
    setPhase(p);
  }

  async function handleStart() {
    setError(null);
    setComparison(null);
    setBleStatus("idle");
    setCamStatus("idle");
    setBleHr(null);
    setCamHr(null);
    setElapsedSec(0);
    bleBufferRef.current = [];
    setPhaseSafe("connecting");

    // Step 1 — connect BLE first (requires user interaction prompt).
    setBleStatus("connecting");
    let bleSession;
    try {
      bleSession = createHrvSession({
        onConnect: () => setBleStatus("live"),
        onSample: ({ hr, rrBuffer }) => {
          setBleHr(hr);
          bleBufferRef.current = rrBuffer;
        },
        onError: (e) => {
          if (e.code === "CANCELLED") {
            setPhaseSafe("intro");
            setBleStatus("idle");
            return;
          }
          setError(e.message || "Error con sensor BLE");
          setPhaseSafe("error");
        },
      });
      bleRef.current = bleSession;
      await bleSession.connect();
    } catch (err) {
      // Already handled by onError — bail silently.
      return;
    }

    // Step 2 — start camera capture in parallel.
    setCamStatus("connecting");
    const analyzer = createStreamingAnalyzer({
      fs: 30,
      windowSec: DURATION_SEC,
      updateMs: 500,
      onUpdate: (u) => {
        if (u.hrv?.meanHr) setCamHr(Math.round(u.hrv.meanHr));
        if (phaseRef.current === "measuring") {
          const elapsed = (Date.now() - startedAtRef.current) / 1000;
          setElapsedSec(elapsed);
          if (elapsed >= DURATION_SEC) finish();
        }
      },
    });
    camAnalyzerRef.current = analyzer;

    const cap = createCameraCapture({ facingMode: "environment" });
    camRef.current = cap;
    try {
      await cap.start({
        onSample: (v, ts, meta) => {
          analyzer.pushSample(v, ts, meta);
        },
      });
      await cap.setTorch(true);
      setCamStatus("live");
    } catch (err) {
      setError(err?.message || "No se pudo iniciar la cámara");
      setPhaseSafe("error");
      try { bleRef.current?.disconnect?.(); } catch {}
      return;
    }

    // Step 3 — begin measurement.
    startedAtRef.current = Date.now();
    setPhaseSafe("measuring");
    announce(`Validación iniciada. Mantén el dedo en la cámara y el strap puesto durante ${DURATION_SEC} segundos.`);
  }

  function finish() {
    if (phaseRef.current === "done") return;
    const camResult = camAnalyzerRef.current?.finish();
    const bleSummary = hrvSummary(bleBufferRef.current);

    const camMetrics = camResult?.hrv
      ? {
          meanHr: camResult.hrv.meanHr,
          rmssd: camResult.hrv.rmssd,
          sdnn: camResult.hrv.sdnn,
          pnn50: camResult.hrv.pnn50,
          lnRmssd: camResult.hrv.lnRmssd,
        }
      : null;
    const bleMetrics = {
      meanHr: bleSummary.meanHR,
      rmssd: bleSummary.rmssd,
      sdnn: bleSummary.sdnn,
      pnn50: bleSummary.pnn50,
      lnRmssd: bleSummary.lnRmssd,
    };
    const cmp = compareMeasurements(camMetrics, bleMetrics);

    if (cmp) {
      const session = {
        ts: Date.now(),
        durationSec: elapsedSec,
        camera: camMetrics,
        ble: bleMetrics,
        sqi: camResult?.sqi?.score ?? null,
        ...cmp,
      };
      saveSession(session);
      setSessions(loadSessions());
      setComparison(cmp);
    }

    try { camRef.current?.setTorch?.(false); } catch {}
    try { camRef.current?.stop?.(); } catch {}
    try { bleRef.current?.disconnect?.(); } catch {}
    setBleStatus("done");
    setCamStatus("done");
    setPhaseSafe("done");
    if (cmp) {
      announce(
        `Validación completa. HR camera ${cmp.hr.camera}, BLE ${cmp.hr.ble}. RMSSD camera ${cmp.rmssd.camera}, BLE ${cmp.rmssd.ble}.`
      );
    }
  }

  function handleStop() {
    if (phaseRef.current === "measuring" && elapsedSec >= 20) {
      finish();
      return;
    }
    try { camRef.current?.setTorch?.(false); } catch {}
    try { camRef.current?.stop?.(); } catch {}
    try { bleRef.current?.disconnect?.(); } catch {}
    setBleStatus("idle");
    setCamStatus("idle");
    setPhaseSafe("intro");
    setElapsedSec(0);
  }

  if (!show) return null;

  const progress = Math.min(100, (elapsedSec / DURATION_SEC) * 100);
  const aggregate = sessions.length > 0
    ? aggregateValidationSessions(sessions.map((s) => ({ hr: s.hr, rmssd: s.rmssd })))
    : null;

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
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
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBlockEnd: 20,
          maxInlineSize: 720,
          marginInline: "auto",
        }}
      >
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
          Modo validación HRV
        </h2>
        <button
          onClick={onClose}
          aria-label="Cerrar"
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

      <main style={{ maxInlineSize: 720, marginInline: "auto" }}>
        {phase === "intro" && (
          <section aria-label="Intro validación">
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
                Mide simultáneamente con cámara (PPG) y un strap BLE (Polar H10 o equivalente) durante {DURATION_SEC} s. Comparamos HR, RMSSD y SDNN para validar la precisión real de tu cámara contra ground-truth.
              </p>
              <p style={{ color: t2, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Tolerancias estándar (literatura): <strong>HR ±5%</strong>, <strong>RMSSD ±30%</strong>. Tras varias sesiones obtienes correlación Pearson y Bland-Altman.
              </p>
            </div>

            {(!cameraAvailable || !bleAvailable) && (
              <div
                role="alert"
                style={{
                  background: withAlpha(bioSignal.ignition, 10),
                  border: `1px solid ${withAlpha(bioSignal.ignition, 35)}`,
                  borderRadius: 12,
                  padding: 14,
                  marginBlockEnd: 16,
                  color: t1,
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, margin: 0, marginBlockEnd: 4, color: bioSignal.ignition }}>
                  Requisitos no cumplidos
                </p>
                <p style={{ color: t2, fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                  Necesitas cámara (HTTPS + getUserMedia) y Web Bluetooth (Chrome/Edge desktop o Android). iOS Safari no soporta Web Bluetooth → usa Android para validar.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleStart}
              disabled={!cameraAvailable || !bleAvailable}
              aria-label="Iniciar validación"
              style={{
                inlineSize: "100%",
                minBlockSize: 48,
                paddingBlock: 14,
                background: cameraAvailable && bleAvailable ? brand.primary : bd,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: -0.1,
                cursor: cameraAvailable && bleAvailable ? "pointer" : "not-allowed",
                opacity: cameraAvailable && bleAvailable ? 1 : 0.55,
              }}
            >
              Conectar BLE y empezar
            </button>

            {aggregate && aggregate.n > 0 && (
              <section
                aria-label="Histórico de validaciones"
                style={{
                  marginBlockStart: 24,
                  background: cd,
                  border: `1px solid ${bd}`,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <h3 style={{ color: t1, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", margin: 0, marginBlockEnd: 12 }}>
                  Histórico ({aggregate.n} sesiones)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <AggregateBlock label="HR" data={aggregate.hr} unit="bpm" t1={t1} t2={t2} t3={t3} />
                  <AggregateBlock label="RMSSD" data={aggregate.rmssd} unit="ms" t1={t1} t2={t2} t3={t3} />
                </div>
              </section>
            )}
          </section>
        )}

        {(phase === "connecting" || phase === "measuring") && (
          <section aria-label="Validación en curso">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBlockEnd: 20 }}>
              <SourceCard
                label="Cámara (PPG)"
                status={camStatus}
                hr={camHr}
                color={brand.primary}
                t1={t1}
                t2={t2}
                t3={t3}
                cd={cd}
                bd={bd}
              />
              <SourceCard
                label="Strap BLE"
                status={bleStatus}
                hr={bleHr}
                color={bioSignal.coherence ?? "#3b82f6"}
                t1={t1}
                t2={t2}
                t3={t3}
                cd={cd}
                bd={bd}
              />
            </div>

            {phase === "measuring" && (
              <>
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
                  }}
                >
                  <motion.div
                    initial={{ inlineSize: 0 }}
                    animate={{ inlineSize: `${progress}%` }}
                    transition={reduced ? { duration: 0 } : { duration: 0.3, ease: "linear" }}
                    style={{ blockSize: "100%", background: brand.primary }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 12, color: t3, marginBlockEnd: 24 }}>
                  <span>{formatTime(elapsedSec)}</span>
                  <span>{formatTime(DURATION_SEC)}</span>
                </div>
              </>
            )}

            <button
              onClick={handleStop}
              aria-label="Detener validación"
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
              {elapsedSec >= 20 ? "Detener y comparar" : "Cancelar"}
            </button>
          </section>
        )}

        {phase === "done" && comparison && (
          <section aria-label="Resultado validación">
            <div style={{ display: "grid", gap: 12, marginBlockEnd: 20 }}>
              <ComparisonBlock label="HR" cmp={comparison.hr} unit="bpm" t1={t1} t2={t2} t3={t3} cd={cd} bd={bd} />
              <ComparisonBlock label="RMSSD" cmp={comparison.rmssd} unit="ms" t1={t1} t2={t2} t3={t3} cd={cd} bd={bd} />
              <ComparisonBlock label="SDNN" cmp={comparison.sdnn} unit="ms" t1={t1} t2={t2} t3={t3} cd={cd} bd={bd} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setComparison(null); setPhaseSafe("intro"); }}
                style={{
                  flex: 1,
                  minBlockSize: 48,
                  paddingBlock: 14,
                  background: brand.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Otra sesión
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  minBlockSize: 48,
                  paddingBlock: 14,
                  background: "transparent",
                  color: t1,
                  border: `1px solid ${bd}`,
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </section>
        )}

        {phase === "error" && error && (
          <div role="alert">
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
      </main>
    </motion.div>
  );
}

function SourceCard({ label, status, hr, color, t1, t2, t3, cd, bd }) {
  return (
    <div
      style={{
        background: cd,
        border: `1px solid ${bd}`,
        borderRadius: 14,
        padding: 16,
        textAlign: "center",
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBlockEnd: 12 }}>
        <span
          style={{
            inlineSize: 8,
            blockSize: 8,
            borderRadius: "50%",
            background: status === "live" || status === "done" ? color : withAlpha(t3, 50),
          }}
        />
        <span style={{ fontSize: 11, color: t2, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
          {label}
        </span>
      </div>
      <div
        style={{
          color: hr != null ? color : t3,
          fontFamily: MONO,
          fontSize: 40,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: -1,
        }}
      >
        {hr ?? "—"}
      </div>
      <div style={{ color: t3, fontSize: 11, marginBlockStart: 4 }}>
        {status === "connecting" ? "Conectando…" : status === "live" ? "midiendo" : status === "done" ? "completo" : "esperando"}
      </div>
    </div>
  );
}

function ComparisonBlock({ label, cmp, unit, t1, t2, t3, cd, bd }) {
  const passed = cmp.withinTolerance !== false;
  const color = passed ? brand.primary : (bioSignal.ignition ?? "#f59e0b");
  return (
    <div
      style={{
        background: cd,
        border: `1px solid ${withAlpha(color, 30)}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBlockEnd: 8,
        }}
      >
        <span style={{ fontSize: 11, color: t2, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
          {label}
        </span>
        {cmp.withinTolerance !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color,
              padding: "2px 8px",
              borderRadius: 4,
              background: withAlpha(color, 12),
            }}
          >
            {passed ? "PASS" : "FAIL"}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "baseline" }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: t1 }}>
            {cmp.camera}
            <span style={{ fontSize: 11, color: t3, marginInlineStart: 4 }}>{unit}</span>
          </div>
          <div style={{ fontSize: 11, color: t3 }}>cámara</div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: t1 }}>
            {cmp.ble}
            <span style={{ fontSize: 11, color: t3, marginInlineStart: 4 }}>{unit}</span>
          </div>
          <div style={{ fontSize: 11, color: t3 }}>BLE</div>
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color }}>
            {cmp.pctError != null ? `${cmp.pctError >= 0 ? "+" : ""}${cmp.pctError}%` : "—"}
          </div>
          <div style={{ fontSize: 11, color: t3 }}>error</div>
        </div>
      </div>
    </div>
  );
}

function AggregateBlock({ label, data, unit, t1, t2, t3 }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: t3, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBlockEnd: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: t1, lineHeight: 1.7 }}>
        <div>MAE: {data.mae ?? "—"} {unit}</div>
        <div>r: {data.correlation ?? "—"}</div>
        {data.blandAltman && (
          <div style={{ color: t2 }}>
            BA: {data.blandAltman.bias} ± {data.blandAltman.std}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
