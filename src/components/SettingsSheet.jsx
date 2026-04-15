"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { SOUNDSCAPES } from "../lib/constants";
import { exportData } from "../lib/audio";

export default function SettingsSheet({
  show, onClose, st, setSt, isDark, ac, voiceOn, setVoiceOn, H,
}) {
  const cd = isDark ? "#141820" : "#FFFFFF";
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t2 = isDark ? "#8B95A8" : "#475569";
  const t3 = isDark ? "#4B5568" : "#94A3B8";

  return (
    <AnimatePresence>
    {show&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:300,damping:30}} style={{width:"100%",maxWidth:430,background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:17,fontWeight:800,color:t1,marginBottom:16}}>Configuración</h3>
      {[{l:"Sonido + ambiente",k:"soundOn",d:"Acordes, ruido ambiental y binaural",ic:"volume-on"},{l:"Vibración",k:"hapticOn",d:"Feedback háptico neurosensorial",ic:"vibrate"},{l:"Voz guiada",k:"_voice",d:"Narración de fases y respiración",ic:"mind"}].map(s=>(
        <div key={s.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${bd}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><Icon name={s.ic} size={15} color={t3}/><div><div style={{fontSize:12,fontWeight:700,color:t1}}>{s.l}</div><div style={{fontSize:10,color:t3,marginTop:1}}>{s.d}</div></div></div>
          <div onClick={()=>{if(s.k==="_voice"){setVoiceOn(!voiceOn);}else setSt({...st,[s.k]:!st[s.k]});}} style={{width:42,height:24,borderRadius:12,background:s.k==="_voice"?(voiceOn?ac:bd):(st[s.k]?ac:bd),cursor:"pointer",position:"relative",transition:"background .3s"}}><div style={{width:20,height:20,borderRadius:10,background:"#fff",position:"absolute",top:2,left:s.k==="_voice"?(voiceOn?20:2):(st[s.k]?20:2),transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}}/></div>
        </div>))}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${bd}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><Icon name="palette" size={15} color={t3}/><div style={{fontSize:12,fontWeight:700,color:t1}}>Tema</div></div><div style={{display:"flex",gap:4}}>{["auto","light","dark"].map(m=>(<button key={m} onClick={()=>setSt({...st,themeMode:m})} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${(st.themeMode||"auto")===m?ac:bd}`,background:(st.themeMode||"auto")===m?ac+"10":cd,color:(st.themeMode||"auto")===m?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>))}</div></div>
      {/* Soundscape Marketplace */}
      <div style={{padding:"13px 0",borderBottom:`1px solid ${bd}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Icon name="breath" size={15} color={t3}/><div><div style={{fontSize:12,fontWeight:700,color:t1}}>Paisaje sonoro</div><div style={{fontSize:10,color:t3}}>Desbloquea con V-Cores</div></div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {SOUNDSCAPES.map(s=>{const unlocked=(st.unlockedSS||["off"]).includes(s.id);const active=(st.soundscape||"off")===s.id;return<motion.button key={s.id} whileTap={{scale:.95}} onClick={()=>{if(unlocked){setSt({...st,soundscape:s.id});H("tap");}else if((st.vCores||0)>=s.cost){setSt({...st,soundscape:s.id,unlockedSS:[...(st.unlockedSS||["off"]),s.id],vCores:(st.vCores||0)-s.cost});H("ok");}}} style={{padding:"10px 8px",borderRadius:12,border:active?`2px solid ${ac}`:unlocked?`1.5px solid ${bd}`:`1.5px dashed ${bd}`,background:active?ac+"08":cd,cursor:unlocked||(st.vCores||0)>=s.cost?"pointer":"not-allowed",opacity:unlocked||(st.vCores||0)>=s.cost?1:.5,textAlign:"center"}}>
            <div style={{fontSize:11,fontWeight:700,color:active?ac:unlocked?t1:t3}}>{s.n}</div>
            {!unlocked&&<div style={{fontSize:10,fontWeight:800,color:ac,marginTop:3,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><Icon name="sparkle" size={9} color={ac}/>{s.cost}</div>}
            {unlocked&&active&&<div style={{fontSize:9,fontWeight:700,color:ac,marginTop:2}}>ACTIVO</div>}
            {unlocked&&!active&&<div style={{fontSize:9,color:t3,marginTop:2}}>desbloqueado</div>}
          </motion.button>;})}
        </div>
      </div>
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
  );
}

function exportNOM035(st){try{
  const ml=st.moodLog||[];const h=st.history||[];const now=new Date();
  const totalMin=Math.round((st.totalTime||0)/60);
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
