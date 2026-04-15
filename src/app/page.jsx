"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN v5.0 — NEURAL OPTIMIZATION PLATFORM
   ═══════════════════════════════════════════════════════════════
   Modular Architecture · Zustand · Recharts · Framer Motion
   Lucide Icons · Enhanced Neural AI · Adaptive Coaching
   ═══════════════════════════════════════════════════════════════ */

// ─── Imports from modules ─────────────────────────────────
import { P } from "../lib/protocols";
import { SCIENCE_DEEP } from "../lib/protocols";
import {
  CATS, LVL, DN, MOODS, ENERGY_LEVELS, WORK_TAGS, INTENTS, DIF_LABELS,
  SOUNDSCAPES, AM, MID_MSGS, POST_MSGS, GREETINGS, DAILY_PHRASES, PROG_7, DS, STATUS_MSGS,
} from "../lib/constants";
import {
  gL, lvPct, nxtLv, getStatus, getWeekNum, getDailyIgn, getCircadian,
  calcBioQuality, calcBurnoutIndex, calcBioSignal, calcProtoSensitivity,
  calcNeuralFingerprint, calcCognitiveEntropy, estimateCoherence,
  detectGamingPattern, calcRecoveryIndex, genIns, smartSuggest, getRecords,
  calcNeuralVariability, predictSessionImpact, calcProtocolCorrelations,
  adaptiveProtocolEngine, calcNeuralMomentum, estimateCognitiveLoad,
  analyzeNeuralRhythm, generateCoachingInsights, calcProtocolDiversity,
  analyzeStreakChain, suggestOptimalTime, interpretCalibration,
} from "../lib/neural";
import {
  hap, hapticPhase, hapticBreath, startAmbient, stopAmbient,
  startSoundscape, stopSoundscape, startBinaural, stopBinaural,
  setupMotionDetection, requestWakeLock, releaseWakeLock,
  unlockVoice, speak, speakNow, stopVoice, loadVoices,
  ldS, svS, exportData,
} from "../lib/audio";
import { useStore } from "../store/useStore";
import Icon from "../components/Icon";

// Dynamic imports (code-split)
const NeuralRadar = dynamic(() => import("../components/NeuralRadar"), { ssr: false });
const NeuralCoach = dynamic(() => import("../components/NeuralCoach"), { ssr: false });
const BreathOrb = dynamic(() => import("../components/BreathOrb"), { ssr: false });
const NeuralCalibration = dynamic(() => import("../components/NeuralCalibration"), { ssr: false });
const ProtocolDetail = dynamic(() => import("../components/ProtocolDetail"), { ssr: false });
const WeeklyReport = dynamic(() => import("../components/WeeklyReport"), { ssr: false });
const CorrelationMatrix = dynamic(() => import("../components/CorrelationMatrix"), { ssr: false });
const StreakShield = dynamic(() => import("../components/StreakShield"), { ssr: false });
const TemporalCharts = dynamic(() => import("../components/TemporalCharts").then(mod => ({
  default: ({ type, ...props }) => {
    if (type === "mood") return <mod.MoodTrendChart {...props} />;
    if (type === "energy") return <mod.EnergyFlowChart {...props} />;
    if (type === "heatmap") return <mod.ActivityHeatmap {...props} />;
    if (type === "weekly") return <mod.WeeklyChart {...props} />;
    if (type === "sparkline") return <mod.CoherenceSparkline {...props} />;
    return null;
  }
})), { ssr: false });

/* ═══ ANIMATED NUMBER ═══ */
function AN({value,sfx="",color="#0F172A",sz=32}){const[d,sD]=useState(0);const rf=useRef(null);useEffect(()=>{let s=d;const e=value;const t0=performance.now();function step(n){const p=Math.min((n-t0)/700,1);sD(Math.round(s+(1-Math.pow(1-p,3))*(e-s)));if(p<1)rf.current=requestAnimationFrame(step);}rf.current=requestAnimationFrame(step);return()=>{if(rf.current)cancelAnimationFrame(rf.current);};},[value]);return<span style={{fontSize:sz,fontWeight:800,color,fontFamily:"'Manrope',sans-serif",letterSpacing:"-1px"}}>{d}{sfx}</span>;}

/* ═══ PHASE VISUAL (fallback for non-breath phases) ═══ */
function PhaseVisual({type,color,scale=1,active}){
  if(!active)return null;
  const o=.12;const s={display:"block",margin:"0 auto 4px"};
  if(type==="breath")return(<svg width="90" height="76" viewBox="0 0 90 76" style={s}><g transform={`translate(45,38) scale(${scale})`} style={{transition:"transform 1.2s cubic-bezier(.4,0,.2,1)",transformOrigin:"center"}}><path d="M-4,-24 C-4,-24 -24,-15 -26,3 C-28,20 -17,28 -9,28 C-3,28 -4,22 -4,11 Z" fill={color} opacity={o} stroke={color} strokeWidth=".7"/><path d="M4,-24 C4,-24 24,-15 26,3 C28,20 17,28 9,28 C3,28 4,22 4,11 Z" fill={color} opacity={o} stroke={color} strokeWidth=".7"/><line x1="0" y1="-30" x2="0" y2="-18" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity=".35"/>{[0,1,2,3,4].map(i=><circle key={i} cx={(i-2)*3} cy={-30+((scale-1)*(35+i*5))} r={1+i*.2} fill={color} opacity={scale>1.08?(.2+i*.12):.02} style={{transition:`all ${1+i*.15}s ease`}}/>)}</g></svg>);
  if(type==="body")return(<svg width="90" height="76" viewBox="0 0 90 76" style={s}><g style={{animation:"heartBeat 1.1s ease infinite",transformOrigin:"45px 35px"}}><path d="M45,64 C45,64 14,44 14,26 C14,15 22,9 31,9 C38,9 42,13 45,18 C48,13 52,9 59,9 C67,9 75,15 75,26 C75,44 45,64 45,64Z" fill={color} opacity={o} stroke={color} strokeWidth=".8"/><polyline points="20,36 30,36 34,24 38,46 42,30 46,38 50,32 54,36 58,36 64,36 70,36" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity=".3" style={{animation:"ecgDraw 1.1s linear infinite"}}/></g></svg>);
  if(type==="mind")return(<svg width="90" height="76" viewBox="0 0 90 76" style={s}><path d="M45,8 C31,8 20,15 18,27 C16,37 20,46 25,50 C29,54 31,58 31,63 L59,63 C59,58 61,54 65,50 C69,46 73,37 71,27 C69,15 58,8 45,8Z" fill={color} opacity={.05} stroke={color} strokeWidth=".7"/><circle cx="33" cy="30" r="7" fill={color} opacity=".06" style={{animation:"brainPulse 2.5s ease infinite"}}/><circle cx="57" cy="28" r="6" fill={color} opacity=".05" style={{animation:"brainPulse 2.5s ease infinite .7s"}}/><circle cx="45" cy="42" r="8" fill={color} opacity=".07" style={{animation:"brainPulse 3s ease infinite 1.4s"}}/>{[[35,24],[52,22],[40,48],[58,40],[28,42],[48,32]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.2" fill={color} opacity=".4" style={{animation:`neuralSpark ${1.2+i*.3}s ease infinite ${i*.25}s`}}/>)}</svg>);
  if(type==="focus")return(<svg width="90" height="76" viewBox="0 0 90 76" style={s}><circle cx="45" cy="38" r="28" fill="none" stroke={color} strokeWidth=".6" opacity=".1" strokeDasharray="5 3" style={{animation:"focusSpin 14s linear infinite",transformOrigin:"45px 38px"}}/><circle cx="45" cy="38" r="12" fill="none" stroke={color} strokeWidth=".8" opacity=".12" style={{animation:"focusLock 2.5s ease infinite"}}/><circle cx="45" cy="38" r="5" fill={color} opacity=".06" style={{animation:"focusLock 2s ease infinite .2s"}}/><line x1="45" y1="6" x2="45" y2="24" stroke={color} strokeWidth=".8" opacity=".2" strokeLinecap="round"/><line x1="45" y1="52" x2="45" y2="70" stroke={color} strokeWidth=".8" opacity=".2" strokeLinecap="round"/><line x1="13" y1="38" x2="31" y2="38" stroke={color} strokeWidth=".8" opacity=".2" strokeLinecap="round"/><line x1="59" y1="38" x2="77" y2="38" stroke={color} strokeWidth=".8" opacity=".2" strokeLinecap="round"/><circle cx="45" cy="38" r="2" fill={color} opacity=".5"/></svg>);
  return null;
}

/* ═══ NOM-035 EXPORT ═══ */
function exportNOM035(st){try{
  const ml=st.moodLog||[];const h=st.history||[];const now=new Date();
  const totalMin=Math.round((st.totalTime||0)/60);
  const avgMd=ml.length?+(ml.reduce((a,m)=>a+m.mood,0)/ml.length).toFixed(1):0;
  const withPre=ml.filter(m=>m.pre>0);
  const delta=withPre.length?+(withPre.reduce((a,m)=>a+(m.mood-m.pre),0)/withPre.length).toFixed(2):0;
  const riskCount=ml.filter(m=>m.mood<=2).length;
  const riskPct=ml.length?Math.round((riskCount/ml.length)*100):0;
  const protos={};h.forEach(x=>{protos[x.p]=(protos[x.p]||0)+1;});
  const topProtos=Object.entries(protos).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const uniqueDays=new Set(h.map(x=>new Date(x.ts).toDateString())).size;
  const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe NOM-035</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;color:#0F172A;background:#fff;padding:40px;max-width:800px;margin:0 auto;font-size:14px}.header{border-bottom:3px solid #059669;padding-bottom:20px;margin-bottom:30px}.logo{font-size:24px;font-weight:800;color:#059669}h2{font-size:16px;margin:28px 0 14px;border-bottom:1px solid #E2E8F0;padding-bottom:6px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}.card{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px}.card .v{font-size:22px;font-weight:800}.card .l{font-size:10px;color:#64748B;margin-top:2px;text-transform:uppercase}.imp{font-size:28px;font-weight:800;color:${delta>=0?"#059669":"#DC2626"};text-align:center;padding:20px;background:${delta>=0?"#F0FDF4":"#FEF2F2"};border-radius:12px;margin-bottom:20px}.footer{margin-top:40px;border-top:2px solid #E2E8F0;padding-top:16px;font-size:10px;color:#94A3B8;text-align:center}</style></head><body><div class="header"><div class="logo">BIO-IGNICIÓN</div><div style="font-size:11px;color:#64748B;margin-top:4px">Informe de Bienestar Laboral — NOM-035-STPS-2018</div><div style="font-size:11px;color:#475569;margin-top:8px">Fecha: ${now.toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"})}</div></div><h2>Resumen</h2><div class="grid"><div class="card"><div class="v">${st.totalSessions}</div><div class="l">Sesiones</div></div><div class="card"><div class="v">${totalMin}min</div><div class="l">Tiempo</div></div><div class="card"><div class="v">${uniqueDays}</div><div class="l">Días activos</div></div></div><div class="imp">${delta>=0?"+":""}${delta} puntos<br><span style="font-size:11px;font-weight:400;color:#64748B">Mejora promedio por sesión</span></div><h2>Protocolos</h2>${topProtos.map(([n,c])=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9"><span>${n}</span><span>${c}x (${Math.round(c/st.totalSessions*100)}%)</span></div>`).join("")}<h2>Riesgo</h2><div style="padding:14px;background:${riskPct>30?"#FEF2F2":"#F0FDF4"};border-radius:10px;margin-bottom:20px"><div style="font-size:20px;font-weight:800;color:${riskPct>30?"#DC2626":"#059669"}">${riskPct}%</div><div style="font-size:11px;color:${riskPct>30?"#DC2626":"#059669"}">Sesiones con tensión alta</div></div><div class="footer"><p><strong>BIO-IGNICIÓN</strong> — Generado: ${now.toLocaleString("es-MX")}</p></div></body></html>`;
  const blob=new Blob([html],{type:"text/html"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`NOM035-${now.toISOString().split("T")[0]}.html`;a.click();URL.revokeObjectURL(url);
}catch(e){console.error(e);}}

function groupHist(h){const n=new Date();const td=n.toDateString();const yd=new Date(Date.now()-864e5).toDateString();const g={hoy:[],ayer:[],antes:[]};for(const x of h){const d=new Date(x.ts).toDateString();if(d===td)g.hoy.push(x);else if(d===yd)g.ayer.push(x);else g.antes.push(x);}return g;}

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
  const[selSS,setSelSS]=useState("off");
  const[durMult,setDurMult]=useState(1);
  const[entryDone,setEntryDone]=useState(false);
  const[nfcCtx,setNfcCtx]=useState(null);
  const[voiceOn,setVoiceOn]=useState(true);
  const[sessionData,setSessionData]=useState({pauses:0,scienceViews:0,phaseTimings:[]});
  const[showPredict,setShowPredict]=useState(false);
  const[showCalibration,setShowCalibration]=useState(false);
  const[showProtoDetail,setShowProtoDetail]=useState(false);
  const[showMore,setShowMore]=useState(false);
  const iR=useRef(null);const bR=useRef(null);const tR=useRef(null);const cdR=useRef(null);

  const setSt=useCallback(v=>{const nv=typeof v==="function"?v(st):v;setSt_(nv);svS(nv);},[st]);

  // ═══ Service Worker Registration ═══
  useEffect(()=>{if(typeof navigator!=="undefined"&&"serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(()=>{});}},[]);

  // ═══ NFC/QR DEEP LINK ═══
  useEffect(()=>{if(typeof window==="undefined")return;try{const params=new URLSearchParams(window.location.search);const c=params.get("c"),t=params.get("t"),e=params.get("e");if(c||t){setNfcCtx({company:c||"",type:t||"entrada",employee:e||""});setEntryDone(true);
    const isExit=t==="salida"||t==="exit";const h=new Date().getHours();
    let pool=isExit?P.filter(p=>p.int==="calma"||p.int==="reset"):h<12?P.filter(p=>p.int==="energia"||p.int==="enfoque"):P.filter(p=>p.int==="enfoque"||p.int==="reset");
    const pick=pool[Math.floor(Math.random()*pool.length)]||P[0];setPr(pick);setSec(Math.round(pick.d*durMult));
  }}catch(e){};},[]);

  // ═══ VOICE ═══
  useEffect(()=>{if(typeof window==="undefined"||!window.speechSynthesis)return;loadVoices();window.speechSynthesis.addEventListener("voiceschanged",loadVoices);return()=>{try{window.speechSynthesis.removeEventListener("voiceschanged",loadVoices);}catch(e){}};},[]);

  // ═══ LOAD STATE ═══
  useEffect(()=>{setMt(true);const l=ldS(DS);const cw=getWeekNum();let mod=false;if(l.weekNum!==null&&l.weekNum!==cw){l.prevWeekData=[...l.weeklyData];l.weeklyData=[0,0,0,0,0,0,0];l.weekNum=cw;mod=true;}if(l.weekNum===null){l.weekNum=cw;mod=true;}setSt_(l);if(mod)svS(l);if(l.totalSessions===0)setOnboard(true);else setGreeting(GREETINGS[Math.floor(Math.random()*GREETINGS.length)]);
    // Auto-select best protocol via adaptive engine
    try{const rec=adaptiveProtocolEngine(l);if(rec&&rec.primary){setPr(rec.primary.protocol);setSec(Math.round(rec.primary.protocol.d*durMult));}}catch(e){}
  },[]);

  useEffect(()=>{if(ts!=="running"||typeof document==="undefined")return;function onVis(){if(document.visibilityState==="hidden"&&ts==="running"){pa();}}document.addEventListener("visibilitychange",onVis);return()=>document.removeEventListener("visibilitychange",onVis);},[ts]);
  useEffect(()=>{if(!mt||typeof window==="undefined")return;const save=()=>svS(st);const iv=setInterval(save,30000);const onHide=()=>{if(document.visibilityState==="hidden")svS(st);};window.addEventListener("beforeunload",save);window.addEventListener("pagehide",save);document.addEventListener("visibilitychange",onHide);return()=>{clearInterval(iv);window.removeEventListener("beforeunload",save);window.removeEventListener("pagehide",save);document.removeEventListener("visibilitychange",onHide);};},[mt,st]);
  const[isDark,setIsDark]=useState(false);
  useEffect(()=>{if(!mt)return;function ck(){const h=new Date().getHours();const m=st.themeMode||"auto";if(m==="dark")setIsDark(true);else if(m==="light")setIsDark(false);else setIsDark(h>=20||h<6);}ck();const iv=setInterval(ck,60000);return()=>clearInterval(iv);},[mt,st.themeMode]);
  const H=useCallback(t=>hap(t,st.soundOn,st.hapticOn),[st.soundOn,st.hapticOn]);

  const motionRef=useRef(null);const circadian=useMemo(()=>getCircadian(),[]);
  useEffect(()=>{if(ts==="running"&&st.soundOn!==false){const ss=st.soundscape||"off";if(ss!=="off")startSoundscape(ss);else startAmbient();startBinaural(pr.int);}else{stopAmbient();stopSoundscape();stopBinaural();}return()=>{stopAmbient();stopSoundscape();stopBinaural();};},[ts]);
  useEffect(()=>{if(ts==="running"){motionRef.current=setupMotionDetection(({samples,stability})=>{setSessionData(d=>({...d,motionSamples:samples,stability:stability}));});}return()=>{if(motionRef.current){motionRef.current.cleanup();motionRef.current=null;}};},[ts]);

  useEffect(()=>{if(ts==="running"){iR.current=setInterval(()=>{setSec(p=>{if(p<=1){clearInterval(iR.current);setTs("done");H("ok");return 0;}return p-1;});},1000);tR.current=setInterval(()=>H("tick"),4000);}return()=>{if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);};},[ts]);
  const totalDur=Math.round(pr.d*durMult);
  useEffect(()=>{const el=totalDur-sec;const scale=durMult;let idx=0;for(let i=pr.ph.length-1;i>=0;i--){if(el>=Math.round(pr.ph[i].s*scale)){idx=i;break;}}
    if(idx!==pi){setPi(idx);hapticPhase(pr.ph[idx].ic);speakNow("Fase "+(idx+1)+" de "+pr.ph.length+". "+pr.ph[idx].k,circadian,voiceOn);setTimeout(()=>{try{if(document.visibilityState==="visible")speak(pr.ph[idx].i,circadian,voiceOn);}catch(e){}},2500);}
    const nxtIdx=pi<pr.ph.length-1?pi+1:null;if(nxtIdx!==null){const nxtStart=Math.round(pr.ph[nxtIdx].s*scale);const ttN=nxtStart-el;if(ttN===2&&ts==="running")speak("Prepárate",circadian,voiceOn);}
  },[sec,pr,durMult]);
  useEffect(()=>{if(ts==="running"&&sec===60){setMidMsg(MID_MSGS[Math.floor(Math.random()*MID_MSGS.length)]);setShowMid(true);setTimeout(()=>setShowMid(false),3500);}if(ts==="running"&&sec===30){setMidMsg("Últimos 30. Cierra con todo.");setShowMid(true);setTimeout(()=>setShowMid(false),3000);}},[sec,ts]);
  useEffect(()=>{if(ts==="done"&&sec===0)comp();},[ts,sec]);
  useEffect(()=>{if(bR.current)clearInterval(bR.current);const ph=pr.ph[pi];if(ts!=="running"){setBL("");setBS(1);setBCnt(0);return;}if(!ph.br){setBL("");setBS(1);setBCnt(0);const elapsed=totalDur-sec;if(elapsed>0&&elapsed%20===0&&ts==="running")speak("Mantén la atención en la instrucción",circadian,voiceOn);return;}const b=ph.br;const cy=b.in+(b.h1||0)+b.ex+(b.h2||0);let t=0;let lastLabel="";function tk(){const p=t%cy;let lbl="";if(p<b.in){lbl="INHALA";setBS(1+.25*(p/b.in));setBCnt(b.in-p);}else if(p<b.in+(b.h1||0)){lbl="MANTÉN";setBS(1.25);setBCnt(b.in+(b.h1||0)-p);}else if(p<b.in+(b.h1||0)+b.ex){const ep=p-b.in-(b.h1||0);lbl="EXHALA";setBS(1.25-.25*(ep/b.ex));setBCnt(b.ex-ep);}else{lbl="SOSTÉN";setBS(1);setBCnt(cy-p);}setBL(lbl);if(lbl!==lastLabel){if(t%2===0||lbl==="INHALA")speak(lbl.toLowerCase(),circadian,voiceOn);hapticBreath(lbl);lastLabel=lbl;}t++;}tk();bR.current=setInterval(tk,1000);return()=>{if(bR.current)clearInterval(bR.current);};},[ts,pi,pr]);

  function startCountdown(){setCountdown(3);H("tap");speakNow("Tres",circadian,voiceOn);cdR.current=setInterval(()=>{setCountdown(p=>{if(p<=1){clearInterval(cdR.current);setTs("running");H("go");speakNow(pr.ph[0].k||"Comienza",circadian,voiceOn);setGreeting("");return 0;}speakNow(p===2?"Dos":"Uno",circadian,voiceOn);H("tap");return p-1;});},1000);}
  function go(){unlockVoice();requestWakeLock();try{if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();}catch(e){}setPostStep("none");setSessionData({pauses:0,scienceViews:0,interactions:0,touchHolds:0,motionSamples:0,stability:0,reactionTimes:[],phaseTimings:[]});startCountdown();}
  const pauseTRef=useRef(null);
  function pa(){if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);setTs("paused");stopVoice();stopBinaural();releaseWakeLock();setSessionData(d=>({...d,pauses:d.pauses+1}));if(pauseTRef.current)clearTimeout(pauseTRef.current);pauseTRef.current=setTimeout(()=>{rs();},300000);}
  function rs(){releaseWakeLock();if(pauseTRef.current)clearTimeout(pauseTRef.current);try{if(document.fullscreenElement)document.exitFullscreen();}catch(e){}if(iR.current)clearInterval(iR.current);if(bR.current)clearInterval(bR.current);if(tR.current)clearInterval(tR.current);if(cdR.current)clearInterval(cdR.current);setTs("idle");setSec(Math.round(pr.d*durMult));setPi(0);setBL("");setBS(1);setBCnt(0);setShowMid(false);setPostStep("none");setCheckMood(0);setCheckEnergy(0);setCheckTag("");setPreMood(0);setCountdown(0);setCompFlash(false);stopVoice();}
  function sp(p){rs();setPr(p);setSl(false);setShowIntent(false);setSec(Math.round(p.d*durMult));setShowScience(false);}
  function timerTap(){unlockVoice();H("tap");if(ts==="idle"){go();}else if(ts==="running")pa();else if(ts==="paused"){if(pauseTRef.current)clearTimeout(pauseTRef.current);setTs("running");H("go");speakNow("continúa",circadian,voiceOn);requestWakeLock();if(st.soundOn!==false)startBinaural(pr.int);}}
  function switchTab(id){if(id===tab)return;setTabFade(0);setTimeout(()=>{setTab(id);setTimeout(()=>setTabFade(1),30);},180);H("tap");}

  function comp(){if(pauseTRef.current)clearTimeout(pauseTRef.current);if(motionRef.current){motionRef.current.cleanup();motionRef.current=null;}
    const td=new Date().toDateString();const di=new Date().getDay();const ad=di===0?6:di-1;const nw=[...st.weeklyData];nw[ad]=(nw[ad]||0)+1;const ys=new Date(Date.now()-864e5).toDateString();let nsk=st.lastDate===td?st.streak:st.lastDate===ys?st.streak+1:1;
    const ml=st.moodLog||[];const hist=st.history||[];
    const recentDeltas=ml.filter(m=>m.pre>0).slice(-10);
    const avgDelta=recentDeltas.length>=2?recentDeltas.reduce((a,m)=>a+(m.mood-m.pre),0)/recentDeltas.length:0;
    const cohBoost=Math.max(0,Math.min(8,Math.round(avgDelta*3+2)));
    const cohDecay=avgDelta<=0&&recentDeltas.length>=3?-3:0;
    const nC=Math.min(100,Math.max(20,recentDeltas.length>=3?Math.round(50+avgDelta*15+recentDeltas.length*2+cohDecay):st.coherencia+cohBoost+cohDecay));
    const weekTotal=nw.reduce((a,b)=>a+b,0);const consistencyScore=Math.min(7,weekTotal)/7;const streakBonus=Math.min(30,nsk)*0.5;
    const nR=Math.min(100,Math.max(20,Math.round(40+consistencyScore*30+streakBonus)));
    const uniqueProtos=new Set([...hist.map(h=>h.p),pr.n]).size;const diversityScore=(uniqueProtos/14)*30;const expScore=Math.min(30,Math.sqrt(st.totalSessions||0)*3);
    const nE=Math.min(100,Math.max(20,Math.round(30+diversityScore+expScore)));
    const ns=st.totalSessions+1;
    const bioQ=calcBioQuality(sessionData);const gamingCheck=detectGamingPattern(hist);
    if(gamingCheck.gaming){bioQ.score=Math.min(bioQ.score,20);bioQ.quality="inválida";}
    const qualityMult=bioQ.quality==="alta"?1.5:bioQ.quality==="media"?1.0:bioQ.quality==="baja"?0.5:0.2;
    const eVC=Math.max(3,Math.round((5+(cohBoost*1.5)+(consistencyScore*5)+(uniqueProtos*0.5))*qualityMult));
    const vc=(st.vCores||0)+eVC;const ach=[...st.achievements];
    if(nsk>=7&&!ach.includes("streak7"))ach.push("streak7");if(nsk>=30&&!ach.includes("streak30"))ach.push("streak30");
    if(nC>=90&&!ach.includes("coherencia90"))ach.push("coherencia90");if(ns>=50&&!ach.includes("sessions50"))ach.push("sessions50");
    if(ns>=100&&!ach.includes("sessions100"))ach.push("sessions100");
    const totalT=(st.totalTime||0)+Math.round(pr.d*durMult);if(totalT>=3600&&!ach.includes("time60"))ach.push("time60");
    const hr=new Date().getHours();if(hr<7&&!ach.includes("earlyBird"))ach.push("earlyBird");if(hr>=22&&!ach.includes("nightOwl"))ach.push("nightOwl");
    const uP=new Set([...hist.map(h=>h.p),pr.n]);if(uP.size>=14&&!ach.includes("allProtos"))ach.push("allProtos");
    const burnout=calcBurnoutIndex(ml,hist);const bioSignal=calcBioSignal(st);
    const newHist=[...hist,{p:pr.n,ts:Date.now(),vc:eVC,c:nC,r:nR,dur:Math.round(pr.d*durMult),ctx:nfcCtx?.type||"manual",bioQ:bioQ.score,quality:bioQ.quality,interactions:sessionData.interactions||0,motionSamples:sessionData.motionSamples||0,pauses:sessionData.pauses||0,burnoutIdx:burnout.index,circadian:circadian.period,bioSignal:bioSignal.score}].slice(-200);
    setPostVC(eVC);setPostMsg(POST_MSGS[Math.floor(Math.random()*POST_MSGS.length)]);
    releaseWakeLock();speakNow(bioQ.quality==="alta"?"Sesión excelente":"Sesión completada",circadian,voiceOn);
    setCompFlash(true);setTimeout(()=>{setCompFlash(false);setPostStep("breathe");},800);
    setCheckMood(0);setCheckEnergy(0);setCheckTag("");
    setSt({...st,totalSessions:ns,streak:nsk,todaySessions:st.lastDate===td?st.todaySessions+1:1,lastDate:td,weeklyData:nw,weekNum:getWeekNum(),coherencia:nC,resiliencia:nR,capacidad:nE,achievements:ach,vCores:vc,history:newHist,totalTime:totalT,firstDone:true,progDay:Math.min((st.progDay||0)+1,7)});
  }
  function submitCheckin(){
    if(checkMood>0){const ml=[...(st.moodLog||[]),{ts:Date.now(),mood:checkMood,energy:checkEnergy||2,tag:checkTag,proto:pr.n,pre:preMood||0}].slice(-100);const ach=[...st.achievements];if(checkMood===5&&!ach.includes("mood5"))ach.push("mood5");setSt({...st,moodLog:ml,achievements:ach});}
    setPostStep("summary");
  }

  const lv=gL(st.totalSessions),ph=pr.ph[pi],fl=INTENTS.some(i=>i.id===sc)?P.filter(p=>p.int===sc):P.filter(p=>p.ct===sc),mW=Math.max(...st.weeklyData,1);
  const pct=(totalDur-sec)/totalDur,CI=2*Math.PI*116,dO=CI*(1-pct),ins=genIns(st),isBr=ts==="running"&&ph.br;
  const perf=Math.round((st.coherencia+st.resiliencia+st.capacidad)/3);
  const bioSignal=useMemo(()=>calcBioSignal(st),[st.coherencia,st.resiliencia,st.capacidad,st.moodLog,st.weeklyData,st.history]);
  const burnout=useMemo(()=>calcBurnoutIndex(st.moodLog,st.history),[st.moodLog,st.history]);
  const protoSens=useMemo(()=>calcProtoSensitivity(st.moodLog),[st.moodLog]);
  const nSt=getStatus(perf);const lPct=lvPct(st.totalSessions);const nLv=nxtLv(st.totalSessions);
  const isActive=ts==="running";const noData=st.totalSessions===0;
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
  const weeklySummary=useMemo(()=>{const pw=st.prevWeekData||[0,0,0,0,0,0,0];const pwTotal=pw.reduce((a,b)=>a+b,0);const cwTotal=st.weeklyData.reduce((a,b)=>a+b,0);if(pwTotal===0)return null;const diff=cwTotal-pwTotal;const ml=st.moodLog||[];const weekMoods=ml.slice(-7);const mAvg=weekMoods.length?+(weekMoods.reduce((a,m)=>a+m.mood,0)/weekMoods.length).toFixed(1):0;return{prev:pwTotal,curr:cwTotal,diff,mAvg};},[st.prevWeekData,st.weeklyData,st.moodLog]);
  // Adaptive AI recommendation (replaces old smartPick)
  const aiRec=useMemo(()=>{try{return adaptiveProtocolEngine(st);}catch(e){return null;}},[st.moodLog,st.history,st.weeklyData]);
  const smartPick=aiRec?.primary?.protocol||null;
  const daily=useMemo(()=>getDailyIgn(st),[st.moodLog]);
  const progStep=PROG_7[(st.progDay||0)%7];
  const prediction=useMemo(()=>predictSessionImpact(st,pr),[st.moodLog,pr.id]);
  const neuralVar=useMemo(()=>calcNeuralVariability(st.history),[st.history]);
  const cogLoad=useMemo(()=>estimateCognitiveLoad(st),[st.todaySessions,st.moodLog]);

  const bg=isDark?"#0B0E14":"#F1F4F9",cd=isDark?"#141820":"#FFFFFF",bd=isDark?"#1E2330":"#E2E8F0";
  const t1=isDark?"#E8ECF4":"#0F172A",t2=isDark?"#8B95A8":"#475569",t3=isDark?"#4B5568":"#94A3B8",ac=pr.cl;

  // ─── Loading screen ─────────────────────────────────────
  if(!mt)return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0B0E14",gap:16}}>
    <motion.div animate={{scale:[1,1.06,1],opacity:[.7,1,.7]}} transition={{duration:1.8,repeat:Infinity,ease:"easeInOut"}}>
      <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="#059669" strokeWidth="2" opacity=".3"/><circle cx="26" cy="26" r="16" fill="none" stroke="#6366F1" strokeWidth="2" opacity=".3"/><circle cx="26" cy="26" r="5" fill="#059669" opacity=".4"/></svg>
    </motion.div>
    <div style={{fontSize:10,fontWeight:800,color:"#94A3B8",letterSpacing:6,textTransform:"uppercase"}}>BIO-IGNICIÓN</div>
    <div style={{fontSize:10,color:"#4B5568",marginTop:-8}}>v5.0 — Neural Engine IA</div>
  </div>);

  return(
  <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:bg,position:"relative",overflow:"hidden",fontFamily:"'Manrope',-apple-system,sans-serif",transition:"background .8s"}}>

  {/* Background aura */}
  <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}><div style={{position:"absolute",top:"-15%",right:"-15%",width:"50%",height:"50%",borderRadius:"50%",background:`radial-gradient(circle,${ac}${isDark?"12":"08"},transparent)`,animation:"am 25s ease-in-out infinite",filter:"blur(50px)"}}/><div style={{position:"absolute",bottom:"-10%",left:"-10%",width:"40%",height:"40%",borderRadius:"50%",background:`radial-gradient(circle,#818CF8${isDark?"10":"08"},transparent)`,animation:"am 30s ease-in-out infinite reverse",filter:"blur(45px)"}}/></div>

  {/* Mid-session message */}
  <AnimatePresence>
  {showMid&&<motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:180,pointerEvents:"none"}}><div style={{background:cd,borderRadius:16,padding:"14px 22px",boxShadow:"0 8px 30px rgba(0,0,0,.08)",border:`1px solid ${bd}`,maxWidth:320,textAlign:"center"}}><div style={{fontSize:13,fontWeight:600,color:t1,lineHeight:1.6,fontStyle:"italic"}}>{midMsg}</div></div></motion.div>}
  </AnimatePresence>

  {/* Countdown */}
  <AnimatePresence>
  {countdown>0&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:240,background:`${bg}DD`,backdropFilter:"blur(30px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <motion.div key={countdown} initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:1.5,opacity:0}} transition={{type:"spring",stiffness:200,damping:15}}>
      <div style={{fontSize:96,fontWeight:800,color:ac}}>{countdown}</div>
    </motion.div>
  </motion.div>}
  </AnimatePresence>

  {compFlash&&<div style={{position:"fixed",inset:0,zIndex:230,background:`${ac}12`,animation:"compFlash .8s ease forwards",pointerEvents:"none"}}/>}

  {/* ═══ ONBOARDING — Neural Calibration Flow ═══ */}
  <AnimatePresence>
  {(onboard||showCalibration)&&<NeuralCalibration isDark={isDark} onComplete={(baseline)=>{
    setOnboard(false);setShowCalibration(false);unlockVoice();
    const nst={...st,neuralBaseline:baseline,onboardingComplete:true,calibrationHistory:[...(st.calibrationHistory||[]),{...baseline,ts:Date.now()}].slice(-10),sessionGoal:baseline.recommendations?.sessionGoal||2};
    setSt(nst);
    const d=getDailyIgn(nst);if(d&&d.proto){setPr(d.proto);setSec(Math.round(d.proto.d*durMult));}
    const ach=[...nst.achievements];if(!ach.includes("calibrated")){ach.push("calibrated");setSt({...nst,achievements:ach});}
  }}/>}
  </AnimatePresence>

  {/* ═══ PROTOCOL DETAIL VIEW ═══ */}
  <AnimatePresence>
  {showProtoDetail&&<ProtocolDetail protocol={pr} st={st} isDark={isDark} durMult={durMult} onClose={()=>setShowProtoDetail(false)} onStart={(p)=>{setShowProtoDetail(false);sp(p);go();}}/>}
  </AnimatePresence>

  {/* ═══ POST: BREATHE ═══ */}
  <AnimatePresence>
  {postStep==="breathe"&&ts==="done"&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:220,background:bg+"F8",backdropFilter:"blur(30px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
    {/* Breathing orb celebration */}
    <motion.div animate={{scale:[1,1.12,1],opacity:[.3,.6,.3]}} transition={{duration:4,repeat:Infinity,ease:"easeInOut"}} style={{width:100,height:100,borderRadius:"50%",background:`radial-gradient(circle,${ac}12,${ac}06,transparent)`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <motion.div animate={{scale:[1,1.08,1]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut",delay:.5}} style={{width:60,height:60,borderRadius:"50%",background:`radial-gradient(circle,${ac}18,transparent)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <motion.div animate={{opacity:[.3,.8,.3],boxShadow:[`0 0 10px ${ac}20`,`0 0 30px ${ac}40`,`0 0 10px ${ac}20`]}} transition={{duration:2.5,repeat:Infinity}} style={{width:14,height:14,borderRadius:"50%",background:ac}}/>
      </motion.div>
      {/* Orbiting dots */}
      {[0,1,2].map(i=><motion.div key={i} animate={{rotate:360}} transition={{duration:6+i*2,repeat:Infinity,ease:"linear"}} style={{position:"absolute",inset:0}}><div style={{position:"absolute",top:i*6,left:"50%",width:3,height:3,borderRadius:"50%",background:ac,opacity:.3+i*.1}}/></motion.div>)}
    </motion.div>
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.3}} style={{textAlign:"center",marginTop:24}}>
      <div style={{fontSize:16,fontWeight:700,color:t1,lineHeight:1.6}}>Quédate un momento con esta sensación.</div>
      <div style={{fontSize:12,color:t3,marginTop:8,lineHeight:1.5}}>Tu sistema nervioso cambió en {Math.round(pr.d*durMult)} segundos.</div>
    </motion.div>
    <motion.button initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.5}} whileTap={{scale:.96}} onClick={()=>setPostStep("checkin")} style={{marginTop:28,padding:"13px 36px",borderRadius:50,background:"none",border:`1.5px solid ${ac}30`,color:ac,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1}}>Continuar</motion.button>
  </motion.div>}
  </AnimatePresence>

  {/* ═══ POST: CHECK-IN ═══ */}
  <AnimatePresence>
  {postStep==="checkin"&&ts==="done"&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:220,background:`${bg}F5`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <motion.div initial={{scale:.9}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:20}} style={{background:cd,borderRadius:28,padding:"28px 22px",maxWidth:400,width:"100%"}}>
    <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:17,fontWeight:800,color:t1}}>¿Cómo te sientes?</div><div style={{fontSize:11,color:t3,marginTop:4}}>1 toque. Tu progreso depende de esto.</div></div>
    <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:18}}>{MOODS.map(m=>(
      <motion.button key={m.id} whileTap={{scale:.93}} onClick={()=>{setCheckMood(m.value);H("tap");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"8px 4px",borderRadius:13,border:checkMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:checkMood===m.value?m.color+"0A":cd,cursor:"pointer",transition:"all .2s",minWidth:56,flex:1}}>
        <Icon name={m.icon} size={20} color={checkMood===m.value?m.color:t3}/>
        <span style={{fontSize:10,fontWeight:700,color:checkMood===m.value?m.color:t3,textAlign:"center",lineHeight:1.2}}>{m.label}</span>
      </motion.button>))}</div>
    <div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Energía</div><div style={{display:"flex",gap:7}}>{ENERGY_LEVELS.map(e=>(
      <motion.button key={e.id} whileTap={{scale:.95}} onClick={()=>{setCheckEnergy(e.v);H("tap");}} style={{flex:1,padding:"9px",borderRadius:11,border:checkEnergy===e.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:checkEnergy===e.v?ac+"08":cd,color:checkEnergy===e.v?ac:t3,fontSize:11,fontWeight:700,cursor:"pointer"}}>{e.label}</motion.button>))}</div></div>
    <div style={{marginBottom:18}}><div style={{fontSize:10,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Contexto</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{WORK_TAGS.map(tg=>(
      <button key={tg} onClick={()=>{setCheckTag(checkTag===tg?"":tg);H("tap");}} style={{padding:"5px 11px",borderRadius:18,border:checkTag===tg?`1.5px solid ${ac}`:`1px solid ${bd}`,background:checkTag===tg?ac+"08":cd,color:checkTag===tg?ac:t3,fontSize:10,fontWeight:600,cursor:"pointer"}}>{tg}</button>))}</div></div>
    <motion.button whileTap={{scale:.96}} onClick={submitCheckin} style={{width:"100%",padding:"14px",borderRadius:50,background:checkMood>0?ac:bd,border:"none",color:checkMood>0?"#fff":t3,fontSize:12,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>{checkMood>0?"CONTINUAR":"SELECCIONA ESTADO"}</motion.button>
    <button onClick={()=>{setPostStep("summary");}} style={{width:"100%",padding:"8px",marginTop:6,background:"transparent",border:"none",color:t3,fontSize:10,cursor:"pointer"}}>Omitir</button>
  </motion.div></motion.div>}
  </AnimatePresence>

  {/* ═══ POST: SUMMARY ═══ */}
  <AnimatePresence>
  {postStep==="summary"&&ts==="done"&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:220,background:`${bg}F2`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
    <motion.div initial={{scale:.9}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:20}} style={{background:cd,borderRadius:28,padding:"28px 22px",maxWidth:400,width:"100%",position:"relative",overflow:"hidden"}}>
    {/* Celebration particles — enhanced */}
    {Array.from({length:24}).map((_,i)=>{const angle=(i/24)*Math.PI*2;const dist=60+Math.random()*80;return<motion.div key={i} initial={{opacity:0,scale:0,x:0,y:0}} animate={{opacity:[0,1,1,0],scale:[0,1.2,1,0.5],x:Math.cos(angle)*dist,y:Math.sin(angle)*dist-20}} transition={{duration:1.8,delay:i*.04,ease:"easeOut"}} style={{position:"absolute",top:"18%",left:"50%",width:i%3===0?5:3,height:i%3===0?5:3,borderRadius:i%4===0?"1px":"50%",background:i%3===0?ac:i%3===1?"#6366F1":"#D97706"}}/>})}
    <div style={{textAlign:"center",marginBottom:16}}>
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:200,delay:.2}}>
        <svg width="48" height="48" viewBox="0 0 48 48" style={{margin:"0 auto 10px",display:"block"}}><circle cx="24" cy="24" r="22" fill={ac} opacity=".08"/><circle cx="24" cy="24" r="16" fill={ac} opacity=".12"/><path d="M15 24l6 6 12-12" stroke={ac} strokeWidth="3" strokeLinecap="round" fill="none"/></svg>
      </motion.div>
      <div style={{fontSize:18,fontWeight:800,color:t1}}>{st.totalSessions<=1?"Tu primera ignición":"Sesión completada"}</div>
      <div style={{fontSize:11,color:ac,marginTop:4,fontWeight:600}}>{pr.n} · {Math.round(pr.d*durMult)}s</div>
    </div>
    {st.streak>=3&&<div style={{textAlign:"center",padding:"10px",marginBottom:12,background:`linear-gradient(135deg,#D97706${isDark?"15":"08"},#D97706${isDark?"08":"04"})`,borderRadius:14,border:"1px solid #D9770615"}}>
      <div style={{fontSize:13,fontWeight:800,color:"#D97706"}}><Icon name="fire" size={14} color="#D97706"/> {st.streak} días — {st.streak>=30?"IMPARABLE":st.streak>=14?"DISCIPLINADO":st.streak>=7?"CONSTANTE":"EN CONSTRUCCIÓN"}</div>
    </div>}
    {preMood>0&&checkMood>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:14,padding:"14px 16px",background:`linear-gradient(135deg,${isDark?"#1A1E28":"#F1F5F9"},${isDark?"#141820":"#F8FAFC"})`,borderRadius:16}}>
      <div style={{textAlign:"center"}}><Icon name={MOODS[preMood-1].icon} size={22} color={MOODS[preMood-1].color}/><div style={{fontSize:10,color:t3,marginTop:3,fontWeight:600}}>Antes</div></div>
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:.3}} style={{display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{fontSize:18,color:moodDiff>0?"#059669":moodDiff<0?"#DC2626":t3,fontWeight:800}}>{moodDiff>0?"+"+moodDiff:moodDiff===0?"=":moodDiff}</div><div style={{fontSize:10,color:t3}}>puntos</div></motion.div>
      <div style={{textAlign:"center"}}><Icon name={MOODS[checkMood-1].icon} size={22} color={MOODS[checkMood-1].color}/><div style={{fontSize:10,color:t3,marginTop:3,fontWeight:600}}>Después</div></div>
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:12}}>
      {[{l:"V-Cores",v:"+"+postVC,c:ac},{l:"Enfoque",v:st.coherencia+"%",c:"#3B82F6"},{l:"Calma",v:st.resiliencia+"%",c:"#8B5CF6"}].map((m,i)=>(
        <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.2+i*.1}} style={{background:m.c+"08",borderRadius:11,padding:"9px 5px",textAlign:"center"}}><div style={{fontSize:15,fontWeight:800,color:m.c}}>{m.v}</div><div style={{fontSize:10,fontWeight:700,color:t3,letterSpacing:.5,marginTop:1,textTransform:"uppercase"}}>{m.l}</div></motion.div>))}
    </div>
    <div style={{background:ac+"06",borderRadius:10,padding:"10px 12px",marginBottom:12,border:`1px solid ${ac}10`}}>
      <div style={{fontSize:11,color:t2,fontWeight:500,lineHeight:1.5,fontStyle:"italic"}}>{postMsg}</div>
    </div>
    <motion.button whileTap={{scale:.96}} onClick={()=>{rs();setPostStep("none");}} style={{width:"100%",padding:"13px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>CONTINUAR</motion.button>
  </motion.div></motion.div>}
  </AnimatePresence>

  {/* ═══ INTENT PICKER ═══ */}
  <AnimatePresence>
  {showIntent&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:210,background:"rgba(15,23,42,.4)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setShowIntent(false)}>
    <motion.div initial={{scale:.9}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:20}} style={{background:cd,borderRadius:28,padding:"26px 20px",maxWidth:380,width:"100%"}} onClick={e=>e.stopPropagation()}>
    <div style={{textAlign:"center",marginBottom:18}}><div style={{fontSize:16,fontWeight:800,color:t1}}>¿Qué necesitas?</div>
    {aiRec&&<div style={{fontSize:10,color:t3,marginTop:4}}>IA sugiere: <span style={{color:ac,fontWeight:700}}>{aiRec.need}</span> · {aiRec.context.circadian}</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{INTENTS.map(i=>{const b=P.filter(p=>p.int===i.id);const pk=b[Math.floor(b.length/2)]||P[0];return(<motion.button key={i.id} whileTap={{scale:.95}} onClick={()=>sp(pk)} style={{padding:"16px 10px",borderRadius:16,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",textAlign:"center"}}><Icon name={i.icon} size={26} color={i.color}/><div style={{fontSize:12,fontWeight:800,color:t1,marginTop:6}}>{i.label}</div><div style={{fontSize:10,color:i.color,fontWeight:700,marginTop:4}}>{pk.n}</div></motion.button>);})}</div>
  </motion.div></motion.div>}
  </AnimatePresence>

  {/* ═══ PROTOCOL SELECTOR ═══ */}
  <AnimatePresence>
  {sl&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSl(false)}>
    <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:300,damping:30}} style={{width:"100%",maxWidth:430,maxHeight:"82vh",background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 16px"}}/><h3 style={{fontSize:18,fontWeight:800,color:t1,marginBottom:12}}>Protocolos</h3>
    {/* Intent quick-filter */}
    <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
      {INTENTS.map(i=>{const isActive=sc===i.id;return<motion.button key={i.id} whileTap={{scale:.93}} onClick={()=>setSc(isActive?"Protocolo":i.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:20,border:isActive?`2px solid ${i.color}`:`1.5px solid ${bd}`,background:isActive?i.color+"0A":cd,cursor:"pointer",flexShrink:0,transition:"all .2s"}}><Icon name={i.icon} size={14} color={isActive?i.color:t3}/><span style={{fontSize:10,fontWeight:700,color:isActive?i.color:t3}}>{i.label}</span></motion.button>;})}
    </div>
    {/* Category tabs */}
    <div style={{display:"flex",background:isDark?"#1A1E28":"#EEF2F7",borderRadius:12,padding:3,marginBottom:14}}>{CATS.map(c=><button key={c} onClick={()=>setSc(c)} style={{flex:1,padding:"8px 0",borderRadius:10,border:"none",background:sc===c?cd:"transparent",color:sc===c?t1:t3,fontWeight:700,fontSize:11,cursor:"pointer",transition:"all .3s"}}>{c}</button>)}</div>
    {[...fl].sort((a,b)=>(favs.includes(b.n)?1:0)-(favs.includes(a.n)?1:0)).map(p=>{const isLast=lastProto===p.n;const isFav=favs.includes(p.n);const isSmart=smartPick?.id===p.id;const pred=predictSessionImpact(st,p);return<motion.button key={p.id} whileTap={{scale:.98}} onClick={()=>sp(p)} style={{width:"100%",padding:"12px",marginBottom:4,borderRadius:14,border:isSmart?`2px solid ${ac}`:pr.id===p.id?`2px solid ${p.cl}`:`1.5px solid ${bd}`,background:isSmart?ac+"05":pr.id===p.id?p.cl+"06":cd,cursor:"pointer",textAlign:"left",display:"flex",gap:11,alignItems:"center",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",left:0,top:0,bottom:0,width:3,borderRadius:"0 2px 2px 0",background:p.cl}}/><div style={{width:40,height:40,borderRadius:11,background:p.cl+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:p.cl,flexShrink:0,marginLeft:4}}>{p.tg}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:t1,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>{p.n}{isLast&&<span style={{fontSize:10,fontWeight:700,color:t3,background:isDark?"#1A1E28":"#F1F5F9",padding:"1px 5px",borderRadius:4}}>último</span>}{isSmart&&<span style={{fontSize:10,fontWeight:700,color:ac,background:ac+"10",padding:"1px 5px",borderRadius:4}}>IA recomienda</span>}</div><div style={{fontSize:10,color:t2,marginBottom:2}}>{p.sb}</div><div style={{fontSize:10,color:t3,display:"flex",alignItems:"center",gap:6}}>{p.ph.length} fases · {p.d}s · <span style={{color:p.dif===1?"#059669":p.dif===2?"#D97706":"#DC2626"}}>{DIF_LABELS[(p.dif||1)-1]}</span>{pred.predictedDelta>0&&<span style={{color:"#059669",fontWeight:700}}> · +{pred.predictedDelta} est.</span>}</div></div><div onClick={e=>{e.stopPropagation();toggleFav(p.n);H("tap");}} style={{padding:4,cursor:"pointer",flexShrink:0}}><Icon name="star" size={16} color={isFav?ac:bd}/></div>{(()=>{const s=protoSens[p.n];return s&&s.sessions>=2?<span style={{fontSize:10,fontWeight:800,color:s.avgDelta>0?"#059669":"#DC2626",marginRight:4}}>{s.avgDelta>0?"+":""}{s.avgDelta}</span>:null;})()}{pr.id===p.id&&<Icon name="check" size={16} color={p.cl}/>}</motion.button>;})}
  </motion.div></motion.div>)}
  </AnimatePresence>

  {/* ═══ SETTINGS ═══ */}
  <AnimatePresence>
  {showSettings&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowSettings(false)}>
    <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:300,damping:30}} style={{width:"100%",maxWidth:430,background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:17,fontWeight:800,color:t1,marginBottom:16}}>Configuración</h3>
    {[{l:"Sonido + ambiente",k:"soundOn",d:"Acordes, ruido ambiental y binaural",ic:"volume-on"},{l:"Vibración",k:"hapticOn",d:"Feedback háptico neurosensorial",ic:"vibrate"},{l:"Voz guiada",k:"_voice",d:"Narración de fases y respiración",ic:"mind"}].map(s=>(
      <div key={s.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${bd}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><Icon name={s.ic} size={15} color={t3}/><div><div style={{fontSize:12,fontWeight:700,color:t1}}>{s.l}</div><div style={{fontSize:10,color:t3,marginTop:1}}>{s.d}</div></div></div>
        <div onClick={()=>{if(s.k==="_voice"){setVoiceOn(!voiceOn);}else setSt({...st,[s.k]:!st[s.k]});}} style={{width:42,height:24,borderRadius:12,background:s.k==="_voice"?(voiceOn?ac:bd):(st[s.k]?ac:bd),cursor:"pointer",position:"relative",transition:"background .3s"}}><div style={{width:20,height:20,borderRadius:10,background:"#fff",position:"absolute",top:2,left:s.k==="_voice"?(voiceOn?20:2):(st[s.k]?20:2),transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}}/></div>
      </div>))}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${bd}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><Icon name="palette" size={15} color={t3}/><div style={{fontSize:12,fontWeight:700,color:t1}}>Tema</div></div><div style={{display:"flex",gap:4}}>{["auto","light","dark"].map(m=>(<button key={m} onClick={()=>setSt({...st,themeMode:m})} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${(st.themeMode||"auto")===m?ac:bd}`,background:(st.themeMode||"auto")===m?ac+"10":cd,color:(st.themeMode||"auto")===m?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>))}</div></div>
    <div style={{display:"flex",gap:6,marginTop:14}}>
      <motion.button whileTap={{scale:.96}} onClick={()=>exportData(st)} style={{flex:1,padding:"13px",borderRadius:13,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
        <Icon name="export" size={14} color={t2}/><span style={{fontSize:11,fontWeight:700,color:t2}}>JSON</span>
      </motion.button>
      <motion.button whileTap={{scale:.96}} onClick={()=>exportNOM035(st)} style={{flex:1,padding:"13px",borderRadius:13,border:"1.5px solid #059669",background:"#05966908",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
        <Icon name="file" size={14} color="#059669"/><span style={{fontSize:11,fontWeight:700,color:"#059669"}}>NOM-035</span>
      </motion.button>
    </div>
  </motion.div></motion.div>)}
  </AnimatePresence>

  {/* ═══ HISTORY ═══ */}
  <AnimatePresence>
  {showHist&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowHist(false)}>
    <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:300,damping:30}} style={{width:"100%",maxWidth:430,maxHeight:"75vh",background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:17,fontWeight:800,color:t1,marginBottom:14}}>Historial</h3>
    {!(st.history||[]).length&&<div style={{textAlign:"center",padding:"36px 0"}}><Icon name="chart" size={30} color={t3}/><div style={{fontSize:12,color:t3,marginTop:8}}>Tu primera sesión creará el registro.</div></div>}
    {(()=>{const g=groupHist([...(st.history||[])].reverse());return Object.entries(g).map(([k,items])=>{if(!items.length)return null;return(<div key={k}><div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:7,marginTop:10}}>{k==="hoy"?"Hoy":k==="ayer"?"Ayer":"Anteriores"}</div>{items.map((h,i)=>{const tm=new Date(h.ts).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});const ml=(st.moodLog||[]).find(m=>Math.abs(m.ts-h.ts)<10000);return(<div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:`1px solid ${bd}`}}><div style={{width:30,height:30,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={12} color={ac}/></div><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:t1}}>{h.p}</div><div style={{display:"flex",alignItems:"center",gap:3,marginTop:1}}><span style={{fontSize:10,color:t3}}>{tm}</span>{ml&&<Icon name={MOODS[(ml.mood||3)-1]?.icon||"neutral"} size={10} color={MOODS[(ml.mood||3)-1]?.color||t3}/>}{h.bioQ&&<span style={{fontSize:10,fontWeight:700,color:h.bioQ>=70?"#059669":h.bioQ>=45?"#D97706":"#DC2626"}}>{h.bioQ}%</span>}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:800,color:ac}}>+{h.vc}</div></div></div>);})}</div>);});})()}
  </motion.div></motion.div>)}
  </AnimatePresence>

  {/* ═══ MAIN CONTENT ═══ */}
  <div style={{opacity:tabFade,transition:"opacity .25s cubic-bezier(.4,0,.2,1),transform .25s",transform:tabFade===1?"translateY(0)":"translateY(8px)",position:"relative",zIndex:1}}>

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
    {ts==="idle"&&<StreakShield st={st} isDark={isDark} onQuickSession={()=>{setDurMult(0.5);const calmP=P.find(p=>p.int==="calma"&&p.dif===1)||P[0];setPr(calmP);setSec(Math.round(calmP.d*0.5));go();}}/>}

    {/* Cognitive Load indicator (NEW) */}
    {ts==="idle"&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",marginBottom:12,background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:24,height:24,borderRadius:7,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="bolt" size={11} color={ac}/></div>
        <span style={{fontSize:11,fontWeight:600,color:t1}}>{st.todaySessions||0} de {st.sessionGoal||2} sesiones hoy</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:3}}><Icon name="gauge" size={10} color={cogLoad.color}/><span style={{fontSize:10,fontWeight:700,color:cogLoad.color}}>{cogLoad.level}</span></div>
        <div style={{width:40,height:5,borderRadius:5,background:bd,overflow:"hidden"}}>
          <div style={{width:Math.min(100,(st.todaySessions||0)/(st.sessionGoal||2)*100)+"%",height:"100%",background:ac,borderRadius:5,transition:"width .3s"}}/>
        </div>
      </div>
    </div>}

    {/* Daily Ignición with AI reasoning */}
    {ts==="idle"&&<motion.button whileTap={{scale:.97}} onClick={()=>sp(daily.proto)} style={{width:"100%",padding:"16px 14px",marginBottom:14,borderRadius:18,border:`1.5px solid ${daily.proto.cl}20`,background:`linear-gradient(135deg,${daily.proto.cl}06,${daily.proto.cl}02)`,cursor:"pointer",textAlign:"left",display:"flex",gap:12,alignItems:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:daily.proto.cl+"08"}}/>
      <div style={{width:44,height:44,borderRadius:13,background:daily.proto.cl+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:daily.proto.cl,flexShrink:0,border:`1px solid ${daily.proto.cl}15`}}>{daily.proto.tg}</div>
      <div style={{flex:1,position:"relative",zIndex:1}}>
        <div style={{fontSize:10,fontWeight:800,color:daily.proto.cl,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>IGNICIÓN DEL DÍA</div>
        <div style={{fontSize:13,fontWeight:800,color:t1}}>{daily.proto.n}</div>
        <div style={{fontSize:10,color:t3,marginTop:2,fontStyle:"italic",lineHeight:1.4}}>{daily.phrase}</div>
      </div>
      <Icon name="bolt" size={16} color={daily.proto.cl}/>
    </motion.button>}

    {/* AI Recommendation — inline compact */}
    {ts==="idle"&&aiRec&&aiRec.primary&&aiRec.primary.protocol.id!==daily.proto.id&&<motion.button initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} whileTap={{scale:.97}} onClick={()=>sp(aiRec.primary.protocol)} style={{width:"100%",padding:"10px 14px",marginBottom:10,borderRadius:14,border:`1.5px solid ${ac}15`,background:isDark?"#0A1A0A":"#F0FDF4",cursor:"pointer",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
      <div style={{width:28,height:28,borderRadius:8,background:ac+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="cpu" size={13} color={ac}/></div>
      <div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:ac}}>IA: {aiRec.primary.protocol.n}</div><div style={{fontSize:10,color:t3}}>{aiRec.primary.reason}</div></div>
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
        <div style={{width:32,height:32,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:ac}}>{pr.tg}</div>
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

    {/* ═══ CORE DE IGNICIÓN ═══ */}
    <div onClick={timerTap} role="button" aria-label={ts==="idle"?"Iniciar sesión":ts==="running"?"Pausar sesión":"Reanudar sesión"} onMouseDown={()=>setTp(true)} onMouseUp={()=>setTp(false)} onMouseLeave={()=>setTp(false)} onTouchStart={()=>setTp(true)} onTouchEnd={()=>setTp(false)} style={{position:"relative",width:isActive?200:250,height:isActive?200:250,margin:"0 auto 14px",cursor:"pointer",transform:tp?"scale(0.93)":"scale(1)",transition:"all .6s cubic-bezier(.34,1.56,.64,1)",userSelect:"none"}}>
      {/* Glow exterior pulsante */}
      <motion.div animate={ts==="idle"?{scale:[1,1.06,1],opacity:[.3,.6,.3]}:isActive?{scale:[1,1.04,1],opacity:[.4,.7,.4]}:{}} transition={{duration:ts==="idle"?3.5:2.5,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",inset:isActive?-16:-10,borderRadius:"50%",background:`radial-gradient(circle,${ac}${isActive?"12":"08"},transparent 65%)`,filter:"blur(6px)"}}/>
      {/* Anillo de respiración exterior */}
      {ts!=="paused"&&<motion.div animate={{scale:[1,1.02,1]}} transition={{duration:5,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",inset:isActive?-8:-4,borderRadius:"50%",border:`1.5px solid ${ac}${isActive?"15":"0A"}`}}/>}
      <svg width={isActive?"200":"250"} height={isActive?"200":"250"} viewBox="0 0 260 260" style={{transform:"rotate(-90deg)"}}>
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
      <motion.div animate={{opacity:[.3,.7,.3],boxShadow:[`0 0 8px ${ac}30`,`0 0 18px ${ac}50`,`0 0 8px ${ac}30`]}} transition={{duration:ts==="idle"?3:1.5,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:isActive?6:10,height:isActive?6:10,borderRadius:"50%",background:ac,pointerEvents:"none"}}/>
      {/* Contenido central */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",zIndex:2}}>
        {isBr&&bL&&<div style={{marginBottom:4}}><span style={{fontSize:12,fontWeight:800,letterSpacing:5,color:ac,opacity:.9}}>{bL}</span><span style={{fontSize:13,fontWeight:800,color:ac,marginLeft:4}}>{bCnt}s</span></div>}
        <div style={{fontSize:isActive?48:56,fontWeight:800,color:t1,lineHeight:1,letterSpacing:"-3px",textShadow:isActive?`0 0 20px ${ac}15`:"none"}}>{sec}</div>
        {isActive&&<div style={{fontSize:11,fontWeight:800,color:ac,marginTop:4,opacity:.8}}>{sessPct}%</div>}
        {ts==="idle"&&<>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:3,color:t3,marginTop:6,textTransform:"uppercase"}}>segundos</div>
          <motion.div animate={{opacity:[.5,1,.5],y:[0,-2,0]}} transition={{duration:2.5,repeat:Infinity,ease:"easeInOut"}} style={{marginTop:12,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${ac},#0D9488)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 14px ${ac}35`}}><Icon name="bolt" size={16} color="#fff"/></div>
            <span style={{fontSize:10,fontWeight:800,color:ac,letterSpacing:2,textTransform:"uppercase"}}>INICIAR</span>
          </motion.div>
        </>}
        {ts==="paused"&&<motion.div animate={{opacity:[.5,1,.5]}} transition={{duration:2,repeat:Infinity}} style={{marginTop:6}}><span style={{fontSize:11,fontWeight:800,color:ac,letterSpacing:3}}>EN PAUSA</span></motion.div>}
      </div>
      {tp&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"100%",height:"100%",borderRadius:"50%",border:`2px solid ${ac}20`,animation:"cdPulse .6s ease forwards",pointerEvents:"none"}}/>}
    </div>

    {/* BreathOrb (NEW — framer-motion breathing viz) */}
    <BreathOrb type={ph.ic} color={ac} breathScale={bS} breathLabel={bL} breathCount={bCnt} active={isActive} sessionProgress={pct}/>

    {/* Phase info */}
    <div style={{textAlign:"center",marginBottom:isActive?6:10}}><div style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name={ph.ic} size={isActive?11:13} color={ac}/><span style={{fontSize:isActive?12:14,fontWeight:800,color:t1}}>{ph.l}</span></div>{!isActive&&<div style={{fontSize:10,color:t3,marginTop:2}}>{ph.r}</div>}</div>
    <motion.div key={pi} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{duration:.3}} style={{background:cd,borderRadius:16,padding:"16px",marginBottom:10,border:`1px solid ${bd}`}}>
      {isActive&&<><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:10,fontWeight:700,color:ac}}>Fase {pi+1} de {pr.ph.length}</span><span style={{fontSize:10,color:t3}}>{Math.round((pi+1)/pr.ph.length*100)}%</span></div></>}
      {ph.k&&<div style={{fontSize:16,fontWeight:800,color:t1,lineHeight:1.45,marginBottom:10,letterSpacing:"-0.3px"}}>{ph.k}</div>}
      <p style={{fontSize:12,lineHeight:1.75,color:t2,margin:0}}>{ph.i}</p>

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
  {tab==="dashboard"&&(<div style={{padding:"14px 20px 180px"}}>
    {noData?<div style={{textAlign:"center",padding:"50px 20px"}}><Icon name="bolt" size={34} color={ac}/><div style={{fontSize:15,fontWeight:800,color:t1,marginTop:10,marginBottom:5}}>Tu dashboard te espera</div><div style={{fontSize:11,color:t3,marginBottom:18}}>Completa tu primera ignición para ver tus métricas neurales.</div><motion.button whileTap={{scale:.95}} onClick={()=>switchTab("ignicion")} style={{padding:"11px 28px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>IR A IGNICIÓN</motion.button></div>
    :<>
    {/* Executive Summary — Hero card */}
    <div style={{background:`linear-gradient(145deg,${isDark?"#0D1117":"#FFFFFF"},${isDark?"#141820":ac+"06"})`,borderRadius:22,padding:"20px 18px",marginBottom:16,border:`1.5px solid ${ac}15`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${ac}10,transparent)`,filter:"blur(20px)"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,position:"relative"}}>
        <div><div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:4}}>Rendimiento Neural</div>
        <div style={{display:"flex",alignItems:"baseline",gap:4}}><span style={{fontSize:34,fontWeight:800,color:t1,letterSpacing:"-2px"}}>{perf}</span><span style={{fontSize:14,fontWeight:600,color:t3}}>%</span></div></div>
        <div style={{width:52,height:52,borderRadius:16,background:`linear-gradient(135deg,${ac}15,${ac}08)`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${ac}15`}}>
          <Icon name={perf>=70?"shield":perf>=50?"gauge":"alert"} size={22} color={ac}/>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {[{v:st.weeklyData.reduce((a,b)=>a+b,0),l:"Semana",c:ac},{v:bioSignal.score,l:"BioSignal",c:bioSignal.score>=70?"#059669":bioSignal.score>=45?"#D97706":"#DC2626"},{v:burnout.risk==="sin datos"?"—":burnout.index,l:"Burnout",c:burnout.risk==="bajo"?"#059669":"#DC2626"}].map((m,i)=>(
          <div key={i} style={{textAlign:"center",padding:"8px 4px",background:isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",borderRadius:12}}>
            <div style={{fontSize:18,fontWeight:800,color:m.c}}>{m.v}</div>
            <div style={{fontSize:9,color:t3,fontWeight:600,marginTop:2,textTransform:"uppercase",letterSpacing:1}}>{m.l}</div>
          </div>))}
      </div>
      <div style={{fontSize:11,color:t2,lineHeight:1.5,padding:"8px 10px",background:isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",borderRadius:10,textAlign:"center"}}>{perf>=70?"Rendimiento alto. Mantén tu ritmo.":perf>=50?"Estado funcional. Una sesión más elevaría tu rendimiento.":"Tu sistema necesita atención. Prioriza un reset."}</div>
    </div>

    {/* ═══ NEURAL RADAR CHART ═══ */}
    <div style={{marginBottom:14}}>
      <NeuralRadar st={st} isDark={isDark} />
    </div>

    {/* ═══ NEURAL COACH IA ═══ */}
    <NeuralCoach st={st} isDark={isDark} onSelectProtocol={sp} />

    {/* ═══ WEEKLY REPORT (NEW) ═══ */}
    <WeeklyReport st={st} isDark={isDark} />

    {/* ═══ CORRELATION MATRIX (NEW) ═══ */}
    <CorrelationMatrix st={st} isDark={isDark} onSelectProtocol={(p)=>{sp(p);switchTab("ignicion");}} />

    {/* Neural Variability Index */}
    {neuralVar&&<div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}><Icon name="predict" size={12} color={t3}/><span style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>Variabilidad Neural</span></div>
        <span style={{fontSize:18,fontWeight:800,color:neuralVar.index<10?"#059669":neuralVar.index<20?"#D97706":"#DC2626"}}>{neuralVar.index}</span>
      </div>
      <div style={{fontSize:11,color:t2,lineHeight:1.5}}>{neuralVar.interpretation}</div>
      <div style={{fontSize:10,color:t3,marginTop:4}}>Tendencia: <span style={{fontWeight:700,color:neuralVar.trend==="ascendente"?"#059669":neuralVar.trend==="descendente"?"#DC2626":t3}}>{neuralVar.trend}</span></div>
    </div>}

    {/* BioSignal + Burnout — Gradient accent cards */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:14}}>
      <div style={{background:`linear-gradient(145deg,${cd},${(bioSignal.score>=70?"#059669":bioSignal.score>=45?"#D97706":"#DC2626")+"06"})`,borderRadius:18,padding:"16px 14px",border:`1px solid ${bd}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-10,right:-10,width:40,height:40,borderRadius:"50%",background:(bioSignal.score>=70?"#059669":"#D97706")+"08"}}/>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}><Icon name="shield" size={12} color={bioSignal.score>=70?"#059669":"#D97706"}/><span style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>BioSignal</span></div>
        <AN value={bioSignal.score} color={bioSignal.score>=70?"#059669":bioSignal.score>=45?"#D97706":"#DC2626"} sz={28}/>
        <div style={{fontSize:10,color:t2,marginTop:6,lineHeight:1.4}}>{bioSignal.score>=70?"Rendimiento alto":bioSignal.score>=45?"Estado funcional":"Intervención activa"}</div>
      </div>
      <div style={{background:`linear-gradient(145deg,${cd},${(burnout.risk==="bajo"?"#059669":"#DC2626")+"06"})`,borderRadius:18,padding:"16px 14px",border:`1px solid ${burnout.risk==="crítico"||burnout.risk==="alto"?"#DC262615":bd}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-10,right:-10,width:40,height:40,borderRadius:"50%",background:(burnout.risk==="bajo"?"#059669":"#DC2626")+"08"}}/>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}><Icon name="alert-triangle" size={12} color={burnout.risk==="bajo"?"#059669":"#DC2626"}/><span style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>Burnout</span></div>
        <AN value={burnout.index} color={burnout.risk==="bajo"?"#059669":burnout.risk==="moderado"?"#D97706":"#DC2626"} sz={28}/>
        <div style={{fontSize:10,color:burnout.risk==="bajo"?"#059669":"#DC2626",fontWeight:700,marginTop:6}}>Riesgo {burnout.risk}</div>
      </div>
    </div>

    {/* Mood Trend with Recharts */}
    {moodTrend.length>=2&&<div style={{background:cd,borderRadius:16,padding:"12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>Tendencia Emocional</span>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          <Icon name={MOODS[Math.round(avgMood)-1]?.icon||"neutral"} size={12} color={MOODS[Math.round(avgMood)-1]?.color||t3}/>
          <span style={{fontSize:12,fontWeight:800,color:MOODS[Math.round(avgMood)-1]?.color||t3}}>{avgMood}/5</span>
        </div>
      </div>
      <TemporalCharts type="mood" moodLog={st.moodLog} isDark={isDark} />
    </div>}

    {/* Activity Heatmap */}
    <div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:10}}>Actividad · 28 días</div>
      <TemporalCharts type="heatmap" history={st.history} isDark={isDark} ac={ac} />
    </div>

    {/* Energy Flow */}
    {st.history?.length>=3&&<div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:10}}>Flujo de Energía</div>
      <TemporalCharts type="energy" history={st.history} isDark={isDark} ac={ac} />
    </div>}

    {/* Protocol Sensitivity */}
    {Object.keys(protoSens).length>=2&&<div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><Icon name="fingerprint" size={11} color={t3}/><span style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>Sensibilidad por Protocolo</span></div>
      {Object.entries(protoSens).sort((a,b)=>b[1].avgDelta-a[1].avgDelta).slice(0,5).map(([name,data],i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:i<4?`1px solid ${bd}`:"none"}}>
          <span style={{fontSize:11,color:t1,fontWeight:600}}>{name}</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,fontWeight:800,color:data.avgDelta>0?"#059669":"#DC2626"}}>{data.avgDelta>0?"+":""}{data.avgDelta}</span>
            <span style={{fontSize:10,color:t3}}>{data.sessions}x</span>
          </div>
        </div>))}
    </div>}

    {/* Weekly chart */}
    <div style={{background:cd,borderRadius:16,padding:"12px 10px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:8}}>Esta Semana</div>
      <TemporalCharts type="weekly" weeklyData={st.weeklyData} isDark={isDark} ac={ac} />
    </div>

    {/* Metrics grid */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
      {[{l:"Enfoque",v:st.coherencia,d:rD.c>0?"+"+rD.c+"%":"—",c:"#3B82F6",ic:"focus"},{l:"Calma",v:st.resiliencia,d:rD.r>0?"+"+rD.r+"%":"—",c:"#8B5CF6",ic:"calm"},{l:"V-Cores",v:st.vCores||0,d:"+"+(st.history?.slice(-1)[0]?.vc||0),c:"#D97706",ic:"sparkle"},{l:"Sesiones",v:st.totalSessions,d:st.streak+"d racha",c:"#059669",ic:"bolt"}].map((k,i)=>(
        <div key={i} style={{background:cd,borderRadius:14,padding:"11px 10px",border:`1px solid ${bd}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{display:"flex",alignItems:"center",gap:3}}><Icon name={k.ic} size={10} color={t3}/><span style={{fontSize:10,fontWeight:700,color:t3}}>{k.l}</span></div><span style={{fontSize:10,fontWeight:700,color:"#059669"}}>{k.d}</span></div>
          <AN value={k.v} sfx={k.l==="Enfoque"||k.l==="Calma"?"%":""} color={k.c} sz={20}/>
        </div>))}
    </div>

    <motion.button whileTap={{scale:.97}} onClick={()=>setShowHist(true)} style={{width:"100%",padding:"11px",borderRadius:13,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:14}}><Icon name="clock" size={13} color={t3}/><span style={{fontSize:10,fontWeight:700,color:t2}}>Historial ({(st.history||[]).length})</span></motion.button>
    {st.achievements.length>0&&<div style={{background:ac+"05",borderRadius:16,padding:"12px 10px",border:`1px solid ${ac}10`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}><Icon name="trophy" size={14} color={ac}/><span style={{fontSize:11,fontWeight:800,color:ac}}>Logros</span></div>{st.achievements.map(a=><div key={a} style={{fontSize:10,color:ac,padding:"2px 0",display:"flex",alignItems:"center",gap:5,fontWeight:600}}><div style={{width:3,height:3,borderRadius:"50%",background:ac}}/>{AM[a]||a}</div>)}</div>}
    </>}
  </div>)}

  {/* ═══ TAB: PERFIL ═══ */}
  {tab==="perfil"&&(<div style={{padding:"14px 20px 180px"}}>
    {/* Profile Hero */}
    <div style={{textAlign:"center",marginBottom:20,marginTop:8,position:"relative"}}>
      {/* Background glow */}
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${ac}08,transparent)`,filter:"blur(30px)",pointerEvents:"none"}}/>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:200}}>
        <div style={{width:84,height:84,borderRadius:"50%",margin:"0 auto 12px",background:`linear-gradient(135deg,${ac},#6366F1)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 30px ${ac}25,0 0 0 3px ${cd},0 0 0 5px ${ac}20`,position:"relative"}}>
          <Icon name="user" size={32} color="#fff"/>
          <div style={{position:"absolute",bottom:-3,right:-3,width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${lv.c},${lv.c}CC)`,display:"flex",alignItems:"center",justifyContent:"center",border:`3px solid ${cd}`,boxShadow:`0 2px 8px ${lv.c}40`}}><span style={{fontSize:10,fontWeight:800,color:"#fff"}}>{lv.n[0]}</span></div>
        </div>
      </motion.div>
      <div style={{fontSize:20,fontWeight:800,color:t1,letterSpacing:"-0.5px"}}>Operador Neural</div>
      <div style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:6,padding:"4px 14px",background:nSt.color+"0C",borderRadius:20,border:`1px solid ${nSt.color}15`}}><div style={{width:5,height:5,borderRadius:"50%",background:nSt.color,animation:"shimDot 2s ease infinite"}}/><span style={{fontSize:11,fontWeight:700,color:nSt.color}}>{nSt.label} · {lv.n}</span></div>
    </div>

    {/* Stats — Integrated hero card */}
    <div style={{background:`linear-gradient(145deg,${cd},${ac}05)`,borderRadius:20,padding:"18px 16px",marginBottom:12,border:`1px solid ${bd}`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:ac+"06"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[{v:st.totalSessions,l:"Sesiones",c:ac,ic:"bolt"},{v:`${Math.floor((st.totalTime||0)/3600)}h${Math.floor(((st.totalTime||0)%3600)/60)}m`,l:"Tiempo",c:t1,ic:"clock"},{v:st.streak,l:"Racha",c:"#D97706",ic:"fire"}].map((m,i)=>(
          <div key={i} style={{textAlign:"center",padding:"8px",background:isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",borderRadius:14}}>
            <Icon name={m.ic} size={14} color={m.c} style={{marginBottom:4}}/>
            <div style={{fontSize:20,fontWeight:800,color:m.c,lineHeight:1}}>{m.v}</div>
            <div style={{fontSize:9,color:t3,fontWeight:600,marginTop:3,textTransform:"uppercase",letterSpacing:1}}>{m.l}</div>
          </div>))}
      </div>
      {/* Level progress — integrated */}
      <div style={{padding:"10px 12px",background:isDark?"rgba(255,255,255,.03)":"rgba(0,0,0,.02)",borderRadius:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:11,fontWeight:800,color:lv.c}}>{lv.n}</span>
          <span style={{fontSize:10,color:t3}}>{nLv?`→ ${nLv.n}`:""} · {lPct}%</span>
        </div>
        <div style={{height:6,background:bd,borderRadius:6,overflow:"hidden"}}>
          <motion.div initial={{width:0}} animate={{width:lPct+"%"}} transition={{duration:1,ease:"easeOut"}} style={{height:"100%",borderRadius:6,background:`linear-gradient(90deg,${lv.c},${lv.c}BB)`,boxShadow:`0 0 8px ${lv.c}30`}}/>
        </div>
      </div>
    </div>

    {/* Neural Fingerprint */}
    {(()=>{const fp=calcNeuralFingerprint(st);if(!fp)return null;return(
    <div style={{background:cd,borderRadius:16,padding:"14px",marginBottom:10,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10}}><Icon name="fingerprint" size={12} color={t3}/><span style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase"}}>Tu Firma Neural</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        {[{l:"Hora pico",v:`${fp.peakHour}:00`},{l:"Mejor protocolo",v:fp.bestProto,c:ac},{l:"Calidad",v:`${fp.avgQuality}%`,c:fp.avgQuality>=70?"#059669":"#D97706"},{l:"Adaptación",v:fp.adaptationRate>0?`+${fp.adaptationRate}`:`${fp.adaptationRate}`,c:fp.adaptationRate>0?"#059669":"#DC2626"}].map((d,i)=>(
          <div key={i} style={{background:isDark?"#1A1E28":"#F8FAFC",borderRadius:12,padding:"10px"}}>
            <div style={{fontSize:10,color:t3}}>{d.l}</div>
            <div style={{fontSize:14,fontWeight:800,color:d.c||t1}}>{d.v}</div>
          </div>
        ))}
      </div>
    </div>);})()}

    {/* V-Cores + Mood */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
      <div style={{background:ac+"06",borderRadius:14,padding:"14px 12px",border:`1px solid ${ac}10`}}>
        <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:2}}><Icon name="sparkle" size={10} color={ac}/><span style={{fontSize:10,fontWeight:800,letterSpacing:2,color:ac,textTransform:"uppercase"}}>V-Cores</span></div>
        <AN value={st.vCores||0} color={ac} sz={24}/>
      </div>
      <div style={{background:cd,borderRadius:14,padding:"14px 12px",border:`1px solid ${bd}`}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:2}}>Mood</div>
        {avgMood>0?<div style={{display:"flex",alignItems:"center",gap:4}}><Icon name={MOODS[Math.round(avgMood)-1]?.icon||"neutral"} size={18} color={MOODS[Math.round(avgMood)-1]?.color||t3}/><span style={{fontSize:20,fontWeight:800,color:MOODS[Math.round(avgMood)-1]?.color||t3}}>{avgMood}</span></div>:<span style={{fontSize:11,color:t3}}>Sin datos</span>}
      </div>
    </div>

    {/* Optimal Time Suggestion */}
    {(()=>{const ot=suggestOptimalTime(st);if(!ot||!ot.best)return null;return(
    <div style={{background:cd,borderRadius:16,padding:"14px",marginBottom:10,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><Icon name="clock" size={12} color={t3}/><span style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase"}}>Hora Óptima</span></div>
      <div style={{fontSize:11,color:t2,lineHeight:1.6}}>{ot.recommendation}</div>
    </div>);})()}

    {/* Streak Chain Analysis */}
    {(()=>{const sc=analyzeStreakChain(st);if(!sc)return null;return(
    <div style={{background:cd,borderRadius:16,padding:"14px",marginBottom:10,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:8}}><Icon name="fire" size={12} color="#D97706"/><span style={{fontSize:10,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase"}}>Análisis de Rachas</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:"#D97706"}}>{sc.maxStreak}d</div><div style={{fontSize:9,color:t3}}>récord</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:t1}}>{sc.avgStreak}d</div><div style={{fontSize:9,color:t3}}>promedio</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:"#6366F1"}}>{sc.avgBreakPoint}d</div><div style={{fontSize:9,color:t3}}>punto quiebre</div></div>
      </div>
      <div style={{fontSize:10,color:t2,lineHeight:1.5}}>{sc.prediction}</div>
    </div>);})()}

    {/* Actions grid */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
      <motion.button whileTap={{scale:.95}} onClick={()=>setShowSettings(true)} style={{padding:"14px",borderRadius:16,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
        <div style={{width:36,height:36,borderRadius:11,background:isDark?"#1A1E28":"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="gear" size={16} color={t3}/></div>
        <span style={{fontSize:10,fontWeight:700,color:t2}}>Ajustes</span>
      </motion.button>
      <motion.button whileTap={{scale:.95}} onClick={()=>setShowHist(true)} style={{padding:"14px",borderRadius:16,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
        <div style={{width:36,height:36,borderRadius:11,background:isDark?"#1A1E28":"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="clock" size={16} color={t3}/></div>
        <span style={{fontSize:10,fontWeight:700,color:t2}}>Historial</span>
      </motion.button>
    </div>
    <motion.button whileTap={{scale:.95}} onClick={()=>setShowCalibration(true)} style={{width:"100%",padding:"13px",borderRadius:14,border:`1.5px solid ${ac}20`,background:`linear-gradient(135deg,${ac}08,${ac}03)`,color:ac,fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="radar" size={14} color={ac}/>Recalibrar Baseline Neural</motion.button>
    <button onClick={()=>{if(typeof window!=="undefined"&&window.confirm("¿Reiniciar todos los datos?")){setSt({...DS,weekNum:getWeekNum()});}}} style={{width:"100%",padding:"12px",borderRadius:14,border:"1px solid #FEE2E2",background:isDark?"#1A0A0A":"#FFF5F5",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer"}}>Reiniciar Datos</button>
  </div>)}
  </div>

  {/* ═══ BOTTOM METRICS BAR ═══ */}
  <div style={{position:"fixed",bottom:68,left:"50%",transform:"translateX(-50%)",width:"calc(100% - 32px)",maxWidth:400,padding:"8px 16px",background:`${isDark?"rgba(20,24,32,.92)":"rgba(255,255,255,.92)"}`,backdropFilter:"blur(16px)",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:50,borderRadius:16,border:`1px solid ${bd}`,boxShadow:`0 4px 20px ${isDark?"rgba(0,0,0,.3)":"rgba(0,0,0,.06)"}`}}>
    {[{v:st.coherencia,l:"Enfoque",d:rD.c,c:"#3B82F6",ic:"focus"},{v:st.resiliencia,l:"Calma",d:rD.r,c:"#8B5CF6",ic:"calm"},{v:st.capacidad,l:"Energía",d:0,c:"#6366F1",ic:"energy"}].map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"center"}}>
      <div style={{width:28,height:28,borderRadius:8,background:m.c+"10",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name={m.ic} size={12} color={m.c}/></div>
      <div><div style={{fontSize:13,fontWeight:800,color:m.c,lineHeight:1}}>{m.v}%</div><div style={{fontSize:9,color:t3,fontWeight:600,display:"flex",alignItems:"center",gap:2}}>{m.l}{m.d>0&&<span style={{color:"#059669",fontWeight:700}}>+{m.d}</span>}</div></div>
    </div>)}
  </div>

  {/* ═══ BOTTOM NAV ═══ */}
  <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`${isDark?"rgba(11,14,20,.96)":"rgba(255,255,255,.96)"}`,backdropFilter:"blur(20px)",borderTop:`1px solid ${bd}`,padding:"6px 16px max(10px, env(safe-area-inset-bottom))",display:"flex",justifyContent:"center",gap:4,zIndex:60}}>
    {[{id:"ignicion",lb:"Ignición",ic:"bolt",ac:ac},{id:"dashboard",lb:"Dashboard",ic:"chart",ac:"#6366F1"},{id:"perfil",lb:"Perfil",ic:"user",ac:t1}].map(t=>{const a=tab===t.id;return(<motion.button key={t.id} whileTap={{scale:.92}} onClick={()=>switchTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 0 4px",border:"none",cursor:"pointer",background:"transparent",borderRadius:14,position:"relative",minHeight:48}}>
      {a&&<motion.div layoutId="navIndicator" style={{position:"absolute",top:0,left:"20%",right:"20%",height:3,borderRadius:"0 0 3px 3px",background:t.ac}} transition={{type:"spring",stiffness:400,damping:30}}/>}
      <motion.div animate={{scale:a?1:0.9,y:a?-1:0}} transition={{type:"spring",stiffness:300,damping:20}} style={{width:32,height:32,borderRadius:10,background:a?t.ac+"12":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s"}}>
        <Icon name={t.ic} size={a?19:17} color={a?t.ac:t3}/>
      </motion.div>
      <span style={{fontSize:10,fontWeight:a?800:600,color:a?t.ac:t3,transition:"all .2s",letterSpacing:a?0.5:0}}>{t.lb}</span>
    </motion.button>);})}
  </div>
  </div>);
}
