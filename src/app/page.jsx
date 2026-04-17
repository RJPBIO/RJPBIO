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
import { P, SCIENCE_DEEP } from "../lib/protocols";
import {
  MOODS, INTENTS,
  MID_MSGS, POST_MSGS, PROG_7, DS,
} from "../lib/constants";
import {
  gL, lvPct, getStatus, getWeekNum, getDailyIgn, getCircadian,
  calcProtoSensitivity, predictSessionImpact,
  adaptiveProtocolEngine, estimateCognitiveLoad,
  calcSessionCompletion,
} from "../lib/neural";
import {
  hap, hapticPhase, hapticBreath, hapticSignature, hapticPreShift, hapticCountdown, playIgnition,
  startAmbient, stopAmbient,
  startSoundscape, stopSoundscape, startBinaural, stopBinaural,
  setupMotionDetection, requestWakeLock, releaseWakeLock,
  unlockVoice, speak, speakNow, stopVoice, loadVoices,
} from "../lib/audio";
import { resolveTheme, withAlpha, ty, font, space, radius, z, layout, timer as timerSize, bioSignal } from "../lib/theme";
import BioIgnicionMark, { BioGlyph } from "../components/BioIgnicionMark";
import IgnitionBurst from "../components/IgnitionBurst";
import { useStore } from "../store/useStore";
import Icon from "../components/Icon";
import { useSync } from "../hooks/useSync";
import { useDeepLink } from "../hooks/useDeepLink";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { uiSound } from "../lib/uiSound";
import { parseDeepLink } from "../lib/deeplink";
import { buildCommands } from "../lib/commandPalette";
import { computePhaseIndex, timeToNextPhase } from "../lib/phaseEngine";
import { computeSessionMetrics, sessionQualityMessage, shouldPlayIgnitionSignature } from "../lib/sessionClose";
import { computeBreathFrame } from "../lib/breathCycle";
import { useReducedMotion, useFocusTrap, KEY, announce } from "../lib/a11y";
import { semantic } from "../lib/tokens";

// Dynamic imports (code-split)
const NeuralCalibration = dynamic(() => import("../components/NeuralCalibration"), { ssr: false });
const BioIgnitionWelcome = dynamic(() => import("../components/BioIgnitionWelcome"), { ssr: false });
const CommandPalette = dynamic(() => import("../components/CommandPalette"), { ssr: false });
const ProtocolDetail = dynamic(() => import("../components/ProtocolDetail"), { ssr: false });
const StreakShield = dynamic(() => import("../components/StreakShield"), { ssr: false });
const DashboardView = dynamic(() => import("../components/DashboardView"), { ssr: false });
const ProfileView = dynamic(() => import("../components/ProfileView"), { ssr: false });
const PostSessionFlow = dynamic(() => import("../components/PostSessionFlow"), { ssr: false });
const SettingsSheet = dynamic(() => import("../components/SettingsSheet"), { ssr: false });
const HistorySheet = dynamic(() => import("../components/HistorySheet"), { ssr: false });
const ProtocolSelector = dynamic(() => import("../components/ProtocolSelector"), { ssr: false });
const OnboardingTour = dynamic(() => import("../components/OnboardingTour"), { ssr: false });
const HRVMonitor = dynamic(() => import("../components/HRVMonitor"), { ssr: false });
const PhysiologicalSigh = dynamic(() => import("../components/PhysiologicalSigh"), { ssr: false });
const NSDR = dynamic(() => import("../components/NSDR"), { ssr: false });
const ChronotypeTest = dynamic(() => import("../components/ChronotypeTest"), { ssr: false });
const ResonanceCalibration = dynamic(() => import("../components/ResonanceCalibration"), { ssr: false });
const NOM035Questionnaire = dynamic(() => import("../components/NOM035Questionnaire"), { ssr: false });
const ReadinessScore = dynamic(() => import("../components/ReadinessScore"), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function BioIgnicion(){
  const store = useStore();
  const[mt,setMt]=useState(false);const[tab,setTab]=useState("ignicion");const[st,setSt_]=useState(DS);
  const[pr,setPr]=useState(P[12]);const[sc,setSc]=useState("Protocolo");const[sl,setSl]=useState(false);
  const[ts,setTs]=useState("idle");const[sec,setSec]=useState(120);const[pi,setPi]=useState(0);
  const[bL,setBL]=useState("");const[bS,setBS]=useState(1);const[bCnt,setBCnt]=useState(0);
  const[midMsg,setMidMsg]=useState("");const[showMid,setShowMid]=useState(false);
  const[tp,setTp]=useState(false);
  const[postStep,setPostStep]=useState("none");
  const[postVC,setPostVC]=useState(0);const[postMsg,setPostMsg]=useState("");
  const[checkMood,setCheckMood]=useState(0);const[checkEnergy,setCheckEnergy]=useState(0);const[checkTag,setCheckTag]=useState("");
  const[preMood,setPreMood]=useState(0);
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
  const[showTour,setShowTour]=useState(false);
  const[showHRV,setShowHRV]=useState(false);
  const[showSigh,setShowSigh]=useState(false);
  const[showNSDR,setShowNSDR]=useState(false);
  const[showChronoTest,setShowChronoTest]=useState(false);
  const[showResonanceCal,setShowResonanceCal]=useState(false);
  const[showNOM035,setShowNOM035]=useState(false);
  const[showCmd,setShowCmd]=useState(false);
  const reducedMotion=useReducedMotion();
  const bp=useBreakpoint();
  const rootMaxWidth=bp==="desktop"?layout.maxWidthDesktop:bp==="tablet"?layout.maxWidthTablet:layout.maxWidth;
  const rootPadInline=bp==="desktop"?layout.contentPaddingDesktop:bp==="tablet"?layout.contentPaddingTablet:0;
  const iR=useRef(null);const bR=useRef(null);const tR=useRef(null);const cdR=useRef(null);

  const setSt=useCallback(v=>{const nv=typeof v==="function"?v(st):v;setSt_(nv);store.update(nv);},[st]);

  // SW se registra desde layout.js (con nonce)
  useSync();

  // NFC/QR deep link validado (ver lib/deeplink.js)
  useEffect(()=>{if(typeof window==="undefined")return;try{const params=new URLSearchParams(window.location.search);const link=parseDeepLink(params);if(link&&(link.company||link.type)){setNfcCtx({company:link.company,type:link.type,employee:link.employee});setEntryDone(true);
    const isExit=link.type==="salida"||link.type==="exit";const h=new Date().getHours();
    let pool=isExit?P.filter(p=>p.int==="calma"||p.int==="reset"):h<12?P.filter(p=>p.int==="energia"||p.int==="enfoque"):P.filter(p=>p.int==="enfoque"||p.int==="reset");
    const pick=pool[Math.floor(Math.random()*pool.length)]||P[0];setPr(pick);setSec(Math.round(pick.d*durMult));
  }}catch(e){};},[]);

  // ═══ VOICE ═══
  useEffect(()=>{if(typeof window==="undefined"||!window.speechSynthesis)return;loadVoices();window.speechSynthesis.addEventListener("voiceschanged",loadVoices);return()=>{try{window.speechSynthesis.removeEventListener("voiceschanged",loadVoices);}catch(e){}};},[]);

  // ═══ LOAD STATE (via Zustand) — await init BEFORE reading/writing ═══
  useEffect(()=>{let cancelled=false;(async()=>{
    try{await store.init();}catch(e){}
    if(cancelled)return;
    const l=useStore.getState();
    if(!l._loaded){setMt(true);return;}
    setSt_(l);
    setMt(true);
    if(l.totalSessions===0){setOnboard(true);}
    else if(!l.onboardingTourComplete){setShowTour(true);}
    try{const rec=adaptiveProtocolEngine(l);if(rec&&rec.primary){setPr(rec.primary.protocol);setSec(Math.round(rec.primary.protocol.d*durMult));}}catch(e){}
  })();return()=>{cancelled=true;};},[]);

  useEffect(()=>{if(typeof window==="undefined")return;function onCmdKey(e){if((e.metaKey||e.ctrlKey)&&(e.key==="k"||e.key==="K")){e.preventDefault();setShowCmd(v=>{const nv=!v;uiSound[nv?"open":"close"](st.soundOn);return nv;});}}window.addEventListener("keydown",onCmdKey);return()=>window.removeEventListener("keydown",onCmdKey);},[st.soundOn]);

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

  useEffect(()=>{if(ts!=="running"||typeof document==="undefined")return;function onVis(){if(document.visibilityState==="hidden"&&ts==="running"){setSessionData(d=>({...d,hiddenStart:Date.now()}));pa();}else if(document.visibilityState==="visible"){setSessionData(d=>{if(!d.hiddenStart)return d;return{...d,hiddenMs:(d.hiddenMs||0)+(Date.now()-d.hiddenStart),hiddenStart:null};});}}document.addEventListener("visibilitychange",onVis);return()=>document.removeEventListener("visibilitychange",onVis);},[ts]);
  useEffect(()=>{if(!mt||typeof window==="undefined")return;const save=()=>store.update(st);const iv=setInterval(save,30000);const onHide=()=>{if(document.visibilityState==="hidden")store.update(st);};window.addEventListener("beforeunload",save);window.addEventListener("pagehide",save);document.addEventListener("visibilitychange",onHide);return()=>{clearInterval(iv);window.removeEventListener("beforeunload",save);window.removeEventListener("pagehide",save);document.removeEventListener("visibilitychange",onHide);};},[mt,st]);
  const[isDark,setIsDark]=useState(false);
  useEffect(()=>{if(!mt)return;function ck(){const h=new Date().getHours();const m=st.themeMode||"auto";if(m==="dark")setIsDark(true);else if(m==="light")setIsDark(false);else setIsDark(h>=20||h<6);}ck();const iv=setInterval(ck,60000);return()=>clearInterval(iv);},[mt,st.themeMode]);
  const H=useCallback(t=>hap(t,st.soundOn,st.hapticOn),[st.soundOn,st.hapticOn]);

  const motionRef=useRef(null);const circadian=useMemo(()=>getCircadian(),[]);
  useEffect(()=>{if(ts==="running"&&st.soundOn!==false){const ss=st.soundscape||"off";if(ss!=="off")startSoundscape(ss);else startAmbient();startBinaural(pr.int);}else{stopAmbient();stopSoundscape();stopBinaural();}return()=>{stopAmbient();stopSoundscape();stopBinaural();};},[ts]);
  useEffect(()=>{if(ts==="running"){motionRef.current=setupMotionDetection(({samples,stability})=>{setSessionData(d=>({...d,motionSamples:samples,stability:stability}));});}return()=>{if(motionRef.current){motionRef.current.cleanup();motionRef.current=null;}};},[ts]);

  useEffect(()=>{if(ts==="running"){iR.current=setInterval(()=>{setSec(p=>{if(p<=1){clearInterval(iR.current);setTs("done");H("ok");return 0;}return p-1;});},1000);tR.current=setInterval(()=>H("tick"),4000);}return()=>{if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);};},[ts]);
  const totalDur=Math.round(pr.d*durMult);
  useEffect(()=>{const elapsedSec=totalDur-sec;const idx=computePhaseIndex(elapsedSec,pr.ph,durMult);
    if(idx!==pi){setPi(idx);if(st.hapticOn!==false)hapticPhase(pr.ph[idx].ic);speakNow("Fase "+(idx+1)+" de "+pr.ph.length+". "+pr.ph[idx].k,circadian,voiceOn);setTimeout(()=>{try{if(document.visibilityState==="visible")speak(pr.ph[idx].i,circadian,voiceOn);}catch(e){}},2500);}
    const ttN=timeToNextPhase(elapsedSec,pr.ph,durMult,pi);
    if(ttN===2&&ts==="running"){speak("Prepárate",circadian,voiceOn);if(st.hapticOn!==false)hapticPreShift();}
  },[sec,pr,durMult]);
  useEffect(()=>{if(ts==="running"&&sec===60){setMidMsg(MID_MSGS[Math.floor(Math.random()*MID_MSGS.length)]);setShowMid(true);setTimeout(()=>setShowMid(false),3500);}if(ts==="running"&&sec===30){setMidMsg("Últimos 30. Cierra con todo.");setShowMid(true);setTimeout(()=>setShowMid(false),3000);}},[sec,ts]);
  useEffect(()=>{if(ts==="done"&&sec===0)comp();},[ts,sec]);
  useEffect(()=>{if(bR.current)clearInterval(bR.current);const ph=pr.ph[pi];if(ts!=="running"){setBL("");setBS(1);setBCnt(0);return;}if(!ph.br){setBL("");setBS(1);setBCnt(0);const elapsed=totalDur-sec;if(elapsed>0&&elapsed%20===0&&ts==="running")speak("Mantén la atención en la instrucción",circadian,voiceOn);return;}let t=0;let lastLabel="";function tk(){const f=computeBreathFrame(t,ph.br);if(!f){t++;return;}setBL(f.label);setBS(f.scale);setBCnt(f.countdown);if(f.label!==lastLabel){if(t%2===0||f.label==="INHALA")speak(f.label.toLowerCase(),circadian,voiceOn);hapticBreath(f.label);lastLabel=f.label;}t++;}tk();bR.current=setInterval(tk,1000);return()=>{if(bR.current)clearInterval(bR.current);};},[ts,pi,pr]);

  function startCountdown(){setCountdown(3);if(st.hapticOn!==false)hapticCountdown(3);speakNow("Tres",circadian,voiceOn);cdR.current=setInterval(()=>{setCountdown(p=>{if(p<=1){clearInterval(cdR.current);setTs("running");H("go");speakNow(pr.ph[0].k||"Comienza",circadian,voiceOn);return 0;}speakNow(p===2?"Dos":"Uno",circadian,voiceOn);if(st.hapticOn!==false)hapticCountdown(p-1);return p-1;});},1000);}
  function go(){unlockVoice();requestWakeLock();try{if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();}catch(e){}setPostStep("none");setSessionData({pauses:0,scienceViews:0,interactions:0,touchHolds:0,motionSamples:0,stability:0,reactionTimes:[],phaseTimings:[],startedAt:Date.now(),hiddenMs:0,hiddenStart:null,expectedSec:Math.round(pr.d*durMult)});startCountdown();}
  const pauseTRef=useRef(null);
  function pa(){if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);setTs("paused");stopVoice();stopBinaural();releaseWakeLock();setSessionData(d=>({...d,pauses:d.pauses+1}));if(pauseTRef.current)clearTimeout(pauseTRef.current);pauseTRef.current=setTimeout(()=>{rs();},300000);}
  function rs(){releaseWakeLock();if(pauseTRef.current)clearTimeout(pauseTRef.current);try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}if(iR.current)clearInterval(iR.current);if(bR.current)clearInterval(bR.current);if(tR.current)clearInterval(tR.current);if(cdR.current)clearInterval(cdR.current);setTs("idle");setSec(Math.round(pr.d*durMult));setPi(0);setBL("");setBS(1);setBCnt(0);setShowMid(false);setPostStep("none");setCheckMood(0);setCheckEnergy(0);setCheckTag("");setPreMood(0);setCountdown(0);setCompFlash(false);stopVoice();}
  function sp(p){rs();setPr(p);setSl(false);setShowIntent(false);setSec(Math.round(p.d*durMult));setShowScience(false);}
  function timerTap(){unlockVoice();H("tap");if(ts==="idle"){go();}else if(ts==="running")pa();else if(ts==="paused"){if(pauseTRef.current)clearTimeout(pauseTRef.current);setTs("running");H("go");speakNow("continúa",circadian,voiceOn);requestWakeLock();if(st.soundOn!==false)startBinaural(pr.int);}}
  function switchTab(id){if(id===tab)return;setTab(id);H("tap");uiSound.nav(st.soundOn);announce(`Pestaña ${id==="ignicion"?"Ignición":id==="dashboard"?"Dashboard":"Perfil"} activa`,"polite");}
  const swipeRef=useRef(null);
  const onSwipeStart=useCallback(e=>{if(ts==="running"||ts==="paused"||postStep!=="none"||countdown>0||sl||showCmd||showIntent||showProtoDetail||showTour||showHist||showCalibration||onboard)return;if(e.pointerType==="mouse")return;swipeRef.current={x:e.clientX,y:e.clientY,t:Date.now()};},[ts,postStep,countdown,sl,showCmd,showIntent,showProtoDetail,showTour,showHist,showCalibration,onboard]);
  const onSwipeEnd=useCallback(e=>{const s=swipeRef.current;swipeRef.current=null;if(!s)return;const dx=e.clientX-s.x;const dy=e.clientY-s.y;const dt=Date.now()-s.t;if(dt>700)return;if(Math.abs(dx)<64)return;if(Math.abs(dx)<Math.abs(dy)*1.4)return;const ids=["ignicion","dashboard","perfil"];const cur=ids.indexOf(tab);const next=dx<0?cur+1:cur-1;if(next>=0&&next<ids.length)switchTab(ids[next]);},[tab]);
  const onTimerKey=useCallback(e=>{if(e.key===KEY.ENTER||e.key===KEY.SPACE){e.preventDefault();timerTap();}},[ts,pr.int,st.soundOn]);
  const onTabKey=useCallback((e,id,order)=>{const ids=["ignicion","dashboard","perfil"];if(e.key===KEY.RIGHT||e.key===KEY.DOWN){e.preventDefault();switchTab(ids[(order+1)%ids.length]);}else if(e.key===KEY.LEFT||e.key===KEY.UP){e.preventDefault();switchTab(ids[(order-1+ids.length)%ids.length]);}else if(e.key===KEY.HOME){e.preventDefault();switchTab(ids[0]);}else if(e.key===KEY.END){e.preventDefault();switchTab(ids[ids.length-1]);}},[]);
  const completeTour=useCallback(()=>{setShowTour(false);setSt(s=>({...s,onboardingTourComplete:true}));},[setSt]);

  function comp(){if(pauseTRef.current)clearTimeout(pauseTRef.current);if(motionRef.current){motionRef.current.cleanup();motionRef.current=null;}
    const{sessionDataFull}=computeSessionMetrics({sessionData,protocol:pr,durMult,now:Date.now()});
    const result=calcSessionCompletion(st,{protocol:pr,durMult,sessionData:sessionDataFull,nfcCtx,circadian});
    setPostVC(result.eVC);setPostMsg(POST_MSGS[Math.floor(Math.random()*POST_MSGS.length)]);
    releaseWakeLock();speakNow(sessionQualityMessage(result.bioQ.quality),circadian,voiceOn);
    if(shouldPlayIgnitionSignature(result.bioQ.quality)){
      if(st.soundOn!==false)try{playIgnition();}catch(e){}
      if(st.hapticOn!==false)hapticSignature("ignition");
    }
    setCompFlash(true);setTimeout(()=>{setCompFlash(false);setPostStep("breathe");},1600);
    setCheckMood(0);setCheckEnergy(0);setCheckTag("");
    setSt({...st,...result.newState});
  }
  function submitCheckin(){
    if(checkMood>0){const ml=[...(st.moodLog||[]),{ts:Date.now(),mood:checkMood,energy:checkEnergy||2,tag:checkTag,proto:pr.n,pre:preMood||0}].slice(-100);const ach=[...st.achievements];if(checkMood===5&&!ach.includes("mood5"))ach.push("mood5");setSt({...st,moodLog:ml,achievements:ach});}
    setPostStep("summary");
  }

  const lv=gL(st.totalSessions),ph=pr.ph[pi],fl=INTENTS.some(i=>i.id===sc)?P.filter(p=>p.int===sc):P.filter(p=>p.ct===sc);
  const pct=(totalDur-sec)/totalDur,CI=2*Math.PI*116,dO=CI*(1-pct),isBr=ts==="running"&&ph.br;
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
  const aiRec=useMemo(()=>{try{return adaptiveProtocolEngine(st);}catch(e){return null;}},[st.moodLog,st.history,st.weeklyData]);
  const smartPick=aiRec?.primary?.protocol||null;
  const daily=useMemo(()=>getDailyIgn(st),[st.moodLog]);
  const progStep=PROG_7[(st.progDay||0)%7];
  const prediction=useMemo(()=>predictSessionImpact(st,pr),[st.moodLog,pr.id]);
  const cogLoad=useMemo(()=>estimateCognitiveLoad(st),[st.todaySessions,st.moodLog]);

  const{bg,card:cd,surface,border:bd,t1,t2,t3,scrim}=resolveTheme(isDark);
  const ac=pr.cl;

  // ─── Loading screen — identidad BIO-IGNICIÓN ─────────────
  if(!mt)return(<div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:bioSignal.deepField,gap:space[5],paddingInline:space[5]}}>
    <BioIgnicionMark layout="stack" glyphSize={76} textColor="#E8ECF4" signalColor={bioSignal.phosphorCyan} animated letterSpacing={6}/>
    <div style={{fontSize:font.size.sm,color:"#4B5568",letterSpacing:2,textTransform:"uppercase",fontWeight:font.weight.semibold}}>Neural Performance System</div>
  </div>);

  return(
  <div data-bp={bp} style={{maxWidth:rootMaxWidth,margin:"0 auto",minHeight:"100dvh",background:bg,position:"relative",overflowX:"hidden",fontFamily:font.family,transition:"background .8s, max-width .25s",paddingBlockEnd:"env(safe-area-inset-bottom)",paddingInline:rootPadInline}}>

  {/* Background aura — dims during running session (cinematic focus) */}
  <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",opacity:ts==="running"?0.35:1,transition:"opacity .8s ease"}}><div style={{position:"absolute",top:"-15%",right:"-15%",width:"50%",height:"50%",borderRadius:"50%",background:`radial-gradient(circle,${ac}${isDark?"12":"08"},transparent)`,animation:"am 25s ease-in-out infinite",filter:"blur(50px)"}}/><div style={{position:"absolute",bottom:"-10%",left:"-10%",width:"40%",height:"40%",borderRadius:"50%",background:`radial-gradient(circle,#818CF8${isDark?"10":"08"},transparent)`,animation:"am 30s ease-in-out infinite reverse",filter:"blur(45px)"}}/></div>

  {/* Mid-session message */}
  <AnimatePresence>
  {showMid&&<motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:180,pointerEvents:"none"}}><div style={{background:cd,borderRadius:16,padding:"14px 22px",boxShadow:"0 8px 30px rgba(0,0,0,.08)",border:`1px solid ${bd}`,maxWidth:320,textAlign:"center"}}><div style={{fontSize:13,fontWeight:600,color:t1,lineHeight:1.6,fontStyle:"italic"}}>{midMsg}</div></div></motion.div>}
  </AnimatePresence>

  {/* Countdown */}
  <AnimatePresence>
  {countdown>0&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:z.countdown,background:`${bg}DD`,backdropFilter:"blur(30px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <motion.div key={countdown} initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:1.5,opacity:0}} transition={{type:"spring",stiffness:200,damping:15}}>
      <div style={{fontSize:96,fontWeight:font.weight.black,color:ac}}>{countdown}</div>
    </motion.div>
  </motion.div>}
  </AnimatePresence>

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
    setShowTour(true);
  }}/>}
  </AnimatePresence>

  {/* ═══ ONBOARDING TOUR — 3-step guided intro ═══ */}
  <OnboardingTour show={showTour&&!onboard&&!showCalibration} isDark={isDark} onClose={completeTour}/>

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
  {tab==="ignicion"&&postStep==="none"&&countdown===0&&!compFlash&&(<div style={{padding:"14px 20px 180px"}}>
    {/* NFC Context */}
    {nfcCtx&&ts==="idle"&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",marginBottom:12,background:nfcCtx.type==="salida"?"#6366F108":ac+"08",borderRadius:14,border:`1.5px solid ${nfcCtx.type==="salida"?"#6366F120":ac+"20"}`,animation:"fi .4s"}}>
      <div style={{width:28,height:28,borderRadius:8,background:nfcCtx.type==="salida"?"#6366F115":ac+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name={nfcCtx.type==="salida"?"calm":"energy"} size={14} color={nfcCtx.type==="salida"?"#6366F1":ac}/></div>
      <div><div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:nfcCtx.type==="salida"?"#6366F1":ac,textTransform:"uppercase"}}>{nfcCtx.type==="salida"?"SESIÓN DE SALIDA":"SESIÓN DE ENTRADA"}</div>
      <div style={{fontSize:10,fontWeight:600,color:t1}}>{nfcCtx.type==="salida"?"Descomprime tu día.":"Activa tu enfoque."}</div></div>
    </div>}

    {/* Immersive entry */}
    {!entryDone&&ts==="idle"&&st.totalSessions>0&&<motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1}} style={{textAlign:"center",padding:"30px 0 20px"}} onClick={()=>setEntryDone(true)}>
      <motion.div animate={{scale:[1,1.06,1],opacity:[.7,1,.7]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}}>
        <svg width="48" height="48" viewBox="0 0 52 52" style={{margin:"0 auto 16px",display:"block"}}><circle cx="26" cy="26" r="22" fill="none" stroke={ac} strokeWidth="1.5" opacity=".3"/><circle cx="26" cy="26" r="15" fill="none" stroke={ac} strokeWidth="1" strokeDasharray="4 4" style={{animation:"innerRing 6s linear infinite"}}/><circle cx="26" cy="26" r="4" fill={ac} opacity=".3"/></svg>
      </motion.div>
      <div style={{fontSize:14,fontWeight:300,color:t2,lineHeight:1.7,maxWidth:300,margin:"0 auto"}}>{daily.phrase}</div>
      <div style={{fontSize:10,color:t3,marginTop:16,fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>TOCA PARA CONTINUAR</div>
    </motion.div>}

    {(entryDone||st.totalSessions===0||ts!=="idle")&&<>
    {/* Streak Shield (replaces simple streak warning) */}
    {ts==="idle"&&<StreakShield st={st} isDark={isDark} onQuickSession={()=>{setDurMult(0.5);const calmP=P.find(p=>p.int==="calma"&&p.dif===1)||P[0];setPr(calmP);setSec(Math.round(calmP.d*0.5));go();}} onFreezeStreak={()=>{const r=store.freezeStreak();if(r.ok){setSt_(useStore.getState());announce(`Racha congelada honestamente. Te quedan ${r.remaining} pausas este mes.`,"polite");}else{announce(r.reason==="already_today"?"Ya usaste tu pausa hoy.":"Agotaste tus pausas del mes.","polite");}}}/>}

    {/* Cognitive Load indicator (NEW) */}
    {ts==="idle"&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:`${space[2.5]}px ${space[4]}px`,marginBottom:space[3],background:surface,borderRadius:radius.md}}>
      <div style={{display:"flex",alignItems:"center",gap:space[1.5]}}>
        <div style={{width:24,height:24,borderRadius:7,background:withAlpha(ac,6),display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="bolt" size={11} color={ac}/></div>
        <span style={{...ty.body(t1),fontWeight:font.weight.semibold}}>{st.todaySessions||0} de {st.sessionGoal||2} sesiones hoy</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:space[1.5]}}>
        <div style={{display:"flex",alignItems:"center",gap:3}}><Icon name="gauge" size={10} color={cogLoad.color}/><span style={ty.caption(cogLoad.color)}>{cogLoad.level}</span></div>
        <div style={{width:40,height:5,borderRadius:radius.sm/2,background:bd,overflow:"hidden"}}>
          <div style={{width:Math.min(100,(st.todaySessions||0)/(st.sessionGoal||2)*100)+"%",height:"100%",background:ac,borderRadius:radius.sm/2,transition:"width .3s"}}/>
        </div>
      </div>
    </div>}

    {/* Readiness Score — bioneural composite */}
    {ts==="idle"&&<ReadinessScore st={st} isDark={isDark} onOpenHRV={()=>setShowHRV(true)}/>}

    {/* Bioneural quick actions — evidence-based rescue protocols */}
    {ts==="idle"&&<div style={{display:"flex",gap:6,marginBottom:14}}>
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowSigh(true);H("tap");}} aria-label="Suspiro fisiológico, 60 segundos" style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <Icon name="calm" size={14} color="#059669"/>
        <span style={{fontSize:9,fontWeight:700,color:t1,letterSpacing:1,textTransform:"uppercase"}}>Suspiro</span>
        <span style={{fontSize:8,color:t3}}>60s · calma</span>
      </motion.button>
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowHRV(true);H("tap");}} aria-label="Medir HRV con sensor Bluetooth" style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <Icon name="predict" size={14} color="#6366F1"/>
        <span style={{fontSize:9,fontWeight:700,color:t1,letterSpacing:1,textTransform:"uppercase"}}>HRV</span>
        <span style={{fontSize:8,color:t3}}>5 min · BLE</span>
      </motion.button>
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowNSDR(true);H("tap");}} aria-label="NSDR Yoga Nidra, 10 minutos" style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <Icon name="mind" size={14} color="#0D9488"/>
        <span style={{fontSize:9,fontWeight:700,color:t1,letterSpacing:1,textTransform:"uppercase"}}>NSDR</span>
        <span style={{fontSize:8,color:t3}}>10 min · reset</span>
      </motion.button>
    </div>}

    {/* Daily Ignición with AI reasoning */}
    {ts==="idle"&&<motion.button whileTap={{scale:.97}} onClick={()=>sp(daily.proto)} style={{width:"100%",padding:"16px 14px",marginBottom:14,borderRadius:18,border:`1.5px solid ${daily.proto.cl}20`,background:`linear-gradient(135deg,${daily.proto.cl}06,${daily.proto.cl}02)`,cursor:"pointer",textAlign:"left",display:"flex",gap:12,alignItems:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:daily.proto.cl+"08"}}/>
      <div style={{width:44,height:44,borderRadius:13,background:daily.proto.cl+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:daily.proto.cl,flexShrink:0,border:`1px solid ${daily.proto.cl}15`}}>{daily.proto.tg}</div>
      <div style={{flex:1,position:"relative",zIndex:1}}>
        <div style={{...ty.label(daily.proto.cl),marginBottom:2}}>IGNICIÓN DEL DÍA</div>
        <div style={{...ty.title(t1),fontWeight:font.weight.black}}>{daily.proto.n}</div>
        <div style={{...ty.caption(t3),marginTop:2,fontStyle:"italic",lineHeight:font.leading.snug}}>{daily.phrase}</div>
      </div>
      <Icon name="bolt" size={16} color={daily.proto.cl}/>
    </motion.button>}

    {/* AI Recommendation — inline compact */}
    {ts==="idle"&&aiRec&&aiRec.primary&&aiRec.primary.protocol.id!==daily.proto.id&&<motion.button initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} whileTap={{scale:.97}} onClick={()=>sp(aiRec.primary.protocol)} style={{width:"100%",padding:"10px 14px",marginBottom:10,borderRadius:14,border:`1.5px solid ${ac}15`,background:isDark?"#0A1A0A":"#F0FDF4",cursor:"pointer",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
      <div style={{width:28,height:28,borderRadius:8,background:ac+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="cpu" size={13} color={ac}/></div>
      <div style={{flex:1}}><div style={{...ty.caption(ac),fontWeight:font.weight.bold}}>IA: {aiRec.primary.protocol.n}</div><div style={ty.caption(t3)}>{aiRec.primary.reason}</div></div>
      <Icon name="chevron" size={12} color={ac}/>
    </motion.button>}

    {/* Expandable secondary section */}
    {ts==="idle"&&(prediction||(st.progDay||0)<7)&&<>
    <button onClick={()=>{setShowMore(!showMore);H("tap");}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"6px 0",marginBottom:showMore?10:14,background:"none",border:"none",cursor:"pointer"}}>
      <div style={{flex:1,height:1,background:bd}}/>
      <span style={{fontSize:10,fontWeight:700,color:t3,display:"flex",alignItems:"center",gap:4,flexShrink:0}}>{showMore?"Menos":"Más"} <span style={{transform:showMore?"rotate(180deg)":"rotate(0)",display:"inline-block",transition:"transform .2s"}}>▾</span></span>
      <div style={{flex:1,height:1,background:bd}}/>
    </button>
    <AnimatePresence>
    {showMore&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
      {/* Prediction */}
      {prediction&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",marginBottom:10,background:prediction.predictedDelta>0?(isDark?"#0A1A0A":"#F0FDF4"):(isDark?"#1A1E28":"#F8FAFC"),borderRadius:14,border:`1px solid ${prediction.predictedDelta>0?"#05966920":bd}`}}>
        <Icon name="predict" size={14} color={prediction.predictedDelta>0?"#059669":"#6366F1"}/>
        <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:prediction.predictedDelta>0?"#059669":"#6366F1"}}>{prediction.message}</div><div style={{fontSize:10,color:t3,marginTop:1}}>Confianza: {prediction.confidence}%</div></div>
      </div>}
      {/* 7-Day Program */}
      {(st.progDay||0)<7&&<div style={{marginBottom:10,background:cd,borderRadius:16,padding:"12px",border:`1px solid ${bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:ac,textTransform:"uppercase"}}>Programa 7 Días</div>
          <span style={{fontSize:10,fontWeight:800,color:t1}}>Día {Math.min((st.progDay||0)+1,7)}/7</span>
        </div>
        <div style={{display:"flex",gap:3,marginBottom:10}}>
          {PROG_7.map((p,i)=>{const done=i<(st.progDay||0);const curr=i===(st.progDay||0);return<div key={i} style={{flex:1,height:4,borderRadius:2,background:done?ac:curr?ac+"50":bd,transition:"background .5s"}}/>;})}</div>
        <motion.button whileTap={{scale:.97}} onClick={()=>{const p=P.find(x=>x.id===progStep.pid);if(p)sp(p);}} style={{width:"100%",padding:"10px",borderRadius:12,border:`1px solid ${bd}`,background:isDark?"#1A1E28":"#F8FAFC",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={12} color={ac}/></div>
          <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:11,fontWeight:700,color:t1}}>{progStep.t}</div><div style={{fontSize:10,color:t3}}>{progStep.d}</div></div>
          <Icon name="chevron" size={12} color={ac}/>
        </motion.button>
      </div>}
    </motion.div>}
    </AnimatePresence>
    </>}

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:nSt.color,animation:"shimDot 2s ease infinite"}}/><span style={{fontSize:10,fontWeight:700,color:nSt.color}}>{nSt.label}</span></div>
      <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:10,fontWeight:700,color:lv.c}}>{lv.n}</span><div style={{width:36,height:3,borderRadius:2,background:bd,overflow:"hidden"}}><div style={{width:lPct+"%",height:"100%",borderRadius:2,background:lv.c}}/></div></div>
    </div>
    <div style={{display:"flex",gap:7,marginBottom:16}}>
      <motion.button whileTap={{scale:.96}} onClick={()=>setSl(true)} style={{flex:1,padding:"10px 12px",borderRadius:15,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",gap:9}}>
        <motion.div layoutId={sl||reducedMotion?undefined:`proto-glyph-${pr.id}`} transition={{type:"spring",stiffness:360,damping:32}} style={{width:32,height:32,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:ac}}>{pr.tg}</motion.div>
        <div style={{flex:1,textAlign:"left"}}><div style={{fontWeight:700,fontSize:11,color:t1}}>{pr.n}</div><div style={{fontSize:10,color:t3}}>{pr.ph.length} fases</div></div>
        <Icon name="chevron-down" size={12} color={t3}/>
      </motion.button>
      <motion.button whileTap={{scale:.93}} onClick={()=>setShowProtoDetail(true)} style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}} title="Ver detalle"><Icon name="info" size={16} color={t3}/></motion.button>
      <motion.button whileTap={{scale:.93}} onClick={()=>setShowIntent(true)} style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="target" size={18} color={t3}/></motion.button>
    </div>

    {/* Duration selector */}
    {ts==="idle"&&<div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:16}}>
      {[{v:.5,l:"60s"},{v:1,l:"120s"},{v:1.5,l:"180s"}].map(d=>(
        <motion.button key={d.v} whileTap={{scale:.93}} onClick={()=>{setDurMult(d.v);setSec(Math.round(pr.d*d.v));H("tap");}} style={{padding:"6px 16px",borderRadius:20,border:durMult===d.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:durMult===d.v?ac+"08":cd,color:durMult===d.v?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>{d.l}</motion.button>
      ))}
    </div>}

    {/* Pre-session mood */}
    {ts==="idle"&&<div style={{marginBottom:16}}>
      <div style={{fontSize:10,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>¿Cómo llegas a esta sesión?</div>
      <div style={{display:"flex",gap:4}}>{MOODS.map(m=>(
        <motion.button key={m.id} whileTap={{scale:.9}} onClick={()=>{setPreMood(m.value);H("tap");}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"7px 2px",borderRadius:11,border:preMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:preMood===m.value?m.color+"0A":cd,cursor:"pointer",transition:"all .2s"}}>
          <Icon name={m.icon} size={16} color={preMood===m.value?m.color:t3}/>
          <span style={{fontSize:10,fontWeight:700,color:preMood===m.value?m.color:t3,lineHeight:1.1,textAlign:"center"}}>{m.label}</span>
        </motion.button>))}</div>
    </div>}

    {/* ═══ CORE DE IGNICIÓN — unificado: timer + respiración + fase en un solo foco ═══ */}
    <div onClick={timerTap} role="button" tabIndex={0} aria-label={ts==="idle"?`Iniciar sesión de ${pr.n}, duración ${sec} segundos`:ts==="running"?`Pausar sesión. Fase ${ph.l}, ${sec} segundos restantes`:`Reanudar sesión. ${sec} segundos restantes`} aria-pressed={ts==="running"} onKeyDown={onTimerKey} onMouseDown={()=>setTp(true)} onMouseUp={()=>setTp(false)} onMouseLeave={()=>setTp(false)} onTouchStart={()=>setTp(true)} onTouchEnd={()=>setTp(false)} style={{position:"relative",width:isActive?240:250,height:isActive?240:250,margin:"4px auto 18px",cursor:"pointer",transform:tp?"scale(0.93)":"scale(1)",transition:reducedMotion?"none":"all .6s cubic-bezier(.34,1.56,.64,1)",userSelect:"none"}}>
      {/* Glow exterior — respira con bS cuando hay fase de respiración */}
      <motion.div aria-hidden="true" animate={isBr&&!reducedMotion?{scale:bS,opacity:.55}:ts==="idle"?{scale:[1,1.06,1],opacity:[.3,.6,.3]}:isActive?{scale:[1,1.04,1],opacity:[.4,.7,.4]}:{}} transition={isBr&&!reducedMotion?{scale:{type:"spring",stiffness:30,damping:20,mass:1.2},opacity:{duration:.6}}:{duration:ts==="idle"?3.5:2.5,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",inset:isActive?-22:-10,borderRadius:"50%",background:`radial-gradient(circle,${ac}${isActive?"14":"08"},transparent 65%)`,filter:"blur(8px)",pointerEvents:"none"}}/>
      {/* Anillo exterior — respira con bS cuando hay fase de respiración */}
      {ts!=="paused"&&<motion.div aria-hidden="true" animate={isBr&&!reducedMotion?{scale:bS}:{scale:[1,1.02,1]}} transition={isBr&&!reducedMotion?{type:"spring",stiffness:30,damping:20,mass:1.2}:{duration:5,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",inset:isActive?-10:-4,borderRadius:"50%",border:`1.5px solid ${ac}${isActive?"22":"0A"}`,pointerEvents:"none"}}/>}
      {/* Halo interior de respiración (absorbe BreathOrb) */}
      {isActive&&!reducedMotion&&<motion.div aria-hidden="true" animate={isBr?{scale:bS*0.92,opacity:.55}:{scale:[.94,1,.94],opacity:[.25,.45,.25]}} transition={isBr?{scale:{type:"spring",stiffness:30,damping:20,mass:1.2},opacity:{duration:.6}}:{duration:3,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",inset:"20%",borderRadius:"50%",background:`radial-gradient(circle,${ac}22,${ac}08,transparent 72%)`,pointerEvents:"none"}}/>}
      <svg width={isActive?"240":"250"} height={isActive?"240":"250"} viewBox="0 0 260 260" style={{transform:"rotate(-90deg)"}}>
        {/* Track */}
        <circle cx="130" cy="130" r="116" fill="none" stroke={bd} strokeWidth={ts==="idle"?"4":"3"} opacity=".4"/>
        {/* Progreso */}
        <circle cx="130" cy="130" r="116" fill="none" stroke={ac} strokeWidth={isActive?"7":ts==="idle"?"5":"3"} strokeLinecap="round" strokeDasharray={CI} strokeDashoffset={ts==="idle"?0:dO} style={{transition:isActive?"stroke-dashoffset .95s linear":"stroke-dashoffset .3s ease",filter:isActive?`drop-shadow(0 0 8px ${ac}60)`:`drop-shadow(0 0 4px ${ac}30)`}}/>
        {/* Anillo interior */}
        <circle cx="130" cy="130" r="98" fill="none" stroke={bd} strokeWidth=".5" strokeDasharray="3 8" style={{animation:isActive?"innerRing 10s linear infinite":"innerRing 30s linear infinite"}}/>
        {/* Gradiente de fondo sutil en idle */}
        {ts==="idle"&&<circle cx="130" cy="130" r="115" fill={`url(#timerGrad)`} opacity=".04"/>}
        <defs><radialGradient id="timerGrad"><stop offset="0%" stopColor={ac}/><stop offset="100%" stopColor="transparent"/></radialGradient></defs>
      </svg>
      {/* Punto central neural */}
      <motion.div aria-hidden="true" animate={{opacity:[.3,.7,.3],boxShadow:[`0 0 8px ${ac}30`,`0 0 18px ${ac}50`,`0 0 8px ${ac}30`]}} transition={{duration:ts==="idle"?3:1.5,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:isActive?4:10,height:isActive?4:10,borderRadius:"50%",background:ac,pointerEvents:"none"}}/>
      {/* Contenido central — jerarquía única: chip de fase · countdown · progreso · respiración */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",zIndex:2,width:"88%",display:"flex",flexDirection:"column",alignItems:"center"}}>
        {isActive&&<motion.div key={pi} initial={reducedMotion?{opacity:1}:{opacity:0,y:-4}} animate={{opacity:1,y:0}} transition={{duration:reducedMotion?0:.35}} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:99,background:ac+"14",marginBottom:6}}>
          <Icon name={ph.ic} size={9} color={ac} aria-hidden="true"/>
          <span aria-hidden="true" style={{fontSize:9,fontWeight:800,color:ac,letterSpacing:1.5,textTransform:"uppercase"}}>Fase {pi+1}/{pr.ph.length} · {ph.l}</span>
        </motion.div>}
        <div style={{...ty.biometric(t1,isActive?font.size.hero:56),lineHeight:font.leading.none,letterSpacing:"-2px",textShadow:isActive?`0 0 20px ${ac}15`:"none"}}>{sec}</div>
        {isActive&&<div style={{fontSize:10,fontWeight:800,color:ac,marginTop:4,opacity:.75,letterSpacing:2}}>{sessPct}%</div>}
        <AnimatePresence mode="wait">
          {isBr&&bL&&<motion.div key={bL} initial={reducedMotion?{opacity:1}:{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={reducedMotion?{opacity:0}:{opacity:0,y:-6}} transition={{duration:reducedMotion?0:.3}} style={{marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <span aria-hidden="true" style={{fontSize:11,fontWeight:800,letterSpacing:4,color:ac,opacity:.9,textTransform:"uppercase"}}>{bL}</span>
            <span aria-hidden="true" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minWidth:22,height:18,padding:"0 6px",borderRadius:9,background:ac+"18",fontSize:11,fontWeight:800,color:ac}}>{bCnt}s</span>
          </motion.div>}
        </AnimatePresence>
        {ts==="idle"&&<>
          <div style={{...ty.label(t3),fontWeight:font.weight.semibold,marginTop:space[1.5]}}>segundos</div>
          <motion.div animate={{opacity:[.5,1,.5],y:[0,-2,0]}} transition={{duration:2.5,repeat:Infinity,ease:"easeInOut"}} style={{marginTop:12,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${ac},#0D9488)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 14px ${ac}35`}}><Icon name="bolt" size={16} color="#fff"/></div>
            <span style={ty.label(ac)}>INICIAR</span>
          </motion.div>
        </>}
        {ts==="paused"&&<motion.div animate={{opacity:[.5,1,.5]}} transition={{duration:2,repeat:Infinity}} style={{marginTop:6}}><span style={{fontSize:11,fontWeight:800,color:ac,letterSpacing:3}}>EN PAUSA</span></motion.div>}
      </div>
      {tp&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"100%",height:"100%",borderRadius:"50%",border:`2px solid ${ac}20`,animation:"cdPulse .6s ease forwards",pointerEvents:"none"}}/>}
    </div>

    {/* Phase info — solo en preview (idle); durante sesión activa la fase vive dentro del core */}
    {!isActive&&<div style={{textAlign:"center",marginBottom:10}}><div style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name={ph.ic} size={13} color={ac}/><span style={{fontSize:14,fontWeight:800,color:t1}}>{ph.l}</span></div><div style={{fontSize:10,color:t3,marginTop:2}}>{ph.r}</div></div>}
    <motion.div key={pi} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{duration:.3}} style={{background:cd,borderRadius:16,padding:"16px",marginBottom:10,border:`1px solid ${bd}`}}>
      {isActive&&<div aria-hidden="true" style={{height:3,borderRadius:2,background:bd,overflow:"hidden",marginBottom:12}}><div style={{width:`${Math.round((pi+1)/pr.ph.length*100)}%`,height:"100%",background:`linear-gradient(90deg,${ac}60,${ac})`,transition:"width .3s ease"}}/></div>}
      {ph.k&&<div style={{fontSize:15,fontWeight:800,color:t1,lineHeight:1.45,marginBottom:8,letterSpacing:"-0.2px"}}>{ph.k}</div>}
      <p style={{fontSize:12,lineHeight:1.7,color:t2,margin:0}}>{ph.i}</p>

      {/* Anti-trampa checkpoints */}
      {isActive&&(()=>{
        const elapsed=totalDur-sec;
        const cp1=Math.round(totalDur*0.25),cp2=Math.round(totalDur*0.50),cp3=Math.round(totalDur*0.78);
        const isCP1=elapsed>=cp1&&elapsed<cp1+10;const isCP2=elapsed>=cp2&&elapsed<cp2+10;const isCP3=elapsed>=cp3&&elapsed<cp3+10;
        if(!isCP1&&!isCP2&&!isCP3)return null;
        if(elapsed===cp1)speak("Mantén presionado",circadian,voiceOn);
        else if(elapsed===cp2)speak("Toca al exhalar",circadian,voiceOn);
        else if(elapsed===cp3)speak("Confirma tu presencia",circadian,voiceOn);

        if(isCP1)return(<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{marginTop:12}}><button
          onTouchStart={e=>{e.currentTarget.dataset.holdStart=Date.now();e.currentTarget.style.transform="scale(0.94)";hapticBreath("INHALA");const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar){bar.style.transition="width 2.5s linear";bar.style.width="100%";}}}
          onTouchEnd={e=>{const dur=Date.now()-(+e.currentTarget.dataset.holdStart||Date.now());e.currentTarget.style.transform="scale(1)";const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar){bar.style.transition="none";bar.style.width="0%";}
            if(dur>=2000){setSessionData(d=>({...d,touchHolds:(d.touchHolds||0)+1,interactions:(d.interactions||0)+1,reactionTimes:[...(d.reactionTimes||[]),dur]}));H("ok");speak("verificado",circadian,voiceOn);}
            else{setSessionData(d=>({...d,interactions:(d.interactions||0)+0.3}));H("tap");}}}
          onMouseDown={e=>{e.currentTarget.dataset.holdStart=Date.now();e.currentTarget.style.transform="scale(0.94)";const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar){bar.style.transition="width 2.5s linear";bar.style.width="100%";}}}
          onMouseUp={e=>{const dur=Date.now()-(+e.currentTarget.dataset.holdStart||Date.now());e.currentTarget.style.transform="scale(1)";const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar){bar.style.transition="none";bar.style.width="0%";}
            if(dur>=2000){setSessionData(d=>({...d,touchHolds:(d.touchHolds||0)+1,interactions:(d.interactions||0)+1,reactionTimes:[...(d.reactionTimes||[]),dur]}));H("ok");}
            else{setSessionData(d=>({...d,interactions:(d.interactions||0)+0.3}));H("tap");}}}
          style={{width:"100%",padding:"14px 16px",borderRadius:16,border:`2px solid ${ac}25`,background:ac+"06",cursor:"pointer",display:"flex",flexDirection:"column",gap:8,transition:"all .3s",position:"relative",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><div style={{width:10,height:10,borderRadius:"50%",background:ac,opacity:.7,animation:"pu 1s ease infinite"}}/><span style={{fontSize:13,fontWeight:700,color:ac}}>Mantén presionado 2s</span></div>
          <div style={{height:4,background:bd,borderRadius:4,overflow:"hidden",width:"100%"}}><div data-hold-bar="" style={{width:"0%",height:"100%",background:`linear-gradient(90deg,${ac}60,${ac})`,borderRadius:4}}/></div>
        </button></motion.div>);
        if(isCP2)return(<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{marginTop:12}}><button
          onClick={()=>{const isExhale=bL==="EXHALA"||bL==="SOSTÉN";setSessionData(d=>({...d,interactions:(d.interactions||0)+(isExhale?1:0.7),reactionTimes:[...(d.reactionTimes||[]),Date.now()%1000]}));H("tap");if(isExhale)speak("sincronizado",circadian,voiceOn);}}
          style={{width:"100%",padding:"14px 16px",borderRadius:16,border:`1.5px dashed ${ac}35`,background:ac+"06",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:bL==="EXHALA"?ac:"transparent",border:`2px solid ${ac}`,opacity:.6}}/><span style={{fontSize:13,fontWeight:700,color:ac}}>Toca al exhalar</span>
          {bL==="EXHALA"&&<span style={{fontSize:11,fontWeight:800,color:ac}}>AHORA</span>}
        </button></motion.div>);
        return(<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{marginTop:12}}><button
          onClick={()=>{setSessionData(d=>({...d,interactions:(d.interactions||0)+1,reactionTimes:[...(d.reactionTimes||[]),Date.now()%1000]}));H("tap");speak("confirmado",circadian,voiceOn);}}
          style={{width:"100%",padding:"14px 16px",borderRadius:16,border:`1.5px solid ${ac}20`,background:ac+"04",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:ac,opacity:.5}}/><span style={{fontSize:13,fontWeight:700,color:ac}}>Confirma tu presencia</span>
        </button></motion.div>);
      })()}

      {/* Science */}
      <button onClick={()=>{setShowScience(!showScience);}} style={{display:"flex",alignItems:"center",gap:5,marginTop:12,padding:"6px 0",background:"none",border:"none",cursor:"pointer"}}>
        <Icon name="mind" size={11} color={ac}/><span style={{fontSize:10,color:ac,fontWeight:700}}>NEUROCIENCIA</span>
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

    {isActive&&nextPh&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",marginBottom:10,borderRadius:10,background:isDark?"#1A1E28":"#F8FAFC"}}>
      <Icon name="chevron" size={10} color={t3}/><span style={{fontSize:10,color:t3,fontWeight:600}}>Siguiente: {nextPh.l}</span>
    </div>}
    <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>{pr.ph.map((p,i)=>{const sR=durMult!==1?Math.round(p.s*durMult)+"–"+Math.round(p.e*durMult)+"s":p.r;const isCurr=pi===i;const isDone=i<pi;return<motion.div key={i} animate={isCurr?{scale:[1,1.03,1]}:{}} transition={isCurr?{duration:2,repeat:Infinity}:{}} style={{padding:"4px 10px",borderRadius:16,border:isCurr?`2px solid ${ac}`:isDone?`1.5px solid ${ac}30`:`1px solid ${bd}`,background:isCurr?ac+"10":isDone?ac+"06":cd,color:isCurr?ac:isDone?ac:t3,fontSize:10,fontWeight:isCurr?800:600,display:"flex",alignItems:"center",gap:4,opacity:i<=pi?1:.4,boxShadow:isCurr?`0 2px 8px ${ac}15`:"none",transition:"all .3s"}}><span style={{width:isCurr?7:5,height:isCurr?7:5,borderRadius:"50%",background:isDone?ac:isCurr?ac:bd,transition:"all .3s",boxShadow:isCurr?`0 0 6px ${ac}40`:"none"}}/>{isCurr&&<Icon name={p.ic} size={10} color={ac}/>}{sR}</motion.div>;})}</div>
    <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center"}}>
      {ts==="idle"&&<motion.button whileTap={{scale:.95}} onClick={go} style={{flex:1,maxWidth:260,padding:"14px 0",borderRadius:50,background:`linear-gradient(135deg,${ac},#0D9488)`,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2.5,display:"flex",alignItems:"center",justifyContent:"center",gap:7,textTransform:"uppercase",boxShadow:`0 4px 18px ${ac}28`}}><Icon name="bolt" size={13} color="#fff"/>INICIAR</motion.button>}
      {ts==="running"&&<><motion.button whileTap={{scale:.95}} onClick={pa} style={{flex:1,maxWidth:180,padding:"12px 0",borderRadius:50,background:cd,border:`2px solid ${ac}`,color:ac,fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>PAUSAR</motion.button><motion.button whileTap={{scale:.9}} onClick={rs} style={{width:42,height:42,borderRadius:"50%",border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="reset" size={15} color={t3}/></motion.button></>}
      {ts==="paused"&&<><motion.button whileTap={{scale:.95}} onClick={()=>{if(pauseTRef.current)clearTimeout(pauseTRef.current);setTs("running");H("go");speakNow("continúa",circadian,voiceOn);requestWakeLock();if(st.soundOn!==false)startBinaural(pr.int);}} style={{flex:1,maxWidth:180,padding:"12px 0",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>CONTINUAR</motion.button><motion.button whileTap={{scale:.9}} onClick={rs} style={{width:42,height:42,borderRadius:"50%",border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="reset" size={15} color={t3}/></motion.button></>}
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
    return <aside role="group" aria-label="Métricas neurales en tiempo real" style={{position:"fixed",bottom:layout.bottomNav,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 32px)",maxWidth:400,padding:`${space[2]}px ${space[4]}px`,background:`linear-gradient(180deg, ${vitalTint}${barAlpha}, ${vitalTint}00), ${resolveTheme(isDark).glass}`,backdropFilter:"blur(16px)",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:z.sticky,borderRadius:radius.lg,border:`1px solid ${neural>=70?bioSignal.phosphorCyan+"22":bd}`,boxShadow:`0 4px 20px ${isDark?"rgba(0,0,0,.3)":"rgba(0,0,0,.06)"}${neural>=70?`, 0 0 28px ${bioSignal.phosphorCyan}14`:""}`,transition:"background .8s ease, border-color .8s ease, box-shadow .8s ease"}}>
      {[{v:st.coherencia,l:"Enfoque",d:rD.c,c:"#3B82F6",ic:"focus"},{v:st.resiliencia,l:"Calma",d:rD.r,c:"#8B5CF6",ic:"calm"},{v:st.capacidad,l:"Energía",d:0,c:"#6366F1",ic:"energy"}].map((m,i)=><div key={i} role="group" aria-label={`${m.l}: ${m.v}%${m.d>0?`, +${m.d} esta semana`:""}`} style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"center"}}>
        <div aria-hidden="true" style={{width:28,height:28,borderRadius:8,background:m.c+"10",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={m.ic} size={12} color={m.c}/></div>
        <div><div style={{...ty.biometric(m.c,font.size.md),lineHeight:font.leading.none}}>{m.v}%</div><div style={{fontSize:font.size.xs,color:t3,fontWeight:font.weight.semibold,display:"flex",alignItems:"center",gap:2}}>{m.l}{m.d>0&&<span style={{color:semantic.success,fontWeight:font.weight.bold}}>+{m.d}</span>}</div></div>
      </div>)}
    </aside>;
  })()}

  {/* ═══ BOTTOM NAV ═══ */}
  <nav role="tablist" aria-label="Navegación principal" aria-hidden={ts==="running"?"true":undefined} style={{position:"fixed",bottom:0,left:"50%",transform:`translateX(-50%) translateY(${ts==="running"?"72px":"0"})`,width:"100%",maxWidth:rootMaxWidth,background:resolveTheme(isDark).overlay,backdropFilter:"blur(20px)",borderTop:`1px solid ${bd}`,padding:`6px ${space[4]}px max(10px, env(safe-area-inset-bottom))`,display:"flex",justifyContent:"center",gap:space[1],zIndex:z.nav,opacity:ts==="running"?0:1,pointerEvents:ts==="running"?"none":"auto",transition:reducedMotion?"none":"transform .45s cubic-bezier(.16,1,.3,1), opacity .35s ease"}}>
    {[{id:"ignicion",lb:"Ignición",ic:"bolt",ac:ac},{id:"dashboard",lb:"Dashboard",ic:"chart",ac:"#6366F1"},{id:"perfil",lb:"Perfil",ic:"user",ac:t1}].map((t,order)=>{const a=tab===t.id;return(<motion.button key={t.id} role="tab" aria-selected={a} aria-controls={`tab-${t.id}-panel`} id={`tab-${t.id}`} tabIndex={ts==="running"?-1:(a?0:-1)} onKeyDown={e=>onTabKey(e,t.id,order)} whileTap={reducedMotion?{}:{scale:.92}} onClick={()=>switchTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0 4px",border:"none",background:"transparent",borderRadius:14,position:"relative",minHeight:48}}>
      {a&&<motion.div layoutId="navIndicator" aria-hidden="true" style={{position:"absolute",top:0,left:"20%",right:"20%",height:3,borderRadius:"0 0 3px 3px",background:t.ac}} transition={reducedMotion?{duration:0}:{type:"spring",stiffness:400,damping:30}}/>}
      <motion.div aria-hidden="true" animate={reducedMotion?{}:{scale:a?1:0.9,y:a?-1:0}} transition={reducedMotion?{duration:0}:{type:"spring",stiffness:300,damping:20}} style={{width:32,height:32,borderRadius:10,background:a?t.ac+"12":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"}}>
        <Icon name={t.ic} size={a?19:17} color={a?t.ac:t3}/>
      </motion.div>
      <span style={{fontSize:font.size.sm,fontWeight:a?font.weight.black:font.weight.semibold,color:a?t.ac:t3,transition:"all .2s",letterSpacing:a?font.tracking.wide:font.tracking.normal}}>{t.lb}</span>
    </motion.button>);})}
  </nav>
  </div>);
}
