"use client";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "./Icon";
import { MOODS, ENERGY_LEVELS, WORK_TAGS } from "../lib/constants";
import { resolveTheme, withAlpha, ty, font, space, radius, z, semantic } from "../lib/theme";

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
      {postStep==="breathe"&&ts==="done"&&<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.6}} style={{position:"fixed",inset:0,zIndex:z.postSession,background:`${bg}F8`,backdropFilter:"blur(40px)",display:"flex",alignItems:"center",justifyContent:"center",padding:space[5],overflowY:"auto"}}>
        <motion.div initial={{scale:.92,y:20}} animate={{scale:1,y:0}} transition={{type:"spring",stiffness:180,damping:22,delay:0.1}} style={{background:cd,borderRadius:radius["2xl"],padding:`${space[7]}px ${space[5]}px`,maxWidth:400,width:"100%",boxShadow:`0 24px 80px ${isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)"}`}}>
        {/* Atmospheric completion indicator */}
        <div style={{textAlign:"center",marginBottom:space[5]}}>
          <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:200,delay:0.3}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:`radial-gradient(circle,${withAlpha(ac,10)},${withAlpha(ac,4)},transparent)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",position:"relative"}}>
              <motion.div animate={{scale:[1,1.15,1],opacity:[.3,.6,.3]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}} style={{position:"absolute",inset:-8,borderRadius:"50%",background:`radial-gradient(circle,${withAlpha(ac,6)},transparent)`}} />
              <motion.div animate={{opacity:[.2,.7,.2]}} transition={{duration:2.5,repeat:Infinity}} style={{width:14,height:14,borderRadius:"50%",background:ac}}/>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.4}} style={{marginTop:space[4]}}>
            <div style={{...ty.heading(t1),fontSize:font.size.xl,lineHeight:font.leading.normal}}>Sesión completada</div>
            <div style={{...ty.body(t3),marginTop:space[1]}}>{pr.n} · {Math.round(pr.d*durMult)}s</div>
          </motion.div>
        </div>
        {/* Mood check-in */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.5}} style={{marginBottom:space[5]}}>
          <div style={{...ty.label(t3),marginBottom:space[2.5],textAlign:"center"}}>¿Cómo te sientes ahora?</div>
          <div style={{display:"flex",justifyContent:"center",gap:space[1.5]}}>
            {MOODS.map(m=>(
            <motion.button key={m.id} whileTap={{scale:.9}} onClick={()=>{setCheckMood(m.value);H("tap");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:space[1.5],padding:`${space[2.5]}px ${space[1.5]}px`,borderRadius:radius.lg,border:checkMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:checkMood===m.value?withAlpha(m.color,6):cd,cursor:"pointer",transition:"all .25s",flex:1}}>
              <Icon name={m.icon} size={20} color={checkMood===m.value?m.color:t3}/>
              <span style={{fontSize:font.size.xs,fontWeight:font.weight.bold,color:checkMood===m.value?m.color:t3,textAlign:"center",lineHeight:font.leading.tight}}>{m.label}</span>
            </motion.button>))}
          </div>
        </motion.div>
        {/* Energy */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.55}} style={{display:"flex",gap:space[1.5],marginBottom:space[4]}}>
          {ENERGY_LEVELS.map(e=>(
          <motion.button key={e.id} whileTap={{scale:.95}} onClick={()=>{setCheckEnergy(e.v);H("tap");}} style={{flex:1,padding:`${space[2.5]}px ${space[2]}px`,borderRadius:radius.md,border:checkEnergy===e.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:checkEnergy===e.v?withAlpha(ac,5):cd,color:checkEnergy===e.v?ac:t3,...ty.caption(checkEnergy===e.v?ac:t3),cursor:"pointer",transition:"all .2s"}}>{e.label}</motion.button>))}
        </motion.div>
        {/* Context tags */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}} style={{display:"flex",flexWrap:"wrap",gap:space[1.5],marginBottom:space[5]}}>
          {WORK_TAGS.map(tg=>(
          <button key={tg} onClick={()=>{setCheckTag(checkTag===tg?"":tg);H("tap");}} style={{padding:`${space[1.5]}px ${space[3]}px`,borderRadius:radius.xl,border:checkTag===tg?`1.5px solid ${ac}`:`1px solid ${bd}`,background:checkTag===tg?withAlpha(ac,5):cd,color:checkTag===tg?ac:t3,...ty.caption(checkTag===tg?ac:t3),cursor:"pointer",transition:"all .2s"}}>{tg}</button>))}
        </motion.div>
        <motion.button whileTap={{scale:.96}} onClick={submitCheckin} style={{width:"100%",padding:`${space[3.5]}px`,borderRadius:radius.full,background:checkMood>0?`linear-gradient(135deg,${ac},#0D9488)`:bd,border:"none",color:checkMood>0?"#fff":t3,...ty.button,cursor:"pointer",boxShadow:checkMood>0?`0 4px 18px ${withAlpha(ac,12)}`:"none",transition:"all .3s"}}>{checkMood>0?"CONTINUAR":"SELECCIONA ESTADO"}</motion.button>
        <button onClick={()=>onSetPostStep("summary")} style={{width:"100%",padding:`${space[2.5]}px`,marginTop:space[2],background:"transparent",border:"none",color:t3,...ty.caption(t3),cursor:"pointer",opacity:.6}}>Omitir</button>
      </motion.div></motion.div>}
      </AnimatePresence>

      {/* ═══ POST: SUMMARY — atmospheric reveal ═══ */}
      <AnimatePresence>
      {postStep==="summary"&&ts==="done"&&(()=>{
        const isFirst = st.totalSessions <= 1;
        const isMilestone = [10,25,50,100,200,500].includes(st.totalSessions);
        const milestoneMsg = isMilestone ? `Sesión #${st.totalSessions} — ` + (st.totalSessions >= 100 ? "MAESTRO NEURAL" : st.totalSessions >= 50 ? "ÉLITE" : st.totalSessions >= 25 ? "AVANZADO" : "DEDICADO") : null;
        const headline = isFirst ? "Tu primera ignición" : isMilestone ? milestoneMsg : "Sesión completada";
        const particleCount = isFirst ? 28 : isMilestone ? 36 : 16;
        return <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.5}} style={{position:"fixed",inset:0,zIndex:z.postSession,background:`${bg}F5`,backdropFilter:"blur(30px)",display:"flex",alignItems:"center",justifyContent:"center",padding:space[5],overflowY:"auto"}}>
        <motion.div initial={{scale:.9,y:16}} animate={{scale:1,y:0}} transition={{type:"spring",stiffness:180,damping:22,delay:0.1}} style={{background:cd,borderRadius:radius["2xl"],padding:`${space[8]}px ${space[6]}px`,maxWidth:400,width:"100%",position:"relative",overflow:"hidden",boxShadow:`0 24px 80px ${isDark?"rgba(0,0,0,.4)":"rgba(0,0,0,.08)"}`}}>
        {/* Celebration particles — softer, more atmospheric */}
        {Array.from({length:particleCount}).map((_,i)=>{const angle=(i/particleCount)*Math.PI*2;const dist=50+Math.random()*100;return<motion.div key={i} initial={{opacity:0,scale:0,x:0,y:0}} animate={{opacity:[0,.8,.6,0],scale:[0,1,1,0.3],x:Math.cos(angle)*dist,y:Math.sin(angle)*dist-20}} transition={{duration:2.2,delay:0.3+i*.05,ease:"easeOut"}} style={{position:"absolute",top:"15%",left:"50%",width:i%3===0?4:2.5,height:i%3===0?4:2.5,borderRadius:radius.full,background:i%3===0?ac:i%3===1?"#6366F1":"#D97706",opacity:.7}}/>})}

        <div style={{textAlign:"center",marginBottom:space[5],position:"relative",zIndex:1}}>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:200,delay:.3}}>
            <svg width={isMilestone?60:50} height={isMilestone?60:50} viewBox="0 0 48 48" style={{margin:`0 auto ${space[3]}px`,display:"block"}}><circle cx="24" cy="24" r="22" fill={ac} opacity={isMilestone?".12":".06"}/><circle cx="24" cy="24" r="16" fill={ac} opacity={isMilestone?".16":".1"}/><path d="M15 24l6 6 12-12" stroke={ac} strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg>
          </motion.div>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.4}}>
            <div style={{...ty.heroHeading(t1),fontSize:font.size["2xl"]}}>{headline}</div>
            <div style={{...ty.body(ac),marginTop:space[1.5],opacity:.8}}>{pr.n} · {Math.round(pr.d*durMult)}s</div>
          </motion.div>
          {isFirst && <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.6}} style={{...ty.body(t3),marginTop:space[3],maxWidth:280,margin:`${space[3]}px auto 0`,lineHeight:font.leading.relaxed}}>Tu cerebro acaba de registrar su primera sesión de entrenamiento neural.</motion.div>}
        </div>

        {/* Streak banner */}
        {st.streak>=3&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.5}} style={{textAlign:"center",padding:`${space[3]}px ${space[3]}px`,marginBottom:space[4],background:`linear-gradient(135deg,${withAlpha(semantic.warning,isDark?6:3)},${withAlpha(semantic.warning,isDark?3:1)})`,borderRadius:radius.lg,border:`1px solid ${withAlpha(semantic.warning,6)}`}}>
          <div style={{...ty.title(semantic.warning),display:"flex",alignItems:"center",justifyContent:"center",gap:space[1.5]}}><Icon name="fire" size={15} color={semantic.warning}/> {st.streak} días — {st.streak>=30?"IMPARABLE":st.streak>=14?"DISCIPLINADO":st.streak>=7?"CONSTANTE":"EN CONSTRUCCIÓN"}</div>
        </motion.div>}

        {/* Mood delta — hero reveal when available */}
        {preMood>0&&checkMood>0&&<motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{delay:.5,type:"spring"}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:space[4],marginBottom:space[5],padding:`${space[5]}px ${space[4]}px`,background:`linear-gradient(135deg,${isDark?"#1A1E28":"#F1F5F9"},${isDark?"#141820":"#F8FAFC"})`,borderRadius:radius.lg}}>
          <div style={{textAlign:"center"}}><Icon name={MOODS[preMood-1].icon} size={24} color={MOODS[preMood-1].color}/><div style={{...ty.caption(t3),marginTop:4}}>Antes</div></div>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:.6}} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{fontSize:font.size["3xl"],fontWeight:font.weight.black,color:moodDiff>0?semantic.success:moodDiff<0?semantic.danger:t3,lineHeight:font.leading.none}}>{moodDiff>0?"+"+moodDiff:moodDiff===0?"=":moodDiff}</div>
            <div style={{...ty.caption(t3),marginTop:2}}>puntos</div>
          </motion.div>
          <div style={{textAlign:"center"}}><Icon name={MOODS[checkMood-1].icon} size={24} color={MOODS[checkMood-1].color}/><div style={{...ty.caption(t3),marginTop:4}}>Después</div></div>
        </motion.div>}

        {/* Metrics */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.6}} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:space[2],marginBottom:space[4]}}>
          {[{l:"V-Cores",v:"+"+postVC,c:ac},{l:"Enfoque",v:st.coherencia+"%",c:"#3B82F6"},{l:"Calma",v:st.resiliencia+"%",c:"#8B5CF6"}].map((m,i)=>(
            <div key={i} style={{background:withAlpha(m.c,4),borderRadius:radius.md,padding:`${space[3]}px ${space[1]}px`,textAlign:"center"}}>
              <div style={{fontSize:font.size.xl,fontWeight:font.weight.black,color:m.c,lineHeight:font.leading.none}}>{m.v}</div>
              <div style={{...ty.label(t3),fontSize:font.size.xs,marginTop:space[1.5]}}>{m.l}</div>
            </div>))}
        </motion.div>

        {/* Insight message */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.7}} style={{background:withAlpha(ac,3),borderRadius:radius.md,padding:`${space[3]}px ${space[4]}px`,marginBottom:space[5],border:`1px solid ${withAlpha(ac,5)}`}}>
          <div style={{...ty.body(t2),fontStyle:"italic",lineHeight:font.leading.relaxed}}>{postMsg}</div>
        </motion.div>

        <motion.button initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.8}} whileTap={{scale:.96}} onClick={()=>{onReset();onSetPostStep("none");}} style={{width:"100%",padding:`${space[3.5]}px`,borderRadius:radius.full,background:`linear-gradient(135deg,${ac},#0D9488)`,border:"none",color:"#fff",...ty.button,cursor:"pointer",boxShadow:`0 4px 18px ${withAlpha(ac,12)}`}}>CONTINUAR</motion.button>
      </motion.div></motion.div>;})()}
      </AnimatePresence>
    </>
  );
}
