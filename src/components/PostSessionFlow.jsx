"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { MOODS, ENERGY_LEVELS, WORK_TAGS } from "../lib/constants";
import { resolveTheme, withAlpha, ty, font, space, radius, z } from "../lib/theme";

export default function PostSessionFlow({
  postStep, ts, ac, isDark,
  pr, durMult, st,
  checkMood, setCheckMood, checkEnergy, setCheckEnergy, checkTag, setCheckTag,
  preMood, postVC, postMsg, moodDiff,
  H, submitCheckin, onSetPostStep, onReset,
}) {
  const { bg, card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);
  return (
    <>
      {/* ═══ POST: BREATHE + CHECKIN ═══ */}
      <AnimatePresence>
      {postStep==="breathe"&&ts==="done"&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:z.postSession,background:`${bg}F5`,backdropFilter:"blur(30px)",display:"flex",alignItems:"center",justifyContent:"center",padding:space[5],overflowY:"auto"}}>
        <motion.div initial={{scale:.9}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:20}} style={{background:cd,borderRadius:radius["2xl"],padding:`${space[6]}px ${space[5]}px`,maxWidth:400,width:"100%"}}>
        {/* Breathing orb — compact */}
        <div style={{display:"flex",alignItems:"center",gap:space[4],marginBottom:space[4]}}>
          <motion.div animate={{scale:[1,1.1,1],opacity:[.4,.7,.4]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}} style={{width:56,height:56,borderRadius:radius.full,background:`radial-gradient(circle,${withAlpha(ac,8)},${withAlpha(ac,4)},transparent)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <motion.div animate={{opacity:[.3,.8,.3]}} transition={{duration:2.5,repeat:Infinity}} style={{width:12,height:12,borderRadius:radius.full,background:ac}}/>
          </motion.div>
          <div><div style={{...ty.heading(t1),fontSize:font.size.lg,lineHeight:font.leading.normal}}>Sesión completada</div><div style={ty.body(t3)}>Tu sistema nervioso cambió en {Math.round(pr.d*durMult)}s</div></div>
        </div>
        {/* Mood check-in inline */}
        <div style={{marginBottom:space[4]}}><div style={{...ty.label(t3),marginBottom:space[2]}}>¿Cómo te sientes ahora?</div>
        <div style={{display:"flex",justifyContent:"center",gap:space[1]}}>{MOODS.map(m=>(
          <motion.button key={m.id} whileTap={{scale:.93}} onClick={()=>{setCheckMood(m.value);H("tap");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:space[1],padding:`${space[2]}px ${space[1]}px`,borderRadius:radius.md,border:checkMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:checkMood===m.value?withAlpha(m.color,4):cd,cursor:"pointer",transition:"all .2s",flex:1}}>
            <Icon name={m.icon} size={18} color={checkMood===m.value?m.color:t3}/>
            <span style={{fontSize:font.size.xs,fontWeight:font.weight.bold,color:checkMood===m.value?m.color:t3,textAlign:"center",lineHeight:font.leading.tight}}>{m.label}</span>
          </motion.button>))}</div></div>
        {/* Energy — compact row */}
        <div style={{display:"flex",gap:space[1.5],marginBottom:space[4]}}>{ENERGY_LEVELS.map(e=>(
          <motion.button key={e.id} whileTap={{scale:.95}} onClick={()=>{setCheckEnergy(e.v);H("tap");}} style={{flex:1,padding:space[2],borderRadius:radius.sm,border:checkEnergy===e.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:checkEnergy===e.v?withAlpha(ac,4):cd,color:checkEnergy===e.v?ac:t3,...ty.caption(checkEnergy===e.v?ac:t3),cursor:"pointer"}}>{e.label}</motion.button>))}</div>
        {/* Context tags — compact */}
        <div style={{display:"flex",flexWrap:"wrap",gap:space[1],marginBottom:space[4]}}>{WORK_TAGS.map(tg=>(
          <button key={tg} onClick={()=>{setCheckTag(checkTag===tg?"":tg);H("tap");}} style={{padding:`${space[1]}px ${space[2.5]}px`,borderRadius:radius.lg,border:checkTag===tg?`1.5px solid ${ac}`:`1px solid ${bd}`,background:checkTag===tg?withAlpha(ac,4):cd,color:checkTag===tg?ac:t3,...ty.caption(checkTag===tg?ac:t3),cursor:"pointer"}}>{tg}</button>))}</div>
        <motion.button whileTap={{scale:.96}} onClick={submitCheckin} style={{width:"100%",padding:`${space[3]}px`,borderRadius:radius.full,background:checkMood>0?ac:bd,border:"none",color:checkMood>0?"#fff":t3,...ty.button,cursor:"pointer"}}>{checkMood>0?"CONTINUAR":"SELECCIONA ESTADO"}</motion.button>
        <button onClick={()=>onSetPostStep("summary")} style={{width:"100%",padding:`${space[2]}px`,marginTop:space[1],background:"transparent",border:"none",color:t3,...ty.caption(t3),cursor:"pointer"}}>Omitir</button>
      </motion.div></motion.div>}
      </AnimatePresence>

      {/* ═══ POST: SUMMARY ═══ */}
      <AnimatePresence>
      {postStep==="summary"&&ts==="done"&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:z.postSession,background:`${bg}F2`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:space[5],overflowY:"auto"}}>
        <motion.div initial={{scale:.9}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:20}} style={{background:cd,borderRadius:radius["2xl"],padding:`${space[7]}px ${space[6]}px`,maxWidth:400,width:"100%",position:"relative",overflow:"hidden"}}>
        {/* Celebration particles */}
        {Array.from({length:24}).map((_,i)=>{const angle=(i/24)*Math.PI*2;const dist=60+Math.random()*80;return<motion.div key={i} initial={{opacity:0,scale:0,x:0,y:0}} animate={{opacity:[0,1,1,0],scale:[0,1.2,1,0.5],x:Math.cos(angle)*dist,y:Math.sin(angle)*dist-20}} transition={{duration:1.8,delay:i*.04,ease:"easeOut"}} style={{position:"absolute",top:"18%",left:"50%",width:i%3===0?5:3,height:i%3===0?5:3,borderRadius:i%4===0?"1px":radius.full,background:i%3===0?ac:i%3===1?"#6366F1":"#D97706"}}/>})}
        <div style={{textAlign:"center",marginBottom:space[4]}}>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:200,delay:.2}}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{margin:`0 auto ${space[2.5]}px`,display:"block"}}><circle cx="24" cy="24" r="22" fill={ac} opacity=".08"/><circle cx="24" cy="24" r="16" fill={ac} opacity=".12"/><path d="M15 24l6 6 12-12" stroke={ac} strokeWidth="3" strokeLinecap="round" fill="none"/></svg>
          </motion.div>
          <div style={ty.heroHeading(t1)}>{st.totalSessions<=1?"Tu primera ignición":"Sesión completada"}</div>
          <div style={{...ty.title(ac),marginTop:space[1]}}>{pr.n} · {Math.round(pr.d*durMult)}s</div>
        </div>
        {st.streak>=3&&<div style={{textAlign:"center",padding:space[2.5],marginBottom:space[3],background:`linear-gradient(135deg,${withAlpha("#D97706",isDark?8:4)},${withAlpha("#D97706",isDark?4:2)})`,borderRadius:radius.lg,border:`1px solid ${withAlpha("#D97706",8)}`}}>
          <div style={ty.title("#D97706")}><Icon name="fire" size={14} color="#D97706"/> {st.streak} días — {st.streak>=30?"IMPARABLE":st.streak>=14?"DISCIPLINADO":st.streak>=7?"CONSTANTE":"EN CONSTRUCCIÓN"}</div>
        </div>}
        {preMood>0&&checkMood>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:space[3],marginBottom:space[4],padding:`${space[4]}px ${space[4]}px`,background:`linear-gradient(135deg,${isDark?"#1A1E28":"#F1F5F9"},${isDark?"#141820":"#F8FAFC"})`,borderRadius:radius.lg}}>
          <div style={{textAlign:"center"}}><Icon name={MOODS[preMood-1].icon} size={22} color={MOODS[preMood-1].color}/><div style={{...ty.caption(t3),marginTop:3}}>Antes</div></div>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:.3}} style={{display:"flex",flexDirection:"column",alignItems:"center"}}><div style={ty.metric(moodDiff>0?"#059669":moodDiff<0?"#DC2626":t3,font.size.xl)}>{moodDiff>0?"+"+moodDiff:moodDiff===0?"=":moodDiff}</div><div style={ty.caption(t3)}>puntos</div></motion.div>
          <div style={{textAlign:"center"}}><Icon name={MOODS[checkMood-1].icon} size={22} color={MOODS[checkMood-1].color}/><div style={{...ty.caption(t3),marginTop:3}}>Después</div></div>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:space[1],marginBottom:space[3]}}>
          {[{l:"V-Cores",v:"+"+postVC,c:ac},{l:"Enfoque",v:st.coherencia+"%",c:"#3B82F6"},{l:"Calma",v:st.resiliencia+"%",c:"#8B5CF6"}].map((m,i)=>(
            <motion.div key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.2+i*.1}} style={{background:withAlpha(m.c,4),borderRadius:radius.sm+3,padding:`${space[2]}px ${space[1]}px`,textAlign:"center"}}><div style={ty.metric(m.c,font.size.lg)}>{m.v}</div><div style={{...ty.label(t3),fontSize:font.size.sm,marginTop:1}}>{m.l}</div></motion.div>))}
        </div>
        <div style={{background:withAlpha(ac,4),borderRadius:radius.sm,padding:`${space[2.5]}px ${space[3]}px`,marginBottom:space[3],border:`1px solid ${withAlpha(ac,6)}`}}>
          <div style={{...ty.body(t2),fontStyle:"italic"}}>{postMsg}</div>
        </div>
        <motion.button whileTap={{scale:.96}} onClick={()=>{onReset();onSetPostStep("none");}} style={{width:"100%",padding:`${space[3]}px`,borderRadius:radius.full,background:ac,border:"none",color:"#fff",...ty.button,cursor:"pointer"}}>CONTINUAR</motion.button>
      </motion.div></motion.div>}
      </AnimatePresence>
    </>
  );
}
