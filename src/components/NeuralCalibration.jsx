"use client";
/* ═══════════════════════════════════════════════════════════════
   NEURAL CALIBRATION — Flujo de onboarding con baseline cognitivo
   Base: la calibración inicial personalizada mejora outcomes un 34%
   vs protocolos genéricos (Personalised Digital Interventions,
   Lancet Digital Health 2020)
   ═══════════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { resolveTheme, withAlpha, ty, font, space, radius, brand, semantic } from "../lib/theme";

const CALIBRATION_STEPS = [
  {
    id: "welcome",
    title: "Calibración Neural",
    subtitle: "Tu sistema se adapta a ti",
    description: "Vamos a medir tu baseline cognitivo actual. Esto toma 60 segundos y personaliza toda tu experiencia.",
  },
  {
    id: "reaction",
    title: "Velocidad de Procesamiento",
    subtitle: "Toca cuando veas verde",
    description: "Mide la velocidad de tu corteza prefrontal. Toca el círculo lo más rápido que puedas cuando cambie de color.",
    science: "El tiempo de reacción visual refleja la eficiencia del procesamiento cortical prefrontal. Un RT < 300ms indica alta activación; > 500ms sugiere fatiga cognitiva.",
  },
  {
    id: "breath_hold",
    title: "Capacidad Respiratoria",
    subtitle: "Inhala profundo y sostén",
    description: "Mide tu tono vagal basal. Inhala profundo y mantén lo más que puedas — luego exhala y toca.",
    science: "La capacidad de retención respiratoria correlaciona con tono vagal y resiliencia al estrés. > 25s indica buen tono parasimpático.",
  },
  {
    id: "focus",
    title: "Estabilidad Atencional",
    subtitle: "Cuenta los destellos",
    description: "Cuenta cuántos destellos verdes ves en los próximos 10 segundos. Mide tu foco sostenido.",
    science: "La capacidad de conteo bajo distracción refleja la integridad de la red atencional dorsal y el control ejecutivo.",
  },
  {
    id: "stress",
    title: "Estado Actual",
    subtitle: "¿Cómo te sientes ahora?",
    description: "Tu estado subjetivo actual completa el baseline.",
  },
  {
    id: "result",
    title: "Tu Baseline Neural",
    subtitle: "Calibración completa",
  },
];

const STRESS_OPTIONS = [
  { value: 1, label: "Muy tenso", color: "#EF4444", icon: "stress" },
  { value: 2, label: "Algo agitado", color: "#F59E0B", icon: "drain" },
  { value: 3, label: "Neutral", color: "#64748B", icon: "neutral" },
  { value: 4, label: "Tranquilo", color: "#0D9488", icon: "sharp" },
  { value: 5, label: "En calma", color: "#059669", icon: "peak" },
];

export default function NeuralCalibration({ onComplete, isDark }) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState({
    reactionTimes: [],
    breathHold: 0,
    focusCount: 0,
    focusActual: 0,
    stressLevel: 3,
  });

  // Reaction test state
  const [rtPhase, setRtPhase] = useState("waiting"); // waiting | ready | go | done
  const [rtColor, setRtColor] = useState("#1E2330");
  const [rtCount, setRtCount] = useState(0);
  const rtStartRef = useRef(0);
  const rtTimerRef = useRef(null);

  // Breath hold state
  const [bhPhase, setBhPhase] = useState("ready"); // ready | holding | done
  const [bhTime, setBhTime] = useState(0);
  const bhStartRef = useRef(0);
  const bhTimerRef = useRef(null);

  // Focus test state
  const [focusPhase, setFocusPhase] = useState("ready"); // ready | testing | input | done
  const [flashCount, setFlashCount] = useState(0);
  const [actualFlashes, setActualFlashes] = useState(0);
  const [flashVisible, setFlashVisible] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const focusTimerRef = useRef(null);

  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  const ac = brand.primary;

  const currentStep = CALIBRATION_STEPS[step];

  // ─── Reaction Time Test ────────────────────────────────
  const startReactionTest = useCallback(() => {
    setRtPhase("ready");
    setRtColor("#DC2626");
    const delay = 1500 + Math.random() * 3000;
    rtTimerRef.current = setTimeout(() => {
      setRtPhase("go");
      setRtColor("#059669");
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
        setRtColor(isDark ? "#1E2330" : "#E2E8F0");
        setTimeout(startReactionTest, 600);
      }
    } else if (rtPhase === "ready") {
      // Too early
      if (rtTimerRef.current) clearTimeout(rtTimerRef.current);
      setRtPhase("waiting");
      setRtColor(isDark ? "#1E2330" : "#E2E8F0");
      setTimeout(startReactionTest, 800);
    }
  }, [rtPhase, results.reactionTimes, startReactionTest, isDark]);

  // ─── Breath Hold Test ──────────────────────────────────
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

  // ─── Focus Test ────────────────────────────────────────
  const focusTimersRef = useRef([]); // track ALL recursive timeouts
  const startFocusTest = useCallback(() => {
    setFocusPhase("testing");
    let count = 0;
    const totalFlashes = 5 + Math.floor(Math.random() * 8); // 5-12 flashes
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
    // Store cancel function for cleanup
    focusTimersRef.current._cancel = () => { cancelled = true; };
    flashInterval();
  }, []);

  useEffect(() => {
    return () => {
      if (rtTimerRef.current) clearTimeout(rtTimerRef.current);
      if (bhTimerRef.current) clearInterval(bhTimerRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      // Cancel recursive flash chain + clear all tracked timeouts
      if (focusTimersRef.current._cancel) focusTimersRef.current._cancel();
      focusTimersRef.current.forEach(t => clearTimeout(t));
      focusTimersRef.current = [];
    };
  }, []);

  // ─── Score Calculation ─────────────────────────────────
  const calcBaseline = useCallback(() => {
    const rts = results.reactionTimes;
    const avgRT = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 500;
    const rtVariance = rts.length >= 2
      ? Math.round(Math.sqrt(rts.reduce((a, t) => a + Math.pow(t - avgRT, 2), 0) / rts.length))
      : 50;

    // Reaction score (0-100): faster = higher
    const rtScore = Math.max(0, Math.min(100, Math.round(120 - avgRT / 5)));

    // Breath hold score (0-100): longer = higher
    const bhScore = Math.max(0, Math.min(100, Math.round(results.breathHold * 3)));

    // Focus score (0-100): accuracy of count
    const focusError = Math.abs(userCount - actualFlashes);
    const focusScore = Math.max(0, Math.min(100, Math.round(100 - focusError * 15)));

    // Stress baseline (inverted: calm = higher score)
    const stressScore = Math.round(results.stressLevel * 20);

    // Composite baseline
    const composite = Math.round(rtScore * 0.25 + bhScore * 0.25 + focusScore * 0.25 + stressScore * 0.25);

    return {
      avgRT,
      rtVariance,
      rtScore,
      breathHold: results.breathHold,
      bhScore,
      focusAccuracy: focusScore,
      focusError,
      stressLevel: results.stressLevel,
      stressScore,
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
    const baseline = calcBaseline();
    onComplete(baseline);
  }, [calcBaseline, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 260,
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflowY: "auto",
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: bd,
        }}
      >
        <motion.div
          animate={{ width: `${(step / (CALIBRATION_STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
          style={{ height: "100%", background: ac, borderRadius: 3 }}
        />
      </div>

      {/* Step indicator */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 20,
          fontSize: 10,
          fontWeight: 700,
          color: t3,
          letterSpacing: 2,
        }}
      >
        {step + 1}/{CALIBRATION_STEPS.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          style={{
            maxWidth: 380,
            width: "100%",
            textAlign: "center",
          }}
        >
          {/* ═══ STEP 0: WELCOME ═══ */}
          {step === 0 && (
            <>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="32" fill="none" stroke={ac} strokeWidth="2" opacity=".4" />
                  <circle cx="36" cy="36" r="22" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="8 4" />
                  <circle cx="36" cy="36" r="12" fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="4 6" />
                  <circle cx="36" cy="36" r="4" fill={ac} opacity=".5" />
                </svg>
              </motion.div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: t1, marginBottom: 4 }}>
                {currentStep.title}
              </h2>
              <div
                style={{
                  fontSize: 11,
                  color: ac,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                {currentStep.subtitle}
              </div>
              <p style={{ fontSize: 12, color: t2, lineHeight: 1.7, marginBottom: 28 }}>
                {currentStep.description}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 28,
                  textAlign: "left",
                }}
              >
                {[
                  { icon: "bolt", color: ac, label: "Velocidad de procesamiento", desc: "5 pruebas de reacción" },
                  { icon: "breath", color: "#6366F1", label: "Capacidad respiratoria", desc: "Retención de aire" },
                  { icon: "focus", color: "#D97706", label: "Estabilidad atencional", desc: "Conteo bajo distracción" },
                  { icon: "calm", color: "#0D9488", label: "Estado subjetivo", desc: "Autoevaluación" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: item.color + "10",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={item.icon} size={14} color={item.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: t1 }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: t3 }}>{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setStep(1);
                  setTimeout(startReactionTest, 800);
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 50,
                  background: `linear-gradient(135deg, ${ac}, #0D9488)`,
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  boxShadow: `0 4px 20px ${ac}30`,
                }}
              >
                INICIAR CALIBRACIÓN
              </motion.button>
            </>
          )}

          {/* ═══ STEP 1: REACTION TIME ═══ */}
          {step === 1 && (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: t1, marginBottom: 4 }}>
                {currentStep.title}
              </h3>
              <p style={{ fontSize: 11, color: t3, marginBottom: 20 }}>
                {currentStep.subtitle}
              </p>

              <div style={{ marginBottom: 14, fontSize: 10, color: t3 }}>
                Prueba {Math.min(rtCount + 1, 5)} de 5
              </div>

              <motion.div
                whileTap={rtPhase === "go" ? { scale: 0.9 } : {}}
                onClick={handleReactionTap}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: rtColor,
                  margin: "0 auto 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  boxShadow: rtPhase === "go" ? `0 0 40px ${ac}50` : "none",
                }}
              >
                {rtPhase === "waiting" && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", opacity: 0.5 }}>
                    Espera...
                  </span>
                )}
                {rtPhase === "ready" && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", opacity: 0.8 }}>
                    NO TOQUES AÚN
                  </span>
                )}
                {rtPhase === "go" && (
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}
                  >
                    ¡TOCA!
                  </motion.span>
                )}
                {rtPhase === "done" && (
                  <Icon name="check" size={32} color="#fff" />
                )}
              </motion.div>

              {results.reactionTimes.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                  {results.reactionTimes.map((rt, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 8,
                        background: rt < 350 ? "#05966910" : rt < 500 ? "#D9770610" : "#DC262610",
                        fontSize: 10,
                        fontWeight: 700,
                        color: rt < 350 ? "#059669" : rt < 500 ? "#D97706" : "#DC2626",
                      }}
                    >
                      {rt}ms
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 10, color: t3, marginTop: 12, lineHeight: 1.6 }}>
                {currentStep.science}
              </div>
            </>
          )}

          {/* ═══ STEP 2: BREATH HOLD ═══ */}
          {step === 2 && (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: t1, marginBottom: 4 }}>
                {currentStep.title}
              </h3>
              <p style={{ fontSize: 11, color: t3, marginBottom: 20 }}>
                {currentStep.subtitle}
              </p>

              <motion.div
                animate={
                  bhPhase === "holding"
                    ? { scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }
                    : {}
                }
                transition={
                  bhPhase === "holding"
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : {}
                }
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${
                    bhPhase === "holding" ? "#6366F120" : bhPhase === "done" ? ac + "15" : bd
                  }, transparent)`,
                  margin: "0 auto 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `2px solid ${bhPhase === "holding" ? "#6366F140" : bhPhase === "done" ? ac + "40" : bd}`,
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: bhPhase === "done" ? ac : t1,
                  }}
                >
                  {bhTime}s
                </div>
                {bhPhase === "holding" && (
                  <div style={{ fontSize: 10, color: "#6366F1", fontWeight: 700, marginTop: 4 }}>
                    SOSTENIENDO
                  </div>
                )}
              </motion.div>

              {bhPhase === "ready" && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={startBreathHold}
                  style={{
                    padding: "14px 32px",
                    borderRadius: 50,
                    background: "#6366F1",
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: 1,
                  }}
                >
                  INHALA Y TOCA PARA EMPEZAR
                </motion.button>
              )}
              {bhPhase === "holding" && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={stopBreathHold}
                  style={{
                    padding: "14px 32px",
                    borderRadius: 50,
                    background: ac,
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: 1,
                  }}
                >
                  EXHALA Y TOCA
                </motion.button>
              )}
              {bhPhase === "done" && (
                <div style={{ fontSize: 12, fontWeight: 700, color: ac }}>
                  {results.breathHold >= 25
                    ? "Excelente tono vagal"
                    : results.breathHold >= 15
                    ? "Tono vagal funcional"
                    : "Oportunidad de mejora respiratoria"}
                </div>
              )}

              <div style={{ fontSize: 10, color: t3, marginTop: 16, lineHeight: 1.6 }}>
                {currentStep.science}
              </div>
            </>
          )}

          {/* ═══ STEP 3: FOCUS TEST ═══ */}
          {step === 3 && (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: t1, marginBottom: 4 }}>
                {currentStep.title}
              </h3>
              <p style={{ fontSize: 11, color: t3, marginBottom: 20 }}>
                {currentStep.subtitle}
              </p>

              {focusPhase === "ready" && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={startFocusTest}
                  style={{
                    padding: "14px 32px",
                    borderRadius: 50,
                    background: "#D97706",
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: 1,
                    marginBottom: 20,
                  }}
                >
                  INICIAR TEST DE FOCO
                </motion.button>
              )}

              {focusPhase === "testing" && (
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background: flashVisible
                      ? `radial-gradient(circle, ${ac}40, ${ac}10)`
                      : bd,
                    margin: "0 auto 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.1s",
                    border: `2px solid ${flashVisible ? ac : bd}`,
                  }}
                >
                  {flashVisible ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: ac,
                        boxShadow: `0 0 20px ${ac}60`,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 10, color: t3 }}>Observa...</span>
                  )}
                </div>
              )}

              {focusPhase === "input" && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t1, marginBottom: 12 }}>
                    ¿Cuántos destellos contaste?
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
                    {Array.from({ length: 16 }, (_, i) => i + 3).map((n) => (
                      <motion.button
                        key={n}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setUserCount(n);
                          setResults((r) => ({ ...r, focusCount: n, focusActual: actualFlashes }));
                          setFocusPhase("done");
                          setTimeout(() => setStep(4), 800);
                        }}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          border: `1.5px solid ${bd}`,
                          background: cd,
                          fontSize: 13,
                          fontWeight: 700,
                          color: t1,
                          cursor: "pointer",
                        }}
                      >
                        {n}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {focusPhase === "done" && (
                <div style={{ fontSize: 12, fontWeight: 700, color: ac }}>
                  {Math.abs(userCount - actualFlashes) <= 1
                    ? "Precisión excelente"
                    : Math.abs(userCount - actualFlashes) <= 3
                    ? "Foco funcional"
                    : "Atención dispersa — los protocolos de enfoque te ayudarán"}
                </div>
              )}

              <div style={{ fontSize: 10, color: t3, marginTop: 16, lineHeight: 1.6 }}>
                {currentStep.science}
              </div>
            </>
          )}

          {/* ═══ STEP 4: STRESS SELF-REPORT ═══ */}
          {step === 4 && (
            <>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: t1, marginBottom: 4 }}>
                {currentStep.title}
              </h3>
              <p style={{ fontSize: 11, color: t3, marginBottom: 24 }}>
                {currentStep.subtitle}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {STRESS_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setResults((r) => ({ ...r, stressLevel: opt.value }));
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      borderRadius: 14,
                      border:
                        results.stressLevel === opt.value
                          ? `2px solid ${opt.color}`
                          : `1.5px solid ${bd}`,
                      background:
                        results.stressLevel === opt.value ? opt.color + "08" : cd,
                      cursor: "pointer",
                    }}
                  >
                    <Icon
                      name={opt.icon}
                      size={20}
                      color={results.stressLevel === opt.value ? opt.color : t3}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color:
                          results.stressLevel === opt.value ? opt.color : t2,
                      }}
                    >
                      {opt.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setStep(5)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 50,
                  background: ac,
                  border: "none",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: 1,
                }}
              >
                VER RESULTADOS
              </motion.button>
            </>
          )}

          {/* ═══ STEP 5: RESULTS ═══ */}
          {step === 5 && (
            (() => {
              const baseline = calcBaseline();
              return (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  >
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 64 64"
                      style={{ margin: "0 auto 16px", display: "block" }}
                    >
                      <circle cx="32" cy="32" r="28" fill={ac} opacity=".08" />
                      <circle cx="32" cy="32" r="20" fill={ac} opacity=".12" />
                      <path
                        d="M20 32l8 8 16-16"
                        stroke={ac}
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  </motion.div>

                  <h3 style={{ fontSize: 20, fontWeight: 800, color: t1, marginBottom: 4 }}>
                    Calibración Completa
                  </h3>
                  <div
                    style={{
                      fontSize: 11,
                      color: ac,
                      fontWeight: 700,
                      letterSpacing: 2,
                      marginBottom: 20,
                    }}
                  >
                    PERFIL: {baseline.profileLabel.toUpperCase()}
                  </div>

                  {/* Score ring */}
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      margin: "0 auto 20px",
                      position: "relative",
                    }}
                  >
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={bd}
                        strokeWidth="6"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={ac}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={
                          2 * Math.PI * 42 * (1 - baseline.composite / 100)
                        }
                        style={{
                          transform: "rotate(-90deg)",
                          transformOrigin: "50% 50%",
                          transition: "stroke-dashoffset 1s ease",
                        }}
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 28, fontWeight: 800, color: t1 }}>
                        {baseline.composite}
                      </span>
                      <span style={{ fontSize: 9, color: t3, fontWeight: 700 }}>
                        BASELINE
                      </span>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    {[
                      {
                        label: "Reacción",
                        value: `${baseline.avgRT}ms`,
                        score: baseline.rtScore,
                        color: "#3B82F6",
                      },
                      {
                        label: "Respiración",
                        value: `${baseline.breathHold}s`,
                        score: baseline.bhScore,
                        color: "#6366F1",
                      },
                      {
                        label: "Foco",
                        value: `${baseline.focusAccuracy}%`,
                        score: baseline.focusAccuracy,
                        color: "#D97706",
                      },
                      {
                        label: "Estado",
                        value: STRESS_OPTIONS[baseline.stressLevel - 1]?.label,
                        score: baseline.stressScore,
                        color: "#0D9488",
                      },
                    ].map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        style={{
                          background: isDark ? "#1A1E28" : "#F8FAFC",
                          borderRadius: 12,
                          padding: "10px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 10, color: t3, marginBottom: 3 }}>
                          {m.label}
                        </div>
                        <div
                          style={{ fontSize: 16, fontWeight: 800, color: m.color }}
                        >
                          {m.value}
                        </div>
                        <div
                          style={{
                            height: 3,
                            background: bd,
                            borderRadius: 3,
                            marginTop: 6,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: m.score + "%",
                              height: "100%",
                              background: m.color,
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: ac + "06",
                      borderRadius: 12,
                      padding: "12px",
                      marginBottom: 20,
                      border: `1px solid ${ac}10`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: t2,
                        lineHeight: 1.6,
                      }}
                    >
                      Tu perfil{" "}
                      <strong style={{ color: ac }}>
                        {baseline.profileLabel}
                      </strong>{" "}
                      indica que tu protocolo ideal empieza con{" "}
                      <strong>
                        {baseline.recommendations.primaryIntent === "calma"
                          ? "regulación parasimpática"
                          : baseline.recommendations.primaryIntent === "enfoque"
                          ? "activación prefrontal"
                          : "energización simpática controlada"}
                      </strong>
                      . Meta diaria recomendada:{" "}
                      <strong>{baseline.recommendations.sessionGoal} sesiones</strong>.
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleComplete}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 50,
                      background: `linear-gradient(135deg, ${ac}, #0D9488)`,
                      border: "none",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      boxShadow: `0 4px 20px ${ac}30`,
                    }}
                  >
                    COMENZAR MI PRIMERA IGNICIÓN
                  </motion.button>
                </>
              );
            })()
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
