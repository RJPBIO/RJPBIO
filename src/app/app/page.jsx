"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN v5.0 — NEURAL OPTIMIZATION PLATFORM
   ═══════════════════════════════════════════════════════════════
   Modular Architecture · Zustand · Recharts · Framer Motion
   Lucide Icons · Motor heurístico adaptativo · Coach LLM opcional
   ═══════════════════════════════════════════════════════════════ */

// ─── Imports from modules ─────────────────────────────────
import { P, SCIENCE_DEEP } from "@/lib/protocols";
import {
  MOODS, INTENTS,
  POST_MSGS, PROG_7, DS,
} from "@/lib/constants";
import {
  gL, lvPct, getStatus, getWeekNum, getDailyIgn, getCircadian,
  calcProtoSensitivity, predictSessionImpact,
  estimateCognitiveLoad,
  calcSessionCompletion,
  suggestOptimalTime,
} from "@/lib/neural";
import { useReadiness, computeReadiness } from "@/hooks/useReadiness";
import { useAdaptiveRecommendation, computeAdaptiveRecommendation } from "@/hooks/useAdaptiveRecommendation";
import { useCommandKey } from "@/hooks/useCommandKey";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useSessionAudio } from "@/hooks/useSessionAudio";
import {
  hap, hapticPhase, hapticBreath, hapticSignature, hapticPreShift, hapticCountdown, playIgnition, playChord,
  startBinaural, stopBinaural,
  setupMotionDetection, requestWakeLock, releaseWakeLock,
  unlockVoice, speak, speakNow, stopVoice, loadVoices,
  wireAudioUnlock,
} from "@/lib/audio";
import { resolveTheme, withAlpha, ty, font, space, radius, z, layout, timer as timerSize, bioSignal, brand } from "@/lib/theme";
import { dark as darkPalette } from "@/lib/tokens";
import BioIgnicionMark, { BioGlyph } from "@/components/BioIgnicionMark";
import NeuralCore3D from "@/components/brand/NeuralCore3D";
import IgnitionBurst from "@/components/IgnitionBurst";
import { useStore } from "@/store/useStore";
import Icon from "@/components/Icon";
import { useSync } from "@/hooks/useSync";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useThemeDark } from "@/hooks/useThemeDark";
import { useTapEntry } from "@/hooks/useTapEntry";
import { uiSound } from "@/lib/uiSound";
import { buildCommands } from "@/lib/commandPalette";
import { computePhaseIndex, timeToNextPhase } from "@/lib/phaseEngine";
import { computeSessionMetrics, sessionQualityMessage, shouldPlayIgnitionSignature } from "@/lib/sessionClose";
import { buildCheckinEntry } from "@/lib/sessionCheckin";
import { computeBreathFrame } from "@/lib/breathCycle";
import { readStoredNom35Level, recommendProtocolForNivel, bannerForNivel } from "@/lib/nom35/recommend";
import { useReducedMotion, useFocusTrap, KEY, announce } from "@/lib/a11y";
import { semantic, protoColor } from "@/lib/tokens";

// Dynamic imports (code-split)
const NeuralCalibration = dynamic(() => import("@/components/NeuralCalibration"), { ssr: false });
const BioIgnitionWelcome = dynamic(() => import("@/components/BioIgnitionWelcome"), { ssr: false });
const CommandPalette = dynamic(() => import("@/components/CommandPalette"), { ssr: false });
const ProtocolDetail = dynamic(() => import("@/components/ProtocolDetail"), { ssr: false });
const StreakShield = dynamic(() => import("@/components/StreakShield"), { ssr: false });
const DashboardView = dynamic(() => import("@/components/DashboardView"), { ssr: false });
const ProfileView = dynamic(() => import("@/components/ProfileView"), { ssr: false });
const PostSessionFlow = dynamic(() => import("@/components/PostSessionFlow"), { ssr: false });
const SettingsSheet = dynamic(() => import("@/components/SettingsSheet"), { ssr: false });
const HistorySheet = dynamic(() => import("@/components/HistorySheet"), { ssr: false });
const ProtocolSelector = dynamic(() => import("@/components/ProtocolSelector"), { ssr: false });
const HRVMonitor = dynamic(() => import("@/components/HRVMonitor"), { ssr: false });
const PhysiologicalSigh = dynamic(() => import("@/components/PhysiologicalSigh"), { ssr: false });
const NSDR = dynamic(() => import("@/components/NSDR"), { ssr: false });
const ChronotypeTest = dynamic(() => import("@/components/ChronotypeTest"), { ssr: false });
const ResonanceCalibration = dynamic(() => import("@/components/ResonanceCalibration"), { ssr: false });
const NOM035Questionnaire = dynamic(() => import("@/components/NOM035Questionnaire"), { ssr: false });
const ReadinessScore = dynamic(() => import("@/components/ReadinessScore"), { ssr: false });
const SessionRunner = dynamic(() => import("@/components/SessionRunner"), { ssr: false });
const AmbientLattice = dynamic(() => import("@/components/AmbientLattice"), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function BioIgnicion(){
  const store = useStore();
  const[mt,setMt]=useState(false);const[tab,setTab]=useState("ignicion");const[st,setSt_]=useState(DS);
  const[pr,setPr]=useState(P[12]);const[sc,setSc]=useState("Protocolo");const[sl,setSl]=useState(false);
  const[ts,setTs]=useState("idle");const[sec,setSec]=useState(120);const[pi,setPi]=useState(0);
  const[bL,setBL]=useState("");const[bS,setBS]=useState(1);const[bCnt,setBCnt]=useState(0);
  const[tp,setTp]=useState(false);
  const[ignitionFlash,setIgnitionFlash]=useState(false);
  const[phaseFlash,setPhaseFlash]=useState(false);
  const[orbDoneFlash,setOrbDoneFlash]=useState(false);
  const[postStep,setPostStep]=useState("none");
  const[postVC,setPostVC]=useState(0);const[postMsg,setPostMsg]=useState("");
  const[checkMood,setCheckMood]=useState(0);const[checkEnergy,setCheckEnergy]=useState(0);const[checkTag,setCheckTag]=useState("");
  const[preMood,setPreMood]=useState(0);const[preMoodFromPrefill,setPreMoodFromPrefill]=useState(false);
  const[countdown,setCountdown]=useState(0);
  const[compFlash,setCompFlash]=useState(false);
  const[showHist,setShowHist]=useState(false);const[showSettings,setShowSettings]=useState(false);
  const[onboard,setOnboard]=useState(false);const[welcomeDone,setWelcomeDone]=useState(false);const[showIntent,setShowIntent]=useState(false);const[firstIntent,setFirstIntent]=useState(null);
  const[showScience,setShowScience]=useState(false);
  const[durMult,setDurMult]=useState(1);
  const[entryDone,setEntryDone]=useState(false);
  const[nfcCtx,setNfcCtx]=useState(null);
  const[voiceOn,setVoiceOn]=useState(true);
  const[sessionData,setSessionData]=useState({pauses:0,scienceViews:0,phaseTimings:[]});
  const[showCalibration,setShowCalibration]=useState(false);
  const[showProtoDetail,setShowProtoDetail]=useState(false);
  const[showMore,setShowMore]=useState(false);
  const[showHRV,setShowHRV]=useState(false);
  const[showSigh,setShowSigh]=useState(false);
  const[showNSDR,setShowNSDR]=useState(false);
  const[showChronoTest,setShowChronoTest]=useState(false);
  const[showResonanceCal,setShowResonanceCal]=useState(false);
  const[showNOM035,setShowNOM035]=useState(false);
  const[nom35Hint,setNom35Hint]=useState(null);
  const[nom35Dominios,setNom35Dominios]=useState(null);
  const[showCmd,setShowCmd]=useState(false);
  const reducedMotion=useReducedMotion();
  const bp=useBreakpoint();
  const rootMaxWidth=bp==="desktop"?layout.maxWidthDesktop:bp==="tablet"?layout.maxWidthTablet:layout.maxWidth;
  const rootPadInline=bp==="desktop"?layout.contentPaddingDesktop:bp==="tablet"?layout.contentPaddingTablet:0;
  const iR=useRef(null);const bR=useRef(null);const tR=useRef(null);const cdR=useRef(null);const actLockRef=useRef(false);
  // Wall-clock anchors: startMs = Date.now() al entrar "running"; startSec = valor de sec en ese instante.
  // Cada tick recomputa sec a partir de la diferencia real — inmune a jitter de setInterval y tab throttling.
  const startMsRef=useRef(null);const startSecRef=useRef(null);

  const setSt=useCallback(v=>{const nv=typeof v==="function"?v(st):v;setSt_(nv);store.update(nv);},[st]);

  // SW se registra desde layout.js (con nonce)
  useSync();

  // Tap / NFC / deep-link: parse URL al montar. Lógica + mapa de errores
  // viven en lib/tapEntry.js (testeable sin render). Aquí solo aplicamos
  // el resultado al estado local.
  const tap=useTapEntry({protocols:P,durationMultiplier:durMult});
  useEffect(()=>{if(!tap||tap.kind===null||tap.kind==="error")return;
    setNfcCtx(tap.context);setEntryDone(true);
    setPr(tap.protocol);setSec(tap.seconds);
  },[tap]);

  // ═══ VOICE + AUDIO UNLOCK ═══
  // iOS Safari / Android Chrome: el AudioContext queda suspended hasta que
  // un gesto DENTRO de su call stack llame a resume(). wireAudioUnlock()
  // engancha el primer pointer/touch/key y desbloquea todo el grafo.
  useEffect(()=>{wireAudioUnlock();if(typeof window==="undefined"||!window.speechSynthesis)return;loadVoices();},[]);

  // Pre-fill preMood silently from last session within 4h (reduces friction in Return flow)
  useEffect(()=>{
    if(preMood>0)return;
    const ml=st.moodLog||[];if(!ml.length)return;
    const last=ml[ml.length-1];const ageMs=Date.now()-(last.ts||0);
    if(ageMs<=4*60*60*1000&&typeof last.mood==="number"&&last.mood>0&&last.mood<=5){
      setPreMood(last.mood);
      setPreMoodFromPrefill(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[st.moodLog]);

  // ═══ LOAD STATE (via Zustand) — await init BEFORE reading/writing ═══
  // iOS Safari + Home Screen PWA: IndexedDB a veces cuelga en modo privado o
  // primer arranque. Usamos timeout duro para que la UI siempre aparezca.
  useEffect(()=>{let cancelled=false;let fallbackTO=null;(async()=>{
    fallbackTO=setTimeout(()=>{if(!cancelled)setMt(true);},2500);
    // Intentamos resolver el userId actual con timeout corto. Si falla,
    // tratamos al usuario como anónimo (null). Esto evita que el store
    // herede datos del usuario previo en el mismo navegador.
    let userId=null;
    try{
      const r=await Promise.race([
        fetch("/api/auth/session",{credentials:"same-origin",cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null),
        new Promise((res)=>setTimeout(()=>res(null),800)),
      ]);
      userId=r?.user?.id??null;
    }catch{}
    const initWithTimeout=Promise.race([
      store.init({userId}),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error("store.init timeout")),2000)),
    ]);
    try{await initWithTimeout;}catch(e){}
    if(cancelled)return;
    if(fallbackTO){clearTimeout(fallbackTO);fallbackTO=null;}
    const l=useStore.getState();
    if(!l._loaded){setMt(true);return;}
    setSt_(l);
    setMt(true);
    if(!l.onboardingComplete){setOnboard(true);}
    // Cargamos dominios NOM-035 antes del motor para que el sesgo psicosocial
    // participe en la primera recomendación.
    let domLocal=null;
    try{
      const raw=typeof window!=="undefined"?window.localStorage.getItem("bio-nom35-dominios"):null;
      if(raw){domLocal=JSON.parse(raw);setNom35Dominios(domLocal);}
    }catch{}
    const rec=computeAdaptiveRecommendation(l,{nom35Dominios:domLocal,readiness:computeReadiness(l)});
    if(rec&&rec.primary){setPr(rec.primary.protocol);setSec(Math.round(rec.primary.protocol.d*durMult));}
    // NOM-035: si la última evaluación reporta riesgo medio/alto, sugerimos protocolo acorde.
    try{
      const nivel=readStoredNom35Level();
      const banner=bannerForNivel(nivel);
      if(banner){
        const dismissed=(()=>{try{return window.localStorage.getItem("bio-nom35-hint-dismissed")===nivel;}catch{return false;}})();
        if(!dismissed){
          const recP=recommendProtocolForNivel(nivel,P);
          if(recP){setPr(recP);setSec(Math.round(recP.d*durMult));}
          setNom35Hint({...banner,protocol:recP||null});
        }
      }
    }catch(e){}
  })();return()=>{cancelled=true;if(fallbackTO)clearTimeout(fallbackTO);};},[]);

  // ═══ SESSION RE-CHECK EN VISIBILITY ═══
  // Si el usuario hizo login/logout en otra pestaña mientras esta quedó en
  // background, al volver debemos detectar el cambio de userId y re-inicializar
  // el store para no mezclar datos de dos cuentas en la misma pestaña.
  useEffect(()=>{if(typeof document==="undefined")return;let busy=false;async function recheck(){if(busy)return;if(document.visibilityState!=="visible")return;busy=true;try{const r=await Promise.race([fetch("/api/auth/session",{credentials:"same-origin",cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null),new Promise(res=>setTimeout(()=>res(null),1200))]);const nextId=r?.user?.id??null;const curId=useStore.getState()._userId??null;if(nextId!==curId){await store.init({userId:nextId});setSt_(useStore.getState());}}catch{}finally{busy=false;}}document.addEventListener("visibilitychange",recheck);return()=>document.removeEventListener("visibilitychange",recheck);},[]);

  useCommandKey(setShowCmd, st.soundOn);

  // NOTA: cmdCommands se define MÁS ABAJO, después de las function declarations
  // que referencia (switchTab, go, pa, sp). Evita TDZ bajo React Compiler, que
  // reemite esas function decls como const y pierde el hoisting estándar de JS.

  useEffect(()=>{if(ts!=="running"||typeof document==="undefined")return;function onVis(){if(document.visibilityState==="hidden"&&ts==="running"){setSessionData(d=>({...d,hiddenStart:Date.now()}));pa();}else if(document.visibilityState==="visible"){setSessionData(d=>{if(!d.hiddenStart)return d;return{...d,hiddenMs:(d.hiddenMs||0)+(Date.now()-d.hiddenStart),hiddenStart:null};});}}document.addEventListener("visibilitychange",onVis);return()=>document.removeEventListener("visibilitychange",onVis);},[ts]);
  const stRef=useRef(st);useEffect(()=>{stRef.current=st;},[st]);
  useAutoSave(mt, useCallback(()=>store.update(stRef.current),[]));
  const isDark=useThemeDark({ready:mt,mode:st.themeMode||"auto"});
  const H=useCallback(t=>hap(t,st.soundOn,st.hapticOn),[st.soundOn,st.hapticOn]);
  const hapRef=useRef(H);useEffect(()=>{hapRef.current=H;},[H]);

  const motionRef=useRef(null);const circadian=useMemo(()=>getCircadian(),[]);
  useSessionAudio({timerStatus:ts,soundOn:st.soundOn,soundscape:st.soundscape,intent:pr.int});
  useEffect(()=>{if(ts==="running"){motionRef.current=setupMotionDetection(({samples,stability})=>{setSessionData(d=>({...d,motionSamples:samples,stability:stability}));});}return()=>{if(motionRef.current){motionRef.current.cleanup();motionRef.current=null;}};},[ts]);

  useEffect(()=>{
    if(ts!=="running")return;
    // Anchor a Date.now() al entrar running (o resumir) usando el sec actual como punto de partida.
    startMsRef.current=Date.now();
    startSecRef.current=sec;
    iR.current=setInterval(()=>{
      const elapsed=Math.floor((Date.now()-startMsRef.current)/1000);
      const next=Math.max(0,startSecRef.current-elapsed);
      setSec(prev=>{
        if(prev===next)return prev;
        if(next<=0){clearInterval(iR.current);setTs("done");hapRef.current("ok");return 0;}
        return next;
      });
    },250);
    tR.current=setInterval(()=>hapRef.current("tick"),4000);
    return()=>{if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);};
  },[ts]);
  // Ignition flash: destello one-shot cuando la sesión arranca. Firma audio+haptic
  // hacen tangible la metáfora de "ignición" — no es solo visual.
  useEffect(()=>{
    if(ts==="running"){
      setIgnitionFlash(true);
      // Firma auditiva: 2-tone rise breve (880→1320Hz). Diferenciado del playIgnition() completo
      // que queda reservado para completion.
      if(st.soundOn!==false){try{playChord([880,1320],0.28,0.042);}catch(e){}}
      // Firma háptica: crescendo corto (phaseShift pattern [12,18,24]ms).
      if(st.hapticOn!==false){try{hapticSignature("phaseShift");}catch(e){}}
      const t=setTimeout(()=>setIgnitionFlash(false),900);
      return()=>clearTimeout(t);
    }
  },[ts]);
  // Phase flash: pulso sutil cuando cambia de fase durante running (choreography entre fases).
  useEffect(()=>{if(pi>0&&ts==="running"){setPhaseFlash(true);const t=setTimeout(()=>setPhaseFlash(false),700);return()=>clearTimeout(t);}},[pi,ts]);
  const totalDur=Math.round(pr.d*durMult);
  useEffect(()=>{try{const elapsedSec=totalDur-sec;const idx=computePhaseIndex(elapsedSec,pr.ph,durMult);
    let speakTO=null;
    const phAtIdx=pr?.ph?.[idx];
    if(idx!==pi&&phAtIdx){setPi(idx);if(st.hapticOn!==false)hapticPhase(phAtIdx.ic);if(st.soundOn!==false)try{playChord([523,784],0.22,0.028);}catch(e){}speakNow("Fase "+(idx+1)+" de "+pr.ph.length+". "+phAtIdx.k,circadian,voiceOn);speakTO=setTimeout(()=>{try{if(document.visibilityState==="visible")speak(phAtIdx.i,circadian,voiceOn);}catch(e){}},2500);}
    const ttN=timeToNextPhase(elapsedSec,pr.ph,durMult,pi);
    if(ttN===2&&ts==="running"){speak("Prepárate",circadian,voiceOn);if(st.hapticOn!==false)hapticPreShift();}
    return()=>{if(speakTO)clearTimeout(speakTO);};}catch(e){}
  },[sec,pr,durMult]);
  useEffect(()=>{if(ts==="done"&&sec===0)comp();},[ts,sec]);
  useEffect(()=>{if(bR.current)clearInterval(bR.current);const ph=pr?.ph?.[pi]||pr?.ph?.[0];if(ts!=="running"){setBL("");setBS(1);setBCnt(0);return;}if(!ph||!ph.br){setBL("");setBS(1);setBCnt(0);const elapsed=totalDur-sec;if(elapsed>0&&elapsed%20===0&&ts==="running")speak("Mantén la atención en la instrucción",circadian,voiceOn);return;}let t=0;let lastLabel="";function tk(){const f=computeBreathFrame(t,ph.br);if(!f){t++;return;}setBL(f.label);setBS(f.scale);setBCnt(f.countdown);if(f.label!==lastLabel){if(t%2===0||f.label==="INHALA")speak(f.label.toLowerCase(),circadian,voiceOn);hapticBreath(f.label);lastLabel=f.label;}t++;}tk();bR.current=setInterval(tk,1000);return()=>{if(bR.current)clearInterval(bR.current);};},[ts,pi,pr]);

  function startCountdown(){setCountdown(3);if(st.hapticOn!==false)hapticCountdown(3);try{speakNow("Tres",circadian,voiceOn);}catch(e){}cdR.current=setInterval(()=>{setCountdown(p=>{try{if(p<=1){clearInterval(cdR.current);setTs("running");H("go");speakNow((pr?.ph?.[0]?.k)||"Comienza",circadian,voiceOn);return 0;}speakNow(p===2?"Dos":"Uno",circadian,voiceOn);if(st.hapticOn!==false)hapticCountdown(p-1);return p-1;}catch(e){clearInterval(cdR.current);setTs("running");return 0;}});},1000);}
  function go(){if(actLockRef.current||ts!=="idle"||countdown>0)return;actLockRef.current=true;setTimeout(()=>{actLockRef.current=false;},500);unlockVoice();requestWakeLock();try{const fs=document.documentElement.requestFullscreen?.();if(fs&&typeof fs.catch==="function")fs.catch(()=>{});}catch(e){}setPostStep("none");setPi(0);setSec(Math.round(pr.d*durMult));setSessionData({pauses:0,scienceViews:0,interactions:0,touchHolds:0,motionSamples:0,stability:0,reactionTimes:[],phaseTimings:[],startedAt:Date.now(),hiddenMs:0,hiddenStart:null,expectedSec:Math.round(pr.d*durMult)});startCountdown();}
  const pauseTRef=useRef(null);
  useEffect(()=>()=>{if(cdR.current)clearInterval(cdR.current);if(pauseTRef.current)clearTimeout(pauseTRef.current);},[]);
  function pa(){if(actLockRef.current||ts!=="running")return;actLockRef.current=true;setTimeout(()=>{actLockRef.current=false;},500);if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);setTs("paused");stopVoice();stopBinaural();releaseWakeLock();setSessionData(d=>({...d,pauses:d.pauses+1}));if(pauseTRef.current)clearTimeout(pauseTRef.current);pauseTRef.current=setTimeout(()=>{rs();},300000);}
  function resume(){if(actLockRef.current||ts!=="paused")return;actLockRef.current=true;setTimeout(()=>{actLockRef.current=false;},500);if(pauseTRef.current)clearTimeout(pauseTRef.current);setTs("running");H("go");speakNow("continúa",circadian,voiceOn);requestWakeLock();if(st.soundOn!==false)startBinaural(pr.int);}
  function rs(){releaseWakeLock();if(pauseTRef.current)clearTimeout(pauseTRef.current);try{if(document.fullscreenElement){const ef=document.exitFullscreen?.();if(ef&&typeof ef.catch==="function")ef.catch(()=>{});}}catch(e){}if(iR.current)clearInterval(iR.current);if(bR.current)clearInterval(bR.current);if(tR.current)clearInterval(tR.current);if(cdR.current)clearInterval(cdR.current);setTs("idle");setSec(Math.round(pr.d*durMult));setPi(0);setBL("");setBS(1);setBCnt(0);setPostStep("none");setCheckMood(0);setCheckEnergy(0);setCheckTag("");setPreMood(0);setCountdown(0);setCompFlash(false);stopVoice();}
  function sp(p){
    // Inline reset against the NEW protocol so we don't batch a setSec that
    // races with rs()'s stale-closure setSec(pr.d). Keeps sheet-to-idle
    // transitions deterministic even under React Compiler.
    releaseWakeLock();
    if(pauseTRef.current)clearTimeout(pauseTRef.current);
    try{if(document.fullscreenElement){const ef=document.exitFullscreen?.();if(ef&&typeof ef.catch==="function")ef.catch(()=>{});}}catch(e){}
    if(iR.current)clearInterval(iR.current);
    if(bR.current)clearInterval(bR.current);
    if(tR.current)clearInterval(tR.current);
    if(cdR.current)clearInterval(cdR.current);
    setTs("idle");setPi(0);setBL("");setBS(1);setBCnt(0);
    setPostStep("none");setCheckMood(0);setCheckEnergy(0);setCheckTag("");
    setPreMood(0);setCountdown(0);setCompFlash(false);stopVoice();
    setPr(p);setSl(false);setShowIntent(false);
    setSec(Math.round(p.d*durMult));
    setShowScience(false);
  }
  function timerTap(){unlockVoice();H("tap");if(ts==="idle"){go();}else if(ts==="running")pa();else if(ts==="paused")resume();}
  function switchTab(id){if(id===tab)return;setTab(id);H("tap");uiSound.nav(st.soundOn);announce(`Pestaña ${id==="ignicion"?"Ignición":id==="dashboard"?"Dashboard":"Perfil"} activa`,"polite");}
  const swipeRef=useRef(null);
  const onSwipeStart=useCallback(e=>{if(ts==="running"||ts==="paused"||postStep!=="none"||countdown>0||sl||showCmd||showIntent||showProtoDetail||showHist||showCalibration||onboard)return;if(e.pointerType==="mouse")return;swipeRef.current={x:e.clientX,y:e.clientY,t:Date.now()};},[ts,postStep,countdown,sl,showCmd,showIntent,showProtoDetail,showHist,showCalibration,onboard]);
  const onSwipeEnd=useCallback(e=>{const s=swipeRef.current;swipeRef.current=null;if(!s)return;const dx=e.clientX-s.x;const dy=e.clientY-s.y;const dt=Date.now()-s.t;if(dt>700)return;if(Math.abs(dx)<64)return;if(Math.abs(dx)<Math.abs(dy)*1.4)return;const ids=["ignicion","dashboard","perfil"];const cur=ids.indexOf(tab);const next=dx<0?cur+1:cur-1;if(next>=0&&next<ids.length)switchTab(ids[next]);},[tab]);
  const onTimerKey=useCallback(e=>{if(e.key===KEY.ENTER||e.key===KEY.SPACE){e.preventDefault();timerTap();}},[ts,pr.int,st.soundOn]);
  const onTabKey=useCallback((e,id,order)=>{const ids=["ignicion","dashboard","perfil"];if(e.key===KEY.RIGHT||e.key===KEY.DOWN){e.preventDefault();switchTab(ids[(order+1)%ids.length]);}else if(e.key===KEY.LEFT||e.key===KEY.UP){e.preventDefault();switchTab(ids[(order-1+ids.length)%ids.length]);}else if(e.key===KEY.HOME){e.preventDefault();switchTab(ids[0]);}else if(e.key===KEY.END){e.preventDefault();switchTab(ids[ids.length-1]);}},[]);

  const cmdCommands=useMemo(()=>buildCommands({
    timerStatus:ts,tab,state:st,protocol:pr,durationMultiplier:durMult,protocols:P,
    actions:{
      switchTab,go,pause:pa,setTimerStatus:setTs,startBinaural,requestWakeLock,
      playHaptic:H,setState:setSt,setCheckMood,setPostStep,
      openHistory:()=>setShowHist(true),openSettings:()=>setShowSettings(true),
      openCalibration:()=>setShowCalibration(true),openHRV:()=>setShowHRV(true),
      openSigh:()=>setShowSigh(true),openNSDR:()=>setShowNSDR(true),
      selectProtocol:sp,
    },
  }),[st,durMult,ts,pr,tab]);

  function comp(){if(pauseTRef.current)clearTimeout(pauseTRef.current);if(motionRef.current){motionRef.current.cleanup();motionRef.current=null;}
    const{sessionDataFull}=computeSessionMetrics({sessionData,protocol:pr,durMult,now:Date.now()});
    const result=calcSessionCompletion(st,{protocol:pr,durMult,sessionData:sessionDataFull,nfcCtx,circadian});
    setPostVC(result.eVC);setPostMsg(POST_MSGS[Math.floor(Math.random()*POST_MSGS.length)]);
    releaseWakeLock();speakNow(sessionQualityMessage(result.bioQ.quality),circadian,voiceOn);
    if(shouldPlayIgnitionSignature(result.bioQ.quality)){
      if(st.soundOn!==false)try{playIgnition();}catch(e){}
      if(st.hapticOn!==false)hapticSignature("ignition");
    }
    // Bridge orb → IgnitionBurst: 550ms de flash emerald dentro del orb ANTES de que el
    // overlay full-screen tome el control. Da continuidad narrativa — el orb cierra su ciclo.
    // Sello háptico universal: suave cadencia de cierre (independiente de la calidad).
    if(st.hapticOn!==false&&typeof navigator!=="undefined"&&navigator.vibrate){try{navigator.vibrate([50,30,80]);}catch(e){}}
    setOrbDoneFlash(true);
    setTimeout(()=>{
      setOrbDoneFlash(false);
      setCompFlash(true);
      setTimeout(()=>{setCompFlash(false);setPostStep("breathe");},1600);
    },550);
    setCheckMood(0);setCheckEnergy(0);setCheckTag("");
    setSt({...st,...result.newState});
  }
  function submitCheckin(){
    const built=buildCheckinEntry({
      checkMood,checkEnergy,checkTag,preMood,
      protocol:pr,
      existingMoodLog:st.moodLog||[],
      existingAchievements:st.achievements||[],
      predictedDelta:typeof prediction?.predictedDelta==="number"?prediction.predictedDelta:null,
    });
    if(!built.skipped){
      setSt({...st,moodLog:built.moodLog,achievements:built.achievements});
      if(built.outcome){
        try{store.recordSessionOutcome(built.outcome);setSt_(useStore.getState());}catch{}
      }
    }
    setPostStep("summary");
  }

  const lv=gL(st.totalSessions),ph=pr?.ph?.[pi]||pr?.ph?.[0]||{k:"",i:"",l:"",r:"",ic:"focus",sc:"",s:0,e:0,br:null},fl=INTENTS.some(i=>i.id===sc)?P.filter(p=>p.int===sc):P.filter(p=>p.ct===sc);
  const pct=(totalDur-sec)/totalDur,isBr=ts==="running"&&!!ph?.br;
  const perf=Math.round((st.coherencia+st.resiliencia+st.capacidad)/3);
  const protoSens=useMemo(()=>calcProtoSensitivity(st.moodLog),[st.moodLog]);
  const nSt=getStatus(perf);const lPct=lvPct(st.totalSessions);
  const isActive=ts==="running";
  const rD=useMemo(()=>{const h=st.history||[];if(h.length<2)return{c:0,r:0};return{c:h.slice(-1)[0].c-(h.length>=5?h[h.length-5]:h[0]).c,r:h.slice(-1)[0].r-(h.length>=5?h[h.length-5]:h[0]).r};},[st.history]);
  const moodDiff=preMood>0&&checkMood>0?checkMood-preMood:null;
  const nextPh=pi<pr.ph.length-1?pr.ph[pi+1]:null;
  const sessPct=Math.round(pct*100);
  const lastProto=useMemo(()=>{const h=st.history||[];if(!h.length)return null;return h[h.length-1].p;},[st.history]);
  const favs=st.favs||[];
  const toggleFav=useCallback((name)=>{setSt(s=>{const nf=(s.favs||[]).includes(name)?(s.favs||[]).filter(f=>f!==name):[...(s.favs||[]),name];return{...s,favs:nf};});},[setSt]);
  // Adaptive AI recommendation (replaces old smartPick)
  const readiness=useReadiness(st);
  const aiRec=useAdaptiveRecommendation(st,{nom35Dominios,readiness,currentMood:preMood>0?preMood:null});
  const smartPick=aiRec?.primary?.protocol||null;
  const daily=useMemo(()=>getDailyIgn(st),[st.moodLog]);
  const progStep=PROG_7[(st.progDay||0)%7];
  const prediction=useMemo(()=>predictSessionImpact(st,pr),[st.moodLog,pr.id]);
  const cogLoad=useMemo(()=>estimateCognitiveLoad(st),[st.todaySessions,st.moodLog]);
  const optimalTime=useMemo(()=>{try{return suggestOptimalTime(st);}catch(e){return null;}},[st.history,st.moodLog]);

  const{bg,card:cd,surface,border:bd,t1,t2,t3,scrim}=resolveTheme(isDark);
  const ac=pr.cl;

  // ─── Loading screen — identidad BIO-IGNICIÓN ─────────────
  // Siempre en paleta oscura (deepField), sin importar el modo del sistema.
  if(!mt)return(<div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:bioSignal.deepField,gap:space[5],paddingInline:space[5]}}>
    <BioIgnicionMark layout="stack" glyphSize={76} textColor={darkPalette.text.primary} signalColor={bioSignal.phosphorCyan} animated letterSpacing={6}/>
    <div style={{fontSize:font.size.sm,color:darkPalette.text.muted,letterSpacing:2,textTransform:"uppercase",fontWeight:font.weight.semibold}}>Neural Performance System</div>
  </div>);

  return(
  <div data-bp={bp} style={{maxWidth:rootMaxWidth,margin:"0 auto",minHeight:"100dvh",background:bg,position:"relative",overflowX:"hidden",fontFamily:font.family,transition:"background .8s, max-width .25s",paddingBlockEnd:"env(safe-area-inset-bottom)",paddingInlineStart:`max(${rootPadInline}px, env(safe-area-inset-left))`,paddingInlineEnd:`max(${rootPadInline}px, env(safe-area-inset-right))`}}>

  {/* Background aura — dims during running session (cinematic focus) */}
  <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",opacity:ts==="running"?0.35:1,transition:"opacity .8s ease"}}><div style={{position:"absolute",top:"-15%",right:"-15%",width:"50%",height:"50%",borderRadius:"50%",background:`radial-gradient(circle,${ac}${isDark?"12":"08"},transparent)`,animation:"am 25s ease-in-out infinite",filter:"blur(50px)"}}/><div style={{position:"absolute",bottom:"-10%",left:"-10%",width:"40%",height:"40%",borderRadius:"50%",background:`radial-gradient(circle,#818CF8${isDark?"10":"08"},transparent)`,animation:"am 30s ease-in-out infinite reverse",filter:"blur(45px)"}}/></div>

  {/* Session Runner — fullscreen cinematic overlay (countdown + running + paused) */}
  <SessionRunner
    show={countdown>0||ts==="running"||ts==="paused"||orbDoneFlash}
    countdown={countdown}
    ts={ts}
    sec={sec}
    totalDur={totalDur}
    pr={pr}
    ph={ph}
    pi={pi}
    bL={bL}
    bS={bS}
    bCnt={bCnt}
    isBr={isBr}
    ac={ac}
    sealing={orbDoneFlash}
    scienceDeep={pr&&SCIENCE_DEEP?SCIENCE_DEEP[pr.id]||"":""}
    onPause={pa}
    onResume={resume}
    onReset={rs}
    onCheckpointOpen={(idx)=>{
      const cue=idx===0?"Mantén presionado":idx===1?"Toca al exhalar":"Confirma tu presencia";
      speak(cue,circadian,voiceOn);
    }}
    onCheckpointResolve={(idx,payload)=>{
      if(payload?.type==="hold"){
        if(payload.success){
          setSessionData(d=>({...d,touchHolds:(d.touchHolds||0)+1,interactions:(d.interactions||0)+1,reactionTimes:[...(d.reactionTimes||[]),payload.dur]}));
          H("ok");speak("verificado",circadian,voiceOn);
        } else {
          setSessionData(d=>({...d,interactions:(d.interactions||0)+0.25}));H("tap");
        }
      } else if(payload?.type==="tapExhale"){
        const weight=payload.success?1:0.25;
        setSessionData(d=>({...d,interactions:(d.interactions||0)+weight,reactionTimes:[...(d.reactionTimes||[]),Date.now()%1000]}));
        H(payload.success?"ok":"tap");
        if(payload.success)speak("sincronizado",circadian,voiceOn);
      } else if(payload?.type==="presence"){
        setSessionData(d=>({...d,interactions:(d.interactions||0)+1,reactionTimes:[...(d.reactionTimes||[]),Date.now()%1000]}));
        H("ok");speak("confirmado",circadian,voiceOn);
      }
    }}
    onCheckpointTimeout={(idx)=>{
      setSessionData(d=>({...d,missedCheckpoints:(d.missedCheckpoints||0)+1,interactions:Math.max(0,(d.interactions||0)-0.1)}));
    }}
    onVisibilityLoss={()=>{
      setSessionData(d=>({...d,tabAways:(d.tabAways||0)+1,interactions:Math.max(0,(d.interactions||0)-0.5)}));
    }}
    reducedMotion={reducedMotion}
  />


  <IgnitionBurst show={compFlash} accent={ac} onDone={()=>{}}/>

  {/* ═══ WELCOME — Cinematic manifesto (3 screens) before calibration ═══ */}
  <AnimatePresence>
  {onboard&&!welcomeDone&&!showCalibration&&<BioIgnitionWelcome
    onComplete={(intent)=>{setFirstIntent(intent||null);setWelcomeDone(true);}}
    onSkip={()=>setWelcomeDone(true)}
  />}
  </AnimatePresence>

  {/* ═══ ONBOARDING — Neural Calibration Flow ═══ */}
  <AnimatePresence>
  {((onboard&&welcomeDone)||showCalibration)&&<NeuralCalibration isDark={isDark} onComplete={(baseline)=>{
    setOnboard(false);setShowCalibration(false);unlockVoice();
    const nst={...st,neuralBaseline:baseline,onboardingComplete:true,calibrationHistory:[...(st.calibrationHistory||[]),{...baseline,ts:Date.now()}].slice(-10),sessionGoal:baseline.recommendations?.sessionGoal||2};
    setSt(nst);
    const intentMap={enfoque:"enfoque",calma:"calma",energia:"energia",recuperacion:"reset"};
    const wantedInt=firstIntent?intentMap[firstIntent]:null;
    const intentProto=wantedInt?P.find(p=>p.int===wantedInt):null;
    if(intentProto){setPr(intentProto);setSec(Math.round(intentProto.d*durMult));}
    else{const d=getDailyIgn(nst);if(d&&d.proto){setPr(d.proto);setSec(Math.round(d.proto.d*durMult));}}
    const ach=[...nst.achievements];if(!ach.includes("calibrated")){ach.push("calibrated");setSt({...nst,achievements:ach});}
  }}/>}
  </AnimatePresence>

  {/* ═══ RETURN CARD — frosted welcome-back overlay (Ignición tab, idle, hasSessions) ═══ */}
  <AnimatePresence>
  {tab==="ignicion"&&!entryDone&&ts==="idle"&&st.totalSessions>0&&!onboard&&!showCalibration&&(()=>{
    const now=new Date();
    const today=now.toISOString().slice(0,10);
    const y=new Date(now);y.setDate(y.getDate()-1);
    const yest=y.toISOString().slice(0,10);
    const hoursLeft=Math.max(1,24-now.getHours());
    let fomo;
    if(st.streak>=2&&st.lastDate===yest){
      fomo={text:`Día ${st.streak} · se enfría en ${hoursLeft}h`,color:semantic.warning,icon:"fire",urgent:true};
    }else if(st.lastDate===today&&st.streak>=1){
      fomo={text:`Día ${st.streak} · racha activa`,color:semantic.success,icon:"fire"};
    }else if(st.streak>=1){
      fomo={text:`Racha de ${st.streak} días`,color:ac,icon:"fire"};
    }else{
      fomo={text:`${st.totalSessions} sesiones · empieza racha nueva`,color:t2,icon:"bolt"};
    }
    const adaptiveProto=aiRec?.primary?.protocol||null;
    const adaptiveIntent=aiRec?.need||"calma";
    const adaptiveReason=aiRec?.primary?.reason||null;
    const circadianPeriod=aiRec?.context?.circadian||null;
    const intentMeta=({
      calma:{label:"Calma",icon:"calm"},
      enfoque:{label:"Enfoque",icon:"focus"},
      energia:{label:"Energía",icon:"energy"},
      reset:{label:"Reset",icon:"reset"},
    }[adaptiveIntent])||{label:"Sesión",icon:"bolt"};
    const cardProto=adaptiveProto||P.find(p=>p.int===adaptiveIntent&&p.dif===1)||P.find(p=>p.int==="calma"&&p.dif===1)||P[0];
    const cardPred=(()=>{try{return predictSessionImpact(st,cardProto);}catch(e){return null;}})();
    const showDelta=cardPred&&cardPred.confidence>=50&&cardPred.predictedDelta>0;
    const startQuick=()=>{
      setEntryDone(true);
      setDurMult(0.5);
      setPr(cardProto);
      setSec(Math.round(cardProto.d*0.5));
      go();
    };
    const isUrgent=!!fomo.urgent;
    const secondaryLabel=isUrgent?`Pierdes la racha en ${hoursLeft}h`:"Abrir la app";
    const secondaryColor=isUrgent?semantic.warning:t3;
    const cardBg=isDark?"rgba(20, 24, 32, 0.72)":"rgba(255, 255, 255, 0.82)";
    const cardBorder=isDark?"rgba(255,255,255,0.08)":"rgba(15,23,42,0.06)";
    const innerBevel=isDark?"0 0 0 1px rgba(255,255,255,0.04) inset":"0 0 0 1px rgba(255,255,255,0.6) inset";
    const cardShadow=isDark?`0 24px 70px rgba(0,0,0,0.45), ${innerBevel}`:`0 24px 70px rgba(15,23,42,0.18), ${innerBevel}`;
    return(
      <motion.div
        key="return-card-overlay"
        role="dialog"
        aria-modal="false"
        aria-label="Bienvenida de vuelta"
        initial={reducedMotion?{opacity:1}:{opacity:0}}
        animate={{opacity:1}}
        exit={{opacity:0}}
        transition={{duration:reducedMotion?0:.28,ease:[.16,1,.3,1]}}
        onClick={(e)=>{if(e.target.closest("[data-return-card-body]"))return;setEntryDone(true);}}
        style={{
          position:"fixed",
          insetBlockStart:0,
          insetInlineStart:0,
          inlineSize:"100%",
          blockSize:"100%",
          zIndex:80,
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          paddingBlock:"20px 96px",
          paddingInline:20,
          background:isDark?"rgba(8, 12, 20, 0.32)":"rgba(15, 23, 42, 0.22)",
          backdropFilter:"blur(4px) saturate(1.05)",
          WebkitBackdropFilter:"blur(4px) saturate(1.05)",
          cursor:"pointer",
        }}
      >
        <motion.article
          data-return-card-body=""
          initial={reducedMotion?{opacity:1,scale:1,y:0}:{opacity:0,scale:.96,y:12}}
          animate={{opacity:1,scale:1,y:0}}
          exit={reducedMotion?{opacity:0}:{opacity:0,scale:.97,y:6}}
          transition={{duration:reducedMotion?0:.34,ease:[.16,1,.3,1]}}
          style={{
            inlineSize:"100%",
            maxInlineSize:380,
            padding:22,
            borderRadius:22,
            background:cardBg,
            backdropFilter:"blur(22px) saturate(1.1)",
            WebkitBackdropFilter:"blur(22px) saturate(1.1)",
            border:`1px solid ${fomo.urgent?withAlpha(semantic.warning,30):cardBorder}`,
            boxShadow:cardShadow,
            cursor:"default",
            position:"relative",
            overflow:"hidden",
          }}
        >
          <div aria-hidden="true" style={{position:"absolute",insetBlockStart:-40,insetInlineEnd:-40,inlineSize:140,blockSize:140,borderRadius:"50%",background:withAlpha(ac,8),pointerEvents:"none",filter:"blur(20px)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBlockEnd:14,position:"relative"}}>
            <div
              aria-hidden="true"
              style={{
                inlineSize:48,blockSize:48,borderRadius:"50%",
                background:`linear-gradient(135deg, ${lv.c}, ${lv.c}CC)`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:22,fontWeight:900,color:"#fff",lineHeight:1,
                boxShadow:`0 6px 18px ${withAlpha(lv.c,35)}`,flexShrink:0,
              }}
            >
              {lv.g}
            </div>
            <div style={{flex:1,minInlineSize:0}}>
              <div style={{fontSize:12,fontWeight:600,color:t3,letterSpacing:-0.05}}>Bienvenido de vuelta</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBlockStart:3}}>
                <Icon name={fomo.icon} size={13} color={fomo.color} aria-hidden="true"/>
                <span style={{fontSize:14,fontWeight:700,color:fomo.color,letterSpacing:-0.05}}>{fomo.text}</span>
              </div>
            </div>
          </div>
          {circadianPeriod&&(
            <div style={{display:"flex",alignItems:"center",gap:6,marginBlockEnd:12,position:"relative"}}>
              <span aria-hidden="true" style={{inlineSize:6,blockSize:6,borderRadius:"50%",background:ac,boxShadow:`0 0 8px ${withAlpha(ac,60)}`,flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:600,color:t3,letterSpacing:0.3,textTransform:"uppercase"}}>
                Ventana de {circadianPeriod}
              </span>
            </div>
          )}
          <p style={{fontSize:13,fontWeight:400,color:t2,lineHeight:1.55,margin:"0 0 18px",fontStyle:"italic",position:"relative"}}>
            {daily.phrase}
          </p>
          <button
            onClick={startQuick}
            aria-label={`Empezar sesión de ${intentMeta.label.toLowerCase()} de 60 segundos`}
            style={{
              inlineSize:"100%",
              minBlockSize:48,
              paddingBlock:14,
              paddingInline:22,
              borderRadius:radius.full,
              border:"none",
              background:`linear-gradient(135deg, ${ac}, ${ac}DD)`,
              color:"#fff",
              fontSize:15,
              fontWeight:700,
              letterSpacing:-0.1,
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              gap:8,
              boxShadow:`0 6px 18px ${withAlpha(ac,30)}`,
              position:"relative",
            }}
          >
            <Icon name={intentMeta.icon} size={14} color="#fff" aria-hidden="true"/>
            <span>{intentMeta.label} <span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontWeight:700,fontVariantNumeric:"tabular-nums",letterSpacing:-0.1}}>60s</span> · empezar ahora</span>
          </button>
          {adaptiveReason&&(
            <div style={{fontSize:11,fontWeight:500,color:t3,lineHeight:1.45,marginBlockStart:10,textAlign:"center",fontStyle:"italic",letterSpacing:-0.02,paddingInline:4}}>
              {adaptiveReason}
            </div>
          )}
          {showDelta&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBlockStart:8}}>
              <span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:11,fontWeight:700,color:semantic.success,fontVariantNumeric:"tabular-nums",letterSpacing:-0.05}}>
                +{cardPred.predictedDelta.toFixed(1)}
              </span>
              <span style={{fontSize:10,fontWeight:500,color:t3,letterSpacing:0.2}}>
                mood esperado · confianza {cardPred.confidence}%
              </span>
            </div>
          )}
          <button
            onClick={()=>setEntryDone(true)}
            aria-label={isUrgent?`Abrir la app sin iniciar sesión — ${secondaryLabel}`:"Abrir la app sin iniciar sesión"}
            style={{
              inlineSize:"100%",
              marginBlockStart:6,
              paddingBlock:10,
              background:"transparent",
              border:"none",
              color:secondaryColor,
              fontSize:13,
              fontWeight:isUrgent?700:600,
              letterSpacing:-0.05,
              cursor:"pointer",
              position:"relative",
            }}
          >
            {secondaryLabel}
          </button>
        </motion.article>
      </motion.div>
    );
  })()}
  </AnimatePresence>

  {/* ═══ COMMAND PALETTE — ⌘K/Ctrl+K ═══ */}
  <CommandPalette open={showCmd} onClose={()=>{uiSound.close(st.soundOn);setShowCmd(false);}} commands={cmdCommands} onSelect={()=>uiSound.select(st.soundOn)}/>

  {/* ═══ PROTOCOL DETAIL VIEW ═══ */}
  <AnimatePresence>
  {showProtoDetail&&<ProtocolDetail protocol={pr} st={st} isDark={isDark} durMult={durMult} onClose={()=>setShowProtoDetail(false)} onStart={(p)=>{setShowProtoDetail(false);sp(p);go();}}/>}
  </AnimatePresence>

  {/* ═══ POST-SESSION FLOW ═══ */}
  <PostSessionFlow postStep={postStep} ts={ts} ac={ac} isDark={isDark} pr={pr} durMult={durMult} st={st} checkMood={checkMood} setCheckMood={setCheckMood} checkEnergy={checkEnergy} setCheckEnergy={setCheckEnergy} checkTag={checkTag} setCheckTag={setCheckTag} preMood={preMood} postVC={postVC} postMsg={postMsg} moodDiff={moodDiff} H={H} submitCheckin={submitCheckin} onSetPostStep={setPostStep} onReset={rs}/>

  {/* ═══ INTENT PICKER ═══ */}
  <AnimatePresence>
  {showIntent&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:z.modal,background:scrim,backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",padding:space[6]}} onClick={()=>setShowIntent(false)}>
    <motion.div initial={{scale:.9}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:20}} style={{background:cd,borderRadius:28,padding:"26px 20px",maxWidth:380,width:"100%"}} onClick={e=>e.stopPropagation()}>
    <div style={{textAlign:"center",marginBottom:space[5]}}><div style={{fontSize:font.size.xl,fontWeight:font.weight.black,color:t1}}>¿Qué necesitas?</div>
    {aiRec&&<div style={{...ty.caption(t3),marginTop:space[1]}}>IA sugiere: <span style={{color:ac,fontWeight:font.weight.bold}}>{aiRec.need}</span> · {aiRec.context.circadian}</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:space[2]}}>{INTENTS.map(i=>{const b=P.filter(p=>p.int===i.id);const pk=b[Math.floor(b.length/2)]||P[0];return(<motion.button key={i.id} whileTap={{scale:.95}} onClick={()=>sp(pk)} style={{padding:`${space[4]}px ${space[2.5]}px`,borderRadius:radius.lg,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",textAlign:"center"}}><Icon name={i.icon} size={26} color={i.color}/><div style={{...ty.title(t1),marginTop:space[1.5]}}>{i.label}</div><div style={{...ty.caption(i.color),fontWeight:font.weight.bold,marginTop:space[1]}}>{pk.n}</div></motion.button>);})}</div>
  </motion.div></motion.div>}
  </AnimatePresence>

  {/* ═══ PROTOCOL SELECTOR ═══ */}
  <ProtocolSelector show={sl} onClose={()=>setSl(false)} st={st} isDark={isDark} ac={ac} pr={pr} sc={sc} setSc={setSc} fl={fl} favs={favs} toggleFav={toggleFav} lastProto={lastProto} smartPick={smartPick} protoSens={protoSens} sp={sp} H={H}/>

  {/* ═══ SETTINGS ═══ */}
  <SettingsSheet show={showSettings} onClose={()=>setShowSettings(false)} st={st} setSt={setSt} isDark={isDark} ac={ac} voiceOn={voiceOn} setVoiceOn={setVoiceOn} H={H}/>

  {/* ═══ HISTORY ═══ */}
  <HistorySheet show={showHist} onClose={()=>setShowHist(false)} st={st} isDark={isDark} ac={ac}/>

  {/* ═══ BIONEURAL MODALS ═══ */}
  <HRVMonitor show={showHRV} isDark={isDark} onClose={()=>setShowHRV(false)} onComplete={(entry)=>{store.logHRV(entry);setSt_(useStore.getState());}}/>
  <PhysiologicalSigh show={showSigh} isDark={isDark} onClose={()=>setShowSigh(false)} onComplete={(entry)=>{store.logBreathTechnique(entry);setSt_(useStore.getState());}}/>
  <NSDR show={showNSDR} isDark={isDark} onClose={()=>setShowNSDR(false)} onComplete={(entry)=>{store.logBreathTechnique(entry);setSt_(useStore.getState());}}/>
  <ChronotypeTest show={showChronoTest} isDark={isDark} onClose={()=>setShowChronoTest(false)} onComplete={(ct)=>{store.setChronotype(ct);setSt_(useStore.getState());}}/>
  <ResonanceCalibration show={showResonanceCal} isDark={isDark} onClose={()=>setShowResonanceCal(false)} onComplete={(res)=>{store.setResonanceFreq(res.bpm);setSt_(useStore.getState());}}/>
  <NOM035Questionnaire show={showNOM035} isDark={isDark} onClose={()=>setShowNOM035(false)} onComplete={(r)=>{store.logNOM035(r);setSt_(useStore.getState());}}/>

  {/* ═══ AMBIENT LATTICE — brand continuity whisper behind idle ═══ */}
  {tab==="ignicion"&&ts==="idle"&&!compFlash&&(
    <div aria-hidden="true" style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}>
      <AmbientLattice accent={ac} reducedMotion={reducedMotion} opacity={0.12} edgeOnly vignette={false}/>
    </div>
  )}

  {/* ═══ MAIN CONTENT ═══ */}
  <div style={{position:"relative",zIndex:1}}>
  <AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={tab}
    initial={reducedMotion?{opacity:0}:{opacity:0,y:14,scale:.985}}
    animate={reducedMotion?{opacity:1}:{opacity:1,y:0,scale:1}}
    exit={reducedMotion?{opacity:0}:{opacity:0,y:-8,scale:.99}}
    transition={{duration:reducedMotion?0:.32,ease:[.16,1,.3,1]}}
    onPointerDown={onSwipeStart}
    onPointerUp={onSwipeEnd}
    onPointerCancel={()=>{swipeRef.current=null;}}
    style={{touchAction:"pan-y"}}
  >

  {/* ═══ TAB: IGNICIÓN ═══ */}
  {tab==="ignicion"&&postStep==="none"&&!compFlash&&(<div style={{padding:"14px 20px 180px"}}>
    {/* Brand kicker — wordmark micro-strip en momento-cero (solo idle) */}
    {ts==="idle"&&(
      <div aria-hidden="true" style={{display:"flex",justifyContent:"center",marginBlockEnd:space[3]}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:6,paddingBlock:4,paddingInline:10,borderRadius:999,background:withAlpha(ac,6),border:`1px solid ${withAlpha(ac,14)}`}}>
          <span style={{inlineSize:4,blockSize:4,borderRadius:"50%",background:ac,boxShadow:`0 0 6px ${withAlpha(ac,70)}`}}/>
          <span style={{display:"inline-flex",alignItems:"baseline",gap:3,fontFamily:font.family,fontSize:10,letterSpacing:3,textTransform:"uppercase",lineHeight:1}}>
            <span style={{fontWeight:font.weight.normal,color:t3}}>BIO</span>
            <span style={{color:ac,fontWeight:font.weight.bold,transform:"translateY(-0.08em)"}}>—</span>
            <span style={{fontWeight:font.weight.black,color:t1}}>IGNICIÓN</span>
          </span>
        </span>
      </div>
    )}
    {/* Adaptive hint — "tu sistema se afina tras 3 sesiones". Único valor rescatado del tour.
        Auto-hide al llegar a 3. Dismissible con flag local (adaptiveHintDismissed). */}
    {ts==="idle"&&(st.totalSessions||0)<3&&!st.adaptiveHintDismissed&&(
      <div role="status" aria-live="polite" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",marginBlockEnd:space[3],borderRadius:12,background:withAlpha(ac,6),border:`1px solid ${withAlpha(ac,16)}`}}>
        <div aria-hidden="true" style={{display:"flex",gap:3,alignItems:"center"}}>
          {[0,1,2].map(i=>(
            <span key={i} style={{inlineSize:6,blockSize:6,borderRadius:"50%",background:i<(st.totalSessions||0)?ac:withAlpha(ac,22),boxShadow:i<(st.totalSessions||0)?`0 0 4px ${withAlpha(ac,60)}`:"none",transition:"background .3s"}}/>
          ))}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:700,color:t1,letterSpacing:-0.1,lineHeight:1.25}}>
            Día {(st.totalSessions||0)+1}/3 · tu sistema se afina
          </div>
          <div style={{fontSize:10,color:t3,lineHeight:1.3,marginBlockStart:1}}>
            Tras 3 sesiones detectamos tu hora pico y protocolos sensibles.
          </div>
        </div>
        <button
          type="button"
          aria-label="Descartar este mensaje"
          onClick={()=>setSt(s=>({...s,adaptiveHintDismissed:true}))}
          style={{flexShrink:0,inlineSize:22,blockSize:22,borderRadius:"50%",border:"none",background:"transparent",color:t3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,lineHeight:1}}
        >×</button>
      </div>
    )}
    {/* NFC Context */}
    {nfcCtx&&ts==="idle"&&(()=>{const nfcAc=nfcCtx.type==="salida"?brand.secondary:ac;return(
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",marginBottom:12,background:nfcAc+"08",borderRadius:14,border:`1.5px solid ${nfcAc+"20"}`,animation:"fi .4s"}}>
      <div style={{width:28,height:28,borderRadius:8,background:nfcAc+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={nfcCtx.type==="salida"?"calm":"energy"} size={14} color={nfcAc}/></div>
      <div><div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:nfcAc,textTransform:"uppercase"}}>{nfcCtx.type==="salida"?"SESIÓN DE SALIDA":"SESIÓN DE ENTRADA"}</div>
      <div style={{fontSize:10,fontWeight:600,color:t1}}>{nfcCtx.type==="salida"?"Descomprime tu día.":"Activa tu enfoque."}</div></div>
    </div>);})()}

    {/* Ignición content — always renders (Return Card floats over it) */}
    {/* Streak Shield (replaces simple streak warning) */}
    {ts==="idle"&&<StreakShield st={st} isDark={isDark} onQuickSession={()=>{setDurMult(0.5);const calmP=P.find(p=>p.int==="calma"&&p.dif===1)||P[0];setPr(calmP);setSec(Math.round(calmP.d*0.5));go();}} onFreezeStreak={()=>{const r=store.freezeStreak();if(r.ok){setSt_(useStore.getState());announce(`Racha congelada honestamente. Te quedan ${r.remaining} pausas este mes.`,"polite");}else{announce(r.reason==="already_today"?"Ya usaste tu pausa hoy.":"Agotaste tus pausas del mes.","polite");}}}/>}

    {/* NOM-035 hint — solo si hay un nivel medio/alto guardado y no fue descartado */}
    {ts==="idle"&&nom35Hint&&(()=>{const nomTone=nom35Hint.intent==="calma"?semantic.danger:semantic.warning;return(
      <div role="status" aria-live="polite" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:space[3],padding:`${space[3]}px ${space[4]}px`,marginBottom:space[3],background:withAlpha(nomTone,12),border:`1px solid ${withAlpha(nomTone,30)}`,borderRadius:radius.md}}>
        <div style={{display:"flex",alignItems:"center",gap:space[2],minWidth:0}}>
          <Icon name="shield" size={14} color={nomTone}/>
          <div style={{minWidth:0}}>
            <div style={{...ty.body(t1),fontWeight:font.weight.semibold}}>{nom35Hint.text}</div>
            {nom35Hint.protocol&&<div style={{...ty.caption(t3),marginTop:2}}>Sugerido: {nom35Hint.protocol.n} · {Math.round((nom35Hint.protocol.d||0)/60)} min</div>}
          </div>
        </div>
        <button type="button" aria-label="Descartar sugerencia" onClick={()=>{try{window.localStorage.setItem("bio-nom35-hint-dismissed",nom35Hint.nivel);}catch{}setNom35Hint(null);}} style={{background:"transparent",border:"none",color:t2,cursor:"pointer",padding:space[1],borderRadius:radius.sm}}>
          <Icon name="close" size={14} color={t2}/>
        </button>
      </div>
      );})()}

    {/* Cognitive Load indicator — carga del día con label + MONO tabular */}
    {ts==="idle"&&(()=>{
      const done=st.todaySessions||0;
      const goal=st.sessionGoal||2;
      const pct=Math.min(100,(done/goal)*100);
      return(
        <div aria-label={`Carga hoy: ${done} de ${goal} sesiones. Nivel ${cogLoad.level}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:space[3],padding:`${space[3]}px ${space[4]}px`,marginBottom:space[3],background:surface,border:`1px solid ${bd}`,borderRadius:radius.md}}>
          <div style={{display:"flex",alignItems:"center",gap:space[2],minInlineSize:0}}>
            <div aria-hidden="true" style={{width:28,height:28,borderRadius:8,background:withAlpha(ac,10),border:`1px solid ${withAlpha(ac,18)}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon name="cpu" size={13} color={ac}/>
            </div>
            <div style={{minInlineSize:0}}>
              <div style={{fontSize:10,fontWeight:700,color:t3,letterSpacing:2,textTransform:"uppercase",lineHeight:1}}>Carga hoy</div>
              <div style={{display:"inline-flex",alignItems:"baseline",gap:4,marginBlockStart:3,lineHeight:1}}>
                <span style={{fontFamily:font.mono,fontSize:15,fontWeight:800,color:t1,letterSpacing:-0.3,fontVariantNumeric:"tabular-nums"}}>{done}</span>
                <span style={{fontSize:11,fontWeight:500,color:t3}}>/</span>
                <span style={{fontFamily:font.mono,fontSize:12,fontWeight:600,color:t3,fontVariantNumeric:"tabular-nums"}}>{goal}</span>
                <span style={{fontSize:11,fontWeight:500,color:t3,marginInlineStart:2}}>sesiones</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:space[2],flexShrink:0}}>
            <span style={{fontSize:10,fontWeight:700,color:cogLoad.color,letterSpacing:0.3,textTransform:"uppercase"}}>{cogLoad.level}</span>
            <div aria-hidden="true" style={{inlineSize:44,blockSize:5,borderRadius:999,background:bd,overflow:"hidden"}}>
              <div style={{inlineSize:pct+"%",blockSize:"100%",background:`linear-gradient(90deg, ${withAlpha(cogLoad.color,60)}, ${cogLoad.color})`,borderRadius:999,transition:"width .4s ease"}}/>
            </div>
          </div>
        </div>
      );
    })()}

    {/* Readiness Score — bioneural composite */}
    {ts==="idle"&&<ReadinessScore st={st} isDark={isDark} onOpenHRV={()=>setShowHRV(true)}/>}

    {/* Bioneural quick actions — evidence-based rescue protocols */}
    {ts==="idle"&&<div style={{display:"flex",gap:6,marginBottom:14}}>
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowSigh(true);H("tap");}} aria-label="Suspiro fisiológico, 60 segundos" style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <Icon name="calm" size={14} color={protoColor.calma}/>
        <span style={{fontSize:9,fontWeight:700,color:t1,letterSpacing:1,textTransform:"uppercase"}}>Suspiro</span>
        <span style={{fontSize:8,color:t3}}>60s · calma</span>
      </motion.button>
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowHRV(true);H("tap");}} aria-label="Medir HRV con sensor Bluetooth" style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <Icon name="predict" size={14} color={protoColor.enfoque}/>
        <span style={{fontSize:9,fontWeight:700,color:t1,letterSpacing:1,textTransform:"uppercase"}}>HRV</span>
        <span style={{fontSize:8,color:t3}}>5 min · BLE</span>
      </motion.button>
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowNSDR(true);H("tap");}} aria-label="NSDR Yoga Nidra, 10 minutos" style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <Icon name="mind" size={14} color={protoColor.reset}/>
        <span style={{fontSize:9,fontWeight:700,color:t1,letterSpacing:1,textTransform:"uppercase"}}>NSDR</span>
        <span style={{fontSize:8,color:t3}}>10 min · reset</span>
      </motion.button>
    </div>}

    {/* Daily Ignición with AI reasoning */}
    {ts==="idle"&&<motion.button whileTap={{scale:.97}} onClick={()=>sp(daily.proto)} style={{width:"100%",padding:"16px 14px",marginBottom:14,borderRadius:18,border:`1.5px solid ${daily.proto.cl}20`,background:`linear-gradient(135deg,${daily.proto.cl}06,${daily.proto.cl}02)`,cursor:"pointer",textAlign:"left",display:"flex",gap:12,alignItems:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:daily.proto.cl+"08"}}/>
      <div style={{width:44,height:44,borderRadius:13,background:daily.proto.cl+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:daily.proto.cl,flexShrink:0,border:`1px solid ${daily.proto.cl}15`}}>{daily.proto.tg}</div>
      <div style={{flex:1,position:"relative",zIndex:1}}>
        <div style={{fontSize:12,fontWeight:600,letterSpacing:-0.05,color:daily.proto.cl,marginBottom:2}}>Ignición del día</div>
        <div style={{...ty.title(t1),fontWeight:font.weight.black}}>{daily.proto.n}</div>
        <div style={{...ty.caption(t3),marginTop:2,fontStyle:"italic",lineHeight:font.leading.snug}}>{daily.phrase}</div>
      </div>
      <Icon name="bolt" size={16} color={daily.proto.cl}/>
    </motion.button>}


    {/* Expandable secondary section */}
    {ts==="idle"&&(prediction||(st.progDay||0)<7)&&<>
    <button onClick={()=>{setShowMore(!showMore);H("tap");}} aria-expanded={showMore} aria-label={showMore?"Menos opciones":"Más opciones"} style={{width:"100%",minBlockSize:44,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"12px 0",marginBottom:showMore?10:14,background:"none",border:"none",cursor:"pointer"}}>
      <div style={{flex:1,height:1,background:bd}}/>
      <span style={{fontSize:10,fontWeight:700,color:t3,display:"flex",alignItems:"center",gap:4,flexShrink:0}}>{showMore?"Menos":"Más"} <span style={{transform:showMore?"rotate(180deg)":"rotate(0)",display:"inline-block",transition:"transform .2s"}}>▾</span></span>
      <div style={{flex:1,height:1,background:bd}}/>
    </button>
    <AnimatePresence>
    {showMore&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
      {/* Prediction */}
      {prediction&&(()=>{const pos=prediction.predictedDelta>0;const tone=pos?brand.primary:brand.secondary;const hasCI=typeof prediction.lower==="number"&&typeof prediction.upper==="number";const fmt=(v)=>(v>=0?"+":"")+v.toFixed(1);const drift=!!prediction.drift;return(
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",marginBottom:10,background:pos?withAlpha(brand.primary,isDark?8:4):surface,borderRadius:14,border:`1px solid ${drift?withAlpha(brand.secondary,30):pos?withAlpha(brand.primary,20):bd}`}}>
          <Icon name="predict" size={14} color={tone}/>
          <div style={{flex:1,minInlineSize:0}}>
            <div style={{fontSize:10,fontWeight:700,color:tone,lineHeight:1.3}}>{prediction.message}</div>
            <div style={{fontSize:10,color:t3,marginTop:2,display:"inline-flex",alignItems:"baseline",gap:5,flexWrap:"wrap"}}>
              <span>Confianza</span>
              <span style={{fontFamily:font.mono,fontWeight:700,color:t2,fontVariantNumeric:"tabular-nums",letterSpacing:-0.05}}>{prediction.confidence}%</span>
              {hasCI&&<>
                <span aria-hidden="true" style={{opacity:0.55}}>·</span>
                <span>rango</span>
                <span style={{fontFamily:font.mono,fontWeight:600,color:t2,fontVariantNumeric:"tabular-nums",letterSpacing:-0.05}}>{fmt(prediction.lower)}</span>
                <span aria-hidden="true" style={{opacity:0.55}}>a</span>
                <span style={{fontFamily:font.mono,fontWeight:600,color:t2,fontVariantNumeric:"tabular-nums",letterSpacing:-0.05}}>{fmt(prediction.upper)}</span>
              </>}
            </div>
            {drift&&<div style={{fontSize:9,color:brand.secondary,marginTop:2,fontWeight:600}}>Tu respuesta está cambiando — estamos recalibrando.</div>}
          </div>
        </div>);})()}
      {/* 7-Day Program */}
      {(st.progDay||0)<7&&<div style={{marginBottom:10,background:cd,borderRadius:16,padding:"12px",border:`1px solid ${bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:ac,textTransform:"uppercase"}}>Programa 7 Días</div>
          <span style={{display:"inline-flex",alignItems:"baseline",gap:3,fontFamily:font.mono,fontSize:11,fontWeight:800,color:t1,fontVariantNumeric:"tabular-nums",letterSpacing:-0.1}}>
            <span style={{fontSize:9,fontWeight:600,color:t3,letterSpacing:1,textTransform:"uppercase",marginInlineEnd:3}}>Día</span>
            <span>{Math.min((st.progDay||0)+1,7)}</span>
            <span style={{color:t3}}>/</span>
            <span style={{color:t3}}>7</span>
          </span>
        </div>
        <div style={{display:"flex",gap:3,marginBottom:10}}>
          {PROG_7.map((p,i)=>{const done=i<(st.progDay||0);const curr=i===(st.progDay||0);return<div key={i} style={{flex:1,height:4,borderRadius:2,background:done?ac:curr?ac+"50":bd,transition:"background .5s"}}/>;})}</div>
        <motion.button whileTap={{scale:.97}} onClick={()=>{const p=P.find(x=>x.id===progStep.pid);if(p)sp(p);}} style={{width:"100%",padding:"10px",borderRadius:12,border:`1px solid ${bd}`,background:surface,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="mind" size={12} color={ac}/></div>
          <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:11,fontWeight:700,color:t1}}>{progStep.t}</div><div style={{fontSize:10,color:t3}}>{progStep.d}</div></div>
          <Icon name="chevron" size={12} color={ac}/>
        </motion.button>
      </div>}
    </motion.div>}
    </AnimatePresence>

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:nSt.color,animation:"shimDot 2s ease infinite"}}/><span style={{fontSize:10,fontWeight:700,color:nSt.color}}>{nSt.label}</span></div>
      <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:10,fontWeight:700,color:lv.c}}>{lv.n}</span><div style={{width:36,height:3,borderRadius:2,background:bd,overflow:"hidden"}}><div style={{width:lPct+"%",height:"100%",borderRadius:2,background:lv.c}}/></div></div>
    </div>
    {(()=>{
      const engineMatch=aiRec?.primary?.protocol?.id===pr.id;
      const engineReason=engineMatch?aiRec?.primary?.reason:null;
      return(
    <div style={{display:"flex",gap:7,marginBottom:16}}>
      <motion.button whileTap={{scale:.96}} onClick={()=>setSl(true)} style={{flex:1,padding:"10px 12px",borderRadius:15,border:`1.5px solid ${engineReason?withAlpha(ac,22):bd}`,background:engineReason?withAlpha(ac,isDark?8:4):cd,cursor:"pointer",display:"flex",alignItems:"center",gap:9}}>
        <motion.div layoutId={sl||reducedMotion?undefined:`proto-glyph-${pr.id}`} transition={{type:"spring",stiffness:360,damping:32}} style={{width:32,height:32,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:ac}}>{pr.tg}</motion.div>
        <div style={{flex:1,textAlign:"left",minInlineSize:0}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5}}>
            <span style={{fontWeight:700,fontSize:11,color:t1,letterSpacing:-0.05}}>{pr.n}</span>
            {engineReason&&<span aria-hidden="true" style={{fontSize:8,fontWeight:800,letterSpacing:1.2,color:ac,textTransform:"uppercase"}}>· pick</span>}
          </div>
          {engineReason?(
            <div style={{fontSize:10,fontWeight:500,color:t3,marginBlockStart:2,fontStyle:"italic",letterSpacing:-0.02,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{engineReason}</div>
          ):(
            <div style={{fontSize:10,color:t3}}>{pr.ph.length} fases</div>
          )}
        </div>
        <Icon name="chevron-down" size={12} color={t3}/>
      </motion.button>
      <motion.button whileTap={{scale:.93}} onClick={()=>setShowProtoDetail(true)} aria-label="Ver detalle del protocolo" title="Ver detalle del protocolo" style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="info" size={16} color={t3} aria-hidden="true"/></motion.button>
      <motion.button whileTap={{scale:.93}} onClick={()=>setShowIntent(true)} aria-label="Definir intención" title="Definir intención" style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="target" size={18} color={t3} aria-hidden="true"/></motion.button>
    </div>
      );
    })()}

    {/* Adaptive context strip — circadian + readiness + optimal time + prediction */}
    {ts==="idle"&&aiRec&&(()=>{
      const cPeriod=aiRec?.context?.circadian;
      const rInt=aiRec?.context?.readiness?.interpretation;
      const readinessMeta=({optimal:"óptimo",primed:"elevado",neutral:"neutral",recover:"bajo"})[rInt];
      const showPred=prediction&&prediction.confidence>=50&&prediction.predictedDelta>0;
      const optHour=optimalTime?.best?.hour;
      return(
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:10,marginBottom:10,padding:"10px 12px",borderRadius:12,background:surface,border:`1px solid ${bd}`}}>
          {cPeriod&&(
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span aria-hidden="true" style={{inlineSize:5,blockSize:5,borderRadius:"50%",background:ac,boxShadow:`0 0 6px ${withAlpha(ac,60)}`,flexShrink:0}}/>
              <span style={{fontSize:10,fontWeight:700,color:t2,letterSpacing:0.3,textTransform:"uppercase"}}>Ventana · {cPeriod}</span>
            </div>
          )}
          {readinessMeta&&(<>
            <span aria-hidden="true" style={{width:1,height:10,background:bd}}/>
            <span style={{fontSize:10,fontWeight:600,color:t2,letterSpacing:0.2,textTransform:"uppercase"}}>Readiness {readinessMeta}</span>
          </>)}
          {typeof optHour==="number"&&(<>
            <span aria-hidden="true" style={{width:1,height:10,background:bd}}/>
            <span style={{fontSize:10,fontWeight:600,color:t2,letterSpacing:0.2,textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:4}}>
              Pico <span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontVariantNumeric:"tabular-nums",letterSpacing:-0.05}}>{String(optHour).padStart(2,"0")}:00</span>
            </span>
          </>)}
          {showPred&&(<>
            <span aria-hidden="true" style={{width:1,height:10,background:bd}}/>
            <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:700,color:semantic.success,fontVariantNumeric:"tabular-nums",letterSpacing:-0.05}}>+{prediction.predictedDelta.toFixed(1)}</span>
              <span style={{fontSize:10,fontWeight:500,color:t3,letterSpacing:0.2}}>· {prediction.confidence}%</span>
            </span>
          </>)}
        </div>
      );
    })()}
    {/* Engine pick swap — only when engine diverges from current selection (match-reason lives in picker button) */}
    {ts==="idle"&&aiRec?.primary?.protocol&&(()=>{
      const enginePick=aiRec.primary.protocol;
      const reason=aiRec.primary.reason;
      const matches=enginePick.id===pr.id;
      if(matches)return null;
      return(
        <motion.button
          initial={{opacity:0,y:4}}
          animate={{opacity:1,y:0}}
          whileTap={{scale:.98}}
          onClick={()=>sp(enginePick)}
          aria-label={`El motor sugiere ${enginePick.n}: ${reason||"tap para cambiar"}`}
          style={{
            inlineSize:"100%",
            padding:"10px 12px",
            marginBlockEnd:14,
            borderRadius:12,
            border:`1px solid ${withAlpha(ac,22)}`,
            background:withAlpha(ac,isDark?10:5),
            cursor:"pointer",
            textAlign:"left",
            display:"flex",
            alignItems:"center",
            gap:10,
          }}
        >
          <div style={{inlineSize:26,blockSize:26,borderRadius:8,background:withAlpha(ac,14),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name="cpu" size={12} color={ac} aria-hidden="true"/>
          </div>
          <div style={{flex:1,minInlineSize:0}}>
            <div style={{fontSize:11,fontWeight:700,color:ac,letterSpacing:-0.05,lineHeight:1.3}}>
              Motor sugiere <span style={{fontWeight:800}}>{enginePick.n}</span>
            </div>
            {reason&&(
              <div style={{fontSize:10,fontWeight:500,color:t3,lineHeight:1.4,marginBlockStart:2,fontStyle:"italic",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {reason}
              </div>
            )}
          </div>
          <span style={{fontSize:10,fontWeight:700,color:ac,letterSpacing:0.3,textTransform:"uppercase",flexShrink:0}}>Cambiar</span>
        </motion.button>
      );
    })()}

    {/* Pre-session mood — color spectrum, pre-fill transparency, affirmative heading */}
    {ts==="idle"&&(
      <div style={{marginBlockEnd:14}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8,marginBlockEnd:8,paddingInline:2}}>
          <span style={{fontSize:11,fontWeight:700,color:t2,letterSpacing:0.3,textTransform:"uppercase"}}>Tu estado ahora</span>
          {preMood>0&&preMoodFromPrefill&&(
            <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:500,color:t3,letterSpacing:-0.02,fontStyle:"italic"}}>
              <span aria-hidden="true" style={{inlineSize:4,blockSize:4,borderRadius:"50%",background:withAlpha(ac,60),flexShrink:0}}/>
              desde tu última sesión
            </span>
          )}
        </div>
        <div role="radiogroup" aria-label="Tu estado ahora" style={{display:"flex",gap:4}}>
          {MOODS.map(m=>{
            const selected=preMood===m.value;
            return(
              <motion.button
                key={m.id}
                role="radio"
                aria-checked={selected}
                whileTap={{scale:.92}}
                onClick={()=>{setPreMood(m.value);setPreMoodFromPrefill(false);H("tap");}}
                style={{
                  flex:1,
                  display:"flex",
                  flexDirection:"column",
                  alignItems:"center",
                  gap:4,
                  paddingBlock:9,
                  paddingInline:2,
                  borderRadius:12,
                  border:selected?`2px solid ${m.color}`:`1.5px solid ${bd}`,
                  background:selected?withAlpha(m.color,10):cd,
                  cursor:"pointer",
                  transition:"all .2s",
                  position:"relative",
                }}
              >
                <Icon name={m.icon} size={16} color={selected?m.color:withAlpha(m.color,55)}/>
                <span style={{
                  fontSize:10,
                  fontWeight:selected?800:600,
                  color:selected?m.color:t3,
                  lineHeight:1.1,
                  textAlign:"center",
                  letterSpacing:-0.02,
                }}>{m.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    )}

    {/* Duration selector */}
    {ts==="idle"&&(()=>{
      const need=aiRec?.need;
      const rInt=aiRec?.context?.readiness?.interpretation;
      const recommendedMult=rInt==="recover"?0.5
        :rInt==="primed"&&(need==="enfoque"||need==="energia")?1.5
        :need==="calma"||need==="reset"?0.5
        :need==="energia"?1.5
        :1;
      return(
        <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:16}}>
          {[{v:.5,l:"60s"},{v:1,l:"120s"},{v:1.5,l:"180s"}].map(d=>{
            const isRec=d.v===recommendedMult;
            return(
              <motion.button key={d.v} whileTap={{scale:.93}} onClick={()=>{setDurMult(d.v);setSec(Math.round(pr.d*d.v));H("tap");}} aria-label={isRec?`${d.l} — duración recomendada`:d.l} style={{position:"relative",padding:"6px 16px",borderRadius:20,border:durMult===d.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:durMult===d.v?ac+"08":cd,color:durMult===d.v?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
                {d.l}
                {isRec&&<span aria-hidden="true" style={{position:"absolute",top:-3,right:-3,inlineSize:7,blockSize:7,borderRadius:"50%",background:semantic.success,boxShadow:`0 0 6px ${withAlpha(semantic.success,60)}`}}/>}
              </motion.button>
            );
          })}
        </div>
      );
    })()}


    {/* ═══ CORE DE IGNICIÓN — orb 3D sensorial (misma receta que el orb del landing)
        Esfera dark-navy con highlight cyan arriba, drop-shadow pronunciado, beam vertical,
        ripple rings en idle, progress ring como corona exterior brillante.
        Interior con texto claro para contrastar con el orb oscuro. ═══ */}
    <div onClick={timerTap} role="button" tabIndex={0} aria-label={ts==="idle"?`Iniciar sesión de ${pr.n}, duración ${sec} segundos`:ts==="running"?`Pausar sesión. Fase ${ph.l}, ${sec} segundos restantes`:`Reanudar sesión. ${sec} segundos restantes`} aria-pressed={ts==="running"} onKeyDown={onTimerKey} onMouseDown={()=>setTp(true)} onMouseUp={()=>setTp(false)} onMouseLeave={()=>setTp(false)} onTouchStart={()=>setTp(true)} onTouchEnd={()=>setTp(false)} style={{position:"relative",width:isActive?240:260,height:isActive?240:260,margin:"28px auto 32px",cursor:"pointer",transform:tp?"scale(0.94)":"scale(1)",transition:reducedMotion?"none":"all .6s cubic-bezier(.34,1.56,.64,1)",userSelect:"none"}}>
      {/* Beam vertical — tallo neural persistente en todos los estados (ADN de marca: "Y" del logo).
          Se intensifica en idle (invitación), se atenúa en running/paused (mecha encendida). */}
      <motion.div aria-hidden="true" animate={reducedMotion?{opacity:ts==="idle"?.7:ts==="paused"?.25:.45}:ts==="idle"?{opacity:[.4,.9,.4]}:ts==="running"?{opacity:[.35,.55,.35]}:{opacity:.22}} transition={{duration:ts==="idle"?3:2.2,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",top:-46,left:"50%",width:2,height:44,background:`linear-gradient(to bottom, transparent 0%, ${withAlpha(ac,0)} 10%, ${ac} 100%)`,transform:"translateX(-50%)",filter:`drop-shadow(0 0 8px ${withAlpha(ac,75)})`,pointerEvents:"none",borderRadius:2}}/>
      {/* Nodo-chispa en el punto donde beam toca el ring — conecta visualmente beam + orb.
          En paused queda congelado (sin animación) para reforzar la sensación de "pausa". */}
      <motion.div aria-hidden="true" animate={reducedMotion||ts==="paused"?{scale:1,opacity:ts==="paused"?.35:.85}:{scale:ts==="idle"?[1,1.3,1]:[1,1.15,1],opacity:[.65,1,.65]}} transition={ts==="paused"?{duration:.3}:{duration:ts==="idle"?2.8:1.8,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",top:-4,left:"50%",transform:"translate(-50%,-50%)",width:8,height:8,borderRadius:"50%",background:ac,boxShadow:`0 0 14px ${withAlpha(ac,90)}, 0 0 4px #fff`,pointerEvents:"none",zIndex:3}}/>
      {/* Phosphor glow ambiental — grande y suave, se siente desde lejos */}
      <motion.div aria-hidden="true" animate={isBr&&!reducedMotion?{scale:bS*1.08,opacity:.55}:ts==="idle"?{scale:[1,1.08,1],opacity:[.35,.6,.35]}:isActive?{scale:[1,1.05,1],opacity:[.45,.7,.45]}:{opacity:.3}} transition={isBr&&!reducedMotion?{scale:{type:"spring",stiffness:30,damping:20,mass:1.2},opacity:{duration:.6}}:{duration:ts==="idle"?4:2.8,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",inset:-52,borderRadius:"50%",background:`radial-gradient(circle, ${withAlpha(ac,30)}, ${withAlpha(ac,10)} 45%, transparent 70%)`,filter:"blur(22px)",pointerEvents:"none"}}/>
      {/* Ripple rings — se expanden en idle (invitación a tocar) y durante sesión activa (confirmación de pulso) */}
      {(ts==="idle"||isActive)&&!reducedMotion&&[0,1].map(i=><motion.span key={i} aria-hidden="true" initial={{scale:.88,opacity:.5}} animate={{scale:1.45,opacity:0}} transition={{duration:isActive?2.2:3.2,delay:i*(isActive?1.1:1.6),ease:"easeOut",repeat:Infinity}} style={{position:"absolute",inset:0,borderRadius:"50%",border:`1px solid ${ac}`,pointerEvents:"none"}}/>)}
      {/* ── Núcleo neural 3D — reemplaza el orb sólido previo.
          Una cámara glass translúcida con la lattice del trademark
          rotando en 3D (parallax multidimensional) y motes pulsando
          con fases independientes (sinapsis). El color se tiñe al
          protocolo en ejecución, con readiness override: recover→
          amber warm, optimal→emerald, primed/default→accent. */}
      {(()=>{const rInt=readiness?.interpretation;const coreColor=rInt==="recover"?"#f59e0b":rInt==="optimal"?"#22c55e":ac;return(
        <NeuralCore3D
          size={isActive?240:260}
          color={coreColor}
          state={ts}
          breathScale={bS}
          isBreathing={isBr}
          reducedMotion={reducedMotion}
        />
      );})()}
      {/* Ignition flash — destello one-shot de luz que emerge del centro cuando la sesión arranca.
          Materializa la metáfora de "ignición": la chispa se enciende. */}
      <AnimatePresence>
        {ignitionFlash&&!reducedMotion&&<motion.div key="ignition" aria-hidden="true" initial={{scale:.15,opacity:1}} animate={{scale:2.4,opacity:0}} exit={{opacity:0}} transition={{duration:.85,ease:[.16,1,.3,1]}} style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle, #ffffff 0%, ${withAlpha(ac,80)} 30%, ${withAlpha(ac,20)} 60%, transparent 80%)`,pointerEvents:"none",zIndex:4,filter:"blur(2px)"}}/>}
        {ignitionFlash&&!reducedMotion&&[0,1,2].map(i=><motion.span key={`spark-${i}`} aria-hidden="true" initial={{scale:.6,opacity:.9}} animate={{scale:2,opacity:0}} transition={{duration:.7,delay:i*.08,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",border:`1.5px solid ${ac}`,pointerEvents:"none",zIndex:4}}/>)}
        {/* Phase flash — pulso sutil al transicionar entre fases, más suave que ignition */}
        {phaseFlash&&!reducedMotion&&<motion.span key="phase-flash" aria-hidden="true" initial={{scale:.85,opacity:.55}} animate={{scale:1.3,opacity:0}} transition={{duration:.6,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",border:`1.5px solid ${ac}`,pointerEvents:"none",zIndex:4,boxShadow:`0 0 20px ${withAlpha(ac,60)}`}}/>}
        {/* Orb-done flash — burst emerald que cierra el ciclo del orb antes de que el IgnitionBurst
            full-screen tome el control. Signature end-state: el orb completa su propia narrativa. */}
        {orbDoneFlash&&!reducedMotion&&<motion.div key="orb-done" aria-hidden="true" initial={{scale:.3,opacity:1}} animate={{scale:2.2,opacity:0}} transition={{duration:.55,ease:[.16,1,.3,1]}} style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle, #ffffff 0%, #34d39988 25%, #22c55e44 55%, transparent 80%)`,pointerEvents:"none",zIndex:5,filter:"blur(1px)"}}/>}
        {orbDoneFlash&&!reducedMotion&&[0,1,2].map(i=><motion.span key={`done-ring-${i}`} aria-hidden="true" initial={{scale:.8,opacity:.8}} animate={{scale:1.8,opacity:0}} transition={{duration:.6,delay:i*.07,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",border:`1.5px solid #22c55e`,pointerEvents:"none",zIndex:5,boxShadow:`0 0 20px #22c55e88`}}/>)}
      </AnimatePresence>
      {/* Progress ring como corona exterior — brillante sobre el orb oscuro */}
      <svg width={isActive?"240":"260"} height={isActive?"240":"260"} viewBox="0 0 260 260" style={{transform:"rotate(-90deg)",position:"absolute",inset:0,pointerEvents:"none"}}>
        <circle cx="130" cy="130" r="122" fill="none" stroke={withAlpha(ac,18)} strokeWidth={ts==="idle"?"3":"2.5"}/>
        <circle cx="130" cy="130" r="122" fill="none" stroke={ac} strokeWidth={isActive?"6":ts==="idle"?"4":"3"} strokeLinecap="round" strokeDasharray={2*Math.PI*122} strokeDashoffset={ts==="idle"?0:(2*Math.PI*122)*(sec/totalDur)} style={{transition:isActive?"stroke-dashoffset .95s linear":"stroke-dashoffset .3s ease",filter:`drop-shadow(0 0 10px ${withAlpha(ac,isActive?85:65)}) drop-shadow(0 0 4px ${withAlpha(ac,50)})`}}/>
      </svg>
      {/* Contenido central — countdown + labels en colores claros (contraste contra orb oscuro) */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",zIndex:2,width:"88%",display:"flex",flexDirection:"column",alignItems:"center"}}>
        {isActive&&<motion.div key={pi} initial={reducedMotion?{opacity:1}:{opacity:0,y:-4}} animate={{opacity:1,y:0}} transition={{duration:reducedMotion?0:.35}} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:99,background:withAlpha(ac,25),border:`1px solid ${withAlpha(ac,45)}`,marginBottom:6,backdropFilter:"blur(4px)"}}>
          <Icon name={ph.ic} size={9} color={ac} aria-hidden="true"/>
          <span aria-hidden="true" style={{fontSize:11,fontWeight:700,color:ac,letterSpacing:-0.05}}>Fase {pi+1}/{pr.ph.length} · {ph.l}</span>
        </motion.div>}
        <div style={{...ty.biometric("#ffffff",isActive?font.size.hero:60),lineHeight:font.leading.none,letterSpacing:"-2.5px",fontVariantNumeric:"tabular-nums",textShadow:`0 2px 12px ${withAlpha(ac,50)}, 0 0 30px ${withAlpha(ac,25)}`,filter:isBr?`drop-shadow(0 0 ${Math.round(4+Math.max(0,(bS-0.9))*55)}px ${withAlpha(ac,60)})`:"none",transition:isBr?"none":"filter .3s ease-out"}}>{sec}</div>
        {isActive&&<div style={{fontSize:11,fontWeight:600,color:ac,marginTop:4,opacity:.85,fontVariantNumeric:"tabular-nums"}}>{sessPct}%</div>}
        <AnimatePresence mode="wait">
          {isBr&&bL&&<motion.div key={bL} initial={reducedMotion?{opacity:1}:{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={reducedMotion?{opacity:0}:{opacity:0,y:-6}} transition={{duration:reducedMotion?0:.3}} style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <span aria-hidden="true" style={{fontSize:15,fontWeight:700,letterSpacing:-0.1,color:ac}}>{bL.charAt(0)+bL.slice(1).toLowerCase()}</span>
            <span aria-hidden="true" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minWidth:22,height:18,padding:"0 6px",borderRadius:9,background:withAlpha(ac,28),border:`1px solid ${withAlpha(ac,40)}`,fontSize:11,fontWeight:700,color:ac,fontVariantNumeric:"tabular-nums"}}>{bCnt}s</span>
          </motion.div>}
        </AnimatePresence>
        {ts==="idle"&&<>
          <div style={{fontSize:12,fontWeight:600,letterSpacing:-0.05,color:"rgba(255,255,255,0.55)",marginTop:space[1.5]}}>segundos</div>
          {/* Wordmark kicker — misma receta que BioIgnicionMark (BIO ligero · em-dash cyan · IGNICIÓN pesado).
              Construye identidad de marca en el momento-cero del producto. */}
          <motion.div animate={reducedMotion?{}:{opacity:[.7,1,.7]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}} style={{marginTop:14,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span aria-hidden="true" style={{inlineSize:3,blockSize:3,borderRadius:"50%",background:ac,boxShadow:`0 0 8px ${withAlpha(ac,90)}`}}/>
              <span style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.55)",letterSpacing:2.5,textTransform:"uppercase"}}>Toca para</span>
              <span aria-hidden="true" style={{inlineSize:3,blockSize:3,borderRadius:"50%",background:ac,boxShadow:`0 0 8px ${withAlpha(ac,90)}`}}/>
            </div>
            <span aria-hidden="true" style={{display:"inline-flex",alignItems:"baseline",gap:3,fontFamily:font.family,fontSize:14,letterSpacing:4,textTransform:"uppercase",lineHeight:1}}>
              <span style={{fontWeight:font.weight.normal,color:"rgba(255,255,255,0.72)"}}>BIO</span>
              <span style={{color:ac,fontWeight:font.weight.bold,transform:"translateY(-0.08em)",filter:`drop-shadow(0 0 4px ${withAlpha(ac,70)})`}}>—</span>
              <span style={{fontWeight:font.weight.black,color:"#ffffff"}}>IGNICIÓN</span>
            </span>
          </motion.div>
        </>}
        {ts==="paused"&&<motion.div animate={{opacity:[.55,1,.55]}} transition={{duration:2.2,repeat:Infinity,ease:"easeInOut"}} style={{marginTop:10,display:"flex",alignItems:"center",gap:8}}>
          {/* Símbolo de pausa visual — dos barras verticales, más reconocible que solo texto */}
          <span aria-hidden="true" style={{display:"inline-flex",gap:3,alignItems:"center"}}>
            <span style={{width:3,height:12,background:ac,borderRadius:1.5,boxShadow:`0 0 8px ${withAlpha(ac,70)}`}}/>
            <span style={{width:3,height:12,background:ac,borderRadius:1.5,boxShadow:`0 0 8px ${withAlpha(ac,70)}`}}/>
          </span>
          <span style={{fontSize:11,fontWeight:800,color:ac,letterSpacing:2.5,textTransform:"uppercase"}}>En pausa</span>
        </motion.div>}
      </div>
      {tp&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"100%",height:"100%",borderRadius:"50%",border:`2px solid ${withAlpha(ac,50)}`,animation:"cdPulse .6s ease forwards",pointerEvents:"none"}}/>}
    </div>

    {/* Phase info — solo en preview (idle); durante sesión activa la fase vive dentro del core */}
    {!isActive&&<div style={{textAlign:"center",marginBottom:10}}><div style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name={ph.ic} size={13} color={ac}/><span style={{fontSize:14,fontWeight:800,color:t1}}>{ph.l}</span></div><div style={{fontSize:10,color:t3,marginTop:2}}>{ph.r}</div></div>}
    <motion.div key={pi} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{duration:.3}} style={{background:cd,borderRadius:16,padding:"16px",marginBottom:10,border:`1px solid ${bd}`}}>
      {isActive&&<div aria-hidden="true" style={{height:3,borderRadius:2,background:bd,overflow:"hidden",marginBottom:12}}><div style={{width:`${Math.round((pi+1)/pr.ph.length*100)}%`,height:"100%",background:`linear-gradient(90deg,${ac}60,${ac})`,transition:"width .3s ease"}}/></div>}
      {ph.k&&<div style={{fontSize:15,fontWeight:800,color:t1,lineHeight:1.45,marginBottom:8,letterSpacing:"-0.2px"}}>{ph.k}</div>}
      <p style={{fontSize:12,lineHeight:1.7,color:t2,margin:0}}>{ph.i}</p>

      {/* Anti-trampa checkpoints — ahora viven dentro del SessionRunner (ver onCheckpoint* props). */}

      {/* Science */}
      <button onClick={()=>{setShowScience(!showScience);}} style={{display:"flex",alignItems:"center",gap:5,marginTop:12,padding:"6px 0",background:"none",border:"none",cursor:"pointer"}}>
        <Icon name="mind" size={12} color={ac}/><span style={{fontSize:12,color:ac,fontWeight:600,letterSpacing:-0.05}}>Neurociencia</span>
        <span style={{fontSize:10,color:ac,transform:showScience?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▾</span>
      </button>
      <AnimatePresence>
      {showScience&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
        <div style={{marginTop:8,padding:"12px 14px",background:ac+"05",borderRadius:12,border:`1px solid ${ac}08`}}>
          <div style={{fontSize:11,color:t2,lineHeight:1.7}}>{ph.sc}</div>
          {SCIENCE_DEEP[pr.id]&&<div style={{fontSize:10,color:t3,lineHeight:1.7,borderTop:`1px solid ${bd}`,paddingTop:8,marginTop:4}}>{SCIENCE_DEEP[pr.id]}</div>}
        </div>
      </motion.div>}
      </AnimatePresence>
    </motion.div>

    {isActive&&nextPh&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",marginBottom:10,borderRadius:10,background:surface}}>
      <Icon name="chevron" size={10} color={t3}/><span style={{fontSize:10,color:t3,fontWeight:600}}>Siguiente: {nextPh.l}</span>
    </div>}
    {/* Phase timeline — proportional segments */}
    <div style={{marginBottom:14}}>
      <div role="list" aria-label="Fases del protocolo" style={{display:"flex",gap:2,blockSize:6,borderRadius:3,overflow:"hidden"}}>
        {pr.ph.map((p,i)=>{
          const segW=((p.e-p.s)/pr.d)*100;
          const isCurr=pi===i;
          const isDone=i<pi;
          return(
            <div key={i} role="listitem" aria-current={isCurr?"step":undefined} style={{
              inlineSize:`${segW}%`,
              background:isDone?ac:isCurr?`linear-gradient(90deg,${ac},${withAlpha(ac,70)})`:withAlpha(ac,14),
              transition:"background .35s ease",
            }}/>
          );
        })}
      </div>
      <div style={{display:"flex",marginBlockStart:8}}>
        {pr.ph.map((p,i)=>{
          const segW=((p.e-p.s)/pr.d)*100;
          const isCurr=pi===i;
          const isDone=i<pi;
          const sR=durMult!==1?Math.round(p.s*durMult)+"–"+Math.round(p.e*durMult)+"s":p.r;
          const iconColor=isCurr?ac:isDone?withAlpha(ac,70):t3;
          const labelColor=isCurr?ac:t3;
          return(
            <div key={i} style={{
              inlineSize:`${segW}%`,
              display:"flex",
              alignItems:"center",
              gap:4,
              paddingInline:4,
              opacity:i<=pi?1:0.55,
              transition:"opacity .3s ease",
              overflow:"hidden",
            }}>
              <Icon name={p.ic} size={10} color={iconColor} aria-hidden="true"/>
              <span style={{
                fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize:9,
                fontWeight:isCurr?800:600,
                color:labelColor,
                letterSpacing:-0.02,
                fontVariantNumeric:"tabular-nums",
                whiteSpace:"nowrap",
                overflow:"hidden",
                textOverflow:"ellipsis",
              }}>{sR}</span>
            </div>
          );
        })}
      </div>
    </div>
    <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center"}}>
      {ts==="idle"&&(()=>{
        const intentLabelMap={calma:"Calma",enfoque:"Enfoque",energia:"Energía",reset:"Reset"};
        const iconLabelMap={calma:"calm",enfoque:"focus",energia:"energy",reset:"reset"};
        const intentKey=pr?.int;
        const intentLabel=intentLabelMap[intentKey]||null;
        const intentIcon=iconLabelMap[intentKey]||"bolt";
        return(
          <motion.button whileTap={{scale:.95}} onClick={go} aria-label={intentLabel?`Iniciar ${intentLabel.toLowerCase()} de ${sec} segundos`:`Iniciar sesión de ${sec} segundos`} style={{flex:1,maxWidth:260,minBlockSize:48,padding:"14px 0",borderRadius:50,background:`linear-gradient(135deg,${ac},${brand.accent})`,border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:-0.1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 18px ${ac}28`}}>
            <Icon name={intentIcon} size={15} color="#fff"/>
            <span>Iniciar {intentLabel?`${intentLabel} `:""}<span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontVariantNumeric:"tabular-nums",letterSpacing:-0.1,fontWeight:700}}>{sec}s</span></span>
          </motion.button>
        );
      })()}
      {ts==="running"&&<><motion.button whileTap={{scale:.95}} onClick={pa} style={{flex:1,maxWidth:180,minBlockSize:48,padding:"14px 0",borderRadius:50,background:cd,border:`2px solid ${ac}`,color:ac,fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:-0.1}}>Pausar</motion.button><motion.button whileTap={{scale:.9}} onClick={rs} style={{width:44,height:44,borderRadius:"50%",border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="reset" size={15} color={t3}/></motion.button></>}
      {ts==="paused"&&<><motion.button whileTap={{scale:.95}} onClick={resume} style={{flex:1,maxWidth:180,minBlockSize:48,padding:"14px 0",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:-0.1}}>Continuar</motion.button><motion.button whileTap={{scale:.9}} onClick={rs} style={{width:44,height:44,borderRadius:"50%",border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="reset" size={15} color={t3}/></motion.button></>}
    </div>
    {isActive&&<div style={{marginTop:14,height:26,borderRadius:13,overflow:"hidden",background:cd,border:`1.5px solid ${bd}`,position:"relative"}}><svg width="800" height="20" viewBox="0 0 800 20" style={{position:"absolute",top:0,left:0,animation:"wf 4s linear infinite",opacity:.2}}><path d={`M0,10 ${Array.from({length:40},(_,i)=>`Q${i*20+10},${i%2===0?3:17} ${(i+1)*20},10`).join(" ")}`} fill="none" stroke={ac} strokeWidth="1"/></svg><div style={{position:"absolute",left:0,top:0,bottom:0,width:(pct*100)+"%",background:`linear-gradient(90deg,${ac}25,${ac}10)`,transition:"width .95s linear",borderRadius:10}}/></div>}
  </>}
  </div>)}

  {/* ═══ TAB: DASHBOARD ═══ */}
  {tab==="dashboard"&&<DashboardView st={st} isDark={isDark} ac={ac} switchTab={switchTab} sp={sp} onShowHist={()=>setShowHist(true)} bp={bp} />}

  {/* ═══ TAB: PERFIL ═══ */}
  {tab==="perfil"&&<ProfileView st={st} setSt={setSt} isDark={isDark} ac={ac} onShowSettings={()=>setShowSettings(true)} onShowHist={()=>setShowHist(true)} onShowCalibration={()=>setShowCalibration(true)} onShowChronotype={()=>setShowChronoTest(true)} onShowResonance={()=>setShowResonanceCal(true)} onShowNOM035={()=>setShowNOM035(true)} />}
  </motion.div>
  </AnimatePresence>
  </div>

  {/* ═══ BOTTOM METRICS BAR — living chrome: se tiñe con la coherencia actual ═══ */}
  {(()=>{
    const neural=Math.round((st.coherencia+st.resiliencia+st.capacidad)/3);
    // Tinta fosforescente cuando estás "en la zona" (≥70); neutra si no
    const vitalTint=neural>=70?bioSignal.phosphorCyan:neural>=50?bioSignal.neuralViolet:"transparent";
    const tintOpacity=neural>=70?(isDark?0.07:0.05):neural>=50?(isDark?0.05:0.035):0;
    const barAlpha=Math.round(tintOpacity*255).toString(16).padStart(2,"0");
    return <aside role="group" aria-label="Métricas neurales en tiempo real" style={{position:"fixed",bottom:`calc(${layout.bottomNav}px + env(safe-area-inset-bottom, 0px))`,left:"50%",transform:"translateX(-50%)",width:"calc(100% - max(32px, env(safe-area-inset-left) + env(safe-area-inset-right) + 32px))",maxWidth:400,padding:`${space[2]}px ${space[4]}px`,background:`linear-gradient(180deg, ${vitalTint}${barAlpha}, ${vitalTint}00), ${resolveTheme(isDark).glass}`,backdropFilter:"blur(16px)",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:z.sticky,borderRadius:radius.lg,border:`1px solid ${neural>=70?bioSignal.phosphorCyan+"22":bd}`,boxShadow:`0 4px 20px ${isDark?"rgba(0,0,0,.3)":"rgba(0,0,0,.06)"}${neural>=70?`, 0 0 28px ${bioSignal.phosphorCyan}14`:""}`,transition:"background .8s ease, border-color .8s ease, box-shadow .8s ease"}}>
      {[{v:st.coherencia,l:"Enfoque",d:rD.c,c:protoColor.enfoque,ic:"focus"},{v:st.resiliencia,l:"Calma",d:rD.r,c:protoColor.calma,ic:"calm"},{v:st.capacidad,l:"Energía",d:0,c:protoColor.energia,ic:"energy"}].map((m,i)=><div key={i} role="group" aria-label={`${m.l}: ${m.v}%${m.d>0?`, +${m.d} esta semana`:""}`} style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"center"}}>
        <div aria-hidden="true" style={{width:28,height:28,borderRadius:8,background:m.c+"10",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={m.ic} size={12} color={m.c}/></div>
        <div><div style={{...ty.biometric(m.c,font.size.md),lineHeight:font.leading.none}}>{m.v}%</div><div style={{fontSize:font.size.xs,color:t3,fontWeight:font.weight.semibold,display:"flex",alignItems:"center",gap:2}}>{m.l}{m.d>0&&<span style={{color:semantic.success,fontWeight:font.weight.bold}}>+{m.d}</span>}</div></div>
      </div>)}
    </aside>;
  })()}

  {/* ═══ BOTTOM NAV ═══ */}
  <nav role="tablist" aria-label="Navegación principal" aria-hidden={ts==="running"?"true":undefined} style={{position:"fixed",bottom:0,left:"50%",transform:`translateX(-50%) translateY(${ts==="running"?"72px":"0"})`,width:"100%",maxWidth:rootMaxWidth,background:resolveTheme(isDark).overlay,backdropFilter:"blur(20px)",borderTop:`1px solid ${bd}`,paddingBlockStart:6,paddingBlockEnd:"max(10px, env(safe-area-inset-bottom))",paddingInlineStart:`max(${space[4]}px, env(safe-area-inset-left))`,paddingInlineEnd:`max(${space[4]}px, env(safe-area-inset-right))`,display:"flex",justifyContent:"center",gap:space[1],zIndex:z.nav,opacity:ts==="running"?0:1,pointerEvents:ts==="running"?"none":"auto",transition:reducedMotion?"none":"transform .45s cubic-bezier(.16,1,.3,1), opacity .35s ease"}}>
    {[{id:"ignicion",lb:"Ignición",ic:"bolt",ac:ac},{id:"dashboard",lb:"Dashboard",ic:"gauge",ac:bioSignal.phosphorCyan},{id:"perfil",lb:"Perfil",ic:"user",ac:brand.accent}].map((t,order)=>{
      const a=tab===t.id;
      const isIgnicion=t.id==="ignicion";
      // Ignición siempre marca identidad: inactive conserva tint sutil del glyph + em-dash
      const inactiveGlyphColor=isIgnicion?withAlpha(brand.primary,55):t3;
      const inactiveSpark=isIgnicion?withAlpha(bioSignal.ignition,45):t3;
      return(<motion.button key={t.id} role="tab" aria-selected={a} aria-controls={`tab-${t.id}-panel`} id={`tab-${t.id}`} tabIndex={ts==="running"?-1:(a?0:-1)} onKeyDown={e=>onTabKey(e,t.id,order)} whileTap={reducedMotion?{}:{scale:.92}} onClick={()=>switchTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0 4px",border:"none",background:"transparent",borderRadius:14,position:"relative",minHeight:48}}>
        {/* Active indicator — neural-spark dot con glow (reemplaza línea genérica) */}
        {a&&<motion.div layoutId="navIndicator" aria-hidden="true" style={{position:"absolute",top:3,left:"50%",translateX:"-50%",width:5,height:5,borderRadius:"50%",background:t.ac,boxShadow:`0 0 8px ${withAlpha(t.ac,90)}, 0 0 2px #fff`}} transition={reducedMotion?{duration:0}:{type:"spring",stiffness:400,damping:30}}/>}
        {/* Glyph slot: Ignición usa BioGlyph (trademark), los demás Icon */}
        <motion.div aria-hidden="true" animate={reducedMotion?{}:{scale:a?1:0.9,y:a?-1:0}} transition={reducedMotion?{duration:0}:{type:"spring",stiffness:300,damping:20}} style={{width:32,height:32,borderRadius:10,background:a?t.ac+"12":isIgnicion?withAlpha(brand.primary,6):"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"}}>
          {isIgnicion?(
            <BioGlyph size={a?20:18} color={a?t.ac:inactiveGlyphColor} spark={a?bioSignal.ignition:inactiveSpark} animated={a&&!reducedMotion}/>
          ):(
            <Icon name={t.ic} size={a?19:17} color={a?t.ac:t3}/>
          )}
        </motion.div>
        {/* Label: Ignición usa wordmark trademark (BIO — IGNICIÓN); los demás label plain.
            Trademark permanece marked even inactive — em-dash conserva tint emerald siempre. */}
        {isIgnicion?(
          <span aria-label="Ignición" style={{display:"inline-flex",alignItems:"baseline",gap:2,fontFamily:font.family,fontSize:9,letterSpacing:a?2.2:1.8,textTransform:"uppercase",lineHeight:1,transition:"all .2s"}}>
            <span aria-hidden="true" style={{fontWeight:font.weight.normal,color:a?withAlpha(t.ac,80):withAlpha(brand.primary,55)}}>BIO</span>
            <span aria-hidden="true" style={{color:a?t.ac:withAlpha(brand.primary,65),fontWeight:font.weight.bold,transform:"translateY(-0.08em)",filter:a?`drop-shadow(0 0 3px ${withAlpha(t.ac,60)})`:"none"}}>—</span>
            <span aria-hidden="true" style={{fontWeight:font.weight.black,color:a?t.ac:withAlpha(brand.primary,70)}}>IGNICIÓN</span>
          </span>
        ):(
          <span style={{fontSize:font.size.sm,fontWeight:a?font.weight.black:font.weight.semibold,color:a?t.ac:t3,transition:"all .2s",letterSpacing:a?font.tracking.wide:font.tracking.normal}}>{t.lb}</span>
        )}
      </motion.button>);
    })}
  </nav>
  </div>);
}
