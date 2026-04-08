"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Ic } from "./Icons";
import { AN } from "./AnimatedNumber";
import { SK } from "./Sparkline";
import { PhaseVisual } from "./PhaseVisual";
import { StateOrbs } from "./StateOrbs";
import { StatusBadge } from "./StatusBadge";
import { MetricCard, MetricGrid, StatRow } from "./MetricCard";
import { SectionLabel } from "./SectionLabel";
import { TabBar, MetricsBar } from "./TabBar";
import { LoadingScreen } from "./LoadingScreen";
import { CountdownOverlay } from "./CountdownOverlay";
import { NeuralSummary } from "./NeuralSummary";
import { RingGauge, MiniRing } from "./RingGauge";
import { P, CATS, LVL, gL, lvPct, nxtLv, DN, DIF_LABELS } from "@/lib/protocols";
import { MOODS, ENERGY_LEVELS, WORK_TAGS, INTENTS, DS, SOUNDSCAPES, DAILY_PHRASES, PROG_7, SCIENCE_DEEP, AM, STATUS_MSGS, MID_MSGS, POST_MSGS, GREETINGS, getStatus, getWeekNum } from "@/lib/constants";
import { gAC, playChord, startAmbient, stopAmbient, hap, startSoundscape, stopSoundscape } from "@/lib/audio";
import { neuralIntelligence, startBinaural, stopBinaural, calcBioQuality, setupMotionDetection, calcBurnoutIndex, calcProtoSensitivity, calcBioSignal, calcNeuralFingerprint, calcCognitiveEntropy, estimateCoherence, hapticPhase, hapticBreath, detectGamingPattern, calcRecoveryIndex, getCircadian } from "@/lib/neural-engine";
import { ldS, svS, exportData } from "@/lib/storage";
import { exportNOM035 } from "@/lib/nom035";
import { getDailyIgn, genIns, smartSuggest, getRecords, groupHist } from "@/lib/utils";
import { useTheme } from "@/lib/useTheme";

/* Wake Lock — screen stays on during session */
let _wakeLock=null;
async function requestWakeLock(){try{if('wakeLock' in navigator){_wakeLock=await navigator.wakeLock.request('screen');}}catch(e){}}
function releaseWakeLock(){try{if(_wakeLock){_wakeLock.release();_wakeLock=null;}}catch(e){}}

export default function BioIgnicion(){
  const[mt,setMt]=useState(false);const[tab,setTab]=useState("ignicion");const[st,setSt_]=useState(DS);
  const[pr,setPr]=useState(P[12]);const[sc,setSc]=useState("Protocolo");const[sl,setSl]=useState(false);
  const[ts,setTs]=useState("idle");const[sec,setSec]=useState(120);const[pi,setPi]=useState(0);
  const[bL,setBL]=useState("");const[bS,setBS]=useState(1);const[bCnt,setBCnt]=useState(0);
  const[midMsg,setMidMsg]=useState("");const[showMid,setShowMid]=useState(false);
  const[tp,setTp]=useState(false);const[tabFade,setTabFade]=useState(1);
  const[postStep,setPostStep]=useState("none");
  const[postVC,setPostVC]=useState(0);const[postMsg,setPostMsg]=useState("");
  const[checkMood,setCheckMood]=useState(0);const[checkEnergy,setCheckEnergy]=useState(0);const[checkTag,setCheckTag]=useState("");
  const[preMood,setPreMood]=useState(0);
  const[countdown,setCountdown]=useState(0);
  const[compFlash,setCompFlash]=useState(false);
  const[showHist,setShowHist]=useState(false);const[showSettings,setShowSettings]=useState(false);
  const[onboard,setOnboard]=useState(false);const[showIntent,setShowIntent]=useState(false);
  const[greeting,setGreeting]=useState("");
  const[showScience,setShowScience]=useState(false);
  const[newAch,setNewAch]=useState(null);
  const[dashSections,setDashSections]=useState({metrics:false,activity:false,insights:false});
  const[neuralZone,setNeuralZone]=useState(null);
  const[selSS,setSelSS]=useState("off");
  const[durMult,setDurMult]=useState(()=>{
    try{
      const h=(typeof window!=="undefined"&&localStorage.getItem("bio-g2"))?JSON.parse(localStorage.getItem("bio-g2")):null;
      if(!h||!h.history||h.history.length<5)return 1;
      const durs=h.history.slice(-10).map(s=>s.dur);
      const avg=durs.reduce((a,b)=>a+b,0)/durs.length;
      if(avg<=70)return 0.5;
      if(avg>=150)return 1.5;
      return 1;
    }catch(e){return 1;}
  });
  const[entryDone,setEntryDone]=useState(false);
  const[nfcCtx,setNfcCtx]=useState(null); // {company,type:'entrada'|'salida',employee}
  const[voiceOn,setVoiceOn]=useState(true);
  const[sessionData,setSessionData]=useState({pauses:0,scienceViews:0,phaseTimings:[]});
  const iR=useRef(null);const bR=useRef(null);const tR=useRef(null);const cdR=useRef(null);

  const setSt=useCallback(v=>{const nv=typeof v==="function"?v(st):v;setSt_(nv);svS(nv);},[st]);

  // ═══ NFC/QR DEEP LINK READER ═══
  useEffect(()=>{if(typeof window==="undefined")return;try{const params=new URLSearchParams(window.location.search);const c=params.get("c"),t=params.get("t"),e=params.get("e");if(c||t){setNfcCtx({company:c||"",type:t||"entrada",employee:e||""});setEntryDone(true);
    const isExit=t==="salida"||t==="exit";const h=new Date().getHours();
    let pool=isExit?P.filter(p=>p.int==="calma"||p.int==="reset"):h<12?P.filter(p=>p.int==="energia"||p.int==="enfoque"):P.filter(p=>p.int==="enfoque"||p.int==="reset");
    const pick=pool[Math.floor(Math.random()*pool.length)]||P[0];setPr(pick);setSec(Math.round(pick.d*durMult));
  }}catch(e){};},[]);


  // ═══ VOICE SYSTEM — iOS-optimized ═══
  const voicesRef=useRef([]);const voiceUnlocked=useRef(false);const speakingRef=useRef(false);const lastSpokenRef=useRef("");const lastSpokenTimeRef=useRef(0);
  useEffect(()=>{if(typeof window==="undefined"||!window.speechSynthesis)return;function loadVoices(){voicesRef.current=window.speechSynthesis.getVoices();}loadVoices();window.speechSynthesis.addEventListener("voiceschanged",loadVoices);return()=>{try{window.speechSynthesis.removeEventListener("voiceschanged",loadVoices);}catch(e){}};},[]);
  function unlockVoice(){if(voiceUnlocked.current||typeof window==="undefined"||!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(" ");u.volume=0.01;u.lang="es-MX";window.speechSynthesis.speak(u);voiceUnlocked.current=true;}catch(e){}}
  
  function speak(text){
    if(!voiceOn||!text||typeof window==="undefined"||!window.speechSynthesis)return;
    try{
      // iOS anti-repeat: skip if same text spoken in last 3 seconds
      const now=Date.now();
      if(text===lastSpokenRef.current&&now-lastSpokenTimeRef.current<3000)return;
      // iOS anti-queue: cancel if already speaking (prevents pile-up)
      if(speakingRef.current){return;}
      // iOS resume fix
      if(window.speechSynthesis.paused)window.speechSynthesis.resume();
      const u=new SpeechSynthesisUtterance(text);
      u.lang="es-MX";u.rate=circadian.voiceRate||0.92;u.pitch=circadian.voicePitch||1.0;u.volume=0.8;
      const voices=voicesRef.current;
      const v=voices.find(v=>v.lang==="es-MX")||voices.find(v=>v.lang==="es-ES")||voices.find(v=>v.lang.startsWith("es"));
      if(v)u.voice=v;
      u.onstart=()=>{speakingRef.current=true;};
      u.onend=()=>{speakingRef.current=false;};
      u.onerror=()=>{speakingRef.current=false;};
      lastSpokenRef.current=text;lastSpokenTimeRef.current=now;
      // iOS 15+ fix: cancel before speak to clear ghost queue
      window.speechSynthesis.cancel();
      setTimeout(()=>{window.speechSynthesis.speak(u);},50);
    }catch(e){speakingRef.current=false;}
  }
  
  function speakNow(text){
    if(!voiceOn||!text||typeof window==="undefined"||!window.speechSynthesis)return;
    try{
      speakingRef.current=false;
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang="es-MX";u.rate=circadian.voiceRate||0.92;u.pitch=circadian.voicePitch||1.0;u.volume=0.85;
      const voices=voicesRef.current;
      const v=voices.find(v=>v.lang==="es-MX")||voices.find(v=>v.lang==="es-ES")||voices.find(v=>v.lang.startsWith("es"));
      if(v)u.voice=v;
      u.onstart=()=>{speakingRef.current=true;};
      u.onend=()=>{speakingRef.current=false;};
      u.onerror=()=>{speakingRef.current=false;};
      lastSpokenRef.current=text;lastSpokenTimeRef.current=Date.now();
      // iOS needs a tiny delay after cancel before new speak
      setTimeout(()=>{window.speechSynthesis.speak(u);},60);
    }catch(e){speakingRef.current=false;}
  }
  
  function stopVoice(){try{speakingRef.current=false;lastSpokenRef.current="";if(typeof window!=="undefined"&&window.speechSynthesis)window.speechSynthesis.cancel();}catch(e){}}
  
  // iOS Safari workaround: periodically resume speechSynthesis (it pauses itself after ~15s)
  useEffect(()=>{if(ts!=="running"||typeof window==="undefined"||!window.speechSynthesis)return;
    const iosKeepAlive=setInterval(()=>{if(window.speechSynthesis.paused)window.speechSynthesis.resume();},5000);
    return()=>clearInterval(iosKeepAlive);
  },[ts]);


    // ═══ LOAD STATE + PERSISTENCE ═══
  useEffect(()=>{setMt(true);const l=ldS();const cw=getWeekNum();let mod=false;if(l.weekNum!==null&&l.weekNum!==cw){l.prevWeekData=[...l.weeklyData];l.weeklyData=[0,0,0,0,0,0,0];l.weekNum=cw;mod=true;}if(l.weekNum===null){l.weekNum=cw;mod=true;}setSt_(l);if(mod)svS(l);if(l.totalSessions===0)setOnboard(true);else setGreeting(GREETINGS[Math.floor(Math.random()*GREETINGS.length)]);},[]);
  
  // Pause session when user leaves tab/app
  useEffect(()=>{if(ts!=="running"||typeof document==="undefined")return;function onVis(){if(document.visibilityState==="hidden"&&ts==="running"){pa();}}document.addEventListener("visibilitychange",onVis);return()=>document.removeEventListener("visibilitychange",onVis);},[ts]);
// Auto-save every 30s + on page hide/unload
  useEffect(()=>{if(!mt||typeof window==="undefined")return;const save=()=>svS(st);const iv=setInterval(save,30000);const onHide=()=>{if(document.visibilityState==="hidden")svS(st);};window.addEventListener("beforeunload",save);window.addEventListener("pagehide",save);document.addEventListener("visibilitychange",onHide);return()=>{clearInterval(iv);window.removeEventListener("beforeunload",save);window.removeEventListener("pagehide",save);document.removeEventListener("visibilitychange",onHide);};},[mt,st]);
  const[isDark,setIsDark]=useState(false);
  useEffect(()=>{if(!mt)return;function ck(){const h=new Date().getHours();const m=st.themeMode||"auto";if(m==="dark")setIsDark(true);else if(m==="light")setIsDark(false);else setIsDark(h>=20||h<6);}ck();const iv=setInterval(ck,60000);return()=>clearInterval(iv);},[mt,st.themeMode]);
  const H=useCallback(t=>hap(t,st.soundOn,st.hapticOn),[st.soundOn,st.hapticOn]);

  // Soundscape + Binaural management
  const motionRef=useRef(null);const circadian=useMemo(()=>getCircadian(),[]);
  useEffect(()=>{if(ts==="running"&&st.soundOn!==false){const ss=st.soundscape||"off";if(ss!=="off")startSoundscape(ss);else startAmbient();startBinaural(pr.int);}else{stopAmbient();stopSoundscape();stopBinaural();}return()=>{stopAmbient();stopSoundscape();stopBinaural();};},[ts]);
  // Motion detection during session
  useEffect(()=>{if(ts==="running"){motionRef.current=setupMotionDetection(({samples,stability})=>{setSessionData(d=>({...d,motionSamples:samples,stability:stability}));});}return()=>{if(motionRef.current){motionRef.current.cleanup();motionRef.current=null;}};},[ts]);

  useEffect(()=>{if(ts==="running"){iR.current=setInterval(()=>{setSec(p=>{if(p<=1){clearInterval(iR.current);setTs("done");H("ok");return 0;}return p-1;});},1000);tR.current=setInterval(()=>{H("tick");try{svS(st);}catch(e){}},4000);}return()=>{if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);};},[ts]);
  // Phase transitions with pre-announcement (ease-in 2s before)
  useEffect(()=>{const totalDur=Math.round(pr.d*durMult);const el=totalDur-sec;const scale=durMult;let idx=0;for(let i=pr.ph.length-1;i>=0;i--){if(el>=Math.round(pr.ph[i].s*scale)){idx=i;break;}}
    // Pre-announce next phase 2s before transition
    if(idx!==pi){const nextIdx=idx;setPi(nextIdx);hapticPhase(pr.ph[nextIdx].ic);try{navigator.vibrate([30,50,30,50,80]);}catch(e){}speakNow("Fase "+(nextIdx+1)+" de "+pr.ph.length+". "+pr.ph[nextIdx].k);}
    // Pre-hint 2s before next phase
    const nxtIdx=pi<pr.ph.length-1?pi+1:null;if(nxtIdx!==null){const nxtStart=Math.round(pr.ph[nxtIdx].s*scale);const ttN=nxtStart-el;if(ttN===2&&ts==="running"){speak("Prepárate");}}
  },[sec,pr,durMult]);
  useEffect(()=>{if(ts==="running"&&sec===Math.round(totalDur/2)){setMidMsg(MID_MSGS[Math.floor(Math.random()*MID_MSGS.length)]);hapticBreath("INHALA");setShowMid(true);setTimeout(()=>setShowMid(false),3500);}if(ts==="running"&&sec===30){setMidMsg("Últimos 30. Cierra con todo.");setShowMid(true);setTimeout(()=>setShowMid(false),3000);}},[sec,ts]);
  useEffect(()=>{if(ts==="done"&&sec===0)comp();},[ts,sec]);
  // Breathing engine with circadian-adapted voice
  useEffect(()=>{if(bR.current)clearInterval(bR.current);const ph=pr.ph[pi];if(ts!=="running"){setBL("");setBS(1);setBCnt(0);return;}if(!ph.br){setBL("");setBS(1);setBCnt(0);const elapsed=totalDur-sec;if(elapsed>0&&elapsed%30===0&&ts==="running"){(()=>{const msgs=["Mantén la atención","Sigue con la práctica","Tu presencia importa","Respira y continúa"];speakNow(msgs[Math.floor(elapsed/30)%msgs.length]);})();}return;}const b=ph.br;const cy=b.in+(b.h1||0)+b.ex+(b.h2||0);let t=0;let lastLabel="";function tk(){const p=t%cy;let lbl="";if(p<b.in){lbl="INHALA";setBS(1+.25*(p/b.in));setBCnt(b.in-p);}else if(p<b.in+(b.h1||0)){lbl="MANTÉN";setBS(1.25);setBCnt(b.in+(b.h1||0)-p);}else if(p<b.in+(b.h1||0)+b.ex){const ep=p-b.in-(b.h1||0);lbl="EXHALA";setBS(1.25-.25*(ep/b.ex));setBCnt(b.ex-ep);}else{lbl="SOSTÉN";setBS(1);setBCnt(cy-p);}setBL(lbl);if(lbl!==lastLabel){if(lbl==="INHALA"&&t>0)speak("inhala");hapticBreath(lbl);lastLabel=lbl;}t++;}tk();bR.current=setInterval(tk,1000);return()=>{if(bR.current)clearInterval(bR.current);};},[ts,pi,pr]);

  function startCountdown(){setCountdown(3);H("tap");(()=>{const g=st.streak>=7?"Racha de "+st.streak+" días. ":st.todaySessions>0?"Sesión "+(st.todaySessions+1)+" de hoy. ":"";const p=circadian.period==="amanecer"||circadian.period==="mañana"?"Buenos días. ":circadian.period==="noche"||circadian.period==="madrugada"?"Buenas noches. ":"";speakNow(p+g+"Tres");})();cdR.current=setInterval(()=>{setCountdown(p=>{if(p<=1){clearInterval(cdR.current);setTs("running");H("go");speakNow(pr.ph[0].k||"Comienza");setGreeting("");return 0;}speakNow(p===2?"Dos":"Uno");H("tap");return p-1;});},1000);}
  function go(){unlockVoice();requestWakeLock();try{if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();}catch(e){}setPostStep("none");setSessionData({pauses:0,scienceViews:0,interactions:0,touchHolds:0,motionSamples:0,stability:0,reactionTimes:[],phaseTimings:[]});startCountdown();}
  const pauseTRef=useRef(null);
  function pa(){if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);setTs("paused");stopVoice();stopBinaural();releaseWakeLock();setSessionData(d=>({...d,pauses:d.pauses+1}));if(pauseTRef.current)clearTimeout(pauseTRef.current);pauseTRef.current=setTimeout(()=>{rs();},300000);}
  function rs(){releaseWakeLock();if(pauseTRef.current)clearTimeout(pauseTRef.current);try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}if(iR.current)clearInterval(iR.current);if(bR.current)clearInterval(bR.current);if(tR.current)clearInterval(tR.current);if(cdR.current)clearInterval(cdR.current);setTs("idle");setSec(Math.round(pr.d*durMult));setPi(0);setBL("");setBS(1);setBCnt(0);setShowMid(false);setPostStep("none");setCheckMood(0);setCheckEnergy(0);setCheckTag("");setPreMood(0);setCountdown(0);setCompFlash(false);stopVoice();}
  function sp(p){rs();setPr(p);setSl(false);setShowIntent(false);setSec(Math.round(p.d*durMult));setShowScience(false);}
  function timerTap(){unlockVoice();H("tap");if(ts==="idle"){go();}else if(ts==="running")pa();else if(ts==="paused"){if(pauseTRef.current)clearTimeout(pauseTRef.current);setSessionData(d=>({...d,pauses:d.pauses}));setTs("running");H("go");speakNow("continúa");requestWakeLock();if(st.soundOn!==false)startBinaural(pr.int);}}
  const tabSwitchRef=useRef(false);
  function switchTab(id){if(id===tab||tabSwitchRef.current)return;tabSwitchRef.current=true;setTabFade(0);setTimeout(()=>{setTab(id);setTimeout(()=>{setTabFade(1);tabSwitchRef.current=false;},30);},180);H("tap");}

  function comp(){if(pauseTRef.current)clearTimeout(pauseTRef.current);if(motionRef.current){motionRef.current.cleanup();motionRef.current=null;}
    const td=new Date().toDateString();const di=new Date().getDay();const ad=di===0?6:di-1;const nw=[...st.weeklyData];nw[ad]=(nw[ad]||0)+1;const ys=new Date(Date.now()-864e5).toDateString();const twoDaysAgo=new Date(Date.now()-172800000).toDateString();
    let nsk=st.lastDate===td?st.streak:st.lastDate===ys?st.streak+1:st.lastDate===twoDaysAgo?Math.max(1,st.streak):1;

    // ═══ DATA-DRIVEN METRICS (not random) ═══
    const ml=st.moodLog||[];const hist=st.history||[];
    // Coherencia: based on recent mood improvements (last 10 sessions with pre/post)
    const recentDeltas=ml.filter(m=>m.pre>0).slice(-10);
    const avgDelta=recentDeltas.length>=2?recentDeltas.reduce((a,m)=>a+(m.mood-m.pre),0)/recentDeltas.length:0;
    const cohBoost=Math.max(0,Math.min(8,Math.round(avgDelta*3+2)));
    const cohDecay=avgDelta<=0&&recentDeltas.length>=3?-3:0;
    const nC=Math.min(100,Math.max(20,recentDeltas.length>=3?Math.round(50+avgDelta*15+recentDeltas.length*2+cohDecay):st.coherencia+cohBoost+cohDecay));

    // Resiliencia: based on streak consistency and session frequency
    const weekTotal=nw.reduce((a,b)=>a+b,0);
    const consistencyScore=Math.min(7,weekTotal)/7;
    const streakBonus=Math.min(30,nsk)*0.5;
    const nR=Math.min(100,Math.max(20,Math.round(40+consistencyScore*30+streakBonus)));

    // Capacidad: based on protocol diversity and total experience
    const uniqueProtos=new Set([...hist.map(h=>h.p),pr.n]).size;
    const diversityScore=(uniqueProtos/14)*30;
    const expScore=Math.min(30,Math.sqrt(st.totalSessions||0)*3);
    const nE=Math.min(100,Math.max(20,Math.round(30+diversityScore+expScore)));

    const ns=st.totalSessions+1;
    // ═══ BIO QUALITY SCORE ═══
    const bioQ=calcBioQuality(sessionData,Math.round(pr.d*durMult));
    const gamingCheck=detectGamingPattern(hist);
    if(gamingCheck.gaming){bioQ.score=Math.min(bioQ.score,20);bioQ.quality="inválida";}
    const qualityMult=bioQ.quality==="alta"?1.5:bioQ.quality==="media"?1.0:bioQ.quality==="baja"?0.5:0.2;
    const eVC=Math.max(3,Math.round((5+(cohBoost*1.5)+(consistencyScore*5)+(uniqueProtos*0.5))*qualityMult));
    const vc=(st.vCores||0)+eVC;
    const ach=[...st.achievements];
    if(nsk>=7&&!ach.includes("streak7"))ach.push("streak7");
    if(nsk>=30&&!ach.includes("streak30"))ach.push("streak30");
    if(nC>=90&&!ach.includes("coherencia90"))ach.push("coherencia90");
    if(ns>=50&&!ach.includes("sessions50"))ach.push("sessions50");
    if(ns>=100&&!ach.includes("sessions100"))ach.push("sessions100");
    const totalT=(st.totalTime||0)+Math.round(pr.d*durMult);if(totalT>=3600&&!ach.includes("time60"))ach.push("time60");
    const hr=new Date().getHours();if(hr<7&&!ach.includes("earlyBird"))ach.push("earlyBird");
    if(hr>=22&&!ach.includes("nightOwl"))ach.push("nightOwl");
    const uP=new Set([...hist.map(h=>h.p),pr.n]);if(uP.size>=14&&!ach.includes("allProtos"))ach.push("allProtos");
    // ═══ EXPANDED DATA MODEL — Supabase-ready ═══
    const burnout=calcBurnoutIndex(ml,hist);
    const bioSignal=calcBioSignal(st);
    const newHist=[...hist,{
      p:pr.n,ts:Date.now(),vc:eVC,c:nC,r:nR,
      dur:Math.round(pr.d*durMult),ctx:nfcCtx?.type||"manual",
      bioQ:bioQ.score,quality:bioQ.quality,
      interactions:sessionData.interactions||0,
      motionSamples:sessionData.motionSamples||0,
      pauses:sessionData.pauses||0,
      burnoutIdx:burnout.index,
      circadian:circadian.period,
      bioSignal:bioSignal.score
    }].slice(-200);
    setPostVC(eVC);setPostMsg(POST_MSGS[Math.floor(Math.random()*POST_MSGS.length)]);
    releaseWakeLock();speakNow(bioQ.quality==="alta"?"Ignición completa. Tu sistema se transformó.":"Ignición completada.");
    setCompFlash(true);setTimeout(()=>{setCompFlash(false);setPostStep("breathe");},800);
    setCheckMood(0);setCheckEnergy(0);setCheckTag("");
    const prevAch=st.achievements.length;setTimeout(()=>{if(ach.length>prevAch){setNewAch(AM[ach[ach.length-1]]||ach[ach.length-1]);try{navigator.vibrate([50,50,50,50,100,100,200]);}catch(e){}setTimeout(()=>setNewAch(null),4000);}},2000);
    setSt({...st,totalSessions:ns,streak:nsk,todaySessions:st.lastDate===td?st.todaySessions+1:1,lastDate:td,weeklyData:nw,weekNum:getWeekNum(),coherencia:nC,resiliencia:nR,capacidad:nE,achievements:ach,vCores:vc,history:newHist,totalTime:(st.totalTime||0)+Math.round(pr.d*durMult),firstDone:true,progDay:Math.min((st.progDay||0)+1,7)});
  }
  function submitCheckin(){
    if(checkMood>0){const ml=[...(st.moodLog||[]),{ts:Date.now(),mood:checkMood,energy:checkEnergy||2,tag:checkTag,proto:pr.n,pre:preMood||0}].slice(-100);const ach=[...st.achievements];if(checkMood===5&&!ach.includes("mood5"))ach.push("mood5");setSt({...st,moodLog:ml,achievements:ach});}
    setPostStep("summary");
  }

  const lv=gL(st.totalSessions),ph=pr.ph[pi],fl=P.filter(p=>p.ct===sc),mW=Math.max(...st.weeklyData,1);
  const totalDur=Math.round(pr.d*durMult);
  const pct=(totalDur-sec)/totalDur,CI=2*Math.PI*116,dO=CI*(1-pct),ins=genIns(st),isBr=ts==="running"&&ph.br;
  const perf=Math.round((st.coherencia+st.resiliencia+st.capacidad)/3);
  const bioSignal=useMemo(()=>calcBioSignal(st),[st.coherencia,st.resiliencia,st.capacidad,st.moodLog,st.weeklyData,st.history]);
  const burnout=useMemo(()=>calcBurnoutIndex(st.moodLog,st.history),[st.moodLog,st.history]);
  const protoSens=useMemo(()=>calcProtoSensitivity(st.moodLog),[st.moodLog]);
  const nSt=getStatus(perf);const lPct=lvPct(st.totalSessions);const nLv=nxtLv(st.totalSessions);
  const isActive=ts==="running";const noData=st.totalSessions===0;
  const sugN=useMemo(()=>{const cs=["Reset","Activación","Protocolo"];const nc=cs[(cs.indexOf(pr.ct)+1)%3];const o=P.filter(p=>p.ct===nc);return o[Math.floor(o.length/2)]||P[0];},[pr.id]);
  const rD=useMemo(()=>{const h=st.history||[];if(h.length<2)return{c:0,r:0};return{c:h.slice(-1)[0].c-(h.length>=5?h[h.length-5]:h[0]).c,r:h.slice(-1)[0].r-(h.length>=5?h[h.length-5]:h[0]).r};},[st.history]);
  const moodTrend=useMemo(()=>(st.moodLog||[]).slice(-14).map(m=>m.mood),[st.moodLog]);
  const avgMood=useMemo(()=>{const ml=st.moodLog||[];if(!ml.length)return 0;return+(ml.slice(-7).reduce((a,m)=>a+m.mood,0)/Math.min(ml.length,7)).toFixed(1);},[st.moodLog]);
  const records=useMemo(()=>getRecords(st),[st.history,st.streak]);
  const moodDiff=preMood>0&&checkMood>0?checkMood-preMood:null;
  const nextPh=pi<pr.ph.length-1?pr.ph[pi+1]:null;
  const sessPct=Math.round(pct*100);
  const streakRisk=useMemo(()=>{if(st.streak<2||st.todaySessions>0)return false;const h=new Date().getHours();return h>=20;},[st.streak,st.todaySessions]);
  const lastProto=useMemo(()=>{const h=st.history||[];if(!h.length)return null;return h[h.length-1].p;},[st.history]);
  const favs=st.favs||[];
  const toggleFav=(name)=>{const nf=favs.includes(name)?favs.filter(f=>f!==name):[...favs,name];setSt({...st,favs:nf});};
  const weeklySummary=useMemo(()=>{const pw=st.prevWeekData||[0,0,0,0,0,0,0];const pwTotal=pw.reduce((a,b)=>a+b,0);const cwTotal=st.weeklyData.reduce((a,b)=>a+b,0);if(pwTotal===0)return null;const diff=cwTotal-pwTotal;const bestDay=pw.indexOf(Math.max(...pw));const ml=st.moodLog||[];const weekMoods=ml.slice(-7);const mAvg=weekMoods.length?+(weekMoods.reduce((a,m)=>a+m.mood,0)/weekMoods.length).toFixed(1):0;return{prev:pwTotal,curr:cwTotal,diff,bestDay:DN[bestDay],mAvg};},[st.prevWeekData,st.weeklyData,st.moodLog]);
  const smartPick=useMemo(()=>{const base=smartSuggest(st);if(!base)return null;const sens=calcProtoSensitivity(st.moodLog);if(Object.keys(sens).length<3)return base;const best=Object.entries(sens).filter(([n,d])=>d.avgDelta>0.3).sort((a,b)=>b[1].avgDelta-a[1].avgDelta)[0];if(best){const found=P.find(p=>p.n===best[0]);if(found)return found;}return base;},[st.moodLog,st.history]);
  const brain=useMemo(()=>neuralIntelligence(st),[st.moodLog,st.history,st.todaySessions,st.streak]);
  const daily=useMemo(()=>getDailyIgn(st),[st.moodLog]);
  const progStep=PROG_7[(st.progDay||0)%7];

  // ═══ NEUROADAPTIVE THEME ═══
  const theme = useMemo(() => {
    const _s = brain.systemState;
    const palettes = {optimal:{bgD:"#071210",bgL:"#EEFAF5",bdD:"#1A2E28",bdL:"#C8E6D8",sa:"#059669"},functional:{bgD:"#0A0D14",bgL:"#F0F2F8",bdD:"#1C2030",bdL:"#DEE2ED",sa:"#6366F1"},stressed:{bgD:"#120E07",bgL:"#FBF6EE",bdD:"#2E2518",bdL:"#E8D8C0",sa:"#D97706"},critical:{bgD:"#120808",bgL:"#FBF0F0",bdD:"#2E1818",bdL:"#E8C0C0",sa:"#DC2626"}};
    const p = palettes[_s] || palettes.functional;
    const motion = _s==="critical"?{pulse:"1.8s",dot:"1s",glow:"1.2s"}:_s==="stressed"?{pulse:"2.5s",dot:"1.5s",glow:"1.8s"}:_s==="optimal"?{pulse:"5s",dot:"2.8s",glow:"4s"}:{pulse:"4s",dot:"2.2s",glow:"3s"};
    return { ...p, motion, state: _s, isUrgent: _s==="critical"||_s==="stressed" };
  }, [brain.systemState]);
  const bg=isDark?theme.bgD:theme.bgL,cd=isDark?"#141820":"#FFFFFF",bd=isDark?theme.bdD:theme.bdL;
  const t1=isDark?"#E8ECF4":"#0F172A",t2=isDark?"#8B95A8":"#475569",t3=isDark?"#4B5568":"#94A3B8",ac=pr.cl;

  // Sync theme to CSS variables
  useTheme(brain.systemState, isDark);

  if(!mt)return <LoadingScreen />;

  return(
  <div style={{maxWidth:430,margin:"0 auto",minHeight:"100dvh",background:bg,position:"relative",overflow:"hidden",fontFamily:"'Manrope',-apple-system,sans-serif",transition:"background 2s ease"}}>
  <style>{`body{background:${bg};transition:background 2s ease}@keyframes dashIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes gl{0%,100%{box-shadow:0 0 ${theme.isUrgent?"30":"20"}px ${ac}${theme.isUrgent?"20":"10"},0 4px 20px ${ac}06}50%{box-shadow:0 0 ${theme.isUrgent?"55":"40"}px ${ac}${theme.isUrgent?"30":"1A"},0 4px 28px ${ac}0D}}@keyframes compFlash{0%{opacity:0}50%{opacity:1}100%{opacity:0}}@keyframes pausePulse{0%,100%{opacity:.4}50%{opacity:1}}@keyframes phaseSlide{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}@keyframes heartBeat{0%,100%{transform:scale(1)}14%{transform:scale(1.08)}28%{transform:scale(1)}42%{transform:scale(1.05)}70%{transform:scale(1)}}@keyframes ecgDraw{0%{opacity:.15}50%{opacity:.45}100%{opacity:.15}}@keyframes brainPulse{0%,100%{opacity:.04;transform:scale(1)}50%{opacity:.15;transform:scale(1.3)}}@keyframes neuralSpark{0%,100%{opacity:.1;transform:scale(.6)}50%{opacity:.8;transform:scale(1.8)}}@keyframes focusSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes focusLock{0%,100%{opacity:.05;transform:scale(1)}50%{opacity:.15;transform:scale(1.2)}}`}</style>

  <StateOrbs theme={theme} isDark={isDark} ac={ac} />
  {showMid&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:180,animation:"midPop 3.5s ease both",pointerEvents:"none"}}><div style={{background:cd,borderRadius:16,padding:"14px 22px",boxShadow:"0 8px 30px rgba(0,0,0,.08)",border:`1px solid ${bd}`,maxWidth:320,textAlign:"center"}}><div style={{fontSize:13,fontWeight:600,color:t1,lineHeight:1.6,fontStyle:"italic"}}>{midMsg}</div></div></div>}

  {/* Countdown Overlay */}
  <CountdownOverlay countdown={countdown} pr={pr} bg={bg} ac={ac} t3={t3} theme={theme} />

  {/* Completion flash */}
  {compFlash&&<div style={{position:"fixed",inset:0,zIndex:230,background:`${ac}12`,animation:"compFlash .8s ease forwards",pointerEvents:"none"}}/>}

  {onboard&&<div style={{position:"fixed",inset:0,zIndex:250,background:"rgba(15,23,42,.5)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}><div style={{background:cd,borderRadius:28,padding:"32px 24px",maxWidth:380,textAlign:"center",animation:"po .5s cubic-bezier(.34,1.56,.64,1)"}}>
    <svg width="56" height="56" viewBox="0 0 56 56" style={{margin:"0 auto 16px",display:"block"}}><circle cx="28" cy="28" r="24" fill="none" stroke={ac} strokeWidth="2.5" opacity=".6"/><circle cx="28" cy="28" r="17" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="6 4" style={{animation:"innerRing 4s linear infinite"}}/><circle cx="28" cy="28" r="6" fill={ac} opacity=".4"/></svg>
    <div style={{fontSize:26,fontWeight:800,color:t1,marginBottom:6,letterSpacing:"-0.8px"}}>BIO-IGNICIÓN</div>
    <div style={{fontSize:10,color:ac,fontWeight:700,letterSpacing:3,marginBottom:20,textTransform:"uppercase"}}>Activación Neural</div>
    {/* What you will feel */}
    <div style={{textAlign:"left",marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:t1,marginBottom:8}}>Qué vas a sentir:</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:28,height:28,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="breath" size={13} color={ac}/></div><div><div style={{fontSize:11,fontWeight:600,color:t1}}>Calma fisiológica</div><div style={{fontSize:10,color:t3}}>Tu frecuencia cardíaca baja en 15-30 segundos</div></div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:28,height:28,borderRadius:8,background:"#6366F110",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="focus" size={13} color="#6366F1"/></div><div><div style={{fontSize:11,fontWeight:600,color:t1}}>Claridad mental</div><div style={{fontSize:10,color:t3}}>El ruido mental se reduce y surge dirección</div></div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:28,height:28,borderRadius:8,background:"#D9770610",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="energy" size={13} color="#D97706"/></div><div><div style={{fontSize:11,fontWeight:600,color:t1}}>Energía dirigida</div><div style={{fontSize:10,color:t3}}>Tu rendimiento sube sin esfuerzo extra</div></div></div>
      </div>
    </div>
    {/* How to use correctly */}
    <div style={{textAlign:"left",marginBottom:20,padding:"12px",background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12}}>
      <div style={{fontSize:11,fontWeight:700,color:t1,marginBottom:6}}>Cómo usarlo correctamente:</div>
      <div style={{fontSize:10,color:t2,lineHeight:1.6}}>
        1. Selecciona un protocolo o acepta la recomendación<br/>
        2. Haz el check-in emocional antes de iniciar<br/>
        3. Sigue la voz y las instrucciones con ojos cerrados<br/>
        4. Toca la pantalla cuando te lo indique<br/>
        5. Completa el check-in después para medir tu impacto
      </div>
    </div>
    <div style={{fontSize:10,color:ac,fontStyle:"italic",marginBottom:16,lineHeight:1.5}}>Tu primera ignición será guiada por voz. Solo cierra los ojos y sigue las instrucciones.</div>
    <button onClick={()=>{setOnboard(false);unlockVoice();const d=getDailyIgn(st);if(d&&d.proto){setPr(d.proto);setSec(Math.round(d.proto.d*durMult));}}} style={{width:"100%",padding:"16px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",letterSpacing:3,textTransform:"uppercase",animation:"gl 2s ease infinite",transition:"transform .2s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.96)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>PRIMERA IGNICIÓN</button>
  </div></div>}

    {/* POST: BREATHE MOMENT */}
  {postStep==="breathe"&&ts==="done"&&<div style={{position:"fixed",inset:0,zIndex:220,background:bg+"F8",backdropFilter:"blur(30px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{width:60,height:60,borderRadius:"50%",background:"radial-gradient(circle,"+ac+"15,transparent)",animation:"pu 3s ease-in-out infinite",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:12,height:12,borderRadius:"50%",background:ac,opacity:.4,animation:"focusLock 2s ease infinite"}}/></div>
    <div style={{fontSize:14,fontWeight:600,color:t1,marginTop:20,textAlign:"center",lineHeight:1.6}}>Esto que sientes es real.</div>
    <div style={{fontSize:11,color:t3,marginTop:8}}>{Math.round(pr.d*durMult)} segundos de transformación neural.</div>
    <button onClick={()=>setPostStep("checkin")} style={{marginTop:24,padding:"12px 32px",borderRadius:50,background:"none",border:"1.5px solid "+ac+"30",color:ac,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1,animation:"fi 2s ease"}}>Continuar</button>
  </div>}

{/* POST: CHECK-IN */}
  {postStep==="checkin"&&ts==="done"&&<div style={{position:"fixed",inset:0,zIndex:220,background:`${bg}F5`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:cd,borderRadius:28,padding:"28px 22px",maxWidth:400,width:"100%",animation:"po .4s cubic-bezier(.34,1.56,.64,1)"}}>
    <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:17,fontWeight:800,color:t1}}>¿Cómo te sientes?</div><div style={{fontSize:11,color:t3,marginTop:4}}>1 toque. Tu progreso depende de esto.</div></div>
    <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:18}}>{MOODS.map(m=>(
      <button key={m.id} onClick={()=>{setCheckMood(m.value);H("tap");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"8px 4px",borderRadius:13,border:checkMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:checkMood===m.value?m.color+"0A":cd,cursor:"pointer",transition:"all .2s",minWidth:56,flex:1}}>
        <Ic name={m.icon} size={20} color={checkMood===m.value?m.color:t3}/>
        <span style={{fontSize:10,fontWeight:700,color:checkMood===m.value?m.color:t3,textAlign:"center",lineHeight:1.2}}>{m.label}</span>
      </button>))}</div>
    <details style={{marginBottom:16}}><summary style={{fontSize:11,fontWeight:700,color:ac,cursor:"pointer",padding:"6px 0",listStyle:"none"}}>Más detalle (opcional) ▾</summary>
    <div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Energía</div><div style={{display:"flex",gap:7}}>{ENERGY_LEVELS.map(e=>(
      <button key={e.id} onClick={()=>{setCheckEnergy(e.v);H("tap");}} style={{flex:1,padding:"9px",borderRadius:11,border:checkEnergy===e.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:checkEnergy===e.v?ac+"08":cd,color:checkEnergy===e.v?ac:t3,fontSize:11,fontWeight:700,cursor:"pointer"}}>{e.label}</button>))}</div></div>
    <div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Claridad mental</div><div style={{display:"flex",gap:5}}>{[{l:"Nublado",v:1},{l:"Regular",v:2},{l:"Claro",v:3},{l:"Cristalino",v:4}].map(c=><button key={c.v} onClick={()=>{setCheckEnergy(prev=>prev||2);H("tap");}} style={{flex:1,padding:"9px",borderRadius:11,border:"1.5px solid "+bd,background:cd,color:t3,fontSize:10,fontWeight:700,cursor:"pointer"}}>{c.l}</button>)}</div></div>
    <div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Contexto</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{WORK_TAGS.map(tg=>(
      <button key={tg} onClick={()=>{setCheckTag(checkTag===tg?"":tg);H("tap");}} style={{padding:"5px 11px",borderRadius:18,border:checkTag===tg?`1.5px solid ${ac}`:`1px solid ${bd}`,background:checkTag===tg?ac+"08":cd,color:checkTag===tg?ac:t3,fontSize:10,fontWeight:600,cursor:"pointer"}}>{tg}</button>))}</div></div>
    </details>
    <button onClick={submitCheckin} style={{width:"100%",padding:"14px",borderRadius:50,background:checkMood>0?ac:bd,border:"none",color:checkMood>0?"#fff":t3,fontSize:12,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>{checkMood>0?"CONTINUAR":"SELECCIONA ESTADO"}</button>
    <button onClick={()=>{if(checkMood===0){const ml=[...(st.moodLog||[]),{ts:Date.now(),mood:0,energy:0,tag:"skip",proto:pr.n,pre:preMood||0}].slice(-200);setSt({...st,moodLog:ml});}setPostStep("summary");}} style={{width:"100%",padding:"8px",marginTop:6,background:"transparent",border:"none",color:t3,fontSize:10,cursor:"pointer"}}>Omitir esta vez</button>
  </div></div>}

  {/* POST: SUMMARY with Before/After */}
  {postStep==="summary"&&ts==="done"&&<div style={{position:"fixed",inset:0,zIndex:220,background:`${bg}F2`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}><div style={{background:cd,borderRadius:28,padding:"28px 22px",maxWidth:400,width:"100%",animation:"po .5s cubic-bezier(.34,1.56,.64,1)",position:"relative",overflow:"hidden"}}>
    {Array.from({length:12}).map((_,i)=><div key={i} style={{position:"absolute",top:"15%",left:"50%",width:3+Math.random()*3,height:3+Math.random()*3,borderRadius:"50%",background:i%2===0?ac:"#6366F1",opacity:0,animation:`particle 1.5s ease ${i*.08}s forwards`,"--tx":`${(Math.random()-.5)*160}px`,"--ty":`${-30-Math.random()*100}px`}}/>)}
    <div style={{textAlign:"center",marginBottom:16}}>
      <div style={{width:56,height:56,margin:"0 auto 12px",borderRadius:"50%",background:"radial-gradient(circle at 40% 40%,"+ac+"30,"+ac+"10,transparent)",animation:"pu 3s cubic-bezier(.4,0,.2,1) infinite",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}><div style={{width:16,height:16,borderRadius:"50%",background:ac,opacity:.5,animation:"focusLock 2s ease infinite"}}/><div style={{position:"absolute",inset:-4,borderRadius:"50%",border:"1.5px solid "+ac+"20",animation:"bth 3s ease infinite"}}/></div>
      <div style={{fontSize:18,fontWeight:800,color:t1}}>{st.totalSessions<=1?"Primera ignición":"Ignición completada"}</div><div style={{fontSize:11,color:ac,marginTop:4,fontWeight:600}}>{st.totalSessions<=1?"Tu sistema nervioso acaba de despertar":"Tu estado se transformó"}</div>
      <div style={{fontSize:10,color:t2,marginTop:3}}>#{st.totalSessions} · {pr.n} · {Math.round(pr.d*durMult)}s</div>
    </div>
    {/* Streak celebration */}
    {st.streak>=3&&<div style={{textAlign:"center",padding:"10px",marginBottom:12,background:`linear-gradient(135deg,#D97706${isDark?"15":"08"},#D97706${isDark?"08":"04"})`,borderRadius:14,border:"1px solid #D9770615",animation:"fi .6s"}}>
      <div style={{fontSize:24,marginBottom:2}}>🔥</div>
      <div style={{fontSize:13,fontWeight:800,color:"#D97706"}}>{st.streak} días — {st.streak>=60?"LEGENDARIO 🔥":st.streak>=30?"IMPARABLE":st.streak>=14?"DISCIPLINADO":st.streak>=7?"EN RACHA":"CONSTRUYENDO"}</div><div style={{fontSize:10,color:t2,marginTop:2}}>{st.streak>=30?"Tu cerebro ya opera en un nivel superior":st.streak>=14?"Tu sistema nervioso se ha adaptado. Eres más fuerte.":st.streak>=7?"El hábito se está solidificando. No pares.":"Cada día que vuelves, tu cerebro se reconfigura."}</div>
    </div>}
        {preMood===0&&checkMood===0&&<div style={{padding:"12px 14px",marginBottom:12,background:ac+"06",borderRadius:14,border:"1px solid "+ac+"10",textAlign:"center"}}>
      <div style={{fontSize:11,fontWeight:600,color:t1,marginBottom:4}}>Tu sesión fue registrada</div>
      <div style={{fontSize:10,color:t2}}>Completa el check-in pre y post para ver tu transformación.</div>
    </div>}
    {/* Before → After comparison */}
    {preMood>0&&checkMood>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:14,padding:"14px 16px",background:`linear-gradient(135deg,${isDark?"#1A1E28":"#F1F5F9"},${isDark?"#141820":"#F8FAFC"})`,borderRadius:16}}>
      <div style={{textAlign:"center"}}><Ic name={MOODS[preMood-1].icon} size={22} color={MOODS[preMood-1].color}/><div style={{fontSize:10,color:t3,marginTop:3,fontWeight:600}}>Antes</div></div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{width:40,height:1,background:bd,marginBottom:4}}/><div style={{fontSize:18,color:moodDiff>0?"#059669":moodDiff<0?"#DC2626":t3,fontWeight:800}}>{moodDiff>0?"+"+moodDiff:moodDiff===0?"=":moodDiff}</div><div style={{fontSize:10,color:t3,marginTop:2}}>puntos</div></div>
      <div style={{textAlign:"center"}}><Ic name={MOODS[checkMood-1].icon} size={22} color={MOODS[checkMood-1].color}/><div style={{fontSize:10,color:t3,marginTop:3,fontWeight:600}}>Después</div></div>
    </div>}
    {!preMood&&checkMood>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:12,padding:"10px",background:MOODS[checkMood-1].color+"08",borderRadius:12}}>
      <Ic name={MOODS[checkMood-1].icon} size={18} color={MOODS[checkMood-1].color}/><span style={{fontSize:11,fontWeight:700,color:MOODS[checkMood-1].color}}>{MOODS[checkMood-1].label}</span>
      {checkTag&&<span style={{fontSize:10,color:t3}}>· {checkTag}</span>}
    </div>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",marginBottom:10}}>
      <span style={{fontSize:22,fontWeight:800,color:ac}}>+{postVC}</span><span style={{fontSize:12,fontWeight:700,color:t3}}>V-Cores</span>
    </div>
    {/* BIO QUALITY SCORE */}
    {/* Session Quality — simplified */}
    {(()=>{const bq=calcBioQuality(sessionData,Math.round(pr.d*durMult));const tc=estimateCoherence(sessionData.reactionTimes);return(
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",marginBottom:10,background:bq.quality==="alta"?"#05966908":bq.quality==="media"?"#D9770608":"#DC262608",borderRadius:12}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:bq.quality==="alta"?"#059669":bq.quality==="media"?"#D97706":"#DC2626"}}/> 
        <span style={{fontSize:11,fontWeight:700,color:bq.quality==="alta"?"#059669":bq.quality==="media"?"#D97706":"#DC2626"}}>{bq.quality==="alta"?"Ejecución verificada · "+bq.score+"/100":bq.quality==="media"?"Ejecución parcial · "+bq.score+"/100":"Baja participación · "+bq.score+"/100"}</span>
        {tc.coherence>30&&<span style={{fontSize:10,color:t3}}>· Coherencia {tc.coherence}%</span>}
      </div>);})()}
    <div style={{background:isDark?"#1A1E28":"#F1F5F9",borderRadius:11,padding:"10px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:800,color:lv.c}}>{lv.n}</span><span style={{fontSize:10,color:t3}}>{lPct}%</span></div>
      <div style={{height:3,background:bd,borderRadius:3,overflow:"hidden"}}><div style={{width:lPct+"%",height:"100%",borderRadius:3,background:lv.c}}/></div>
    </div>
    <div style={{background:ac+"06",borderRadius:10,padding:"10px 12px",marginBottom:12,border:`1px solid ${ac}10`}}>
      <div style={{fontSize:11,color:t2,fontWeight:500,lineHeight:1.5,fontStyle:"italic"}}>{postMsg}</div>
    </div>
    
    <button onClick={()=>{rs();setPostStep("none");}} style={{width:"100%",padding:"13px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>CONTINUAR</button>

  </div></div>}

  {showIntent&&<div style={{position:"fixed",inset:0,zIndex:210,background:"rgba(15,23,42,.4)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setShowIntent(false)}><div style={{background:cd,borderRadius:28,padding:"26px 20px",maxWidth:380,width:"100%",animation:"po .4s"}} onClick={e=>e.stopPropagation()}>
    <div style={{textAlign:"center",marginBottom:18}}><div style={{fontSize:16,fontWeight:800,color:t1}}>¿Qué necesitas?</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{INTENTS.map(i=>{const b=P.filter(p=>p.int===i.id);const pk=b[Math.floor(b.length/2)]||P[0];return(<button key={i.id} onClick={()=>sp(pk)} style={{padding:"16px 10px",borderRadius:16,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",textAlign:"center"}}><Ic name={i.icon} size={26} color={i.color}/><div style={{fontSize:12,fontWeight:800,color:t1,marginTop:6}}>{i.label}</div><div style={{fontSize:10,color:i.color,fontWeight:700,marginTop:4}}>{pk.n}</div></button>);})}</div>
  </div></div>}

  {sl&&(<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSl(false)}><div style={{width:"100%",maxWidth:430,maxHeight:"82vh",background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",overflowY:"auto",animation:"su .4s"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:20,fontWeight:800,color:t1,marginBottom:16}}>Protocolos</h3>
    <div style={{display:"flex",background:isDark?"#1A1E28":"#EEF2F7",borderRadius:12,padding:3,marginBottom:16}}>{CATS.map(c=><button key={c} onClick={()=>setSc(c)} style={{flex:1,padding:"9px 0",borderRadius:10,border:"none",background:sc===c?cd:"transparent",color:sc===c?t1:t3,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .3s"}}>{c}</button>)}</div>
    {[...fl].sort((a,b)=>(favs.includes(b.n)?1:0)-(favs.includes(a.n)?1:0)).map(p=>{const isLast=lastProto===p.n;const isFav=favs.includes(p.n);const isSmart=smartPick?.id===p.id;return<button key={p.id} onClick={()=>sp(p)} style={{width:"100%",padding:"12px",marginBottom:4,borderRadius:14,border:isSmart?`2px solid ${ac}`:pr.id===p.id?`2px solid ${p.cl}`:`1.5px solid ${bd}`,background:isSmart?ac+"05":pr.id===p.id?p.cl+"06":cd,cursor:"pointer",textAlign:"left",display:"flex",gap:11,alignItems:"center",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",left:0,top:0,bottom:0,width:3,borderRadius:"0 2px 2px 0",background:p.cl}}/><div style={{width:40,height:40,borderRadius:11,background:p.cl+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:p.cl,flexShrink:0,marginLeft:4}}>{p.tg}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:t1,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>{p.n}{isLast&&<span style={{fontSize:10,fontWeight:700,color:t3,background:isDark?"#1A1E28":"#F1F5F9",padding:"1px 5px",borderRadius:4}}>último</span>}{isSmart&&<span style={{fontSize:10,fontWeight:700,color:ac,background:ac+"10",padding:"1px 5px",borderRadius:4}}>recomendado</span>}</div><div style={{fontSize:10,color:t2,marginBottom:2}}>{p.sb}</div><div style={{fontSize:10,color:t3,display:"flex",alignItems:"center",gap:6}}>{p.ph.length} fases · {p.d}s · <span style={{color:p.dif===1?"#059669":p.dif===2?"#D97706":"#DC2626"}}>{".".repeat(p.dif||1)}</span></div></div><div onClick={e=>{e.stopPropagation();toggleFav(p.n);H("tap");}} style={{padding:4,cursor:"pointer",flexShrink:0}}><Ic name="star" size={16} color={isFav?ac:bd}/></div>{(()=>{const s=protoSens[p.n];return s&&s.sessions>=2?<span style={{fontSize:10,fontWeight:800,color:s.avgDelta>0?"#059669":"#DC2626",marginRight:4}}>{s.avgDelta>0?"+":""}{s.avgDelta}</span>:null;})()}{pr.id===p.id&&<Ic name="check" size={16} color={p.cl}/>}</button>;})}
  </div></div>)}

  {showSettings&&(<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowSettings(false)}><div style={{width:"100%",maxWidth:430,background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",animation:"su .4s"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:17,fontWeight:800,color:t1,marginBottom:16}}>Configuración</h3>
    {[{l:"Sonido + ambiente",k:"soundOn",d:"Acordes y ruido ambiental"},{l:"Vibración",k:"hapticOn",d:"Feedback táctil"},{l:"Voz guiada",k:"_voice",d:"Narración de fases y respiración"}].map(s=>(
      <div key={s.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${bd}`}}><div><div style={{fontSize:12,fontWeight:700,color:t1}}>{s.l}</div><div style={{fontSize:10,color:t3,marginTop:1}}>{s.d}</div></div>
        <div onClick={()=>{if(s.k==="_voice"){setVoiceOn(!voiceOn);}else setSt({...st,[s.k]:!st[s.k]});}} style={{width:42,height:24,borderRadius:12,background:s.k==="_voice"?(voiceOn?ac:bd):(st[s.k]?ac:bd),cursor:"pointer",position:"relative",transition:"background .3s"}}><div style={{width:20,height:20,borderRadius:10,background:"#fff",position:"absolute",top:2,left:s.k==="_voice"?(voiceOn?20:2):(st[s.k]?20:2),transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}}/></div>
      </div>))}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${bd}`}}><div style={{fontSize:12,fontWeight:700,color:t1}}>Tema</div><div style={{display:"flex",gap:4}}>{["auto","light","dark"].map(m=>(<button key={m} onClick={()=>setSt({...st,themeMode:m})} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${(st.themeMode||"auto")===m?ac:bd}`,background:(st.themeMode||"auto")===m?ac+"10":cd,color:(st.themeMode||"auto")===m?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>))}</div></div>
    <button onClick={()=>exportData(st)} style={{width:"100%",padding:"13px",marginTop:14,borderRadius:13,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
      <Ic name="export" size={16} color={t2}/><span style={{fontSize:12,fontWeight:700,color:t2}}>Exportar datos (JSON)</span>
    </button>
    
    <div style={{padding:"13px 0",borderBottom:"1px solid "+bd}}>
      <div style={{fontSize:12,fontWeight:700,color:t1,marginBottom:8}}>Paisaje sonoro</div>
      <div style={{display:"flex",gap:4}}>{[{id:"off",n:"Silencio"},{id:"wind",n:"Viento"},{id:"drone",n:"Drone"},{id:"bnarl",n:"Binaural"}].map(s=>
        <button key={s.id} onClick={()=>{setSt({...st,soundscape:s.id});if(ts==="running")startSoundscape(s.id);}} style={{flex:1,padding:"8px 4px",borderRadius:10,border:(st.soundscape||"off")===s.id?"1.5px solid "+ac:"1px solid "+bd,background:(st.soundscape||"off")===s.id?ac+"08":cd,color:(st.soundscape||"off")===s.id?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer"}}>{s.n}</button>
      )}</div>
    </div>

    <button onClick={()=>exportNOM035(st)} style={{width:"100%",padding:"13px",marginTop:8,borderRadius:13,border:"1.5px solid #059669",background:"#059669"+"08",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
      <Ic name="brief" size={16} color="#059669"/><span style={{fontSize:12,fontWeight:700,color:"#059669"}}>Informe NOM-035 (HTML)</span>
    </button>
  </div></div>)}

  {showHist&&(<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowHist(false)}><div style={{width:"100%",maxWidth:430,maxHeight:"75vh",background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",overflowY:"auto",animation:"su .4s"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:17,fontWeight:800,color:t1,marginBottom:16}}>Historial</h3>
    {!(st.history||[]).length&&<div style={{textAlign:"center",padding:"36px 0"}}><Ic name="chart" size={30} color={t3}/><div style={{fontSize:12,color:t3,marginTop:8}}>Tu primera sesión creará el registro.</div></div>}
    {(()=>{const g=groupHist([...(st.history||[])].reverse());return Object.entries(g).map(([k,items])=>{if(!items.length)return null;return(<div key={k}><div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:7,marginTop:10}}>{k==="hoy"?"Hoy":k==="ayer"?"Ayer":"Anteriores"}</div>{items.map((h,i)=>{const tm=new Date(h.ts).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});const ml=(st.moodLog||[]).find(m=>Math.abs(m.ts-h.ts)<10000);return(<div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:`1px solid ${bd}`}}><div style={{width:30,height:30,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="bolt" size={12} color={ac}/></div><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:t1}}>{h.p}</div><div style={{display:"flex",alignItems:"center",gap:3,marginTop:1}}><span style={{fontSize:10,color:t3}}>{tm}</span>{ml&&<Ic name={MOODS[ml.mood-1]?.icon||"neutral"} size={10} color={MOODS[ml.mood-1]?.color||t3}/>}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:800,color:ac}}>+{h.vc}</div></div></div>);})}</div>);});})()}
  </div></div>)}

  
  {/* Achievement Celebration */}
  {newAch&&<div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:300,animation:"po .5s cubic-bezier(.34,1.56,.64,1)",pointerEvents:"none"}}>
    <div style={{background:"linear-gradient(135deg,"+ac+"15,#D9770615)",borderRadius:20,padding:"16px 28px",boxShadow:"0 12px 40px rgba(0,0,0,.12)",border:"1.5px solid "+ac+"30",textAlign:"center",backdropFilter:"blur(20px)"}}>
      <div style={{fontSize:24,marginBottom:4}}>⚡</div>
      <div style={{fontSize:12,fontWeight:800,color:ac,letterSpacing:2,textTransform:"uppercase"}}>LOGRO DESBLOQUEADO</div>
      <div style={{fontSize:14,fontWeight:700,color:t1,marginTop:4}}>{newAch}</div>
    </div>
  </div>}

  <div style={{opacity:tabFade,transition:"opacity .25s cubic-bezier(.4,0,.2,1),transform .25s",transform:tabFade===1?"translateY(0)":"translateY(8px)",position:"relative",zIndex:1}}>

  {tab==="ignicion"&&postStep==="none"&&countdown===0&&!compFlash&&(<div className="bio-stagger" style={{padding:"14px 20px 180px"}}>
    {/* NFC/QR Context Banner */}
    {nfcCtx&&ts==="idle"&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",marginBottom:12,background:nfcCtx.type==="salida"?"#6366F1"+"08":ac+"08",borderRadius:14,border:`1.5px solid ${nfcCtx.type==="salida"?"#6366F1"+"20":ac+"20"}`,animation:"fi .4s"}}>
      <div style={{width:28,height:28,borderRadius:8,background:nfcCtx.type==="salida"?"#6366F115":ac+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name={nfcCtx.type==="salida"?"calm":"energy"} size={14} color={nfcCtx.type==="salida"?"#6366F1":ac}/></div>
      <div><div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:nfcCtx.type==="salida"?"#6366F1":ac,textTransform:"uppercase"}}>{nfcCtx.type==="salida"?"SESIÓN DE SALIDA":"SESIÓN DE ENTRADA"}</div>
      <div style={{fontSize:10,fontWeight:600,color:t1}}>{nfcCtx.type==="salida"?"Descomprime tu día. Llévate calma.":"Activa tu enfoque. Arranca con todo."}</div>
      {nfcCtx.company&&<div style={{fontSize:10,color:t3,marginTop:1}}>{nfcCtx.company}</div>}</div>
    </div>}
    {/* Immersive entry moment */}
    {!entryDone&&ts==="idle"&&st.totalSessions>0&&<div style={{textAlign:"center",padding:"24px 0 16px",animation:"fi 1s ease"}} onClick={()=>setEntryDone(true)}>
      <svg width="48" height="48" viewBox="0 0 52 52" style={{margin:"0 auto 16px",display:"block",animation:"pu 3s ease infinite"}}><circle cx="26" cy="26" r="22" fill="none" stroke={ac} strokeWidth="1.5" opacity=".3"/><circle cx="26" cy="26" r="15" fill="none" stroke={ac} strokeWidth="1" strokeDasharray="4 4" style={{animation:"innerRing 6s linear infinite"}}/><circle cx="26" cy="26" r="4" fill={ac} opacity=".3"/></svg>
      <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:16}}>{[{l:"Enfoque",v:st.coherencia,c:"#3B82F6"},{l:"Calma",v:st.resiliencia,c:"#059669"},{l:"Energía",v:st.capacidad,c:"#D97706"}].map((m,i)=><div key={i} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:m.c}}>{m.v}<span style={{fontSize:10}}>%</span></div><div style={{fontSize:9,color:t3,marginTop:2}}>{m.l}</div></div>)}</div><div style={{fontSize:14,fontWeight:500,color:t2,lineHeight:1.7,maxWidth:300,margin:"0 auto"}}>{brain.message}</div>
      <div style={{fontSize:10,color:t3,marginTop:16,fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>{circadian.period==="amanecer"||circadian.period==="mañana"?"ACTIVA TU MAÑANA":circadian.period==="noche"?"CIERRA TU DÍA":"TOCA PARA CONTINUAR"}</div>
    </div>}
    {(entryDone||st.totalSessions===0||ts!=="idle")&&<>
    {/* Streak risk */}
    {streakRisk&&ts==="idle"&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"9px 12px",marginBottom:12,background:isDark?"#1A1510":"#FFFBEB",borderRadius:12,border:"1px solid #D9770620",animation:"fi .4s"}}>
      <Ic name="alert" size={14} color="#D97706"/>
      <span style={{fontSize:10,fontWeight:600,color:"#D97706"}}>Tu racha de {st.streak} días termina esta noche.</span>
    </div>}
    {st.todaySessions>0&&ts==="idle"&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:4}}>
      <div style={{width:4,height:4,borderRadius:"50%",background:ac}}/><span style={{fontSize:10,fontWeight:700,color:ac}}>{st.todaySessions} {st.todaySessions===1?"sesión":"sesiones"} hoy</span>
    </div>}
    {ts==="idle"&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",marginBottom:12,background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:24,height:24,borderRadius:7,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic name="bolt" size={11} color={ac}/></div>
        <span style={{fontSize:11,fontWeight:600,color:t1}}>{st.todaySessions||0} de {st.totalSessions>=20?Math.min(3,Math.ceil(st.weeklyData.reduce((a,b)=>a+b,0)/Math.max(1,(st.weeklyData.filter(v=>v>0).length))))+1:2} sesiones hoy</span>
      </div>
      <div style={{width:40,height:5,borderRadius:5,background:bd,overflow:"hidden"}}>
        <div style={{width:Math.min(100,(st.todaySessions||0)/((st.totalSessions>=20?Math.min(3,Math.ceil(st.weeklyData.reduce((a,b)=>a+b,0)/Math.max(1,(st.weeklyData.filter(v=>v>0).length))))+1:2))*100)+"%",height:"100%",background:ac,borderRadius:5,transition:"width .3s"}}/>
      </div>
    </div>}
    {ts==="idle"&&st.totalSessions>=3&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:8,animation:"fi .4s"}}>
      <Ic name="rec" size={12} color={t3}/><span style={{fontSize:10,fontWeight:600,color:t2}}>Ventana óptima: <span style={{color:ac,fontWeight:800}}>{(()=>{const fp=calcNeuralFingerprint(st);const h=fp?fp.peakHour:new Date().getHours()<12?14:9;return(h<10?"0":"")+h+":00";})()}</span></span>
    </div>}

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:nSt.color,animation:"shimDot "+(theme.state==="critical"?"1s":theme.state==="stressed"?"1.5s":"2.5s")+" ease infinite"}}/><span style={{fontSize:10,fontWeight:700,color:nSt.color}}>{nSt.label}</span></div>
      <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:10,fontWeight:700,color:lv.c}}>{lv.n}</span><div style={{width:36,height:3,borderRadius:2,background:bd,overflow:"hidden"}}><div style={{width:lPct+"%",height:"100%",borderRadius:2,background:lv.c}}/></div></div>
    </div>
    <div style={{display:"flex",gap:7,marginBottom:16}}>
      <button onClick={()=>setSl(true)} style={{flex:1,padding:"10px 12px",borderRadius:15,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",gap:9}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
        <div style={{width:32,height:32,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:ac}}>{pr.tg}</div>
        <div style={{flex:1,textAlign:"left"}}><div style={{fontWeight:800,fontSize:13,color:t1,letterSpacing:"-.2px"}}>{pr.n}</div><div style={{fontSize:10,color:t3,marginTop:2}}>{pr.ph.length} fases · {pr.d}s · {pr.int}</div></div>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4L6 7L9 4" stroke={t3} strokeWidth="1.8" strokeLinecap="round"/></svg>
      </button>
      <button onClick={()=>setShowIntent(true)} style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="focus" size={18} color={t3}/></button>
    </div>

    {/* Duration selector */}
    {ts==="idle"&&<div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:16}}>
      {[{v:.5,l:"60s"},{v:1,l:"120s"},{v:1.5,l:"180s"}].map(d=>(
        <button key={d.v} onClick={()=>{setDurMult(d.v);setSec(Math.round(pr.d*d.v));H("tap");}} style={{padding:"6px 16px",borderRadius:20,border:durMult===d.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:durMult===d.v?ac+"08":cd,color:durMult===d.v?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>{d.l}</button>
      ))}
    </div>}

    {/* Pre-session mood capture */}
    {ts==="idle"&&<div style={{marginBottom:16,animation:"fi .4s"}}>
      <div style={{fontSize:10,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>¿Cómo llegas a esta sesión?</div>
      <div style={{fontSize:10,color:t3,marginTop:2}}>Esto mide tu transformación antes y después.</div>
      <div style={{display:"flex",gap:4}}>{MOODS.map(m=>(
        <button key={m.id} onClick={()=>{setPreMood(m.value);H("tap");}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"7px 2px",borderRadius:11,border:preMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:preMood===m.value?m.color+"0A":cd,cursor:"pointer",transition:"all .2s"}}>
          <Ic name={m.icon} size={16} color={preMood===m.value?m.color:t3}/>
          <span style={{fontSize:10,fontWeight:700,color:preMood===m.value?m.color:t3,lineHeight:1.1,textAlign:"center"}}>{m.label}</span>
        </button>))}</div>
    </div>}

    {/* ═══ CORE DE IGNICIÓN — Living Nucleus ═══ */}
    <div onClick={timerTap} aria-label="Core de Ignición" role="button" onMouseDown={()=>setTp(true)} onMouseUp={()=>setTp(false)} onMouseLeave={()=>setTp(false)} onTouchStart={()=>setTp(true)} onTouchEnd={()=>setTp(false)} style={{position:"relative",width:isActive?200:236,height:isActive?200:236,margin:"0 auto 14px",cursor:"pointer",transform:tp?"scale(0.93)":"scale(1)",transition:"all .6s cubic-bezier(.34,1.56,.64,1)",userSelect:"none"}}>
      {/* State-colored outer halo */}
      <div style={{position:"absolute",inset:isActive?-25:-16,borderRadius:"50%",background:"radial-gradient(circle,"+(theme.state==="optimal"?"#05966910":theme.state==="stressed"?"#D9770610":theme.state==="critical"?"#DC262610":ac+"08")+",transparent 70%)",transition:"all 2s ease",pointerEvents:"none"}}/>
      {/* Energy field — outermost aura */}
      <div style={{position:"absolute",inset:isActive?-20:-12,borderRadius:"50%",background:`radial-gradient(circle,${ac}${isActive?"10":"05"},transparent 65%)`,animation:ts==="idle"?"pu "+(brain.pulseSpeed==="fast"?"3":brain.pulseSpeed==="slow"?"6":"4.5")+"s ease-in-out infinite":isActive?"pu 2.5s ease infinite":"none",transition:"all .8s",filter:isActive?"blur(2px)":"blur(4px)"}}/>
      {/* Pulse rings — heartbeat */}
      {ts!=="paused"&&<><div style={{position:"absolute",inset:isActive?-10:-6,borderRadius:"50%",border:`1px solid ${ac}${isActive?"12":"08"}`,animation:ts==="idle"?"bth 5s ease-in-out infinite":"bth 3.5s ease infinite"}}/><div style={{position:"absolute",inset:isActive?-22:-14,borderRadius:"50%",border:`1px solid ${ac}${isActive?"08":"04"}`,animation:ts==="idle"?"bth 5s ease-in-out infinite .8s":"bth 3.5s ease infinite .6s"}}/>{isActive&&<div style={{position:"absolute",inset:-32,borderRadius:"50%",border:`1px solid ${ac}04`,animation:"bth 4s ease infinite 1.2s"}}/>}</>}
      {/* 3-layer breathing orbs */}
      {isBr&&<><div style={{position:"absolute",top:"50%",left:"50%",width:170,height:170,transform:`translate(-50%,-50%) scale(${bS})`,borderRadius:"50%",background:`radial-gradient(circle,${ac}0F,transparent)`,transition:"transform 1.3s cubic-bezier(.4,0,.2,1)",pointerEvents:"none"}}/><div style={{position:"absolute",top:"50%",left:"50%",width:120,height:120,transform:`translate(-50%,-50%) scale(${bS*1.08})`,borderRadius:"50%",background:`radial-gradient(circle,${ac}18,transparent)`,transition:"transform 1.4s cubic-bezier(.4,0,.2,1) .06s",pointerEvents:"none"}}/><div style={{position:"absolute",top:"50%",left:"50%",width:70,height:70,transform:`translate(-50%,-50%) scale(${bS*1.12})`,borderRadius:"50%",background:`radial-gradient(circle,${ac}22,transparent)`,transition:"transform 1.5s cubic-bezier(.4,0,.2,1) .12s",pointerEvents:"none"}}/></>}
      {/* Main ring with glow */}
      <svg width={isActive?"200":"236"} height={isActive?"200":"236"} viewBox="0 0 260 260" style={{transform:"rotate(-90deg)",transition:"width .6s,height .6s"}}>
        <circle cx="130" cy="130" r="116" fill="none" stroke={bd} strokeWidth="3" opacity=".5"/>
        <circle cx="130" cy="130" r="116" fill="none" stroke={ac} strokeWidth={isActive?"6":"3"} strokeLinecap="round" strokeDasharray={CI} strokeDashoffset={dO} style={{transition:isActive?"stroke-dashoffset .95s linear,stroke-width .4s":"stroke-dashoffset .3s ease",filter:isActive?`drop-shadow(0 0 6px ${ac}50)`:"none"}}/>
        <circle cx="130" cy="130" r="98" fill="none" stroke={isDark?"#1E2330":"#E2E8F0"} strokeWidth=".5" strokeDasharray="3 8" style={{animation:isActive?"innerRing 10s linear infinite":ts==="idle"?"innerRing 30s linear infinite":"none"}}/>
      </svg>
      {/* Inner nucleus — the fire */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:isActive?40:50,height:isActive?40:50,borderRadius:"50%",background:`radial-gradient(circle at 40% 40%,${ac}${ts==="idle"?"15":"25"},${ac}08,transparent)`,animation:ts==="idle"?"pu "+(circadian.period==="noche"||circadian.period==="madrugada"?"5.5":"3.2")+"s ease-in-out infinite":isActive?"pu 1.8s ease infinite":"none",transition:"all .6s",filter:`blur(${isActive?6:8}px)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:isActive?6:8,height:isActive?6:8,borderRadius:"50%",background:ac,opacity:ts==="idle"?.3:isActive?.6:.2,boxShadow:isActive?`0 0 12px ${ac}60,0 0 24px ${ac}30`:`0 0 8px ${ac}20`,animation:ts==="idle"?"focusLock 4s ease-in-out infinite":isActive?"focusLock 1.5s ease infinite":"none",transition:"all .5s",pointerEvents:"none"}}/>
      {/* Center content */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",zIndex:2}}>
        {isBr&&bL&&<div style={{animation:"fi .3s",marginBottom:2}}><span style={{fontSize:15,fontWeight:800,letterSpacing:6,color:ac,opacity:.9}}>{bL}</span><span style={{fontSize:12,fontWeight:800,color:ac,marginLeft:3}}>{bCnt}s</span></div>}
        <div style={{fontSize:isActive?46:52,fontWeight:800,color:t1,lineHeight:1,letterSpacing:"-3px",textShadow:isActive?`0 0 20px ${ac}15`:"none",transition:"font-size .5s"}}>{sec}</div>
        {isActive&&<div style={{fontSize:10,fontWeight:800,color:ac,marginTop:3,opacity:.8}}>{sessPct}%</div>}
        {isActive&&sessionData.motionSamples>0&&<div style={{display:"flex",alignItems:"center",gap:3,marginTop:3}}><div style={{width:4,height:4,borderRadius:"50%",background:sessionData.stability<0.5?"#059669":sessionData.stability<1.5?"#D97706":"#DC2626",animation:"pu 1.5s ease infinite"}}/><span style={{fontSize:10,color:t3}}>Coherencia {sessionData.stability<0.5?"alta":sessionData.stability<1.5?"media":"calibrando"}</span></div>}
        {ts==="idle"&&<><div style={{fontSize:9,fontWeight:600,letterSpacing:5,color:t3,marginTop:6,textTransform:"uppercase",opacity:.6}}>segundos</div><div style={{fontSize:10,color:ac,marginTop:6,fontWeight:600,opacity:.7,animation:"pu 3s ease-in-out infinite"}}>toca para ignición</div>{brain.message&&<div style={{fontSize:9,color:t3,marginTop:4,maxWidth:140,textAlign:"center",lineHeight:1.3,opacity:.6}}>{brain.message}</div>}</>}
        {ts==="running"&&!isBr&&<div style={{fontSize:10,color:t3,marginTop:3,opacity:.6}}>toca para pausar</div>}
        {ts==="paused"&&<div style={{fontSize:10,fontWeight:700,color:ac,marginTop:4,animation:"pausePulse 2s ease infinite"}}>EN PAUSA</div>}
      </div>
      {/* Touch ripple */}
      {tp&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"100%",height:"100%",borderRadius:"50%",border:`2px solid ${ac}20`,animation:"cdPulse .6s ease forwards",pointerEvents:"none"}}/>}
    </div>
    {/* Breathing state — only shows when NOT in Core view */}
    <div style={{textAlign:"center",marginBottom:isActive?6:10}}><div style={{display:"inline-flex",alignItems:"center",gap:6}}><Ic name={ph.ic} size={isActive?11:13} color={ac}/><span style={{fontSize:isActive?12:14,fontWeight:800,color:t1}}>{ph.l}</span></div>{!isActive&&<div style={{fontSize:10,color:t3,marginTop:2}}>{ph.r}</div>}</div>
    <div key={pi} style={{background:cd,borderRadius:16,padding:"16px",marginBottom:10,border:`1px solid ${bd}`,borderLeft:`3px solid ${ac}80`,animation:"phaseSlide .5s cubic-bezier(.4,0,.2,1)"}}>
      {/* Animated phase illustration */}
      {isActive&&<><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:22,height:22,borderRadius:7,background:ac+"15",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,fontWeight:800,color:ac}}>{pi+1}</span></div><span style={{fontSize:11,fontWeight:700,color:t1}}>Fase {pi+1} de {pr.ph.length}</span></div><span style={{fontSize:10,fontWeight:700,color:ac}}>{Math.round((pi+1)/pr.ph.length*100)}%</span></div><PhaseVisual type={ph.ic} color={ac} scale={bS} active={isActive}/></>}
      {/* Key phrase - LARGE, the mantra */}
      {ph.k&&<div style={{fontSize:16,fontWeight:800,color:t1,lineHeight:1.45,marginBottom:10,letterSpacing:"-0.3px",opacity:isActive?.95:1,transition:"opacity .5s"}}>{ph.k}</div>}
      {/* Detail instruction - readable */}
      <p style={{fontSize:12,lineHeight:1.75,color:t2,margin:0,fontWeight:400,opacity:isActive?.8:1,transition:"opacity .5s"}}>{ph.i}</p>
      {/* ═══ ANTI-TRAMPA: Bio-Validation System ═══ */}
      {isActive&&(()=>{
        const elapsed=totalDur-sec;
        // 3 checkpoints at 25%, 50%, 78% of session — each visible for 10 seconds
        const cp1=Math.round(totalDur*0.25),cp2=Math.round(totalDur*0.50),cp3=Math.round(totalDur*0.78);
        const isCP1=elapsed>=cp1&&elapsed<cp1+10;
        const isCP2=elapsed>=cp2&&elapsed<cp2+10;
        const isCP3=elapsed>=cp3&&elapsed<cp3+10;
        if(!isCP1&&!isCP2&&!isCP3)return null;

        // Voice announces interaction at start of each window
        if(elapsed===cp1||elapsed===cp2||elapsed===cp3){
          if(elapsed===cp1)speakNow("Mantén presionado");
          else if(elapsed===cp2)speakNow("Toca al exhalar");
          else speakNow("Confirma tu presencia");
        }

        // CHECKPOINT 1 (25%): TOUCH HOLD — sustained pressure 2+ seconds
        if(isCP1)return(
          <div style={{marginTop:12,animation:"fi .5s"}}>
            <button
              onTouchStart={(e)=>{e.currentTarget.dataset.holdStart=Date.now();e.currentTarget.dataset.holding="true";e.currentTarget.style.transform="scale(0.94)";e.currentTarget.style.background=ac+"15";e.currentTarget.style.borderColor=ac+"50";hapticBreath("INHALA");
                // Start hold progress animation
                const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar)bar.style.transition="width 2.5s linear";if(bar)bar.style.width="100%";}}
              onTouchEnd={(e)=>{const dur=Date.now()-(+e.currentTarget.dataset.holdStart||Date.now());e.currentTarget.dataset.holding="false";e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background=ac+"06";e.currentTarget.style.borderColor=ac+"25";
                const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar){bar.style.transition="none";bar.style.width="0%";}
                if(dur>=2000){setSessionData(d=>({...d,touchHolds:(d.touchHolds||0)+1,interactions:(d.interactions||0)+1,reactionTimes:[...(d.reactionTimes||[]),dur]}));H("ok");hapticPhase("focus");speakNow("verificado");}
                else if(dur>=800){setSessionData(d=>({...d,interactions:(d.interactions||0)+0.5,reactionTimes:[...(d.reactionTimes||[]),dur]}));H("tap");}
                else{setSessionData(d=>({...d,interactions:(d.interactions||0)+0.2}));H("tap");}}}
              onTouchCancel={(e)=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background=ac+"06";const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar){bar.style.transition="none";bar.style.width="0%";}setSessionData(d=>({...d,interactions:(d.interactions||0)+0.3}));}}
              onMouseDown={(e)=>{e.currentTarget.dataset.holdStart=Date.now();e.currentTarget.style.transform="scale(0.94)";const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar){bar.style.transition="width 2.5s linear";bar.style.width="100%";}}}
              onMouseUp={(e)=>{const dur=Date.now()-(+e.currentTarget.dataset.holdStart||Date.now());e.currentTarget.style.transform="scale(1)";const bar=e.currentTarget.querySelector("[data-hold-bar]");if(bar){bar.style.transition="none";bar.style.width="0%";}
                if(dur>=2000){setSessionData(d=>({...d,touchHolds:(d.touchHolds||0)+1,interactions:(d.interactions||0)+1,reactionTimes:[...(d.reactionTimes||[]),dur]}));H("ok");}
                else{setSessionData(d=>({...d,interactions:(d.interactions||0)+0.3}));H("tap");}}}
              style={{width:"100%",padding:"14px 16px",borderRadius:16,border:`2px solid ${ac}25`,background:ac+"06",cursor:"pointer",display:"flex",flexDirection:"column",gap:8,transition:"all .3s cubic-bezier(.4,0,.2,1)",position:"relative",overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:ac,opacity:.7,animation:"pu 1s ease infinite"}}/>
                <span style={{fontSize:13,fontWeight:700,color:ac}}>Mantén presionado 2 segundos</span>
              </div>
              <div style={{height:4,background:bd,borderRadius:4,overflow:"hidden",width:"100%"}}>
                <div data-hold-bar="" style={{width:"0%",height:"100%",background:`linear-gradient(90deg,${ac}60,${ac})`,borderRadius:4}}/>
              </div>
              <div style={{fontSize:10,color:t3,textAlign:"center"}}>Sostén mientras exhalas</div>
            </button>
          </div>);

        // CHECKPOINT 2 (50%): TOCA AL EXHALAR — tap synchronized with breathing
        if(isCP2)return(
          <div style={{marginTop:12,animation:"fi .5s"}}>
            <button
              onTouchStart={(e)=>{e.currentTarget.dataset.tapTime=Date.now();e.currentTarget.style.transform="scale(0.95)";e.currentTarget.style.background=ac+"12";}}
              onTouchEnd={(e)=>{const rt=Date.now()-(+e.currentTarget.dataset.tapTime||Date.now());e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background=ac+"06";
                const isExhale=bL==="EXHALA"||bL==="SOSTÉN";
                const bonus=isExhale?1.0:0.7;
                setSessionData(d=>({...d,interactions:(d.interactions||0)+bonus,reactionTimes:[...(d.reactionTimes||[]),rt]}));
                H("tap");hapticBreath("EXHALA");
                if(isExhale)speakNow("sincronizado");}}
              onClick={(e)=>{setSessionData(d=>({...d,interactions:(d.interactions||0)+0.7}));H("tap");}}
              style={{width:"100%",padding:"14px 16px",borderRadius:16,border:`1.5px dashed ${ac}35`,background:ac+"06",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:bL==="EXHALA"?ac:"transparent",border:`2px solid ${ac}`,opacity:.6,animation:bL==="EXHALA"?"pu .8s ease infinite":"none",transition:"all .3s"}}/>
              <span style={{fontSize:13,fontWeight:700,color:ac}}>Toca al exhalar</span>
              {bL==="EXHALA"&&<span style={{fontSize:11,fontWeight:800,color:ac,animation:"fi .3s"}}>¡AHORA!</span>}
            </button>
          </div>);

        // CHECKPOINT 3 (78%): CONFIRMA PRESENCIA — simple verified tap
        return(
          <div style={{marginTop:12,animation:"fi .5s"}}>
            <button
              onClick={()=>{setSessionData(d=>({...d,interactions:(d.interactions||0)+1,reactionTimes:[...(d.reactionTimes||[]),Date.now()%1000]}));H("tap");hapticPhase(ph.ic);speakNow("confirmado");}}
              onTouchStart={(e)=>{e.currentTarget.style.transform="scale(0.95)";e.currentTarget.style.background=ac+"10";}}
              onTouchEnd={(e)=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background=ac+"04";}}
              style={{width:"100%",padding:"14px 16px",borderRadius:16,border:`1.5px solid ${ac}20`,background:ac+"04",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:ac,opacity:.5}}/>
              <span style={{fontSize:13,fontWeight:700,color:ac}}>Confirma tu presencia</span>
            </button>
          </div>);
      })()}
      {/* Expandable science */}
      <button onClick={()=>{setShowScience(!showScience);setSessionData(d=>({...d,scienceViews:(d.scienceViews||0)+1}));}} style={{display:"flex",alignItems:"center",gap:5,marginTop:12,padding:"6px 0",background:"none",border:"none",cursor:"pointer"}}>
        <Ic name="mind" size={11} color={ac}/>
        <span style={{fontSize:10,color:ac,fontWeight:700,letterSpacing:.5}}>NEUROCIENCIA</span>
        <span style={{fontSize:10,color:ac,transform:showScience?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▾</span>
      </button>
      {showScience&&<div style={{marginTop:8,padding:"12px 14px",background:ac+"05",borderRadius:12,border:`1px solid ${ac}08`,animation:"fi .3s"}}>
        <div style={{fontSize:11,color:t2,lineHeight:1.7,marginBottom:SCIENCE_DEEP[pr.id]?8:0}}>{ph.sc}</div>
        {SCIENCE_DEEP[pr.id]&&<div style={{fontSize:10,color:t3,lineHeight:1.7,borderTop:`1px solid ${bd}`,paddingTop:8,marginTop:4}}>{SCIENCE_DEEP[pr.id]}</div>}
      </div>}
    </div>
    {/* Next phase preview */}
    {isActive&&nextPh&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",marginBottom:10,borderRadius:10,background:isDark?"#1A1E28":"#F8FAFC"}}>
      <Ic name="rec" size={10} color={t3}/>
      <span style={{fontSize:10,color:t3,fontWeight:600}}>Siguiente: {nextPh.l} ({nextPh.r})</span>
    </div>}
    <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap",marginBottom:16}}>{pr.ph.map((p,i)=>{const sR=durMult!==1?Math.round(p.s*durMult)+"–"+Math.round(p.e*durMult)+"s":p.r;return<div key={i} style={{padding:"3px 8px",borderRadius:14,border:pi===i?`1.5px solid ${ac}`:i<pi?`1px solid ${ac}40`:`1px solid ${bd}`,background:pi===i?ac+"08":i<pi?ac+"04":cd,color:pi===i?ac:i<pi?ac:t3,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:3,opacity:i<=pi?1:.5,transition:"all .3s"}}><span style={{width:5,height:5,borderRadius:"50%",background:i<=pi?ac:bd,transition:"all .3s"}}/>{sR}</div>;})}</div>
    <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center"}}>
      {ts==="idle"&&<button onClick={go} style={{flex:1,maxWidth:260,padding:"14px 0",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2.5,display:"flex",alignItems:"center",justifyContent:"center",gap:7,textTransform:"uppercase",animation:"gl "+(theme.isUrgent?"1.8s":"3s")+" ease infinite",boxShadow:`0 4px ${theme.isUrgent?"28":"18"}px ${ac}${theme.isUrgent?"40":"28"}`}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}><Ic name="bolt" size={13} color="#fff"/>IGNICIÓN</button>}
      {ts==="running"&&<><button onClick={pa} style={{flex:1,maxWidth:180,padding:"12px 0",borderRadius:50,background:cd,border:`2px solid ${ac}`,color:ac,fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>PAUSAR</button><RB o={rs} bd={bd} cd={cd} t3={t3}/></>}
      {ts==="paused"&&<><button onClick={()=>{setTs("running");H("go");}} style={{flex:1,maxWidth:180,padding:"12px 0",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>CONTINUAR</button><RB o={rs} bd={bd} cd={cd} t3={t3}/></>}
    </div>
    {isActive&&<div style={{marginTop:14,height:26,borderRadius:13,overflow:"hidden",background:cd,border:`1.5px solid ${bd}`,position:"relative"}}><svg width="800" height="20" viewBox="0 0 800 20" style={{position:"absolute",top:0,left:0,animation:"wf 4s linear infinite",opacity:.2}}><path d={`M0,10 ${Array.from({length:40},(_,i)=>`Q${i*20+10},${i%2===0?3:17} ${(i+1)*20},10`).join(" ")}`} fill="none" stroke={ac} strokeWidth="1"/></svg><div style={{position:"absolute",left:0,top:0,bottom:0,width:(pct*100)+"%",background:`linear-gradient(90deg,${ac}25,${ac}10)`,transition:"width .95s linear",borderRadius:10}}/></div>}
    {/* ═══ DAILY IGNICIÓN ═══ */}
    {ts==="idle"&&<button onClick={()=>sp(brain.bestProto||daily.proto)} style={{width:"100%",padding:"16px 14px",marginBottom:16,borderRadius:18,border:`1.5px solid ${(brain.bestProto||daily.proto).cl}20`,background:`linear-gradient(135deg,${(brain.bestProto||daily.proto).cl}06,${(brain.bestProto||daily.proto).cl}02)`,cursor:"pointer",textAlign:"left",display:"flex",gap:12,alignItems:"center",animation:"fi .5s",position:"relative",overflow:"hidden"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:daily.proto.cl+"08"}}/>
      <div style={{width:44,height:44,borderRadius:13,background:daily.proto.cl+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:daily.proto.cl,flexShrink:0,border:`1px solid ${daily.proto.cl}15`}}>{daily.proto.tg}</div>
      <div style={{flex:1,position:"relative",zIndex:1}}>
        <div style={{fontSize:10,fontWeight:800,color:daily.proto.cl,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>IGNICIÓN DEL DÍA</div>
        <div style={{fontSize:13,fontWeight:800,color:t1}}>{daily.proto.n}</div>
        <div style={{fontSize:10,color:t3,marginTop:2,fontStyle:"italic",lineHeight:1.4}}>{daily.phrase}</div>
      </div>
      <Ic name="bolt" size={16} color={daily.proto.cl}/>
    </button>}

    {/* ═══ 7-DAY PROGRAM ═══ */}
    {ts==="idle"&&(st.progDay||0)<7&&<details style={{marginBottom:16}}><summary style={{background:cd,borderRadius:12,padding:"10px 14px",border:"1px solid "+bd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",listStyle:"none"}}><span style={{fontSize:11,fontWeight:800,color:ac}}>Programa 7 Días — Día {Math.min((st.progDay||0)+1,7)}/7</span><span style={{fontSize:12,color:t3}}>▾</span></summary><div style={{background:cd,borderRadius:"0 0 16px 16px",padding:"12px",border:"1px solid "+bd,borderTop:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:ac,textTransform:"uppercase"}}>Programa 7 Días</div>
        <span style={{fontSize:10,fontWeight:800,color:t1}}>Día {Math.min((st.progDay||0)+1,7)}/7</span>
      </div>
      <div style={{display:"flex",gap:3,marginBottom:10}}>
        {PROG_7.map((p,i)=>{const done=i<(st.progDay||0);const curr=i===(st.progDay||0);return<div key={i} style={{flex:1,height:4,borderRadius:2,background:done?ac:curr?ac+"50":bd,transition:"background .5s"}}/>;})}</div>
      <button onClick={()=>{const p=P.find(x=>x.id===progStep.pid);if(p)sp(p);}} style={{width:"100%",padding:"10px",borderRadius:12,border:`1px solid ${bd}`,background:isDark?"#1A1E28":"#F8FAFC",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="bolt" size={12} color={ac}/></div>
        <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:11,fontWeight:700,color:t1}}>{progStep.t}</div><div style={{fontSize:10,color:t3}}>{progStep.d}</div></div>
        <Ic name="rec" size={12} color={ac}/>
      </button>
    </div></details>}

    {ts==="idle"&&smartPick&&pr.id!==smartPick.id&&daily.proto.id!==smartPick.id&&<button onClick={()=>sp(smartPick)} style={{width:"100%",padding:"10px 12px",marginBottom:16,borderRadius:14,border:`1.5px solid ${ac}20`,background:ac+"04",cursor:"pointer",display:"flex",alignItems:"center",gap:10,animation:"fi .5s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
      <div style={{width:32,height:32,borderRadius:9,background:smartPick.cl+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:smartPick.cl,flexShrink:0}}>{smartPick.tg}</div>
      <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:10,fontWeight:700,color:ac,letterSpacing:1,textTransform:"uppercase"}}>También recomendado</div><div style={{fontSize:10,fontWeight:700,color:t1,marginTop:1}}>{smartPick.n}</div></div>
      <Ic name="rec" size={12} color={ac}/>
    </button>}
    
    
  </>}
  </div>)}

  {tab==="dashboard"&&(<div className="bio-stagger" style={{padding:"14px 20px 180px"}}>
    {noData?<div style={{textAlign:"center",padding:"50px 20px"}}><Ic name="bolt" size={34} color={ac}/><div style={{fontSize:15,fontWeight:800,color:t1,marginTop:10,marginBottom:5}}>Tu dashboard te espera</div><div style={{fontSize:11,color:t3,marginBottom:18}}>Completa tu primera ignición.</div><button onClick={()=>switchTab("ignicion")} style={{padding:"11px 28px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>IR A IGNICIÓN</button></div>
    :<>

    {/* ═══ NEURAL SUMMARY — Apple Health style ═══ */}
    <NeuralSummary st={st} brain={brain} theme={theme} bioSignal={bioSignal} burnout={burnout} ac={ac} isDark={isDark} cd={cd} bd={bd} t1={t1} t2={t2} t3={t3} nSt={nSt} weeklyTotal={st.weeklyData.reduce((a,b)=>a+b,0)} />

    
    {/* Yesterday Comparison */}
    {(()=>{const ml=st.moodLog||[];const today=ml.filter(m=>new Date(m.ts).toDateString()===new Date().toDateString());const yday=ml.filter(m=>new Date(m.ts).toDateString()===new Date(Date.now()-86400000).toDateString());if(!yday.length||!today.length)return null;const tAvg=+(today.reduce((a,m)=>a+m.mood,0)/today.length).toFixed(1);const yAvg=+(yday.reduce((a,m)=>a+m.mood,0)/yday.length).toFixed(1);const d=+(tAvg-yAvg).toFixed(1);return(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:14,background:d>=0?(isDark?"#0A1A0A":"#F0FDF4"):(isDark?"#1A0A0A":"#FEF2F2"),borderRadius:12,border:"1px solid "+(d>=0?"#05966920":"#DC262620")}}>
      <div style={{fontSize:10,color:t2}}>Ayer {yAvg}</div>
      <div style={{fontSize:14,fontWeight:800,color:d>0?"#059669":d<0?"#DC2626":t3}}>{d>0?"+":""}{d}</div>
      <div style={{fontSize:10,color:t2}}>Hoy {tAvg}</div>
      <div style={{flex:1,textAlign:"right",fontSize:10,color:d>=0?"#059669":"#DC2626",fontWeight:600}}>{d>0?"Mejorando":"En ajuste"}</div>
    </div>);})()}

    
    {/* Baseline Comparison */}
    {st.history&&st.history.length>=5&&(()=>{const first5=st.history.slice(0,5);const last5=st.history.slice(-5);const baseC=Math.round(first5.reduce((a,h)=>a+(h.c||50),0)/5);const nowC=Math.round(last5.reduce((a,h)=>a+(h.c||50),0)/5);const delta=nowC-baseC;return(<div style={{background:delta>0?(isDark?"#0A1A0A":"#F0FDF4"):(isDark?"#1A0A0A":"#FEF2F2"),borderRadius:16,padding:"14px 12px",marginBottom:16,border:"1.5px solid "+(delta>0?"#05966920":"#DC262620")}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:6}}>Tu evolución</div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div><div style={{fontSize:10,color:t3}}>Inicio</div><div style={{fontSize:18,fontWeight:800,color:t3}}>{baseC}%</div></div>
        <div style={{fontSize:20,fontWeight:800,color:delta>0?"#059669":"#DC2626"}}>{delta>0?"+":""}{delta}%</div>
        <div><div style={{fontSize:10,color:t3}}>Ahora</div><div style={{fontSize:18,fontWeight:800,color:delta>0?"#059669":t1}}>{nowC}%</div></div>
      </div>
      <div style={{fontSize:10,color:t2,marginTop:6}}>{delta>0?"Tu coherencia mejoró "+delta+"% desde que empezaste.":"En proceso de calibración. Mantén la constancia."}</div>
    </div>);})()}

    {/* ═══ NEURAL ENGINE VISUAL ═══ */}
    {(()=>{
      const focus=st.coherencia||50,calm=st.resiliencia||50,energy=st.capacidad||50;
      const stress=Math.max(0,100-Math.round((focus+calm)/2));
      const zones=[
        {id:"focus",label:"Enfoque",value:focus,color:"#3B82F6",interp:focus>=80?"Óptimo para decisiones críticas":focus>=60?"Funcional para trabajo profundo":focus>=40?"Disperso. Sesión de enfoque recomendada":"Bajo. Protocolo Lightning Focus sugerido"},
        {id:"calm",label:"Calma",value:calm,color:"#059669",interp:calm>=80?"Tu calma es sólida. Buen estado":calm>=60?"Calma funcional. Buen baseline":calm>=40?"Tensión detectada. Protocolo de reset sugerido":"Tensión alta. Una sesión de calma ayudará"},
        {id:"energy",label:"Energía",value:energy,color:"#D97706",interp:energy>=80?"Alto rendimiento disponible":energy>=60?"Energía moderada. Suficiente para ejecutar":energy>=40?"Bajo combustible. Pulse Shift recomendado":"Reservas agotadas. Recuperación necesaria"},
        {id:"stress",label:"Estrés",value:stress,color:"#DC2626",interp:stress<=20?"Mínimo. Estado óptimo":stress<=40?"Controlado. Sin riesgo":stress<=60?"Elevado. Monitor activo":"Crítico. Intervención inmediata"}
      ];
      const activeZone=zones.find(z=>z.id===neuralZone);
      const brainSpeed=calm>=70?"8s":calm>=40?"5s":"3s";
    return(
    <div style={{background:cd,borderRadius:24,padding:"22px 18px",marginBottom:16,border:`1.5px solid ${bd}`,position:"relative",overflow:"hidden",boxShadow:isDark?"0 2px 20px rgba(0,0,0,.2)":"0 2px 20px rgba(0,0,0,.04)"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div><div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:theme.state==="optimal"?"#059669":theme.state==="stressed"?"#D97706":theme.state==="critical"?"#DC2626":t3,textTransform:"uppercase",marginBottom:3}}>Tu Estado Neural</div><AN value={perf} sfx="%" color={theme.state==="optimal"?"#059669":theme.state==="stressed"?"#D97706":theme.state==="critical"?"#DC2626":t1} sz={28}/></div>
        <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:9,height:9,borderRadius:"50%",background:nSt.color,animation:"shimDot "+(theme.state==="critical"?"1s":theme.state==="stressed"?"1.5s":"2.5s")+" ease infinite"}}/><span style={{fontSize:11,fontWeight:700,color:nSt.color}}>{nSt.label}</span></div>
      </div>

      {/* Brain visualization — 3D-style with glow zones */}
      <div style={{position:"relative",width:"100%",maxWidth:300,margin:"0 auto",aspectRatio:"1.1"}}>
        <svg viewBox="0 0 320 320" style={{width:"100%",height:"100%"}}>
          <defs>
            {/* Radial glow filters for 3D depth */}
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={ac} stopOpacity=".06"/><stop offset="100%" stopColor={ac} stopOpacity="0"/></radialGradient>
            <radialGradient id="focusG" cx="50%" cy="40%"><stop offset="0%" stopColor="#60A5FA" stopOpacity=".7"/><stop offset="50%" stopColor="#3B82F6" stopOpacity=".3"/><stop offset="100%" stopColor="#1D4ED8" stopOpacity=".05"/></radialGradient>
            <radialGradient id="calmG" cx="50%" cy="60%"><stop offset="0%" stopColor="#34D399" stopOpacity=".6"/><stop offset="50%" stopColor="#059669" stopOpacity=".25"/><stop offset="100%" stopColor="#047857" stopOpacity=".05"/></radialGradient>
            <radialGradient id="energyG" cx="50%" cy="50%"><stop offset="0%" stopColor="#FBBF24" stopOpacity=".8"/><stop offset="40%" stopColor="#D97706" stopOpacity=".35"/><stop offset="100%" stopColor="#B45309" stopOpacity=".05"/></radialGradient>
            <radialGradient id="stressG" cx="50%" cy="50%"><stop offset="0%" stopColor="#F87171" stopOpacity=".5"/><stop offset="60%" stopColor="#DC2626" stopOpacity=".2"/><stop offset="100%" stopColor="#991B1B" stopOpacity=".03"/></radialGradient>
            <filter id="brainGlow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="softGlow"><feGaussianBlur stdDeviation="3"/></filter>
          </defs>
          
          {/* Background ambient glow */}
          <circle cx="160" cy="160" r="150" fill="url(#bgGlow)"/>
          
          {/* Brain shape — organic, layered for depth */}
          {/* Outer glow layer */}
          <path d="M160,38 C115,38 72,60 55,98 C38,136 48,178 65,205 C76,222 92,236 110,245 L210,245 C228,236 244,222 255,205 C272,178 282,136 265,98 C248,60 205,38 160,38Z" 
            fill="none" stroke={isDark?"#ffffff08":"#00000008"} strokeWidth="20" />
          {/* Main brain shape */}
          <path d="M160,38 C115,38 72,60 55,98 C38,136 48,178 65,205 C76,222 92,236 110,245 L210,245 C228,236 244,222 255,205 C272,178 282,136 265,98 C248,60 205,38 160,38Z" 
            fill={isDark?"#0D1117":"#EDF2F7"} stroke={isDark?"#1E293B":"#CBD5E1"} strokeWidth=".5" opacity=".9"/>
          
          {/* Center fissure with depth */}
          <path d="M160,42 C158,80 162,120 158,160 C162,200 160,240 160,245" fill="none" stroke={isDark?"#1E293B":"#CBD5E1"} strokeWidth=".8" strokeDasharray="3 5" opacity=".4"/>
          
          {/* Left hemisphere sulci */}
          <path d="M80,90 Q100,100 120,85 Q135,75 145,90" fill="none" stroke={isDark?"#1E293B":"#CBD5E1"} strokeWidth=".5" opacity=".25"/>
          <path d="M65,140 Q90,130 115,145 Q135,155 150,140" fill="none" stroke={isDark?"#1E293B":"#CBD5E1"} strokeWidth=".5" opacity=".2"/>
          <path d="M75,185 Q100,175 125,190 Q140,200 150,188" fill="none" stroke={isDark?"#1E293B":"#CBD5E1"} strokeWidth=".4" opacity=".15"/>
          
          {/* Right hemisphere sulci */}
          <path d="M240,90 Q220,100 200,85 Q185,75 175,90" fill="none" stroke={isDark?"#1E293B":"#CBD5E1"} strokeWidth=".5" opacity=".25"/>
          <path d="M255,140 Q230,130 205,145 Q185,155 170,140" fill="none" stroke={isDark?"#1E293B":"#CBD5E1"} strokeWidth=".5" opacity=".2"/>
          <path d="M245,185 Q220,175 195,190 Q180,200 170,188" fill="none" stroke={isDark?"#1E293B":"#CBD5E1"} strokeWidth=".4" opacity=".15"/>
          
          {/* ═══ FOCUS ZONE — Frontal lobe (top) ═══ */}
          <ellipse cx="160" cy="75" rx={40+focus*.2} ry={28+focus*.12} fill="url(#focusG)" 
            opacity={.15+focus*.006} style={{animation:`brainPulse ${brainSpeed} ease infinite`,cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setNeuralZone(neuralZone==="focus"?null:"focus");H("tap");}}/>
          <ellipse cx="160" cy="75" rx={22+focus*.08} ry={14+focus*.05} fill="#3B82F6"
            opacity={.1+focus*.005} style={{animation:`brainPulse ${brainSpeed} ease infinite .5s`}}/>
          {/* Focus neural network lines */}
          <path d="M130,65 Q145,55 160,65 Q175,55 190,65" fill="none" stroke="#3B82F6" strokeWidth=".6" opacity={.08+focus*.003} style={{animation:`ecgDraw ${brainSpeed} linear infinite .2s`}}/>
          
          {/* ═══ CALM ZONE — Temporal/Base (bottom) ═══ */}
          <ellipse cx="160" cy="210" rx={45+calm*.15} ry={22+calm*.1} fill="url(#calmG)"
            opacity={.12+calm*.005} style={{animation:`brainPulse ${brainSpeed} ease infinite .8s`,cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setNeuralZone(neuralZone==="calm"?null:"calm");H("tap");}}/>
          <ellipse cx="160" cy="210" rx={25+calm*.08} ry={12+calm*.05} fill="#059669"
            opacity={.08+calm*.004} style={{animation:`brainPulse ${brainSpeed} ease infinite 1.2s`}}/>
          
          {/* ═══ ENERGY ZONE — Core/Center ═══ */}
          <circle cx="160" cy="140" r={20+energy*.15} fill="url(#energyG)"
            opacity={.15+energy*.006} style={{animation:`brainPulse ${brainSpeed} ease infinite .3s`,cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setNeuralZone(neuralZone==="energy"?null:"energy");H("tap");}}/>
          <circle cx="160" cy="140" r={10+energy*.06} fill="#D97706"
            opacity={.2+energy*.005} style={{animation:`brainPulse ${brainSpeed} ease infinite .9s`}}/>
          {/* Energy core spark */}
          <circle cx="160" cy="140" r={4+energy*.02} fill="#FBBF24" opacity={.3+energy*.004} style={{animation:`focusLock ${brainSpeed} ease infinite`}}/>
          
          {/* ═══ STRESS ZONE — Peripheral arcs ═══ */}
          <path d="M58,80 Q35,140 58,200" fill="none" stroke="url(#stressG)" strokeWidth={2+stress*.04}
            opacity={.1+stress*.007} style={{animation:`ecgDraw ${stress>50?"1.5s":"3.5s"} linear infinite`,cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();setNeuralZone(neuralZone==="stress"?null:"stress");H("tap");}}/>
          <path d="M262,80 Q285,140 262,200" fill="none" stroke="url(#stressG)" strokeWidth={2+stress*.04}
            opacity={.1+stress*.007} style={{animation:`ecgDraw ${stress>50?"1.5s":"3.5s"} linear infinite .7s`}}/>
          {/* Stress micro-arcs */}
          <path d="M50,110 Q38,140 50,170" fill="none" stroke="#DC2626" strokeWidth=".8" opacity={stress*.003} style={{animation:`ecgDraw ${stress>50?"1s":"3s"} linear infinite .3s`}}/>
          <path d="M270,110 Q282,140 270,170" fill="none" stroke="#DC2626" strokeWidth=".8" opacity={stress*.003} style={{animation:`ecgDraw ${stress>50?"1s":"3s"} linear infinite 1s`}}/>
          
          {/* Neural connections — synaptic pathways */}
          <line x1="160" y1="90" x2="160" y2="125" stroke={ac} strokeWidth=".5" opacity=".12" style={{animation:"ecgDraw 2.5s linear infinite"}}/>
          <line x1="160" y1="155" x2="160" y2="195" stroke={ac} strokeWidth=".5" opacity=".12" style={{animation:"ecgDraw 2.5s linear infinite .6s"}}/>
          <line x1="135" y1="140" x2="85" y2="140" stroke={ac} strokeWidth=".4" opacity=".08" style={{animation:"ecgDraw 3s linear infinite 1s"}}/>
          <line x1="185" y1="140" x2="235" y2="140" stroke={ac} strokeWidth=".4" opacity=".08" style={{animation:"ecgDraw 3s linear infinite 1.5s"}}/>
          <line x1="140" y1="85" x2="110" y2="140" stroke="#3B82F6" strokeWidth=".3" opacity=".06" style={{animation:"ecgDraw 4s linear infinite .3s"}}/>
          <line x1="180" y1="85" x2="210" y2="140" stroke="#3B82F6" strokeWidth=".3" opacity=".06" style={{animation:"ecgDraw 4s linear infinite .8s"}}/>
          <line x1="140" y1="195" x2="120" y2="155" stroke="#059669" strokeWidth=".3" opacity=".06" style={{animation:"ecgDraw 4s linear infinite 1.2s"}}/>
          <line x1="180" y1="195" x2="200" y2="155" stroke="#059669" strokeWidth=".3" opacity=".06" style={{animation:"ecgDraw 4s linear infinite 1.7s"}}/>
          
          {/* Neural sparks — synaptic fire */}
          {[[140,70],[180,70],[140,140],[180,140],[140,200],[180,200]].map(([x,y],i)=>
            <circle key={i} cx={x} cy={y} r={1.5+Math.random()} fill={i<2?"#60A5FA":i<4?"#FBBF24":i<6?"#34D399":ac} opacity=".4" style={{animation:`neuralSpark ${1.2+i*.25}s ease infinite ${i*.18}s`}}/>)}
        </svg>
        
        {/* ═══ INTERACTIVE ZONE BUTTONS — positioned around the brain ═══ */}
        {/* FOCUS — top */}
        <button onClick={()=>{setNeuralZone(neuralZone==="focus"?null:"focus");H("tap");}} style={{position:"absolute",top:"2%",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:20,border:neuralZone==="focus"?"1.5px solid #3B82F6":"1px solid "+(isDark?"#1E293B50":"#CBD5E150"),background:neuralZone==="focus"?(isDark?"#3B82F615":"#3B82F610"):(isDark?"#0D1117CC":"#FFFFFFCC"),cursor:"pointer"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#3B82F6",animation:"shimDot "+brainSpeed+" ease infinite"}}/>
          <span style={{fontSize:10,fontWeight:800,color:neuralZone==="focus"?"#3B82F6":t3}}>Enfoque</span>
          <span style={{fontSize:11,fontWeight:800,color:"#3B82F6"}}>{focus}%</span>
        </button>
        
        {/* CALM — bottom */}
        <button onClick={()=>{setNeuralZone(neuralZone==="calm"?null:"calm");H("tap");}} style={{position:"absolute",bottom:"2%",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:20,border:neuralZone==="calm"?"1.5px solid #059669":"1px solid "+(isDark?"#1E293B50":"#CBD5E150"),background:neuralZone==="calm"?(isDark?"#05966915":"#05966910"):(isDark?"#0D1117CC":"#FFFFFFCC"),cursor:"pointer"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#059669",animation:"shimDot "+brainSpeed+" ease infinite .4s"}}/>
          <span style={{fontSize:10,fontWeight:800,color:neuralZone==="calm"?"#059669":t3}}>Calma</span>
          <span style={{fontSize:11,fontWeight:800,color:"#059669"}}>{calm}%</span>
        </button>
        
        {/* STRESS — left */}
        <button onClick={()=>{setNeuralZone(neuralZone==="stress"?null:"stress");H("tap");}} style={{position:"absolute",top:"50%",left:"0%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 8px",borderRadius:14,border:neuralZone==="stress"?"1.5px solid #DC2626":"1px solid "+(isDark?"#1E293B50":"#CBD5E150"),background:neuralZone==="stress"?(isDark?"#DC262615":"#DC262610"):(isDark?"#0D1117CC":"#FFFFFFCC"),cursor:"pointer"}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"#DC2626",animation:"shimDot "+(stress>50?"1.5s":"3s")+" ease infinite"}}/>
          <span style={{fontSize:9,fontWeight:800,color:neuralZone==="stress"?"#DC2626":t3}}>Estrés</span>
          <span style={{fontSize:10,fontWeight:800,color:"#DC2626"}}>{stress}%</span>
        </button>
        
        {/* ENERGY — right */}
        <button onClick={()=>{setNeuralZone(neuralZone==="energy"?null:"energy");H("tap");}} style={{position:"absolute",top:"50%",right:"0%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 8px",borderRadius:14,border:neuralZone==="energy"?"1.5px solid #D97706":"1px solid "+(isDark?"#1E293B50":"#CBD5E150"),background:neuralZone==="energy"?(isDark?"#D9770615":"#D9770610"):(isDark?"#0D1117CC":"#FFFFFFCC"),cursor:"pointer"}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"#D97706",animation:"shimDot "+brainSpeed+" ease infinite .6s"}}/>
          <span style={{fontSize:9,fontWeight:800,color:neuralZone==="energy"?"#D97706":t3}}>Energía</span>
          <span style={{fontSize:10,fontWeight:800,color:"#D97706"}}>{energy}%</span>
        </button>
      </div>

      {/* Zone detail — tap to explore */}
      {activeZone&&<div style={{padding:"12px 14px",marginTop:8,background:activeZone.color+"08",borderRadius:14,border:`1.5px solid ${activeZone.color}20`,animation:"fi .3s"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:13,fontWeight:800,color:activeZone.color}}>{activeZone.label}</span>
          <span style={{fontSize:18,fontWeight:800,color:activeZone.color}}>{activeZone.value}%</span>
        </div>
        <div style={{fontSize:11,color:t2,lineHeight:1.5}}>{activeZone.interp}</div>
      </div>}

      {/* Interpretation + recommendation */}
      {!activeZone&&<div style={{padding:"10px 12px",marginTop:8,background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12}}>
        <div style={{fontSize:11,color:t1,fontWeight:600,marginBottom:3}}>
          {perf>=80?"Estado óptimo":perf>=65?"Buen ritmo":perf>=45?"Espacio para crecer":"Tu cuerpo necesita reset"}
        </div>
        <div style={{fontSize:10,color:t2,lineHeight:1.5}}>
          {perf>=80?"Tu mente está en su mejor momento. Ventana óptima para decisiones críticas.":
           perf>=65?"Estás en buen estado. Sigue así. Buen momento para trabajo profundo.":
           perf>=45?"Tienes margen de mejora. Una sesión de enfoque elevaría tu estado 15-20%.":
           "Tu cuerpo pide una pausa activa. Prioriza un reset antes de exigir rendimiento."}
        </div>
        <div style={{fontSize:10,color:t3,marginTop:6,fontStyle:"italic"}}>Toca las zonas del cerebro para explorar cada estado</div>
      </div>}

      {/* Level badge */}
      <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:10}}>
        <div style={{background:lv.c+"0C",borderRadius:9,padding:"5px 10px"}}><span style={{fontSize:10,fontWeight:800,color:lv.c}}>{lv.n}</span></div>
        <div style={{background:bd,borderRadius:9,padding:"5px 10px"}}><span style={{fontSize:10,fontWeight:700,color:t3}}>{lPct}% → {nLv?.n||"MAX"}</span></div>
      </div>
    </div>);})()}

    {/* ═══ MÉTRICAS AVANZADAS (collapsible) ═══ */}
    <button onClick={()=>setDashSections(p=>({...p,metrics:!p.metrics}))} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",marginBottom:dashSections.metrics?8:14,background:cd,borderRadius:12,border:"1px solid "+bd,cursor:"pointer"}}>
      <span style={{fontSize:11,fontWeight:800,color:t1}}>Métricas Avanzadas</span>
      <span style={{fontSize:12,color:t3,transform:dashSections.metrics?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▾</span>
    </button>
    {dashSections.metrics&&<>
    {/* ═══ BIO SIGNAL SCORE + BURNOUT INDEX ═══ */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:16}}>
      <div style={{background:cd,borderRadius:16,padding:"14px 12px",border:`1px solid ${bd}`}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:4}}>BioSignal Score</div>
        <AN value={bioSignal.score} sfx="" color={bioSignal.score>=70?"#059669":bioSignal.score>=45?"#D97706":"#DC2626"} sz={26}/>
        <div style={{fontSize:10,color:t2,marginTop:4,lineHeight:1.4}}>{bioSignal.score>=70?"Sistema en rendimiento alto":bioSignal.score>=45?"Estado funcional, margen de mejora":"Requiere intervención activa"}</div>
      </div>
      <div style={{background:burnout.risk==="crítico"||burnout.risk==="alto"?(isDark?"#1A0A0A":"#FEF2F2"):cd,borderRadius:16,padding:"14px 12px",border:`1px solid ${burnout.risk==="crítico"||burnout.risk==="alto"?"#DC262620":bd}`}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:4}}>Índice Burnout</div>
        <AN value={burnout.index} sfx="" color={burnout.risk==="bajo"?"#059669":burnout.risk==="moderado"?"#D97706":"#DC2626"} sz={26}/>
        <div style={{fontSize:10,color:burnout.risk==="bajo"?"#059669":burnout.risk==="moderado"?"#D97706":"#DC2626",fontWeight:600,marginTop:4}}>Riesgo {burnout.risk}</div>
        <div style={{fontSize:10,color:t3,marginTop:2}}>Tendencia: {burnout.trend}</div>
        {burnout.prediction&&<div style={{fontSize:10,color:burnout.risk==="crítico"||burnout.risk==="alto"?"#DC2626":t2,marginTop:4,lineHeight:1.4,fontStyle:"italic"}}>{burnout.prediction}</div>}
      </div>
    </div>

    {/* ═══ PROTOCOL SENSITIVITY ═══ */}
    {Object.keys(protoSens).length>=2&&<div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:16,border:`1px solid ${bd}`}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:8}}>Tu Sensibilidad por Protocolo</div>
      {Object.entries(protoSens).sort((a,b)=>b[1].avgDelta-a[1].avgDelta).slice(0,4).map(([name,data],i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:i<3?`1px solid ${bd}`:"none"}}>
          <span style={{fontSize:11,color:t1,fontWeight:600}}>{name}</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,fontWeight:800,color:data.avgDelta>0?"#059669":data.avgDelta<0?"#DC2626":t3}}>{data.avgDelta>0?"+":""}{data.avgDelta}</span>
            <span style={{fontSize:10,color:t3}}>{data.sessions}x</span>
          </div>
        </div>))}
    </div>}

    
    </>}

    {/* Weekly Comparison */}
    {weeklySummary&&<div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:16,border:"1px solid "+bd}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:8}}>Esta semana vs anterior</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:t3}}>{weeklySummary.prev}</div><div style={{fontSize:10,color:t3}}>Anterior</div></div>
        <div style={{fontSize:18,fontWeight:800,color:weeklySummary.diff>0?"#059669":weeklySummary.diff<0?"#DC2626":t3}}>{weeklySummary.diff>0?"+":""}{weeklySummary.diff}</div>
        <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:ac}}>{weeklySummary.curr}</div><div style={{fontSize:10,color:t3}}>Esta</div></div>
      </div>
      {weeklySummary.mAvg>0&&<div style={{fontSize:10,color:t2,textAlign:"center",marginTop:6}}>Mood promedio: {weeklySummary.mAvg}/5</div>}
    </div>}

    
    

    
    {/* Recovery Index */}
    {(()=>{const ri=calcRecoveryIndex(st.moodLog);if(!ri)return null;return(
    <div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:16,border:"1px solid "+bd}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:8}}>Índice de Recuperación</div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:ri.avgRetention>=80?"#059669":ri.avgRetention>=60?"#D97706":"#DC2626"}}>{ri.avgRetention}%</div><div style={{fontSize:10,color:t3}}>retención</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:t1}}>{ri.avgHours}h</div><div style={{fontSize:10,color:t3}}>duración efecto</div></div>
      </div>
      <div style={{fontSize:11,color:t2,lineHeight:1.5}}>{ri.interpretation}</div>
    </div>);})()}

    {/* ═══ IMPACTO MEDIBLE ═══ */}
    {(()=>{const ml=st.moodLog||[];const withPre=ml.filter(m=>m.pre>0);if(withPre.length<2)return null;const avg=+(withPre.reduce((a,m)=>a+(m.mood-m.pre),0)/withPre.length).toFixed(1);const bestP={};withPre.forEach(m=>{if(!bestP[m.proto])bestP[m.proto]={sum:0,cnt:0};bestP[m.proto].sum+=m.mood-m.pre;bestP[m.proto].cnt++;});const best=Object.entries(bestP).sort((a,b)=>(b[1].sum/b[1].cnt)-(a[1].sum/a[1].cnt))[0];return(
      <div style={{background:`linear-gradient(135deg,${ac}08,${ac}03)`,borderRadius:18,padding:"16px 14px",marginBottom:16,border:`1px solid ${ac}12`}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:ac,textTransform:"uppercase",marginBottom:8}}>Impacto Medible</div>
        <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:6}}>
          <span style={{fontSize:28,fontWeight:800,color:avg>0?"#059669":avg<0?"#DC2626":t1}}>{avg>0?"+":""}{avg}</span>
          <span style={{fontSize:10,color:t2}}>puntos de mejora promedio por sesión</span>
        </div>
        <div style={{fontSize:10,color:t2,lineHeight:1.6}}>
          Basado en {withPre.length} sesiones con check-in completo.
          {best&&best[1].cnt>=2&&<span> Tu protocolo más efectivo: <span style={{fontWeight:800,color:t1}}>{best[0]}</span> ({best[1].cnt>=2?"+"+((best[1].sum/best[1].cnt)).toFixed(1):"—"} promedio).</span>}
        </div>
      </div>);})()}

    {/* ═══ ACTIVIDAD Y TENDENCIAS (collapsible) ═══ */}
    <button onClick={()=>setDashSections(p=>({...p,activity:!p.activity}))} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",marginBottom:dashSections.activity?8:14,background:cd,borderRadius:12,border:"1px solid "+bd,cursor:"pointer"}}>
      <span style={{fontSize:11,fontWeight:800,color:t1}}>Actividad y Tendencias</span>
      <span style={{fontSize:12,color:t3,transform:dashSections.activity?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▾</span>
    </button>
    {dashSections.activity&&<>
    {/* ═══ ACTIVITY HEATMAP (GitHub-style, 4 weeks) ═══ */}
    <div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:16,border:`1px solid ${bd}`}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:10}}>Actividad · 28 días</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {(()=>{const cells=[];const now=new Date();const hist=st.history||[];for(let d=27;d>=0;d--){const day=new Date(now);day.setDate(day.getDate()-d);const ds=day.toDateString();const count=hist.filter(h=>new Date(h.ts).toDateString()===ds).length;const isToday=d===0;cells.push(<div key={d} style={{aspectRatio:"1",borderRadius:4,background:count===0?(isDark?"#1A1E28":"#F1F5F9"):count===1?ac+"30":count===2?ac+"60":ac,border:isToday?`1.5px solid ${ac}`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{count>0&&<span style={{fontSize:10,fontWeight:800,color:count>=3?"#fff":ac}}>{count}</span>}</div>);}return cells;})()}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:10,color:t3}}>4 semanas atrás</span><span style={{fontSize:10,color:t3}}>Hoy</span></div>
    </div>

    {/* ═══ ENERGY FLOW — Hour distribution ═══ */}
    {st.history?.length>=3&&<div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:16,border:`1px solid ${bd}`}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:10}}>Tu Flujo de Energía</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:2,height:40}}>
        {(()=>{const hrs=Array(24).fill(0);(st.history||[]).forEach(h=>{const hr=new Date(h.ts).getHours();hrs[hr]++;});const mx=Math.max(...hrs,1);const slots=[];for(let i=6;i<23;i++){const v=hrs[i];slots.push(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><div style={{width:"100%",borderRadius:3,height:Math.max((v/mx)*34,1),background:v>0?ac:bd,transition:"height .5s",opacity:v>0?(.3+.7*(v/mx)):1}}/>{i%3===0&&<span style={{fontSize:10,color:t3}}>{i}</span>}</div>);}return slots;})()}
      </div>
      <div style={{fontSize:10,color:t2,marginTop:8,fontStyle:"italic"}}>{(()=>{const hrs=Array(24).fill(0);(st.history||[]).forEach(h=>{hrs[new Date(h.ts).getHours()]++;});const pk=hrs.indexOf(Math.max(...hrs));return pk>0?`Tu hora pico: ${pk}:00. Tu sistema rinde mejor aquí.`:"Aún recopilando datos de tu patrón.";})()}</div>
    </div>}

    {/* ═══ MOOD TREND ═══ */}
    {moodTrend.length>=2&&<div style={{background:cd,borderRadius:16,padding:"12px",marginBottom:16,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>Tendencia Emocional</span><div style={{display:"flex",alignItems:"center",gap:3}}><Ic name={MOODS[Math.round(avgMood)-1]?.icon||"neutral"} size={12} color={MOODS[Math.round(avgMood)-1]?.color||t3}/><span style={{fontSize:12,fontWeight:800,color:MOODS[Math.round(avgMood)-1]?.color||t3}}>{avgMood}</span><span style={{fontSize:10,color:t3}}>/5</span></div></div>
      <SK data={moodTrend} c={MOODS[Math.round(avgMood)-1]?.color||"#6366F1"} w={340} h={26} id="mood"/>
    </div>}
    {/* Mood Sparkline 14 days */}
    {moodTrend.length>=3&&<div style={{background:cd,borderRadius:14,padding:"12px",marginBottom:16,border:"1px solid "+bd}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:8}}>Evolución de mood · 14 días</div>
      <SK data={moodTrend} c={avgMood>=3.5?"#059669":avgMood>=2.5?"#D97706":"#DC2626"} w={280} h={40} id="mood14"/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:10,color:t3}}>hace 14 días</span><span style={{fontSize:10,fontWeight:700,color:avgMood>=3.5?"#059669":"#D97706"}}>hoy: {avgMood}/5</span></div>
    </div>}

    {/* ═══ METRICS GRID ═══ */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:16}}>
      {[{l:"Enfoque",v:st.coherencia,d:rD.c>0?"+"+rD.c+"%":"—",c:"#3B82F6",u:"e"},{l:"Calma",v:st.resiliencia,d:rD.r>0?"+"+rD.r+"%":"—",c:"#8B5CF6",u:"c"},{l:"V-Cores",v:st.vCores||0,d:"+"+(st.history?.slice(-1)[0]?.vc||0),c:"#D97706",u:"v"},{l:"Sesiones",v:st.totalSessions,d:st.streak+"d racha",c:"#059669",u:"t"}].map((k,i)=>(
        <div key={i} style={{background:cd,borderRadius:14,padding:"11px 10px",border:`1px solid ${bd}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,fontWeight:700,color:t3}}>{k.l}</span><span style={{fontSize:10,fontWeight:700,color:"#059669"}}>{k.d}</span></div>
          <AN value={k.v} sfx={k.l==="Enfoque"||k.l==="Calma"?"%":""} color={k.c} sz={20}/>
        </div>))}
    </div>

    {/* ═══ RECORDS ═══ */}
    {records.topProto&&<div style={{background:cd,borderRadius:16,padding:"12px",marginBottom:16,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><Ic name="trophy" size={14} color={ac}/><span style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>Récords Personales</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
        {[{v:records.bestStreak,l:"Mejor racha",s:"días"},{v:records.maxC+"%",l:"Max coherencia",s:""},{v:records.topProto.c+"x",l:records.topProto.n,s:""},{v:records.earliest!==null?records.earliest+":00":"—",l:"Más temprana",s:""}].map((r,i)=>
          <div key={i} style={{padding:"8px",background:isDark?"#1A1E28":"#F8FAFC",borderRadius:10}}>
            <div style={{fontSize:14,fontWeight:800,color:t1}}>{r.v}</div>
            <div style={{fontSize:10,color:t3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.l} {r.s}</div>
          </div>)}
      </div>
    </div>}

    {/* ═══ COACH IA ═══ */}
    <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:12,marginTop:6}}>Coach IA</div>
    <div style={{marginBottom:16}}>{ins.slice(0,3).map((x,i)=>(
      <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"10px 11px",background:cd,borderRadius:11,border:`1px solid ${bd}`,marginBottom:3}}>
        <Ic name={x.t==="up"?"up":x.t==="fire"?"fire":x.t==="rec"?"rec":x.t==="alert"?"alert":"star"} size={12} color={x.t==="up"?ac:x.t==="fire"?"#D97706":x.t==="alert"?"#DC2626":"#6366F1"}/>
        <span style={{fontSize:10,color:t2,lineHeight:1.5}}>{x.x}</span>
      </div>))}</div>

    {/* ═══ WEEKLY CHART + SUMMARY ═══ */}
    {weeklySummary&&<div style={{background:isDark?"#141820":"#F8FAFC",borderRadius:16,padding:"12px",marginBottom:16,border:`1px solid ${bd}`}}>
      <div style={{fontSize:10,color:t2,lineHeight:1.6}}>Semana pasada: <span style={{fontWeight:800,color:t1}}>{weeklySummary.prev}</span>. Actual: <span style={{fontWeight:800,color:t1}}>{weeklySummary.curr}</span>.{weeklySummary.diff>0?<span style={{color:"#059669",fontWeight:700}}> +{weeklySummary.diff}</span>:weeklySummary.diff<0?<span style={{color:"#DC2626",fontWeight:700}}> {weeklySummary.diff}</span>:<span style={{color:t3}}> Igual</span>}.{weeklySummary.mAvg>0&&<span> Mood: <span style={{fontWeight:800}}>{weeklySummary.mAvg}/5</span></span>}</div>
    </div>}
    <div style={{background:cd,borderRadius:16,padding:"12px 10px",marginBottom:16,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:50}}>{st.weeklyData.map((v,i)=>{const a=((new Date().getDay()+6)%7)===i;return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{width:"100%",borderRadius:5,height:Math.max((v/mW)*42,2),background:a?ac:bd,transition:"height .6s"}}/><span style={{fontSize:10,color:a?ac:t3,fontWeight:a?800:600}}>{DN[i]}</span></div>);})}</div>
    </div>

    </>}

    <button onClick={()=>setShowHist(true)} style={{width:"100%",padding:"11px",borderRadius:13,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:16}}><Ic name="clock" size={13} color={t3}/><span style={{fontSize:10,fontWeight:700,color:t2}}>Historial ({(st.history||[]).length})</span></button>
    {st.achievements.length>0&&<div style={{background:ac+"05",borderRadius:16,padding:"12px 10px",border:`1px solid ${ac}10`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}><Ic name="star" size={14} color={ac}/><span style={{fontSize:11,fontWeight:800,color:ac}}>Logros</span></div>{st.achievements.map(a=><div key={a} style={{fontSize:10,color:ac,padding:"2px 0",display:"flex",alignItems:"center",gap:5,fontWeight:600}}><div style={{width:3,height:3,borderRadius:"50%",background:ac}}/>{AM[a]||a}</div>)}</div>}
    </>}
  </div>)}

  {tab==="perfil"&&(<div className="bio-stagger" style={{padding:"14px 20px 180px"}}>
    <div style={{textAlign:"center",marginBottom:22,marginTop:12}}>
      <div style={{width:76,height:76,borderRadius:"50%",margin:"0 auto 10px",background:`linear-gradient(135deg,${ac},#6366F1)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 30px ${ac}22`,position:"relative"}}><Ic name="user" size={30} color="#fff"/>
        <div style={{position:"absolute",bottom:-2,right:-2,width:22,height:22,borderRadius:"50%",background:lv.c,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${cd}`}}><span style={{fontSize:10,fontWeight:800,color:"#fff"}}>{lv.n[0]}</span></div>
      </div>
      <div style={{fontSize:20,fontWeight:800,color:t1,letterSpacing:"-.3px"}}>Operador Neural</div>
      <StatusBadge label={nSt.label+" · "+lv.n} color={nSt.color} theme={theme} size="small" />
    </div>

    {/* Level progress */}
    <div style={{background:cd,borderRadius:16,padding:"14px",marginBottom:10,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,fontWeight:800,color:lv.c}}>{lv.n}</span>{nLv&&<span style={{fontSize:10,color:t3}}>→ {nLv.n}</span>}</div>
      <div style={{height:5,background:bd,borderRadius:5,overflow:"hidden",marginBottom:6}}><div style={{width:lPct+"%",height:"100%",borderRadius:5,background:`linear-gradient(90deg,${lv.c},${lv.c}CC)`,transition:"width 1s"}}/></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:t3}}>{lPct}%</span><span style={{fontSize:10,color:t3}}>{st.totalSessions} sesiones · {Math.round((st.totalTime||0)/60)} min · {st.streak}d racha</span></div>
    </div>

    {/* User Stats */}
    <div style={{background:cd,borderRadius:16,padding:"14px",marginBottom:10,border:`1px solid ${bd}`}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:ac}}>{st.totalSessions}</div><div style={{fontSize:10,color:t3}}>sesiones</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:t1}}>{Math.floor((st.totalTime||0)/3600)}h {Math.floor(((st.totalTime||0)%3600)/60)}m</div><div style={{fontSize:10,color:t3}}>tiempo total</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:"#D97706"}}>{st.streak}</div><div style={{fontSize:10,color:t3}}>racha</div></div>
      </div>
    </div>

    {/* Neural Fingerprint */}
    {(()=>{const fp=calcNeuralFingerprint(st);if(!fp)return null;return(
    <div style={{background:cd,borderRadius:16,padding:"14px",marginBottom:10,border:`1px solid ${bd}`}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:10}}>Tu Firma Neural</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
        <div style={{background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12,padding:"10px"}}><div style={{fontSize:10,color:t3}}>Hora pico</div><div style={{fontSize:14,fontWeight:800,color:t1}}>{fp.peakHour}:00</div></div>
        <div style={{background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12,padding:"10px"}}><div style={{fontSize:10,color:t3}}>Mejor protocolo</div><div style={{fontSize:11,fontWeight:800,color:ac}}>{fp.bestProto}</div></div>
        <div style={{background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12,padding:"10px"}}><div style={{fontSize:10,color:t3}}>Calidad promedio</div><div style={{fontSize:14,fontWeight:800,color:fp.avgQuality>=70?"#059669":fp.avgQuality>=45?"#D97706":"#DC2626"}}>{fp.avgQuality}%</div></div>
        <div style={{background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12,padding:"10px"}}><div style={{fontSize:10,color:t3}}>Tasa adaptación</div><div style={{fontSize:14,fontWeight:800,color:fp.adaptationRate>0?"#059669":"#DC2626"}}>{fp.adaptationRate>0?"+":""}{fp.adaptationRate}</div></div>
      </div>
      <div style={{fontSize:10,color:t2,lineHeight:1.5}}>Baseline cognitivo: Enfoque {fp.cognitiveBaseline.focus}% · Calma {fp.cognitiveBaseline.calm}% · Energía {fp.cognitiveBaseline.energy}%</div>
    </div>);})()}

    {/* V-Cores + Mood */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
      <div style={{background:ac+"06",borderRadius:14,padding:"14px 12px",border:`1px solid ${ac}10`}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:ac,textTransform:"uppercase",marginBottom:2}}>V-Cores</div>
        <AN value={st.vCores||0} color={ac} sz={24}/>
      </div>
      <div style={{background:cd,borderRadius:14,padding:"14px 12px",border:`1px solid ${bd}`}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:2}}>Mood</div>
        {avgMood>0?<div style={{display:"flex",alignItems:"center",gap:4}}><Ic name={MOODS[Math.round(avgMood)-1]?.icon||"neutral"} size={18} color={MOODS[Math.round(avgMood)-1]?.color||t3}/><span style={{fontSize:20,fontWeight:800,color:MOODS[Math.round(avgMood)-1]?.color||t3}}>{avgMood}</span></div>:<span style={{fontSize:11,color:t3}}>Sin datos</span>}
      </div>
    </div>

    {/* Stats */}
    <div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:10,border:`1px solid ${bd}`}}>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:12,marginTop:6}}>Estadísticas</div>
      {[{l:"Sesiones totales",v:String(st.totalSessions)},{l:"Mejor racha",v:(records.bestStreak||st.streak)+" días"},{l:"Tiempo invertido",v:Math.round((st.totalTime||0)/60)+" min"},{l:"Rendimiento neural",v:perf+"%"},{l:"Protocolos únicos",v:String([...new Set((st.history||[]).map(h=>h.p))].length)},{l:"Nivel",v:lv.n}].map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<5?`1px solid ${bd}`:"none"}}><span style={{fontSize:10,color:t3}}>{x.l}</span><span style={{fontSize:10,fontWeight:800,color:t1}}>{x.v}</span></div>)}
    </div>

    {/* Enterprise Mock */}
    <div style={{background:`linear-gradient(135deg,${isDark?"#141820":"#F0F4FF"},${isDark?"#1A1E28":"#F8FAFC"})`,borderRadius:16,padding:"16px 14px",marginBottom:10,border:`1px solid ${isDark?"#2A2E3A":"#D4DDEF"}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:"#6366F110",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic name="brief" size={16} color="#6366F1"/></div>
        <div><div style={{fontSize:12,fontWeight:800,color:t1}}>BIO-IGNICIÓN Enterprise</div><div style={{fontSize:10,color:"#6366F1",fontWeight:700}}>Para equipos y organizaciones</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
        {[{n:"Dashboard\nde equipo",ic:"chart"},{n:"Métricas\nde bienestar",ic:"up"},{n:"Challenges\ngrupales",ic:"trophy"}].map((f,i)=>
          <div key={i} style={{textAlign:"center",padding:"8px 4px",background:cd,borderRadius:10,border:`1px solid ${bd}`}}>
            <Ic name={f.ic} size={16} color="#6366F1"/><div style={{fontSize:10,color:t3,marginTop:3,lineHeight:1.3,whiteSpace:"pre-line"}}>{f.n}</div>
          </div>)}
      </div>
      <div style={{fontSize:10,color:t2,lineHeight:1.5,textAlign:"center"}}>SSO · API · HIPAA · Multi-empresa · QR Onboarding</div>
    </div>

    <div style={{display:"flex",gap:6,marginBottom:10}}>
      <button onClick={()=>setShowSettings(true)} style={{flex:1,padding:"12px",borderRadius:13,border:`1px solid ${bd}`,background:cd,fontSize:10,fontWeight:700,color:t2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Ic name="gear" size={13} color={t3}/>Ajustes</button>
      <button onClick={()=>setShowHist(true)} style={{flex:1,padding:"12px",borderRadius:13,border:`1px solid ${bd}`,background:cd,fontSize:10,fontWeight:700,color:t2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Ic name="clock" size={13} color={t3}/>Historial</button>
    </div>
    <button onClick={()=>{if(typeof window!=="undefined"&&window.confirm("¿Reiniciar todos los datos?")){setSt({...DS,weekNum:getWeekNum()});}}} style={{width:"100%",padding:"11px",borderRadius:12,border:"1px solid #FEE2E2",background:isDark?"#1A0A0A":"#FFF5F5",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer"}}>Reiniciar Datos</button>
  </div>)}

  <MetricsBar coherencia={st.coherencia} resiliencia={st.resiliencia} capacidad={st.capacidad} rD={rD} bd={bd} isDark={isDark} bg={bg} />
  <TabBar tab={tab} switchTab={switchTab} isDark={isDark} bg={bg} bd={bd} t1={t1} t3={t3} ac={ac} theme={theme} />
  </div>);
}

function RB({o,bd,cd,t3}){return<button onClick={o} style={{width:42,height:42,borderRadius:"50%",border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="reset" size={15} color={t3}/></button>;}
// SL replaced by SectionLabel component
