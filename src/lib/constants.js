import { P } from './protocols';

const MOODS=[{id:1,label:"Tensión alta",icon:"stress",value:1,color:"#94A3B8"},{id:2,label:"Agotamiento",icon:"drain",value:2,color:"#78909C"},{id:3,label:"Estable",icon:"neutral",value:3,color:"#607D8B"},{id:4,label:"Enfocado",icon:"sharp",value:4,color:"#0D9488"},{id:5,label:"Óptimo",icon:"peak",value:5,color:"#059669"}];
const ENERGY_LEVELS=[{id:1,label:"Bajo",v:1},{id:2,label:"Medio",v:2},{id:3,label:"Alto",v:3}];
const WORK_TAGS=["Pre-reunión","Post-reunión","Inicio jornada","Mitad del día","Fin de jornada","Bajo presión","Pausa activa"];
const INTENTS=[{id:"calma",label:"Calma",icon:"calm",desc:"Reducir tensión",color:"#059669"},{id:"enfoque",label:"Enfoque",icon:"focus",desc:"Concentración",color:"#6366F1"},{id:"energia",label:"Energía",icon:"energy",desc:"Activación",color:"#D97706"},{id:"reset",label:"Reset",icon:"reset",desc:"Reinicio",color:"#0D9488"}];

const DS={totalSessions:0,streak:0,todaySessions:0,lastDate:null,weeklyData:[0,0,0,0,0,0,0],weekNum:null,coherencia:64,resiliencia:66,capacidad:73,achievements:[],vCores:0,history:[],totalTime:0,soundOn:true,hapticOn:true,themeMode:"auto",moodLog:[],firstDone:false,favs:[],prevWeekData:[0,0,0,0,0,0,0],progDay:0,soundscape:"off",lastIntent:""};


/* ═══ NEURAL INTELLIGENCE ENGINE — Central Brain ═══
   Reads: moodLog, history, circadian, sessions, streak, metrics
   Outputs: ONE unified state object that drives ALL UI/UX decisions
   The user never sees this. They just feel "the system understands me." */
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

export { MOODS, ENERGY_LEVELS, WORK_TAGS, INTENTS, DS, SOUNDSCAPES, DAILY_PHRASES, PROG_7, SCIENCE_DEEP, AM, STATUS_MSGS, MID_MSGS, POST_MSGS, GREETINGS };
export function getStatus(v){for(const s of STATUS_MSGS)if(v>=s.min&&v<s.max)return s;return STATUS_MSGS[3];}
export function getWeekNum(){const d=new Date();const j=new Date(d.getFullYear(),0,1);return Math.ceil(((d-j)/864e5+j.getDay()+1)/7);}
export const STATUS_MSGS = { 
  idle: "Listo",
  ready: "Preparado",
  running: "En proceso",
  breathing: "Respira",
  focus: "Enfocado",
  calm: "Calma",
  complete: "Completado",
}