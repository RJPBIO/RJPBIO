"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { CATS, INTENTS, DIF_LABELS } from "../lib/constants";
import { predictSessionImpact } from "../lib/neural";
import { resolveTheme, withAlpha, ty, font, space, radius, z, semantic } from "../lib/theme";

export default function ProtocolSelector({
  show, onClose, st, isDark, ac, pr, sc, setSc, fl, favs, toggleFav,
  lastProto, smartPick, protoSens, sp, H,
}) {
  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  return (
    <AnimatePresence>
    {show&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:z.overlay,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:300,damping:30}} style={{width:"100%",maxWidth:430,maxHeight:"82vh",background:cd,borderRadius:`${radius["2xl"]}px ${radius["2xl"]}px 0 0`,padding:`${space[5]}px ${space[5]}px ${space[10]}px`,overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{width:36,height:4,background:bd,borderRadius:2,margin:`0 auto ${space[4]}px`}}/><h3 style={{...ty.heroHeading(t1),fontSize:font.size.xl,marginBottom:space[3]}}>Protocolos</h3>
      {/* Intent quick-filter */}
      <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
        {INTENTS.map(i=>{const isActive=sc===i.id;return<motion.button key={i.id} whileTap={{scale:.93}} onClick={()=>setSc(isActive?"Protocolo":i.id)} style={{display:"flex",alignItems:"center",gap:5,padding:`${space[2]}px ${space[4]}px`,borderRadius:radius.xl,border:isActive?`2px solid ${i.color}`:`1.5px solid ${bd}`,background:isActive?withAlpha(i.color,4):cd,cursor:"pointer",flexShrink:0,transition:"all .2s"}}><Icon name={i.icon} size={14} color={isActive?i.color:t3}/><span style={ty.caption(isActive?i.color:t3)}>{i.label}</span></motion.button>;})}
      </div>
      {/* Category tabs */}
      <div style={{display:"flex",background:isDark?"#1A1E28":"#EEF2F7",borderRadius:radius.md,padding:3,marginBottom:space[4]}}>{CATS.map(c=><button key={c} onClick={()=>setSc(c)} style={{flex:1,padding:`${space[2]}px 0`,borderRadius:radius.sm,border:"none",background:sc===c?cd:"transparent",color:sc===c?t1:t3,...ty.title(sc===c?t1:t3),cursor:"pointer",transition:"all .3s"}}>{c}</button>)}</div>
      {smartPick && <div style={{...ty.label(ac),marginBottom:space[1.5]}}>RECOMENDADO PARA TI</div>}
      {[...fl].sort((a,b)=>{const aS=smartPick?.id===a.id?2:0;const bS=smartPick?.id===b.id?2:0;return(bS+(favs.includes(b.n)?1:0))-(aS+(favs.includes(a.n)?1:0));}).map(p=>{const isLast=lastProto===p.n;const isFav=favs.includes(p.n);const isSmart=smartPick?.id===p.id;const pred=predictSessionImpact(st,p);return<motion.button key={p.id} whileTap={{scale:.98}} onClick={()=>sp(p)} style={{width:"100%",padding:space[3],marginBottom:space[1],borderRadius:radius.lg,border:isSmart?`2px solid ${ac}`:pr.id===p.id?`2px solid ${p.cl}`:`1.5px solid ${bd}`,background:isSmart?withAlpha(ac,2):pr.id===p.id?withAlpha(p.cl,4):cd,cursor:"pointer",textAlign:"left",display:"flex",gap:space[3],alignItems:"center",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",left:0,top:0,bottom:0,width:3,borderRadius:"0 2px 2px 0",background:p.cl}}/><div style={{width:40,height:40,borderRadius:radius.sm+3,background:withAlpha(p.cl,6),display:"flex",alignItems:"center",justifyContent:"center",...ty.title(p.cl),fontWeight:font.weight.black,flexShrink:0,marginLeft:space[1]}}>{p.tg}</div><div style={{flex:1}}><div style={{...ty.title(t1),display:"flex",alignItems:"center",gap:space[1],flexWrap:"wrap"}}>{p.n}{isLast&&<span style={ty.badge(t3,isDark?"#1A1E28":"#F1F5F9")}>último</span>}{isSmart&&<span style={ty.badge(ac,withAlpha(ac,6))}>IA recomienda</span>}</div><div style={{...ty.caption(t2),marginBottom:2}}>{p.sb}</div><div style={{...ty.caption(t3),display:"flex",alignItems:"center",gap:6}}>{p.ph.length} fases · {p.d}s · <span style={{color:p.dif===1?semantic.success:p.dif===2?semantic.warning:semantic.danger}}>{DIF_LABELS[(p.dif||1)-1]}</span>{pred.predictedDelta>0&&<span style={{color:semantic.success,fontWeight:font.weight.bold}}> · +{pred.predictedDelta} est.</span>}</div></div><div onClick={e=>{e.stopPropagation();toggleFav(p.n);H("tap");}} style={{padding:space[1],cursor:"pointer",flexShrink:0}}><Icon name="star" size={16} color={isFav?ac:bd}/></div>{(()=>{const s=protoSens[p.n];return s&&s.sessions>=2?<span style={{...ty.caption(s.avgDelta>0?semantic.success:semantic.danger),fontWeight:font.weight.black,marginRight:space[1]}}>{s.avgDelta>0?"+":""}{s.avgDelta}</span>:null;})()}{pr.id===p.id&&<Icon name="check" size={16} color={p.cl}/>}</motion.button>;})}
    </motion.div></motion.div>)}
    </AnimatePresence>
  );
}
