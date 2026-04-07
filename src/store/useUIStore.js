import { create } from 'zustand';

const useUIStore = create((set) => ({
  // Navigation
  tab: "ignicion",
  tabFade: 1,
  
  // Modals & Overlays
  sl: false,           // protocol selector
  showHist: false,     // history modal
  showSettings: false, // settings modal
  showIntent: false,   // intent picker
  showScience: false,  // science expandable
  onboard: false,      // onboarding overlay
  
  // Visual states
  mt: false,           // mounted
  entryDone: false,    // entry animation done
  tp: false,           // touch press on Core
  compFlash: false,    // completion flash
  neuralZone: null,    // active brain zone
  dashSections: { metrics: false, activity: false },
  
  // Actions
  setTab: (tab) => set({ tab }),
  setTabFade: (v) => set({ tabFade: v }),
  setSl: (v) => set({ sl: v }),
  setShowHist: (v) => set({ showHist: v }),
  setShowSettings: (v) => set({ showSettings: v }),
  setShowIntent: (v) => set({ showIntent: v }),
  setShowScience: (v) => set({ showScience: v }),
  setOnboard: (v) => set({ onboard: v }),
  setMt: (v) => set({ mt: v }),
  setEntryDone: (v) => set({ entryDone: v }),
  setTp: (v) => set({ tp: v }),
  setCompFlash: (v) => set({ compFlash: v }),
  setNeuralZone: (v) => set({ neuralZone: v }),
  setDashSections: (fn) => set((state) => ({ 
    dashSections: typeof fn === 'function' ? fn(state.dashSections) : fn 
  })),
  
  // Tab switch with debounce
  _tabSwitching: false,
  switchTab: (id) => set((state) => {
    if (id === state.tab || state._tabSwitching) return state;
    setTimeout(() => {
      set({ tab: id, tabFade: 1, _tabSwitching: false });
    }, 210);
    return { tabFade: 0, _tabSwitching: true };
  }),
}));

export default useUIStore;
