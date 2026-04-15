"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { MOODS, ENERGY_LEVELS, WORK_TAGS } from "../lib/constants";

export default function PostSessionFlow({
  postStep, ts, bg, cd, bd, ac, t1, t2, t3, isDark,
  pr, durMult, st,
  checkMood, setCheckMood, checkEnergy, setCheckEnergy, checkTag, setCheckTag,
  preMood, postVC, postMsg, moodDiff,
  H, submitCheckin, onSetPostStep, onReset,
}) {
  return (
    <>
      {/* ═══ POST: BREATHE + CHECKIN ═══ */}
      <AnimatePresence>
      {postStep==="breathe"&&ts==="done"&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:220,background:`${bg}F5`,backdropFilter:"blur(30px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
        <motion.div initial={{scale:.9}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:20}} style={{background:cd,borderRadius:28,padding:"24px 20px",maxWidth:400,width:"100%"}}>
        {/* Breathing orb — compact */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <motion.div animate={{scale:[1,1.1,1],opacity:[.4,.7,.4]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}} style={{width:56,height:56,borderRadius:"50%",background:`radial-gradient(circle,${ac}15,${ac}06,transparent)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <motion.div animate={{opacity:[.3,.8,.3]}} transition={{duration:2.5,repeat:Infinity}} style={{width:12,height:12,borderRadius:"50%",background:ac}}/>
          </motion.div>
          <div><div style={{fontSize:15,fontWeight:700,color:t1,lineHeight:1.5}}>Sesión completada</div><div style={{fontSize:11,color:t3,lineHeight:1.4}}>Tu sistema nervioso cambió en {Math.round(pr.d*durMult)}s</div></div>
        </div>
        {/* Mood check-in inline */}
        <div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:800,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>¿Cómo te sientes ahora?</div>
        <div style={{display:"flex",justifyContent:"center",gap:4}}>{MOODS.map(m=>(
          <motion.button key={m.id} whileTap={{scale:.93}} onClick={()=>{setCheckMood(m.value);H("tap");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"7px 3px",borderRadius:12,border:checkMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:checkMood===m.value?m.color+"0A":cd,cursor:"pointer",transition:"all .2s",flex:1}}>
            <Icon name={m.icon} size={18} color={checkMood===m.value?m.color:t3}/>
            <span style={{fontSize:9,fontWeight:700,color:checkMood===m.value?m.color:t3,textAlign:"center",lineHeight:1.1}}>{m.label}</span>
          </motion.button>))}</div></div>
        {/* Energy — compact row */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>{ENERGY_LEVELS.map(e=>(
          <motion.button key={e.id} whileTap={{scale:.95}} onClick={()=>{setCheckEnergy(e.v);H("tap");}} style={{flex:1,padding:"8px",borderRadius:10,border:checkEnergy===e.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:checkEnergy===e.v?ac+"08":cd,color:checkEnergy===e.v?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer"}}>{e.label}</motion.button>))}</div>
        {/* Context tags — compact */}
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:16}}>{WORK_TAGS.map(tg=>(
          <button key={tg} onClick={()=>{setCheckTag(checkTag===tg?"":tg);H("tap");}} style={{padding:"4px 10px",borderRadius:16,border:checkTag===tg?`1.5px solid ${ac}`:`1px solid ${bd}`,background:checkTag===tg?ac+"08":cd,color:checkTag===tg?ac:t3,fontSize:10,fontWeight:600,cursor:"pointer"}}>{tg}</button>))}</div>
        <motion.button whileTap={{scale:.96}} onClick={submitCheckin} style={{width:"100%",padding:"13px",borderRadius:50,background:checkMood>0?ac:bd,border:"none",color:checkMood>0?"#fff":t3,fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>{checkMood>0?"CONTINUAR":"SELECCIONA ESTADO"}</motion.button>
        <button onClick={()=>onSetPostStep("summary")} style={{width:"100%",padding:"7px",marginTop:4,background:"transparent",border:"none",color:t3,fontSize:10,cursor:"pointer"}}>Omitir</button>
      </motion.div></motion.div>}
      </AnimatePresence>

      {/* ═══ POST: SUMMARY ═══ */}
      <AnimatePresence>
      {postStep==="summary"&&ts==="done"&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,zIndex:220,background:`${bg}F2`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
        <motion.div initial={{scale:.9}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:20}} style={{background:cd,borderRadius:28,padding:"28px 22px",maxWidth:400,width:"100%",position:"relative",overflow:"hidden"}}>
        {/* Celebration particles */}
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
        <motion.button whileTap={{scale:.96}} onClick={()=>{onReset();onSetPostStep("none");}} style={{width:"100%",padding:"13px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>CONTINUAR</motion.button>
      </motion.div></motion.div>}
      </AnimatePresence>
    </>
  );
}
