"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MID_MSGS, POST_MSGS,
} from "../lib/constants";
import {
  calcSessionCompletion,
} from "../lib/neural";
import {
  hap, hapticPhase, hapticBreath,
  startAmbient, stopAmbient,
  startSoundscape, stopSoundscape,
  startBinaural, stopBinaural,
  setupMotionDetection,
  requestWakeLock, releaseWakeLock,
  unlockVoice, speak, speakNow, stopVoice,
} from "../lib/audio";

const PAUSE_TIMEOUT = 300000; // 5 min auto-reset

/**
 * useSessionEngine — encapsulates all timer, breathing, countdown,
 * pause/resume, audio, motion, and session completion logic.
 */
export function useSessionEngine({
  st, setSt, pr, durMult, nfcCtx, circadian, voiceOn, H,
  storeActions,
}) {
  // ─── Timer State ───────────────────────────────────────
  const [ts, setTs] = useState("idle");
  const [sec, setSec] = useState(Math.round(pr.d * durMult));
  const [pi, setPi] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [compFlash, setCompFlash] = useState(false);

  // ─── Breathing State ───────────────────────────────────
  const [bL, setBL] = useState("");
  const [bS, setBS] = useState(1);
  const [bCnt, setBCnt] = useState(0);

  // ─── Mid-Session Messages ──────────────────────────────
  const [midMsg, setMidMsg] = useState("");
  const [showMid, setShowMid] = useState(false);

  // ─── Post-Session ──────────────────────────────────────
  const [postStep, setPostStep] = useState("none");
  const [postVC, setPostVC] = useState(0);
  const [postMsg, setPostMsg] = useState("");

  // ─── Check-in State ────────────────────────────────────
  const [checkMood, setCheckMood] = useState(0);
  const [checkEnergy, setCheckEnergy] = useState(0);
  const [checkTag, setCheckTag] = useState("");
  const [preMood, setPreMood] = useState(0);

  // ─── Session Data ──────────────────────────────────────
  const [sessionData, setSessionData] = useState({
    pauses: 0, scienceViews: 0, interactions: 0,
    touchHolds: 0, motionSamples: 0, stability: 0,
    reactionTimes: [], phaseTimings: [],
  });

  // ─── Refs ──────────────────────────────────────────────
  const iR = useRef(null);   // timer interval
  const bR = useRef(null);   // breath interval
  const tR = useRef(null);   // tick interval (haptic)
  const cdR = useRef(null);  // countdown interval
  const pauseTRef = useRef(null);
  const motionRef = useRef(null);
  // Stable refs for latest values (prevents stale closures)
  const tsRef = useRef(ts);
  const stRef = useRef(st);
  const prRef = useRef(pr);
  const durMultRef = useRef(durMult);

  // Keep refs in sync
  tsRef.current = ts;
  stRef.current = st;
  prRef.current = pr;
  durMultRef.current = durMult;

  // ─── Derived ───────────────────────────────────────────
  const totalDur = Math.round(pr.d * durMult);
  const pct = totalDur > 0 ? (totalDur - sec) / totalDur : 0;
  const ph = pr.ph[pi];
  const isActive = ts === "running";
  const isBr = isActive && ph?.br;
  const moodDiff = preMood > 0 && checkMood > 0 ? checkMood - preMood : null;
  const CI = 2 * Math.PI * 116;
  const dO = CI * (1 - pct);
  const sessPct = Math.round(pct * 100);
  const nextPh = pi < pr.ph.length - 1 ? pr.ph[pi + 1] : null;

  // ─── Sync sec when protocol or durMult changes (idle only) ─
  useEffect(() => {
    if (ts === "idle") {
      setSec(Math.round(pr.d * durMult));
      setPi(0);
    }
  }, [pr.id, durMult]);

  // ─── Visibility pause (uses ref to avoid stale closure) ──
  useEffect(() => {
    if (ts !== "running" || typeof document === "undefined") return;
    function onVis() {
      if (document.visibilityState === "hidden" && tsRef.current === "running") {
        doPause();
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [ts]);

  // ─── Audio: ambient/soundscape/binaural ────────────────
  useEffect(() => {
    if (ts === "running" && st.soundOn !== false) {
      const ss = st.soundscape || "off";
      if (ss !== "off") startSoundscape(ss); else startAmbient();
      startBinaural(pr.int);
    } else {
      stopAmbient(); stopSoundscape(); stopBinaural();
    }
    return () => { stopAmbient(); stopSoundscape(); stopBinaural(); };
  }, [ts]);

  // ─── Motion detection (cleanup on ANY ts change) ───────
  useEffect(() => {
    if (ts === "running") {
      motionRef.current = setupMotionDetection(({ samples, stability }) => {
        setSessionData(d => ({ ...d, motionSamples: samples, stability }));
      });
    }
    return () => {
      if (motionRef.current) { motionRef.current.cleanup(); motionRef.current = null; }
    };
  }, [ts]);

  // ─── Timer interval ────────────────────────────────────
  useEffect(() => {
    if (ts === "running") {
      iR.current = setInterval(() => {
        setSec(p => {
          if (p <= 1) { clearInterval(iR.current); setTs("done"); H("ok"); return 0; }
          return p - 1;
        });
      }, 1000);
      tR.current = setInterval(() => H("tick"), 4000);
    }
    return () => {
      if (iR.current) clearInterval(iR.current);
      if (tR.current) clearInterval(tR.current);
    };
  }, [ts]);

  // ─── Phase detection ───────────────────────────────────
  useEffect(() => {
    const el = totalDur - sec;
    const scale = durMult;
    let idx = 0;
    for (let i = pr.ph.length - 1; i >= 0; i--) {
      if (el >= Math.round(pr.ph[i].s * scale)) { idx = i; break; }
    }
    if (idx !== pi) {
      setPi(idx);
      if (pr.ph[idx]?.ic) hapticPhase(pr.ph[idx].ic);
      speakNow("Fase " + (idx + 1) + " de " + pr.ph.length + ". " + (pr.ph[idx]?.k || ""), circadian, voiceOn);
      setTimeout(() => {
        try { if (document.visibilityState === "visible") speak(pr.ph[idx]?.i || "", circadian, voiceOn); } catch (e) { console.warn("[BIO] Phase speak error:", e.message); }
      }, 2500);
    }
    const nxtIdx = pi < pr.ph.length - 1 ? pi + 1 : null;
    if (nxtIdx !== null) {
      const nxtStart = Math.round(pr.ph[nxtIdx].s * scale);
      const ttN = nxtStart - el;
      if (ttN === 2 && ts === "running") speak("Prepárate", circadian, voiceOn);
    }
  }, [sec, pr, durMult]);

  // ─── Mid-session messages ──────────────────────────────
  useEffect(() => {
    if (ts === "running" && sec === 60) {
      setMidMsg(MID_MSGS[Math.floor(Math.random() * MID_MSGS.length)]);
      setShowMid(true);
      setTimeout(() => setShowMid(false), 3500);
    }
    if (ts === "running" && sec === 30) {
      setMidMsg("Últimos 30. Cierra con todo.");
      setShowMid(true);
      setTimeout(() => setShowMid(false), 3000);
    }
  }, [sec, ts]);

  // ─── Completion trigger ────────────────────────────────
  useEffect(() => {
    if (ts === "done" && sec === 0) comp();
  }, [ts, sec]);

  // ─── Breathing engine ──────────────────────────────────
  useEffect(() => {
    if (bR.current) clearInterval(bR.current);
    const curPh = pr.ph[pi];
    if (ts !== "running") { setBL(""); setBS(1); setBCnt(0); return; }
    if (!curPh?.br) {
      setBL(""); setBS(1); setBCnt(0);
      const elapsed = totalDur - sec;
      if (elapsed > 0 && elapsed % 20 === 0 && ts === "running")
        speak("Mantén la atención en la instrucción", circadian, voiceOn);
      return;
    }
    const b = curPh.br;
    const cy = b.in + (b.h1 || 0) + b.ex + (b.h2 || 0);
    if (cy <= 0) { setBL(""); setBS(1); setBCnt(0); return; } // guard div-by-zero
    let t = 0;
    let lastLabel = "";
    function tk() {
      const p = t % cy;
      let lbl = "";
      if (p < b.in) { lbl = "INHALA"; setBS(1 + .25 * (p / b.in)); setBCnt(b.in - p); }
      else if (p < b.in + (b.h1 || 0)) { lbl = "MANTÉN"; setBS(1.25); setBCnt(b.in + (b.h1 || 0) - p); }
      else if (p < b.in + (b.h1 || 0) + b.ex) { const ep = p - b.in - (b.h1 || 0); lbl = "EXHALA"; setBS(1.25 - .25 * (ep / b.ex)); setBCnt(b.ex - ep); }
      else { lbl = "SOSTÉN"; setBS(1); setBCnt(cy - p); }
      setBL(lbl);
      if (lbl !== lastLabel) {
        if (t % 2 === 0 || lbl === "INHALA") speak(lbl.toLowerCase(), circadian, voiceOn);
        hapticBreath(lbl);
        lastLabel = lbl;
      }
      t++;
    }
    tk();
    bR.current = setInterval(tk, 1000);
    return () => { if (bR.current) clearInterval(bR.current); };
  }, [ts, pi, pr]);

  // ─── Control Functions ─────────────────────────────────

  function clearAllIntervals() {
    if (iR.current) clearInterval(iR.current);
    if (bR.current) clearInterval(bR.current);
    if (tR.current) clearInterval(tR.current);
    if (cdR.current) clearInterval(cdR.current);
    if (pauseTRef.current) clearTimeout(pauseTRef.current);
  }

  function startCountdown() {
    setCountdown(3); H("tap");
    speakNow("Tres", circadian, voiceOn);
    cdR.current = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) {
          clearInterval(cdR.current);
          setTs("running"); H("go");
          speakNow(prRef.current.ph[0]?.k || "Comienza", circadian, voiceOn);
          return 0;
        }
        speakNow(p === 2 ? "Dos" : "Uno", circadian, voiceOn);
        H("tap");
        return p - 1;
      });
    }, 1000);
  }

  const go = useCallback(() => {
    unlockVoice(); requestWakeLock();
    try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch (e) { console.warn("[BIO] Fullscreen not available"); }
    setPostStep("none");
    setSessionData({
      pauses: 0, scienceViews: 0, interactions: 0,
      touchHolds: 0, motionSamples: 0, stability: 0,
      reactionTimes: [], phaseTimings: [],
    });
    startCountdown();
  }, [pr, circadian, voiceOn]);

  // Extracted pause logic (non-useCallback for use in visibility handler)
  function doPause() {
    if (iR.current) clearInterval(iR.current);
    if (tR.current) clearInterval(tR.current);
    setTs("paused"); stopVoice(); stopBinaural(); releaseWakeLock();
    setSessionData(d => ({ ...d, pauses: d.pauses + 1 }));
    if (pauseTRef.current) clearTimeout(pauseTRef.current);
    pauseTRef.current = setTimeout(() => { doReset(); }, PAUSE_TIMEOUT);
  }

  const pa = useCallback(() => {
    doPause();
  }, []);

  function doReset() {
    releaseWakeLock();
    clearAllIntervals();
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { console.warn("[BIO] Exit fullscreen error"); }
    setTs("idle"); setSec(Math.round(prRef.current.d * durMultRef.current));
    setPi(0); setBL(""); setBS(1); setBCnt(0);
    setShowMid(false); setPostStep("none");
    setCheckMood(0); setCheckEnergy(0); setCheckTag("");
    setPreMood(0); setCountdown(0); setCompFlash(false);
    stopVoice();
  }

  const rs = useCallback(() => {
    doReset();
  }, [pr, durMult]);

  const resume = useCallback(() => {
    if (pauseTRef.current) clearTimeout(pauseTRef.current);
    setTs("running"); H("go");
    speakNow("continúa", circadian, voiceOn);
    requestWakeLock();
    if (stRef.current.soundOn !== false) startBinaural(prRef.current.int);
  }, [circadian, voiceOn]);

  const timerTap = useCallback(() => {
    unlockVoice(); H("tap");
    const current = tsRef.current;
    if (current === "idle") go();
    else if (current === "running") doPause();
    else if (current === "paused") resume();
  }, [go, resume]);

  function comp() {
    clearAllIntervals();
    if (motionRef.current) { motionRef.current.cleanup(); motionRef.current = null; }
    const curSt = stRef.current;
    const result = calcSessionCompletion(curSt, { protocol: pr, durMult, sessionData, nfcCtx, circadian });
    setPostVC(result.eVC);
    setPostMsg(POST_MSGS[Math.floor(Math.random() * POST_MSGS.length)]);
    releaseWakeLock();
    speakNow(result.bioQ.quality === "alta" ? "Sesión excelente" : "Sesión completada", circadian, voiceOn);
    setCompFlash(true);
    setTimeout(() => { setCompFlash(false); setPostStep("breathe"); }, 800);
    setCheckMood(0); setCheckEnergy(0); setCheckTag("");
    // Single write path: store action persists, setSt syncs local
    if (storeActions?.completeSession) {
      storeActions.completeSession(result.newState);
    }
    setSt({ ...curSt, ...result.newState });
  }

  function submitCheckin() {
    if (checkMood > 0) {
      const entry = {
        ts: Date.now(), mood: checkMood, energy: checkEnergy || 2,
        tag: checkTag, proto: pr.n, pre: preMood || 0,
      };
      if (storeActions?.logMood) {
        storeActions.logMood(entry);
      }
      // Sync local state (consistent slice limit)
      const ml = [...(stRef.current.moodLog || []), entry].slice(-200);
      const ach = [...stRef.current.achievements];
      if (checkMood === 5 && !ach.includes("mood5")) ach.push("mood5");
      setSt({ ...stRef.current, moodLog: ml, achievements: ach });
    }
    setPostStep("summary");
  }

  // ─── Protocol switch (resets timer) ────────────────────
  const selectProtocol = useCallback((p) => {
    doReset();
    setSec(Math.round(p.d * durMultRef.current));
  }, []);

  return {
    // Timer state
    ts, sec, pi, countdown, compFlash,
    totalDur, pct, ph, isActive, isBr,
    CI, dO, sessPct, nextPh,

    // Breathing
    bL, bS, bCnt,

    // Mid-session
    midMsg, showMid,

    // Post-session
    postStep, setPostStep, postVC, postMsg,

    // Check-in
    checkMood, setCheckMood,
    checkEnergy, setCheckEnergy,
    checkTag, setCheckTag,
    preMood, setPreMood,
    moodDiff,

    // Session data (for checkpoints)
    sessionData, setSessionData,

    // Control
    go, pa, rs, resume, timerTap, submitCheckin,
    selectProtocol,

    // Setters needed by duration selector
    setSec,
  };
}
