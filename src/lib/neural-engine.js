import { P } from './protocols';

function neuralIntelligence(st) {
  const ml = st.moodLog || [];
  const h = st.history || [];
  const now = new Date();
  const hour = now.getHours();
  const circ = getCircadian();
  
  // ─── MOOD TRAJECTORY (not just last mood, but direction) ───
  const last3 = ml.slice(-3).map(m => m.mood);
  const last7 = ml.slice(-7).map(m => m.mood);
  const moodNow = last3.length ? last3[last3.length-1] : 3;
  const moodTrend = last3.length >= 2 ? last3[last3.length-1] - last3[0] : 0;
  const moodVolatility = last7.length >= 3 ? Math.round(last7.reduce((a,m,i,arr) => i>0 ? a+Math.abs(m-arr[i-1]) : a, 0) / (last7.length-1) * 100) / 100 : 0;
  
  // ─── USER PATTERN (when do they use it, how often) ───
  const todayCount = st.todaySessions || 0;
  const weekTotal = (st.weeklyData||[]).reduce((a,b) => a+b, 0);
  const isConsistent = weekTotal >= 5;
  const isNew = st.totalSessions < 5;
  const isExperienced = st.totalSessions >= 20;
  
  // ─── ENERGY HISTORY ───
  const lastEnergy = ml.slice(-3).filter(m => m.energy > 0);
  const avgEnergy = lastEnergy.length ? lastEnergy.reduce((a,m) => a + m.energy, 0) / lastEnergy.length : 2;
  
  // ─── NEED DETECTION (what does the user need RIGHT NOW) ───
  let primaryNeed = "equilibrio";
  let urgency = "normal";
  let reason = "";
  
  if (moodNow <= 2 && moodTrend <= 0) {
    primaryNeed = "rescate";
    urgency = "alta";
    reason = "Estado bajo y descendente";
  } else if (avgEnergy <= 1.2 && moodNow >= 3) {
    primaryNeed = "activacion";
    urgency = "media";
    reason = "Energía baja con mood aceptable";
  } else if (moodNow <= 2) {
    primaryNeed = "calma";
    urgency = "alta";
    reason = "Estado bajo pero estable";
  } else if (moodVolatility > 1.2) {
    primaryNeed = "estabilidad";
    urgency = "media";
    reason = "Alta variabilidad emocional";
  } else if (hour >= 6 && hour < 10 && moodNow >= 3) {
    primaryNeed = "activacion";
    urgency = "normal";
    reason = "Mañana con buen estado base";
  } else if (hour >= 10 && hour < 17) {
    primaryNeed = "enfoque";
    urgency = "normal";
    reason = "Horario de rendimiento";
  } else if (hour >= 20) {
    primaryNeed = "descarga";
    urgency = "normal";
    reason = "Cierre del día";
  }
  
  // ─── PROTOCOL SELECTION (data-driven, not random) ───
  const sens = calcProtoSensitivity(ml);
  // Tag frequency analysis
  const tagCounts = {};
  ml.slice(-20).forEach(m => { if(m.tag) tagCounts[m.tag] = (tagCounts[m.tag]||0) + 1; });
  const topTag = Object.entries(tagCounts).sort((a,b) => b[1] - a[1])[0];
  const underPressure = topTag && (topTag[0] === "Bajo presión" || topTag[0] === "Pre-reunión") && topTag[1] >= 3;
  if (underPressure && primaryNeed === "equilibrio") { primaryNeed = "calma"; reason = "Patrón de presión frecuente detectado"; }
  
  const needToIntent = {rescate:"reset",calma:"calma",estabilidad:"calma",activacion:"energia",enfoque:"enfoque",descarga:"reset",equilibrio:"calma"};
  const intent = needToIntent[primaryNeed] || "calma";
  
  let bestProto = null;
  // First: check if user has a proven effective protocol for this intent
  const effective = Object.entries(sens)
    .filter(([n,d]) => d.avgDelta > 0.2 && d.sessions >= 2)
    .sort((a,b) => b[1].avgDelta - a[1].avgDelta);
  if (effective.length) {
    const match = effective.find(([n]) => {
      const p = P.find(x => x.n === n);
      return p && p.int === intent;
    });
    if (match) bestProto = P.find(p => p.n === match[0]);
  }
  // Fallback: pick by intent + difficulty appropriate to experience
  if (!bestProto) {
    const pool = P.filter(p => p.int === intent && (isNew ? p.dif <= 2 : true));
    const lastP = h.length ? h[h.length-1].p : "";
    const available = pool.filter(p => p.n !== lastP);
    bestProto = available.length ? available[Math.floor(Math.random() * available.length)] : pool[0] || P[0];
  }
  
  // ─── QUALITY TREND ───
  const last5Q = h.slice(-5).map(s => s.bioQ || 50);
  const qTrend = last5Q.length >= 3 ? last5Q[last5Q.length-1] - last5Q[0] : 0;
  const qualityDeclining = qTrend < -15;
  
  // ─── UI STATE (drives animations, colors, text) ───
  const systemState = moodNow >= 4 ? "optimal" : moodNow >= 3 ? "functional" : moodNow >= 2 ? "stressed" : "critical";
  const pulseSpeed = systemState === "optimal" ? "slow" : systemState === "functional" ? "medium" : "fast";
  const uiIntensity = systemState === "critical" ? 0.9 : systemState === "stressed" ? 0.7 : systemState === "optimal" ? 0.4 : 0.5;
  
  // ─── MESSAGE (one clear thing to tell the user) ───
  let message = "";
  if (isNew && todayCount === 0) message = "Tu primera sesión del día te espera.";
  else if (urgency === "alta") message = "Tu sistema necesita atención. " + bestProto.n + " es lo indicado ahora.";
  else if (todayCount >= 2) message = "Buen ritmo hoy. Tu sistema se fortalece.";
  else if (st.streak >= 7) message = st.streak + " días seguidos. Tu cerebro ya cambió.";
  else if (moodTrend > 0) message = "Tendencia ascendente. Sigue así.";
  else if (qualityDeclining) message = "Tu calidad de sesión ha bajado. Enfócate en las instrucciones.";
  else message = circ.period === "noche" ? "Cierra el día con calma." : "Tu próxima ignición te espera.";
  
  return {
    // Need
    primaryNeed, urgency, reason, intent,
    // Quality
    qualityDeclining, avgEnergy, topTag: topTag ? topTag[0] : null,
    // Protocol
    bestProto, 
    // User profile
    isNew, isExperienced, isConsistent,
    // Mood
    moodNow, moodTrend, moodVolatility,
    // UI
    systemState, pulseSpeed, uiIntensity,
    // Communication
    message
  };
}

/* ═══ NEURAL ENGINE — Complete Biohacking Systems ═══ */

/* Binaural Audio Engine — Protocol-specific neuro-entrainment */
let _binauralL=null,_binauralR=null,_binauralGain=null,_binauralPan=0,_binauralRAF=null;
function startBinaural(type){try{const c=gAC();if(!c)return;stopBinaural();_binauralGain=c.createGain();_binauralGain.gain.value=0;_binauralGain.connect(c.destination);
  const panL=c.createStereoPanner();const panR=c.createStereoPanner();
  _binauralL=c.createOscillator();_binauralR=c.createOscillator();_binauralL.type="sine";_binauralR.type="sine";
  if(type==="enfoque"){_binauralL.frequency.value=200;_binauralR.frequency.value=214;}
  else if(type==="energia"){_binauralL.frequency.value=200;_binauralR.frequency.value=218;}
  else if(type==="calma"){_binauralL.frequency.value=200;_binauralR.frequency.value=210;}
  else if(type==="reset"){_binauralL.frequency.value=200;_binauralR.frequency.value=206;}
  else{_binauralL.frequency.value=200;_binauralR.frequency.value=210;}
  // 8D spatial rotation
  function rotatePan(){panL.pan.value=Math.sin(_binauralPan)*0.8;panR.pan.value=Math.cos(_binauralPan)*0.8;_binauralPan+=0.015;if(_binauralGain)_binauralRAF=requestAnimationFrame(rotatePan);}
  _binauralL.connect(panL);_binauralR.connect(panR);panL.connect(_binauralGain);panR.connect(_binauralGain);
  _binauralL.start();_binauralR.start();rotatePan();_binauralGain.gain.linearRampToValueAtTime(0.025,c.currentTime+4);
}catch(e){}}
function stopBinaural(){try{if(_binauralRAF){cancelAnimationFrame(_binauralRAF);_binauralRAF=null;}if(_binauralGain){const c=gAC();if(c)_binauralGain.gain.linearRampToValueAtTime(0,c.currentTime+2);}setTimeout(()=>{try{if(_binauralL){_binauralL.stop();_binauralL.disconnect();}if(_binauralR){_binauralR.stop();_binauralR.disconnect();}if(_binauralGain)_binauralGain.disconnect();_binauralL=null;_binauralR=null;_binauralGain=null;}catch(e){}},2500);}catch(e){}}

/* Circadian Engine — Full chronobiology adaptation */
function getCircadian(){const h=new Date().getHours();
  if(h>=5&&h<9)return{period:"amanecer",energy:"alta",voiceRate:0.95,voicePitch:1.05,warmth:0,intent:"energia",uiWarmth:"0deg",audioFreq:"beta"};
  if(h>=9&&h<13)return{period:"mañana",energy:"máxima",voiceRate:0.92,voicePitch:1.0,warmth:0,intent:"enfoque",uiWarmth:"0deg",audioFreq:"beta"};
  if(h>=13&&h<16)return{period:"mediodía",energy:"media",voiceRate:0.90,voicePitch:0.98,warmth:10,intent:"reset",uiWarmth:"5deg",audioFreq:"alpha"};
  if(h>=16&&h<20)return{period:"tarde",energy:"descendente",voiceRate:0.88,voicePitch:0.95,warmth:20,intent:"enfoque",uiWarmth:"10deg",audioFreq:"alpha"};
  if(h>=20&&h<23)return{period:"noche",energy:"baja",voiceRate:0.82,voicePitch:0.90,warmth:40,intent:"calma",uiWarmth:"20deg",audioFreq:"theta"};
  return{period:"madrugada",energy:"mínima",voiceRate:0.78,voicePitch:0.88,warmth:50,intent:"calma",uiWarmth:"25deg",audioFreq:"delta"};}

/* BIO QUALITY SCORE™ — Anti-trampa behavioral validation */
function calcBioQuality(sd,dur){
  // Expected: 3 interaction prompts per session, 1 touch hold, motion if handheld
  const interactions=sd.interactions||0;
  const touchHolds=sd.touchHolds||0;
  const motionSamples=sd.motionSamples||0;
  const pauses=sd.pauses||0;
  // Interaction score: 3 prompts expected, each worth 33%
  const iScore=Math.min(1,interactions/3);
  // Touch hold: at least 1 sustained press validates presence
  const tScore=touchHolds>=1?1:interactions>=2?0.5:0;
  // Motion: any movement confirms device is in hand (not on desk)
  const hasMotionPerm=motionSamples>0;
  const mScore=hasMotionPerm?(motionSamples>=5?1:motionSamples>=2?0.6:0):0;
  // Pause penalty: each pause reduces score
  const pauseP=Math.max(0,1-pauses*0.2);
  // Redistribute motion weight when no permission granted
  const wI=hasMotionPerm?0.30:0.38;const wT=hasMotionPerm?0.25:0.32;const wM=hasMotionPerm?0.15:0;
  // Completion is baseline (always 1 if session completed)
  const raw=(iScore*wI+tScore*wT+mScore*wM+pauseP*0.15+0.15)*100;
  const score=Math.round(Math.max(5,Math.min(100,raw)));
  // Zero interaction = inválida regardless
  const quality=interactions===0&&touchHolds===0?"inválida":score>=70?"alta":score>=45?"media":score>=20?"baja":"inválida";
  return{score,quality,iScore:Math.round(iScore*100),mScore:Math.round(mScore*100),tScore:Math.round(tScore*100)};}

/* Motion Detection — Accelerometer/gyroscope biofeedback */
function setupMotionDetection(cb){
  if(typeof window==="undefined")return null;
  let samples=0,stability=0,lastMag=9.8;
  function handle(e){const a=e.accelerationIncludingGravity;if(!a)return;
    const mag=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z);const diff=Math.abs(mag-lastMag);
    if(diff>0.3)samples++;stability=stability*0.95+diff*0.05;lastMag=mag;if(cb)cb({samples,stability});}
  try{if(typeof DeviceMotionEvent!=="undefined"&&typeof DeviceMotionEvent.requestPermission==="function"){
    DeviceMotionEvent.requestPermission().then(p=>{if(p==="granted")window.addEventListener("devicemotion",handle);});
  }else{window.addEventListener("devicemotion",handle);}}catch(e){}
  return{getSamples:()=>samples,getStability:()=>stability,cleanup:()=>{try{window.removeEventListener("devicemotion",handle);}catch(e){}}};}

/* Burnout Prediction Index — Predictive analytics */
function calcBurnoutIndex(ml,hist){
  ml=ml||[];hist=hist||[];if(ml.length<5)return{index:0,risk:"sin datos",trend:"neutral",prediction:"",avgMood:3};
  const last7=ml.slice(-7);const prev7=ml.slice(-14,-7);
  const avgR=last7.reduce((a,m)=>a+m.mood,0)/last7.length;
  const avgP=prev7.length>=3?prev7.reduce((a,m)=>a+m.mood,0)/prev7.length:avgR;
  const trend=avgR-avgP;const lowC=last7.filter(m=>m.mood<=2).length;
  const sessW=hist.filter(s=>(Date.now()-s.ts)<7*86400000).length;
  const raw=Math.max(0,Math.min(100,50-trend*15+lowC*10-sessW*2+(avgR<2.5?20:0)));
  const idx=Math.round(raw);// Detect flat affect (always 3, never varies = disengagement signal)
  const flatAffect=ml.length>=7&&ml.slice(-7).every(m=>m.mood===3);
  const risk=flatAffect?"moderado":idx>=70?"crítico":idx>=50?"alto":idx>=30?"moderado":"bajo";
  const pred=flatAffect?"Patrón de respuesta uniforme detectado. Posible desengagement. Variar protocolos recomendado.":idx>=70?"Riesgo de agotamiento en 48h. Protocolo OMEGA recomendado.":idx>=50?"Tendencia descendente detectada. Aumentar frecuencia de sesiones.":idx>=30?"Estado estable con margen de mejora.":"Sistema en buen estado. Mantener ritmo.";
  return{index:idx,risk,trend:trend>0.3?"mejorando":trend<-0.3?"deteriorando":"estable",prediction:pred,avgMood:+avgR.toFixed(1)};}

/* Protocol Sensitivity — Per-user effectiveness mapping */
function calcProtoSensitivity(ml){
  const m=(ml||[]).filter(m=>m.pre>0&&m.proto);const bp={};
  m.forEach(x=>{if(!bp[x.proto])bp[x.proto]={d:[],c:0};bp[x.proto].d.push(x.mood-x.pre);bp[x.proto].c++;});
  const r={};Object.entries(bp).forEach(([n,d])=>{const a=d.d.reduce((a,b)=>a+b,0)/d.d.length;
    r[n]={avgDelta:+a.toFixed(2),sessions:d.c,eff:a>0.5?"alta":a>0?"media":"baja"};});return r;}

/* BIO SIGNAL SCORE™ — Aggregate neural state */
function calcBioSignal(st){
  const perf=Math.round(((st.coherencia||50)+(st.resiliencia||50)+(st.capacidad||50))/3);
  const ml=st.moodLog||[];const rec=ml.slice(-7);
  const mAvg=rec.length?rec.reduce((a,m)=>a+m.mood,0)/rec.length:3;
  const cons=Math.min(1,(st.weeklyData||[]).filter(v=>v>0).length/7);
  const bo=calcBurnoutIndex(ml,st.history);
  const sig=Math.round(perf*0.3+mAvg*12+cons*20-bo.index*0.2);
  return{score:Math.max(0,Math.min(100,sig)),perf,mAvg:+mAvg.toFixed(1),consistency:Math.round(cons*100),burnout:bo};}

/* Neural Fingerprint — Unique user cognitive profile */
function calcNeuralFingerprint(st){
  const ml=st.moodLog||[];const h=st.history||[];if(h.length<10)return null;
  const hrs=Array(24).fill(0);h.forEach(x=>{hrs[new Date(x.ts).getHours()]++;});
  const peakHour=hrs.indexOf(Math.max(...hrs));
  const protoEff=calcProtoSensitivity(ml);
  const bestProto=Object.entries(protoEff).sort((a,b)=>b[1].avgDelta-a[1].avgDelta)[0];
  const avgQuality=h.slice(-20).filter(x=>x.bioQ).reduce((a,x)=>a+(x.bioQ||50),0)/Math.max(1,h.slice(-20).filter(x=>x.bioQ).length);
  const weekPattern=(st.weeklyData||[]).map((v,i)=>({day:["L","M","X","J","V","S","D"][i],sessions:v}));
  const moodBaseline=ml.length>=14?+(ml.slice(-14).reduce((a,m)=>a+m.mood,0)/Math.min(ml.length,14)).toFixed(1):3;
  return{peakHour,bestProto:bestProto?bestProto[0]:"N/D",avgQuality:Math.round(avgQuality),weekPattern,moodBaseline,
    adaptationRate:h.length>=20?+((h.slice(-10).reduce((a,x)=>a+(x.c||50),0)/10)-(h.slice(-20,-10).reduce((a,x)=>a+(x.c||50),0)/10)).toFixed(1):0,
    cognitiveBaseline:{focus:st.coherencia||50,calm:st.resiliencia||50,energy:st.capacidad||50}};}

/* Cognitive Entropy Detection — Reaction time analysis */
function calcCognitiveEntropy(sessionData){
  const rt=sessionData.reactionTimes||[];if(rt.length<2)return{entropy:0,state:"neutral"};
  const avg=rt.reduce((a,b)=>a+b,0)/rt.length;
  const variance=rt.reduce((a,t)=>a+Math.pow(t-avg,2),0)/rt.length;
  const entropy=Math.min(100,Math.round(Math.sqrt(variance)*10));
  const speed=avg<400?"alta":avg<600?"media":avg<800?"normal":"baja";
  const firstHalf=rt.slice(0,Math.floor(rt.length/2));const secondHalf=rt.slice(Math.floor(rt.length/2));
  const avgFirst=firstHalf.length?firstHalf.reduce((a,b)=>a+b,0)/firstHalf.length:avg;
  const avgSecond=secondHalf.length?secondHalf.reduce((a,b)=>a+b,0)/secondHalf.length:avg;
  const activationDelta=Math.round(avgFirst-avgSecond);
  return{entropy,state:entropy>60?"alto — cerebro desordenado":entropy>30?"medio — procesamiento irregular":"bajo — alta coherencia",avgReaction:Math.round(avg),speed,activationDelta,improved:activationDelta>50};}

/* Haptic Patterns — Phase-specific tactile feedback */
function hapticPhase(type){if(typeof navigator==="undefined"||!navigator.vibrate)return;
  try{if(type==="breath")navigator.vibrate([30,60,30]);
  else if(type==="body")navigator.vibrate([50,30,50,30,50]);
  else if(type==="mind")navigator.vibrate([20,100,20]);
  else if(type==="focus")navigator.vibrate([80,20,80]);
  else navigator.vibrate(30);}catch(e){}}
function hapticBreath(label){if(typeof navigator==="undefined"||!navigator.vibrate)return;
  try{if(label==="INHALA")navigator.vibrate([15,30,15,30,15]);
  else if(label==="EXHALA")navigator.vibrate([40]);
  else if(label==="MANTÉN")navigator.vibrate(20);
  else navigator.vibrate(10);}catch(e){}}


/* Touch-Based Coherence Estimation — uses tap timing as biofeedback proxy */
function estimateCoherence(reactionTimes){
  if(!reactionTimes||reactionTimes.length<2)return{coherence:0,consistency:0,state:"sin datos"};
  const avg=reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length;
  const variance=reactionTimes.reduce((a,t)=>a+Math.pow(t-avg,2),0)/reactionTimes.length;
  const cv=Math.sqrt(variance)/avg; // coefficient of variation
  // Low CV = consistent timing = likely coherent
  // High CV = erratic = likely agitated
  const consistency=Math.round(Math.max(0,Math.min(100,(1-cv)*100)));
  const coherence=Math.round(Math.max(0,Math.min(100,consistency*0.7+Math.min(30,reactionTimes.length*5))));
  const state=coherence>=70?"alta coherencia":coherence>=40?"coherencia parcial":"baja coherencia";
  return{coherence,consistency,state,avgRT:Math.round(avg)};}


/* Cross-Session Gaming Detection — detects automation and empty usage */
function detectGamingPattern(history){
  if(!history||history.length<5)return{gaming:false,reason:""};
  const last10=history.slice(-10);
  // Pattern 1: All sessions have 0 interactions
  const zeroInteractions=last10.filter(h=>h.interactions===0).length;
  if(zeroInteractions>=8)return{gaming:true,reason:"Sin interacción en "+zeroInteractions+"/"+last10.length+" sesiones"};
  // Pattern 2: All sessions have identical low quality
  const qualities=last10.map(h=>h.bioQ||0);
  const allSame=qualities.every(q=>q===qualities[0])&&qualities[0]<30;
  if(allSame)return{gaming:true,reason:"Calidad idéntica y baja en todas las sesiones"};
  // Pattern 3: Sessions too close together (< 30 seconds apart)
  for(let i=1;i<last10.length;i++){if(last10[i].ts-last10[i-1].ts<30000)return{gaming:true,reason:"Sesiones con menos de 30s entre ellas"};}
  return{gaming:false,reason:""};}


/* Recovery Index — measures how long session effects persist */
function calcRecoveryIndex(moodLog){
  if(!moodLog||moodLog.length<4)return null;
  const withPre=moodLog.filter(m=>m.pre>0&&m.mood>0);
  if(withPre.length<2)return null;
  // Find pairs: session end (mood) → next session start (pre of next)
  const recoveries=[];
  for(let i=1;i<withPre.length;i++){
    const prev=withPre[i-1];const curr=withPre[i];
    const timeBetween=(curr.ts-prev.ts)/3600000; // hours
    const moodAtEnd=prev.mood;const moodAtNextStart=curr.pre;
    const retention=moodAtNextStart/Math.max(1,moodAtEnd);
    if(timeBetween>0.5&&timeBetween<48)recoveries.push({hours:Math.round(timeBetween),retention:Math.round(retention*100)});}
  if(!recoveries.length)return null;
  const avgRetention=Math.round(recoveries.reduce((a,r)=>a+r.retention,0)/recoveries.length);
  const avgHours=Math.round(recoveries.reduce((a,r)=>a+r.hours,0)/recoveries.length);
  return{avgRetention,avgHours,sessions:recoveries.length,
    interpretation:avgRetention>=80?"Excelente retención. El efecto persiste "+avgHours+"h promedio.":avgRetention>=60?"Retención moderada. Considerar 2 sesiones diarias.":"Baja retención. Aumentar frecuencia o cambiar protocolo."};}

/* Expanded Data Model — All Supabase-ready variables */
function buildSessionRecord(pr,st,sd,nfcCtx,durMult,bioQ,burnout,bioSignal,circadian){
  return{
    // Core
    p:pr.n,ts:Date.now(),dur:Math.round(pr.d*durMult),ctx:nfcCtx?.type||"manual",intent:pr.int,
    // Quality
    bioQ:bioQ.score,quality:bioQ.quality,interactions:sd.interactions||0,touchHolds:sd.touchHolds||0,
    motionSamples:sd.motionSamples||0,motionStability:sd.stability||0,pauses:sd.pauses||0,
    // Cognitive state
    c:st.coherencia,r:st.resiliencia,e:st.capacidad,
    // Predictions
    burnoutIdx:burnout.index,bioSignalScore:bioSignal.score,
    // Context
    circadian:circadian.period,hour:new Date().getHours(),
    // Reaction
    entropy:sd.reactionTimes?calcCognitiveEntropy(sd).entropy:0,
    touchCoherence:estimateCoherence(sd.reactionTimes).coherence,
    activationDelta:sd.reactionTimes?calcCognitiveEntropy(sd).activationDelta:0,
    avgReaction:sd.reactionTimes?calcCognitiveEntropy(sd).avgReaction:0
  };}

export { neuralIntelligence };
export { startBinaural, stopBinaural };
export { calcBioQuality, setupMotionDetection, calcBurnoutIndex, calcProtoSensitivity };
export { calcBioSignal, calcNeuralFingerprint, calcCognitiveEntropy, estimateCoherence };
export { hapticPhase, hapticBreath, detectGamingPattern, calcRecoveryIndex, buildSessionRecord };
export { getCircadian };
