import { create } from 'zustand';
import { DS } from '@/lib/constants';
import { ldS, svS } from '@/lib/storage';

const useUserStore = create((set, get) => ({
  // Persistent user state (loads from localStorage)
  st: DS,
  
  // Settings
  isDark: false,
  voiceOn: true,
  greeting: "",
  
  // NFC context
  nfcCtx: null,
  
  // Achievement celebration
  newAch: null,
  
  // Actions
  setSt: (fn) => {
    set((state) => {
      const newSt = typeof fn === 'function' ? fn(state.st) : fn;
      svS(newSt);
      return { st: newSt };
    });
  },
  
  setIsDark: (v) => set({ isDark: v }),
  setVoiceOn: (v) => set({ voiceOn: v }),
  setGreeting: (v) => set({ greeting: v }),
  setNfcCtx: (v) => set({ nfcCtx: v }),
  setNewAch: (v) => set({ newAch: v }),
  
  // Load from localStorage
  loadState: () => {
    const loaded = ldS();
    set({ st: loaded });
    return loaded;
  },
  
  // Save current state
  saveState: () => {
    svS(get().st);
  },
  
  // Update theme based on time/preference
  checkTheme: () => {
    const st = get().st;
    const h = new Date().getHours();
    const mode = st.themeMode || "auto";
    if (mode === "dark") set({ isDark: true });
    else if (mode === "light") set({ isDark: false });
    else set({ isDark: h >= 20 || h < 6 });
  },
}));

export default useUserStore;
