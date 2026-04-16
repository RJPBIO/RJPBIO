"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { CATS, INTENTS, DIF_LABELS } from "../lib/constants";
import { predictSessionImpact } from "../lib/neural";

export default function ProtocolSelector({
  show, onClose, st, isDark, ac, pr, sc, setSc, fl, favs, toggleFav,
  lastProto, smartPick, protoSens, sp, H,
}) {
  const cd = isDark ? "#141820" : "#FFFFFF";
  const bd = isDark ? "#1E2330" : "#E2E8F0";
  const t1 = isDark ? "#E8ECF4" : "#0F172A";
  const t2 = isDark ? "#8B95A8" : "#475569";
  const t3 = isDark ? "#4B5568" : "#94A3B8";

  return (
    <AnimatePresence>
    {show&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
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
  );
}
