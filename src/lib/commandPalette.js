/* ═══════════════════════════════════════════════════════════════
   COMMAND PALETTE — builder puro
   ═══════════════════════════════════════════════════════════════
   Construye la lista de comandos (acciones, navegación, vistas,
   protocolos, recientes, toggles) que alimenta CommandPalette.jsx.

   Función pura: dado un `ctx` con estado + callbacks, retorna el
   array ordenado. Sin side effects hasta que el usuario ejecuta
   una acción. Esto la hace testeable sin montar React.

   Los nombres de `actions.*` son explícitos (setTimerStatus,
   playHaptic, openHistory…) en lugar de alias legacy (setTs, H,
   setShowHist…) para que page.jsx pase un adaptador minúsculo.
   ═══════════════════════════════════════════════════════════════ */

function protoIcon(intent) {
  if (intent === "calma") return "calm";
  if (intent === "enfoque") return "focus";
  if (intent === "energia") return "energy";
  return "sparkle";
}

function themeLabel(mode) {
  if (mode === "dark") return "dim";
  if (mode === "light") return "claro";
  return "automático";
}

function cycleTheme(mode) {
  const m = mode || "auto";
  if (m === "auto") return "dark";
  if (m === "dark") return "light";
  return "auto";
}

export function buildCommands(ctx) {
  const {
    timerStatus,
    tab,
    state,
    protocol,
    durationMultiplier,
    protocols,
    actions,
  } = ctx;

  const actionGroup = [];

  if (timerStatus === "idle") {
    actionGroup.push({
      id: "act-start",
      group: "Acciones",
      icon: "bolt",
      label: "Iniciar sesión ahora",
      hint: `${protocol?.n || "Protocolo"} · ${Math.round((protocol?.d || 120) * durationMultiplier)}s`,
      shortcut: "⏎",
      action: () => {
        if (tab !== "ignicion") actions.switchTab("ignicion");
        setTimeout(() => actions.go(), 50);
      },
    });
  }
  if (timerStatus === "running") {
    actionGroup.push({
      id: "act-pause",
      group: "Acciones",
      icon: "clock",
      label: "Pausar sesión",
      hint: "Detiene timer, conserva progreso",
      action: () => actions.pause(),
    });
  }
  if (timerStatus === "paused") {
    actionGroup.push({
      id: "act-resume",
      group: "Acciones",
      icon: "bolt",
      label: "Reanudar sesión",
      hint: "Continúa donde quedaste",
      action: () => {
        actions.setTimerStatus("running");
        actions.playHaptic("go");
        if (state.soundOn !== false) actions.startBinaural(protocol.int);
        actions.requestWakeLock();
      },
    });
  }

  actionGroup.push({
    id: "act-theme",
    group: "Acciones",
    icon: "moon",
    label: `Tema: ${themeLabel(state.themeMode)}`,
    hint: "Ciclar auto → oscuro → claro",
    action: () => actions.setState({ ...state, themeMode: cycleTheme(state.themeMode) }),
  });

  actionGroup.push({
    id: "act-mood",
    group: "Acciones",
    icon: "heart",
    label: "Registrar ánimo ahora",
    hint: "Escala 1-5 rápida",
    action: () => {
      actions.setCheckMood(0);
      actions.setPostStep("mood");
    },
  });

  const navGroup = [
    { id: "nav-ig", group: "Navegar", icon: "bolt", label: "Ir a Ignición", hint: "Selector + timer", action: () => actions.switchTab("ignicion") },
    { id: "nav-db", group: "Navegar", icon: "chart", label: "Ir a Dashboard", hint: "Métricas y trayectoria", action: () => actions.switchTab("dashboard") },
    { id: "nav-pf", group: "Navegar", icon: "user", label: "Ir a Perfil", hint: "Logros y ajustes personales", action: () => actions.switchTab("perfil") },
  ];

  const viewGroup = [
    { id: "view-hist", group: "Vistas", icon: "clock", label: "Abrir historial", hint: `${(state.history || []).length} sesiones`, action: () => actions.openHistory() },
    { id: "view-set", group: "Vistas", icon: "gear", label: "Abrir ajustes", action: () => actions.openSettings() },
    { id: "view-cal", group: "Vistas", icon: "gauge", label: "Re-calibrar baseline", hint: "Nueva medición de 60s", action: () => actions.openCalibration() },
    { id: "view-hrv", group: "Vistas", icon: "predict", label: "Medir HRV", action: () => actions.openHRV() },
    { id: "view-sigh", group: "Vistas", icon: "breath", label: "Suspiro fisiológico", action: () => actions.openSigh() },
    { id: "view-nsdr", group: "Vistas", icon: "moon", label: "NSDR · descanso no-sueño", action: () => actions.openNSDR() },
  ];

  const protoGroup = (protocols || []).slice(0, 12).map((p, i) => ({
    id: `proto-${i}`,
    group: "Protocolos",
    icon: protoIcon(p.int),
    label: p.n,
    hint: `${Math.round(p.d * durationMultiplier)}s · ${p.int || "neural"}`,
    action: () => {
      actions.selectProtocol(p);
      actions.switchTab("ignicion");
    },
  }));

  const recentGroup = ((state.history || []).slice(-3).reverse())
    .map((h, i) => {
      const proto = (protocols || []).find((p) => p.n === h.n || p.id === h.id);
      if (!proto) return null;
      const delta = h.c != null ? (h.c > 0 ? `+${h.c}` : `${h.c}`) : "—";
      return {
        id: `recent-${i}`,
        group: "Repetir recientes",
        icon: "refresh",
        label: proto.n,
        hint: `Última: ${h.date || "reciente"} · Δ${delta}`,
        action: () => {
          actions.selectProtocol(proto);
          actions.switchTab("ignicion");
        },
      };
    })
    .filter(Boolean);

  const toggleGroup = [
    {
      id: "tog-sound",
      group: "Ajustes",
      icon: state.soundOn !== false ? "volume-on" : "volume-off",
      label: `Sonido: ${state.soundOn !== false ? "encendido" : "apagado"}`,
      hint: "Alternar audio",
      action: () => actions.setState({ ...state, soundOn: state.soundOn === false }),
    },
    {
      id: "tog-haptic",
      group: "Ajustes",
      icon: "vibrate",
      label: `Háptica: ${state.hapticOn !== false ? "encendida" : "apagada"}`,
      hint: "Alternar vibración",
      action: () => actions.setState({ ...state, hapticOn: state.hapticOn === false }),
    },
  ];

  return [...actionGroup, ...navGroup, ...viewGroup, ...recentGroup, ...protoGroup, ...toggleGroup];
}
