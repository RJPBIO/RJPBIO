"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN v6.0 — NEURAL OPTIMIZATION PLATFORM
   ═══════════════════════════════════════════════════════════════
   Modular Architecture · Custom Hooks · Zustand · ErrorBoundary
   Timer-First UX · Design Tokens · Adaptive Neural AI
   ═══════════════════════════════════════════════════════════════ */

import { P, SCIENCE_DEEP } from "../lib/protocols";
import { MOODS, INTENTS, PROG_7, DS } from "../lib/constants";
import {
  gL, lvPct, getStatus, getWeekNum, getDailyIgn, getCircadian,
  calcProtoSensitivity, predictSessionImpact,
  adaptiveProtocolEngine, estimateCognitiveLoad,
} from "../lib/neural";
import { hap, loadVoices, speak, hapticBreath, speakNow } from "../lib/audio";
import { resolveTheme, withAlpha, ty, font, space, radius, z, layout } from "../lib/theme";
import { useStore } from "../store/useStore";
import { useSessionEngine } from "../hooks/useSessionEngine";
import Icon from "../components/Icon";
import ErrorBoundary from "../components/ErrorBoundary";

// ─── Dynamic imports (code-split, with loading fallbacks) ─
const LoadingFallback = () => <div style={{ padding: 24, textAlign: "center", opacity: .4 }} aria-busy="true" />;
const BreathOrb = dynamic(() => import("../components/BreathOrb"), { ssr: false, loading: LoadingFallback });
const NeuralCalibration = dynamic(() => import("../components/NeuralCalibration"), { ssr: false, loading: LoadingFallback });
const ProtocolDetail = dynamic(() => import("../components/ProtocolDetail"), { ssr: false, loading: LoadingFallback });
const StreakShield = dynamic(() => import("../components/StreakShield"), { ssr: false, loading: LoadingFallback });
const DashboardView = dynamic(() => import("../components/DashboardView"), { ssr: false, loading: LoadingFallback });
const ProfileView = dynamic(() => import("../components/ProfileView"), { ssr: false, loading: LoadingFallback });
const PostSessionFlow = dynamic(() => import("../components/PostSessionFlow"), { ssr: false, loading: LoadingFallback });
const SettingsSheet = dynamic(() => import("../components/SettingsSheet"), { ssr: false, loading: LoadingFallback });
const HistorySheet = dynamic(() => import("../components/HistorySheet"), { ssr: false, loading: LoadingFallback });
const ProtocolSelector = dynamic(() => import("../components/ProtocolSelector"), { ssr: false, loading: LoadingFallback });

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function BioIgnicion() {
  const store = useStore();

  // ─── App-level state ───────────────────────────────────
  const [mt, setMt] = useState(false);
  const [tab, setTab] = useState("ignicion");
  const [st, setSt_] = useState(DS);
  const [pr, setPr] = useState(P[12]);
  const [sc, setSc] = useState("Protocolo");
  const [sl, setSl] = useState(false);
  const [tp, setTp] = useState(false);
  const [tabFade, setTabFade] = useState(1);
  const [durMult, setDurMult] = useState(1);
  const [entryDone, setEntryDone] = useState(false);
  const [nfcCtx, setNfcCtx] = useState(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // ─── Panel visibility ──────────────────────────────────
  const [showHist, setShowHist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [onboard, setOnboard] = useState(false);
  const [showIntent, setShowIntent] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showProtoDetail, setShowProtoDetail] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // ─── State setter (wraps Zustand) ──────────────────────
  const setSt = useCallback(v => {
    const nv = typeof v === "function" ? v(st) : v;
    setSt_(nv);
    store.update(nv);
  }, [st]);

  // ─── Core callbacks ────────────────────────────────────
  const H = useCallback(t => hap(t, st.soundOn, st.hapticOn), [st.soundOn, st.hapticOn]);
  const circadian = useMemo(() => getCircadian(), []);

  // ─── Session engine (timer, breathing, audio, completion) ─
  const storeActions = useMemo(() => ({
    completeSession: store.completeSession,
    logMood: store.logMood,
    toggleFav: store.toggleFav,
    recalibrate: store.recalibrate,
  }), []);
  const engine = useSessionEngine({ st, setSt, pr, durMult, nfcCtx, circadian, voiceOn, H, storeActions });

  // ─── Service Worker ────────────────────────────────────
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // ─── NFC/QR deep link (sanitized) ──────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const sanitize = (s) => s ? s.replace(/[<>"'&]/g, "").slice(0, 100) : "";
      const c = sanitize(params.get("c")), t = sanitize(params.get("t")), e = sanitize(params.get("e"));
      const validTypes = ["entrada", "salida", "exit", "entry"];
      if (c || t) {
        setNfcCtx({ company: c, type: validTypes.includes(t) ? t : "entrada", employee: e });
        setEntryDone(true);
        const isExit = t === "salida" || t === "exit";
        const h = new Date().getHours();
        const pool = isExit
          ? P.filter(p => p.int === "calma" || p.int === "reset")
          : h < 12 ? P.filter(p => p.int === "energia" || p.int === "enfoque")
          : P.filter(p => p.int === "enfoque" || p.int === "reset");
        const pick = pool[Math.floor(Math.random() * pool.length)] || P[0];
        setPr(pick);
      }
    } catch (e) { console.warn("[BIO] Deep link parse error:", e.message); }
  }, []);

  // ─── Voice loading ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => { try { window.speechSynthesis.removeEventListener("voiceschanged", loadVoices); } catch (e) { console.warn("[BIO] Voice cleanup:", e.message); } };
  }, []);

  // ─── Load state (via Zustand) ──────────────────────────
  useEffect(() => {
    setMt(true);
    store.init();
    const l = useStore.getState();
    setSt_(l);
    if (l.totalSessions === 0) setOnboard(true);
    try {
      const rec = adaptiveProtocolEngine(l);
      if (rec && rec.primary) setPr(rec.primary.protocol);
    } catch (e) { console.warn("[BIO] Adaptive engine error:", e.message); }
  }, []);

  // ─── Auto-save (ref-based to avoid stale closures) ─────
  const stSaveRef = useRef(st);
  stSaveRef.current = st;
  useEffect(() => {
    if (!mt || typeof window === "undefined") return;
    const save = () => store.update(stSaveRef.current);
    const iv = setInterval(save, 30000);
    const onHide = () => { if (document.visibilityState === "hidden") save(); };
    window.addEventListener("beforeunload", save);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onHide);
    return () => { clearInterval(iv); window.removeEventListener("beforeunload", save); window.removeEventListener("pagehide", save); document.removeEventListener("visibilitychange", onHide); };
  }, [mt]);

  // ─── Theme detection ───────────────────────────────────
  useEffect(() => {
    if (!mt) return;
    function ck() {
      const h = new Date().getHours();
      const m = st.themeMode || "auto";
      if (m === "dark") setIsDark(true);
      else if (m === "light") setIsDark(false);
      else setIsDark(h >= 20 || h < 6);
    }
    ck();
    const iv = setInterval(ck, 60000);
    return () => clearInterval(iv);
  }, [mt, st.themeMode]);

  // ─── Protocol switch ───────────────────────────────────
  function sp(p) {
    engine.rs();
    setPr(p);
    setSl(false);
    setShowIntent(false);
    setShowScience(false);
  }

  function switchTab(id) {
    if (id === tab) return;
    setTabFade(0);
    setTimeout(() => { setTab(id); setTimeout(() => setTabFade(1), 30); }, 180);
    H("tap");
  }

  // ─── Derived state ─────────────────────────────────────
  const { ts, sec, pi, countdown, compFlash, totalDur, pct, ph, isActive, isBr, CI, dO, sessPct, nextPh, bL, bS, bCnt, midMsg, showMid, postStep, setPostStep, postVC, postMsg, checkMood, setCheckMood, checkEnergy, setCheckEnergy, checkTag, setCheckTag, preMood, setPreMood, moodDiff, sessionData, setSessionData, go, pa, rs, resume, timerTap, submitCheckin, setSec } = engine;

  const lv = gL(st.totalSessions);
  const fl = INTENTS.some(i => i.id === sc) ? P.filter(p => p.int === sc) : P.filter(p => p.ct === sc);
  const perf = Math.round((st.coherencia + st.resiliencia + st.capacidad) / 3);
  const protoSens = useMemo(() => calcProtoSensitivity(st.moodLog), [st.moodLog]);
  const nSt = getStatus(perf);
  const lPct = lvPct(st.totalSessions);
  const rD = useMemo(() => { const h = st.history || []; if (h.length < 2) return { c: 0, r: 0 }; return { c: h.slice(-1)[0].c - (h.length >= 5 ? h[h.length - 5] : h[0]).c, r: h.slice(-1)[0].r - (h.length >= 5 ? h[h.length - 5] : h[0]).r }; }, [st.history]);
  const lastProto = useMemo(() => { const h = st.history || []; if (!h.length) return null; return h[h.length - 1].p; }, [st.history]);
  const favs = st.favs || [];
  const toggleFav = useCallback((name) => { store.toggleFav(name); setSt(s => { const nf = (s.favs || []).includes(name) ? (s.favs || []).filter(f => f !== name) : [...(s.favs || []), name]; return { ...s, favs: nf }; }); }, [setSt]);
  const aiRec = useMemo(() => { try { return adaptiveProtocolEngine(st); } catch (e) { return null; } }, [st.moodLog, st.history, st.weeklyData]);
  const smartPick = aiRec?.primary?.protocol || null;
  const daily = useMemo(() => getDailyIgn(st), [st.moodLog]);
  const progStep = PROG_7[(st.progDay || 0) % 7];
  const prediction = useMemo(() => predictSessionImpact(st, pr), [st.moodLog, pr.id]);
  const cogLoad = useMemo(() => estimateCognitiveLoad(st), [st.todaySessions, st.moodLog]);

  const { bg, card: cd, surface, border: bd, t1, t2, t3, scrim } = resolveTheme(isDark);
  const ac = pr.cl;

  // ─── Loading screen ────────────────────────────────────
  if (!mt) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0B0E14", gap: space[4] }}>
      <motion.div animate={{ scale: [1, 1.06, 1], opacity: [.7, 1, .7] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
        <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="#059669" strokeWidth="2" opacity=".3" /><circle cx="26" cy="26" r="16" fill="none" stroke="#6366F1" strokeWidth="2" opacity=".3" /><circle cx="26" cy="26" r="5" fill="#059669" opacity=".4" /></svg>
      </motion.div>
      <div style={ty.label("#94A3B8")}>BIO-IGNICIÓN</div>
      <div style={{ ...ty.caption("#4B5568"), marginTop: -8 }}>v6.0 — Neural Engine IA</div>
    </div>
  );

  return (
    <div style={{ maxWidth: layout.maxWidth, margin: "0 auto", minHeight: "100vh", background: bg, position: "relative", overflow: "hidden", fontFamily: font.family, transition: "background .8s" }}>

      {/* Background aura */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-15%", right: "-15%", width: "50%", height: "50%", borderRadius: "50%", background: `radial-gradient(circle,${withAlpha(ac, isDark ? 6 : 4)},transparent)`, animation: "am 25s ease-in-out infinite", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "40%", height: "40%", borderRadius: "50%", background: `radial-gradient(circle,${withAlpha("#818CF8", isDark ? 4 : 4)},transparent)`, animation: "am 30s ease-in-out infinite reverse", filter: "blur(45px)" }} />
      </div>

      {/* Mid-session message */}
      <AnimatePresence>
        {showMid && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 180, pointerEvents: "none" }}>
          <div style={{ background: cd, borderRadius: radius.lg, padding: `${space[3]}px ${space[5]}px`, boxShadow: "0 8px 30px rgba(0,0,0,.08)", border: `1px solid ${bd}`, maxWidth: 320, textAlign: "center" }}>
            <div style={{ ...ty.body(t1), fontStyle: "italic" }}>{midMsg}</div>
          </div>
        </motion.div>}
      </AnimatePresence>

      {/* Countdown */}
      <AnimatePresence>
        {countdown > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: z.countdown, background: `${bg}DD`, backdropFilter: "blur(30px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div key={countdown} initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
            <div style={{ fontSize: 96, fontWeight: font.weight.black, color: ac }}>{countdown}</div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>

      {compFlash && <div style={{ position: "fixed", inset: 0, zIndex: z.flash, background: withAlpha(ac, 6), animation: "compFlash .8s ease forwards", pointerEvents: "none" }} />}

      {/* Onboarding — Neural Calibration */}
      <AnimatePresence>
        {(onboard || showCalibration) && <ErrorBoundary isDark={isDark}><NeuralCalibration isDark={isDark} onComplete={(baseline) => {
          setOnboard(false); setShowCalibration(false);
          store.recalibrate(baseline);
          const nst = { ...useStore.getState(), sessionGoal: baseline.recommendations?.sessionGoal || 2 };
          const ach = [...nst.achievements]; if (!ach.includes("calibrated")) ach.push("calibrated");
          nst.achievements = ach;
          store.update(nst);
          setSt_(nst);
          const d = getDailyIgn(nst); if (d && d.proto) setPr(d.proto);
        }} /></ErrorBoundary>}
      </AnimatePresence>

      {/* Protocol Detail */}
      <AnimatePresence>
        {showProtoDetail && <ErrorBoundary isDark={isDark}><ProtocolDetail protocol={pr} st={st} isDark={isDark} durMult={durMult} onClose={() => setShowProtoDetail(false)} onStart={(p) => { setShowProtoDetail(false); sp(p); go(); }} /></ErrorBoundary>}
      </AnimatePresence>

      {/* Post-Session Flow */}
      <ErrorBoundary isDark={isDark}>
        <PostSessionFlow postStep={postStep} ts={ts} ac={ac} isDark={isDark} pr={pr} durMult={durMult} st={st} checkMood={checkMood} setCheckMood={setCheckMood} checkEnergy={checkEnergy} setCheckEnergy={setCheckEnergy} checkTag={checkTag} setCheckTag={setCheckTag} preMood={preMood} postVC={postVC} postMsg={postMsg} moodDiff={moodDiff} H={H} submitCheckin={submitCheckin} onSetPostStep={setPostStep} onReset={rs} />
      </ErrorBoundary>

      {/* Intent Picker */}
      <AnimatePresence>
        {showIntent && <motion.div role="dialog" aria-modal="true" aria-label="Selector de intención" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: z.modal, background: scrim, backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", padding: space[6] }} onClick={() => setShowIntent(false)}>
          <motion.div initial={{ scale: .9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} style={{ background: cd, borderRadius: radius["2xl"], padding: `${space[6]}px ${space[5]}px`, maxWidth: 380, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: space[5] }}>
              <div style={ty.heroHeading(t1)}>¿Qué necesitas?</div>
              {aiRec && <div style={{ ...ty.caption(t3), marginTop: space[1] }}>IA sugiere: <span style={{ color: ac, fontWeight: font.weight.bold }}>{aiRec.need}</span> · {aiRec.context.circadian}</div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[2] }}>
              {INTENTS.map(i => { const b = P.filter(p => p.int === i.id); const pk = b[Math.floor(b.length / 2)] || P[0]; return (
                <motion.button key={i.id} whileTap={{ scale: .95 }} onClick={() => sp(pk)} style={{ padding: `${space[4]}px ${space[2.5]}px`, borderRadius: radius.lg, border: `1.5px solid ${bd}`, background: cd, cursor: "pointer", textAlign: "center" }}>
                  <Icon name={i.icon} size={26} color={i.color} />
                  <div style={{ ...ty.title(t1), marginTop: space[1.5] }}>{i.label}</div>
                  <div style={{ ...ty.caption(i.color), fontWeight: font.weight.bold, marginTop: space[1] }}>{pk.n}</div>
                </motion.button>); })}
            </div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>

      {/* Sheets */}
      <ErrorBoundary isDark={isDark}>
        <ProtocolSelector show={sl} onClose={() => setSl(false)} st={st} isDark={isDark} ac={ac} pr={pr} sc={sc} setSc={setSc} fl={fl} favs={favs} toggleFav={toggleFav} lastProto={lastProto} smartPick={smartPick} protoSens={protoSens} sp={sp} H={H} />
      </ErrorBoundary>
      <ErrorBoundary isDark={isDark}>
        <SettingsSheet show={showSettings} onClose={() => setShowSettings(false)} st={st} setSt={setSt} isDark={isDark} ac={ac} voiceOn={voiceOn} setVoiceOn={setVoiceOn} H={H} />
      </ErrorBoundary>
      <ErrorBoundary isDark={isDark}>
        <HistorySheet show={showHist} onClose={() => setShowHist(false)} st={st} isDark={isDark} ac={ac} />
      </ErrorBoundary>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ opacity: tabFade, transition: "opacity .25s cubic-bezier(.4,0,.2,1),transform .25s", transform: tabFade === 1 ? "translateY(0)" : "translateY(8px)", position: "relative", zIndex: 1 }}>

        {/* ═══ TAB: IGNICIÓN ═══ */}
        {tab === "ignicion" && postStep === "none" && countdown === 0 && !compFlash && (
          <div style={{ padding: `${space[3]}px ${space[5]}px ${layout.bottomSafe}px` }}>

            {/* NFC Context */}
            {nfcCtx && ts === "idle" && <div style={{ display: "flex", alignItems: "center", gap: space[2], padding: `${space[2.5]}px ${space[3]}px`, marginBottom: space[3], background: withAlpha(nfcCtx.type === "salida" ? "#6366F1" : ac, 4), borderRadius: radius.md, border: `1.5px solid ${withAlpha(nfcCtx.type === "salida" ? "#6366F1" : ac, 8)}` }}>
              <div style={{ width: 28, height: 28, borderRadius: radius.sm, background: withAlpha(nfcCtx.type === "salida" ? "#6366F1" : ac, 6), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={nfcCtx.type === "salida" ? "calm" : "energy"} size={14} color={nfcCtx.type === "salida" ? "#6366F1" : ac} /></div>
              <div>
                <div style={ty.label(nfcCtx.type === "salida" ? "#6366F1" : ac)}>{nfcCtx.type === "salida" ? "SESIÓN DE SALIDA" : "SESIÓN DE ENTRADA"}</div>
                <div style={ty.caption(t1)}>{nfcCtx.type === "salida" ? "Descomprime tu día." : "Activa tu enfoque."}</div>
              </div>
            </div>}

            {/* Immersive entry */}
            {!entryDone && ts === "idle" && st.totalSessions > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} style={{ textAlign: "center", padding: `${space[7]}px 0 ${space[5]}px` }} onClick={() => setEntryDone(true)}>
              <motion.div animate={{ scale: [1, 1.06, 1], opacity: [.7, 1, .7] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <svg width="48" height="48" viewBox="0 0 52 52" style={{ margin: `0 auto ${space[4]}px`, display: "block" }}><circle cx="26" cy="26" r="22" fill="none" stroke={ac} strokeWidth="1.5" opacity=".3" /><circle cx="26" cy="26" r="15" fill="none" stroke={ac} strokeWidth="1" strokeDasharray="4 4" style={{ animation: "innerRing 6s linear infinite" }} /><circle cx="26" cy="26" r="4" fill={ac} opacity=".3" /></svg>
              </motion.div>
              {/* Contextual greeting based on user state */}
              {st.streak >= 3 && <div style={{ ...ty.caption(ac), marginBottom: space[2] }}>{st.streak} días de racha activa</div>}
              <div style={{ ...ty.body(t2), fontSize: font.size.md, fontWeight: font.weight.light, lineHeight: font.leading.relaxed, maxWidth: 300, margin: "0 auto" }}>{daily.phrase}</div>
              {st.todaySessions === 0 && <div style={{ ...ty.caption(t3), marginTop: space[2] }}>Aún sin sesión hoy</div>}
              <div style={{ ...ty.label(t3), marginTop: space[3] }}>TOCA PARA CONTINUAR</div>
            </motion.div>}

            {(entryDone || st.totalSessions === 0 || ts !== "idle") && <>

              {/* ═══ TIMER-FIRST LAYOUT ═══ */}

              {/* Status bar (compact — neural state + level + session progress) */}
              {ts === "idle" && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: space[2] }}>
                <div style={{ display: "flex", alignItems: "center", gap: space[1] }}><div style={{ width: 5, height: 5, borderRadius: radius.full, background: nSt.color, animation: "shimDot 2s ease infinite" }} /><span style={ty.caption(nSt.color)}>{nSt.label}</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: space[2] }}>
                  <span style={{ ...ty.caption(cogLoad.color), display: "flex", alignItems: "center", gap: 3 }}><Icon name="bolt" size={9} color={cogLoad.color} />{st.todaySessions || 0}/{st.sessionGoal || 2}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: space[1] }}><span style={ty.caption(lv.c)}>{lv.n}</span><div style={{ width: 32, height: 3, borderRadius: 2, background: bd, overflow: "hidden" }}><div style={{ width: lPct + "%", height: "100%", borderRadius: 2, background: lv.c }} /></div></div>
                </div>
              </div>}

              {/* ═══ CORE TIMER (HERO POSITION) ═══ */}
              <div onClick={timerTap} role="button" aria-label={ts === "idle" ? "Iniciar sesión" : ts === "running" ? "Pausar sesión" : "Reanudar sesión"} onMouseDown={() => setTp(true)} onMouseUp={() => setTp(false)} onMouseLeave={() => setTp(false)} onTouchStart={() => setTp(true)} onTouchEnd={() => setTp(false)} style={{ position: "relative", width: isActive ? 200 : 250, height: isActive ? 200 : 250, margin: `0 auto ${space[3]}px`, cursor: "pointer", transform: tp ? "scale(0.93)" : "scale(1)", transition: "all .6s cubic-bezier(.34,1.56,.64,1)", userSelect: "none" }}>
                {/* Glow */}
                <motion.div animate={ts === "idle" ? { scale: [1, 1.06, 1], opacity: [.3, .6, .3] } : isActive ? { scale: [1, 1.04, 1], opacity: [.4, .7, .4] } : {}} transition={{ duration: ts === "idle" ? 3.5 : 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", inset: isActive ? -16 : -10, borderRadius: "50%", background: `radial-gradient(circle,${withAlpha(ac, isActive ? 6 : 4)},transparent 65%)`, filter: "blur(6px)" }} />
                {/* Outer breathing ring */}
                {ts !== "paused" && <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", inset: isActive ? -8 : -4, borderRadius: "50%", border: `1.5px solid ${withAlpha(ac, isActive ? 8 : 4)}` }} />}
                <svg width={isActive ? "200" : "250"} height={isActive ? "200" : "250"} viewBox="0 0 260 260" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="130" cy="130" r="116" fill="none" stroke={bd} strokeWidth={ts === "idle" ? "4" : "3"} opacity=".4" />
                  <circle cx="130" cy="130" r="116" fill="none" stroke={ac} strokeWidth={isActive ? "7" : ts === "idle" ? "5" : "3"} strokeLinecap="round" strokeDasharray={CI} strokeDashoffset={ts === "idle" ? 0 : dO} style={{ transition: isActive ? "stroke-dashoffset .95s linear" : "stroke-dashoffset .3s ease", filter: isActive ? `drop-shadow(0 0 8px ${ac}60)` : `drop-shadow(0 0 4px ${ac}30)` }} />
                  <circle cx="130" cy="130" r="98" fill="none" stroke={bd} strokeWidth=".5" strokeDasharray="3 8" style={{ animation: isActive ? "innerRing 10s linear infinite" : "innerRing 30s linear infinite" }} />
                  {ts === "idle" && <circle cx="130" cy="130" r="115" fill="url(#timerGrad)" opacity=".04" />}
                  <defs><radialGradient id="timerGrad"><stop offset="0%" stopColor={ac} /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
                </svg>
                {/* Neural center dot */}
                <motion.div animate={{ opacity: [.3, .7, .3], boxShadow: [`0 0 8px ${ac}30`, `0 0 18px ${ac}50`, `0 0 8px ${ac}30`] }} transition={{ duration: ts === "idle" ? 3 : 1.5, repeat: Infinity, ease: "easeInOut" }} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: isActive ? 6 : 10, height: isActive ? 6 : 10, borderRadius: "50%", background: ac, pointerEvents: "none" }} />
                {/* Center content */}
                <div aria-live={isActive ? "polite" : "off"} aria-atomic="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none", zIndex: 2 }}>
                  {isBr && bL && <div style={{ marginBottom: 4 }}><span style={{ ...ty.label(ac), letterSpacing: 5, opacity: .9 }}>{bL}</span><span style={{ ...ty.title(ac), marginLeft: 4 }}>{bCnt}s</span></div>}
                  <div aria-label={`${sec} segundos`} style={{ fontSize: isActive ? font.size.hero : 56, fontWeight: font.weight.black, color: t1, lineHeight: font.leading.none, letterSpacing: "-3px", textShadow: isActive ? `0 0 20px ${withAlpha(ac, 6)}` : "none" }}>{sec}</div>
                  {isActive && <div style={{ ...ty.title(ac), fontWeight: font.weight.black, marginTop: space[1], opacity: .8 }}>{sessPct}%</div>}
                  {ts === "idle" && <>
                    <div style={{ ...ty.label(t3), fontWeight: font.weight.semibold, marginTop: space[1.5] }}>segundos</div>
                    <motion.div animate={{ opacity: [.5, 1, .5], y: [0, -2, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ marginTop: space[3], display: "flex", flexDirection: "column", alignItems: "center", gap: space[1] }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${ac},#0D9488)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${withAlpha(ac, 12)}` }}><Icon name="bolt" size={16} color="#fff" /></div>
                      <span style={ty.label(ac)}>INICIAR</span>
                    </motion.div>
                  </>}
                  {ts === "paused" && <motion.div animate={{ opacity: [.5, 1, .5] }} transition={{ duration: 2, repeat: Infinity }} style={{ marginTop: space[1.5] }}><span style={{ ...ty.label(ac), letterSpacing: 3 }}>EN PAUSA</span></motion.div>}
                </div>
                {tp && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${withAlpha(ac, 8)}`, animation: "cdPulse .6s ease forwards", pointerEvents: "none" }} />}
              </div>

              {/* BreathOrb */}
              <ErrorBoundary isDark={isDark}>
                <BreathOrb type={ph.ic} color={ac} breathScale={bS} breathLabel={bL} breathCount={bCnt} active={isActive} sessionProgress={pct} />
              </ErrorBoundary>

              {/* Protocol selector + controls (below timer) */}
              {ts === "idle" && <>
                <div style={{ display: "flex", gap: space[1.5], marginBottom: space[2] }}>
                  <motion.button aria-label={`Protocolo: ${pr.n}`} whileTap={{ scale: .96 }} onClick={() => setSl(true)} style={{ flex: 1, padding: `${space[2]}px ${space[3]}px`, borderRadius: radius.md, border: `1.5px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", alignItems: "center", gap: space[2] }}>
                    <div style={{ width: 30, height: 30, borderRadius: radius.sm, background: withAlpha(ac, 6), display: "flex", alignItems: "center", justifyContent: "center", ...ty.caption(ac), fontWeight: font.weight.black }}>{pr.tg}</div>
                    <div style={{ flex: 1, textAlign: "left" }}><div style={ty.title(t1)}>{pr.n}</div><div style={ty.caption(t3)}>{pr.ph.length} fases · {Math.round(pr.d * durMult)}s</div></div>
                    <Icon name="chevron-down" size={12} color={t3} />
                  </motion.button>
                  <motion.button aria-label="Detalle del protocolo" whileTap={{ scale: .93 }} onClick={() => setShowProtoDetail(true)} style={{ width: 42, height: 42, borderRadius: radius.md, border: `1.5px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="info" size={15} color={t3} /></motion.button>
                  <motion.button aria-label="Seleccionar intención" whileTap={{ scale: .93 }} onClick={() => setShowIntent(true)} style={{ width: 42, height: 42, borderRadius: radius.md, border: `1.5px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="target" size={16} color={t3} /></motion.button>
                </div>

                {/* Duration + Mood — compact row */}
                <div style={{ display: "flex", gap: space[2], marginBottom: space[2.5], alignItems: "stretch" }}>
                  {/* Duration pills */}
                  <div style={{ display: "flex", gap: space[1] }}>
                    {[{ v: .5, l: "60s" }, { v: 1, l: "120s" }, { v: 1.5, l: "180s" }].map(d => (
                      <motion.button key={d.v} aria-label={`Duración ${d.l}`} aria-pressed={durMult === d.v} whileTap={{ scale: .93 }} onClick={() => { setDurMult(d.v); setSec(Math.round(pr.d * d.v)); H("tap"); }} style={{ padding: `${space[1]}px ${space[2.5]}px`, borderRadius: radius.xl, border: durMult === d.v ? `2px solid ${ac}` : `1.5px solid ${bd}`, background: durMult === d.v ? withAlpha(ac, 4) : cd, color: durMult === d.v ? ac : t3, ...ty.caption(durMult === d.v ? ac : t3), fontWeight: font.weight.bold, cursor: "pointer", transition: "all .2s", minHeight: 38 }}>{d.l}</motion.button>
                    ))}
                  </div>
                  {/* Mood mini-selector */}
                  <div style={{ display: "flex", gap: 3, flex: 1, justifyContent: "flex-end" }}>
                    {MOODS.map(m => (
                      <motion.button key={m.id} aria-label={`Estado: ${m.label}`} aria-pressed={preMood === m.value} whileTap={{ scale: .9 }} onClick={() => { setPreMood(m.value); H("tap"); }} style={{ width: 38, height: 38, borderRadius: radius.sm + 2, border: preMood === m.value ? `2px solid ${m.color}` : `1.5px solid ${bd}`, background: preMood === m.value ? withAlpha(m.color, 4) : cd, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={m.icon} size={15} color={preMood === m.value ? m.color : t3} />
                      </motion.button>))}
                  </div>
                </div>

                {/* START CTA */}
                <motion.button aria-label="Iniciar sesión" whileTap={{ scale: .95 }} onClick={go} style={{ width: "100%", maxWidth: 300, margin: `0 auto ${space[3]}px`, display: "flex", padding: `${space[2.5]}px 0`, borderRadius: radius.full, background: `linear-gradient(135deg,${ac},#0D9488)`, border: "none", color: "#fff", ...ty.button, cursor: "pointer", alignItems: "center", justifyContent: "center", gap: space[2], boxShadow: `0 4px 18px ${withAlpha(ac, 10)}`, minHeight: 48 }}><Icon name="bolt" size={13} color="#fff" />INICIAR</motion.button>
              </>}

              {/* Active session controls */}
              {ts === "running" && <div style={{ display: "flex", gap: space[2], justifyContent: "center", alignItems: "center", marginBottom: space[3] }}>
                <motion.button aria-label="Pausar sesión" whileTap={{ scale: .95 }} onClick={pa} style={{ flex: 1, maxWidth: 180, padding: `${space[3]}px 0`, borderRadius: radius.full, background: cd, border: `2px solid ${ac}`, color: ac, ...ty.button, cursor: "pointer", minHeight: 48 }}>PAUSAR</motion.button>
                <motion.button aria-label="Reiniciar sesión" whileTap={{ scale: .9 }} onClick={rs} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="reset" size={15} color={t3} /></motion.button>
              </div>}
              {ts === "paused" && <div style={{ display: "flex", gap: space[2], justifyContent: "center", alignItems: "center", marginBottom: space[3] }}>
                <motion.button aria-label="Continuar sesión" whileTap={{ scale: .95 }} onClick={resume} style={{ flex: 1, maxWidth: 180, padding: `${space[3]}px 0`, borderRadius: radius.full, background: ac, border: "none", color: "#fff", ...ty.button, cursor: "pointer", minHeight: 48 }}>CONTINUAR</motion.button>
                <motion.button aria-label="Reiniciar sesión" whileTap={{ scale: .9 }} onClick={rs} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${bd}`, background: cd, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="reset" size={15} color={t3} /></motion.button>
              </div>}

              {/* Phase info */}
              <div style={{ textAlign: "center", marginBottom: isActive ? space[1.5] : space[2.5] }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: space[1.5] }}>
                  <Icon name={ph.ic} size={isActive ? 11 : 13} color={ac} />
                  <span style={{ ...ty.title(t1), fontSize: isActive ? font.size.sm : font.size.md }}>{ph.l}</span>
                </div>
                {!isActive && <div style={ty.caption(t3)}>{ph.r}</div>}
              </div>

              <motion.div key={pi} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .3 }} style={{ background: cd, borderRadius: radius.lg, padding: space[4], marginBottom: space[2.5], border: `1px solid ${bd}` }}>
                {isActive && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: space[1.5] }}><span style={ty.caption(ac)}>Fase {pi + 1} de {pr.ph.length}</span><span style={ty.caption(t3)}>{Math.round((pi + 1) / pr.ph.length * 100)}%</span></div>}
                {ph.k && <div style={{ fontSize: font.size.lg, fontWeight: font.weight.black, color: t1, lineHeight: font.leading.normal, marginBottom: space[2.5], letterSpacing: font.tracking.tight }}>{ph.k}</div>}
                <p style={{ ...ty.body(t2), margin: 0 }}>{ph.i}</p>

                {/* Anti-gaming checkpoints */}
                {isActive && (() => {
                  const elapsed = totalDur - sec;
                  const cp1 = Math.round(totalDur * 0.25), cp2 = Math.round(totalDur * 0.50), cp3 = Math.round(totalDur * 0.78);
                  const isCP1 = elapsed >= cp1 && elapsed < cp1 + 10;
                  const isCP2 = elapsed >= cp2 && elapsed < cp2 + 10;
                  const isCP3 = elapsed >= cp3 && elapsed < cp3 + 10;
                  if (!isCP1 && !isCP2 && !isCP3) return null;
                  if (elapsed === cp1) speak("Mantén presionado", circadian, voiceOn);
                  else if (elapsed === cp2) speak("Toca al exhalar", circadian, voiceOn);
                  else if (elapsed === cp3) speak("Confirma tu presencia", circadian, voiceOn);

                  if (isCP1) return (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: space[3] }}>
                      <button
                        onTouchStart={e => { e.currentTarget.dataset.holdStart = Date.now(); e.currentTarget.style.transform = "scale(0.94)"; hapticBreath("INHALA"); const bar = e.currentTarget.querySelector("[data-hold-bar]"); if (bar) { bar.style.transition = "width 2.5s linear"; bar.style.width = "100%"; } }}
                        onTouchEnd={e => { const dur = Date.now() - (+e.currentTarget.dataset.holdStart || Date.now()); e.currentTarget.style.transform = "scale(1)"; const bar = e.currentTarget.querySelector("[data-hold-bar]"); if (bar) { bar.style.transition = "none"; bar.style.width = "0%"; } if (dur >= 2000) { setSessionData(d => ({ ...d, touchHolds: (d.touchHolds || 0) + 1, interactions: (d.interactions || 0) + 1, reactionTimes: [...(d.reactionTimes || []), dur] })); H("ok"); speak("verificado", circadian, voiceOn); } else { setSessionData(d => ({ ...d, interactions: (d.interactions || 0) + 0.3 })); H("tap"); } }}
                        onMouseDown={e => { e.currentTarget.dataset.holdStart = Date.now(); e.currentTarget.style.transform = "scale(0.94)"; const bar = e.currentTarget.querySelector("[data-hold-bar]"); if (bar) { bar.style.transition = "width 2.5s linear"; bar.style.width = "100%"; } }}
                        onMouseUp={e => { const dur = Date.now() - (+e.currentTarget.dataset.holdStart || Date.now()); e.currentTarget.style.transform = "scale(1)"; const bar = e.currentTarget.querySelector("[data-hold-bar]"); if (bar) { bar.style.transition = "none"; bar.style.width = "0%"; } if (dur >= 2000) { setSessionData(d => ({ ...d, touchHolds: (d.touchHolds || 0) + 1, interactions: (d.interactions || 0) + 1, reactionTimes: [...(d.reactionTimes || []), dur] })); H("ok"); } else { setSessionData(d => ({ ...d, interactions: (d.interactions || 0) + 0.3 })); H("tap"); } }}
                        style={{ width: "100%", padding: `${space[3]}px ${space[4]}px`, borderRadius: radius.lg, border: `2px solid ${withAlpha(ac, 10)}`, background: withAlpha(ac, 2), cursor: "pointer", display: "flex", flexDirection: "column", gap: space[2], transition: "all .3s", position: "relative", overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: space[2] }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: ac, opacity: .7, animation: "pu 1s ease infinite" }} /><span style={ty.title(ac)}>Mantén presionado 2s</span></div>
                        <div style={{ height: 4, background: bd, borderRadius: radius.sm, overflow: "hidden", width: "100%" }}><div data-hold-bar="" style={{ width: "0%", height: "100%", background: `linear-gradient(90deg,${withAlpha(ac, 20)},${ac})`, borderRadius: radius.sm }} /></div>
                      </button>
                    </motion.div>);
                  if (isCP2) return (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: space[3] }}>
                      <button onClick={() => { const isExhale = bL === "EXHALA" || bL === "SOSTÉN"; setSessionData(d => ({ ...d, interactions: (d.interactions || 0) + (isExhale ? 1 : 0.7), reactionTimes: [...(d.reactionTimes || []), Date.now() % 1000] })); H("tap"); if (isExhale) speak("sincronizado", circadian, voiceOn); }}
                        style={{ width: "100%", padding: `${space[3]}px ${space[4]}px`, borderRadius: radius.lg, border: `1.5px dashed ${withAlpha(ac, 12)}`, background: withAlpha(ac, 2), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: space[2] }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: bL === "EXHALA" ? ac : "transparent", border: `2px solid ${ac}`, opacity: .6 }} /><span style={ty.title(ac)}>Toca al exhalar</span>
                        {bL === "EXHALA" && <span style={{ ...ty.caption(ac), fontWeight: font.weight.black }}>AHORA</span>}
                      </button>
                    </motion.div>);
                  return (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: space[3] }}>
                      <button onClick={() => { setSessionData(d => ({ ...d, interactions: (d.interactions || 0) + 1, reactionTimes: [...(d.reactionTimes || []), Date.now() % 1000] })); H("tap"); speak("confirmado", circadian, voiceOn); }}
                        style={{ width: "100%", padding: `${space[3]}px ${space[4]}px`, borderRadius: radius.lg, border: `1.5px solid ${withAlpha(ac, 8)}`, background: withAlpha(ac, 2), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: space[2] }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: ac, opacity: .5 }} /><span style={ty.title(ac)}>Confirma tu presencia</span>
                      </button>
                    </motion.div>);
                })()}

                {/* Science */}
                <button onClick={() => setShowScience(!showScience)} style={{ display: "flex", alignItems: "center", gap: space[1], marginTop: space[3], padding: `${space[1.5]}px 0`, background: "none", border: "none", cursor: "pointer" }}>
                  <Icon name="mind" size={11} color={ac} /><span style={ty.caption(ac)}>NEUROCIENCIA</span>
                  <span style={{ ...ty.caption(ac), transform: showScience ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▾</span>
                </button>
                <AnimatePresence>
                  {showScience && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                    <div style={{ marginTop: space[2], padding: `${space[3]}px ${space[3]}px`, background: withAlpha(ac, 2), borderRadius: radius.md, border: `1px solid ${withAlpha(ac, 4)}` }}>
                      <div style={ty.body(t2)}>{ph.sc}</div>
                      {SCIENCE_DEEP[pr.id] && <div style={{ ...ty.caption(t3), lineHeight: font.leading.relaxed, borderTop: `1px solid ${bd}`, paddingTop: space[2], marginTop: space[1] }}>{SCIENCE_DEEP[pr.id]}</div>}
                    </div>
                  </motion.div>}
                </AnimatePresence>
              </motion.div>

              {/* Next phase hint */}
              {isActive && nextPh && <div style={{ display: "flex", alignItems: "center", gap: space[1.5], padding: `${space[1.5]}px ${space[2.5]}px`, marginBottom: space[2.5], borderRadius: radius.sm, background: surface }}>
                <Icon name="chevron" size={10} color={t3} /><span style={ty.caption(t3)}>Siguiente: {nextPh.l}</span>
              </div>}

              {/* Phase dots — full in idle, compact bar in active */}
              {!isActive ? <div style={{ display: "flex", gap: space[1], justifyContent: "center", flexWrap: "wrap", marginBottom: space[3] }}>
                {pr.ph.map((p, i) => { const sR = durMult !== 1 ? Math.round(p.s * durMult) + "–" + Math.round(p.e * durMult) + "s" : p.r; const isCurr = pi === i; const isDone = i < pi; return (
                  <motion.div key={i} animate={isCurr ? { scale: [1, 1.03, 1] } : {}} transition={isCurr ? { duration: 2, repeat: Infinity } : {}} style={{ padding: `${space[1]}px ${space[2.5]}px`, borderRadius: radius.xl, border: isCurr ? `2px solid ${ac}` : isDone ? `1.5px solid ${withAlpha(ac, 12)}` : `1px solid ${bd}`, background: isCurr ? withAlpha(ac, 4) : isDone ? withAlpha(ac, 2) : cd, color: isCurr ? ac : isDone ? ac : t3, ...ty.caption(isCurr ? ac : isDone ? ac : t3), fontWeight: isCurr ? font.weight.black : font.weight.semibold, display: "flex", alignItems: "center", gap: space[1], opacity: i <= pi ? 1 : .4, boxShadow: isCurr ? `0 2px 8px ${withAlpha(ac, 6)}` : "none", transition: "all .3s" }}>
                    <span style={{ width: isCurr ? 7 : 5, height: isCurr ? 7 : 5, borderRadius: "50%", background: isDone || isCurr ? ac : bd, transition: "all .3s", boxShadow: isCurr ? `0 0 6px ${withAlpha(ac, 14)}` : "none" }} />
                    {isCurr && <Icon name={p.ic} size={10} color={ac} />}{sR}
                  </motion.div>); })}
              </div> : <div style={{ display: "flex", gap: 2, marginBottom: space[2] }}>
                {pr.ph.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < pi ? ac : i === pi ? withAlpha(ac, 20) : bd, transition: "background .3s" }} />)}
              </div>}

              {/* Progress bar (active only — clean replacement for waveform) */}
              {isActive && <div style={{ marginBottom: space[2], height: 4, borderRadius: 2, background: bd, overflow: "hidden" }}>
                <div style={{ width: (pct * 100) + "%", height: "100%", background: `linear-gradient(90deg,${withAlpha(ac, 20)},${ac})`, transition: "width .95s linear", borderRadius: 2 }} />
              </div>}

              {/* ═══ CONTEXTUAL AI SECTION (idle only) ═══ */}
              {ts === "idle" && <>
                {/* Streak Shield */}
                <ErrorBoundary isDark={isDark}>
                  <StreakShield st={st} isDark={isDark} onQuickSession={() => { setDurMult(0.5); const calmP = P.find(p => p.int === "calma" && p.dif === 1) || P[0]; setPr(calmP); setSec(Math.round(calmP.d * 0.5)); go(); }} />
                </ErrorBoundary>

                {/* Daily Ignición */}
                <motion.button whileTap={{ scale: .97 }} onClick={() => sp(daily.proto)} style={{ width: "100%", padding: `${space[3]}px ${space[3]}px`, marginBottom: space[2.5], borderRadius: radius.lg, border: `1.5px solid ${withAlpha(daily.proto.cl, 8)}`, background: `linear-gradient(135deg,${withAlpha(daily.proto.cl, 2)},${withAlpha(daily.proto.cl, 1)})`, cursor: "pointer", textAlign: "left", display: "flex", gap: space[3], alignItems: "center", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: withAlpha(daily.proto.cl, 4) }} />
                  <div style={{ width: 40, height: 40, borderRadius: radius.sm + 3, background: withAlpha(daily.proto.cl, 6), display: "flex", alignItems: "center", justifyContent: "center", ...ty.title(daily.proto.cl), fontWeight: font.weight.black, flexShrink: 0, border: `1px solid ${withAlpha(daily.proto.cl, 6)}` }}>{daily.proto.tg}</div>
                  <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                    <div style={ty.label(daily.proto.cl)}>IGNICIÓN DEL DÍA</div>
                    <div style={{ ...ty.title(t1), fontWeight: font.weight.black }}>{daily.proto.n}</div>
                    <div style={{ ...ty.caption(t3), fontStyle: "italic", lineHeight: font.leading.snug }}>{daily.phrase}</div>
                  </div>
                  <Icon name="bolt" size={14} color={daily.proto.cl} />
                </motion.button>

                {/* AI Recommendation */}
                {aiRec && aiRec.primary && aiRec.primary.protocol.id !== daily.proto.id && <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: .97 }} onClick={() => sp(aiRec.primary.protocol)} style={{ width: "100%", padding: `${space[2.5]}px ${space[3]}px`, marginBottom: space[2.5], borderRadius: radius.md, border: `1.5px solid ${withAlpha(ac, 6)}`, background: isDark ? "#0A1A0A" : "#F0FDF4", cursor: "pointer", textAlign: "left", display: "flex", gap: space[2.5], alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: radius.sm, background: withAlpha(ac, 6), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="cpu" size={13} color={ac} /></div>
                  <div style={{ flex: 1 }}><div style={{ ...ty.caption(ac), fontWeight: font.weight.bold }}>IA: {aiRec.primary.protocol.n}</div><div style={ty.caption(t3)}>{aiRec.primary.reason}</div></div>
                  <Icon name="chevron" size={12} color={ac} />
                </motion.button>}

                {/* Expandable secondary */}
                {(prediction || (st.progDay || 0) < 7) && <>
                  <button onClick={() => { setShowMore(!showMore); H("tap"); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: space[1.5], padding: `${space[1.5]}px 0`, marginBottom: showMore ? space[2.5] : space[3], background: "none", border: "none", cursor: "pointer" }}>
                    <div style={{ flex: 1, height: 1, background: bd }} />
                    <span style={{ ...ty.caption(t3), display: "flex", alignItems: "center", gap: space[1], flexShrink: 0 }}>{showMore ? "Menos" : "Más"} <span style={{ transform: showMore ? "rotate(180deg)" : "rotate(0)", display: "inline-block", transition: "transform .2s" }}>▾</span></span>
                    <div style={{ flex: 1, height: 1, background: bd }} />
                  </button>
                  <AnimatePresence>
                    {showMore && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                      {prediction && <div style={{ display: "flex", alignItems: "center", gap: space[2], padding: `${space[2.5]}px ${space[3]}px`, marginBottom: space[2.5], background: prediction.predictedDelta > 0 ? (isDark ? "#0A1A0A" : "#F0FDF4") : surface, borderRadius: radius.md, border: `1px solid ${prediction.predictedDelta > 0 ? withAlpha("#059669", 8) : bd}` }}>
                        <Icon name="predict" size={14} color={prediction.predictedDelta > 0 ? "#059669" : "#6366F1"} />
                        <div style={{ flex: 1 }}><div style={ty.caption(prediction.predictedDelta > 0 ? "#059669" : "#6366F1")}>{prediction.message}</div><div style={{ ...ty.caption(t3), marginTop: 1 }}>Confianza: {prediction.confidence}%</div></div>
                      </div>}
                      {(st.progDay || 0) < 7 && <div style={{ marginBottom: space[2.5], background: cd, borderRadius: radius.lg, padding: space[3], border: `1px solid ${bd}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space[2] }}>
                          <div style={ty.label(ac)}>Programa 7 Días</div>
                          <span style={ty.caption(t1)}>Día {Math.min((st.progDay || 0) + 1, 7)}/7</span>
                        </div>
                        <div style={{ display: "flex", gap: 3, marginBottom: space[2.5] }}>
                          {PROG_7.map((p, i) => { const done = i < (st.progDay || 0); const curr = i === (st.progDay || 0); return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: done ? ac : curr ? withAlpha(ac, 20) : bd, transition: "background .5s" }} />; })}</div>
                        <motion.button whileTap={{ scale: .97 }} onClick={() => { const p = P.find(x => x.id === progStep.pid); if (p) sp(p); }} style={{ width: "100%", padding: space[2.5], borderRadius: radius.md, border: `1px solid ${bd}`, background: surface, cursor: "pointer", display: "flex", alignItems: "center", gap: space[2] }}>
                          <div style={{ width: 28, height: 28, borderRadius: radius.sm, background: withAlpha(ac, 4), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="bolt" size={12} color={ac} /></div>
                          <div style={{ flex: 1, textAlign: "left" }}><div style={ty.title(t1)}>{progStep.t}</div><div style={ty.caption(t3)}>{progStep.d}</div></div>
                          <Icon name="chevron" size={12} color={ac} />
                        </motion.button>
                      </div>}
                    </motion.div>}
                  </AnimatePresence>
                </>}
              </>}
            </>}
          </div>
        )}

        {/* ═══ TAB: DASHBOARD ═══ */}
        {tab === "dashboard" && <ErrorBoundary isDark={isDark}><DashboardView st={st} isDark={isDark} ac={ac} switchTab={switchTab} sp={sp} onShowHist={() => setShowHist(true)} /></ErrorBoundary>}

        {/* ═══ TAB: PERFIL ═══ */}
        {tab === "perfil" && <ErrorBoundary isDark={isDark}><ProfileView st={st} setSt={setSt} isDark={isDark} ac={ac} onShowSettings={() => setShowSettings(true)} onShowHist={() => setShowHist(true)} onShowCalibration={() => setShowCalibration(true)} /></ErrorBoundary>}
      </div>

      {/* ═══ BOTTOM NAV (unified — metrics integrated) ═══ */}
      <nav role="navigation" aria-label="Navegación principal" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: layout.maxWidth, background: resolveTheme(isDark).overlay, backdropFilter: "blur(20px)", borderTop: `1px solid ${bd}`, padding: `0 ${space[4]}px max(10px, env(safe-area-inset-bottom))`, display: "flex", flexDirection: "column", zIndex: z.nav }}>
        {/* Micro neural metrics — visible on Ignición tab only */}
        {tab === "ignicion" && <div style={{ display: "flex", justifyContent: "center", gap: space[4], padding: `6px 0 2px` }}>
          {[{ v: st.coherencia, l: "Enfoque", c: "#3B82F6" }, { v: st.resiliencia, l: "Calma", c: "#8B5CF6" }, { v: st.capacidad, l: "Energía", c: "#6366F1" }].map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: radius.full, background: m.c }} />
              <span style={{ fontSize: font.size.xs, fontWeight: font.weight.bold, color: m.c }}>{m.v}%</span>
              <span style={{ fontSize: font.size.xs, color: t3, fontWeight: font.weight.semibold }}>{m.l}</span>
            </div>))}
        </div>}
        {/* Tab buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: space[1], padding: `4px 0 4px` }}>
          {[{ id: "ignicion", lb: "Ignición", ic: "bolt", ac: ac }, { id: "dashboard", lb: "Dashboard", ic: "chart", ac: "#6366F1" }, { id: "perfil", lb: "Perfil", ic: "user", ac: t1 }].map(t => { const a = tab === t.id; return (
            <motion.button key={t.id} aria-label={t.lb} aria-current={a ? "page" : undefined} whileTap={{ scale: .92 }} onClick={() => switchTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 0 4px", border: "none", cursor: "pointer", background: "transparent", borderRadius: radius.md, position: "relative", minHeight: 44 }}>
              {a && <motion.div layoutId="navIndicator" style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2.5, borderRadius: "0 0 3px 3px", background: t.ac }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <motion.div animate={{ scale: a ? 1 : 0.9, y: a ? -1 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ width: 30, height: 30, borderRadius: radius.sm + 2, background: a ? withAlpha(t.ac, 6) : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>
                <Icon name={t.ic} size={a ? 18 : 16} color={a ? t.ac : t3} />
              </motion.div>
              <span style={{ fontSize: font.size.xs, fontWeight: a ? font.weight.black : font.weight.semibold, color: a ? t.ac : t3, transition: "all .2s", letterSpacing: a ? font.tracking.wide : font.tracking.normal }}>{t.lb}</span>
            </motion.button>); })}
        </div>
      </nav>
    </div>
  );
}
