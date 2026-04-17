/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — EVIDENCE REGISTRY
   Peer-reviewed citations per protocol family
   ───────────────────────────────────────────────────────────────
   Every claim traces to published research. Effect sizes stated
   where available. Null/limited evidence flagged transparently.
   ═══════════════════════════════════════════════════════════════ */

/**
 * @typedef {Object} EvidenceCard
 * @property {string} id
 * @property {string} title
 * @property {string} mechanism - what the protocol is doing
 * @property {Array<{authors, year, title, journal, n, effect, doi?}>} studies
 * @property {string} expect - realistic short-term effect
 * @property {string} limitation - honest caveat
 * @property {"high"|"moderate"|"limited"} evidenceLevel
 */

export const EVIDENCE = {
  physiological_sigh: {
    id: "physiological_sigh",
    title: "Suspiro fisiológico",
    mechanism: "Doble inhalación nasal + exhalación bucal prolongada re-infla alvéolos colapsados, reduce CO₂ circulante y activa el nervio vago vía estiramiento pulmonar.",
    studies: [
      {
        authors: "Balban MY, Neri E, Kogon MM, et al.",
        year: 2023,
        title: "Brief structured respiration practices enhance mood and reduce physiological arousal",
        journal: "Cell Reports Medicine, 4(1):100895",
        n: 114,
        effect: "Superó a mindfulness en reducción de ansiedad estado (d≈0.45). Mejora de afecto positivo y reducción de frecuencia respiratoria de reposo tras 28 días × 5 min/día.",
        doi: "10.1016/j.xcrm.2022.100895",
      },
      {
        authors: "Vlemincx E, Abelson JL, Lehrer PM, et al.",
        year: 2013,
        title: "Respiratory variability and sighing: a psychophysiological reset mechanism",
        journal: "Biological Psychology, 93(1):24-32",
        effect: "Los suspiros espontáneos restauran la variabilidad respiratoria durante estrés.",
      },
    ],
    expect: "Reducción notable de activación en 60–90 segundos. Útil como botón de pánico agudo.",
    limitation: "Efectos a largo plazo dependen de práctica diaria sostenida (≥2 semanas).",
    evidenceLevel: "high",
  },

  resonance_breathing: {
    id: "resonance_breathing",
    title: "Respiración a frecuencia de resonancia",
    mechanism: "A ~5.5–6 rpm el barorreflejo entra en resonancia con el ritmo respiratorio, maximizando amplitud de HRV y ganancia baroreflectora.",
    studies: [
      {
        authors: "Lehrer P, Gevirtz R",
        year: 2014,
        title: "Heart rate variability biofeedback: how and why does it work?",
        journal: "Frontiers in Psychology, 5:756",
        effect: "Incremento de amplitud HRV 2-3×. Mejora sostenida de baroreflex gain tras 4 semanas.",
        doi: "10.3389/fpsyg.2014.00756",
      },
      {
        authors: "Steffen PR, Austin T, DeBarros A, Brown T",
        year: 2017,
        title: "The impact of resonance frequency breathing on measures of HRV, blood pressure, and mood",
        journal: "Frontiers in Public Health, 5:222",
        n: 30,
        effect: "20 min de RFB: reducción de presión sistólica 6 mmHg vs control, mejora afecto.",
        doi: "10.3389/fpubh.2017.00222",
      },
      {
        authors: "Goessl VC, Curtiss JE, Hofmann SG",
        year: 2017,
        title: "The effect of heart rate variability biofeedback training on stress and anxiety: a meta-analysis",
        journal: "Psychological Medicine, 47(15):2578-2586",
        n: 1868,
        effect: "Meta-análisis: d=0.83 en reducción de síntomas ansiedad-estrés.",
        doi: "10.1017/S0033291717001003",
      },
    ],
    expect: "Con práctica de 20 min/día × 4–8 semanas: mejora medible de HRV en reposo y disminución de reactividad al estrés.",
    limitation: "Requiere encontrar la frecuencia de resonancia individual (test 4.5–7 rpm).",
    evidenceLevel: "high",
  },

  box_breathing: {
    id: "box_breathing",
    title: "Respiración cuadrada (box)",
    mechanism: "Ciclo simétrico 4-4-4-4 estabiliza CO₂ arterial y facilita tono parasimpático sin forzar exhalación.",
    studies: [
      {
        authors: "Röttger S, Theobald DA, Abendroth J, Jacobsen T",
        year: 2021,
        title: "The effectiveness of combat tactical breathing on emotion regulation",
        journal: "Military Psychology, 33(3):187-196",
        effect: "Reducción de ansiedad estado en contexto de alta demanda. Adoptado por Navy SEALs.",
      },
    ],
    expect: "Calma rápida y re-foco en 2-3 minutos. Técnica generalizable, baja barrera.",
    limitation: "Menos potente que coherencia cardíaca (1:1.3) para ganancia de HRV.",
    evidenceLevel: "moderate",
  },

  nsdr: {
    id: "nsdr",
    title: "NSDR / Yoga Nidra (descanso profundo no-sueño)",
    mechanism: "Protocolo guiado de consciencia corporal que induce estado hipnagógico; reduce actividad beta cortical y promueve liberación de dopamina estriatal.",
    studies: [
      {
        authors: "Kjaer TW, Bertelsen C, Piccini P, et al.",
        year: 2002,
        title: "Increased dopamine tone during meditation-induced change of consciousness",
        journal: "Cognitive Brain Research, 13(2):255-259",
        n: 8,
        effect: "Incremento de dopamina endógena 65% durante yoga nidra (PET [11C]raclopride).",
        doi: "10.1016/s0926-6410(01)00106-9",
      },
      {
        authors: "Datta K, Tripathi M, Mallick HN",
        year: 2017,
        title: "Yoga Nidra: An innovative approach for management of chronic insomnia",
        journal: "Sleep Science, 10(1):60-63",
        effect: "Mejora autorreportada en calidad del sueño en adultos con insomnio crónico.",
      },
    ],
    expect: "10–20 min: sensación subjetiva de recuperación comparable a siesta corta, sin inercia del sueño.",
    limitation: "Evidencia neuroimagen basada en muestras pequeñas (N=8). Literatura en expansión.",
    evidenceLevel: "moderate",
  },

  morning_light: {
    id: "morning_light",
    title: "Exposición a luz matutina",
    mechanism: "Luz >1000 lux en los primeros 60 min post-despertar ancla el ritmo circadiano vía células ganglionares ipRGC → núcleo supraquiasmático.",
    studies: [
      {
        authors: "Münch M, Wirz-Justice A, Brown SA, et al.",
        year: 2020,
        title: "The role of daylight for humans: gaps in current knowledge",
        journal: "Clocks & Sleep, 2(1):61-85",
        effect: "Luz de día adelanta DLMO, mejora alerta matutina y consolidación de sueño nocturno.",
      },
      {
        authors: "Blume C, Garbazza C, Spitschan M",
        year: 2019,
        title: "Effects of light on human circadian rhythms, sleep and mood",
        journal: "Somnologie, 23(3):147-156",
        effect: "Revisión: 30 min de luz brillante matutina mejora síntomas depresivos estacionales (d≈0.7).",
      },
    ],
    expect: "Mejor alerta matutina en 3–5 días. Consolidación de sueño nocturno en 7–14 días.",
    limitation: "Requiere exposición real >10,000 lux (exterior) o lámpara SAD calibrada (≥2500 lux).",
    evidenceLevel: "high",
  },

  cold_exposure: {
    id: "cold_exposure",
    title: "Exposición al frío (ducha/inmersión)",
    mechanism: "Activación del sistema simpático y liberación masiva de noradrenalina; adaptación hormética.",
    studies: [
      {
        authors: "Šrámek P, Šimečková M, Janský L, et al.",
        year: 2000,
        title: "Human physiological responses to immersion into water of different temperatures",
        journal: "European Journal of Applied Physiology, 81(5):436-442",
        effect: "Inmersión a 14°C elevó noradrenalina plasmática 530% y dopamina 250%.",
      },
      {
        authors: "Buijze GA, Sierevelt IN, van der Heijden BC, et al.",
        year: 2016,
        title: "The Effect of Cold Showering on Health and Work: A Randomized Controlled Trial",
        journal: "PLoS ONE, 11(9):e0161749",
        n: 3018,
        effect: "30-90s ducha fría diaria × 30d: reducción 29% en días perdidos por enfermedad.",
        doi: "10.1371/journal.pone.0161749",
      },
    ],
    expect: "Alerta aguda y mejora de estado de ánimo 2–4 horas post-exposición.",
    limitation: "Contraindicado en cardiopatía, embarazo y arritmias. Consultar médico.",
    evidenceLevel: "moderate",
  },

  sauna: {
    id: "sauna",
    title: "Exposición al calor (sauna)",
    mechanism: "Estrés térmico activa heat-shock proteins, mejora función endotelial y respuesta cardiovascular.",
    studies: [
      {
        authors: "Laukkanen T, Khan H, Zaccardi F, Laukkanen JA",
        year: 2015,
        title: "Association between sauna bathing and fatal cardiovascular and all-cause mortality events",
        journal: "JAMA Internal Medicine, 175(4):542-548",
        n: 2315,
        effect: "≥4 sesiones/semana vs 1/semana: reducción 50% de mortalidad CV (HR 0.50, IC 0.31-0.79).",
        doi: "10.1001/jamainternmed.2014.8187",
      },
    ],
    expect: "Efectos cardioprotectores con dosis sostenida ≥20 min × 4/semana durante años.",
    limitation: "Beneficios agudos menos estudiados. Hidratación y aclimatación progresiva son críticas.",
    evidenceLevel: "moderate",
  },

  meditation: {
    id: "meditation",
    title: "Meditación de atención focalizada",
    mechanism: "Entrenamiento repetido fortalece red de control ejecutivo (corteza prefrontal dorsolateral) y debilita red modo-default.",
    studies: [
      {
        authors: "Goyal M, Singh S, Sibinga EMS, et al.",
        year: 2014,
        title: "Meditation programs for psychological stress and well-being: a systematic review and meta-analysis",
        journal: "JAMA Internal Medicine, 174(3):357-368",
        n: 3515,
        effect: "Meta-análisis: reducción de ansiedad d=0.38, depresión d=0.30. Efectos pequeños-moderados.",
        doi: "10.1001/jamainternmed.2013.13018",
      },
    ],
    expect: "Beneficios acumulativos tras 8 semanas (p.ej. protocolo MBSR). No es solución aguda.",
    limitation: "Evidencia más sólida para ansiedad/depresión; efectos sobre atención más modestos.",
    evidenceLevel: "high",
  },

  affect_labeling: {
    id: "affect_labeling",
    title: "Etiquetado emocional (\"name it to tame it\")",
    mechanism: "Nombrar una emoción activa corteza prefrontal ventrolateral derecha e inhibe amígdala vía vía top-down.",
    studies: [
      {
        authors: "Lieberman MD, Eisenberger NI, Crockett MJ, et al.",
        year: 2007,
        title: "Putting feelings into words: affect labeling disrupts amygdala activity",
        journal: "Psychological Science, 18(5):421-428",
        effect: "Etiquetado redujo activación amigdalar 30-40% medida por fMRI.",
        doi: "10.1111/j.1467-9280.2007.01916.x",
      },
    ],
    expect: "Reducción inmediata de intensidad emocional percibida.",
    limitation: "Requiere vocabulario emocional granular; menos efectivo con términos vagos.",
    evidenceLevel: "high",
  },

  binaural_beats: {
    id: "binaural_beats",
    title: "Tonos binaurales",
    mechanism: "Frecuencias dicóticas generan frecuencia fantasma en tronco cerebral; hipotéticamente entrena EEG.",
    studies: [
      {
        authors: "Garcia-Argibay M, Santed MA, Reales JM",
        year: 2019,
        title: "Efficacy of binaural auditory beats in cognition, anxiety, and pain perception",
        journal: "Psychological Research, 83:357-372",
        effect: "Meta-análisis: efecto pequeño sobre memoria (d=0.27), inconsistente en ansiedad.",
      },
    ],
    expect: "Efectos subjetivos variables. No se puede afirmar un efecto cognitivo robusto.",
    limitation: "Literatura heterogénea; muchos estudios con metodología débil. Tratar como asistencia ambiental, no intervención.",
    evidenceLevel: "limited",
  },
};

/**
 * Get evidence card by key.
 */
export function getEvidence(id) {
  return EVIDENCE[id] || null;
}

/**
 * All available evidence IDs.
 */
export function evidenceIds() {
  return Object.keys(EVIDENCE);
}

/**
 * Map a protocol name/intent to its primary evidence card.
 * Fallback order: explicit map → intent match → generic breathing.
 */
export function evidenceForProtocol(proto) {
  if (!proto) return null;
  const name = (proto.n || "").toLowerCase();
  if (name.includes("reinicio parasimp") || name.includes("box")) return EVIDENCE.box_breathing;
  if (name.includes("coherencia") || name.includes("resonan")) return EVIDENCE.resonance_breathing;
  if (name.includes("suspiro") || name.includes("sigh")) return EVIDENCE.physiological_sigh;
  if (name.includes("nsdr") || name.includes("nidra")) return EVIDENCE.nsdr;
  if (name.includes("etiquet") || name.includes("affect")) return EVIDENCE.affect_labeling;
  if (proto.int === "enfoque") return EVIDENCE.meditation;
  if (proto.int === "calma") return EVIDENCE.resonance_breathing;
  return EVIDENCE.box_breathing;
}
