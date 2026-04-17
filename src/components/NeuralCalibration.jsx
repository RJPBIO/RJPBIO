"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL CALIBRATION — Clinical baseline workup.
   Full-bleed clinical layout. Hairline rows. Weight-300 metrics.
   Color discipline: single teal. Danger red only for "no toques aún".
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveTheme, radius, semantic, hairline } from "../lib/theme";

const CAPS = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };
const MICRO = { fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" };

const CALIBRATION_STEPS = [
  {
    id: "welcome",
    title: "Calibración Neural",
    subtitle: "Baseline cognitivo",
    description: "Cuatro mediciones. Sesenta segundos. Tu instrumento se adapta a tu fisiología.",
  },
  {
    id: "reaction",
    title: "Velocidad de Procesamiento",
    subtitle: "Toca cuando veas verde",
    science: "Reacción visual < 300ms = activación prefrontal alta. > 500ms sugiere fatiga cognitiva.",
  },
  {
    id: "breath_hold",
    title: "Capacidad Respiratoria",
    subtitle: "Inhala profundo y sostén",
    science: "Retención > 25s indica tono vagal elevado y alta resiliencia al estrés.",
  },
  {
    id: "focus",
    title: "Estabilidad Atencional",
    subtitle: "Cuenta los destellos",
    science: "El conteo bajo distracción refleja la integridad de la red atencional dorsal.",
  },
  {
    id: "stress",
    title: "Estado Actual",
    subtitle: "Autoevaluación subjetiva",
  },
  {
    id: "result",
    title: "Baseline Neural",
    subtitle: "Calibración completa",
  },
];

const STRESS_OPTIONS = [
  { value: 1, label: "Muy tenso" },
  { value: 2, label: "Algo agitado" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Tranquilo" },
  { value: 5, label: "En calma" },
];

export default function NeuralCalibration({ onComplete, isDark }) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState({
    reactionTimes: [], breathHold: 0, focusCount: 0, focusActual: 0, stressLevel: 3,
  });

  const [rtPhase, setRtPhase] = useState("waiting");
  const [rtCount, setRtCount] = useState(0);
  const rtStartRef = useRef(0);
  const rtTimerRef = useRef(null);

  const [bhPhase, setBhPhase] = useState("ready");
  const [bhTime, setBhTime] = useState(0);
  const bhStartRef = useRef(0);
  const bhTimerRef = useRef(null);

  const [focusPhase, setFocusPhase] = useState("ready");
  const [flashCount, setFlashCount] = useState(0);
  const [actualFlashes, setActualFlashes] = useState(0);
  const [flashVisible, setFlashVisible] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const focusTimerRef = useRef(null);
  const focusTimersRef = useRef([]);

  const { bg, t1, t2, t3 } = resolveTheme(isDark);
  const teal = "#0F766E";
  const divider = isDark ? "#232836" : "#E5E7EB";

  const currentStep = CALIBRATION_STEPS[step];

  const startReactionTest = useCallback(() => {
    setRtPhase("ready");
    const delay = 1500 + Math.random() * 3000;
    rtTimerRef.current = setTimeout(() => {
      setRtPhase("go");
      rtStartRef.current = performance.now();
    }, delay);
  }, []);

  const handleReactionTap = useCallback(() => {
    if (rtPhase === "go") {
      const rt = Math.round(performance.now() - rtStartRef.current);
      const newTimes = [...results.reactionTimes, rt];
      setResults((r) => ({ ...r, reactionTimes: newTimes }));
      setRtCount((c) => c + 1);
      if (newTimes.length >= 5) {
        setRtPhase("done");
        setTimeout(() => setStep(2), 800);
      } else {
        setRtPhase("waiting");
        setTimeout(startReactionTest, 600);
      }
    } else if (rtPhase === "ready") {
      if (rtTimerRef.current) clearTimeout(rtTimerRef.current);
      setRtPhase("waiting");
      setTimeout(startReactionTest, 800);
    }
  }, [rtPhase, results.reactionTimes, startReactionTest]);

  const startBreathHold = useCallback(() => {
    setBhPhase("holding");
    bhStartRef.current = Date.now();
    bhTimerRef.current = setInterval(() => {
      setBhTime(Math.round((Date.now() - bhStartRef.current) / 1000));
    }, 100);
  }, []);

  const stopBreathHold = useCallback(() => {
    if (bhTimerRef.current) clearInterval(bhTimerRef.current);
    const duration = Math.round((Date.now() - bhStartRef.current) / 1000);
    setBhTime(duration);
    setBhPhase("done");
    setResults((r) => ({ ...r, breathHold: duration }));
    setTimeout(() => setStep(3), 1200);
  }, []);

  const startFocusTest = useCallback(() => {
    setFocusPhase("testing");
    let count = 0;
    const totalFlashes = 5 + Math.floor(Math.random() * 8);
    setActualFlashes(totalFlashes);
    let flashesDone = 0;
    let cancelled = false;

    const flashInterval = () => {
      if (cancelled || flashesDone >= totalFlashes) {
        setFocusPhase("input");
        return;
      }
      const delay = 400 + Math.random() * 1200;
      const outerT = setTimeout(() => {
        if (cancelled) return;
        setFlashVisible(true);
        count++;
        setFlashCount(count);
        const innerT = setTimeout(() => {
          if (cancelled) return;
          setFlashVisible(false);
          flashesDone++;
          flashInterval();
        }, 200 + Math.random() * 200);
        focusTimersRef.current.push(innerT);
      }, delay);
      focusTimerRef.current = outerT;
      focusTimersRef.current.push(outerT);
    };
    focusTimersRef.current._cancel = () => { cancelled = true; };
    flashInterval();
  }, []);

  useEffect(() => {
    return () => {
      if (rtTimerRef.current) clearTimeout(rtTimerRef.current);
      if (bhTimerRef.current) clearInterval(bhTimerRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      if (focusTimersRef.current._cancel) focusTimersRef.current._cancel();
      focusTimersRef.current.forEach(t => clearTimeout(t));
      focusTimersRef.current = [];
    };
  }, []);

  const calcBaseline = useCallback(() => {
    const rts = results.reactionTimes;
    const avgRT = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 500;
    const rtVariance = rts.length >= 2
      ? Math.round(Math.sqrt(rts.reduce((a, t) => a + Math.pow(t - avgRT, 2), 0) / rts.length))
      : 50;
    const rtScore = Math.max(0, Math.min(100, Math.round(120 - avgRT / 5)));
    const bhScore = Math.max(0, Math.min(100, Math.round(results.breathHold * 3)));
    const focusError = Math.abs(userCount - actualFlashes);
    const focusScore = Math.max(0, Math.min(100, Math.round(100 - focusError * 15)));
    const stressScore = Math.round(results.stressLevel * 20);
    const composite = Math.round(rtScore * 0.25 + bhScore * 0.25 + focusScore * 0.25 + stressScore * 0.25);

    return {
      avgRT, rtVariance, rtScore,
      breathHold: results.breathHold, bhScore,
      focusAccuracy: focusScore, focusError,
      stressLevel: results.stressLevel, stressScore,
      composite,
      timestamp: Date.now(),
      profile: composite >= 75 ? "alto_rendimiento" : composite >= 55 ? "funcional" : composite >= 35 ? "en_desarrollo" : "recuperación",
      profileLabel: composite >= 75 ? "Alto Rendimiento" : composite >= 55 ? "Funcional" : composite >= 35 ? "En Desarrollo" : "Recuperación Activa",
      recommendations: {
        primaryIntent: results.stressLevel <= 2 ? "calma" : avgRT > 450 ? "enfoque" : "energia",
        sessionGoal: composite >= 60 ? 3 : 2,
        difficulty: composite >= 70 ? 3 : composite >= 40 ? 2 : 1,
      },
    };
  }, [results, userCount, actualFlashes]);

  const handleComplete = useCallback(() => {
    onComplete(calcBaseline());
  }, [calcBaseline, onComplete]);

  // Reaction circle color
  const rtBorderColor = rtPhase === "go" ? teal : rtPhase === "ready" ? semantic.danger : divider;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        position: "fixed", inset: 0, zIndex: 260,
        background: bg,
        display: "flex", flexDirection: "column",
        padding: "24px 20px 40px",
        overflowY: "auto",
      }}
    >
      {/* Top progress strip */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 28, paddingBottom: 16,
        borderBottom: hairline(isDark),
      }}>
        <div style={{ ...CAPS, color: t3 }}>Paso {step + 1} / {CALIBRATION_STEPS.length}</div>
        <div style={{ flex: 1, margin: "0 16px", height: 1, background: divider, position: "relative", top: 0 }}>
          <motion.div
            animate={{ width: `${(step / (CALIBRATION_STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ height: 1, background: teal }}
          />
        </div>
        <div style={{ ...CAPS, color: t3, fontVariantNumeric: "tabular-nums" }}>
          {Math.round((step / (CALIBRATION_STEPS.length - 1)) * 100)}%
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.28 }}
          style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}
        >
          {/* Step header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ ...CAPS, color: teal, marginBottom: 12 }}>{currentStep.subtitle}</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: t1, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              {currentStep.title}
            </div>
            {currentStep.description && (
              <div style={{ fontSize: 15, fontWeight: 400, color: t2, lineHeight: 1.6, marginTop: 12 }}>
                {currentStep.description}
              </div>
            )}
          </div>

          {/* STEP 0: WELCOME */}
          {step === 0 && (
            <>
              <div style={{
                borderTop: hairline(isDark), borderBottom: hairline(isDark),
                marginBottom: 32,
              }}>
                {[
                  { label: "Reacción", desc: "5 pruebas visuales" },
                  { label: "Respiración", desc: "Retención de aire" },
                  { label: "Foco", desc: "Conteo bajo distracción" },
                  { label: "Estado", desc: "Autoevaluación" },
                ].map((item, i, arr) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "baseline", justifyContent: "space-between",
                    padding: "14px 0",
                    borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
                  }}>
                    <div>
                      <div style={{ ...CAPS, color: t3, fontVariantNumeric: "tabular-nums" }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: t1, letterSpacing: "-0.01em", marginTop: 6 }}>
                        {item.label}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: t2 }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setStep(1); setTimeout(startReactionTest, 800); }}
                style={{
                  width: "100%", padding: "16px 20px",
                  borderRadius: radius.md, background: teal,
                  border: `1px solid ${teal}`, color: "#fff",
                  ...CAPS, fontSize: 13, minHeight: 56, cursor: "pointer",
                }}
              >
                Iniciar calibración
              </button>
            </>
          )}

          {/* STEP 1: REACTION */}
          {step === 1 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ ...MICRO, color: t3, marginBottom: 20, fontVariantNumeric: "tabular-nums" }}>
                Prueba {Math.min(rtCount + 1, 5)} / 5
              </div>
              <div
                onClick={handleReactionTap}
                style={{
                  width: 180, height: 180, borderRadius: "50%",
                  border: `1px solid ${rtBorderColor}`,
                  background: rtPhase === "go" ? `${teal}0F` : "transparent",
                  margin: "0 auto 24px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 280ms cubic-bezier(0.25,0.46,0.45,0.94)",
                }}
              >
                {rtPhase === "waiting" && <span style={{ ...MICRO, color: t3 }}>Espera</span>}
                {rtPhase === "ready" && <span style={{ ...CAPS, color: semantic.danger }}>No toques aún</span>}
                {rtPhase === "go" && <span style={{ fontSize: 18, fontWeight: 300, color: teal, letterSpacing: "-0.01em" }}>Toca</span>}
                {rtPhase === "done" && <span style={{ fontSize: 24, fontWeight: 300, color: teal }}>✓</span>}
              </div>

              {results.reactionTimes.length > 0 && (
                <div style={{
                  display: "flex", justifyContent: "center", gap: 14,
                  padding: "14px 0",
                  borderTop: hairline(isDark), borderBottom: hairline(isDark),
                  marginBottom: 14,
                }}>
                  {results.reactionTimes.map((rt, i) => {
                    const c = rt < 350 ? teal : rt < 500 ? semantic.warning : semantic.danger;
                    return (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 16, fontWeight: 300, color: c, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{rt}</div>
                        <div style={{ ...MICRO, color: t3, fontSize: 9, marginTop: 3 }}>ms</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 400, color: t3, lineHeight: 1.6, marginTop: 12 }}>
                {currentStep.science}
              </div>
            </div>
          )}

          {/* STEP 2: BREATH HOLD */}
          {step === 2 && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 200, height: 200, borderRadius: "50%",
                border: `1px solid ${bhPhase === "holding" ? teal : divider}`,
                background: bhPhase === "done" ? `${teal}0F` : "transparent",
                margin: "0 auto 24px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                transition: "all 280ms cubic-bezier(0.25,0.46,0.45,0.94)",
              }}>
                <div style={{
                  fontSize: 48, fontWeight: 200,
                  color: bhPhase === "done" ? teal : t1,
                  letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1,
                }}>
                  {bhTime}
                </div>
                <div style={{ ...MICRO, color: t3, marginTop: 8 }}>
                  {bhPhase === "holding" ? "Sosteniendo" : "segundos"}
                </div>
              </div>

              {bhPhase === "ready" && (
                <button
                  onClick={startBreathHold}
                  style={{
                    width: "100%", padding: "16px 20px",
                    borderRadius: radius.md, background: teal,
                    border: `1px solid ${teal}`, color: "#fff",
                    ...CAPS, fontSize: 13, minHeight: 56, cursor: "pointer",
                  }}
                >
                  Inhala y toca para empezar
                </button>
              )}
              {bhPhase === "holding" && (
                <button
                  onClick={stopBreathHold}
                  style={{
                    width: "100%", padding: "16px 20px",
                    borderRadius: radius.md, background: "transparent",
                    border: `1px solid ${teal}`, color: teal,
                    ...CAPS, fontSize: 13, minHeight: 56, cursor: "pointer",
                  }}
                >
                  Exhala y toca
                </button>
              )}
              {bhPhase === "done" && (
                <div style={{ ...CAPS, color: teal, marginBottom: 14 }}>
                  {results.breathHold >= 25 ? "Tono vagal excelente" : results.breathHold >= 15 ? "Tono vagal funcional" : "Oportunidad de mejora"}
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 400, color: t3, lineHeight: 1.6, marginTop: 20 }}>
                {currentStep.science}
              </div>
            </div>
          )}

          {/* STEP 3: FOCUS */}
          {step === 3 && (
            <div style={{ textAlign: "center" }}>
              {focusPhase === "ready" && (
                <button
                  onClick={startFocusTest}
                  style={{
                    width: "100%", padding: "16px 20px",
                    borderRadius: radius.md, background: teal,
                    border: `1px solid ${teal}`, color: "#fff",
                    ...CAPS, fontSize: 13, minHeight: 56, cursor: "pointer",
                    marginBottom: 20,
                  }}
                >
                  Iniciar test de foco
                </button>
              )}

              {focusPhase === "testing" && (
                <div style={{
                  width: 200, height: 200, borderRadius: "50%",
                  border: `1px solid ${flashVisible ? teal : divider}`,
                  margin: "0 auto 24px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "border-color 120ms",
                }}>
                  {flashVisible ? (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: teal }} />
                  ) : (
                    <span style={{ ...MICRO, color: t3 }}>Observa</span>
                  )}
                </div>
              )}

              {focusPhase === "input" && (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 400, color: t1, marginBottom: 16, lineHeight: 1.5 }}>
                    ¿Cuántos destellos contaste?
                  </div>
                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2,
                    border: hairline(isDark), borderRadius: radius.md, padding: 2,
                  }}>
                    {Array.from({ length: 16 }, (_, i) => i + 3).map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setUserCount(n);
                          setResults((r) => ({ ...r, focusCount: n, focusActual: actualFlashes }));
                          setFocusPhase("done");
                          setTimeout(() => setStep(4), 800);
                        }}
                        style={{
                          aspectRatio: "1", padding: 0,
                          border: "none", background: "transparent",
                          fontSize: 14, fontWeight: 300, color: t1,
                          letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums",
                          cursor: "pointer",
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {focusPhase === "done" && (
                <div style={{ ...CAPS, color: teal }}>
                  {Math.abs(userCount - actualFlashes) <= 1 ? "Precisión excelente" : Math.abs(userCount - actualFlashes) <= 3 ? "Foco funcional" : "Atención dispersa"}
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 400, color: t3, lineHeight: 1.6, marginTop: 20 }}>
                {currentStep.science}
              </div>
            </div>
          )}

          {/* STEP 4: STRESS SELF-REPORT */}
          {step === 4 && (
            <>
              <div style={{
                border: hairline(isDark), borderRadius: radius.lg,
                overflow: "hidden", marginBottom: 24,
              }}>
                {STRESS_OPTIONS.map((opt, i, arr) => {
                  const isActive = results.stressLevel === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setResults((r) => ({ ...r, stressLevel: opt.value }))}
                      style={{
                        width: "100%",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 20px",
                        background: isActive ? (isDark ? "#1A1E28" : "#F2F4F7") : "transparent",
                        border: "none",
                        borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
                        borderLeft: isActive ? `2px solid ${teal}` : "2px solid transparent",
                        cursor: "pointer", minHeight: 56,
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                        <span style={{ ...CAPS, color: t3, fontVariantNumeric: "tabular-nums" }}>{opt.value}</span>
                        <span style={{ fontSize: 15, fontWeight: 500, color: isActive ? teal : t1, letterSpacing: "-0.01em" }}>
                          {opt.label}
                        </span>
                      </div>
                      {isActive && <span style={{ ...CAPS, color: teal }}>Seleccionado</span>}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(5)}
                style={{
                  width: "100%", padding: "16px 20px",
                  borderRadius: radius.md, background: teal,
                  border: `1px solid ${teal}`, color: "#fff",
                  ...CAPS, fontSize: 13, minHeight: 56, cursor: "pointer",
                }}
              >
                Ver resultados
              </button>
            </>
          )}

          {/* STEP 5: RESULTS */}
          {step === 5 && (() => {
            const baseline = calcBaseline();
            return (
              <>
                <div style={{
                  borderTop: hairline(isDark), borderBottom: hairline(isDark),
                  padding: "24px 0", marginBottom: 24, textAlign: "left",
                }}>
                  <div style={{ ...CAPS, color: t3, marginBottom: 10 }}>Perfil · {baseline.profileLabel}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 56, fontWeight: 200, color: teal, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      {baseline.composite}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 400, color: t3 }}>baseline</span>
                  </div>
                </div>

                {/* Metrics table */}
                <div style={{
                  border: hairline(isDark), borderRadius: radius.lg,
                  marginBottom: 24, overflow: "hidden",
                }}>
                  {[
                    { label: "Reacción", value: `${baseline.avgRT}`, unit: "ms", score: baseline.rtScore },
                    { label: "Respiración", value: `${baseline.breathHold}`, unit: "s", score: baseline.bhScore },
                    { label: "Foco", value: `${baseline.focusAccuracy}`, unit: "%", score: baseline.focusAccuracy },
                    { label: "Estado", value: STRESS_OPTIONS[baseline.stressLevel - 1]?.label, unit: "", score: baseline.stressScore },
                  ].map((m, i, arr) => (
                    <div key={i} style={{
                      padding: "14px 20px",
                      borderBottom: i < arr.length - 1 ? hairline(isDark) : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ ...CAPS, color: t3 }}>{m.label}</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                          <span style={{ fontSize: 18, fontWeight: 300, color: t1, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{m.value}</span>
                          {m.unit && <span style={{ ...MICRO, color: t3 }}>{m.unit}</span>}
                        </div>
                      </div>
                      <div style={{ height: 2, background: divider }}>
                        <div style={{ width: `${m.score}%`, height: "100%", background: teal }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: "18px 20px", marginBottom: 24,
                  border: hairline(isDark), borderLeft: `2px solid ${teal}`,
                  borderRadius: radius.md,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 400, color: t2, lineHeight: 1.7 }}>
                    Protocolo ideal · <span style={{ color: teal, fontWeight: 500 }}>
                      {baseline.recommendations.primaryIntent === "calma" ? "regulación parasimpática" :
                        baseline.recommendations.primaryIntent === "enfoque" ? "activación prefrontal" :
                          "energización simpática controlada"}
                    </span>. Meta diaria · {baseline.recommendations.sessionGoal} sesiones.
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  style={{
                    width: "100%", padding: "16px 20px",
                    borderRadius: radius.md, background: teal,
                    border: `1px solid ${teal}`, color: "#fff",
                    ...CAPS, fontSize: 13, minHeight: 56, cursor: "pointer",
                  }}
                >
                  Comenzar primera ignición
                </button>
              </>
            );
          })()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
