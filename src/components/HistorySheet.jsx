"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { MOODS } from "../lib/constants";

function groupHist(h) {
  const n = new Date(); const td = n.toDateString(); const yd = new Date(Date.now() - 864e5).toDateString();
  const g = { hoy: [], ayer: [], antes: [] };
  for (const x of h) { const d = new Date(x.ts).toDateString(); if (d === td) g.hoy.push(x); else if (d === yd) g.ayer.push(x); else g.antes.push(x); }
  return g;
}

export default function HistorySheet({ show, onClose, st, isDark, ac }) {
  const cd = isDark ? "#141820" : "#FFFFFF";
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t3 = isDark ? "#4B5568" : "#94A3B8";

  return (
    <AnimatePresence>
    {show&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:300,damping:30}} style={{width:"100%",maxWidth:430,maxHeight:"75vh",background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:17,fontWeight:800,color:t1,marginBottom:14}}>Historial</h3>
      {!(st.history||[]).length&&<div style={{textAlign:"center",padding:"36px 0"}}><Icon name="chart" size={30} color={t3}/><div style={{fontSize:12,color:t3,marginTop:8}}>Tu primera sesión creará el registro.</div></div>}
      {(()=>{const g=groupHist([...(st.history||[])].reverse());return Object.entries(g).map(([k,items])=>{if(!items.length)return null;return(<div key={k}><div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:7,marginTop:10}}>{k==="hoy"?"Hoy":k==="ayer"?"Ayer":"Anteriores"}</div>{items.map((h,i)=>{const tm=new Date(h.ts).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});const ml=(st.moodLog||[]).find(m=>Math.abs(m.ts-h.ts)<10000);return(<div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:`1px solid ${bd}`}}><div style={{width:30,height:30,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={12} color={ac}/></div><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:t1}}>{h.p}</div><div style={{display:"flex",alignItems:"center",gap:3,marginTop:1}}><span style={{fontSize:10,color:t3}}>{tm}</span>{ml&&<Icon name={MOODS[(ml.mood||3)-1]?.icon||"neutral"} size={10} color={MOODS[(ml.mood||3)-1]?.color||t3}/>}{h.bioQ&&<span style={{fontSize:10,fontWeight:700,color:h.bioQ>=70?"#059669":h.bioQ>=45?"#D97706":"#DC2626"}}>{h.bioQ}%</span>}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:800,color:ac}}>+{h.vc}</div></div></div>);})}</div>);});})()}
    </motion.div></motion.div>)}
    </AnimatePresence>
  );
}
