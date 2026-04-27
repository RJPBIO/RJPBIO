/* ═══════════════════════════════════════════════════════════════
   NEURAL_CONFIG — central de constantes del motor adaptativo
   ═══════════════════════════════════════════════════════════════
   Cada constante documenta QUÉ hace, POR QUÉ ese valor y, cuando
   aplica, FUENTE académica. Cambiar un valor aquí ajusta el motor
   sin tocar lógica.

   Frozen: nadie puede mutarlo en runtime. Para experimentar, derivar
   un objeto con spread y pasarlo como override (futuro Sprint 41+
   considerará A/B testing con multi-config).
   ═══════════════════════════════════════════════════════════════ */

const FREEZE = (x) => Object.freeze(x);

export const NEURAL_CONFIG = FREEZE({

  // ── Burnout detection ─────────────────────────────────────────
  // Inspirado en Maslach Burnout Inventory (MBI-GS, Schaufeli 2002).
  // 3 componentes: exhaustion, disengagement, reduced efficacy.
  burnout: FREEZE({
    // Mínimo de muestras de mood para calcular cualquier subíndice.
    // <5 → confianza muy baja, devolvemos "datos insuficientes".
    minSamplesExhaustion: 5,
    minSamplesDisengage: 7,
    minHistoryEfficacy: 6,

    // Ventanas de comparación recent vs prev (días).
    windowDays: 7,

    // Exhaustion baseLow por nivel absoluto de mood promedio.
    // Mood sostenido bajo es la señal más fuerte de exhaustion.
    exhaustionLowMoodThresholds: FREEZE([
      { max: 1.5, value: 80 }, // crítico
      { max: 2.0, value: 55 },
      { max: 2.5, value: 35 },
      { max: 3.0, value: 15 },
    ]),
    // Trend penalty: cada -1.0 de trend → +25 (cap +30, floor -20).
    exhaustionTrendMultiplier: 25,
    exhaustionTrendCap: 30,
    exhaustionTrendFloor: -20,
    // Offset base: indica que aun "estable" tiene piso de 10.
    exhaustionOffset: 10,

    // Disengagement: variance threshold para considerar mood "flat".
    disengageVarianceFlat: 0.1,   // 0 ≤ var < 0.1 → uniforme
    disengageVarianceMid: 0.4,
    disengageVarianceHigh: 0.8,
    // Solo flat+neutro (avg ~3) cuenta como disengagement.
    disengageNeutralMin: 2.5,
    disengageNeutralMax: 3.5,

    // Pesos de combinación: exhaustion domina porque es más interpretable
    // y dispara la intervención más clara (bajar carga).
    weights: FREEZE({
      withEfficacy: { exhaustion: 0.5, disengage: 0.2, efficacy: 0.3 },
      withoutEfficacy: { exhaustion: 0.75, disengage: 0.25 },
    }),

    // Risk thresholds del índice agregado.
    riskThresholds: FREEZE({ critical: 70, high: 50, moderate: 30 }),
  }),

  // ── BioQuality (calidad de la sesión) ─────────────────────────
  // Calidad observable de presencia: interactions, touch holds, motion,
  // pauses. Se usa para detectar gaming + ajustar gain en vCores.
  bioQuality: FREEZE({
    interactionsTarget: 3,        // a partir de aquí iScore es 1.0
    motionFullThreshold: 5,
    motionPartialThreshold: 2,
    pauseDecay: 0.2,              // cada pausa resta 0.2 al pause score

    // Pesos cuando hay permiso de motion sensor:
    weightsWithMotion: FREEZE({ interaction: 0.30, touch: 0.25, motion: 0.15, pause: 0.15, base: 0.15 }),
    // Sin motion: redistribuimos su peso a interaction/touch.
    weightsNoMotion:   FREEZE({ interaction: 0.38, touch: 0.32, motion: 0.00, pause: 0.15, base: 0.15 }),

    // Quality bands del score 0-100.
    bands: FREEZE({ alta: 70, media: 45, baja: 20 }),
    minScore: 5,
    maxScore: 100,
  }),

  // ── Adaptive Engine scoring ───────────────────────────────────
  // Pesos del scoring multidimensional. Cada signal aporta delta al
  // score base de 50.
  scoring: FREEZE({
    baseScore: 50,
    sensitivity: FREEZE({
      deltaMultiplier: 20,        // avgDelta * 20 → impacto del historial personal
      sessionsBonusThreshold: 5,  // a partir de 5 sesiones, +10 extra confianza
      sessionsBonus: 10,
    }),
    diversityPenalty: -15,        // penaliza protocolos repetidos en últimas 3 sesiones
    levelMatch: FREEZE({
      withinReach: 5,             // dificultad ≤ levelIdx+1 → bonus
      tooHigh: -10,               // dificultad > levelIdx+2 → penalty
    }),
    circadianBonus: FREEZE({
      morningActivation: 10,      // <10h + (energia|enfoque)
      eveningCalma: 10,           // ≥20h + calma
      midDayReset: 8,             // 13-16h + reset
    }),
    favoritesBonus: 8,
    banditUcbWeight: 4,           // multiplicador del UCB1 contextual
    banditExplorationConst: 0.6,  // c en UCB1 — más alto = más exploración
    readinessBonus: FREEZE({
      recoverCalma: 10,
      recoverActivePenalty: -8,
      primedActive: 8,
      primedCalmaPenalty: -4,
    }),
  }),

  // ── Prediction CI ─────────────────────────────────────────────
  prediction: FREEZE({
    // 80% gaussian band (z=1.28). No clínico, suficiente para UX.
    ciZ: 1.28,
    // Mínimo de muestras para CI real; <2 cae a banda fija.
    minSamplesForCI: 2,
    fallbackBandHalfWidth: 1.5,   // ±1.5 cuando n<2
    fallbackPredictedDelta: 0.8,  // valor promedio global cuando no hay historial

    // Confianza inicial + bonus por sesión (capped):
    selfConfidenceBase: 50,
    selfConfidenceBonus: 5,       // +5 por sesión
    selfConfidenceCap: 95,
    crossProtocolConfidenceBase: 30,
    crossProtocolConfidenceBonus: 4,
    crossProtocolConfidenceCap: 70,
    coldStartConfidence: 20,

    // Drift detection en residuales (signo cambia + diff > umbral).
    driftMinHistory: 10,
    driftThreshold: 0.8,
    driftWidenMultiplier: 0.5,    // cuánto ensancha el CI cuando hay drift
    driftConfidencePenalty: 15,
  }),

  // ── Cognitive Load ────────────────────────────────────────────
  // Estima recursos cognitivos disponibles. Combina señales genéricas
  // con datos personales si hay historial suficiente.
  cogLoad: FREEZE({
    // Curva base por hora (recursos se depletan durante el día):
    hourlyBase: FREEZE([
      { until: 8,  load: 15 },
      { until: 10, load: 25 },
      { until: 13, load: 40 },
      { until: 15, load: 55 },
      { until: 18, load: 60 },
      { until: 21, load: 70 },
      { until: 24, load: 80 },
    ]),
    // Bonus por estar en ventana pico personal:
    peakWindowBonus: -12,
    peakEdgeBonus: -6,
    // Día de semana vs promedio: ±4 por sesión de diferencia, cap ±12.
    dayDensityMultiplier: -4,
    dayDensityCap: 12,
    // Fallback heurístico si hay <14 sesiones de historia:
    mondayPenalty: 8,
    fridayPenalty: 5,
    // Cada sesión ya hecha hoy reduce carga:
    perSessionTodayBonus: -10,
    // Mood reciente:
    lowMoodPenalty: 15,           // mood ≤ 2
    highMoodBonus: -10,           // mood ≥ 4
    // Sleep debt (Lim & Dinges 2010, Psychol Bull 136:375):
    sleepDebtPerHour: 6,          // +6 carga por cada hora bajo target
    sleepDebtCap: 20,
    sleepTargetDefault: 7.5,
    // Bands del load 0-100:
    bands: FREEZE({ low: 25, moderate: 45, high: 65 }),
    // Duración óptima recomendada según carga:
    optimalDuration: FREEZE({ low: 1.5, moderate: 1.0, high: 0.5 }),
  }),

  // ── Neural Momentum ───────────────────────────────────────────
  momentum: FREEZE({
    minHistory: 5,
    minPrevWindow: 3,
    deltaWeight: 2,
    streakWeight: 1.5,
    weeklyTotalWeight: 2,
    bands: FREEZE({ strong: 30, positive: 10, stable: -10, weak: -30 }),
  }),

  // ── Neural Variability ────────────────────────────────────────
  variability: FREEZE({
    minHistory: 3,
    windowSize: 10,
    bands: FREEZE({ stable: 5, normal: 15 }), // <5 estable, <15 normal, ≥15 ajuste
  }),

  // ── Coaching insights ─────────────────────────────────────────
  coaching: FREEZE({
    minHistoryDiversity: 10,
    diversityFlagThreshold: 2,    // ≤2 protocolos en últ. 10 → flag
    streakMilestones: FREEZE([7, 14, 30]),
    sensitivityFlagDelta: 0.3,
    sensitivityMinSessions: 2,
    retentionFlag: 60,
    consistencyFlag: 50,
    minHistoryConsistency: 14,
  }),

  // ── Streak chain analysis ─────────────────────────────────────
  streak: FREEZE({
    minHistory: 7,
    breakDayDiff: 1.5,            // > 1.5 días sin sesión = ruptura
    atRiskFraction: 0.8,          // 80% del avg break point activa atRisk
    fallbackBreakPoint: 7,
  }),

  // ── Cognitive Entropy ─────────────────────────────────────────
  entropy: FREEZE({
    minSamples: 2,
    speedBands: FREEZE({ alta: 400, media: 600, normal: 800 }),
    bands: FREEZE({ high: 60, mid: 30 }),
    sqrtMultiplier: 10,
    activationDeltaThreshold: 50,
  }),

  // ── Touch coherence ───────────────────────────────────────────
  coherence: FREEZE({
    minSamples: 2,
    consistencyWeight: 0.7,
    sampleCountBonus: 5,
    sampleCountCap: 30,
    bands: FREEZE({ high: 70, partial: 40 }),
  }),

  // ── Gaming detection ──────────────────────────────────────────
  gaming: FREEZE({
    minHistory: 5,
    windowSize: 10,
    zeroInteractionThreshold: 8,  // ≥8 de 10 sesiones con 0 = gaming
    qualityFlatLow: 30,           // todas las sesiones con bioQ<30 e iguales
    minSessionGapMs: 30000,       // <30s entre sesiones = gaming
  }),

  // ── Anti-gaming v2 (Sprint 45) ────────────────────────────────
  // Detector multi-signal con scoring [0..100]. Thresholds:
  //   <30 = clean, 30-59 = suspicious, ≥60 = likely-gaming.
  // Cada signal aporta puntos. Múltiples señales débiles compuestas
  // pueden alcanzar un veredicto fuerte (signal-fusion approach).
  gamingV2: FREEZE({
    minHistory: 5,
    windowSize: 10,
    // Veredicto thresholds
    suspiciousScore: 30,
    likelyScore: 60,

    // Signal A: variance de reaction times.
    // CV humano típico 0.15-0.40. CV<0.05 = robotic, >0.80 = random fake.
    rt: FREEZE({
      minSamples: 4,
      humanCvMin: 0.10,
      humanCvMax: 0.50,
      bothFlanksPenalty: 25, // penalty cuando CV está fuera de banda
    }),

    // Signal B: touch hold pattern.
    // Variance < ε y count ≥ 3 = todos iguales (instant tap o robotic hold).
    touchHold: FREEZE({
      minSamples: 3,
      uniformVarianceMax: 0.005, // sec²
      uniformPenalty: 20,
    }),

    // Signal C: time-of-day distribution.
    // Sessions a las 3am todos los días = sospechoso. Calculamos la
    // entropía de la distribución horaria; humanos tienen entropía
    // baja-moderada (concentración en pocas horas), bots tienen alta
    // (uniforme) o muy baja (siempre exactamente la misma hora).
    timeOfDay: FREEZE({
      minSessions: 8,
      lowEntropyMax: 0.5,    // todas a la misma hora ≤0.5 nats
      highEntropyMin: 2.5,   // uniforme ≈ ln(24)=3.18 nats; >2.5 muy uniforme
      lowEntropyPenalty: 15,
      highEntropyPenalty: 10,
      // Plausibility window: sessions entre 4am-2am del día siguiente.
      implausibleHourPenalty: 5, // por sesión en horario implausible
      implausibleHourStart: 2,
      implausibleHourEnd: 4,     // 02-04 = madrugada implausible
    }),

    // Signal D: bioQ distribution.
    // Real users tienen bell-curve. Bot/gaming: uniforme, bimodal o
    // con varianza muy baja sin estar en el rango bueno.
    bioQ: FREEZE({
      minSamples: 5,
      lowVarianceMax: 50,     // varianza ≤50 con quality < 50 = sospechoso
      lowVariancePenalty: 15,
    }),

    // Signal E: session duration variance.
    // Real: variabilidad por interrupciones, abandono, completion parcial.
    // Bots: completan exactamente el mínimo del protocolo.
    duration: FREEZE({
      minSamples: 5,
      uniformVarianceMax: 9, // sec²; ~3s de stdev
      uniformPenalty: 15,
    }),
  }),

  // ── Recovery Index ────────────────────────────────────────────
  recovery: FREEZE({
    minMoodLog: 4,
    minWithPre: 2,
    minHoursBetween: 0.5,
    maxHoursBetween: 48,
    bands: FREEZE({ excellent: 80, moderate: 60 }),
  }),

  // ── Session completion gain ───────────────────────────────────
  // vCores y métricas que se actualizan al cerrar una sesión.
  sessionGain: FREEZE({
    historyMaxLength: 200,        // anillo: solo guardamos últimas 200
    cohBoostMin: 0,
    cohBoostMax: 8,
    cohBoostBase: 2,
    cohBoostMultiplier: 3,        // avgDelta * 3 + 2
    cohDecayThreshold: 3,         // ≥3 deltas no positivas → decay
    cohDecayValue: -3,

    // Recálculo absoluto cuando hay ≥3 muestras:
    minDeltasForRecalc: 3,
    coherenceBaseRecalc: 50,
    coherenceDeltaMultiplier: 15,
    coherenceSessionMultiplier: 2,

    // Resilience desde consistencia + streak:
    resilienceBase: 40,
    consistencyMultiplier: 30,
    streakMultiplier: 0.5,
    streakCap: 30,

    // Capacity desde diversidad + experiencia:
    capacityBase: 30,
    diversityMaxProtocols: 14,    // total protocolos hasta capacidad máxima
    diversityMaxBonus: 30,
    experienceSqrtMultiplier: 3,
    experienceMaxBonus: 30,

    // Min/max para cualquier métrica:
    metricMin: 20,
    metricMax: 100,

    // Quality multiplier para vCores:
    qualityMultipliers: FREEZE({ alta: 1.5, media: 1.0, baja: 0.5, ligera: 0.4, inválida: 0.2 }),

    // Partial session detection:
    partialCompletenessThreshold: 0.85,
    partialHiddenSecRatio: 0.3,
    partialQualityCap: 40,
    invalidQualityCap: 20,

    // vCores formula:
    vCoreBase: 5,
    vCoreCohMultiplier: 1.5,
    vCoreConsistencyMultiplier: 5,
    vCoreDiversityMultiplier: 0.5,
    vCoreMin: 3,
  }),

  // ── Engine health evaluation (Sprint 40) ──────────────────────
  // Constantes para evaluateEngineHealth — la introspección del motor.
  health: FREEZE({
    // Una predicción es "stale" si no se evaluó vs outcome real
    // dentro de este número de horas. Si nunca, queda en "uncertain".
    staleHoursThreshold: 24 * 14, // 14 días
    // Cold-start: <5 sesiones; learning: 5-19; personalized: ≥20.
    coldStartSessions: 5,
    learningSessions: 20,
    // Tolerancia para considerar una predicción "acertada":
    // |predicted - observed| < tolerance → hit.
    predictionHitTolerance: 0.75, // ±0.75 puntos de mood
    // Mínimo de pares (predicted, observed) para reportar accuracy.
    minPredictionPairs: 3,
    // Personalización: si la recomendación coincide con la del baseline
    // circadiano-only ≥ X% del tiempo, la personalización es débil.
    personalizationWeakThreshold: 0.85,
  }),

  // ── Staleness detection + recalibration (Sprint 42) ───────────
  // Cuando un usuario vuelve después de varios días sin actividad,
  // sus patrones pueden haber driftado. Detectamos el gap y reducimos
  // confianza en datos personales, reactivando el cold-start prior.
  staleness: FREEZE({
    // Ventanas de gap (días) y multiplicador de confianza en datos
    // personales. 1.0 = full trust, 0.0 = treat as cold-start.
    windows: FREEZE([
      { maxDays: 7,  level: "fresh",     dataConfidence: 1.0,  recalibrate: false },
      { maxDays: 14, level: "active",    dataConfidence: 0.85, recalibrate: false },
      { maxDays: 30, level: "cooling",   dataConfidence: 0.55, recalibrate: "soft" },
      { maxDays: 60, level: "stale",     dataConfidence: 0.25, recalibrate: "hard" },
      { maxDays: Infinity, level: "abandoned", dataConfidence: 0.05, recalibrate: "hard" },
    ]),
    // Decay del peso de muestras de moodLog según antigüedad.
    // Half-life en días: una muestra vale 50% a los `decayHalfLifeDays` días.
    decayHalfLifeDays: 21,
    // Decay floor: ninguna muestra pesa menos que este mínimo
    // (evita olvido completo y respeta historial).
    decayMinWeight: 0.10,
  }),
});

/**
 * Helper para acceder a un path del config con fallback seguro.
 * Útil en tests + experimentación. NO muta el config.
 *
 * @example
 *   getConfig("burnout.riskThresholds.critical") === 70
 */
export function getConfig(path) {
  return path.split(".").reduce((acc, k) => acc?.[k], NEURAL_CONFIG);
}
