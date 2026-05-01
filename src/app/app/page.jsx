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
import { PROGRAMS, programTodayStatus, programRequiredSessions, getProgramById, getProtocolById } from "@/lib/programs";
import { resolveProgramSuggestion } from "@/lib/programSuggestion";
import {
  MOODS, INTENTS,
  POST_MSGS, DS,
} from "@/lib/constants";
import {
  gL, lvPct, getStatus, getWeekNum, getDailyIgn, getCircadian,
  calcProtoSensitivity, predictSessionImpact,
  estimateCognitiveLoad,
  calcSessionCompletion,
  suggestOptimalTime,
  calcBurnoutIndex,
} from "@/lib/neural";
import { useReadiness, computeReadiness } from "@/hooks/useReadiness";
import { useAdaptiveRecommendation, computeAdaptiveRecommendation } from "@/hooks/useAdaptiveRecommendation";
import { useCommandKey } from "@/hooks/useCommandKey";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useSessionAudio } from "@/hooks/useSessionAudio";
import {
  hap, hapticPhase, hapticBreath, hapticSignature, hapticPreShift, hapticCountdown, playIgnition, playChord, playSpark, playBreathTick, playCountdownTick, setMasterVolume, setUserVoiceRate, setUserVoicePreference, setHapticIntensity, setHapticEnabled, setHapticFallback, setBinauralEnabled, setMusicBedEnabled,
  startBinaural, stopBinaural,
  setupMotionDetection, requestWakeLock, releaseWakeLock,
  unlockVoice, speak, speakNow, stopVoice, loadVoices,
  wireAudioUnlock,
} from "@/lib/audio";
import { resolveTheme, withAlpha, ty, font, space, radius, z, layout, timer as timerSize, bioSignal, brand } from "@/lib/theme";
import { dark as darkPalette } from "@/lib/tokens";
import BioIgnicionMark, { BioGlyph } from "@/components/BioIgnicionMark";
import BillingBanner from "@/components/BillingBanner";
import NeuralCore3D from "@/components/brand/NeuralCore3D";
import IgnitionBurst from "@/components/IgnitionBurst";
import { useStore } from "@/store/useStore";
import Icon from "@/components/Icon";
import { useSync } from "@/hooks/useSync";
import { useDeepLink } from "@/hooks/useDeepLink";
import { setReloadGate } from "@/hooks/useServiceWorkerUpdate";
import { SPRING } from "@/lib/easings";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useThemeDark } from "@/hooks/useThemeDark";
import { useTapEntry } from "@/hooks/useTapEntry";
import { useHaptic } from "@/hooks/useHaptic";
import { uiSound } from "@/lib/uiSound";
import { buildCommands } from "@/lib/commandPalette";
import { computePhaseIndex, timeToNextPhase } from "@/lib/phaseEngine";
import { computeSessionMetrics, sessionQualityMessage } from "@/lib/sessionClose";
import { buildCheckinEntry } from "@/lib/sessionCheckin";
import { computeBreathFrame } from "@/lib/breathCycle";
import { buildSessionDelta, buildSessionOutboxPayload } from "@/lib/sessionDelta";
import { outboxAdd } from "@/lib/storage";
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
const HRVCameraMeasure = dynamic(() => import("@/components/HRVCameraMeasure"), { ssr: false });
const HRVHistoryPanel = dynamic(() => import("@/components/HRVHistoryPanel"), { ssr: false });
const PhysiologicalSigh = dynamic(() => import("@/components/PhysiologicalSigh"), { ssr: false });
const NSDR = dynamic(() => import("@/components/NSDR"), { ssr: false });
const ChronotypeTest = dynamic(() => import("@/components/ChronotypeTest"), { ssr: false });
const ResonanceCalibration = dynamic(() => import("@/components/ResonanceCalibration"), { ssr: false });
const NOM035Questionnaire = dynamic(() => import("@/components/NOM035Questionnaire"), { ssr: false });
const ReadinessScore = dynamic(() => import("@/components/ReadinessScore"), { ssr: false });
const SessionRunner = dynamic(() => import("@/components/SessionRunner"), { ssr: false });
const AmbientLattice = dynamic(() => import("@/components/AmbientLattice"), { ssr: false });
const ProgramBrowser = dynamic(() => import("@/components/ProgramBrowser"), { ssr: false });
const ActiveProgramCard = dynamic(() => import("@/components/ActiveProgramCard"), { ssr: false });
const EvidenceStrip = dynamic(() => import("@/components/EvidenceStrip"), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function BioIgnicion(){
  const store = useStore();
  const[mt,setMt]=useState(false);const[tab,setTab]=useState("ignicion");const[st,setSt_]=useState(DS);
  // Keep-mounted: una vez visitado, el tab queda montado y solo se
  // toggle visibilidad por CSS. Primer visit paga el costo de mount;
  // visits siguientes son instantáneos (CSS display). Twitter/IG/Linear
  // usan este patrón. Sin esto: cada switch re-monta DashboardView (565
  // líneas + dynamic charts) o ProfileView (1043 líneas) → laggy.
  const[visitedTabs,setVisitedTabs]=useState({ignicion:true});
  const[pr,setPr]=useState(P[12]);const[sc,setSc]=useState("Protocolo");const[sl,setSl]=useState(false);
  const[ts,setTs]=useState("idle");const[sec,setSec]=useState(120);const[pi,setPi]=useState(0);
  const[bL,setBL]=useState("");const[bS,setBS]=useState(1);const[bCnt,setBCnt]=useState(0);
  const[tp,setTp]=useState(false);
  const[ignitionFlash,setIgnitionFlash]=useState(false);
  const[phaseFlash,setPhaseFlash]=useState(false);
  const[orbDoneFlash,setOrbDoneFlash]=useState(false);
  // Ember mode — tras completar sesión, el núcleo queda en modo brasa
  // por ~30s (firings esporádicos, rotación lentísima) para recompensar
  // quedarse en la app post-sesión. El parent activa tras ts==="done"
  // con 1.4s de delay (deja que el resonance collapse respire) y lo
  // limpia a los 30s o si el usuario arranca otra sesión.
  const[emberActive,setEmberActive]=useState(false);
  const[postStep,setPostStep]=useState("none");
  const[postVC,setPostVC]=useState(0);const[postMsg,setPostMsg]=useState("");
  const[checkMood,setCheckMood]=useState(0);const[checkEnergy,setCheckEnergy]=useState(0);const[checkTag,setCheckTag]=useState("");
  const[preMood,setPreMood]=useState(0);const[preMoodFromPrefill,setPreMoodFromPrefill]=useState(false);
  const[countdown,setCountdown]=useState(0);
  const[compFlash,setCompFlash]=useState(false);
  const[showHist,setShowHist]=useState(false);const[showSettings,setShowSettings]=useState(false);
  const[onboard,setOnboard]=useState(false);const[welcomeDone,setWelcomeDone]=useState(false);const[showIntent,setShowIntent]=useState(false);const[firstIntent,setFirstIntent]=useState(null);
  const[expandedProgramId,setExpandedProgramId]=useState(null);
  const[showScience,setShowScience]=useState(false);
  const[durMult,setDurMult]=useState(1);
  const[entryDone,setEntryDone]=useState(false);
  const[nfcCtx,setNfcCtx]=useState(null);
  const[sessionData,setSessionData]=useState({pauses:0,scienceViews:0,phaseTimings:[]});
  // Anclajes temporales reales (Date.now()) para emparejar HRV pre/post.
  // sessionStartedAt se setea al primer "running" del run; sessionEndedAt al
  // entrar comp(). Se reinician en rs() para no contaminar la siguiente sesión.
  const sessionStartedAtRef=useRef(null);
  const sessionEndedAtRef=useRef(null);
  // Delta objetivo (HRV+mood) calculado en comp(); pasado a PostSessionFlow.
  const[postDelta,setPostDelta]=useState(null);
  // Idempotencia del envío a outbox: 1 push por sesión, ya sea desde
  // submitCheckin o desde el path "Omitir check-in".
  const sessionShippedRef=useRef(false);
  const[showCalibration,setShowCalibration]=useState(false);
  const[showProtoDetail,setShowProtoDetail]=useState(false);
  const[showMore,setShowMore]=useState(false);
  const[showHRV,setShowHRV]=useState(false);
  const[showHRVCam,setShowHRVCam]=useState(false);
  const[showHRVHistory,setShowHRVHistory]=useState(false);
  const[showSigh,setShowSigh]=useState(false);
  const[showNSDR,setShowNSDR]=useState(false);
  const[showChronoTest,setShowChronoTest]=useState(false);
  const[showResonanceCal,setShowResonanceCal]=useState(false);
  const[showNOM035,setShowNOM035]=useState(false);
  const[nom35Hint,setNom35Hint]=useState(null);
  const[nom35Dominios,setNom35Dominios]=useState(null);
  const[showCmd,setShowCmd]=useState(false);
  // Reduced motion: sistema + override del usuario (st.reducedMotionOverride).
  // "auto" sigue prefers-reduced-motion del OS · "always" fuerza · "never" desactiva.
  const systemReducedMotion=useReducedMotion();
  const reducedMotion=st.reducedMotionOverride==="always"?true:st.reducedMotionOverride==="never"?false:systemReducedMotion;
  const bp=useBreakpoint();
  const haptic=useHaptic();
  const rootMaxWidth=bp==="desktop"?layout.maxWidthDesktop:bp==="tablet"?layout.maxWidthTablet:layout.maxWidth;
  const rootPadInline=bp==="desktop"?layout.contentPaddingDesktop:bp==="tablet"?layout.contentPaddingTablet:0;
  const iR=useRef(null);const bR=useRef(null);const tR=useRef(null);const cdR=useRef(null);const actLockRef=useRef(false);
  // setTimeouts del countdown ceremony — TTS adelantado 90ms al visual.
  // Necesitamos rastrearlos para limpiar en reset.
  const cdVisualTOsRef=useRef([]);
  const countdownRef=useRef(0);
  // Wall-clock anchors: startMs = Date.now() al entrar "running"; startSec = valor de sec en ese instante.
  // Cada tick recomputa sec a partir de la diferencia real — inmune a jitter de setInterval y tab throttling.
  const startMsRef=useRef(null);const startSecRef=useRef(null);

  const setSt=useCallback(v=>{const nv=typeof v==="function"?v(st):v;setSt_(nv);store.update(nv);},[st]);
  // Dev-mode: expose setSt on window for browser-side seeding/inspection.
  // Active only when NODE_ENV !== "production". No effect in builds.
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    window.__BIO_SET_ST__ = setSt;
  }
  // voiceOn persistente (v13): vive en st.voiceOn, no en useState volátil.
  // Mantenemos los names voiceOn/setVoiceOn para no tocar call-sites.
  const voiceOn=st.voiceOn!==false;
  const setVoiceOn=useCallback(v=>{
    setSt(s=>({...s,voiceOn:typeof v==="function"?v(s.voiceOn!==false):!!v}));
  },[setSt]);

  // Sincroniza preferencias persistentes (st) con el audio engine runtime.
  // Master volume aplica ramp 50ms sobre el master bus gain — sin clicks.
  // Voice rate se almacena module-side; cada speak() lee el valor actual.
  useEffect(()=>{try{setMasterVolume(typeof st.masterVolume==="number"?st.masterVolume:1);}catch(e){}},[st.masterVolume]);
  useEffect(()=>{try{setUserVoiceRate(typeof st.voiceRate==="number"?st.voiceRate:null);}catch(e){}},[st.voiceRate]);
  useEffect(()=>{try{setUserVoicePreference(st.voicePreference||null);}catch(e){}},[st.voicePreference]);
  useEffect(()=>{try{setHapticIntensity(st.hapticIntensity||"medium");}catch(e){}},[st.hapticIntensity]);
  useEffect(()=>{try{setHapticEnabled(st.hapticOn!==false);}catch(e){}},[st.hapticOn]);
  useEffect(()=>{try{setBinauralEnabled(st.binauralOn!==false);}catch(e){}},[st.binauralOn]);
  useEffect(()=>{try{setMusicBedEnabled(st.musicBedOn!==false);}catch(e){}},[st.musicBedOn]);

  // Visual fallback para iOS Safari (sin navigator.vibrate). Cada vez
  // que vibrate() se llama y no hay API, el wrapper dispara este
  // callback. Renderizamos un flash sutil en el top-edge — el usuario
  // iOS recibe SOMETHING sincronizado con la cadencia háptica aunque
  // no sea físico. Date.now() garantiza key única (re-mount AnimatePresence).
  const[hapticFlashKey,setHapticFlashKey]=useState(null);
  useEffect(()=>{
    try{
      setHapticFallback(()=>{
        const k=Date.now();
        setHapticFlashKey(k);
        setTimeout(()=>setHapticFlashKey(prev=>prev===k?null:prev),500);
      });
    }catch(e){}
    return()=>{try{setHapticFallback(null);}catch(e){}};
  },[]);

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
  //
  // Sprint 80 — bug fix crítico: la versión previa colapsaba "fetch falló"
  // (timeout 1200ms o network error) y "user confirmado null" en el mismo
  // path → llamaba store.init({userId:null}) → belongsToUser falla porque
  // loaded._userId era un user real → clearAll() borra IDB + localStorage.
  // Resultado: usuario perdía TODO su estado local en cualquier flicker de
  // red al volver de background. Ahora solo actuamos con confirmación
  // explícita del server (200 con body, o 401 = definitivamente null).
  // Timeout / network error / 5xx = estado desconocido → no tocar nada.
  useEffect(()=>{
    if(typeof document==="undefined")return;
    let busy=false;
    async function recheck(){
      if(busy)return;
      if(document.visibilityState!=="visible")return;
      busy=true;
      try{
        const probe=await Promise.race([
          fetch("/api/auth/session",{credentials:"same-origin",cache:"no-store"})
            .then(async r=>{
              // 401 = server confirma que no hay sesión activa
              if(r.status===401)return{ok:true,userId:null};
              // 200 con body = parseamos el user
              if(r.ok){
                try{const j=await r.json();return{ok:true,userId:j?.user?.id??null};}
                catch{return{ok:false};}
              }
              // 5xx u otro = estado desconocido, preservar local
              return{ok:false};
            })
            .catch(()=>({ok:false})), // network error
          new Promise(res=>setTimeout(()=>res({ok:false}),1200)), // timeout
        ]);
        // Sin confirmación del server, NO tocar el estado local. Mejor
        // false-negative (no detectamos logout) que false-positive (borrar
        // datos del usuario por un blip).
        if(!probe.ok)return;
        const nextId=probe.userId;
        const curId=useStore.getState()._userId??null;
        if(nextId!==curId){
          await store.init({userId:nextId});
          setSt_(useStore.getState());
        }
      }catch{}
      finally{busy=false;}
    }
    document.addEventListener("visibilitychange",recheck);
    return()=>document.removeEventListener("visibilitychange",recheck);
  },[]);

  // ═══ SW RELOAD GATE ═══
  // Sprint 80 — registramos un gate que difiere reload por update del
  // service worker mientras hay sesión activa. Antes: otra tab acepta el
  // update → controllerchange dispara global → ESTA tab recarga aunque
  // el user esté a 30s de cerrar su Reset Ejecutivo. Estado de sesión
  // (ts, sec, pi, sessionData) vive en React state, no persistido →
  // sesión muere irrecuperable. Ahora: el hook poll cada 2s hasta que
  // ts vuelva a "idle". Ref-based para no re-registrar en cada cambio.
  const tsRef=useRef(ts);tsRef.current=ts;
  useEffect(()=>{
    setReloadGate(()=>tsRef.current==="running"||tsRef.current==="paused");
    return()=>setReloadGate(null);
  },[]);

  useCommandKey(setShowCmd, st.soundOn);

  // NOTA: cmdCommands se define MÁS ABAJO, después de las function declarations
  // que referencia (switchTab, go, pa, sp). Evita TDZ bajo React Compiler, que
  // reemite esas function decls como const y pierde el hoisting estándar de JS.

  useEffect(()=>{if(ts!=="running"||typeof document==="undefined")return;function onVis(){if(document.visibilityState==="hidden"&&ts==="running"){setSessionData(d=>({...d,hiddenStart:Date.now()}));pa();}else if(document.visibilityState==="visible"){setSessionData(d=>{if(!d.hiddenStart)return d;return{...d,hiddenMs:(d.hiddenMs||0)+(Date.now()-d.hiddenStart),hiddenStart:null};});}}document.addEventListener("visibilitychange",onVis);return()=>document.removeEventListener("visibilitychange",onVis);},[ts]);

  // Sprint 80 — pausa: validación wall-clock cuando la tab vuelve visible.
  // Mobile browsers throttlean setTimeout en background → el auto-reset
  // de 5min puede no dispararse nunca. Si el user pausa, deja la tab
  // backgrounded por 8 minutos y vuelve, este handler detecta que ya
  // pasaron >= 300s y dispara rs() inmediatamente — la sesión no queda
  // colgada con audio/wakelock fantasma.
  useEffect(()=>{
    if(ts!=="paused"||typeof document==="undefined")return;
    function onVisPaused(){
      if(document.visibilityState!=="visible")return;
      if(!pauseStartedAtRef.current)return;
      const elapsed=Date.now()-pauseStartedAtRef.current;
      if(elapsed>=300000)rs();
    }
    document.addEventListener("visibilitychange",onVisPaused);
    return()=>document.removeEventListener("visibilitychange",onVisPaused);
  },[ts]);
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
    if(idx!==pi&&phAtIdx){
      setPi(idx);
      if(st.hapticOn!==false)hapticPhase(phAtIdx.ic);
      if(st.soundOn!==false)try{playChord([523,784],0.22,0.028);}catch(e){}
      // Frame de cambio de fase: número + acción. Eyes-closed user
      // sabe en qué fase está y qué hacer. "Fase dos. Activa." es claro;
      // solo "Activa." mid-session es desorientador. La instrucción
      // detallada (phAtIdx.i) sigue visible en pantalla — la voz
      // se queda en lo que el user no puede ver.
      const phaseNum=idx+1;
      const totalPh=pr?.ph?.length||0;
      const kicker=phAtIdx.k||"";
      const intro=totalPh>1?`Fase ${phaseNum}. ${kicker}.`:`${kicker}.`;
      speakNow(intro,circadian,voiceOn);
    }
    const ttN=timeToNextPhase(elapsedSec,pr.ph,durMult,pi);
    if(ttN===2&&ts==="running"){
      // Pre-shift con contexto: anuncia QUÉ viene, no "Prepárate" vago.
      // Eyes-closed user puede mentalmente prepararse para la transición
      // si sabe el siguiente verbo de acción.
      const nextKicker=pr?.ph?.[pi+1]?.k;
      const cue=nextKicker?`Próximo: ${nextKicker}. Prepárate.`:"Prepárate.";
      speak(cue,circadian,voiceOn);
      if(st.hapticOn!==false)hapticPreShift();
    }
    return()=>{if(speakTO)clearTimeout(speakTO);};}catch(e){}
  },[sec,pr,durMult]);
  useEffect(()=>{if(ts==="done"&&sec===0)comp();},[ts,sec]);
  // Ember activation. Durante ts="done" la vista es SessionRunner +
  // compFlash + post-session UI (puede durar 10-40s). El núcleo
  // idle no se ve hasta que el usuario termina el post-session flow
  // y ts vuelve a "idle". Ancla el ember a esa transición: al
  // regresar a idle desde done, enciende brasa por 30s. Limpia si
  // arranca otra sesión.
  const prevTsForEmberRef=useRef(ts);
  useEffect(()=>{
    const prev=prevTsForEmberRef.current;
    prevTsForEmberRef.current=ts;
    if(prev==="done"&&ts==="idle"){
      setEmberActive(true);
      const fadeOut=setTimeout(()=>setEmberActive(false),30000);
      return ()=>clearTimeout(fadeOut);
    }
    if(ts==="running"||ts==="paused"){setEmberActive(false);}
    return undefined;
  },[ts]);
  useEffect(()=>{
    if(bR.current)clearInterval(bR.current);
    const ph=pr?.ph?.[pi]||pr?.ph?.[0];
    if(ts!=="running"){setBL("");setBS(1);setBCnt(0);return;}
    if(!ph||!ph.br){
      setBL("");setBS(1);setBCnt(0);
      // Voz minimalista en fases sin breath cycle: cero recordatorios
      // periódicos. Antes se hablaba "Mantén la atención..." cada 20s
      // → exposición innecesaria a TTS robótico. La instrucción visual
      // ya está en pantalla; el orb + waveform mantienen presencia.
      return;
    }
    let t=0;
    let lastLabel="";
    function tk(){
      const f=computeBreathFrame(t,ph.br);
      if(!f){t++;return;}
      setBL(f.label);setBS(f.scale);setBCnt(f.countdown);
      if(f.label!==lastLabel){
        // GUÍA EYES-CLOSED: el usuario en sesión a menudo cierra los
        // ojos. El orb visual + label grande no le sirven; necesita
        // la voz como guía rítmica. Hablamos CADA cambio de sub-fase
        // (inhala/mantén/exhala/pausa) para que pueda seguir sin abrir
        // los ojos. Volumen 0.62 + rate 0.83 mantienen el carácter
        // contemplativo, no narrador.
        speak(f.label.toLowerCase(),circadian,voiceOn);
        hapticBreath(f.label);
        // Cue auditivo bajo umbral de voz, sincronizado con el pulso
        // del orb. El cuerpo recibe 3 señales coherentes en cada
        // transición: visual (pulso de lattice + anillo), háptica
        // (vibración por fase) y sonora (sweep tonal). Solo si el
        // usuario tiene sonido activo.
        if(st.soundOn!==false)playBreathTick(f.label,pr?.int);
        lastLabel=f.label;
      }
      t++;
    }
    tk();
    bR.current=setInterval(tk,1000);
    return()=>{if(bR.current)clearInterval(bR.current);};
  },[ts,pi,pr]);

  function startCountdown(){
    // CEREMONIAL TIMING (top-tier sync):
    // El TTS del browser tiene ~90ms de latencia entre speak() y audio
    // real saliendo del speaker. Antes el código disparaba speak() y
    // setCountdown() en el mismo tick → el visual aparecía inmediato pero
    // la voz llegaba 90ms después. El cuerpo lo lee como "voz mal
    // sincronizada", incluso si no lo articula.
    //
    // Fix: speak fires AHEAD del visual por SPEAK_LEAD_MS, así la voz
    // y el visual aterrizan al mismo tiempo en los sentidos del usuario.
    // Haptic ya tiene latencia ~zero, lo agrupamos con el visual.
    const SPEAK_LEAD_MS=90;
    cdVisualTOsRef.current.forEach(clearTimeout);
    cdVisualTOsRef.current=[];

    // Tick 1 (n=3): inmediato — sin lead posible (es el primer evento).
    // El usuario tolera el desfase del primer "Tres" porque no hay nada
    // antes con qué comparar; los siguientes son los que delatan el lag.
    countdownRef.current=3;
    setCountdown(3);
    if(st.hapticOn!==false)hapticCountdown(3);
    if(st.soundOn!==false)playCountdownTick(3);
    try{speakNow("Tres",circadian,voiceOn);}catch(e){}

    // Tick 2 (n=2): voz a t=910ms, visual+haptic+tick a t=1000ms.
    cdVisualTOsRef.current.push(setTimeout(()=>{try{speakNow("Dos",circadian,voiceOn);}catch(e){}},1000-SPEAK_LEAD_MS));
    cdVisualTOsRef.current.push(setTimeout(()=>{
      countdownRef.current=2;
      setCountdown(2);
      if(st.hapticOn!==false)hapticCountdown(2);
      if(st.soundOn!==false)playCountdownTick(2);
    },1000));

    // Tick 3 (n=1): voz a t=1910ms, visual+haptic+tick a t=2000ms.
    cdVisualTOsRef.current.push(setTimeout(()=>{try{speakNow("Uno",circadian,voiceOn);}catch(e){}},2000-SPEAK_LEAD_MS));
    cdVisualTOsRef.current.push(setTimeout(()=>{
      countdownRef.current=1;
      setCountdown(1);
      if(st.hapticOn!==false)hapticCountdown(1);
      if(st.soundOn!==false)playCountdownTick(1);
    },2000));

    // GO (n=0): a t=3000ms — transición a running, ignition flash + intro.
    // La voz "Comenzamos" se dispara DESPUÉS del setTs porque el
    // ignitionFlash es el evento principal; la voz lo subraya, no lo
    // anticipa. H("go") ya incluye su propia firma audio+haptic.
    // El tick GO (880Hz) se dispara junto al setTs para coincidir con
    // el ignition flash del orb — coronación del arco tonal.
    cdVisualTOsRef.current.push(setTimeout(()=>{
      countdownRef.current=0;
      setCountdown(0);
      setTs("running");
      // Anclaje wall-clock para emparejar HRV pre/post post-sesión.
      // Solo se setea aquí (transición real a "running"); resume() no lo toca.
      sessionStartedAtRef.current=Date.now();
      H("go");
      if(st.soundOn!==false)playCountdownTick(0);
      const firstKicker=pr?.ph?.[0]?.k;
      const intro=firstKicker?`Comenzamos. ${firstKicker}.`:"Comenzamos.";
      try{speakNow(intro,circadian,voiceOn);}catch(e){}
      cdVisualTOsRef.current=[];
    },3000));
  }
  function go(){if(actLockRef.current||ts!=="idle"||countdown>0)return;actLockRef.current=true;setTimeout(()=>{actLockRef.current=false;},500);unlockVoice();if(st.wakeLockEnabled!==false)requestWakeLock();try{const fs=document.documentElement.requestFullscreen?.();if(fs&&typeof fs.catch==="function")fs.catch(()=>{});}catch(e){}setPostStep("none");setPi(0);setSec(Math.round(pr.d*durMult));setSessionData({pauses:0,scienceViews:0,interactions:0,touchHolds:0,motionSamples:0,stability:0,reactionTimes:[],phaseTimings:[],startedAt:Date.now(),hiddenMs:0,hiddenStart:null,expectedSec:Math.round(pr.d*durMult)});startCountdown();}
  const pauseTRef=useRef(null);
  // Sprint 80 — wall-clock anchor para auto-reset 5min en pausa.
  // Antes: pa() programaba setTimeout(rs, 300000) puro. Mobile browsers
  // throttlean setTimeout cuando la tab está backgrounded (Chrome ≈1min,
  // Safari más agresivo) → el timer no dispara → sesión queda colgada
  // con audio/binaural/wakelock activos indefinidamente. Ahora marcamos
  // el momento real de la pausa y validamos en visibilitychange.
  const pauseStartedAtRef=useRef(0);
  useEffect(()=>()=>{if(cdR.current)clearInterval(cdR.current);if(pauseTRef.current)clearTimeout(pauseTRef.current);cdVisualTOsRef.current.forEach(clearTimeout);cdVisualTOsRef.current=[];},[]);
  function pa(){if(actLockRef.current||ts!=="running")return;actLockRef.current=true;setTimeout(()=>{actLockRef.current=false;},500);if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);setTs("paused");stopVoice();stopBinaural();releaseWakeLock();setSessionData(d=>({...d,pauses:d.pauses+1}));if(pauseTRef.current)clearTimeout(pauseTRef.current);pauseStartedAtRef.current=Date.now();pauseTRef.current=setTimeout(()=>{rs();},300000);}
  function resume(){if(actLockRef.current||ts!=="paused")return;actLockRef.current=true;setTimeout(()=>{actLockRef.current=false;},500);if(pauseTRef.current)clearTimeout(pauseTRef.current);pauseStartedAtRef.current=0;setTs("running");H("go");speakNow("continúa",circadian,voiceOn);if(st.wakeLockEnabled!==false)requestWakeLock();if(st.soundOn!==false)startBinaural(pr.int);}
  function rs(){releaseWakeLock();if(pauseTRef.current)clearTimeout(pauseTRef.current);pauseStartedAtRef.current=0;try{if(document.fullscreenElement){const ef=document.exitFullscreen?.();if(ef&&typeof ef.catch==="function")ef.catch(()=>{});}}catch(e){}if(iR.current)clearInterval(iR.current);if(bR.current)clearInterval(bR.current);if(tR.current)clearInterval(tR.current);if(cdR.current)clearInterval(cdR.current);cdVisualTOsRef.current.forEach(clearTimeout);cdVisualTOsRef.current=[];countdownRef.current=0;setTs("idle");setSec(Math.round(pr.d*durMult));setPi(0);setBL("");setBS(1);setBCnt(0);setPostStep("none");setCheckMood(0);setCheckEnergy(0);setCheckTag("");setPreMood(0);setCountdown(0);setCompFlash(false);stopVoice();sessionStartedAtRef.current=null;sessionEndedAtRef.current=null;setPostDelta(null);sessionShippedRef.current=false;}
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
    cdVisualTOsRef.current.forEach(clearTimeout);
    cdVisualTOsRef.current=[];
    countdownRef.current=0;
    setTs("idle");setPi(0);setBL("");setBS(1);setBCnt(0);
    setPostStep("none");setCheckMood(0);setCheckEnergy(0);setCheckTag("");
    setPreMood(0);setCountdown(0);setCompFlash(false);stopVoice();
    setPr(p);setSl(false);setShowIntent(false);
    setSec(Math.round(p.d*durMult));
    setShowScience(false);
  }
  function timerTap(){unlockVoice();H("tap");if(ts==="idle"){go();}else if(ts==="running")pa();else if(ts==="paused")resume();}
  function switchTab(id){
    if(id===tab)return;
    // Marcar como visitado antes de cambiar — el componente se monta
    // recién cuando lo necesitamos, no al cargar la página.
    setVisitedTabs(v=>v[id]?v:{...v,[id]:true});
    setTab(id);
    H("tap");
    uiSound.nav(st.soundOn);
    announce(`Pestaña ${id==="ignicion"?"Ignición":id==="dashboard"?"Dashboard":"Perfil"} activa`,"polite");
  }
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
    sessionEndedAtRef.current=Date.now();
    const{sessionDataFull}=computeSessionMetrics({sessionData,protocol:pr,durMult,now:Date.now()});
    const result=calcSessionCompletion(st,{protocol:pr,durMult,sessionData:sessionDataFull,nfcCtx,circadian});
    // Evidencia objetiva post-sesión. preMood ya está capturado; postMood
    // entra después en submitCheckin → entonces se enriquece el delta.
    try{
      const delta0=buildSessionDelta({
        sessionStartedAt:sessionStartedAtRef.current,
        sessionEndedAt:sessionEndedAtRef.current,
        hrvLog:st.hrvLog,
        preMood,
        postMood:null,
        durationSec:Math.round(pr.d*durMult),
      });
      setPostDelta(delta0);
    }catch(e){setPostDelta(null);}
    setPostVC(result.eVC);setPostMsg(POST_MSGS[Math.floor(Math.random()*POST_MSGS.length)]);
    releaseWakeLock();speakNow(sessionQualityMessage(result.bioQ.quality),circadian,voiceOn);
    // Finale unificado para TODOS los protocolos y duraciones.
    // Visual: NeuralCore3D collapse (supernova + 3 shockwave rings +
    //   8 radial rays + bloom + firings), 1600ms gated por
    //   orbDoneFlash. Es el único cierre visual — el Sealing legacy
    //   + compFlash/IgnitionBurst quedaron retirados.
    // Audio: playIgnition — brand-established 3-layer chord (spark
    //   1320/1760, core 528/792/1056/1320, tail 264/396) que respira
    //   durante los 1.6s del collapse. Un solo audio hero, no hay
    //   rama de calidad distinta para mantener la firma consistente.
    // Haptic: hapticSignature("ignition") — patrón 7-beat de ignición.
    // La antigua rama condicional por quality queda eliminada para
    // que cada sesión termine IDÉNTICA en el canal sensorial de
    // cierre, independiente de completación/protocolo/duración.
    if(st.soundOn!==false)try{playIgnition();}catch(e){}
    if(st.hapticOn!==false)hapticSignature("ignition");
    setOrbDoneFlash(true);
    setTimeout(()=>{
      setOrbDoneFlash(false);
      setPostStep("breathe");
    },1600);
    setCheckMood(0);setCheckEnergy(0);setCheckTag("");
    setSt({...st,...result.newState});
    // ─── Programs — avance del día si aplica ───────────────
    // Si el usuario tiene un activeProgram y el protocolo recién
    // completado coincide con la sesión del día de hoy (dentro del
    // programa), marcamos ese día como completado y, si el programa
    // termina ahí, lo finalizamos (archivo + XP bonus + achievement).
    // Idempotente: completeProgramDay ignora días ya marcados.
    if(st.activeProgram&&st.activeProgram.id&&pr?.id){
      const todayStatus=programTodayStatus(st.activeProgram);
      if(todayStatus.shouldSession&&todayStatus.session&&todayStatus.session.protocolId===pr.id){
        store.completeProgramDay(todayStatus.day,{protocolId:pr.id,bioQ:result.bioQ?.quality});
        const program=todayStatus.program;
        const totalRequired=programRequiredSessions(program);
        const completedNow=(st.activeProgram.completedSessionDays?.length||0)+1;
        if(completedNow>=totalRequired){
          const finalized=store.finalizeProgram({totalRequired});
          if(finalized){
            announce(`¡Programa ${program.n} completado! +20 vCores.`,"polite");
          }
        }else{
          announce(`Día ${todayStatus.day} del programa ${program.n} completado.`,"polite");
        }
        setSt_(useStore.getState());
      }
    }
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
    shipSessionToOutbox(checkMood>0?checkMood:null);
    setPostStep("summary");
  }
  // Envío idempotente a outbox. Llamado desde submitCheckin y desde el path
  // de "Omitir check-in". Solo se dispara una vez por sesión.
  function shipSessionToOutbox(postMoodValue){
    if(sessionShippedRef.current)return;
    sessionShippedRef.current=true;
    try{
      const finalDelta=buildSessionDelta({
        sessionStartedAt:sessionStartedAtRef.current,
        sessionEndedAt:sessionEndedAtRef.current,
        hrvLog:useStore.getState().hrvLog,
        preMood,
        postMood:postMoodValue,
        durationSec:Math.round(pr.d*durMult),
      });
      setPostDelta(finalDelta);
      const payload=buildSessionOutboxPayload({
        protocolId:pr?.id||pr?.n||"unknown",
        durationSec:Math.round(pr.d*durMult),
        delta:finalDelta,
        preMood,
        postMood:postMoodValue,
        completedAt:sessionEndedAtRef.current||Date.now(),
      });
      const userId=useStore.getState()._userId??null;
      // id determinístico: completedAt(ISO) + protocolId. Idempotente en
      // outbox upsert. Para sesiones sin protocolId resolvido, agregamos un
      // sufijo aleatorio corto para evitar colisión por mismo segundo.
      const idBase=`s-${payload.completedAt}-${payload.protocolId||`p-${Math.random().toString(36).slice(2,8)}`}`;
      const sessionId=idBase.slice(0,128);
      outboxAdd({id:sessionId,kind:"session",payload,userId}).catch(()=>{});
    }catch(e){/* silencioso: el envío no debe romper el cierre de sesión */}
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
  // Sprint 77 — progStep / PROG_7 deprecated. El nuevo sistema (Sprint 64+)
  // usa programs.js + programSuggestion.js + ActiveProgramCard con calendar-
  // based progress + weekly cooldown. Reemplaza el bloque legacy "Programa
  // 7 Días" que tenía el bug del progDay-counter.
  const prediction=useMemo(()=>predictSessionImpact(st,pr),[st.moodLog,pr.id]);
  const cogLoad=useMemo(()=>estimateCognitiveLoad(st),[st.todaySessions,st.moodLog]);
  const optimalTime=useMemo(()=>{try{return suggestOptimalTime(st);}catch(e){return null;}},[st.history,st.moodLog]);

  const{bg,card:cd,surface,border:bd,t1,t2,t3,scrim}=resolveTheme(isDark);
  const ac=pr.cl;

  // ─── Spark arrival callback (audio + haptic lockstep) ────
  // Se invoca 1 vez por firing sináptico del NeuralCore3D, cuando
  // el spark alcanza su mote destino. Multisensorial:
  //   · audio: blip corto (~55ms) a la frecuencia propuesta
  //   · haptic: vibrate 10ms, rate-limited a 100ms mínimo entre
  //     eventos para evitar rechazo en Android durante ráfagas
  // Respeta settings y solo activa durante running/done para no
  // molestar en idle (donde los firings son decorativos).
  const sparkHapticRef=useRef(0);
  const handleSparkHit=useCallback(({pitch})=>{
    if(ts!=="running"&&ts!=="done")return;
    if(st.soundOn!==false){try{playSpark(pitch,0.055);}catch(e){}}
    const now=Date.now();
    if(now-sparkHapticRef.current>100){
      sparkHapticRef.current=now;
      haptic("tap");
    }
  },[ts,st.soundOn,haptic]);

  // ─── Loading screen — identidad BIO-IGNICIÓN ─────────────
  // Siempre en paleta oscura (deepField), sin importar el modo del sistema.
  if(!mt)return(<div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:bioSignal.deepField,gap:space[5],paddingInline:space[5]}}>
    <BioIgnicionMark layout="stack" glyphSize={76} textColor={darkPalette.text.primary} signalColor={bioSignal.phosphorCyan} animated letterSpacing={6}/>
    <div style={{fontSize:font.size.sm,color:darkPalette.text.muted,letterSpacing:2,textTransform:"uppercase",fontWeight:font.weight.semibold}}>Neural Performance System</div>
  </div>);

  return(
  <div data-bp={bp} style={{maxWidth:rootMaxWidth,margin:"0 auto",minHeight:"100dvh",background:"#08080A",color:"rgba(245,245,247,0.92)",position:"relative",overflowX:"hidden",fontFamily:font.family,transition:"background .8s, max-width .25s",paddingBlockEnd:"env(safe-area-inset-bottom)",paddingInlineStart:`max(${rootPadInline}px, env(safe-area-inset-left))`,paddingInlineEnd:`max(${rootPadInline}px, env(safe-area-inset-right))`}}>

  {/* Prototype atmosphere — Soft Sensory Dark · Element 1 v6 (quiet depth + alive only when running) — applied universally across all tabs for ADN coherence */}
  {(()=>{
    const intentColorMap={calma:"34,211,238",enfoque:"99,102,241",energia:"245,158,11",reset:"167,139,250"};
    const intentRGB=intentColorMap[pr?.int]||"139,92,246";
    const isRunning=ts==="running";
    const breathBoost=isRunning&&isBr?(bS||1):1;
    return(<>
      <svg width="0" height="0" style={{position:"absolute"}} aria-hidden="true">
        <filter id="protoGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="2" stitchTiles="stitch"/>
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0"/>
        </filter>
      </svg>
      {/* Mood halo — visible ONLY during running session (when content is hidden + breath coupling) */}
      {isRunning&&<motion.div aria-hidden="true"
        animate={reducedMotion?{}:{scale:[1,1.10*breathBoost,1],opacity:[0.18,0.32,0.18]}}
        transition={reducedMotion?{}:{duration:5,repeat:Infinity,ease:"easeInOut"}}
        style={{position:"fixed",top:"50%",left:"50%",translate:"-50% -50%",width:"120vmax",height:"90vmax",pointerEvents:"none",zIndex:0,background:`radial-gradient(ellipse at center, rgba(${intentRGB},0.30) 0%, rgba(${intentRGB},0.12) 30%, rgba(${intentRGB},0.04) 50%, transparent 65%)`,filter:"blur(55px)",borderRadius:"50%"}}
      />}
      {/* Dot grid — Observatory pattern */}
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1,backgroundImage:"radial-gradient(circle at center, rgba(255,255,255,0.07) 1px, transparent 1.2px)",backgroundSize:"22px 22px"}}/>
      {/* Constellation drift — 4 micro-particles, subtle */}
      {!reducedMotion&&[
        {x:"14%",y:"22%",d:78,delay:0,sz:1.4},
        {x:"82%",y:"40%",d:94,delay:14,sz:1.6},
        {x:"30%",y:"66%",d:88,delay:28,sz:1.3},
        {x:"66%",y:"82%",d:104,delay:42,sz:1.5},
      ].map((p,i)=>(
        <motion.span key={`star-${i}`} aria-hidden="true"
          animate={{x:["0vmin","-10vmin","16vmin","0vmin"],y:["0vmin","8vmin","-10vmin","0vmin"],opacity:[0.0,0.30,0.20,0.0]}}
          transition={{duration:p.d,repeat:Infinity,ease:"linear",delay:p.delay,times:[0,0.33,0.66,1]}}
          style={{position:"fixed",left:p.x,top:p.y,inlineSize:p.sz,blockSize:p.sz,borderRadius:"50%",background:"#fff",boxShadow:"0 0 5px rgba(255,255,255,0.50), 0 0 2px rgba(255,255,255,0.80)",pointerEvents:"none",zIndex:1}}
        />
      ))}
      {/* Edge vignette — very subtle spotlight */}
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:2,background:"radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.20) 85%, rgba(0,0,0,0.32) 100%)"}}/>
      {/* Grain — cinematic film texture */}
      <div aria-hidden="true" style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:2,opacity:0.05,filter:"url(#protoGrain)",mixBlendMode:"overlay"}}/>
    </>);
  })()}

  {/* iOS haptic visual fallback — flash visible top-edge cuando el
      device no soporta navigator.vibrate. El usuario lee la cadencia
      háptica via "haptic light".
      Diseño: bar 3px con doble glow (8px nítido + 24px difuso) +
      gradient horizontal accent. Al peak (0.9 opacity) inequívoco
      en móvil. AnimatePresence + key={Date.now()} para que cada
      evento spawn flash nuevo. */}
  <AnimatePresence>
    {hapticFlashKey&&(
      <motion.div
        key={hapticFlashKey}
        aria-hidden="true"
        initial={{opacity:0,scaleX:0.3}}
        animate={{opacity:[0,0.9,0],scaleX:[0.3,1,1]}}
        exit={{opacity:0}}
        transition={{duration:reducedMotion?0:0.45,ease:[.16,1,.3,1]}}
        style={{
          position:"fixed",
          top:"env(safe-area-inset-top, 0)",
          left:0,
          right:0,
          height:3,
          background:`linear-gradient(90deg, transparent, ${ac} 30%, ${ac} 70%, transparent)`,
          boxShadow:`0 0 8px ${ac}, 0 0 24px ${withAlpha(ac,55)}, 0 2px 12px ${withAlpha(ac,35)}`,
          pointerEvents:"none",
          zIndex:9999,
          transformOrigin:"center",
        }}
      />
    )}
  </AnimatePresence>

  {/* Session Runner — fullscreen cinematic overlay (countdown + running + paused) */}
  {/* Handler para sincronía audio-háptica con los firings del core.
      Se dispara 1 vez por spark cuando alcanza su destino. Audio:
      blip de ~55ms a la frecuencia derivada de la y del mote
      (arriba agudo, abajo grave → la red neuronal "suena" como
      red). Háptica: vibrate breve, rate-limited a 100ms para evitar
      rechazo en Android o fatiga en ignition wave / resonance
      collapse (que traen ráfagas densas).
      Respeta settings st.soundOn / st.hapticOn. */}
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
    totalSessions={st.totalSessions||0}
    sealing={orbDoneFlash}
    scienceDeep={pr&&SCIENCE_DEEP?SCIENCE_DEEP[pr.id]||"":""}
    onBiofeedback={(coh)=>{if(coh)setSessionData(d=>({...d,coherenceLive:coh}));}}
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
    onSparkHit={handleSparkHit}
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
            backdropFilter:"blur(20px) saturate(180%)",
            WebkitBackdropFilter:"blur(20px) saturate(180%)",
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
  <PostSessionFlow postStep={postStep} ts={ts} ac={ac} isDark={isDark} pr={pr} durMult={durMult} st={st} checkMood={checkMood} setCheckMood={setCheckMood} checkEnergy={checkEnergy} setCheckEnergy={setCheckEnergy} checkTag={checkTag} setCheckTag={setCheckTag} preMood={preMood} postVC={postVC} postMsg={postMsg} moodDiff={moodDiff} delta={postDelta} H={H} submitCheckin={submitCheckin} onSetPostStep={setPostStep} onReset={rs} onSkipCheckin={()=>{shipSessionToOutbox(null);setPostStep("summary");}}/>

  {/* ═══ INTENT PICKER ═══ */}
  <AnimatePresence>
  {showIntent&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:z.modal,background:scrim,backdropFilter:"blur(24px) saturate(180%)",WebkitBackdropFilter:"blur(24px) saturate(180%)",display:"flex",alignItems:"center",justifyContent:"center",padding:space[6]}} onClick={()=>setShowIntent(false)}>
    <motion.div initial={{scale:.9}} animate={{scale:1}} transition={SPRING.default} style={{background:cd,borderRadius:28,padding:"26px 20px",maxWidth:380,width:"100%"}} onClick={e=>e.stopPropagation()}>
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
  <HRVCameraMeasure show={showHRVCam} isDark={isDark} onClose={()=>setShowHRVCam(false)} onComplete={(entry)=>{store.logHRV(entry);setSt_(useStore.getState());}} onUseBLE={()=>setShowHRV(true)}/>
  <HRVHistoryPanel show={showHRVHistory} isDark={isDark} hrvLog={st.hrvLog} history={st.history} onClose={()=>setShowHRVHistory(false)} onMeasureNew={()=>setShowHRVCam(true)}/>
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

  {/* ═══ MAIN CONTENT ═══
      Sin AnimatePresence/motion.div con key={tab}: el key change
      forzaba unmount completo de los 3 paneles en cada switch
      (defeating keep-mounted) + mode="wait" añadía 320ms de espera.
      Ahora switch instant tipo Twitter/Linear: los panels viven
      siempre, solo cambia visibility. */}
  <div style={{position:"relative",zIndex:1}}>
  <div
    onPointerDown={onSwipeStart}
    onPointerUp={onSwipeEnd}
    onPointerCancel={()=>{swipeRef.current=null;}}
    style={{touchAction:"pan-y"}}
  >

  {/* ═══ TAB: IGNICIÓN ═══ */}
  {tab==="ignicion"&&postStep==="none"&&!compFlash&&(<div style={{padding:"14px 20px 180px"}}>
    {/* Trial / dunning banner — solo si hay state que comunicar
        (trial activo, expirando, expirado pidiendo reactivar, dunning).
        Self-hides cuando plan ≥ PRO confirmado y FREE sin trial. */}
    {ts==="idle"&&<BillingBanner accent={ac}/>}
    {/* Header — Soft Sensory Dark · Element 2 (eyebrow + saludo + subtítulo + avatar + pulse) */}
    {ts==="idle"&&tab==="ignicion"&&(()=>{
      const done=st.todaySessions||0;
      const goal=st.sessionGoal||2;
      const now=new Date();
      const h=now.getHours(), mn=now.getMinutes();
      const eyebrowPeriod=h<6?"MADRUGADA":h<12?"MAÑANA":h<18?"TARDE":h<22?"ATARDECER":"NOCHE";
      const timeStr=`${String(h).padStart(2,"0")}:${String(mn).padStart(2,"0")}`;
      const greeting=h<6?"Buenas noches":h<12?"Buenos días":h<18?"Buenas tardes":"Buenas noches";
      const loadLabel=cogLoad.level==="alto"?"carga alta":cogLoad.level==="medio"?"carga media":"carga ligera";
      const sub=goal>0?`${done} de ${goal} sesiones · ${loadLabel}`:"Tu sistema te lee.";
      const PHOSPHOR="#22D3EE";
      const TEXT="rgba(245,245,247,0.95)";
      const TEXT_DIM="rgba(245,245,247,0.55)";
      const TEXT_MICRO="rgba(245,245,247,0.42)";
      const initial=((st.userName||"R").trim()[0]||"R").toUpperCase();
      return(
      <motion.div initial={reducedMotion?undefined:{opacity:0,y:10}} animate={reducedMotion?undefined:{opacity:1,y:0}} transition={reducedMotion?undefined:{duration:0.55,delay:0.05,ease:[0.22,1,0.36,1]}} style={{marginBlockStart:6,marginBlockEnd:space[5]}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBlockEnd:24}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <span aria-hidden="true" style={{position:"relative",inlineSize:10,blockSize:10,display:"inline-block",flexShrink:0}}>
              <motion.span
                animate={reducedMotion?{}:{scale:[1,3.0,1],opacity:[0.35,0,0.35]}}
                transition={reducedMotion?{}:{duration:3.4,repeat:Infinity,ease:"easeOut"}}
                style={{position:"absolute",inset:0,borderRadius:"50%",background:PHOSPHOR,filter:"blur(0.5px)"}}
              />
              <motion.span
                animate={reducedMotion?{}:{scale:[1,2.2,1],opacity:[0.55,0,0.55]}}
                transition={reducedMotion?{}:{duration:2.0,repeat:Infinity,ease:"easeOut",delay:0.4}}
                style={{position:"absolute",inset:0,borderRadius:"50%",background:PHOSPHOR}}
              />
              <span style={{position:"absolute",inset:0,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%, #E6FBFF 0%, #22D3EE 55%, #0891B2 100%)",boxShadow:`0 0 14px ${PHOSPHOR}, 0 0 5px ${PHOSPHOR}, inset 0 0 2px rgba(255,255,255,0.55)`}}/>
            </span>
            <span aria-label={`${eyebrowPeriod} ${timeStr}`} style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:11,letterSpacing:"0.24em",color:"rgba(245,245,247,0.52)",fontWeight:500,fontVariantNumeric:"tabular-nums",textTransform:"uppercase"}}>{eyebrowPeriod} · {timeStr}</span>
          </div>
          <button
            type="button"
            aria-label={`Abrir perfil. ${done} de ${goal} sesiones hoy. ${loadLabel}.`}
            onClick={()=>switchTab("perfil")}
            style={{position:"relative",inlineSize:36,blockSize:36,minBlockSize:36,minInlineSize:36,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.14)",background:"radial-gradient(circle at 30% 25%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, rgba(34,211,238,0.34) 0%, rgba(139,92,246,0.34) 100%)",backdropFilter:"blur(24px) saturate(140%)",WebkitBackdropFilter:"blur(24px) saturate(140%)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.32), 0 6px 18px rgba(0,0,0,0.30), 0 0 0 1px rgba(0,0,0,0.40)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:TEXT,fontSize:13,fontWeight:500,letterSpacing:0.4,padding:0,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",transition:"transform .2s ease"}}
          >
            <motion.span aria-hidden="true" animate={reducedMotion?{}:{scale:[1,1.18,1],opacity:[0.45,0,0.45]}} transition={reducedMotion?{}:{duration:2.6,repeat:Infinity,ease:"easeOut"}} style={{position:"absolute",inset:-3,borderRadius:"50%",border:`1px solid ${PHOSPHOR}`,pointerEvents:"none"}}/>
            {initial}
          </button>
        </div>
        <motion.h1
          initial={reducedMotion?undefined:{backgroundPosition:"120% 0, 0 0"}}
          animate={reducedMotion?undefined:{backgroundPosition:["120% 0, 0 0","-20% 0, 0 0","-20% 0, 0 0"]}}
          transition={reducedMotion?undefined:{duration:11,times:[0,0.55,1],ease:"easeInOut",repeat:Infinity,repeatDelay:0}}
          style={{margin:0,fontSize:46,lineHeight:1.0,fontWeight:250,letterSpacing:-1.9,fontFeatureSettings:"'ss01' on, 'ss02' on, 'cv11' on",backgroundImage:"linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(238,238,242,0.86) 60%, rgba(225,225,232,0.78) 100%)",backgroundSize:"200% 100%, 100% 100%",backgroundRepeat:"no-repeat",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent",textShadow:"none",filter:"drop-shadow(0 1px 0 rgba(0,0,0,0.30))"}}>
          {greeting}.
        </motion.h1>
        <p style={{margin:"10px 0 0",fontSize:14,lineHeight:1.45,fontWeight:400,letterSpacing:-0.15,color:"rgba(245,245,247,0.62)",fontVariantNumeric:"tabular-nums",fontFeatureSettings:"'cv11' on, 'ss01' on"}}>
          {goal>0?(()=>{const semColor=cogLoad.level==="alto"?"#F472B6":cogLoad.level==="medio"?"#F59E0B":"#22D3EE";return(<>
            <span style={{color:"rgba(245,245,247,0.78)"}}>{done} de {goal} sesiones</span>
            <span aria-hidden="true" style={{color:"rgba(245,245,247,0.26)",fontWeight:300,marginInline:7}}>·</span>
            <span style={{color:semColor,opacity:0.94,textShadow:`0 0 8px ${semColor}30`}}>{loadLabel}</span>
          </>);})():sub}
        </p>
      </motion.div>
      );
    })()}
    {/* Hero Composite — Soft Sensory Dark · Element 3 (readiness number + aurora cyan→violet + pill + coach line) */}
    {ts==="idle"&&tab==="ignicion"&&(()=>{
      const PHOSPHOR="#22D3EE";
      const VIOLET="#A78BFA";
      const TEXT="rgba(245,245,247,0.95)";
      const TEXT_DIM="rgba(245,245,247,0.62)";
      const TEXT_MICRO="rgba(245,245,247,0.50)";
      const score=readiness?.score;
      const interp=readiness?.interpretation;
      const insufficient=readiness?.insufficient||score==null;
      const pillText=insufficient?"RECOLECTANDO DATOS":interp==="primed"?"RECURSOS ELEVADOS":interp==="ready"?"ESTADO ESTABLE":interp==="caution"?"REQUIERE CALIBRACIÓN":"REQUIERE DESCARGA";
      const pillColor=insufficient?VIOLET:interp==="primed"?PHOSPHOR:interp==="ready"?PHOSPHOR:interp==="caution"?"#F59E0B":"#F472B6";
      const optimal=suggestOptimalTime(st);
      const coachLine=insufficient
        ?"Tras 3 sesiones detectaremos tu ventana óptima."
        :optimal?.peakHour!=null
          ?`Tu mejor ventana hoy es a las ${String(optimal.peakHour).padStart(2,"0")}:00.`
          :readiness?.recommendation?.reason||"Tu sistema te lee.";
      const display=insufficient?"—":String(score);
      return(
      <motion.div initial={reducedMotion?undefined:{opacity:0,y:10}} animate={reducedMotion?undefined:{opacity:1,y:0}} transition={reducedMotion?undefined:{duration:0.55,delay:0.13,ease:[0.22,1,0.36,1]}} style={{position:"relative",marginBlockStart:8,marginBlockEnd:24,minBlockSize:240,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"visible"}}>
        {/* Aurora — multi-stop radial (núcleo specular + halo atmosférico) */}
        <motion.div
          aria-hidden="true"
          animate={reducedMotion?{}:{scale:[1,1.08,1],opacity:[0.88,1,0.88]}}
          transition={reducedMotion?{}:{duration:8,repeat:Infinity,ease:"easeInOut"}}
          style={{position:"absolute",top:"50%",left:"50%",translate:"-50% -50%",inlineSize:520,blockSize:360,pointerEvents:"none",zIndex:0,background:"radial-gradient(ellipse 28% 24% at 50% 45%, rgba(255,255,255,0.14) 0%, rgba(34,211,238,0.36) 35%, transparent 75%), radial-gradient(ellipse 70% 60% at center, rgba(34,211,238,0.34) 0%, rgba(99,102,241,0.28) 28%, rgba(139,92,246,0.20) 48%, rgba(139,92,246,0.06) 65%, transparent 82%)",filter:"blur(50px)",borderRadius:"50%"}}
        />
        {/* Pill estado */}
        <div style={{position:"relative",zIndex:1,display:"inline-flex",alignItems:"center",gap:7,paddingBlock:7,paddingInline:14,marginBlockEnd:18,borderRadius:999,background:`linear-gradient(180deg, ${pillColor}1f 0%, ${pillColor}0d 100%)`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.30), 0 0 0 1px ${pillColor}3a, 0 6px 20px ${pillColor}24`,backdropFilter:"blur(18px) saturate(140%)",WebkitBackdropFilter:"blur(18px) saturate(140%)"}}>
          <span aria-hidden="true" style={{position:"relative",inlineSize:6,blockSize:6,display:"inline-block",flexShrink:0}}>
            <span style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0%, ${pillColor} 60%, ${pillColor} 100%)`,boxShadow:`0 0 8px ${pillColor}, 0 0 3px ${pillColor}`}}/>
          </span>
          <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,letterSpacing:"0.26em",fontWeight:600,color:pillColor,textTransform:"uppercase",fontVariantNumeric:"tabular-nums"}}>{pillText}</span>
        </div>
        {/* Hero number / 3 orbes calibrating */}
        <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"baseline",gap:6,minBlockSize:120}}>
          {insufficient?(
            <div role="img" aria-label="Recolectando datos para tu readiness" style={{display:"flex",alignItems:"center",gap:22,blockSize:120}}>
              {[0,1,2].map(i=>(
                <motion.span
                  key={i}
                  aria-hidden="true"
                  animate={reducedMotion?{}:{opacity:[0.22,1,0.22],scale:[0.78,1.08,0.78]}}
                  transition={reducedMotion?{}:{duration:1.8,repeat:Infinity,ease:"easeInOut",delay:i*0.36}}
                  style={{position:"relative",inlineSize:22,blockSize:22,borderRadius:"50%",background:"radial-gradient(circle at 32% 28%, #FFFFFF 0%, rgba(255,255,255,0.92) 22%, rgba(186,180,255,0.75) 55%, rgba(124,108,224,0.55) 100%)",boxShadow:"0 0 18px rgba(167,139,250,0.55), 0 0 6px rgba(34,211,238,0.40), inset 0 0 4px rgba(255,255,255,0.4)"}}
                />
              ))}
            </div>
          ):(
            <>
              <span aria-label={`Score de readiness ${score}`} style={{fontSize:128,lineHeight:0.92,fontWeight:200,letterSpacing:-6,color:TEXT,fontVariantNumeric:"tabular-nums",fontFeatureSettings:"'tnum' on"}}>{display}</span>
              <span style={{fontSize:18,fontWeight:300,color:TEXT_MICRO,letterSpacing:-0.3,marginInlineStart:2}}>readiness</span>
            </>
          )}
        </div>
        {/* Coach line */}
        <p style={{position:"relative",zIndex:1,margin:"14px 24px 0",fontSize:14,lineHeight:1.5,fontWeight:400,color:"rgba(245,245,247,0.66)",textAlign:"center",letterSpacing:-0.15,maxInlineSize:300,fontFeatureSettings:"'cv11' on, 'ss01' on"}}>
          {coachLine}
        </p>
      </motion.div>
      );
    })()}
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
          style={{flexShrink:0,minInlineSize:44,minBlockSize:44,inlineSize:44,blockSize:44,borderRadius:"50%",border:"none",background:"transparent",color:t3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,lineHeight:1}}
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

    {/* Active Program Card — muestra la trayectoria en curso si existe */}
    {ts==="idle"&&st.activeProgram&&<ActiveProgramCard
      activeProgram={st.activeProgram}
      isDark={isDark}
      onStartDay={(session,program)=>{
        const proto=P.find(p=>p.id===session.protocolId);
        if(!proto)return;
        const mult=session.durMult||durMult||1;
        setPr(proto);
        setDurMult(mult);
        setSec(Math.round((proto.d||120)*mult));
        go();
      }}
      onViewProgram={(program)=>{
        announce(`Programa ${program.n}: ${program.sb_long}`,"polite");
      }}
      onAbandon={(program)=>{
        if(typeof window!=="undefined"&&window.confirm(`¿Abandonar "${program.n}"? Se archivará con el progreso actual.`)){
          store.abandonProgram();
          setSt_(useStore.getState());
          announce("Programa abandonado.","polite");
        }
      }}
    />}

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

    {/* Sprint 78 — Cognitive Load card eliminada. Su info se compactó
        en chip dentro del brand kicker arriba (done/goal + nivel).
        Reduce ruido visual sin perder dato. */}

    {/* Sprint 78 — Daily Ignición ahora va PRIMERO (CTA principal,
        hero), seguido del trio quick actions como secondary access.
        Antes vivía debajo del trio y duplicaba intent sin jerarquía. */}
    {ts==="idle"&&(()=>{
      const now=new Date();
      const dayName=now.toLocaleDateString('es-ES',{weekday:'long'}).toUpperCase();
      const dayNum=now.getDate();
      const monthShort=now.toLocaleDateString('es-ES',{month:'short'}).toUpperCase().replace(".","");
      const todayLabel=`Hoy · ${dayName} ${dayNum}`;
      const peakHour=optimalTime?.peakHour;
      const currentHour=now.getHours();
      const currentMin=now.getMinutes();
      let windowLabel=null;let inWindow=false;
      if(typeof peakHour==="number"){
        const diffMin=((peakHour-currentHour+24)%24)*60-currentMin;
        if(diffMin>=-30&&diffMin<=30){inWindow=true;windowLabel="Ahora";}
        else if(diffMin>0&&diffMin<24*60){const h=Math.floor(diffMin/60);const m=Math.round(diffMin%60);windowLabel=h>=1?`En ${h}h ${m}m`:`En ${m}m`;}
      }
      return(
      <motion.button initial={reducedMotion?undefined:{opacity:0,y:10}} animate={reducedMotion?undefined:{opacity:1,y:0}} transition={reducedMotion?undefined:{duration:0.55,delay:0.20,ease:[0.22,1,0.36,1]}} whileTap={{scale:.97}} onClick={()=>sp(daily.proto)} style={{width:"100%",padding:"18px 16px 18px 18px",marginBottom:14,borderRadius:24,border:`0.5px solid rgba(255,255,255,0.10)`,background:`radial-gradient(circle at 88% 12%, ${daily.proto.cl}30 0%, transparent 38%), radial-gradient(circle at 0% 100%, rgba(0,0,0,0.20) 0%, transparent 42%), linear-gradient(135deg, ${daily.proto.cl}18 0%, ${daily.proto.cl}08 50%, rgba(255,255,255,0.02) 100%)`,backdropFilter:"blur(28px) saturate(160%) brightness(1.04)",WebkitBackdropFilter:"blur(28px) saturate(160%) brightness(1.04)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.30), inset 1px 0 0 rgba(255,255,255,0.05), 0 1px 0 ${daily.proto.cl}14, 0 12px 36px rgba(0,0,0,0.40), 0 0 0 1px ${daily.proto.cl}28`,cursor:"pointer",textAlign:"left",display:"flex",gap:14,alignItems:"center",position:"relative",overflow:"hidden"}}>
      <motion.div aria-hidden="true" animate={reducedMotion?{}:{scale:[1,1.10,1],opacity:[0.85,1,0.85]}} transition={reducedMotion?{}:{duration:6,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",top:-60,right:-60,width:210,height:210,borderRadius:"50%",background:`radial-gradient(circle, ${daily.proto.cl}55 0%, ${daily.proto.cl}1c 30%, ${daily.proto.cl}08 50%, transparent 70%)`,filter:"blur(20px)",pointerEvents:"none"}}/>
      <div style={{position:"relative",inlineSize:48,blockSize:48,borderRadius:15,background:`radial-gradient(circle at 30% 25%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${daily.proto.cl}40 0%, ${daily.proto.cl}14 100%)`,border:`1px solid ${daily.proto.cl}4a`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.28), 0 6px 18px ${daily.proto.cl}3a, 0 0 18px ${daily.proto.cl}26`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,color:daily.proto.cl,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.04em",textShadow:`0 0 10px ${daily.proto.cl}80`,flexShrink:0,zIndex:1}}>{daily.proto.tg}</div>
      <div style={{flex:1,position:"relative",zIndex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBlockEnd:6,flexWrap:"wrap"}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 8px 3px 7px",borderRadius:99,background:`linear-gradient(180deg, ${daily.proto.cl}20 0%, ${daily.proto.cl}08 100%)`,border:`0.5px solid ${daily.proto.cl}3a`,boxShadow:`inset 0 0.5px 0 rgba(255,255,255,0.14), 0 0 8px ${daily.proto.cl}1a`}}>
            <span aria-hidden="true" style={{position:"relative",inlineSize:5,blockSize:5,display:"inline-block",flexShrink:0}}>
              <motion.span animate={reducedMotion?{}:{scale:[1,2.3,1],opacity:[0.55,0,0.55]}} transition={reducedMotion?{}:{duration:2.3,repeat:Infinity,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",background:daily.proto.cl}}/>
              <span style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%, #fff 0%, ${daily.proto.cl} 60%, ${daily.proto.cl} 100%)`,boxShadow:`0 0 6px ${daily.proto.cl}, 0 0 2px ${daily.proto.cl}`}}/>
            </span>
            <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,letterSpacing:"0.16em",color:daily.proto.cl,textTransform:"uppercase",textShadow:`0 0 6px ${daily.proto.cl}50`,fontVariantNumeric:"tabular-nums"}}>{todayLabel}</span>
          </span>
          {windowLabel&&(
            <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 8px",borderRadius:99,background:inWindow?`linear-gradient(180deg, ${semantic.success}30 0%, ${semantic.success}10 100%)`:`linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,border:`0.5px solid ${inWindow?`${semantic.success}50`:`rgba(255,255,255,0.10)`}`,boxShadow:inWindow?`0 0 12px ${semantic.success}28, inset 0 0.5px 0 rgba(255,255,255,0.18)`:"inset 0 0.5px 0 rgba(255,255,255,0.08)"}}>
              {inWindow&&<motion.span aria-hidden="true" animate={reducedMotion?{}:{scale:[1,1.4,1],opacity:[1,0.55,1]}} transition={reducedMotion?{}:{duration:1.6,repeat:Infinity,ease:"easeInOut"}} style={{inlineSize:4,blockSize:4,borderRadius:"50%",background:semantic.success,boxShadow:`0 0 6px ${semantic.success}`}}/>}
              <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,letterSpacing:"0.16em",color:inWindow?semantic.success:"rgba(245,245,247,0.62)",textTransform:"uppercase",textShadow:inWindow?`0 0 6px ${semantic.success}50`:"none",fontVariantNumeric:"tabular-nums"}}>{windowLabel}</span>
            </span>
          )}
        </div>
        <div style={{fontSize:9.5,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.22em",fontWeight:500,color:`${daily.proto.cl}cc`,marginBlockEnd:4,textTransform:"uppercase",opacity:0.92,textShadow:`0 0 8px ${daily.proto.cl}30`}}>Ignición del día</div>
        <div style={{fontSize:19,fontWeight:500,letterSpacing:-0.5,lineHeight:1.1,color:"rgba(245,245,247,0.98)"}}>{daily.proto.n}</div>
        <div style={{fontSize:13,fontWeight:400,fontStyle:"italic",lineHeight:1.42,color:"rgba(245,245,247,0.62)",marginBlockStart:5,letterSpacing:-0.1}}>{daily.phrase}</div>
      </div>
      <div style={{flexShrink:0,position:"relative",zIndex:1,opacity:0.92,filter:`drop-shadow(0 0 6px ${daily.proto.cl}60)`}}>
        <Icon name="bolt" size={18} color={daily.proto.cl}/>
      </div>
    </motion.button>
      );
    })()}

    {/* Bioneural quick actions — evidence-based rescue protocols.
        Sprint 78: ahora secondary access debajo del Daily Ignición.
        Su rol es atajo a protocolos específicos (suspiro / HRV / NSDR)
        cuando el user no quiere el daily auto-recomendado. */}
    {ts==="idle"&&<motion.div initial={reducedMotion?undefined:{opacity:0,y:10}} animate={reducedMotion?undefined:{opacity:1,y:0}} transition={reducedMotion?undefined:{duration:0.55,delay:0.27,ease:[0.22,1,0.36,1]}} style={{display:"flex",gap:9,marginBottom:14}}>
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowSigh(true);H("tap");}} aria-label="Suspiro fisiológico, 60 segundos" style={{flex:1,padding:"18px 10px 16px",borderRadius:18,border:`0.5px solid rgba(255,255,255,0.10)`,background:`radial-gradient(circle at 88% 6%, ${protoColor.calma}40 0%, ${protoColor.calma}14 25%, transparent 55%), radial-gradient(circle at 50% 0%, ${protoColor.calma}1c 0%, transparent 70%), linear-gradient(180deg, ${protoColor.calma}12 0%, ${protoColor.calma}05 50%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(24px) saturate(160%) brightness(1.04)",WebkitBackdropFilter:"blur(24px) saturate(160%) brightness(1.04)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.28), 0 1px 0 ${protoColor.calma}14, 0 8px 22px rgba(0,0,0,0.30), 0 0 0 1px ${protoColor.calma}2e`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:7,position:"relative",overflow:"hidden"}}>
        <div style={{filter:`drop-shadow(0 0 8px ${protoColor.calma}a0) drop-shadow(0 0 3px ${protoColor.calma})`}}>
          <Icon name="calm" size={17} color={protoColor.calma}/>
        </div>
        <span style={{fontSize:11,fontWeight:500,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",color:"rgba(245,245,247,0.96)",letterSpacing:"0.18em",textTransform:"uppercase",textShadow:`0 0 8px ${protoColor.calma}40`}}>Suspiro</span>
        <span style={{fontSize:10,color:"rgba(245,245,247,0.55)",letterSpacing:-0.05,fontVariantNumeric:"tabular-nums",fontFeatureSettings:"'tnum' on"}}>60s · calma</span>
      </motion.button>
      {/* Sprint 73 — el caption ahora refleja la última medición si existe.
          Antes mostraba siempre "1 min · cámara" — el user no veía
          confirmación de que su medición había persistido. Ahora ve
          "RMSSD 45 ms · hace 2h" inmediatamente, mismo botón. */}
      {(()=>{const lastHrv=(st.hrvLog||[]).slice(-1)[0];const ageMs=lastHrv?Date.now()-lastHrv.ts:null;const ageLabel=ageMs==null?"1 min · cámara":ageMs<60000?"hace un momento":ageMs<3600000?`hace ${Math.round(ageMs/60000)} min`:ageMs<86400000?`hace ${Math.round(ageMs/3600000)} h`:`hace ${Math.round(ageMs/86400000)} d`;const caption=lastHrv?`${Math.round(lastHrv.rmssd)} ms · ${ageLabel}`:"1 min · cámara";return(
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowHRVCam(true);H("tap");}} aria-label={lastHrv?`Última HRV ${Math.round(lastHrv.rmssd)} ms · medir de nuevo`:"Medir HRV con la cámara"} style={{flex:1,padding:"18px 10px 16px",borderRadius:18,border:`0.5px solid rgba(255,255,255,0.10)`,background:`radial-gradient(circle at 88% 6%, ${protoColor.enfoque}40 0%, ${protoColor.enfoque}14 25%, transparent 55%), radial-gradient(circle at 50% 0%, ${protoColor.enfoque}1c 0%, transparent 70%), linear-gradient(180deg, ${protoColor.enfoque}12 0%, ${protoColor.enfoque}05 50%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(24px) saturate(160%) brightness(1.04)",WebkitBackdropFilter:"blur(24px) saturate(160%) brightness(1.04)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.28), 0 1px 0 ${protoColor.enfoque}14, 0 8px 22px rgba(0,0,0,0.30), 0 0 0 1px ${protoColor.enfoque}2e`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:7,position:"relative",overflow:"hidden"}}>
        <div style={{filter:`drop-shadow(0 0 8px ${protoColor.enfoque}a0) drop-shadow(0 0 3px ${protoColor.enfoque})`}}>
          <Icon name="predict" size={17} color={protoColor.enfoque}/>
        </div>
        <span style={{fontSize:11,fontWeight:500,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",color:"rgba(245,245,247,0.96)",letterSpacing:"0.18em",textTransform:"uppercase",textShadow:`0 0 8px ${protoColor.enfoque}40`}}>HRV</span>
        <span style={{fontSize:10,color:"rgba(245,245,247,0.55)",letterSpacing:-0.05,fontVariantNumeric:"tabular-nums",fontFeatureSettings:"'tnum' on"}}>{caption}</span>
      </motion.button>
      );})()}
      <motion.button whileTap={{scale:.94}} onClick={()=>{setShowNSDR(true);H("tap");}} aria-label="NSDR Yoga Nidra, 10 minutos" style={{flex:1,padding:"18px 10px 16px",borderRadius:18,border:`0.5px solid rgba(255,255,255,0.10)`,background:`radial-gradient(circle at 88% 6%, ${protoColor.reset}40 0%, ${protoColor.reset}14 25%, transparent 55%), radial-gradient(circle at 50% 0%, ${protoColor.reset}1c 0%, transparent 70%), linear-gradient(180deg, ${protoColor.reset}12 0%, ${protoColor.reset}05 50%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(24px) saturate(160%) brightness(1.04)",WebkitBackdropFilter:"blur(24px) saturate(160%) brightness(1.04)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.28), 0 1px 0 ${protoColor.reset}14, 0 8px 22px rgba(0,0,0,0.30), 0 0 0 1px ${protoColor.reset}2e`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:7,position:"relative",overflow:"hidden"}}>
        <div style={{filter:`drop-shadow(0 0 8px ${protoColor.reset}a0) drop-shadow(0 0 3px ${protoColor.reset})`}}>
          <Icon name="mind" size={17} color={protoColor.reset}/>
        </div>
        <span style={{fontSize:11,fontWeight:500,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",color:"rgba(245,245,247,0.96)",letterSpacing:"0.18em",textTransform:"uppercase",textShadow:`0 0 8px ${protoColor.reset}40`}}>NSDR</span>
        <span style={{fontSize:10,color:"rgba(245,245,247,0.55)",letterSpacing:-0.05,fontVariantNumeric:"tabular-nums",fontFeatureSettings:"'tnum' on"}}>10 min · reset</span>
      </motion.button>
    </motion.div>}

    {/* Sprint 74 — link "Ver histórico HRV" debajo del trío. Solo aparece
        si hay ≥1 medición. Abre HRVHistoryPanel con stats + sparkline +
        tabla comparativa. Discreto: text-only, no compite con los CTA
        principales pero da entrada clara al historial. */}
    {ts==="idle"&&(st.hrvLog||[]).length>0&&<button type="button" onClick={()=>{setShowHRVHistory(true);H("tap");}} aria-label="Ver historial HRV" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,inlineSize:"100%",paddingBlock:6,paddingInline:8,marginBlockStart:-6,marginBlockEnd:14,background:"transparent",border:"none",color:t3,fontSize:10,fontWeight:600,letterSpacing:0.4,textTransform:"uppercase",cursor:"pointer"}}>
      <Icon name="predict" size={11} color={t3}/>
      Ver histórico HRV ({(st.hrvLog||[]).length} {(st.hrvLog||[]).length===1?"medición":"mediciones"})
    </button>}

    {/* Sprint 78 — Daily Ignición original eliminado de aquí (movido
        arriba del trio como hero CTA). El bloque queda como referencia
        del cambio de jerarquía. */}

    {/* Sprint 78 — ProgramBrowser sube above-the-fold. Antes estaba
        oculto detrás del expand "Más"; el catálogo de 5 programas
        es contenido principal del producto, no accessory. Solo se
        muestra si NO hay activeProgram (cuando hay, el ActiveProgramCard
        arriba ya cubre el rol). Marketing fold parity. */}
    {ts==="idle"&&!st.activeProgram&&(()=>{
      const burnout=calcBurnoutIndex(st.moodLog||[],st.history||[]);
      const suggestion=resolveProgramSuggestion(st,{burnout,readiness});
      const programHistory=st.programHistory||[];
      const completionMap={};programHistory.forEach(h=>{if(!h||!h.id)return;const prev=completionMap[h.id]||{completed:0,attempts:0};completionMap[h.id]={completed:prev.completed+(h.completionFraction===1?1:0),attempts:prev.attempts+1};});
      const startProgram=(programId)=>{store.startProgram(programId);setSt_(useStore.getState());const p=getProgramById(programId);if(p)announce(`Programa ${p.n} iniciado. Día 1: ${p.sessions?.[0]?.note||p.sb}`,"polite");};
      const TEXT_HI="rgba(245,245,247,0.96)";
      const TEXT_MID="rgba(245,245,247,0.68)";
      const TEXT_LOW="rgba(245,245,247,0.52)";
      const TEXT_MICRO="rgba(245,245,247,0.42)";
      // Hero (NB) full-width, 4 squares (RW/FS/BR/EP) en 2-col grid bento
      const heroProgram=PROGRAMS[0];
      const squareProgs=PROGRAMS.slice(1);
      const INTENT_COLORS={calma:"#22D3EE",enfoque:"#6366F1",energia:"#F59E0B","energía":"#F59E0B",reset:"#A78BFA","integración":"#34D399",integracion:"#34D399","síntesis":"#F472B6",sintesis:"#F472B6",sello:"#FCD34D"};
      const getIntentColor=(note,fallback)=>{if(!note)return fallback;const w=note.split(" ")[0].toLowerCase();return INTENT_COLORS[w]||fallback;};
      const renderSquare=(program,idx)=>{
        const accent=program.cl||"#22D3EE";
        const stats=completionMap[program.id];
        const completedBefore=stats&&stats.completed>0;
        const expanded=expandedProgramId===program.id;
        const sessions=program.sessions||[];
        const dayCount=program.duration||sessions.length;
        return(
        <motion.article key={program.id} role="region" aria-label={`Programa: ${program.n}`} initial={reducedMotion?{opacity:1,y:0}:{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:reducedMotion?0:0.45,delay:reducedMotion?0:0.06+idx*0.07,ease:[0.16,1,0.3,1]}} style={{position:"relative",gridColumn:expanded?"1 / -1":"auto",aspectRatio:expanded?"auto":"4 / 3",overflow:"hidden",borderRadius:18,border:`0.5px solid rgba(255,255,255,${expanded?0.16:0.10})`,background:`radial-gradient(circle at 88% 6%, ${accent}38 0%, ${accent}14 26%, transparent 56%), radial-gradient(circle at 12% 100%, rgba(0,0,0,0.18) 0%, transparent 40%), linear-gradient(180deg, ${accent}12 0%, ${accent}06 50%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(24px) saturate(160%) brightness(1.04)",WebkitBackdropFilter:"blur(24px) saturate(160%) brightness(1.04)",boxShadow:`inset 0 1px 0 rgba(255,255,255,${expanded?0.22:0.16}), inset 0 -1px 0 rgba(0,0,0,0.28), 0 1px 0 ${accent}14, 0 8px 22px rgba(0,0,0,0.32), 0 0 0 1px ${accent}${expanded?"40":"2a"}`,transition:"grid-column .35s cubic-bezier(0.16,1,0.3,1), aspect-ratio .35s cubic-bezier(0.16,1,0.3,1), box-shadow .25s ease, border-color .25s ease"}}>
          <motion.div aria-hidden="true" animate={reducedMotion?{}:{scale:[1,1.10,1],opacity:[0.85,1,0.85]}} transition={reducedMotion?{}:{duration:7+idx*0.6,repeat:Infinity,ease:"easeInOut",delay:idx*0.4}} style={{position:"absolute",top:-30,right:-30,width:110,height:110,borderRadius:"50%",background:`radial-gradient(circle, ${accent}55 0%, ${accent}1c 30%, ${accent}08 50%, transparent 70%)`,filter:"blur(14px)",pointerEvents:"none",zIndex:0}}/>
          <button type="button" onClick={()=>setExpandedProgramId(cur=>cur===program.id?null:program.id)} aria-expanded={expanded} aria-controls={`program-detail-${program.id}`} style={{display:"flex",flexDirection:"column",justifyContent:"space-between",inlineSize:"100%",blockSize:"100%",padding:"10px 11px 10px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",position:"relative",zIndex:1,gap:4}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,inlineSize:"100%"}}>
              <div style={{flexShrink:0,inlineSize:30,blockSize:30,borderRadius:9,background:`radial-gradient(circle at 30% 25%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${accent}40 0%, ${accent}14 100%)`,border:`1px solid ${accent}4a`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.30), 0 0 0 1px rgba(0,0,0,0.26), 0 2px 10px ${accent}3a, 0 0 10px ${accent}24`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:600,color:accent,letterSpacing:"0.04em",textShadow:`0 0 8px ${accent}90`}}>{program.tg}</div>
              {completedBefore&&(<span aria-label="Ya hecho" style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:7,fontWeight:500,color:accent,background:`${accent}1a`,border:`1px solid ${accent}3a`,padding:"2px 5px",borderRadius:5,letterSpacing:"0.12em",textTransform:"uppercase",boxShadow:`0 0 6px ${accent}24`}}>Ya hecho</span>)}
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,marginBlockEnd:2}}>
              <span style={{fontSize:32,fontWeight:200,letterSpacing:-2.2,color:TEXT_HI,lineHeight:0.95,fontFeatureSettings:"'tnum' on",fontVariantNumeric:"tabular-nums",textShadow:`0 0 14px ${accent}80, 0 0 4px ${accent}40`}}>{program.duration}</span>
              <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:8,fontWeight:500,letterSpacing:"0.24em",color:accent,textTransform:"uppercase",marginBlockStart:1,opacity:0.88,textShadow:`0 0 6px ${accent}40`}}>Días</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:2,minInlineSize:0,inlineSize:"100%"}}>
              <h3 style={{margin:0,fontSize:12.5,fontWeight:500,color:TEXT_HI,letterSpacing:-0.25,lineHeight:1.15,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{program.n}</h3>
              <div style={{fontSize:9.5,color:TEXT_LOW,lineHeight:1.3,letterSpacing:-0.05,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{program.sb}</div>
              <div aria-hidden="true" style={{display:"flex",alignItems:"center",gap:2.5,marginBlockStart:2}}>
                {sessions.slice(0,Math.min(dayCount,14)).map((s,i)=>{const ic=getIntentColor(s.note,accent);return(
                  <span key={i} style={{inlineSize:4,blockSize:4,borderRadius:"50%",background:completedBefore?ic:`${ic}55`,boxShadow:completedBefore?`0 0 4px ${ic}90`:`0 0 2px ${ic}30`}}/>
                );})}
                {dayCount>14&&(<span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:8,color:TEXT_MICRO,marginInlineStart:3,letterSpacing:"0.04em",fontVariantNumeric:"tabular-nums"}}>+{dayCount-14}</span>)}
              </div>
            </div>
          </button>
          <AnimatePresence initial={false}>
            {expanded&&(
              <motion.div id={`program-detail-${program.id}`} key={`detail-${program.id}`} initial={reducedMotion?{opacity:1,height:"auto"}:{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={reducedMotion?{opacity:0,height:0}:{opacity:0,height:0}} transition={{duration:reducedMotion?0:0.28,ease:[0.16,1,0.3,1]}} style={{overflow:"hidden",position:"relative",zIndex:1}}>
                <div style={{padding:"0 14px 16px",borderTop:`0.5px solid rgba(255,255,255,0.08)`}}>
                  <p style={{marginBlockStart:14,marginBlockEnd:14,fontSize:13,color:TEXT_MID,lineHeight:1.55,letterSpacing:-0.05}}>{program.sb_long}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBlockEnd:14}}>
                    <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.10em",color:accent,background:`linear-gradient(180deg, ${accent}1a 0%, ${accent}0a 100%)`,border:`1px solid ${accent}38`,padding:"4px 8px",borderRadius:7,textTransform:"uppercase"}}>{program.duration} días</span>
                    <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.10em",color:TEXT_MID,background:"transparent",border:`1px solid rgba(255,255,255,0.12)`,padding:"4px 8px",borderRadius:7,textTransform:"uppercase"}}>{programRequiredSessions(program)} sesiones</span>
                    <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.10em",color:accent,background:"transparent",border:`1px solid ${accent}38`,padding:"4px 8px",borderRadius:7,textTransform:"uppercase"}}>{program.intent}</span>
                    {program.window&&program.window!=="any"&&(<span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.10em",color:TEXT_MID,background:"transparent",border:`1px solid rgba(255,255,255,0.12)`,padding:"4px 8px",borderRadius:7,textTransform:"uppercase"}}>{program.window==="morning"?"Mañana":program.window==="afternoon"?"Tarde":program.window==="evening"?"Noche":program.window}</span>)}
                  </div>
                  {program.rationale&&(
                    <details style={{marginBlockEnd:14,padding:"10px 12px",background:`${accent}08`,border:`1px solid ${accent}1a`,borderRadius:12}}>
                      <summary style={{cursor:"pointer",fontSize:11,fontWeight:500,color:TEXT_MID,letterSpacing:-0.05,listStyle:"none",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",textTransform:"uppercase"}}>Por qué este arco</summary>
                      <p style={{margin:"10px 0 0",fontSize:12,color:TEXT_MID,lineHeight:1.6}}>{program.rationale}</p>
                    </details>
                  )}
                  <div>
                    <div style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,letterSpacing:"0.16em",color:TEXT_MICRO,fontWeight:500,marginBlockEnd:8,textTransform:"uppercase"}}>Calendario</div>
                    <ol style={{listStyle:"none",margin:0,padding:0,display:"flex",flexDirection:"column",gap:6}}>
                      {sessions.slice(0,7).map(s=>{const proto=getProtocolById(s.protocolId);if(!proto)return null;return(
                        <li key={s.day} style={{display:"grid",gridTemplateColumns:"58px 1fr",gap:10,alignItems:"center",fontSize:11,lineHeight:1.3}}>
                          <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",color:TEXT_MICRO,fontWeight:500,letterSpacing:"0.04em",textAlign:"right",textTransform:"capitalize"}}>Día {s.day}</span>
                          <span style={{color:TEXT_MID}}><span style={{color:TEXT_HI,fontWeight:500}}>{proto.n}</span>{s.note&&<span style={{color:TEXT_MICRO}}> · {s.note.replace(/^[a-zà-ÿ]+ · /,"")}</span>}</span>
                        </li>
                      );})}
                    </ol>
                    {sessions.length>7&&(<div style={{marginBlockStart:6,fontSize:10,color:TEXT_MICRO,fontWeight:400,paddingLeft:68}}>+{sessions.length-7} {sessions.length-7===1?"día":"días"} más</div>)}
                  </div>
                  <button type="button" onClick={()=>startProgram(program.id)} style={{marginBlockStart:16,width:"100%",padding:"12px 16px",background:`linear-gradient(180deg, ${accent} 0%, ${accent}d0 100%)`,color:"#0B1320",border:"none",borderRadius:12,fontSize:13,fontWeight:600,cursor:"pointer",letterSpacing:-0.1,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 14px ${accent}50, 0 0 0 1px ${accent}80`}}>Iniciar programa</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.article>);
      };
      // Hero (full-width) — Neural Baseline
      const renderHero=(program)=>{
        const accent=program.cl||"#22D3EE";
        const stats=completionMap[program.id];
        const completedBefore=stats&&stats.completed>0;
        const expanded=expandedProgramId===program.id;
        const sessions=program.sessions||[];
        const dayCount=program.duration||sessions.length;
        return(
        <motion.article key={program.id} role="region" aria-label={`Programa: ${program.n}`} initial={reducedMotion?{opacity:1,y:0}:{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:reducedMotion?0:0.45,delay:reducedMotion?0:0.04,ease:[0.16,1,0.3,1]}} style={{gridColumn:"1 / -1",position:"relative",overflow:"hidden",borderRadius:22,border:`0.5px solid rgba(255,255,255,${expanded?0.16:0.10})`,background:`radial-gradient(circle at 92% 0%, ${accent}48 0%, ${accent}1c 22%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(0,0,0,0.20) 0%, transparent 42%), linear-gradient(180deg, ${accent}16 0%, ${accent}07 50%, rgba(0,0,0,0.12) 100%)`,backdropFilter:"blur(28px) saturate(170%) brightness(1.05)",WebkitBackdropFilter:"blur(28px) saturate(170%) brightness(1.05)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.30), 0 1px 0 ${accent}1c, 0 12px 30px rgba(0,0,0,0.36), 0 0 0 1px ${accent}${expanded?"3a":"2e"}`,transition:"box-shadow .25s ease, border-color .25s ease"}}>
          <motion.div aria-hidden="true" animate={reducedMotion?{}:{scale:[1,1.12,1],opacity:[0.88,1,0.88]}} transition={reducedMotion?{}:{duration:8,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",top:-80,right:-60,width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle, ${accent}65 0%, ${accent}24 28%, ${accent}0a 50%, transparent 70%)`,filter:"blur(24px)",pointerEvents:"none",zIndex:0}}/>
          <button type="button" onClick={()=>setExpandedProgramId(cur=>cur===program.id?null:program.id)} aria-expanded={expanded} aria-controls={`program-detail-${program.id}`} style={{display:"flex",alignItems:"center",gap:14,inlineSize:"100%",padding:"20px 18px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",position:"relative",zIndex:1}}>
            <div style={{flexShrink:0,inlineSize:50,blockSize:50,borderRadius:14,background:`radial-gradient(circle at 30% 25%, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${accent}48 0%, ${accent}16 100%)`,border:`1px solid ${accent}55`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.30), 0 6px 18px ${accent}40, 0 0 18px ${accent}2a`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:14,fontWeight:600,color:accent,letterSpacing:"0.04em",textShadow:`0 0 12px ${accent}a0`}}>{program.tg}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBlockEnd:4}}>
                <div style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,letterSpacing:"0.22em",fontWeight:500,color:accent,textTransform:"uppercase",opacity:0.92,textShadow:`0 0 8px ${accent}40`}}>Comienza aquí</div>
                {completedBefore&&(<span aria-label="Ya hecho" style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:accent,background:`${accent}1a`,border:`1px solid ${accent}3a`,padding:"2px 6px",borderRadius:6,letterSpacing:"0.10em",textTransform:"uppercase"}}>Ya hecho</span>)}
              </div>
              <h3 style={{margin:0,fontSize:19,fontWeight:500,color:TEXT_HI,letterSpacing:-0.5,lineHeight:1.12,marginBlockEnd:3}}>{program.n}</h3>
              <div style={{fontSize:12,color:TEXT_LOW,lineHeight:1.4,letterSpacing:-0.05}}>{program.sb}</div>
              <div aria-hidden="true" style={{display:"flex",alignItems:"center",gap:3,marginBlockStart:8}}>
                {sessions.slice(0,Math.min(dayCount,14)).map((s,i)=>{const ic=getIntentColor(s.note,accent);return(
                  <span key={i} style={{inlineSize:5,blockSize:5,borderRadius:"50%",background:completedBefore?ic:`${ic}55`,boxShadow:completedBefore?`0 0 5px ${ic}90`:`0 0 2px ${ic}40`}}/>
                );})}
              </div>
            </div>
            <div style={{flexShrink:0,opacity:0.9,transition:"transform .25s ease",transform:expanded?"rotate(90deg)":"rotate(0)",filter:`drop-shadow(0 0 4px ${accent}70)`}}>
              <Icon name="chevron" size={14} color={accent}/>
            </div>
          </button>
          <AnimatePresence initial={false}>
            {expanded&&(
              <motion.div id={`program-detail-${program.id}`} key={`detail-${program.id}`} initial={reducedMotion?{opacity:1,height:"auto"}:{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={reducedMotion?{opacity:0,height:0}:{opacity:0,height:0}} transition={{duration:reducedMotion?0:0.28,ease:[0.16,1,0.3,1]}} style={{overflow:"hidden",position:"relative",zIndex:1}}>
                <div style={{padding:"0 18px 18px",borderTop:`0.5px solid rgba(255,255,255,0.08)`}}>
                  <p style={{marginBlockStart:14,marginBlockEnd:14,fontSize:13,color:TEXT_MID,lineHeight:1.55,letterSpacing:-0.05}}>{program.sb_long}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBlockEnd:14}}>
                    <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.10em",color:accent,background:`linear-gradient(180deg, ${accent}1a 0%, ${accent}0a 100%)`,border:`1px solid ${accent}38`,padding:"4px 8px",borderRadius:7,textTransform:"uppercase"}}>{program.duration} días</span>
                    <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.10em",color:TEXT_MID,background:"transparent",border:`1px solid rgba(255,255,255,0.12)`,padding:"4px 8px",borderRadius:7,textTransform:"uppercase"}}>{programRequiredSessions(program)} sesiones</span>
                    <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.10em",color:accent,background:"transparent",border:`1px solid ${accent}38`,padding:"4px 8px",borderRadius:7,textTransform:"uppercase"}}>{program.intent}</span>
                    {program.window&&program.window!=="any"&&(<span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.10em",color:TEXT_MID,background:"transparent",border:`1px solid rgba(255,255,255,0.12)`,padding:"4px 8px",borderRadius:7,textTransform:"uppercase"}}>{program.window==="morning"?"Mañana":program.window==="afternoon"?"Tarde":program.window==="evening"?"Noche":program.window}</span>)}
                  </div>
                  {program.rationale&&(
                    <details style={{marginBlockEnd:14,padding:"10px 12px",background:`${accent}08`,border:`1px solid ${accent}1a`,borderRadius:12}}>
                      <summary style={{cursor:"pointer",fontSize:11,fontWeight:500,color:TEXT_MID,letterSpacing:-0.05,listStyle:"none",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",textTransform:"uppercase"}}>Por qué este arco</summary>
                      <p style={{margin:"10px 0 0",fontSize:12,color:TEXT_MID,lineHeight:1.6}}>{program.rationale}</p>
                    </details>
                  )}
                  <div>
                    <div style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,letterSpacing:"0.16em",color:TEXT_MICRO,fontWeight:500,marginBlockEnd:8,textTransform:"uppercase"}}>Calendario</div>
                    <ol style={{listStyle:"none",margin:0,padding:0,display:"flex",flexDirection:"column",gap:6}}>
                      {sessions.slice(0,7).map(s=>{const proto=getProtocolById(s.protocolId);if(!proto)return null;return(
                        <li key={s.day} style={{display:"grid",gridTemplateColumns:"58px 1fr",gap:10,alignItems:"center",fontSize:11,lineHeight:1.3}}>
                          <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",color:TEXT_MICRO,fontWeight:500,letterSpacing:"0.04em",textAlign:"right",textTransform:"capitalize"}}>Día {s.day}</span>
                          <span style={{color:TEXT_MID}}><span style={{color:TEXT_HI,fontWeight:500}}>{proto.n}</span>{s.note&&<span style={{color:TEXT_MICRO}}> · {s.note.replace(/^[a-zà-ÿ]+ · /,"")}</span>}</span>
                        </li>
                      );})}
                    </ol>
                    {sessions.length>7&&(<div style={{marginBlockStart:6,fontSize:10,color:TEXT_MICRO,fontWeight:400,paddingLeft:68}}>+{sessions.length-7} {sessions.length-7===1?"día":"días"} más</div>)}
                  </div>
                  <button type="button" onClick={()=>startProgram(program.id)} style={{marginBlockStart:16,width:"100%",padding:"12px 16px",background:`linear-gradient(180deg, ${accent} 0%, ${accent}d0 100%)`,color:"#0B1320",border:"none",borderRadius:12,fontSize:13,fontWeight:600,cursor:"pointer",letterSpacing:-0.1,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 14px ${accent}50, 0 0 0 1px ${accent}80`}}>Iniciar programa</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.article>);
      };
      return(
        <section aria-label="Programas" style={{marginBlockEnd:24}}>
          <div style={{paddingInline:4,marginBlockEnd:14}}>
            <div style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,letterSpacing:"0.26em",color:"#22D3EE",fontWeight:600,textTransform:"uppercase",marginBlockEnd:8,textShadow:"0 0 10px rgba(34,211,238,0.50), 0 0 3px rgba(34,211,238,0.32)"}}>
              PROGRAMAS
            </div>
            <p style={{margin:0,fontSize:13,lineHeight:1.5,fontWeight:400,color:TEXT_MID,letterSpacing:-0.1,maxInlineSize:340,fontFeatureSettings:"'cv11' on, 'ss01' on"}}>
              Trayectorias curadas de varios días. Cada programa usa los 20 protocolos como ingredientes.
            </p>
          </div>
          {suggestion&&suggestion.program&&(()=>{
            const sug=suggestion;const sugColor=sug.urgency==="critical"?semantic.danger:sug.urgency==="high"?semantic.warning:(sug.program.cl||"#22D3EE");
            return(
            <div role="region" aria-label="Programa recomendado" style={{position:"relative",overflow:"hidden",background:`radial-gradient(circle at 88% 6%, ${sugColor}40 0%, ${sugColor}14 25%, transparent 55%), linear-gradient(180deg, ${sugColor}14 0%, ${sugColor}06 50%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(24px) saturate(160%) brightness(1.04)",WebkitBackdropFilter:"blur(24px) saturate(160%) brightness(1.04)",border:`0.5px solid rgba(255,255,255,0.10)`,borderRadius:18,padding:"18px 16px",marginBlockEnd:14,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.28), 0 1px 0 ${sugColor}14, 0 8px 22px rgba(0,0,0,0.30), 0 0 0 1px ${sugColor}2e`}}>
              <div style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,letterSpacing:"0.22em",color:sugColor,fontWeight:600,textTransform:"uppercase",marginBlockEnd:6,textShadow:`0 0 8px ${sugColor}40`}}>Recomendado para ti</div>
              <h4 style={{margin:0,fontSize:17,fontWeight:500,color:TEXT_HI,letterSpacing:-0.4,marginBlockEnd:6,lineHeight:1.15}}>{sug.program.n}</h4>
              <p style={{margin:0,fontSize:13,color:TEXT_MID,lineHeight:1.5,marginBlockEnd:14,letterSpacing:-0.1}}>{sug.reason}</p>
              <button type="button" onClick={()=>startProgram(sug.programId)} style={{width:"100%",padding:"11px 16px",background:`linear-gradient(180deg, ${sugColor} 0%, ${sugColor}cc 100%)`,color:"#0B1320",border:"none",borderRadius:12,fontSize:13,fontWeight:600,cursor:"pointer",letterSpacing:-0.1,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 14px ${sugColor}50, 0 0 0 1px ${sugColor}80`}}>Empezar ahora</button>
            </div>);
          })()}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {renderHero(heroProgram)}
            {squareProgs.map((p,i)=>renderSquare(p,i))}
          </div>
        </section>
      );
    })()}

    {/* Expandable secondary section
        Contiene contenido secundario que ocupaba above-the-fold sin
        valor diario recurrente:
          · ReadinessScore (calibración HRV one-shot)
          · EvidenceStrip (trust badge estático)
          · ProgramBrowser (catálogo 5 programas multi-día)
          · Prediction (impacto esperado de próxima sesión)
        El usuario diario ya no scrollea por encima de estos. Si quiere
        explorar/calibrar/elegir programa, expand "Más". */}
    {ts==="idle"&&<>
    {/* Botón "Más" — diseño que invita sin gritar.
        Pill compacto centrado, accent border sutil, dot indicator
        izquierdo (señaliza contenido vivo) y chevron rotativo derecho.
        Below: hint de lo que vive adentro — programas + calibración +
        respaldo. Sin esto, el usuario no sabe que existe contenido
        rico al expandir. */}
    <button
      onClick={()=>{setShowMore(!showMore);H("tap");}}
      aria-expanded={showMore}
      aria-label={showMore?"Menos opciones":"Más opciones — programas, calibración HRV, respaldo clínico"}
      style={{
        width:"100%",
        minBlockSize:44,
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        gap:6,
        paddingBlock:showMore?10:14,
        marginBottom:showMore?10:14,
        background:"none",
        border:"none",
        cursor:"pointer",
      }}
    >
      <motion.span
        animate={reducedMotion?{}:{scale:[1,1.02,1]}}
        transition={reducedMotion?{}:{duration:5.5,repeat:Infinity,ease:"easeInOut"}}
        style={{
          position:"relative",
          display:"inline-flex",
          alignItems:"center",
          gap:11,
          paddingBlock:11,
          paddingInline:24,
          borderRadius:99,
          background:`radial-gradient(ellipse 80% 100% at 50% -20%, ${ac}26 0%, ${ac}10 35%, transparent 70%), radial-gradient(circle at 50% 100%, rgba(0,0,0,0.18) 0%, transparent 60%), linear-gradient(180deg, ${ac}14 0%, ${ac}06 50%, rgba(255,255,255,0.02) 100%)`,
          backdropFilter:"blur(24px) saturate(170%) brightness(1.05)",
          WebkitBackdropFilter:"blur(24px) saturate(170%) brightness(1.05)",
          border:`0.5px solid rgba(255,255,255,0.14)`,
          boxShadow:`inset 0 1.5px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.30), inset 0 0 0 0.5px ${ac}1f, 0 1px 0 ${ac}18, 0 8px 24px rgba(0,0,0,0.32), 0 0 0 1px ${withAlpha(ac,38)}, 0 0 22px ${ac}1c`,
          overflow:"hidden",
        }}>
        <span aria-hidden="true" style={{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:`linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)`,pointerEvents:"none"}}/>
        <span aria-hidden="true" style={{position:"relative",inlineSize:7,blockSize:7,display:"inline-block",flexShrink:0}}>
          <motion.span
            animate={reducedMotion?{}:{scale:[1,2.8,1],opacity:[0.55,0,0.55]}}
            transition={reducedMotion?{}:{duration:2.6,repeat:Infinity,ease:"easeOut"}}
            style={{position:"absolute",inset:0,borderRadius:"50%",background:ac,filter:"blur(0.5px)"}}
          />
          <motion.span
            animate={reducedMotion?{}:{scale:[1,2.0,1],opacity:[0.65,0,0.65]}}
            transition={reducedMotion?{}:{duration:1.8,repeat:Infinity,ease:"easeOut",delay:0.3}}
            style={{position:"absolute",inset:0,borderRadius:"50%",background:ac}}
          />
          <span style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 55%, ${ac} 100%)`,boxShadow:`0 0 10px ${ac}, 0 0 4px ${ac}, inset 0 0 2px rgba(255,255,255,0.6)`}}/>
        </span>
        <span style={{
          position:"relative",
          fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize:11,
          fontWeight:500,
          color:"rgba(245,245,247,0.98)",
          letterSpacing:"0.28em",
          textTransform:"uppercase",
          textShadow:`0 0 10px ${ac}50, 0 0 3px ${ac}30`,
        }}>{showMore?"Menos":"Más"}</span>
        <motion.span
          aria-hidden="true"
          animate={reducedMotion||showMore?{}:{y:[0,1.5,0]}}
          transition={reducedMotion?{}:{duration:2.4,repeat:Infinity,ease:"easeInOut"}}
          style={{
            position:"relative",
            color:ac,
            transform:showMore?"rotate(180deg)":"rotate(0)",
            display:"inline-flex",
            transition:"transform .25s cubic-bezier(0.22, 1, 0.36, 1)",
            filter:`drop-shadow(0 0 5px ${ac}90)`,
          }}>
          <Icon name="chevron-down" size={13} color={ac}/>
        </motion.span>
      </motion.span>
      {!showMore&&<span aria-hidden="true" style={{
        fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize:9,
        fontWeight:500,
        color:"rgba(245,245,247,0.48)",
        letterSpacing:"0.22em",
        textTransform:"uppercase",
        marginBlockStart:4,
      }}>Programas · Calibración · Respaldo</span>}
    </button>
    <AnimatePresence>
    {showMore&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
      {/* Readiness Score — bioneural composite + HRV calibration entry */}
      <ReadinessScore st={st} isDark={isDark} onOpenHRV={()=>setShowHRVCam(true)}/>

      {/* Evidence Strip — respaldo clínico (X estudios + Y instrumentos validados) */}
      <EvidenceStrip isDark={isDark} onOpenEvidence={()=>{
        try{if(typeof window!=="undefined")window.open("/evidencia","_blank","noopener,noreferrer");}catch{}
      }}/>

      {/* Sprint 78 — ProgramBrowser movido arriba (above-the-fold).
          Cuando hay activeProgram, el ActiveProgramCard arriba lo
          reemplaza naturalmente. */}

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
      {/* Sprint 77 — bloque legacy "Programa 7 Días" eliminado.
          Tenía bug estructural: progDay incrementaba con cada sesión
          (no calendar-based) → 7 sesiones en 1 día marcaba todos los
          días → al llegar a 7 el bloque desaparecía para siempre.
          El sistema nuevo (Sprint 64+) reemplaza con:
            · ActiveProgramCard cuando hay programa en curso
            · ProgramBrowser con catálogo de 5 programas
            · programSuggestion.js que sugiere weekly con cooldown */}
    </motion.div>}
    </AnimatePresence>

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,paddingInline:2}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span aria-hidden="true" style={{position:"relative",inlineSize:7,blockSize:7,display:"inline-block",flexShrink:0}}>
          <motion.span animate={reducedMotion?{}:{scale:[1,2.4,1],opacity:[0.45,0,0.45]}} transition={reducedMotion?{}:{duration:2.4,repeat:Infinity,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",background:nSt.color}}/>
          <span style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%, #fff 0%, ${nSt.color} 55%, ${nSt.color} 100%)`,boxShadow:`0 0 8px ${nSt.color}, 0 0 3px ${nSt.color}`}}/>
        </span>
        <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.22em",color:nSt.color,textTransform:"uppercase",textShadow:`0 0 8px ${nSt.color}40`}}>{nSt.label}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,letterSpacing:"0.22em",color:lv.c,textTransform:"uppercase",textShadow:`0 0 8px ${lv.c}40`}}>{lv.n}</span>
        <div style={{position:"relative",width:54,height:5,borderRadius:99,background:`linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.20) 100%)`,boxShadow:`inset 0 1px 0 rgba(0,0,0,0.40), inset 0 -0.5px 0 rgba(255,255,255,0.06), 0 0 0 0.5px rgba(255,255,255,0.06)`,overflow:"hidden"}}>
          <motion.div initial={reducedMotion?{width:lPct+"%"}:{width:0}} animate={{width:lPct+"%"}} transition={{duration:reducedMotion?0:0.9,delay:reducedMotion?0:0.2,ease:[0.16,1,0.3,1]}} style={{height:"100%",borderRadius:99,background:`linear-gradient(90deg, ${lv.c}aa 0%, ${lv.c} 60%, ${lv.c} 100%)`,boxShadow:`0 0 8px ${lv.c}80, inset 0 0.5px 0 rgba(255,255,255,0.30)`}}/>
        </div>
      </div>
    </div>
    {(()=>{
      const engineMatch=aiRec?.primary?.protocol?.id===pr.id;
      const engineReason=engineMatch?aiRec?.primary?.reason:null;
      return(
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <motion.button whileTap={{scale:.97}} onClick={()=>setSl(true)} style={{position:"relative",flex:1,padding:"12px 14px",borderRadius:18,border:`0.5px solid rgba(255,255,255,${engineReason?0.14:0.08})`,background:`radial-gradient(circle at 88% 6%, ${ac}30 0%, ${ac}10 26%, transparent 56%), linear-gradient(180deg, ${ac}10 0%, ${ac}05 50%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(24px) saturate(160%) brightness(1.04)",WebkitBackdropFilter:"blur(24px) saturate(160%) brightness(1.04)",boxShadow:`inset 0 1px 0 rgba(255,255,255,${engineReason?0.18:0.14}), inset 0 -1px 0 rgba(0,0,0,0.26), 0 1px 0 ${ac}14, 0 6px 18px rgba(0,0,0,0.28), 0 0 0 1px ${ac}${engineReason?"3a":"24"}`,cursor:"pointer",display:"flex",alignItems:"center",gap:11,overflow:"hidden",textAlign:"left"}}>
        <motion.div aria-hidden="true" animate={reducedMotion?{}:{scale:[1,1.10,1],opacity:[0.85,1,0.85]}} transition={reducedMotion?{}:{duration:7,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",top:-32,right:-32,width:110,height:110,borderRadius:"50%",background:`radial-gradient(circle, ${ac}50 0%, ${ac}1c 30%, ${ac}08 50%, transparent 70%)`,filter:"blur(14px)",pointerEvents:"none",zIndex:0}}/>
        <motion.div layoutId={sl||reducedMotion?undefined:`proto-glyph-${pr.id}`} transition={SPRING.snappy} style={{position:"relative",zIndex:1,inlineSize:36,blockSize:36,borderRadius:11,background:`radial-gradient(circle at 30% 25%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${ac}40 0%, ${ac}14 100%)`,border:`1px solid ${ac}4a`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.30), 0 0 0 1px rgba(0,0,0,0.26), 0 3px 12px ${ac}3a, 0 0 12px ${ac}24`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:11,fontWeight:600,color:ac,letterSpacing:"0.04em",textShadow:`0 0 10px ${ac}90`}}>{pr.tg}</motion.div>
        <div style={{position:"relative",zIndex:1,flex:1,textAlign:"left",minInlineSize:0}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:7}}>
            <span style={{fontWeight:500,fontSize:13,color:"rgba(245,245,247,0.96)",letterSpacing:-0.25,lineHeight:1.15}}>{pr.n}</span>
            {engineReason&&(
              <span aria-hidden="true" style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:8,fontWeight:500,letterSpacing:"0.16em",color:ac,textTransform:"uppercase",padding:"2px 6px",borderRadius:5,background:`${ac}1a`,border:`1px solid ${ac}3a`,textShadow:`0 0 6px ${ac}50`,boxShadow:`0 0 6px ${ac}20`}}>
                <motion.span animate={reducedMotion?{}:{opacity:[0.6,1,0.6],scale:[0.9,1.05,0.9]}} transition={reducedMotion?{}:{duration:1.6,repeat:Infinity,ease:"easeInOut"}} style={{inlineSize:4,blockSize:4,borderRadius:"50%",background:ac,boxShadow:`0 0 5px ${ac}`}}/>
                pick
              </span>
            )}
          </div>
          {engineReason?(
            <div style={{fontSize:10.5,fontWeight:400,color:"rgba(245,245,247,0.55)",marginBlockStart:3,fontStyle:"italic",letterSpacing:-0.05,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.3}}>{engineReason}</div>
          ):(
            <div style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:"rgba(245,245,247,0.42)",marginBlockStart:3,letterSpacing:"0.18em",textTransform:"uppercase",fontVariantNumeric:"tabular-nums"}}>{pr.ph.length} fases</div>
          )}
        </div>
        <div style={{position:"relative",zIndex:1,flexShrink:0,opacity:0.85,filter:`drop-shadow(0 0 4px ${ac}60)`}}>
          <Icon name="chevron-down" size={13} color={ac}/>
        </div>
      </motion.button>
      <motion.button whileTap={{scale:.93}} onClick={()=>setShowProtoDetail(true)} aria-label="Ver detalle del protocolo" title="Ver detalle del protocolo" style={{position:"relative",inlineSize:48,blockSize:48,minBlockSize:48,minInlineSize:48,borderRadius:14,border:`0.5px solid rgba(255,255,255,0.10)`,background:`radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,backdropFilter:"blur(20px) saturate(150%)",WebkitBackdropFilter:"blur(20px) saturate(150%)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.24), 0 4px 14px rgba(0,0,0,0.26)`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="info" size={17} color="rgba(245,245,247,0.78)" aria-hidden="true"/></motion.button>
      <motion.button whileTap={{scale:.93}} onClick={()=>setShowIntent(true)} aria-label="Definir intención" title="Definir intención" style={{position:"relative",inlineSize:48,blockSize:48,minBlockSize:48,minInlineSize:48,borderRadius:14,border:`0.5px solid rgba(255,255,255,0.10)`,background:`radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,backdropFilter:"blur(20px) saturate(150%)",WebkitBackdropFilter:"blur(20px) saturate(150%)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.24), 0 4px 14px rgba(0,0,0,0.26)`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="target" size={18} color="rgba(245,245,247,0.78)" aria-hidden="true"/></motion.button>
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
      const sepStyle={inlineSize:1,blockSize:11,background:`linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)`,flexShrink:0};
      return(
        <div style={{position:"relative",display:"flex",flexWrap:"wrap",alignItems:"center",gap:11,marginBottom:14,padding:"10px 14px",borderRadius:14,background:`radial-gradient(circle at 50% 0%, ${ac}10 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,backdropFilter:"blur(20px) saturate(150%)",WebkitBackdropFilter:"blur(20px) saturate(150%)",border:`0.5px solid rgba(255,255,255,0.10)`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.20), 0 4px 14px rgba(0,0,0,0.22), 0 0 0 1px ${withAlpha(ac,18)}`,overflow:"hidden"}}>
          {cPeriod&&(
            <div style={{display:"inline-flex",alignItems:"center",gap:7}}>
              <span aria-hidden="true" style={{position:"relative",inlineSize:6,blockSize:6,display:"inline-block",flexShrink:0}}>
                <motion.span animate={reducedMotion?{}:{scale:[1,2.4,1],opacity:[0.45,0,0.45]}} transition={reducedMotion?{}:{duration:2.6,repeat:Infinity,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",background:ac}}/>
                <span style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 55%, ${ac} 100%)`,boxShadow:`0 0 8px ${ac}, 0 0 3px ${ac}`}}/>
              </span>
              <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9.5,fontWeight:500,letterSpacing:"0.20em",color:"rgba(245,245,247,0.78)",textTransform:"uppercase",textShadow:`0 0 6px ${ac}30`}}>Ventana · {cPeriod}</span>
            </div>
          )}
          {readinessMeta&&(<>
            <span aria-hidden="true" style={sepStyle}/>
            <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9.5,fontWeight:500,letterSpacing:"0.20em",color:"rgba(245,245,247,0.66)",textTransform:"uppercase"}}>Readiness {readinessMeta}</span>
          </>)}
          {typeof optHour==="number"&&(<>
            <span aria-hidden="true" style={sepStyle}/>
            <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9.5,fontWeight:500,letterSpacing:"0.20em",color:"rgba(245,245,247,0.66)",textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:5}}>
              Pico <span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontWeight:500,fontVariantNumeric:"tabular-nums",letterSpacing:0,color:"rgba(245,245,247,0.92)",textShadow:`0 0 6px ${ac}30`}}>{String(optHour).padStart(2,"0")}:00</span>
            </span>
          </>)}
          {showPred&&(<>
            <span aria-hidden="true" style={sepStyle}/>
            <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
              <span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:11,fontWeight:500,color:semantic.success,fontVariantNumeric:"tabular-nums",letterSpacing:-0.1,textShadow:`0 0 8px ${semantic.success}60`}}>+{prediction.predictedDelta.toFixed(1)}</span>
              <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:"rgba(245,245,247,0.45)",letterSpacing:"0.18em",textTransform:"uppercase",fontVariantNumeric:"tabular-nums"}}>· {prediction.confidence}%</span>
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

    {/* ═══ SESSION MODULE — unified container (mood + duration + orb + phase + breath + strip + CTA) ═══ */}
    <div style={{position:"relative",marginTop:8,marginBottom:8,paddingTop:16,paddingBottom:18,paddingInline:14,marginInline:-14,borderRadius:0}}>
      <div aria-hidden="true" style={{position:"absolute",top:0,left:0,right:0,bottom:0,pointerEvents:"none",background:`radial-gradient(ellipse 80% 60% at 50% 0%, ${ac}08 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 50% 100%, ${ac}06 0%, transparent 50%)`,zIndex:0}}/>
      <div aria-hidden="true" style={{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:`linear-gradient(90deg, transparent 0%, ${withAlpha(ac,32)} 50%, transparent 100%)`,pointerEvents:"none"}}/>
      <div aria-hidden="true" style={{position:"absolute",bottom:0,left:"15%",right:"15%",height:1,background:`linear-gradient(90deg, transparent 0%, ${withAlpha(ac,18)} 50%, transparent 100%)`,pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:1}}>
      <div aria-hidden="true" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:18,paddingInline:2}}>
        <span style={{flex:1,height:1,background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 100%)"}}/>
        <span style={{display:"inline-flex",alignItems:"center",gap:7}}>
          <span aria-hidden="true" style={{position:"relative",inlineSize:5,blockSize:5,display:"inline-block",flexShrink:0}}>
            <motion.span animate={reducedMotion?{}:{scale:[1,2.4,1],opacity:[0.50,0,0.50]}} transition={reducedMotion?{}:{duration:2.6,repeat:Infinity,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",background:ac}}/>
            <span style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%, #fff 0%, ${ac} 55%, ${ac} 100%)`,boxShadow:`0 0 6px ${ac}, 0 0 2px ${ac}`}}/>
          </span>
          <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9.5,fontWeight:500,color:"rgba(245,245,247,0.78)",letterSpacing:"0.32em",textTransform:"uppercase",textShadow:`0 0 8px ${ac}40`}}>{ts==="running"?"En sesión":ts==="paused"?"En pausa":"Tu sesión"}</span>
        </span>
        <span style={{flex:1,height:1,background:"linear-gradient(90deg, rgba(255,255,255,0.12) 0%, transparent 100%)"}}/>
      </div>
    {/* Pre-session mood — color spectrum, pre-fill transparency, affirmative heading */}
    {ts==="idle"&&(
      <div style={{marginBlockEnd:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBlockEnd:10,paddingInline:2}}>
          <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,color:"rgba(245,245,247,0.62)",letterSpacing:"0.24em",textTransform:"uppercase",textShadow:`0 0 8px ${ac}28`}}>Tu estado ahora</span>
          {preMood>0&&preMoodFromPrefill&&(
            <span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:8.5,fontWeight:500,color:"rgba(245,245,247,0.45)",letterSpacing:"0.18em",textTransform:"uppercase"}}>
              <motion.span aria-hidden="true" animate={reducedMotion?{}:{opacity:[0.55,1,0.55]}} transition={reducedMotion?{}:{duration:2.4,repeat:Infinity,ease:"easeInOut"}} style={{inlineSize:4,blockSize:4,borderRadius:"50%",background:ac,boxShadow:`0 0 5px ${ac}`,flexShrink:0}}/>
              Desde tu última sesión
            </span>
          )}
        </div>
        <div role="radiogroup" aria-label="Tu estado ahora" style={{display:"flex",gap:6}}>
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
                  position:"relative",
                  flex:1,
                  display:"flex",
                  flexDirection:"column",
                  alignItems:"center",
                  gap:6,
                  paddingBlock:11,
                  paddingInline:2,
                  borderRadius:14,
                  border:`0.5px solid rgba(255,255,255,${selected?0.16:0.08})`,
                  background:selected
                    ?`radial-gradient(circle at 50% 0%, ${m.color}38 0%, ${m.color}14 35%, transparent 70%), linear-gradient(180deg, ${m.color}18 0%, ${m.color}08 100%)`
                    :`radial-gradient(circle at 50% 0%, ${m.color}10 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
                  backdropFilter:"blur(20px) saturate(150%)",
                  WebkitBackdropFilter:"blur(20px) saturate(150%)",
                  boxShadow:selected
                    ?`inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.30), 0 1px 0 ${m.color}1a, 0 6px 18px rgba(0,0,0,0.30), 0 0 0 1px ${m.color}50, 0 0 18px ${m.color}26`
                    :`inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.22), 0 4px 14px rgba(0,0,0,0.22)`,
                  cursor:"pointer",
                  transition:"all .25s cubic-bezier(0.22, 1, 0.36, 1)",
                  overflow:"hidden",
                }}
              >
                <div style={{filter:selected?`drop-shadow(0 0 8px ${m.color}a0) drop-shadow(0 0 3px ${m.color})`:`drop-shadow(0 0 4px ${withAlpha(m.color,40)})`}} aria-hidden="true">
                  {(()=>{const c=selected?m.color:withAlpha(m.color,70);const sw=selected?1.7:1.5;
                    if(m.id===1)return(<svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 10 L4.5 5.5 L6.5 14.5 L9 4 L11 16 L13.5 5.5 L15.5 13.5 L18 10" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>);
                    if(m.id===2)return(<svg width="20" height="20" viewBox="0 0 20 20"><path d="M2.5 5 Q6 9 10 10.5 Q13.5 12 17.5 14" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"/><circle cx="2.5" cy="5" r="1.4" fill={c}/><circle cx="17.5" cy="14" r="1.4" fill={c} opacity="0.45"/></svg>);
                    if(m.id===3)return(<svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 10 Q5.5 7.5 10 10 T18 10" stroke={c} strokeWidth={sw} strokeLinecap="round" fill="none"/></svg>);
                    if(m.id===4)return(<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="2.4" fill={c}/><circle cx="10" cy="10" r="5" stroke={c} strokeWidth={sw-0.4} fill="none" opacity="0.55"/><circle cx="10" cy="10" r="8" stroke={c} strokeWidth={sw-0.6} fill="none" opacity="0.25"/></svg>);
                    if(m.id===5)return(<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.6" fill={c} opacity="0.55"/><circle cx="10" cy="10" r="3.6" stroke={c} strokeWidth={sw-0.2} fill="none"/><line x1="10" y1="2" x2="10" y2="4" stroke={c} strokeWidth={sw-0.2} strokeLinecap="round"/><line x1="10" y1="16" x2="10" y2="18" stroke={c} strokeWidth={sw-0.2} strokeLinecap="round"/><line x1="2" y1="10" x2="4" y2="10" stroke={c} strokeWidth={sw-0.2} strokeLinecap="round"/><line x1="16" y1="10" x2="18" y2="10" stroke={c} strokeWidth={sw-0.2} strokeLinecap="round"/><line x1="4.3" y1="4.3" x2="5.7" y2="5.7" stroke={c} strokeWidth={sw-0.2} strokeLinecap="round"/><line x1="14.3" y1="14.3" x2="15.7" y2="15.7" stroke={c} strokeWidth={sw-0.2} strokeLinecap="round"/><line x1="4.3" y1="15.7" x2="5.7" y2="14.3" stroke={c} strokeWidth={sw-0.2} strokeLinecap="round"/><line x1="14.3" y1="5.7" x2="15.7" y2="4.3" stroke={c} strokeWidth={sw-0.2} strokeLinecap="round"/></svg>);
                    return(<Icon name={m.icon} size={17} color={c}/>);
                  })()}
                </div>
                <span style={{
                  fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize:8.5,
                  fontWeight:500,
                  color:selected?m.color:"rgba(245,245,247,0.55)",
                  lineHeight:1.1,
                  textAlign:"center",
                  letterSpacing:"0.10em",
                  textTransform:"uppercase",
                  textShadow:selected?`0 0 6px ${m.color}50`:"none",
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
      const opts=[{v:.5,l:"60s",dots:1},{v:1,l:"120s",dots:2},{v:1.5,l:"180s",dots:3}];
      return(
        <div style={{position:"relative",marginBottom:18,padding:"10px 10px 11px",borderRadius:18,background:`radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(18px) saturate(140%)",WebkitBackdropFilter:"blur(18px) saturate(140%)",border:`0.5px solid rgba(255,255,255,0.07)`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.07), 0 4px 16px rgba(0,0,0,0.20)`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBlockEnd:8}}>
            <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:"rgba(245,245,247,0.42)",letterSpacing:"0.26em",textTransform:"uppercase"}}>Duración</span>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:7}}>
            {opts.map(d=>{
              const isRec=d.v===recommendedMult;
              const isSel=durMult===d.v;
              return(
                <motion.button
                  key={d.v}
                  whileTap={{scale:.93}}
                  animate={reducedMotion?{}:{scale:isSel?1.04:1}}
                  transition={reducedMotion?{}:{duration:0.25,ease:[0.16,1,0.3,1]}}
                  onClick={()=>{setDurMult(d.v);setSec(Math.round(pr.d*d.v));H("tap");}}
                  aria-label={isRec?`${d.l} — duración recomendada`:d.l}
                  style={{
                    position:"relative",
                    flex:1,
                    maxInlineSize:96,
                    padding:"9px 14px 8px",
                    borderRadius:99,
                    border:`0.5px solid rgba(255,255,255,${isSel?0.18:0.08})`,
                    background:isSel
                      ?`radial-gradient(circle at 50% 0%, ${ac}45 0%, ${ac}18 40%, transparent 75%), linear-gradient(180deg, ${ac}1c 0%, ${ac}08 100%)`
                      :`radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
                    backdropFilter:"blur(20px) saturate(150%)",
                    WebkitBackdropFilter:"blur(20px) saturate(150%)",
                    boxShadow:isSel
                      ?`inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.30), 0 1px 0 ${ac}24, 0 6px 22px rgba(0,0,0,0.34), 0 0 0 1px ${ac}60, 0 0 20px ${ac}36, 0 0 40px ${ac}1a`
                      :`inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.22), 0 3px 12px rgba(0,0,0,0.20)`,
                    color:isSel?"rgba(245,245,247,0.98)":"rgba(245,245,247,0.62)",
                    fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize:11,
                    fontWeight:500,
                    letterSpacing:0.2,
                    fontVariantNumeric:"tabular-nums",
                    textShadow:isSel?`0 0 10px ${ac}80, 0 0 3px ${ac}40`:"none",
                    cursor:"pointer",
                    transition:"background .25s ease, box-shadow .25s ease, color .25s ease, border-color .25s ease",
                    display:"flex",
                    flexDirection:"column",
                    alignItems:"center",
                    gap:3,
                  }}>
                  <span>{d.l}</span>
                  <span aria-hidden="true" style={{display:"flex",alignItems:"center",gap:2.5}}>
                    {[0,1,2].map(i=>(
                      <span key={i} style={{inlineSize:3,blockSize:3,borderRadius:"50%",background:i<d.dots?(isSel?ac:`rgba(245,245,247,0.55)`):`rgba(255,255,255,0.10)`,boxShadow:i<d.dots&&isSel?`0 0 4px ${ac}90`:"none",transition:"all .25s ease"}}/>
                    ))}
                  </span>
                  {isRec&&(
                    <span aria-hidden="true" style={{position:"absolute",top:-3,right:-3,inlineSize:9,blockSize:9,display:"inline-block"}}>
                      <motion.span animate={reducedMotion?{}:{scale:[1,2.4,1],opacity:[0.55,0,0.55]}} transition={reducedMotion?{}:{duration:2.2,repeat:Infinity,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",background:semantic.success}}/>
                      <span style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%, #fff 0%, ${semantic.success} 55%, ${semantic.success} 100%)`,boxShadow:`0 0 8px ${semantic.success}, 0 0 3px ${semantic.success}`,border:"1px solid rgba(0,0,0,0.30)"}}/>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      );
    })()}


    {/* Brand stamp removido de aquí — vivía dentro del wrapper
        `postStep==="none"`, así que solo podía renderizar durante
        running, pero durante running SessionRunner cubre la pantalla
        en fullscreen. Era código muerto. El stamp ahora vive DENTRO
        del SessionRunner (header durante running/paused). Post-session
        ya tiene su propio BioIgnicionMark en PostSessionFlow. */}

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
      {(ts==="idle"||isActive)&&!reducedMotion&&[0,1].map(i=><motion.span key={i} aria-hidden="true" initial={{scale:.88,opacity:.5}} animate={{scale:1.45,opacity:0}} transition={{duration:isActive?2.2:3.2,delay:i*(isActive?1.1:1.6),ease: [0.22, 1, 0.36, 1],repeat:Infinity}} style={{position:"absolute",inset:0,borderRadius:"50%",border:`1px solid ${ac}`,pointerEvents:"none"}}/>)}
      {/* ── Núcleo neural 3D — reemplaza el orb sólido previo.
          Cámara glass translúcida con la lattice del trademark en
          3D real. Personalidad por protocol.int (calma/enfoque/
          reset/energia): cadencia de firing, rotación, chaos y
          densidad distintos. Durante ejecución coreografía:
            · ignition wave al arrancar (cascada radial desde seed)
            · phase ring wave al cambiar de fase (onda ecuatorial)
            · micro-pulso por segundo (tick de countdown)
            · breath coupling: cada mote respira con el usuario
            · últimos 20 %: firing rate +30 % (anticipación)
            · resonance collapse al terminar
          Readiness override: recover→amber, optimal→emerald. */}
      {(()=>{const rInt=readiness?.interpretation;const coreColor=rInt==="recover"?"#f59e0b":rInt==="optimal"?"#22c55e":ac;const prog=totalDur>0?1-(sec/totalDur):0;
        // Ember override: cuando emberActive, el core entra en modo
        // brasa. Se mantiene intent y color del último protocolo para
        // continuidad visual; el propio componente gestiona el fade.
        const coreState=emberActive&&ts==="idle"?"ember":ts;
        // Momentum: sesiones acumuladas / 30 (cap 1). El orb del veterano
        // muestra lattice pre-revelada, edges más nítidos, motes más
        // sólidos y firing rate ligeramente más rápido. Saturación a
        // sesión #30 — el sistema "lo reconoce".
        const coreMomentum=Math.min(1,(st.totalSessions||0)/30);
        return(
        <NeuralCore3D
          size={isActive?240:260}
          color={coreColor}
          state={coreState}
          breathScale={bS}
          isBreathing={isBr}
          reducedMotion={reducedMotion}
          intent={pr?.int||"enfoque"}
          phaseIndex={pi}
          progress={prog}
          secondTick={sec}
          breathPhase={bL}
          momentum={coreMomentum}
        />
      );})()}
      {/* Ignition flash — destello one-shot de luz que emerge del centro cuando la sesión arranca.
          Materializa la metáfora de "ignición": la chispa se enciende. */}
      <AnimatePresence>
        {ignitionFlash&&!reducedMotion&&<motion.div key="ignition" aria-hidden="true" initial={{scale:.15,opacity:1}} animate={{scale:2.4,opacity:0}} exit={{opacity:0}} transition={{duration:.85,ease:[.16,1,.3,1]}} style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle, #ffffff 0%, ${withAlpha(ac,80)} 30%, ${withAlpha(ac,20)} 60%, transparent 80%)`,pointerEvents:"none",zIndex:4,filter:"blur(2px)"}}/>}
        {ignitionFlash&&!reducedMotion&&[0,1,2].map(i=><motion.span key={`spark-${i}`} aria-hidden="true" initial={{scale:.6,opacity:.9}} animate={{scale:2,opacity:0}} transition={{duration:.7,delay:i*.08,ease: [0.22, 1, 0.36, 1]}} style={{position:"absolute",inset:0,borderRadius:"50%",border:`1.5px solid ${ac}`,pointerEvents:"none",zIndex:4}}/>)}
        {/* Phase flash — pulso sutil al transicionar entre fases, más suave que ignition */}
        {phaseFlash&&!reducedMotion&&<motion.span key="phase-flash" aria-hidden="true" initial={{scale:.85,opacity:.55}} animate={{scale:1.3,opacity:0}} transition={{duration:.6,ease: [0.22, 1, 0.36, 1]}} style={{position:"absolute",inset:0,borderRadius:"50%",border:`1.5px solid ${ac}`,pointerEvents:"none",zIndex:4,boxShadow:`0 0 20px ${withAlpha(ac,60)}`}}/>}
        {/* Orb-done flash — burst emerald que cierra el ciclo del orb antes de que el IgnitionBurst
            full-screen tome el control. Signature end-state: el orb completa su propia narrativa. */}
        {orbDoneFlash&&!reducedMotion&&<motion.div key="orb-done" aria-hidden="true" initial={{scale:.3,opacity:1}} animate={{scale:2.2,opacity:0}} transition={{duration:.55,ease:[.16,1,.3,1]}} style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle, #ffffff 0%, #34d39988 25%, #22c55e44 55%, transparent 80%)`,pointerEvents:"none",zIndex:5,filter:"blur(1px)"}}/>}
        {orbDoneFlash&&!reducedMotion&&[0,1,2].map(i=><motion.span key={`done-ring-${i}`} aria-hidden="true" initial={{scale:.8,opacity:.8}} animate={{scale:1.8,opacity:0}} transition={{duration:.6,delay:i*.07,ease: [0.22, 1, 0.36, 1]}} style={{position:"absolute",inset:0,borderRadius:"50%",border:`1.5px solid #22c55e`,pointerEvents:"none",zIndex:5,boxShadow:`0 0 20px #22c55e88`}}/>)}
      </AnimatePresence>
      {/* Progress ring como corona exterior — brillante sobre el orb oscuro */}
      <svg width={isActive?"240":"260"} height={isActive?"240":"260"} viewBox="0 0 260 260" style={{transform:"rotate(-90deg)",position:"absolute",inset:0,pointerEvents:"none"}}>
        <circle cx="130" cy="130" r="122" fill="none" stroke={withAlpha(ac,18)} strokeWidth={ts==="idle"?"3":"2.5"}/>
        <circle cx="130" cy="130" r="122" fill="none" stroke={ac} strokeWidth={isActive?"6":ts==="idle"?"4":"3"} strokeLinecap="round" strokeDasharray={2*Math.PI*122} strokeDashoffset={ts==="idle"?0:(2*Math.PI*122)*(sec/totalDur)} style={{transition:isActive?"stroke-dashoffset .95s linear":"stroke-dashoffset .3s cubic-bezier(0.22, 1, 0.36, 1)",filter:`drop-shadow(0 0 10px ${withAlpha(ac,isActive?85:65)}) drop-shadow(0 0 4px ${withAlpha(ac,50)})`}}/>
      </svg>
      {/* Contenido central — countdown + labels en colores claros (contraste contra orb oscuro) */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",zIndex:2,width:"88%",display:"flex",flexDirection:"column",alignItems:"center"}}>
        {isActive&&<motion.div key={pi} initial={reducedMotion?{opacity:1}:{opacity:0,y:-4}} animate={{opacity:1,y:0}} transition={{duration:reducedMotion?0:.35}} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 11px",borderRadius:99,background:`linear-gradient(180deg, ${withAlpha(ac,28)} 0%, ${withAlpha(ac,16)} 100%)`,border:`0.5px solid ${withAlpha(ac,55)}`,marginBottom:7,backdropFilter:"blur(8px) saturate(140%)",WebkitBackdropFilter:"blur(8px) saturate(140%)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.18), 0 0 12px ${withAlpha(ac,30)}`}}>
          <Icon name={ph.ic} size={10} color={ac} aria-hidden="true"/>
          <span aria-hidden="true" style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,color:ac,letterSpacing:"0.16em",textTransform:"uppercase",textShadow:`0 0 6px ${withAlpha(ac,60)}`,fontVariantNumeric:"tabular-nums"}}>Fase {pi+1}/{pr.ph.length} · {ph.l}</span>
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
          <motion.div animate={reducedMotion?{}:{opacity:[0.50,0.72,0.50]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}} style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9.5,fontWeight:500,letterSpacing:"0.24em",textTransform:"uppercase",color:"rgba(255,255,255,0.95)",marginTop:space[1.5],textShadow:`0 0 8px ${withAlpha(ac,40)}, 0 0 2px ${withAlpha(ac,60)}`}}>Segundos</motion.div>
          {/* Wordmark kicker — misma receta que BioIgnicionMark (BIO ligero · em-dash cyan · IGNICIÓN pesado).
              Construye identidad de marca en el momento-cero del producto. */}
          <motion.div animate={reducedMotion?{}:{opacity:[.7,1,.7]}} transition={{duration:3.5,repeat:Infinity,ease:"easeInOut"}} style={{marginTop:14,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <motion.span aria-hidden="true" animate={reducedMotion?{}:{scaleX:[1,1.25,1],opacity:[0.55,1,0.55]}} transition={reducedMotion?{}:{duration:3.5,repeat:Infinity,ease:"easeInOut"}} style={{display:"block",inlineSize:22,blockSize:1,background:`linear-gradient(90deg, transparent 0%, ${withAlpha(ac,90)} 100%)`,transformOrigin:"right center",filter:`drop-shadow(0 0 3px ${withAlpha(ac,60)})`}}/>
              <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:"rgba(255,255,255,0.72)",letterSpacing:"0.30em",textTransform:"uppercase",textShadow:`0 0 8px ${withAlpha(ac,55)}`}}>Toca para</span>
              <motion.span aria-hidden="true" animate={reducedMotion?{}:{scaleX:[1,1.25,1],opacity:[0.55,1,0.55]}} transition={reducedMotion?{}:{duration:3.5,repeat:Infinity,ease:"easeInOut",delay:1.75}} style={{display:"block",inlineSize:22,blockSize:1,background:`linear-gradient(90deg, ${withAlpha(ac,90)} 0%, transparent 100%)`,transformOrigin:"left center",filter:`drop-shadow(0 0 3px ${withAlpha(ac,60)})`}}/>
            </div>
            <span aria-hidden="true" style={{display:"inline-flex",alignItems:"baseline",gap:3,fontFamily:font.family,fontSize:15,letterSpacing:6.5,textTransform:"uppercase",lineHeight:1}}>
              <span style={{fontWeight:font.weight.normal,color:"rgba(255,255,255,0.78)"}}>BIO</span>
              <motion.span animate={reducedMotion?{}:{filter:[`drop-shadow(0 0 4px ${withAlpha(ac,80)}) drop-shadow(0 0 1px ${withAlpha(ac,100)})`,`drop-shadow(0 0 10px ${withAlpha(ac,100)}) drop-shadow(0 0 3px ${withAlpha(ac,100)})`,`drop-shadow(0 0 4px ${withAlpha(ac,80)}) drop-shadow(0 0 1px ${withAlpha(ac,100)})`]}} transition={reducedMotion?{}:{duration:2.6,repeat:Infinity,ease:"easeInOut"}} style={{color:ac,fontWeight:font.weight.bold,transform:"translateY(-0.08em)",display:"inline-block"}}>—</motion.span>
              <span style={{fontWeight:font.weight.black,color:"#ffffff",textShadow:`0 0 14px ${withAlpha(ac,30)}`}}>IGNICIÓN</span>
            </span>
          </motion.div>
        </>}
        {ts==="paused"&&<motion.div animate={{opacity:[.55,1,.55]}} transition={{duration:2.2,repeat:Infinity,ease:"easeInOut"}} style={{marginTop:10,display:"flex",alignItems:"center",gap:9}}>
          <span aria-hidden="true" style={{display:"inline-flex",gap:3.5,alignItems:"center"}}>
            <span style={{width:2.5,height:13,background:ac,borderRadius:1.25,boxShadow:`0 0 10px ${withAlpha(ac,80)}, 0 0 3px ${withAlpha(ac,100)}`}}/>
            <span style={{width:2.5,height:13,background:ac,borderRadius:1.25,boxShadow:`0 0 10px ${withAlpha(ac,80)}, 0 0 3px ${withAlpha(ac,100)}`}}/>
          </span>
          <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,color:ac,letterSpacing:"0.26em",textTransform:"uppercase",textShadow:`0 0 8px ${withAlpha(ac,50)}`}}>En pausa</span>
        </motion.div>}
      </div>
      {tp&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"100%",height:"100%",borderRadius:"50%",border:`2px solid ${withAlpha(ac,50)}`,animation:"cdPulse .6s ease forwards",pointerEvents:"none"}}/>}
    </div>

    {/* Phase info — solo en preview (idle); durante sesión activa la fase vive dentro del core */}
    {!isActive&&(()=>{const totalPh=pr.ph.length;return(
    <div style={{position:"relative",textAlign:"center",marginBottom:14,marginTop:6,padding:"12px 18px 12px",borderRadius:16,background:`radial-gradient(ellipse 70% 100% at 50% 0%, ${ac}14 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(20px) saturate(150%)",WebkitBackdropFilter:"blur(20px) saturate(150%)",border:`0.5px solid rgba(255,255,255,0.08)`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 0 ${ac}14, 0 4px 18px rgba(0,0,0,0.24), 0 0 0 1px ${withAlpha(ac,18)}, 0 0 18px ${ac}10`,overflow:"hidden"}}>
      <div aria-hidden="true" style={{position:"absolute",top:0,left:"20%",right:"20%",height:1,background:`linear-gradient(90deg, transparent 0%, ${withAlpha(ac,40)} 50%, transparent 100%)`,pointerEvents:"none"}}/>
      <div style={{display:"inline-flex",alignItems:"center",gap:9,marginBlockEnd:8}}>
        <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:"rgba(245,245,247,0.42)",letterSpacing:"0.26em",textTransform:"uppercase"}}>Fase</span>
        <span style={{display:"inline-flex",alignItems:"baseline",gap:3,fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontVariantNumeric:"tabular-nums"}}>
          <span style={{fontSize:11,fontWeight:500,color:ac,textShadow:`0 0 8px ${withAlpha(ac,80)}, 0 0 2px ${ac}`}}>{String(pi+1).padStart(2,"0")}</span>
          <span style={{fontSize:10,color:"rgba(245,245,247,0.30)",fontWeight:300}}>/</span>
          <span style={{fontSize:10,fontWeight:500,color:"rgba(245,245,247,0.50)"}}>{String(totalPh).padStart(2,"0")}</span>
        </span>
        <span aria-hidden="true" style={{display:"flex",alignItems:"center",gap:3,marginInlineStart:3}}>
          {Array.from({length:totalPh}).map((_,i)=>(
            <span key={i} style={{inlineSize:4,blockSize:4,borderRadius:"50%",background:i===pi?ac:i<pi?withAlpha(ac,60):"rgba(255,255,255,0.14)",boxShadow:i===pi?`0 0 6px ${ac}, 0 0 2px ${ac}`:"none"}}/>
          ))}
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
        <motion.span aria-hidden="true" animate={reducedMotion?{}:{scaleX:[1,1.30,1],opacity:[0.50,1,0.50]}} transition={reducedMotion?{}:{duration:3.6,repeat:Infinity,ease:"easeInOut"}} style={{display:"block",inlineSize:36,blockSize:1,background:`linear-gradient(90deg, transparent 0%, ${withAlpha(ac,80)} 100%)`,transformOrigin:"right center",filter:`drop-shadow(0 0 3px ${withAlpha(ac,60)})`}}/>
        <div style={{display:"inline-flex",alignItems:"center",gap:8}}>
          <span style={{filter:`drop-shadow(0 0 7px ${withAlpha(ac,90)}) drop-shadow(0 0 2px ${ac})`}}>
            <Icon name={ph.ic} size={14} color={ac}/>
          </span>
          <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:12,fontWeight:500,color:"rgba(245,245,247,0.98)",letterSpacing:"0.22em",textTransform:"uppercase",textShadow:`0 0 10px ${withAlpha(ac,55)}, 0 0 3px ${withAlpha(ac,30)}`}}>{ph.l}</span>
        </div>
        <motion.span aria-hidden="true" animate={reducedMotion?{}:{scaleX:[1,1.30,1],opacity:[0.50,1,0.50]}} transition={reducedMotion?{}:{duration:3.6,repeat:Infinity,ease:"easeInOut",delay:1.8}} style={{display:"block",inlineSize:36,blockSize:1,background:`linear-gradient(90deg, ${withAlpha(ac,80)} 0%, transparent 100%)`,transformOrigin:"left center",filter:`drop-shadow(0 0 3px ${withAlpha(ac,60)})`}}/>
      </div>
      <div style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9.5,fontWeight:500,color:"rgba(245,245,247,0.55)",marginTop:6,letterSpacing:"0.20em",textTransform:"uppercase",fontVariantNumeric:"tabular-nums",textShadow:`0 0 6px ${withAlpha(ac,28)}`}}>{ph.r}</div>
    </div>
    );})()}
    <motion.div key={pi} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{duration:.3}} style={{position:"relative",background:`radial-gradient(ellipse 80% 60% at 100% 0%, ${ac}1a 0%, ${ac}06 28%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(24px) saturate(150%) brightness(1.03)",WebkitBackdropFilter:"blur(24px) saturate(150%) brightness(1.03)",borderRadius:18,padding:"18px",marginBottom:10,border:`0.5px solid rgba(255,255,255,0.10)`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.24), 0 1px 0 ${ac}10, 0 6px 22px rgba(0,0,0,0.30), 0 0 0 1px ${withAlpha(ac,18)}`,overflow:"hidden"}}>
      <div aria-hidden="true" style={{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:`linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)`,pointerEvents:"none"}}/>
      {isActive&&<div aria-hidden="true" style={{position:"relative",height:4,borderRadius:99,background:`linear-gradient(180deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.18) 100%)`,boxShadow:`inset 0 1px 0 rgba(0,0,0,0.40), 0 0 0 0.5px rgba(255,255,255,0.05)`,overflow:"hidden",marginBottom:14}}><div style={{width:`${Math.round((pi+1)/pr.ph.length*100)}%`,height:"100%",borderRadius:99,background:`linear-gradient(90deg,${ac}aa,${ac})`,boxShadow:`0 0 8px ${ac}80, inset 0 0.5px 0 rgba(255,255,255,0.30)`,transition:"width .3s cubic-bezier(0.22, 1, 0.36, 1)"}}/></div>}
      {ph.k&&<div style={{position:"relative",fontSize:15,fontWeight:500,lineHeight:1.4,marginBottom:10,letterSpacing:-0.2,backgroundImage:"linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(238,238,242,0.86) 100%)",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",color:"transparent"}}>{ph.k}</div>}
      <p style={{position:"relative",fontSize:12.5,lineHeight:1.65,color:"rgba(245,245,247,0.66)",margin:0,letterSpacing:-0.05,fontFeatureSettings:"'cv11' on, 'ss01' on"}}>{ph.i}</p>

      {/* Anti-trampa checkpoints — ahora viven dentro del SessionRunner (ver onCheckpoint* props). */}

      {/* Science */}
      <button onClick={()=>{setShowScience(!showScience);}} style={{position:"relative",display:"inline-flex",alignItems:"center",gap:7,marginTop:14,padding:"7px 12px",borderRadius:99,background:`linear-gradient(180deg, ${ac}14 0%, ${ac}06 100%)`,border:`0.5px solid ${ac}3a`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.14), 0 0 10px ${ac}1c`,cursor:"pointer",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)"}}>
        <span style={{filter:`drop-shadow(0 0 5px ${ac}80)`}}><Icon name="mind" size={12} color={ac}/></span>
        <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:10,fontWeight:500,color:ac,letterSpacing:"0.20em",textTransform:"uppercase",textShadow:`0 0 6px ${ac}50`}}>Neurociencia</span>
        <span style={{display:"inline-flex",color:ac,transform:showScience?"rotate(180deg)":"rotate(0)",transition:"transform .25s ease",filter:`drop-shadow(0 0 3px ${ac}70)`}}><Icon name="chevron-down" size={11} color={ac}/></span>
      </button>
      <AnimatePresence>
      {showScience&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
        <div style={{marginTop:10,padding:"14px 14px",background:`linear-gradient(180deg, ${ac}0a 0%, ${ac}03 100%)`,borderRadius:14,border:`0.5px solid ${ac}1f`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.06)`}}>
          <div style={{fontSize:11.5,color:"rgba(245,245,247,0.72)",lineHeight:1.65,letterSpacing:-0.05}}>{ph.sc}</div>
          {SCIENCE_DEEP[pr.id]&&<div style={{fontSize:10.5,color:"rgba(245,245,247,0.50)",lineHeight:1.65,borderTop:`0.5px solid ${withAlpha(ac,18)}`,paddingTop:10,marginTop:8,letterSpacing:-0.05}}>{SCIENCE_DEEP[pr.id]}</div>}
        </div>
      </motion.div>}
      </AnimatePresence>
    </motion.div>

    {isActive&&nextPh&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",marginBottom:10,borderRadius:10,background:surface}}>
      <Icon name="chevron" size={10} color={t3}/><span style={{fontSize:10,color:t3,fontWeight:600}}>Siguiente: {nextPh.l}</span>
    </div>}
    {/* Phase timeline — proportional segments */}
    <div style={{position:"relative",marginBottom:14,padding:"11px 12px 12px",borderRadius:14,background:`radial-gradient(ellipse 80% 100% at 50% 0%, ${ac}10 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,backdropFilter:"blur(18px) saturate(140%)",WebkitBackdropFilter:"blur(18px) saturate(140%)",border:`0.5px solid rgba(255,255,255,0.08)`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${withAlpha(ac,14)}, 0 4px 14px rgba(0,0,0,0.18)`,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBlockEnd:9}}>
        <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:"rgba(245,245,247,0.42)",letterSpacing:"0.26em",textTransform:"uppercase"}}>Timeline</span>
        <span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:"rgba(245,245,247,0.55)",letterSpacing:"0.18em",textTransform:"uppercase",fontVariantNumeric:"tabular-nums"}}>{Math.round(pr.d*durMult)}s · {pr.ph.length} fases</span>
      </div>
      <div role="list" aria-label="Fases del protocolo" style={{position:"relative",display:"flex",gap:3,blockSize:9,borderRadius:99,padding:1.5,background:`linear-gradient(180deg, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.22) 100%)`,boxShadow:`inset 0 1px 0 rgba(0,0,0,0.42), 0 0 0 0.5px rgba(255,255,255,0.06)`,overflow:"hidden"}}>
        {pr.ph.map((p,i)=>{
          const segW=((p.e-p.s)/pr.d)*100;
          const isCurr=pi===i;
          const isDone=i<pi;
          return(
            <motion.div key={i} role="listitem" aria-current={isCurr?"step":undefined}
              animate={isCurr&&!reducedMotion?{boxShadow:[`0 0 8px ${ac}80, inset 0 0.5px 0 rgba(255,255,255,0.30)`,`0 0 16px ${ac}cc, 0 0 6px ${ac}, inset 0 0.5px 0 rgba(255,255,255,0.45)`,`0 0 8px ${ac}80, inset 0 0.5px 0 rgba(255,255,255,0.30)`]}:{}}
              transition={isCurr&&!reducedMotion?{duration:2.2,repeat:Infinity,ease:"easeInOut"}:{}}
              style={{
                position:"relative",
                inlineSize:`${segW}%`,
                borderRadius:99,
                background:isDone
                  ?`linear-gradient(90deg, ${ac}cc 0%, ${ac} 100%)`
                  :isCurr
                    ?`linear-gradient(90deg, ${ac} 0%, ${withAlpha(ac,80)} 100%)`
                    :`linear-gradient(90deg, ${withAlpha(ac,18)} 0%, ${withAlpha(ac,10)} 100%)`,
                boxShadow:isDone
                  ?`0 0 6px ${ac}70, inset 0 0.5px 0 rgba(255,255,255,0.30)`
                  :isCurr
                    ?`0 0 8px ${ac}80, inset 0 0.5px 0 rgba(255,255,255,0.30)`
                    :"inset 0 0.5px 0 rgba(255,255,255,0.06)",
                transition:"background .35s cubic-bezier(0.22, 1, 0.36, 1)",
              }}/>
          );
        })}
      </div>
      {/* Tick marks below the bar at phase boundaries */}
      <div aria-hidden="true" style={{position:"relative",blockSize:5,marginBlockStart:3}}>
        {pr.ph.map((p,i)=>{
          if(i===0)return null;
          const cumulative=(p.s/pr.d)*100;
          return(
            <span key={i} style={{position:"absolute",left:`${cumulative}%`,top:0,inlineSize:1,blockSize:5,background:`linear-gradient(180deg, ${withAlpha(ac,60)} 0%, transparent 100%)`,transform:"translateX(-50%)"}}/>
          );
        })}
      </div>
      <div style={{display:"flex",marginBlockStart:6}}>
        {pr.ph.map((p,i)=>{
          const segW=((p.e-p.s)/pr.d)*100;
          const isCurr=pi===i;
          const isDone=i<pi;
          const sR=durMult!==1?Math.round(p.s*durMult)+"–"+Math.round(p.e*durMult)+"s":p.r;
          const iconColor=isCurr?ac:isDone?withAlpha(ac,80):"rgba(245,245,247,0.42)";
          const labelColor=isCurr?ac:isDone?"rgba(245,245,247,0.78)":"rgba(245,245,247,0.42)";
          return(
            <div key={i} style={{
              inlineSize:`${segW}%`,
              display:"flex",
              alignItems:"center",
              gap:5,
              paddingInline:4,
              opacity:i<=pi?1:0.65,
              transition:"opacity .3s cubic-bezier(0.22, 1, 0.36, 1)",
              overflow:"hidden",
            }}>
              <motion.span
                animate={isCurr&&!reducedMotion?{filter:[`drop-shadow(0 0 4px ${withAlpha(ac,70)})`,`drop-shadow(0 0 8px ${ac})`,`drop-shadow(0 0 4px ${withAlpha(ac,70)})`]}:{}}
                transition={isCurr&&!reducedMotion?{duration:2.2,repeat:Infinity,ease:"easeInOut"}:{}}
                style={{display:"inline-flex",filter:isDone?`drop-shadow(0 0 4px ${withAlpha(ac,70)})`:"none"}}>
                <Icon name={p.ic} size={11} color={iconColor} aria-hidden="true"/>
              </motion.span>
              <span style={{
                fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize:9.5,
                fontWeight:500,
                color:labelColor,
                letterSpacing:"0.08em",
                fontVariantNumeric:"tabular-nums",
                whiteSpace:"nowrap",
                overflow:"hidden",
                textOverflow:"ellipsis",
                textShadow:isCurr?`0 0 8px ${withAlpha(ac,60)}`:"none",
              }}>{sR}</span>
            </div>
          );
        })}
      </div>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"center",alignItems:"center"}}>
      {ts==="idle"&&(()=>{
        const intentLabelMap={calma:"Calma",enfoque:"Enfoque",energia:"Energía",reset:"Reset"};
        const iconLabelMap={calma:"calm",enfoque:"focus",energia:"energy",reset:"reset"};
        const intentKey=pr?.int;
        const intentLabel=intentLabelMap[intentKey]||null;
        const intentIcon=iconLabelMap[intentKey]||"bolt";
        return(
          <motion.div initial={reducedMotion?undefined:{opacity:0,y:10}} animate={reducedMotion?undefined:{opacity:1,y:0}} transition={reducedMotion?undefined:{duration:0.55,delay:0.55,ease:[0.22,1,0.36,1]}} style={{position:"relative",flex:1,maxWidth:280,display:"flex",justifyContent:"center"}}>
            <motion.span aria-hidden="true" animate={reducedMotion?{}:{scale:[1,1.20,1],opacity:[0.45,0,0.45]}} transition={reducedMotion?{}:{duration:3.2,repeat:Infinity,ease:"easeOut"}} style={{position:"absolute",inset:-2,borderRadius:99,border:`1px solid ${ac}`,pointerEvents:"none",boxShadow:`0 0 12px ${ac}80`}}/>
            <motion.span aria-hidden="true" animate={reducedMotion?{}:{scale:[1,1.10,1],opacity:[0.30,0,0.30]}} transition={reducedMotion?{}:{duration:2.6,repeat:Infinity,ease:"easeOut",delay:0.4}} style={{position:"absolute",inset:-1,borderRadius:99,border:`0.5px solid ${ac}`,pointerEvents:"none"}}/>
            <motion.button
              whileTap={{scale:.95}}
              animate={reducedMotion?{}:{scale:[1,1.022,1],backgroundPosition:["100% 0, 0 0","-100% 0, 0 0","-100% 0, 0 0"]}}
              transition={reducedMotion?{}:{scale:{duration:3.6,repeat:Infinity,ease:"easeInOut"},backgroundPosition:{duration:6,times:[0,0.55,1],ease:"easeInOut",repeat:Infinity,repeatDelay:3}}}
              onClick={go}
              aria-label={intentLabel?`Iniciar ${intentLabel.toLowerCase()} de ${sec} segundos`:`Iniciar sesión de ${sec} segundos`}
              style={{
                position:"relative",
                inlineSize:"100%",
                minBlockSize:54,
                padding:"15px 18px",
                borderRadius:99,
                backgroundImage:`linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.30) 50%, transparent 65%), linear-gradient(180deg, ${ac} 0%, ${withAlpha(ac,90)} 50%, ${withAlpha(brand.accent,95)} 100%)`,
                backgroundSize:"200% 100%, 100% 100%",
                backgroundRepeat:"no-repeat",
                backgroundPosition:"100% 0, 0 0",
                border:"none",
                color:"#fff",
                fontFamily:font.family,
                fontSize:14,
                fontWeight:500,
                cursor:"pointer",
                letterSpacing:"0.02em",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                gap:10,
                boxShadow:`inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -1.5px 0 rgba(0,0,0,0.28), 0 1px 0 ${ac}, 0 10px 28px ${ac}50, 0 0 38px ${ac}30, 0 0 0 1px ${withAlpha(ac,70)}, 0 0 0 3px ${withAlpha(ac,12)}`,
                overflow:"hidden",
              }}>
              <span aria-hidden="true" style={{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:`linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%)`,pointerEvents:"none"}}/>
              <span aria-hidden="true" style={{position:"absolute",inset:1,borderRadius:99,border:"0.5px solid rgba(255,255,255,0.18)",pointerEvents:"none"}}/>
              <span aria-hidden="true" style={{position:"relative",inlineSize:24,blockSize:24,borderRadius:"50%",background:"radial-gradient(circle at 30% 25%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"inset 0 0.5px 0 rgba(255,255,255,0.30), 0 0 8px rgba(255,255,255,0.20)"}}>
                <span style={{display:"inline-flex",filter:`drop-shadow(0 0 6px rgba(255,255,255,0.70))`}}>
                  <Icon name={intentIcon} size={14} color="#fff"/>
                </span>
              </span>
              <span style={{position:"relative",textShadow:"0 0 12px rgba(255,255,255,0.40), 0 1px 2px rgba(0,0,0,0.20)"}}>
                Iniciar {intentLabel?`${intentLabel} `:""}<span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontVariantNumeric:"tabular-nums",letterSpacing:0,fontWeight:500,marginInlineStart:2}}>{sec}s</span>
              </span>
            </motion.button>
          </motion.div>
        );
      })()}
      {ts==="running"&&<><motion.button whileTap={{scale:.95}} onClick={pa} aria-label="Pausar sesión" style={{position:"relative",flex:1,maxWidth:200,minBlockSize:52,padding:"14px 18px",borderRadius:99,background:`radial-gradient(circle at 50% 0%, ${ac}1c 0%, transparent 65%), linear-gradient(180deg, ${ac}10 0%, ${ac}05 100%)`,backdropFilter:"blur(20px) saturate(150%)",WebkitBackdropFilter:"blur(20px) saturate(150%)",border:`0.5px solid rgba(255,255,255,0.10)`,color:"rgba(245,245,247,0.96)",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:11,fontWeight:500,letterSpacing:"0.22em",textTransform:"uppercase",cursor:"pointer",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.24), 0 4px 16px rgba(0,0,0,0.26), 0 0 0 1px ${withAlpha(ac,40)}`,textShadow:`0 0 8px ${ac}50`}}>Pausar</motion.button><motion.button whileTap={{scale:.9}} onClick={rs} aria-label="Reiniciar sesión" style={{inlineSize:48,blockSize:48,minInlineSize:48,minBlockSize:48,borderRadius:14,border:`0.5px solid rgba(255,255,255,0.10)`,background:`radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,backdropFilter:"blur(20px) saturate(150%)",WebkitBackdropFilter:"blur(20px) saturate(150%)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.24), 0 4px 14px rgba(0,0,0,0.26)`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="reset" size={16} color="rgba(245,245,247,0.78)"/></motion.button></>}
      {ts==="paused"&&<><motion.button whileTap={{scale:.95}} animate={reducedMotion?{}:{scale:[1,1.018,1]}} transition={reducedMotion?{}:{duration:3.6,repeat:Infinity,ease:"easeInOut"}} onClick={resume} aria-label="Continuar sesión" style={{position:"relative",flex:1,maxWidth:200,minBlockSize:52,padding:"14px 18px",borderRadius:99,background:`linear-gradient(180deg, ${ac} 0%, ${withAlpha(ac,90)} 50%, ${withAlpha(brand.accent,95)} 100%)`,border:"none",color:"#fff",fontFamily:font.family,fontSize:14,fontWeight:500,letterSpacing:"0.02em",cursor:"pointer",boxShadow:`inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1.5px 0 rgba(0,0,0,0.25), 0 1px 0 ${ac}, 0 8px 22px ${ac}40, 0 0 28px ${ac}28, 0 0 0 1px ${withAlpha(ac,60)}`,overflow:"hidden",textShadow:"0 0 10px rgba(255,255,255,0.30), 0 1px 2px rgba(0,0,0,0.18)"}}><span aria-hidden="true" style={{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:`linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)`,pointerEvents:"none"}}/>Continuar</motion.button><motion.button whileTap={{scale:.9}} onClick={rs} aria-label="Reiniciar sesión" style={{inlineSize:48,blockSize:48,minInlineSize:48,minBlockSize:48,borderRadius:14,border:`0.5px solid rgba(255,255,255,0.10)`,background:`radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,backdropFilter:"blur(20px) saturate(150%)",WebkitBackdropFilter:"blur(20px) saturate(150%)",boxShadow:`inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.24), 0 4px 14px rgba(0,0,0,0.26)`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="reset" size={16} color="rgba(245,245,247,0.78)"/></motion.button></>}
    </div>
    {isActive&&<div style={{marginTop:14,height:26,borderRadius:13,overflow:"hidden",background:cd,border:`1.5px solid ${bd}`,position:"relative"}}><svg width="800" height="20" viewBox="0 0 800 20" style={{position:"absolute",top:0,left:0,animation:"wf 4s linear infinite",opacity:.2}}><path d={`M0,10 ${Array.from({length:40},(_,i)=>`Q${i*20+10},${i%2===0?3:17} ${(i+1)*20},10`).join(" ")}`} fill="none" stroke={ac} strokeWidth="1"/></svg><div style={{position:"absolute",left:0,top:0,bottom:0,width:(pct*100)+"%",background:`linear-gradient(90deg,${ac}25,${ac}10)`,transition:"width .95s linear",borderRadius:10}}/></div>}
      </div>
    </div>
  </>}
  </div>)}

  {/* ═══ TAB: DASHBOARD (keep-mounted post-first-visit) ═══
      Wrappeado en div con display toggle. Mount inicial cuando user
      visita primera vez (visitedTabs.dashboard=true), después solo
      cambia visibility — instant tab switch sin re-mount cost. */}
  {visitedTabs.dashboard && (
    <div style={{display: tab==="dashboard" ? "block" : "none"}}>
      <DashboardView st={st} isDark={isDark} ac={ac} switchTab={switchTab} sp={sp} onShowHist={()=>setShowHist(true)} bp={bp} />
    </div>
  )}

  {/* ═══ TAB: PERFIL (keep-mounted post-first-visit) ═══ */}
  {visitedTabs.perfil && (
    <div style={{display: tab==="perfil" ? "block" : "none"}}>
      <ProfileView st={st} setSt={setSt} isDark={isDark} ac={ac} onShowSettings={()=>setShowSettings(true)} onShowHist={()=>setShowHist(true)} onShowCalibration={()=>setShowCalibration(true)} onShowChronotype={()=>setShowChronoTest(true)} onShowResonance={()=>setShowResonanceCal(true)} onShowNOM035={()=>setShowNOM035(true)} />
    </div>
  )}
  </div>
  </div>

  {/* ═══ LIVE VITALS STRIP — Trinity colors + custom mini-glyphs (aligned with /dashboard ADN) ═══ */}
  {(()=>{
    const neural=Math.round((st.coherencia+st.resiliencia+st.capacidad)/3);
    // Cyan halo cuando "en zona" (≥70); violet sutil 50-69; sin tinta abajo
    const vitalTint=neural>=70?"#22D3EE":neural>=50?"#A78BFA":"transparent";
    const tintOpacity=neural>=70?(isDark?0.08:0.05):neural>=50?(isDark?0.05:0.035):0;
    const barAlpha=Math.round(tintOpacity*255).toString(16).padStart(2,"0");
    const inZone=neural>=70;
    const sepStyle={inlineSize:1,blockSize:18,background:`linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%)`,flexShrink:0};
    // Trinity colors aligned with /dashboard
    const TRINITY={foco:"#22D3EE",calma:"#A78BFA",pulso:"#F59E0B"};
    // Mini glyphs (16px) — animated subtly, recognizable even at this size
    const FocoMini=(c)=>(<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke={withAlpha(c,40)} strokeWidth="0.6" strokeDasharray="2 2"/><circle cx="8" cy="8" r="3.5" fill="none" stroke={c} strokeWidth="1"/><line x1="8" y1="1" x2="8" y2="3" stroke={c} strokeWidth="1" strokeLinecap="round"/><line x1="8" y1="13" x2="8" y2="15" stroke={c} strokeWidth="1" strokeLinecap="round"/><line x1="1" y1="8" x2="3" y2="8" stroke={c} strokeWidth="1" strokeLinecap="round"/><line x1="13" y1="8" x2="15" y2="8" stroke={c} strokeWidth="1" strokeLinecap="round"/><circle cx="8" cy="8" r="1.4" fill={c}/></svg>);
    const CalmaMini=(c)=>(<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2" fill="none" stroke={c} strokeWidth="1.2"/><circle cx="8" cy="8" r="4.5" fill="none" stroke={withAlpha(c,75)} strokeWidth="0.9"/><circle cx="8" cy="8" r="7" fill="none" stroke={withAlpha(c,40)} strokeWidth="0.7"/><path d="M 8 6 Q 6.5 7.5, 6.5 8.5 A 1.5 1.5 0 0 0 9.5 8.5 Q 9.5 7.5, 8 6 Z" fill={c}/></svg>);
    const PulsoMini=(c)=>(<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">{[0,45,90,135,180,225,270,315].map((deg,i)=>{const a=(deg-90)*Math.PI/180;const isMajor=i%2===0;const r1=isMajor?3:2.8;const r2=isMajor?6.5:5.2;return <line key={i} x1={8+Math.cos(a)*r1} y1={8+Math.sin(a)*r1} x2={8+Math.cos(a)*r2} y2={8+Math.sin(a)*r2} stroke={c} strokeWidth={isMajor?1.2:0.8} strokeLinecap="round" opacity={isMajor?1:0.6}/>;})}<circle cx="8" cy="8" r="2.2" fill={withAlpha(c,40)}/><circle cx="8" cy="8" r="1.4" fill={c}/></svg>);
    const metrics=[
      {v:st.coherencia,l:"Foco",d:rD.c,c:TRINITY.foco,glyph:FocoMini},
      {v:st.resiliencia,l:"Calma",d:rD.r,c:TRINITY.calma,glyph:CalmaMini},
      {v:st.capacidad,l:"Pulso",d:0,c:TRINITY.pulso,glyph:PulsoMini},
    ];
    return <aside role="group" aria-label="Métricas neurales en tiempo real" style={{position:"fixed",bottom:`calc(${layout.bottomNav}px + env(safe-area-inset-bottom, 0px))`,left:"50%",transform:"translateX(-50%)",width:"calc(100% - max(32px, env(safe-area-inset-left) + env(safe-area-inset-right) + 32px))",maxWidth:400,padding:"10px 14px",background:`radial-gradient(ellipse 100% 80% at 50% 0%, ${vitalTint}${barAlpha}, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.18) 100%)`,backdropFilter:"blur(24px) saturate(170%) brightness(1.04)",WebkitBackdropFilter:"blur(24px) saturate(170%) brightness(1.04)",display:"flex",justifyContent:"space-between",alignItems:"center",zIndex:z.sticky,borderRadius:18,border:`0.5px solid rgba(255,255,255,${inZone?0.16:0.10})`,boxShadow:`inset 0 1px 0 rgba(255,255,255,${inZone?0.18:0.12}), inset 0 -1px 0 rgba(0,0,0,0.30), 0 8px 28px rgba(0,0,0,0.36), 0 0 0 1px ${inZone?withAlpha("#22D3EE",38):"rgba(255,255,255,0.06)"}, 0 0 0 3px ${inZone?withAlpha("#22D3EE",8):"transparent"}${inZone?`, 0 0 22px ${withAlpha("#22D3EE",18)}`:""}`,transition:"background .8s cubic-bezier(0.22, 1, 0.36, 1), border-color .8s cubic-bezier(0.22, 1, 0.36, 1), box-shadow .8s cubic-bezier(0.22, 1, 0.36, 1)",overflow:"hidden"}}>
      <span aria-hidden="true" style={{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:`linear-gradient(90deg, transparent 0%, rgba(255,255,255,${inZone?0.30:0.18}) 50%, transparent 100%)`,pointerEvents:"none"}}/>
      {metrics.flatMap((m,i)=>[
        i>0?<span key={`sep-${i}`} aria-hidden="true" style={sepStyle}/>:null,
        <div key={`m-${i}`} role="group" aria-label={`${m.l}: ${m.v}%${m.d>0?`, +${m.d} esta semana`:""}`} style={{display:"flex",alignItems:"center",gap:8,flex:1,justifyContent:"center",position:"relative"}}>
          <div aria-hidden="true" style={{position:"relative",inlineSize:30,blockSize:30,borderRadius:9,background:`radial-gradient(circle at 28% 22%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 50%), linear-gradient(145deg, ${withAlpha(m.c,38)} 0%, ${withAlpha(m.c,18)} 50%, ${withAlpha(m.c,8)} 100%)`,border:`0.5px solid ${withAlpha(m.c,55)}`,boxShadow:`inset 0 1.2px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.25), inset 0 0 0 0.5px ${withAlpha(m.c,40)}, 0 0 12px ${withAlpha(m.c,30)}, 0 2px 6px rgba(0,0,0,0.22)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
            <span aria-hidden="true" style={{position:"absolute",top:0,left:"14%",right:"14%",height:1,background:`linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.50) 50%, transparent 100%)`,pointerEvents:"none"}}/>
            <span style={{filter:`drop-shadow(0 0 5px ${withAlpha(m.c,70)})`}}>
              {m.glyph(m.c)}
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:1,minInlineSize:0}}>
            <div style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:14,fontWeight:500,color:m.c,lineHeight:1,letterSpacing:-0.4,fontVariantNumeric:"tabular-nums",textShadow:`0 0 10px ${withAlpha(m.c,60)}, 0 0 3px ${withAlpha(m.c,30)}`}}>{m.v}%</div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:8.5,fontWeight:500,color:withAlpha(m.c,75),letterSpacing:"0.20em",textTransform:"uppercase",textShadow:`0 0 4px ${withAlpha(m.c,40)}`}}>{m.l}</span>
              {m.d>0&&<span style={{fontFamily:"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:8.5,fontWeight:500,color:semantic.success,letterSpacing:0,fontVariantNumeric:"tabular-nums",textShadow:`0 0 6px ${semantic.success}50`}}>+{m.d}</span>}
            </div>
          </div>
        </div>,
      ]).filter(Boolean)}
    </aside>;
  })()}

  {/* ═══ BOTTOM NAV ═══ */}
  <nav role="tablist" aria-label="Navegación principal" aria-hidden={ts==="running"?"true":undefined} style={{position:"fixed",bottom:0,left:"50%",transform:`translateX(-50%) translateY(${ts==="running"?"72px":"0"})`,width:"100%",maxWidth:rootMaxWidth,background:`linear-gradient(180deg, rgba(8,8,12,0.40) 0%, rgba(8,8,12,0.85) 60%, rgba(8,8,12,0.95) 100%)`,backdropFilter:"blur(28px) saturate(160%) brightness(1.02)",WebkitBackdropFilter:"blur(28px) saturate(160%) brightness(1.02)",borderTop:`0.5px solid rgba(255,255,255,0.10)`,boxShadow:`0 -1px 0 rgba(255,255,255,0.04), 0 -8px 24px rgba(0,0,0,0.40)`,paddingBlockStart:8,paddingBlockEnd:"max(10px, env(safe-area-inset-bottom))",paddingInlineStart:`max(${space[4]}px, env(safe-area-inset-left))`,paddingInlineEnd:`max(${space[4]}px, env(safe-area-inset-right))`,display:"flex",justifyContent:"center",gap:space[1],zIndex:z.nav,opacity:ts==="running"?0:1,pointerEvents:ts==="running"?"none":"auto",transition:reducedMotion?"none":"transform .45s cubic-bezier(.16,1,.3,1), opacity .35s cubic-bezier(0.22, 1, 0.36, 1)"}}>
    <span aria-hidden="true" style={{position:"absolute",top:0,left:"15%",right:"15%",height:1,background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",pointerEvents:"none"}}/>
    {[{id:"ignicion",lb:"Ignición",ic:"bolt",ac:ac},{id:"dashboard",lb:"Dashboard",ic:"gauge",ac:bioSignal.phosphorCyan},{id:"perfil",lb:"Perfil",ic:"user",ac:brand.accent}].map((t,order)=>{
      const a=tab===t.id;
      const isIgnicion=t.id==="ignicion";
      const inactiveGlyphColor=isIgnicion?withAlpha(brand.primary,55):t3;
      const inactiveSpark=isIgnicion?withAlpha(bioSignal.ignition,45):t3;
      return(<motion.button key={t.id} role="tab" aria-selected={a} aria-controls={`tab-${t.id}-panel`} id={`tab-${t.id}`} tabIndex={ts==="running"?-1:(a?0:-1)} onKeyDown={e=>onTabKey(e,t.id,order)} whileTap={reducedMotion?{}:{scale:.92}} onClick={()=>switchTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 0 6px",border:"none",background:"transparent",borderRadius:18,position:"relative",minHeight:54}}>
        {a&&<motion.div layoutId="navActivePill" aria-hidden="true" transition={reducedMotion?{duration:0}:SPRING.snappy} style={{position:"absolute",inset:"4px 6px",borderRadius:18,background:`radial-gradient(ellipse 80% 70% at 50% 0%, ${t.ac}28 0%, ${t.ac}10 40%, transparent 75%), linear-gradient(180deg, ${t.ac}14 0%, ${t.ac}06 100%)`,backdropFilter:"blur(14px) saturate(140%)",WebkitBackdropFilter:"blur(14px) saturate(140%)",border:`0.5px solid ${t.ac}30`,boxShadow:`inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.20), 0 0 0 1px ${withAlpha(t.ac,16)}, 0 0 14px ${t.ac}1c`,pointerEvents:"none"}}/>}
        {a&&<motion.div layoutId="navIndicator" aria-hidden="true" style={{position:"absolute",top:1,left:"50%",translateX:"-50%",width:6,height:6,display:"flex",alignItems:"center",justifyContent:"center"}} transition={reducedMotion?{duration:0}:SPRING.snappy}>
          <motion.span aria-hidden="true" animate={reducedMotion?{}:{scale:[1,2.4,1],opacity:[0.55,0,0.55]}} transition={reducedMotion?{}:{duration:2.4,repeat:Infinity,ease:"easeOut"}} style={{position:"absolute",inset:0,borderRadius:"50%",background:t.ac}}/>
          <span style={{position:"absolute",inset:0,borderRadius:"50%",background:`radial-gradient(circle at 35% 30%, #fff 0%, ${t.ac} 55%, ${t.ac} 100%)`,boxShadow:`0 0 10px ${t.ac}, 0 0 3px ${t.ac}`}}/>
        </motion.div>}
        {order>0&&<span aria-hidden="true" style={{position:"absolute",left:0,top:"22%",bottom:"22%",width:1,background:`linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)`,pointerEvents:"none"}}/>}
        <motion.div aria-hidden="true" animate={reducedMotion?{}:{scale:a?1:0.92,y:a?-1:0}} transition={reducedMotion?{duration:0}:SPRING.snappy} style={{
          position:"relative",
          inlineSize:36,blockSize:36,
          borderRadius:11,
          background:a
            ?`radial-gradient(circle at 30% 25%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${t.ac}30 0%, ${t.ac}10 100%)`
            :isIgnicion?`linear-gradient(140deg, ${withAlpha(brand.primary,8)} 0%, ${withAlpha(brand.primary,3)} 100%)`:"transparent",
          border:a?`0.5px solid ${t.ac}3a`:"0.5px solid transparent",
          boxShadow:a?`inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.24), 0 0 12px ${t.ac}30, 0 0 0 1px ${t.ac}24`:"none",
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all .25s cubic-bezier(0.22, 1, 0.36, 1)"
        }}>
          <span style={{filter:a?`drop-shadow(0 0 6px ${withAlpha(t.ac,80)})`:"none"}}>
            {isIgnicion?(
              <BioGlyph size={a?20:18} color={a?t.ac:inactiveGlyphColor} spark={a?bioSignal.ignition:inactiveSpark} animated={a&&!reducedMotion}/>
            ):(
              <Icon name={t.ic} size={a?19:17} color={a?t.ac:"rgba(245,245,247,0.55)"}/>
            )}
          </span>
        </motion.div>
        {isIgnicion?(
          <span aria-label="Ignición" style={{display:"inline-flex",alignItems:"baseline",gap:2,fontFamily:font.family,fontSize:9,letterSpacing:a?2.4:2,textTransform:"uppercase",lineHeight:1,transition:"all .25s"}}>
            <span aria-hidden="true" style={{fontWeight:font.weight.normal,color:a?withAlpha(t.ac,90):withAlpha(brand.primary,55)}}>BIO</span>
            <span aria-hidden="true" style={{color:a?t.ac:withAlpha(brand.primary,65),fontWeight:font.weight.bold,transform:"translateY(-0.08em)",filter:a?`drop-shadow(0 0 4px ${withAlpha(t.ac,80)})`:"none"}}>—</span>
            <span aria-hidden="true" style={{fontWeight:font.weight.black,color:a?t.ac:withAlpha(brand.primary,70)}}>IGNICIÓN</span>
          </span>
        ):(
          <span style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:9,fontWeight:500,color:a?t.ac:"rgba(245,245,247,0.50)",letterSpacing:"0.18em",textTransform:"uppercase",textShadow:a?`0 0 6px ${withAlpha(t.ac,50)}`:"none",transition:"all .25s"}}>{t.lb}</span>
        )}
      </motion.button>);
    })}
  </nav>
  </div>);
}
