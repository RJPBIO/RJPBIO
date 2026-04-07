import { create } from 'zustand';
import { P } from '@/lib/protocols';

const useSessionStore = create((set, get) => ({
  // Timer
  ts: "idle",          // idle | running | paused | done
  sec: 120,
  pi: 0,              // phase index
  countdown: 0,
  
  // Breathing
  bL: "",             // breath label (INHALA/EXHALA/MANTÉN/SOSTÉN)
  bS: 1,              // breath scale
  bCnt: 0,            // breath countdown
  
  // Mid-session
  midMsg: "",
  showMid: false,
  
  // Duration
  durMult: 1,
  
  // Session data (anti-trampa)
  sessionData: {
    pauses: 0, scienceViews: 0, interactions: 0, touchHolds: 0,
    motionSamples: 0, stability: 0, reactionTimes: [], phaseTimings: []
  },
  
  // Post-session
  postStep: "none",   // none | breathe | checkin | summary
  postVC: 0,
  postMsg: "",
  
  // Check-in
  checkMood: 0,
  checkEnergy: 0,
  checkTag: "",
  preMood: 0,
  
  // Protocol
  pr: P[12],          // default to OMEGA
  sc: "Protocolo",    // selector category
  
  // Actions
  setTs: (v) => set({ ts: v }),
  setSec: (fn) => set((state) => ({ sec: typeof fn === 'function' ? fn(state.sec) : fn })),
  setPi: (v) => set({ pi: v }),
  setCountdown: (fn) => set((state) => ({ countdown: typeof fn === 'function' ? fn(state.countdown) : fn })),
  setBL: (v) => set({ bL: v }),
  setBS: (v) => set({ bS: v }),
  setBCnt: (v) => set({ bCnt: v }),
  setMidMsg: (v) => set({ midMsg: v }),
  setShowMid: (v) => set({ showMid: v }),
  setDurMult: (v) => set({ durMult: v }),
  setSessionData: (fn) => set((state) => ({ 
    sessionData: typeof fn === 'function' ? fn(state.sessionData) : fn 
  })),
  setPostStep: (v) => set({ postStep: v }),
  setPostVC: (v) => set({ postVC: v }),
  setPostMsg: (v) => set({ postMsg: v }),
  setCheckMood: (v) => set({ checkMood: v }),
  setCheckEnergy: (v) => set({ checkEnergy: v }),
  setCheckTag: (v) => set({ checkTag: v }),
  setPreMood: (v) => set({ preMood: v }),
  setPr: (v) => set({ pr: v }),
  setSc: (v) => set({ sc: v }),
  
  // Select protocol and reset
  selectProtocol: (p) => set((state) => ({
    pr: p,
    sec: Math.round(p.d * state.durMult),
    ts: "idle",
    pi: 0,
    bL: "",
    bS: 1,
    bCnt: 0,
    showMid: false,
    postStep: "none",
    checkMood: 0,
    checkEnergy: 0,
    checkTag: "",
    preMood: 0,
    countdown: 0,
    compFlash: false,
  })),
  
  // Reset session
  resetSession: () => set((state) => ({
    ts: "idle",
    sec: Math.round(state.pr.d * state.durMult),
    pi: 0,
    bL: "",
    bS: 1,
    bCnt: 0,
    showMid: false,
    postStep: "none",
    checkMood: 0,
    checkEnergy: 0,
    checkTag: "",
    preMood: 0,
    countdown: 0,
  })),
  
  // Reset session data
  resetSessionData: () => set({
    sessionData: {
      pauses: 0, scienceViews: 0, interactions: 0, touchHolds: 0,
      motionSamples: 0, stability: 0, reactionTimes: [], phaseTimings: []
    }
  }),
}));

export default useSessionStore;
