"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { MOODS } from "../lib/constants";
import { resolveTheme, withAlpha, ty, font, space, radius, z, semantic } from "../lib/theme";

function groupHist(h) {
  const n = new Date(); const td = n.toDateString(); const yd = new Date(Date.now() - 864e5).toDateString();
  const g = { hoy: [], ayer: [], antes: [] };
  for (const x of h) { const d = new Date(x.ts).toDateString(); if (d === td) g.hoy.push(x); else if (d === yd) g.ayer.push(x); else g.antes.push(x); }
  return g;
}

export default function HistorySheet({ show, onClose, st, isDark, ac }) {
  const { card: cd, border: bd, t1, t3 } = resolveTheme(isDark);

  return (
    <AnimatePresence>
    {show&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:z.overlay,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:300,damping:30}} style={{width:"100%",maxWidth:430,maxHeight:"75vh",background:cd,borderRadius:`${radius["2xl"]}px ${radius["2xl"]}px 0 0`,padding:`${space[5]}px ${space[5]}px ${space[10]}px`,overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:bd,borderRadius:2,margin:`0 auto ${space[5]}px`}}/><h3 style={{...ty.heading(t1),marginBottom:space[4]}}>Historial</h3>
      {!(st.history||[]).length&&<div style={{textAlign:"center",padding:`${space[10]}px 0`}}><Icon name="chart" size={30} color={t3}/><div style={{...ty.body(t3),marginTop:space[2]}}>Tu primera sesión creará el registro.</div></div>}
      {(()=>{const g=groupHist([...(st.history||[])].reverse());return Object.entries(g).map(([k,items])=>{if(!items.length)return null;return(<div key={k}><div style={{...ty.label(t3),marginBottom:space[2],marginTop:space[2.5]}}>{k==="hoy"?"Hoy":k==="ayer"?"Ayer":"Anteriores"}</div>{items.map((h,i)=>{const tm=new Date(h.ts).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});const ml=(st.moodLog||[]).find(m=>Math.abs(m.ts-h.ts)<10000);return(<div key={i} style={{display:"flex",alignItems:"center",gap:space[2],padding:`${space[2]}px 0`,borderBottom:`1px solid ${bd}`}}><div style={{width:30,height:30,borderRadius:radius.sm,background:withAlpha(ac,6),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="bolt" size={12} color={ac}/></div><div style={{flex:1}}><div style={ty.caption(t1)}>{h.p}</div><div style={{display:"flex",alignItems:"center",gap:3,marginTop:1}}><span style={ty.caption(t3)}>{tm}</span>{ml&&<Icon name={MOODS[(ml.mood||3)-1]?.icon||"neutral"} size={10} color={MOODS[(ml.mood||3)-1]?.color||t3}/>}{h.bioQ&&<span style={{...ty.caption(h.bioQ>=70?semantic.success:h.bioQ>=45?semantic.warning:semantic.danger),fontWeight:font.weight.bold}}>{h.bioQ}%</span>}</div></div><div style={{textAlign:"right"}}><div style={ty.title(ac)}>+{h.vc}</div></div></div>);})}</div>);});})()}
    </motion.div></motion.div>)}
    </AnimatePresence>
  );
}
