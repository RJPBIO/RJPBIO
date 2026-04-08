// ─── AUDIO ────────────────────────────────────────────────
let _aC=null;
function gAC(){if(!_aC&&typeof window!=="undefined"){try{_aC=new(window.AudioContext||window.webkitAudioContext)();_aC.addEventListener("statechange",()=>{if(_aC.state==="interrupted"||_aC.state==="suspended"){try{_aC.resume();}catch(e){}}});}catch(e){}}return _aC;}
function playChord(f,d,v){try{const c=gAC();if(!c)return;if(c.state==="suspended")c.resume();f.forEach(fr=>{const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=fr;g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime((v||.04)/f.length,c.currentTime+.08);g.gain.linearRampToValueAtTime(0,c.currentTime+d);o.start(c.currentTime);o.stop(c.currentTime+d);});}catch(e){}}

// Brown noise ambient loop
let _ambNode=null,_ambGain=null;
function startAmbient(){try{const c=gAC();if(!c)return;if(c.state==="suspended")c.resume();if(_ambNode)return;const bs=c.bufferSize||4096;_ambNode=c.createScriptProcessor?c.createScriptProcessor(bs,1,1):null;if(!_ambNode)return;_ambGain=c.createGain();_ambGain.gain.value=0;_ambGain.connect(c.destination);_ambNode.connect(_ambGain);let last=0;_ambNode.onaudioprocess=e=>{const o=e.outputBuffer.getChannelData(0);for(let i=0;i<o.length;i++){const w=Math.random()*2-1;last=(last+(0.02*w))/1.02;o[i]=last*3.5;}};_ambGain.gain.linearRampToValueAtTime(0.12,c.currentTime+2);}catch(e){}}
function stopAmbient(){try{if(_ambGain){const c=gAC();if(c)_ambGain.gain.linearRampToValueAtTime(0,c.currentTime+1);}setTimeout(()=>{if(_ambNode){_ambNode.disconnect();_ambNode=null;}if(_ambGain){_ambGain.disconnect();_ambGain=null;}},1200);}catch(e){}}

function hap(t,sO,hO){try{if(hO!==false&&typeof navigator!=="undefined"&&navigator.vibrate){if(t==="go")navigator.vibrate([20,40,20]);else if(t==="ph")navigator.vibrate(12);else if(t==="ok")navigator.vibrate([40,60,40,60,80]);else if(t==="tick")navigator.vibrate(5);else if(t==="tap")navigator.vibrate(8);}if(sO!==false){if(t==="go")playChord([432,648],.5,.05);else if(t==="ph")playChord([528,660,792],.5,.04);else if(t==="ok"){playChord([432,528,648,792],1.5,.06);setTimeout(()=>playChord([528,648,792],1.2,.025),300);}else if(t==="tap")playChord([440],.08,.02);}}catch(e){}}


let _ssNode=null,_ssGain=null;
function startSoundscape(type){try{const c=gAC();if(!c||type==="off")return;if(c.state==="suspended")c.resume();stopSoundscape();_ssGain=c.createGain();_ssGain.gain.value=0;_ssGain.connect(c.destination);
if(type==="wind"){const bs=4096;_ssNode=c.createScriptProcessor?c.createScriptProcessor(bs,1,1):null;if(!_ssNode)return;let last=0;_ssNode.onaudioprocess=e=>{const o=e.outputBuffer.getChannelData(0);for(let i=0;i<o.length;i++){const w=Math.random()*2-1;last=(last+(0.01*w))/1.01;o[i]=last*2.5;}};_ssNode.connect(_ssGain);_ssGain.gain.linearRampToValueAtTime(0.08,c.currentTime+3);}
else if(type==="drone"){const o=c.createOscillator();const o2=c.createOscillator();o.type="sine";o.frequency.value=60;o2.type="sine";o2.frequency.value=90;o.connect(_ssGain);o2.connect(_ssGain);o.start();o2.start();_ssNode={disconnect:()=>{o.stop();o2.stop();o.disconnect();o2.disconnect();}};_ssGain.gain.linearRampToValueAtTime(0.04,c.currentTime+3);}
else if(type==="bnarl"){const o=c.createOscillator();const o2=c.createOscillator();o.type="sine";o.frequency.value=200;o2.type="sine";o2.frequency.value=210;const panL=c.createStereoPanner();const panR=c.createStereoPanner();panL.pan.value=-1;panR.pan.value=1;o.connect(panL);o2.connect(panR);panL.connect(_ssGain);panR.connect(_ssGain);o.start();o2.start();_ssNode={disconnect:()=>{o.stop();o2.stop();o.disconnect();o2.disconnect();panL.disconnect();panR.disconnect();}};_ssGain.gain.linearRampToValueAtTime(0.035,c.currentTime+3);}
}catch(e){}}
function stopSoundscape(){try{if(_ssGain){const c=gAC();if(c)_ssGain.gain.linearRampToValueAtTime(0,c.currentTime+1.5);}setTimeout(()=>{if(_ssNode){_ssNode.disconnect();_ssNode=null;}if(_ssGain){_ssGain.disconnect();_ssGain=null;}},1800);}catch(e){}}


export { gAC, playChord, startAmbient, stopAmbient, hap, startSoundscape, stopSoundscape };
