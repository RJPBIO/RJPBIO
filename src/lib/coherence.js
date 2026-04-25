/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN · Cardio-respiratory coherence (real-time)
   ═══════════════════════════════════════════════════════════════
   Coherencia cardio-respiratoria: el grado en que la oscilación HRV
   se sincroniza con el ciclo respiratorio. Es alta (~10) cuando el
   usuario respira a frecuencia de resonancia (≈5.5 BPM) y la
   variabilidad cardíaca cae sinusoidal en fase con el aliento.

   Referencias clave:
     - Lehrer & Gevirtz (2014). Heart rate variability biofeedback:
       how and why does it work? Frontiers in Psychology, 5:756.
     - McCraty & Shaffer (2015). Heart rate variability: new
       perspectives on physiological mechanisms, assessment of self-
       regulatory capacity, and health risk. Glob Adv Health Med, 4(1).

   Métricas que producimos:
     1) IBI oscillation amplitude — std de IBIs en la ventana
        (proxy de cuánto está variando el corazón con la respiración)
     2) Breath–HRV phase lock — correlación de Pearson entre la
        secuencia de IBIs y la fase del ciclo respiratorio en
        cada beat
     3) Coherence score 0-100 — combinación normalizada para UI

   Pipeline en streaming:
     pushBeat({ ibiMs, ts })       — registrar latido
     pushBreath({ phase, ts })     — phase ∈ [0, 1] del ciclo
                                     respiratorio (0=fin exhalación,
                                     0.5=fin inhalación)
     coherence()                   — devuelve score actual

   El componente SessionRunner conoce la fase de respiración (la
   prescribe el protocolo) → pushBreath se llama cada frame.
   El BLE session conoce IBIs → pushBeat se llama por cada RR detectado.
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_WINDOW_MS = 30000; // 30s rodante para coherence

/**
 * Crea un tracker de coherencia. Stateful pero re-startable vía reset().
 */
export function createCoherenceTracker(opts = {}) {
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;

  /** @type {{ts: number, ibiMs: number, breathPhase: number|null}[]} */
  const beats = [];
  /** @type {{ts: number, phase: number}[]} */
  const breathSamples = [];
  let latestBreathPhase = null;

  function pushBeat(ibiMs, ts = Date.now()) {
    if (!Number.isFinite(ibiMs) || ibiMs < 300 || ibiMs > 2000) return;
    beats.push({ ts, ibiMs, breathPhase: latestBreathPhase });
    pruneOlder(ts);
  }

  function pushBreath(phase, ts = Date.now()) {
    if (!Number.isFinite(phase)) return;
    const wrapped = ((phase % 1) + 1) % 1; // siempre [0,1)
    latestBreathPhase = wrapped;
    breathSamples.push({ ts, phase: wrapped });
    pruneOlder(ts);
  }

  function pruneOlder(nowTs) {
    const cutoff = nowTs - windowMs;
    while (beats.length && beats[0].ts < cutoff) beats.shift();
    while (breathSamples.length && breathSamples[0].ts < cutoff) breathSamples.shift();
  }

  function reset() {
    beats.length = 0;
    breathSamples.length = 0;
    latestBreathPhase = null;
  }

  /**
   * Calcula la métrica de coherencia actual.
   * Necesita ≥10 beats con breathPhase asignada para ser confiable.
   * @returns {{score, amplitude, phaseLock, n}|null}
   */
  function coherence() {
    const aligned = beats.filter((b) => b.breathPhase != null);
    const n = aligned.length;
    if (n < 10) return null;

    // (1) Amplitude: std de IBIs como proxy de variabilidad respiratoria
    const ibis = aligned.map((b) => b.ibiMs);
    const mean = ibis.reduce((a, b) => a + b, 0) / n;
    const variance = ibis.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    // Normalize: 30ms std ≈ excelente RSA; 5ms ≈ minima
    const amplitudeScore = Math.min(100, Math.max(0, ((std - 5) / 25) * 100));

    // (2) Phase lock: cos(2π·phase) correlacionado con (IBI − mean).
    // RSA esperada: durante inhalación phase=0→0.5, IBI baja (HR sube);
    // durante exhalación phase=0.5→1, IBI sube (HR baja).
    // Esto implica que IBIs deberían correlacionar negativamente con
    // sin(2π·phase) si el cero de fase es fin de exhalación / inicio
    // de inhalación. Usamos r de Pearson; tomamos su valor absoluto
    // ya que el signo depende de la convención de fase.
    let sumX = 0, sumY = 0;
    const xs = new Array(n), ys = new Array(n);
    for (let i = 0; i < n; i++) {
      xs[i] = Math.sin(2 * Math.PI * aligned[i].breathPhase);
      ys[i] = ibis[i];
      sumX += xs[i]; sumY += ys[i];
    }
    const mx = sumX / n, my = sumY / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx, dy = ys[i] - my;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const r = (denX > 0 && denY > 0) ? num / Math.sqrt(denX * denY) : 0;
    const phaseLockScore = Math.min(100, Math.abs(r) * 100);

    // (3) Score final: media ponderada (amplitud 60%, phase-lock 40%).
    // Amplitud manda porque sin variabilidad no hay coherencia
    // (corazón muerto = 0 coherencia aunque la phase corre).
    const score = Math.round(amplitudeScore * 0.6 + phaseLockScore * 0.4);

    return {
      score,
      amplitude: round(amplitudeScore, 1),
      phaseLock: round(phaseLockScore, 1),
      n,
    };
  }

  function snapshot() {
    return {
      beatCount: beats.length,
      breathSampleCount: breathSamples.length,
      latestBreathPhase,
    };
  }

  return { pushBeat, pushBreath, coherence, reset, snapshot };
}

function round(v, decimals = 1) {
  if (!Number.isFinite(v)) return null;
  const m = Math.pow(10, decimals);
  return Math.round(v * m) / m;
}
