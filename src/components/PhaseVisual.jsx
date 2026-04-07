export function PhaseVisual({type,color,scale=1,active}){
  if(!active)return null;
  const o=.12;const s={display:"block",margin:"0 auto 4px"};
  // BREATH: Lungs with oxygen flow and bronchial tree
  if(type==="breath")return(
    <svg width="90" height="76" viewBox="0 0 90 76" style={s}>
      <g transform={`translate(45,38) scale(${scale})`} style={{transition:"transform 1.2s cubic-bezier(.4,0,.2,1)",transformOrigin:"center"}}>
        <path d="M-4,-24 C-4,-24 -24,-15 -26,3 C-28,20 -17,28 -9,28 C-3,28 -4,22 -4,11 Z" fill={color} opacity={o} stroke={color} strokeWidth=".7"/>
        <path d="M4,-24 C4,-24 24,-15 26,3 C28,20 17,28 9,28 C3,28 4,22 4,11 Z" fill={color} opacity={o} stroke={color} strokeWidth=".7"/>
        <line x1="0" y1="-30" x2="0" y2="-18" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity=".35"/>
        <path d="M0,-18 Q-6,-12 -12,-4" fill="none" stroke={color} strokeWidth=".7" opacity=".25"/>
        <path d="M0,-18 Q6,-12 12,-4" fill="none" stroke={color} strokeWidth=".7" opacity=".25"/>
        <path d="M-12,-4 Q-15,2 -18,8" fill="none" stroke={color} strokeWidth=".4" opacity=".15"/>
        <path d="M12,-4 Q15,2 18,8" fill="none" stroke={color} strokeWidth=".4" opacity=".15"/>
        {[0,1,2,3,4].map(i=><circle key={i} cx={(i-2)*3} cy={-30+((scale-1)*(35+i*5))} r={1+i*.2} fill={color} opacity={scale>1.08?(.2+i*.12):.02} style={{transition:`all ${1+i*.15}s ease`}}/>)}
      </g>
    </svg>);
  // BODY: Heart with blood vessels and dynamic ECG
  if(type==="body")return(
    <svg width="90" height="76" viewBox="0 0 90 76" style={s}>
      <g style={{animation:"heartBeat 1.1s ease infinite",transformOrigin:"45px 35px"}}>
        <path d="M45,64 C45,64 14,44 14,26 C14,15 22,9 31,9 C38,9 42,13 45,18 C48,13 52,9 59,9 C67,9 75,15 75,26 C75,44 45,64 45,64Z" fill={color} opacity={o} stroke={color} strokeWidth=".8"/>
        <path d="M45,64 C45,64 14,44 14,26 C14,15 22,9 31,9 C38,9 42,13 45,18 C48,13 52,9 59,9 C67,9 75,15 75,26 C75,44 45,64 45,64Z" fill={color} opacity={.04}/>
        <path d="M31,20 Q35,28 33,36" fill="none" stroke={color} strokeWidth=".4" opacity=".15"/>
        <path d="M59,20 Q55,28 57,36" fill="none" stroke={color} strokeWidth=".4" opacity=".15"/>
        <polyline points="20,36 30,36 34,24 38,46 42,30 46,38 50,32 54,36 58,36 64,36 70,36" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity=".3" style={{animation:"ecgDraw 1.1s linear infinite"}}/>
        <circle cx="45" cy="32" r="3" fill={color} opacity=".08" style={{animation:"focusLock 1.1s ease infinite"}}/>
      </g>
    </svg>);
  // MIND: Brain with synaptic connections and wave patterns
  if(type==="mind")return(
    <svg width="90" height="76" viewBox="0 0 90 76" style={s}>
      <path d="M45,8 C31,8 20,15 18,27 C16,37 20,46 25,50 C29,54 31,58 31,63 L59,63 C59,58 61,54 65,50 C69,46 73,37 71,27 C69,15 58,8 45,8Z" fill={color} opacity={.05} stroke={color} strokeWidth=".7"/>
      <path d="M45,10 L45,61" stroke={color} strokeWidth=".4" opacity=".15" strokeDasharray="2 3"/>
      <path d="M24,30 C29,25 36,28 40,23" fill="none" stroke={color} strokeWidth=".5" opacity=".15"/>
      <path d="M22,40 C27,35 34,39 43,34" fill="none" stroke={color} strokeWidth=".5" opacity=".15"/>
      <path d="M66,30 C61,25 54,28 50,23" fill="none" stroke={color} strokeWidth=".5" opacity=".15"/>
      <path d="M68,40 C63,35 56,39 47,34" fill="none" stroke={color} strokeWidth=".5" opacity=".15"/>
      {/* Activation zones */}
      <circle cx="33" cy="30" r="7" fill={color} opacity=".06" style={{animation:"brainPulse 2.5s ease infinite"}}/>
      <circle cx="57" cy="28" r="6" fill={color} opacity=".05" style={{animation:"brainPulse 2.5s ease infinite .7s"}}/>
      <circle cx="45" cy="42" r="8" fill={color} opacity=".07" style={{animation:"brainPulse 3s ease infinite 1.4s"}}/>
      {/* Synaptic connections */}
      <line x1="33" y1="30" x2="45" y2="42" stroke={color} strokeWidth=".3" opacity=".1" style={{animation:"ecgDraw 2s linear infinite"}}/>
      <line x1="57" y1="28" x2="45" y2="42" stroke={color} strokeWidth=".3" opacity=".1" style={{animation:"ecgDraw 2s linear infinite .5s"}}/>
      <line x1="33" y1="30" x2="57" y2="28" stroke={color} strokeWidth=".3" opacity=".08" style={{animation:"ecgDraw 2.5s linear infinite 1s"}}/>
      {/* Neural sparks */}
      {[[35,24],[52,22],[40,48],[58,40],[28,42],[48,32]].map(([x,y],i)=>
        <circle key={i} cx={x} cy={y} r="1.2" fill={color} opacity=".4" style={{animation:`neuralSpark ${1.2+i*.3}s ease infinite ${i*.25}s`}}/>)}
    </svg>);
  // FOCUS: Crosshair with scanning laser and lock-on
  if(type==="focus")return(
    <svg width="90" height="76" viewBox="0 0 90 76" style={s}>
      <circle cx="45" cy="38" r="28" fill="none" stroke={color} strokeWidth=".6" opacity=".1" strokeDasharray="5 3" style={{animation:"focusSpin 14s linear infinite",transformOrigin:"45px 38px"}}/>
      <circle cx="45" cy="38" r="20" fill="none" stroke={color} strokeWidth=".5" opacity=".08" strokeDasharray="3 4" style={{animation:"focusSpin 9s linear infinite reverse",transformOrigin:"45px 38px"}}/>
      <circle cx="45" cy="38" r="12" fill="none" stroke={color} strokeWidth=".8" opacity=".12" style={{animation:"focusLock 2.5s ease infinite"}}/>
      <circle cx="45" cy="38" r="5" fill={color} opacity=".06" style={{animation:"focusLock 2s ease infinite .2s"}}/>
      <line x1="45" y1="6" x2="45" y2="24" stroke={color} strokeWidth=".8" opacity=".2" strokeLinecap="round"/>
      <line x1="45" y1="52" x2="45" y2="70" stroke={color} strokeWidth=".8" opacity=".2" strokeLinecap="round"/>
      <line x1="13" y1="38" x2="31" y2="38" stroke={color} strokeWidth=".8" opacity=".2" strokeLinecap="round"/>
      <line x1="59" y1="38" x2="77" y2="38" stroke={color} strokeWidth=".8" opacity=".2" strokeLinecap="round"/>
      {/* Corner brackets */}
      <path d="M22,16 L22,12 L26,12" fill="none" stroke={color} strokeWidth=".6" opacity=".15"/>
      <path d="M68,16 L68,12 L64,12" fill="none" stroke={color} strokeWidth=".6" opacity=".15"/>
      <path d="M22,60 L22,64 L26,64" fill="none" stroke={color} strokeWidth=".6" opacity=".15"/>
      <path d="M68,60 L68,64 L64,64" fill="none" stroke={color} strokeWidth=".6" opacity=".15"/>
      <circle cx="45" cy="38" r="2" fill={color} opacity=".5"/>
    </svg>);
  return null;
}
