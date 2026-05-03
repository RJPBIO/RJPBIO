/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — PROTOCOLOS NEUROLÓGICOS
   18 protocolos con base neurocientífica documentada.
   IDs 13 y 14 reservados (OMEGA/OMNIA eliminados Phase4-SP1).
   ═══════════════════════════════════════════════════════════════ */

// Sprint 70 — useCase categoriza protocolos por contexto de uso:
//   "active"   → recomendación diaria default (60-120s, sin extremos)
//   "training" → práctica sostenida 10 min, NO para crisis ni recomendación
//                espontánea. Usado dentro de programas o cuando el user lo
//                elige explícitamente.
//   "crisis"   → protocolos para crisis aguda (#18-20). NO se recomiendan
//                automáticamente — el user los invoca desde un acceso
//                explícito. Excluidos del bandit y del daily ignition.
// Ausencia del campo = "active" (default implícito).
export function getUseCase(p) {
  return p?.useCase || "active";
}

/* ═══════════════════════════════════════════════════════════════
   EXTENDED ACT SCHEMA — Phase 4 SP1
   Tipos JSDoc que SP2-SP8 usarán para construir actos tipados con
   validación, UI primitive y media config explícitos. Los actos
   legacy (solo from/to/text) siguen siendo válidos: inferActDefaults()
   los upgrades on-the-fly para que el ProtocolPlayer (SP3) consuma
   un schema homogéneo durante la migración progresiva.
   ═══════════════════════════════════════════════════════════════ */

/**
 * @typedef {"breath" | "motor_bilateral" | "motor_isometric" | "motor_release" | "motor_shake" |
 *           "oculomotor" | "visual_focus" | "visual_panoramic" | "visual_dual_focus" |
 *           "interoception" | "proprioception" | "somatic_tactile" |
 *           "vocalization" | "auditory_internal" |
 *           "vagal_facial_cold" | "vagal_chest_percussion" | "vagal_breath_extended" |
 *           "cognitive_anchor" | "cognitive_visualization" | "cognitive_filter" |
 *           "commitment_motor" | "sensory_grounding" | "transition" |
 *           "cognitive_segmentation" | "vocal_resonance" | "power_posture" |
 *           "walking_meditation" | "cardiac_interoception"} ActType
 *
 * Phase 5 SP1 añadió 5 tipos para protocolos #21-#25:
 *  - cognitive_segmentation → #21 Threshold Crossing (event boundary effect)
 *  - vocal_resonance        → #22 Vagal Hum (humming sostenido + NO nasal)
 *  - power_posture          → #23 Power Pose Activation (postura + isometric)
 *  - walking_meditation     → #24 Bilateral Walking
 *  - cardiac_interoception  → #25 Cardiac Coherence Pulse Match
 *
 * Phase 5 SP1 también deja huérfanos (sin protocolo activo, retenidos por
 * compatibilidad de switcher / storybook):
 *  - vagal_facial_cold (era #19; retirado en refactor sin agua)
 */

/**
 * @typedef {object} ActDuration
 * @property {number} min_ms - mínimo realista (humano rápido)
 * @property {number} target_ms - target promedio
 * @property {number} max_ms - máximo antes de timeout
 */

/**
 * @typedef {object} ActValidation
 * @property {"min_duration" | "breath_cycles" | "tap_count" | "hold_press" |
 *            "chip_selection" | "eye_movement" | "ppg_breath_match" |
 *            "visual_completion" | "no_validation" |
 *            "pulse_count" | "pace_count"} kind
 * @property {number} [min_ms]
 * @property {number} [min_cycles]
 * @property {number} [cycle_min_ms]
 * @property {number} [min_taps]
 * @property {boolean} [bilateral]
 * @property {number} [min_hold_ms]
 * @property {boolean} [required]
 * @property {number} [min_saccades]
 * @property {number} [tolerance_pct]
 * @property {string[]} [required_path]
 * @property {number} [target_pulses]
 * @property {number} [target_steps]
 * @property {string} [reason]
 *
 * Phase 5 SP1 añadió:
 *  - pulse_count: #25 user cuenta latidos en intervalo (target_pulses + tolerance_pct).
 *  - pace_count:  #24 user da N pasos (target_steps).
 * La lógica runtime de evaluación se implementa en SP2 cuando lleguen las
 * primitivas que emiten las señales (pulse_match_visual, walking_pace_indicator).
 */

/**
 * @typedef {object} ActUIConfig
 * @property {"breath_orb" | "bilateral_tap_targets" | "ocular_dots" |
 *            "ocular_horizontal_metronome" | "visual_panoramic_prompt" |
 *            "dual_focus_targets" | "body_silhouette_highlight" | "posture_visual" |
 *            "isometric_grip_prompt" | "chest_percussion_prompt" | "facial_cold_prompt" |
 *            "shake_hands_prompt" | "chip_selector" | "hold_press_button" |
 *            "text_emphasis_voice" | "silence_cyan_minimal" | "object_anchor_prompt" |
 *            "vocal_with_haptic" | "transition_dots" |
 *            "doorway_visualizer" | "vocal_resonance_visual" | "power_pose_visual" |
 *            "walking_pace_indicator" | "pulse_match_visual"} primitive
 * @property {object} [props]
 *
 * Phase 5 SP1 reservó 5 primitive enum entries para componentes que SP2
 * implementará en src/components/protocol/v2/primitives/:
 *  - doorway_visualizer       → #21 Threshold Crossing
 *  - vocal_resonance_visual   → #22 Vagal Hum
 *  - power_pose_visual        → #23 Power Pose Activation
 *  - walking_pace_indicator   → #24 Bilateral Walking
 *  - pulse_match_visual       → #25 Cardiac Coherence Pulse Match
 *
 * Hasta que SP2 los construya, cualquier acto que las referencie cae al
 * fallback `text_emphasis_voice` en PrimitiveSwitcher (degrada limpio).
 */

/**
 * @typedef {object} ActMediaConfig
 * @property {object} [voice]
 * @property {object} [breath_ticks]
 * @property {object} [binaural]
 * @property {object} [soundscape]
 * @property {object} [haptic]
 * @property {object} [cue]
 * @property {object} [countdown]
 * @property {object} [signature]
 * @property {boolean} [silent]
 */

/**
 * @typedef {object} IExecAct
 * @property {number} from
 * @property {number} to
 * @property {string} text
 * @property {ActType} [type]
 * @property {string} [mechanism]
 * @property {ActDuration} [duration]
 * @property {ActValidation} [validate]
 * @property {ActUIConfig} [ui]
 * @property {ActMediaConfig} [media]
 * @property {object} [optional_capture]
 */

/**
 * Upgrade un acto legacy (only from/to/text) a un acto extendido con
 * defaults seguros. Idempotente: si el acto ya tiene los campos, los
 * respeta. Inferencia derivada de la fase y del protocolo padre.
 *
 * @param {IExecAct} act
 * @param {object} phase
 * @param {object} protocol
 * @returns {IExecAct}
 */
export function inferActDefaults(act, phase, protocol) {
  const result = { ...act };

  if (!result.type && phase?.ic) {
    if (phase.ic === "breath") result.type = "breath";
    else if (phase.ic === "body") result.type = "proprioception";
    else if (phase.ic === "mind") result.type = "cognitive_anchor";
    else if (phase.ic === "focus") result.type = "visual_focus";
  }

  if (!result.duration) {
    const sec = (result.to ?? 0) - (result.from ?? 0);
    result.duration = {
      min_ms: Math.floor(sec * 1000 * 0.7),
      target_ms: sec * 1000,
      max_ms: Math.ceil(sec * 1000 * 1.3),
    };
  }

  if (!result.validate) {
    const useCase = getUseCase(protocol);
    if (useCase === "crisis") {
      result.validate = { kind: "no_validation", reason: "crisis_no_pressure" };
    } else if (result.type === "breath" && phase?.br) {
      const br = phase.br;
      const cycleMs = (br.in + (br.h1 || 0) + br.ex + (br.h2 || 0)) * 1000;
      const sec = (result.to ?? 0) - (result.from ?? 0);
      result.validate = {
        kind: "breath_cycles",
        min_cycles: Math.max(1, Math.floor(sec / Math.max(0.001, cycleMs / 1000)) - 1),
        cycle_min_ms: Math.floor(cycleMs * 0.85),
      };
    } else {
      const sec = (result.to ?? 0) - (result.from ?? 0);
      result.validate = { kind: "min_duration", min_ms: Math.floor(sec * 1000 * 0.7) };
    }
  }

  if (!result.ui) {
    if (result.type === "breath") result.ui = { primitive: "breath_orb" };
    else result.ui = { primitive: "text_emphasis_voice" };
  }

  if (!result.media) {
    const useCase = getUseCase(protocol);
    result.media = {
      voice: { enabled_default: useCase === "crisis" },
      breath_ticks: { enabled: result.type === "breath" && !!phase?.br, auto_sync: true },
      binaural: {
        action: phase?.s === 0 ? "start" : "continue",
        type: protocol?.int,
      },
    };
  }

  return result;
}

export const P = [
  /* ═══ #1 REINICIO PARASIMPÁTICO ═══
     Phase 4 SP4 — coreografía multi-acto migrada.
     5 actos: 1 breath + 3 cognitivos sub-divididos + 1 commitment_motor. */
  {id:1,n:"Reinicio Parasimpático",ct:"Reset",d:120,sb:"Restaura función ejecutiva",tg:"R1",cl:"#059669",int:"calma",dif:1,
  ph:[
    {
      l:"Entrada Vagal",r:"0–30s",s:0,e:30,
      k:"Respira box: 4 dentro. 4 sostén. 4 fuera. 4 vacío.",
      i:"Cierra los ojos suavemente. Inhala 4s. Mantén 4s. Exhala 4s. Sostén vacío 4s. Repite un ciclo más.",
      iExec:[
        {
          from:0,to:30,
          text:"Cierra los ojos. Respira box: 4 dentro, 4 sostén, 4 fuera, 4 vacío. Dos ciclos completos.",
          type:"breath",
          mechanism:"Box 4-4-4-4 activa complejo vagal ventral en <20s (Porges 2011)",
          duration:{min_ms:28000,target_ms:32000,max_ms:38000},
          validate:{kind:"breath_cycles",min_cycles:2,cycle_min_ms:14000},
          ui:{primitive:"breath_orb",props:{cadence:{in:4,h1:4,ex:4,h2:4}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Box breathing 4-4-4-4 activa complejo vagal ventral (Porges 2011, polyvagal theory)",
      ic:"breath",br:{in:4,h1:4,ex:4,h2:4}
    },
    {
      l:"Descarga Cognitiva",r:"30–90s",s:30,e:90,
      k:"Identifica el peso. ¿Depende de ti? Actúa o suelta.",
      i:"Identifica el pensamiento que más pesa. Pregúntate: ¿depende de mí?",
      iExec:[
        {
          from:0,to:15,
          text:"Identifica el peso.",
          type:"cognitive_anchor",
          mechanism:"Externalizar pensamiento dominante reduce rumiación (córtex cingulado anterior)",
          duration:{min_ms:12000,target_ms:15000,max_ms:20000},
          validate:{kind:"min_duration",min_ms:12000},
          ui:{primitive:"text_emphasis_voice",props:{text:"Identifica el peso.",subtext:"El pensamiento que más pesa ahora."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        },
        {
          from:15,to:40,
          text:"¿Depende de ti?",
          type:"cognitive_anchor",
          mechanism:"Decisión binaria interrumpe rumiación; activa corteza prefrontal dorsolateral",
          duration:{min_ms:18000,target_ms:22000,max_ms:28000},
          validate:{kind:"chip_selection",required:true},
          ui:{
            primitive:"chip_selector",
            props:{
              question:"¿Depende de ti?",
              chips:[{id:"yes",label:"Sí depende"},{id:"no",label:"No depende"}],
              min_thinking_ms:5000
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true}
          }
        },
        {
          from:40,to:60,
          text:"Si sí depende: una acción concreta para los próximos 30 minutos. Si no depende: 'lo suelto'.",
          type:"cognitive_anchor",
          mechanism:"Compromiso o liberación cognitiva consolida la decisión binaria",
          duration:{min_ms:15000,target_ms:18000,max_ms:25000},
          validate:{kind:"min_duration",min_ms:15000},
          ui:{primitive:"text_emphasis_voice",props:{text:"Una acción para 30 minutos. O suéltalo 24 horas.",subtext:"Confía en tu primera respuesta."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Affect labeling reduce activación amigdalar (Lieberman 2007 UCLA)",
      ic:"mind",br:{in:4,h1:4,ex:4,h2:4}
    },
    {
      l:"Dirección y Cierre",r:"90–120s",s:90,e:120,
      k:"Una acción clara. Visualízala. Abre con dirección.",
      i:"Cierra los ojos. Pregunta: ¿cuál es la única acción que hace todo más fácil? Visualízala.",
      iExec:[
        {
          from:0,to:30,
          text:"¿Cuál es la única acción que hace todo más fácil? Visualízala. Mantén las palmas apretadas mientras imaginas.",
          type:"commitment_motor",
          mechanism:"Visualización + anclaje motor activa memoria procedimental + dopamina direccional (Bryan, Adams, Monin 2013)",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Esa es la acción."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Visualización + commitment motor duplica probabilidad de seguimiento (Bryan, Adams, Monin 2013)",
      ic:"body",br:{in:4,h1:4,ex:4,h2:4}
    }
  ]},

  /* ═══ #2 ACTIVACIÓN COGNITIVA ═══
     Phase 4 SP4 — coreografía multi-acto migrada.
     5 actos: 1 breath + 3 cognitivos sub-divididos + 1 commitment_motor. */
  {id:2,n:"Activación Cognitiva",ct:"Activación",d:120,sb:"Enfoque y autorregulación",tg:"AC",cl:"#22D3EE",int:"enfoque",dif:1,
  ph:[
    {
      l:"Coherencia Cardíaca",r:"0–30s",s:0,e:30,
      k:"Inhala 6. Sostén 2. Exhala 8. Fluye.",
      i:"Cierra los ojos. Inhala 6 segundos. Mantén 2. Exhala 8. Casi 2 ciclos completos.",
      iExec:[
        {
          from:0,to:30,
          text:"Respira: 6 dentro, 2 sostén, 8 fuera. Casi dos ciclos completos.",
          type:"breath",
          mechanism:"Ratio 1:1.3 inhalación:exhalación maximiza HRV en 20-30s (HeartMath)",
          duration:{min_ms:28000,target_ms:32000,max_ms:36000},
          validate:{kind:"breath_cycles",min_cycles:2,cycle_min_ms:15000},
          ui:{primitive:"breath_orb",props:{cadence:{in:6,h1:2,ex:8,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"enfoque"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Coherencia cardíaca 6-2-8 maximiza HRV (HeartMath validated)",
      ic:"breath",br:{in:6,h1:2,ex:8,h2:0}
    },
    {
      l:"Etiquetado Emocional",r:"30–90s",s:30,e:90,
      k:"Nombra exactamente lo que sientes. Sin juzgar.",
      i:"Escanea tu cuerpo. Elige la palabra más precisa. Sostén.",
      iExec:[
        {
          from:0,to:25,
          text:"Escanea tu cuerpo. ¿Qué sientes exactamente?",
          type:"interoception",
          mechanism:"Body scan activa ínsula anterior, centro de interocepción (Khalsa 2018, Critchley 2013)",
          duration:{min_ms:20000,target_ms:25000,max_ms:30000},
          validate:{kind:"min_duration",min_ms:20000},
          ui:{
            primitive:"body_silhouette_highlight",
            props:{
              highlight_progression:["chest","shoulders","stomach","head","neck"],
              transition_ms:4000
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        },
        {
          from:25,to:50,
          text:"Elige la palabra más precisa.",
          type:"cognitive_anchor",
          mechanism:"Affect labeling reduce activación amigdalar 30-40% (Lieberman 2007 UCLA)",
          duration:{min_ms:18000,target_ms:22000,max_ms:28000},
          validate:{kind:"chip_selection",required:true},
          ui:{
            primitive:"chip_selector",
            props:{
              question:"¿Qué sientes exactamente?",
              chips:[
                {id:"frustration",label:"Frustración"},
                {id:"exhaustion",label:"Agotamiento"},
                {id:"uncertainty",label:"Incertidumbre"},
                {id:"anxiety",label:"Ansiedad"},
                {id:"anger",label:"Enojo"},
                {id:"sadness",label:"Tristeza"}
              ],
              min_thinking_ms:6000
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true}
          }
        },
        {
          from:50,to:60,
          text:"Quédate con la palabra. La intensidad baja.",
          type:"cognitive_anchor",
          mechanism:"Sostener nombramiento consolida reducción amigdalar",
          duration:{min_ms:8000,target_ms:10000,max_ms:14000},
          validate:{kind:"min_duration",min_ms:8000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Sostén."}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Affect labeling reduce activación amigdalar (Lieberman 2007); ínsula anterior interocepción (Khalsa 2018)",
      ic:"mind",br:{in:6,h1:2,ex:8,h2:0}
    },
    {
      l:"Visualización Dirigida",r:"90–120s",s:90,e:120,
      k:"Visualízate resolviendo. Hoy avanzo paso a paso.",
      i:"Visualízate en 2 horas con tu tarea principal completada. Postura serena.",
      iExec:[
        {
          from:0,to:30,
          text:"Visualízate en 2 horas con tu tarea principal completada. Postura serena. Mantén tu mano sobre la pantalla mientras imaginas.",
          type:"cognitive_visualization",
          mechanism:"Visualización prospectiva + anclaje táctil activa dopamina orientada a objetivos",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:6000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:6000,release_message:"Hoy avanzas, paso a paso."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Visualización + anclaje táctil activa dopamina direccional",
      ic:"body",br:{in:6,h1:2,ex:8,h2:0}
    }
  ]},

  /* ═══ #3 RESET EJECUTIVO ═══
     Phase 4 SP4 — coreografía multi-acto migrada.
     5 actos: 1 breath + 3 cognitivos sub-divididos + 1 commitment_motor. */
  {id:3,n:"Reset Ejecutivo",ct:"Reset",d:120,sb:"Para líderes bajo presión",tg:"RE",cl:"#8B5CF6",int:"reset",dif:1,
  ph:[
    {
      l:"Descarga Rápida",r:"0–30s",s:0,e:30,
      k:"Inhala corto. Exhala el doble de largo. Desinfla.",
      i:"Inhala 2s. Exhala 6s. Tres ciclos completos.",
      iExec:[
        {
          from:0,to:30,
          text:"Inhala 2 segundos. Exhala 6 segundos. Como desinflar un globo. Tres ciclos.",
          type:"breath",
          mechanism:"Ratio 1:3 inhalación:exhalación activa tono vagal parasimpático en <20s",
          duration:{min_ms:24000,target_ms:28000,max_ms:32000},
          validate:{kind:"breath_cycles",min_cycles:3,cycle_min_ms:7000},
          ui:{primitive:"breath_orb",props:{cadence:{in:2,h1:0,ex:6,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"reset"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Exhalación prolongada 1:3 activa parasimpático (<20s)",
      ic:"breath",br:{in:2,h1:0,ex:6,h2:0}
    },
    {
      l:"Filtro de Prioridad",r:"30–90s",s:30,e:90,
      k:"Tres tareas. Filtra. Solo queda una.",
      i:"Trae 3 tareas a la mente. Filtra: importante o solo urgente. Queda una.",
      iExec:[
        {
          from:0,to:18,
          text:"Trae 3 tareas urgentes a la mente. Las que más pesan.",
          type:"cognitive_anchor",
          mechanism:"Identificación de candidatos prepara filtro ejecutivo (corteza prefrontal dorsolateral)",
          duration:{min_ms:15000,target_ms:18000,max_ms:22000},
          validate:{kind:"min_duration",min_ms:15000},
          ui:{primitive:"text_emphasis_voice",props:{text:"Tres tareas urgentes.",subtext:"Las que más pesan."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        },
        {
          from:18,to:42,
          text:"Para cada una: ¿importante o solo urgente? ¿Eliminar? ¿Delegar? Confía en tu primera respuesta.",
          type:"cognitive_filter",
          mechanism:"Matriz Eisenhower reduce carga cognitiva ejecutiva",
          duration:{min_ms:20000,target_ms:24000,max_ms:30000},
          validate:{kind:"min_duration",min_ms:20000},
          ui:{primitive:"text_emphasis_voice",props:{text:"¿Importante o urgente?",subtext:"Eliminar. Delegar. Hacer."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true}
          }
        },
        {
          from:42,to:60,
          text:"Queda una.",
          type:"cognitive_anchor",
          mechanism:"Convergencia ejecutiva en single task",
          duration:{min_ms:12000,target_ms:15000,max_ms:20000},
          validate:{kind:"min_duration",min_ms:12000},
          ui:{primitive:"text_emphasis_voice",props:{text:"Queda una.",subtext:"Solo una."}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Filtro Eisenhower reduce carga cognitiva ejecutiva (corteza prefrontal dorsolateral)",
      ic:"mind",br:{in:2,h1:0,ex:6,h2:0}
    },
    {
      l:"Compromiso Motor",r:"90–120s",s:90,e:120,
      k:"Un puño cerrado. Una tarea. 60 minutos.",
      i:"Cierra el puño con firmeza al exhalar. 'Los próximos 60 minutos son para esto.'",
      iExec:[
        {
          from:0,to:30,
          text:"Cierra el puño con firmeza. 'Los próximos 60 minutos son para esto.' Mantén 5 segundos.",
          type:"commitment_motor",
          mechanism:"Compromiso motor + verbalización mental ancla decisión en memoria procedimental (Bryan, Adams, Monin 2013); duplica probabilidad de ejecución",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:5000,release_message:"60 minutos para esto."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"},
            signature:{kind:"checkpoint",fire_at:"end"}
          }
        }
      ],
      sc:"Compromiso motor + verbalización (Bryan, Adams, Monin 2013, JPSP)",
      ic:"body",br:{in:2,h1:0,ex:6,h2:0}
    }
  ]},

  /* ═══ #4 PULSE SHIFT ═══
     Phase 4 SP5 — coreografía multi-acto migrada (Tier 1B).
     6 actos: 1 motor_bilateral + 1 breath + 1 motor_release + 1 commitment_motor.
     Primer protocolo en usar BilateralTapTargets en flow real. */
  {id:4,n:"Pulse Shift",ct:"Activación",d:120,sb:"Reset neurocardíaco",tg:"PS",cl:"#F59E0B",int:"energia",dif:2,
  ph:[
    {
      l:"Activación Bilateral",r:"0–30s",s:0,e:30,
      k:"Tap alternado izq-der. Ritmo constante.",
      i:"Tap alternado izquierda y derecha siguiendo el highlight cyan. 60 taps por minuto, ritmo natural.",
      iExec:[
        {
          from:0,to:30,
          text:"Tap izquierda y derecha alternando. Sigue el highlight.",
          type:"motor_bilateral",
          mechanism:"Movimiento bilateral activa coordinación interhemisférica + coherencia atencional sostenida",
          duration:{min_ms:25000,target_ms:30000,max_ms:38000},
          validate:{kind:"tap_count",min_taps:24,bilateral:true},
          ui:{primitive:"bilateral_tap_targets",props:{pattern:"alternate",bpm:60,target_taps:30}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"energia"},
            haptic:{phase:"tap"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Activación bilateral coordinación interhemisférica + atención focal sostenida",
      ic:"body",br:null
    },
    {
      l:"Respiración Energizante",r:"30–75s",s:30,e:75,
      k:"Inhala rápido 3. Exhala fuerte 3. Bombeo.",
      i:"Inhala 3s con vigor. Exhala 3s soltando. Cinco ciclos.",
      iExec:[
        {
          from:0,to:35,
          text:"Inhala 3s con vigor. Exhala 3s soltando. Cinco ciclos.",
          type:"breath",
          mechanism:"Respiración 3:3 simétrica activa simpático moderado + oxigenación rápida",
          duration:{min_ms:30000,target_ms:35000,max_ms:42000},
          validate:{kind:"breath_cycles",min_cycles:5,cycle_min_ms:5000},
          ui:{primitive:"breath_orb",props:{cadence:{in:3,h1:0,ex:3,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        },
        {
          from:35,to:45,
          text:"Sacude las manos vigorosamente. Como si tuvieras agua y la tiraras.",
          type:"motor_release",
          mechanism:"Movimiento periférico vigoroso libera tensión muscular + activa flujo sanguíneo distal",
          duration:{min_ms:8000,target_ms:10000,max_ms:14000},
          validate:{kind:"min_duration",min_ms:8000},
          ui:{primitive:"shake_hands_prompt",props:{duration_ms:10000}},
          media:{
            breath_ticks:{enabled:false},
            haptic:{custom:"shake_pattern"}
          }
        }
      ],
      sc:"Respiración 3:3 + motor release activa simpático moderado + circulación periférica",
      ic:"body",br:{in:3,h1:0,ex:3,h2:0}
    },
    {
      l:"Anclaje Energético",r:"75–120s",s:75,e:120,
      k:"Postura erguida. Mirada al frente. Listo.",
      i:"Postura erguida, hombros atrás, mirada al frente. Mantén la presión de palmas mientras visualizas tu siguiente bloque de trabajo con energía.",
      iExec:[
        {
          from:0,to:45,
          text:"Postura erguida. Hombros atrás. Mirada al frente. Mantén las palmas presionadas mientras visualizas tu siguiente bloque con energía.",
          type:"commitment_motor",
          mechanism:"Postura erguida + commitment motor consolida estado activado (Carney, Cuddy, Yap 2010)",
          duration:{min_ms:30000,target_ms:35000,max_ms:45000},
          validate:{kind:"hold_press",min_hold_ms:6000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:6000,release_message:"Listo para el siguiente bloque."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Postura erguida + commitment motor (Carney, Cuddy, Yap 2010, 'Power posing')",
      ic:"body",br:null
    }
  ]},

  /* ═══ #5 SKYLINE FOCUS ═══
     Phase 4 SP5 — coreografía multi-acto migrada (Tier 1B).
     5 actos: 1 visual_panoramic + 1 visual_dual_focus + 1 breath + 1 cognitive_anchor + 1 commitment_motor.
     Primer protocolo en usar VisualPanoramicPrompt y DualFocusTargets en flow real. */
  {id:5,n:"Skyline Focus",ct:"Activación",d:120,sb:"Recalibración visual-cognitiva",tg:"SF",cl:"#22D3EE",int:"enfoque",dif:1,
  ph:[
    {
      l:"Visión Periférica",r:"0–30s",s:0,e:30,
      k:"Mira lo más lejos posible. Ventana, pasillo, horizonte.",
      i:"Mira el punto más lejano disponible. Ventana, pasillo, horizonte. Mantén la mirada relajada.",
      iExec:[
        {
          from:0,to:30,
          text:"Mira lo más lejos posible. Ventana, pasillo, horizonte.",
          type:"visual_panoramic",
          mechanism:"Visión panorámica reduce activación cortical focal + relaja músculos extraoculares (Huberman 2021)",
          duration:{min_ms:25000,target_ms:30000,max_ms:35000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{primitive:"visual_panoramic_prompt",props:{duration_ms:30000}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"enfoque"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Visión panorámica activa modo desfocalizado + relaja músculos extraoculares (Huberman 2021)",
      ic:"focus",br:null
    },
    {
      l:"Enfoque Dual",r:"30–90s",s:30,e:90,
      k:"Cerca-lejos-cerca. Acomoda la mirada.",
      i:"Alterna entre tu mano (cerca) y un punto lejano. 5 segundos cada uno. Tres ciclos.",
      iExec:[
        {
          from:0,to:30,
          text:"Mira tu mano (cerca) 5s. Mira el horizonte (lejos) 5s. Tres ciclos completos.",
          type:"visual_dual_focus",
          mechanism:"Alternancia foco cercano-lejano entrena músculos ciliares + flexibilidad atencional visual",
          duration:{min_ms:25000,target_ms:30000,max_ms:36000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{primitive:"dual_focus_targets",props:{near_duration_ms:5000,far_duration_ms:5000,cycles:3}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        },
        {
          from:30,to:55,
          text:"Inhala 4. Exhala 4. Mirada suave al frente.",
          type:"breath",
          mechanism:"Respiración 4-4 simétrica con mirada relajada estabiliza atención focal",
          duration:{min_ms:22000,target_ms:25000,max_ms:30000},
          validate:{kind:"breath_cycles",min_cycles:3,cycle_min_ms:7000},
          ui:{primitive:"breath_orb",props:{cadence:{in:4,h1:0,ex:4,h2:0}}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        },
        {
          from:55,to:60,
          text:"¿Qué necesita tu atención completa ahora?",
          type:"cognitive_anchor",
          mechanism:"Single-task identification reduce attentional residue (Sophie Leroy 2009)",
          duration:{min_ms:5000,target_ms:8000,max_ms:12000},
          validate:{kind:"min_duration",min_ms:5000},
          ui:{primitive:"text_emphasis_voice",props:{text:"¿Qué necesita tu atención completa ahora?",subtext:"Una sola cosa."}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true}
          }
        }
      ],
      sc:"Alternancia foco cercano-lejano + identification single-task (Leroy 2009 attentional residue)",
      ic:"focus",br:{in:4,h1:0,ex:4,h2:0}
    },
    {
      l:"Compromiso de Enfoque",r:"90–120s",s:90,e:120,
      k:"Mira al frente. Esa es tu próxima hora.",
      i:"Mantén mirada firme al frente mientras presionas las palmas. 'Esta es mi próxima hora de foco.'",
      iExec:[
        {
          from:0,to:30,
          text:"Mirada firme al frente. Mantén las palmas presionadas. 'Esta es mi próxima hora de foco.'",
          type:"commitment_motor",
          mechanism:"Visual anchor + commitment motor refuerza intención de single-task",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Una hora de foco."}},
          media:{
            voice:{enabled_default:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Visual anchor + commitment motor refuerza single-task intent",
      ic:"body",br:null
    }
  ]},

  /* ═══ #6 GROUNDED STEEL ═══
     Phase 4 SP5 — coreografía multi-acto migrada (Tier 1B).
     4 actos: 1 proprioception (body scan) + 1 breath + 1 interoception + 1 commitment_motor. */
  {id:6,n:"Grounded Steel",ct:"Protocolo",d:120,sb:"Presencia ejecutiva",tg:"GS",cl:"#059669",int:"calma",dif:2,
  ph:[
    {
      l:"Aterrizaje Sensorial",r:"0–40s",s:0,e:40,
      k:"5 contactos físicos: pies, glúteos, espalda, manos, mandíbula.",
      i:"Atención secuencial: pies en piso (8s), glúteos en silla (8s), espalda apoyada (8s), manos en regazo (8s), mandíbula relajada (8s).",
      iExec:[
        {
          from:0,to:40,
          text:"Atención secuencial: pies, glúteos, espalda, manos, mandíbula. 8 segundos por punto.",
          type:"proprioception",
          mechanism:"Body scan secuencial activa propiocepción + ínsula posterior; aterriza atención (Khalsa 2018)",
          duration:{min_ms:35000,target_ms:40000,max_ms:48000},
          validate:{kind:"min_duration",min_ms:35000},
          ui:{primitive:"body_silhouette_highlight",props:{highlight_progression:["feet","glutes","back","hands","jaw"],transition_ms:8000}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Body scan secuencial activa propiocepción + ínsula (Khalsa 2018, Mehling 2009 MAIA)",
      ic:"body",br:null
    },
    {
      l:"Respiración Profunda",r:"40–90s",s:40,e:90,
      k:"Inhala 5. Exhala 7. Hundes en la silla.",
      i:"Inhala 5s. Exhala 7s sintiendo el peso del cuerpo en la silla. Cuatro ciclos.",
      iExec:[
        {
          from:0,to:40,
          text:"Inhala 5s. Exhala 7s sintiendo el peso. Cuatro ciclos.",
          type:"breath",
          mechanism:"Exhalación prolongada 5:7 + interocepción de peso activa parasimpático + grounding propioceptivo",
          duration:{min_ms:35000,target_ms:40000,max_ms:48000},
          validate:{kind:"breath_cycles",min_cycles:4,cycle_min_ms:10000},
          ui:{primitive:"breath_orb",props:{cadence:{in:5,h1:0,ex:7,h2:0}}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        },
        {
          from:40,to:50,
          text:"Quédate con el peso del cuerpo. Sin moverte.",
          type:"interoception",
          mechanism:"Sostén interocéptivo consolida estado parasimpático + reduce mente errante",
          duration:{min_ms:8000,target_ms:10000,max_ms:14000},
          validate:{kind:"min_duration",min_ms:8000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"El peso. Sostén."}},
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Exhalación 5:7 + interocepción peso corporal activa parasimpático",
      ic:"breath",br:{in:5,h1:0,ex:7,h2:0}
    },
    {
      l:"Cierre Estable",r:"90–120s",s:90,e:120,
      k:"El día sigue. Tú sigues firme.",
      i:"Mantén las palmas firmes contra los muslos mientras dices mentalmente: 'Estoy aquí. Sigo firme.'",
      iExec:[
        {
          from:0,to:30,
          text:"Mantén las palmas firmes contra los muslos. Di mentalmente: 'Estoy aquí. Sigo firme.'",
          type:"commitment_motor",
          mechanism:"Anclaje motor + verbalización mental consolida estado calmado (Bryan, Adams, Monin 2013)",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:6000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:6000,release_message:"Aquí. Firme."}},
          media:{
            voice:{enabled_default:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Anclaje motor + verbalización (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #7 HYPERSHIFT ═══
     Phase 4 SP6 — coreografía multi-acto migrada (Tier 2).
     3 actos: 1 chest_percussion + 1 isometric_grip + 1 commitment_motor. */
  {id:7,n:"HyperShift",ct:"Protocolo",d:120,sb:"Descarga emocional rápida",tg:"HS",cl:"#8B5CF6",int:"reset",dif:2,
  ph:[
    {
      l:"Percusión Atencional",r:"0–30s",s:0,e:30,
      k:"Yemas sobre el esternón. Ritmo constante. Atención al centro.",
      i:"Toca el esternón con yemas de los dedos a 2-3 toques por segundo. Inhala 3s, sostén 2s, exhala 5s.",
      iExec:[
        {
          from:0,to:30,
          text:"Yemas sobre el esternón. Ritmo 2-3 toques por segundo. Inhala 3, sostén 2, exhala 5.",
          type:"vagal_chest_percussion",
          mechanism:"Percusión esternal rítmica funciona como anclaje atencional somático; exhalación prolongada activa parasimpático",
          duration:{min_ms:25000,target_ms:30000,max_ms:36000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{primitive:"chest_percussion_prompt",props:{bpm:150,duration_ms:30000,haptic_enabled:true}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"reset"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Percusión esternal rítmica como anclaje atencional somático + exhalación prolongada parasimpática",
      ic:"body",br:{in:3,h1:2,ex:5,h2:0}
    },
    {
      l:"Contracción Isométrica",r:"30–75s",s:30,e:75,
      k:"Aprieta puños 10s. Suelta 5s. Tres ciclos.",
      i:"Aprieta los puños al 10% de fuerza máxima durante 10 segundos. Suelta completamente 5 segundos. Tres ciclos.",
      iExec:[
        {
          from:0,to:45,
          text:"Aprieta los puños al 10% de fuerza. 10 segundos. Suelta 5 segundos. Tres ciclos.",
          type:"motor_isometric",
          mechanism:"Contracción isométrica al 10% activa propioceptores sin gasto energético (Levine, Somatic Experiencing 2010)",
          duration:{min_ms:40000,target_ms:45000,max_ms:52000},
          validate:{kind:"min_duration",min_ms:40000},
          ui:{primitive:"isometric_grip_prompt",props:{target_holds:3,hold_duration_ms:10000,release_duration_ms:5000}},
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Contracción isométrica activa propioceptores sin gasto energético (Levine 2010)",
      ic:"body",br:null
    },
    {
      l:"Reset Cognitivo",r:"75–120s",s:75,e:120,
      k:"Identifica qué cambia ahora. Mantén el cambio.",
      i:"Identifica una cosa que vas a hacer diferente al volver. Mantén las palmas presionadas mientras la visualizas.",
      iExec:[
        {
          from:0,to:45,
          text:"Identifica una cosa diferente que harás al volver. Mantén las palmas presionadas mientras la visualizas.",
          type:"commitment_motor",
          mechanism:"Reset cognitivo + commitment motor cierra el ciclo de cambio (Bryan, Adams, Monin 2013)",
          duration:{min_ms:30000,target_ms:35000,max_ms:45000},
          validate:{kind:"hold_press",min_hold_ms:6000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:6000,release_message:"Algo cambia ahora."}},
          media:{
            voice:{enabled_default:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Commitment motor + reset cognitivo (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #8 LIGHTNING FOCUS ═══
     Phase 4 SP6 — coreografía multi-acto migrada (Tier 2).
     4 actos: 1 oculomotor + 1 visual_focus + 1 cognitive_anchor + 1 commitment_motor. */
  {id:8,n:"Lightning Focus",ct:"Activación",d:120,sb:"Enfoque extremo",tg:"LF",cl:"#22D3EE",int:"enfoque",dif:3,
  ph:[
    {
      l:"Reset Visual",r:"0–30s",s:0,e:30,
      k:"Mira el punto que se mueve. Sigue con la cabeza fija.",
      i:"Mantén la cabeza inmóvil. Sigue el punto cyan con los ojos solamente. Ritmo 0.5Hz.",
      iExec:[
        {
          from:0,to:30,
          text:"Cabeza inmóvil. Sigue el punto con los ojos solamente.",
          type:"oculomotor",
          mechanism:"Movimientos oculares horizontales rápidos producen reset atencional vía cambio de fijación visual (atentional capture)",
          duration:{min_ms:25000,target_ms:30000,max_ms:35000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{primitive:"ocular_horizontal_metronome",props:{frequency_hz:0.5,total_cycles:15}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"enfoque"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Movimientos oculares horizontales producen reset atencional (NO equivalente a EMDR clínica)",
      ic:"focus",br:null
    },
    {
      l:"Fijación + Mantra",r:"30–90s",s:30,e:90,
      k:"Mira un punto fijo. Repite tu palabra de foco.",
      i:"Elige un punto fijo lejano. Mírialo sin pestañear lo que puedas. Repite mentalmente: 'Ahora.'",
      iExec:[
        {
          from:0,to:30,
          text:"Mira un punto fijo lejano. Sin pestañear lo que puedas.",
          type:"visual_focus",
          mechanism:"Fijación visual sostenida activa corteza prefrontal dorsolateral (atención top-down)",
          duration:{min_ms:25000,target_ms:30000,max_ms:36000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{primitive:"visual_panoramic_prompt",props:{duration_ms:30000}},
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        },
        {
          from:30,to:60,
          text:"Repite mentalmente: 'Ahora.' Una vez por exhalación.",
          type:"cognitive_anchor",
          mechanism:"Mantra repetitivo elimina multitarea neural + sostiene atención focal",
          duration:{min_ms:25000,target_ms:30000,max_ms:35000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{primitive:"text_emphasis_voice",props:{text:"Ahora.",subtext:"Una vez por exhalación."}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true}
          }
        }
      ],
      sc:"Fijación visual + mantra repetitivo elimina multitarea neural",
      ic:"focus",br:{in:4,h1:0,ex:4,h2:0}
    },
    {
      l:"Lock-in",r:"90–120s",s:90,e:120,
      k:"Tu única tarea de la próxima hora. Mantén.",
      i:"Mantén las palmas presionadas mientras visualizas tu única tarea de la próxima hora.",
      iExec:[
        {
          from:0,to:30,
          text:"Mantén las palmas presionadas. Tu única tarea de la próxima hora.",
          type:"commitment_motor",
          mechanism:"Commitment motor + visual focus consolida intent de single-task",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:6000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:6000,release_message:"Una tarea. Una hora."}},
          media:{
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Commitment motor + visual focus consolida single-task intent",
      ic:"body",br:null
    }
  ]},

  /* ═══ #9 STEEL CORE RESET ═══
     Phase 4 SP6 — coreografía multi-acto migrada (Tier 2).
     4 actos: 1 vagal_breath_extended + 1 proprioception + 1 interoception + 1 commitment_motor. */
  {id:9,n:"Steel Core Reset",ct:"Reset",d:120,sb:"Reinicio nervioso máximo",tg:"SC",cl:"#8B5CF6",int:"reset",dif:3,
  ph:[
    {
      l:"Exhale Explosivo",r:"0–30s",s:0,e:30,
      k:"Inhala 4. Exhala fuerte 6. El cuerpo se expulsa.",
      i:"Inhala 4 segundos por nariz. Exhala 6 segundos por boca con sonido fuerte. Tres ciclos.",
      iExec:[
        {
          from:0,to:30,
          text:"Inhala 4 nariz. Exhala 6 boca con sonido fuerte. Tres ciclos.",
          type:"vagal_breath_extended",
          mechanism:"Exhale explosivo activa cambio de presión torácica que estimula barorreceptores (mecanismo vagal real)",
          duration:{min_ms:25000,target_ms:30000,max_ms:36000},
          validate:{kind:"breath_cycles",min_cycles:3,cycle_min_ms:8000},
          ui:{primitive:"breath_orb",props:{cadence:{in:4,h1:0,ex:6,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"reset"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Exhale explosivo + barorreceptores (mecanismo vagal documentado)",
      ic:"breath",br:{in:4,h1:0,ex:6,h2:0}
    },
    {
      l:"Núcleo de Acero",r:"30–75s",s:30,e:75,
      k:"Activa el centro. Eje vertical. Estable.",
      i:"Activa el transverso abdominal apretando suavemente el ombligo hacia adentro. Mantén la columna alineada.",
      iExec:[
        {
          from:0,to:25,
          text:"Postura erguida. Pies firmes. Ombligo hacia adentro suave. Cabeza alineada.",
          type:"proprioception",
          mechanism:"Activación isométrica transverso abdominal mejora estabilidad postural vía propiocepción central",
          duration:{min_ms:20000,target_ms:25000,max_ms:30000},
          validate:{kind:"min_duration",min_ms:20000},
          ui:{primitive:"posture_visual",props:{points:["feet","core","spine","shoulders","head"],transition_ms:5000}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        },
        {
          from:25,to:45,
          text:"Mantén el eje. Respira lateralmente expandiendo costillas.",
          type:"interoception",
          mechanism:"Respiración lateral con core activado consolida estabilidad postural",
          duration:{min_ms:18000,target_ms:20000,max_ms:25000},
          validate:{kind:"min_duration",min_ms:18000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Eje. Estable."}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true}
          }
        }
      ],
      sc:"Activación isométrica transverso + estabilidad postural vía propiocepción",
      ic:"body",br:{in:4,h1:0,ex:6,h2:0}
    },
    {
      l:"Cierre con Estructura",r:"75–120s",s:75,e:120,
      k:"Eres una columna vertical estable. Sigue.",
      i:"Mantén la postura mientras presionas las palmas: 'Soy una columna vertical estable.'",
      iExec:[
        {
          from:0,to:45,
          text:"Mantén postura y palmas presionadas. 'Soy una columna vertical estable.'",
          type:"commitment_motor",
          mechanism:"Commitment motor + verbalización ancla estructura postural en memoria procedimental",
          duration:{min_ms:30000,target_ms:35000,max_ms:45000},
          validate:{kind:"hold_press",min_hold_ms:6000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:6000,release_message:"Eje. Vertical. Estable."}},
          media:{
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Commitment motor + verbalización ancla postura",
      ic:"body",br:null
    }
  ]},

  /* ═══ #10 SENSORY WAKE ═══
     Phase 4 SP6 — coreografía multi-acto migrada (Tier 2).
     4 actos: 1 breath + 1 interoception + 1 somatic_tactile + 1 commitment_motor. */
  {id:10,n:"Sensory Wake",ct:"Protocolo",d:120,sb:"Activación somatosensorial fina",tg:"AP",cl:"#F59E0B",int:"energia",dif:2,
  ph:[
    {
      l:"Pulso Respiratorio",r:"0–30s",s:0,e:30,
      k:"Inhala 1s. Exhala 2s en pulsos cortos: 'sh-sh-sh'.",
      i:"Inhala 1 segundo. Exhala 2 segundos en 4 pulsos cortos. Diez ciclos.",
      iExec:[
        {
          from:0,to:30,
          text:"Inhala 1s. Exhala 2s en cuatro pulsos: sh-sh-sh-sh. Diez ciclos.",
          type:"breath",
          mechanism:"Micro-pulsos espiratorios activan coordinación neuromotora del diafragma e intercostales",
          duration:{min_ms:25000,target_ms:30000,max_ms:35000},
          validate:{kind:"breath_cycles",min_cycles:8,cycle_min_ms:2500},
          ui:{primitive:"breath_orb",props:{cadence:{in:1,h1:0,ex:2,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"energia"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Micro-pulsos espiratorios coordinación diafragma e intercostales",
      ic:"breath",br:{in:1,h1:0,ex:2,h2:0}
    },
    {
      l:"Barrido Sensorial",r:"30–75s",s:30,e:75,
      k:"Atención al cuerpo zona por zona. Dedos pulsan suavemente.",
      i:"Atención secuencial: pies, piernas, abdomen, pecho, brazos, cabeza. Pulsa los dedos contra los muslos durante todo el barrido.",
      iExec:[
        {
          from:0,to:35,
          text:"Atención de pies a cabeza. Pulsa dedos contra muslos.",
          type:"interoception",
          mechanism:"Body scan ascendente activa ínsula anterior; pulsación táctil rítmica activa cortex S1/S2 (Khalsa 2018, Critchley 2013)",
          duration:{min_ms:30000,target_ms:35000,max_ms:42000},
          validate:{kind:"min_duration",min_ms:30000},
          ui:{primitive:"body_silhouette_highlight",props:{highlight_progression:["feet","legs","abdomen","chest","arms","head"],transition_ms:5000}},
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        },
        {
          from:35,to:45,
          text:"Mantén la pulsación. Atención global al cuerpo.",
          type:"somatic_tactile",
          mechanism:"Pulsación táctil sostenida sostiene atención focalizada en input propioceptivo",
          duration:{min_ms:8000,target_ms:10000,max_ms:14000},
          validate:{kind:"min_duration",min_ms:8000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Cuerpo despierto."}},
          media:{
            breath_ticks:{enabled:false}
          }
        }
      ],
      sc:"Body scan + cortex S1/S2 pulsación táctil rítmica (Khalsa 2018, Critchley 2013)",
      ic:"body",br:null
    },
    {
      l:"Activación Direccional",r:"75–120s",s:75,e:120,
      k:"Cuerpo despierto. Próxima acción.",
      i:"Mantén las palmas presionadas mientras visualizas tu próxima acción con energía.",
      iExec:[
        {
          from:0,to:45,
          text:"Mantén las palmas presionadas. Visualiza tu próxima acción con energía.",
          type:"commitment_motor",
          mechanism:"Commitment motor + visualización direccional cierra el ciclo de activación",
          duration:{min_ms:30000,target_ms:35000,max_ms:45000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Cuerpo activo. Próxima acción."}},
          media:{
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Commitment motor + visualización direccional",
      ic:"body",br:null
    }
  ]},

  /* ═══ #11 BODY ANCHOR ═══
     Phase 4 SP6 — coreografía multi-acto migrada (Tier 2).
     4 actos: 1 breath + 1 proprioception (descendente) + 1 interoception + 1 commitment_motor. */
  {id:11,n:"Body Anchor",ct:"Protocolo",d:120,sb:"Anclaje propioceptivo",tg:"BA",cl:"#059669",int:"calma",dif:2,
  ph:[
    {
      l:"Anclaje Diafragmático",r:"0–30s",s:0,e:30,
      k:"Mano en abdomen. Inhala 4. Exhala 8 hacia el suelo pélvico.",
      i:"Una mano en el abdomen. Inhala 4 segundos sintiendo expansión. Exhala 8 segundos sintiendo descenso hacia el suelo pélvico.",
      iExec:[
        {
          from:0,to:30,
          text:"Mano en abdomen. Inhala 4 sintiendo expansión. Exhala 8 hacia el suelo pélvico.",
          type:"breath",
          mechanism:"Exhalación 1:2 con mano en abdomen + descenso pélvico activa parasimpático profundo + propiocepción central",
          duration:{min_ms:25000,target_ms:30000,max_ms:36000},
          validate:{kind:"breath_cycles",min_cycles:2,cycle_min_ms:11000},
          ui:{primitive:"breath_orb",props:{cadence:{in:4,h1:0,ex:8,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Exhalación 1:2 + propiocepción diafragma-suelo pélvico activa parasimpático profundo",
      ic:"breath",br:{in:4,h1:0,ex:8,h2:0}
    },
    {
      l:"Relajación Descendente",r:"30–90s",s:30,e:90,
      k:"Cabeza, hombros, abdomen, piernas. Cada zona suelta.",
      i:"Atención secuencial soltando: cabeza, cuello, hombros, brazos, abdomen, piernas, pies. 8 segundos por zona.",
      iExec:[
        {
          from:0,to:50,
          text:"Suelta cada zona: cabeza, cuello, hombros, brazos, abdomen, piernas, pies.",
          type:"proprioception",
          mechanism:"Body scan descendente con relajación progresiva activa parasimpático global; sigue patrón natural de descarga",
          duration:{min_ms:45000,target_ms:50000,max_ms:56000},
          validate:{kind:"min_duration",min_ms:45000},
          ui:{primitive:"body_silhouette_highlight",props:{highlight_progression:["head","neck","shoulders","arms","abdomen","legs","feet"],transition_ms:7000}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        },
        {
          from:50,to:60,
          text:"Quédate con la sensación de descenso. Sin moverte.",
          type:"interoception",
          mechanism:"Sostén interocéptivo consolida estado de relajación profunda",
          duration:{min_ms:8000,target_ms:10000,max_ms:14000},
          validate:{kind:"min_duration",min_ms:8000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Descenso. Sostén."}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true}
          }
        }
      ],
      sc:"Body scan descendente + interocepción sostenida activa parasimpático global",
      ic:"body",br:{in:4,h1:0,ex:8,h2:0}
    },
    {
      l:"Anclaje Final",r:"90–120s",s:90,e:120,
      k:"Pies firmes. Aquí. Suelo.",
      i:"Mantén las palmas firmes contra los muslos. 'Estoy aquí. Anclado.'",
      iExec:[
        {
          from:0,to:30,
          text:"Mantén palmas firmes contra muslos. 'Estoy aquí. Anclado.'",
          type:"commitment_motor",
          mechanism:"Commitment motor + verbalización ancla estado calmo en memoria procedimental",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:6000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:6000,release_message:"Aquí. Anclado."}},
          media:{
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Commitment motor + verbalización ancla estado calmo",
      ic:"body",br:null
    }
  ]},

  /* ═══ #12 NEURAL ASCENSION ═══
     Phase 4 SP6 — coreografía multi-acto migrada (Tier 2).
     Refactor profundo de SP1 ya estableció 4 fases (cross-body Brain Gym
     eliminado). Aquí solo agregamos type/duration/validate/ui/media a
     cada acto existente. */
  {id:12,n:"Neural Ascension",ct:"Reset",d:120,sb:"Claridad ejecutiva",tg:"NA",cl:"#22D3EE",int:"reset",dif:2,
  ph:[
    {
      l:"Respiración Vertical",r:"0–30s",s:0,e:30,
      k:"Inhala 4 subiendo abdomen → pecho. Exhala 6 bajando.",
      i:"Inhala 4 segundos llevando atención del abdomen al pecho. Sostén 2. Exhala 6 segundos descendiendo. Cuatro ciclos.",
      iExec:[
        {
          from:0,to:30,
          text:"Inhala 4s subiendo abdomen → pecho. Sostén 2. Exhala 6s bajando. Cuatro ciclos.",
          type:"breath",
          mechanism:"Respiración 4-2-6 con dirección somática reduce activación simpática (Zaccaro et al. 2018, Frontiers in Human Neuroscience)",
          duration:{min_ms:25000,target_ms:30000,max_ms:36000},
          validate:{kind:"breath_cycles",min_cycles:2,cycle_min_ms:11000},
          ui:{primitive:"breath_orb",props:{cadence:{in:4,h1:2,ex:6,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"reset"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Respiración diafragmática 4-2-6 reduce activación simpática (Zaccaro 2018)",
      ic:"breath",br:{in:4,h1:2,ex:6,h2:0}
    },
    {
      l:"Alineación 5 Puntos",r:"30–70s",s:30,e:70,
      k:"Pies. Glúteos. Columna. Hombros. Cabeza. 7s cada uno.",
      i:"Sin moverte, lleva atención secuencialmente: pies firmes, glúteos en silla, columna recta, hombros un poco atrás, cabeza alineada.",
      iExec:[
        {
          from:0,to:40,
          text:"Pies firmes (7s). Glúteos en silla (7s). Columna recta (7s). Hombros atrás (7s). Cabeza alineada (7s).",
          type:"proprioception",
          mechanism:"Body scan postural secuencial activa propiocepción + ínsula anterior (Khalsa 2018, Mehling 2009 MAIA)",
          duration:{min_ms:35000,target_ms:40000,max_ms:48000},
          validate:{kind:"min_duration",min_ms:35000},
          ui:{primitive:"posture_visual",props:{points:["feet","glutes","spine","shoulders","head"],transition_ms:7000}},
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Body scan postural secuencial activa propiocepción + ínsula (Khalsa 2018, Mehling 2009)",
      ic:"body",br:null
    },
    {
      l:"Apertura Cognitiva",r:"70–95s",s:70,e:95,
      k:"¿Qué decisión necesitas tomar con claridad ahora?",
      i:"Cierra los ojos. Pregunta: ¿qué decisión necesito tomar con claridad ahora? Identifica UNA decisión concreta.",
      iExec:[
        {
          from:0,to:25,
          text:"¿Qué decisión necesito tomar con claridad? Identifica UNA.",
          type:"cognitive_anchor",
          mechanism:"Atención focalizada single-task reduce decision fatigue (Baumeister 2008)",
          duration:{min_ms:20000,target_ms:25000,max_ms:30000},
          validate:{kind:"min_duration",min_ms:20000},
          ui:{primitive:"text_emphasis_voice",props:{text:"¿Qué decisión necesito tomar con claridad?",subtext:"Una sola."}},
          media:{
            breath_ticks:{enabled:false}
          }
        }
      ],
      sc:"Single-task identification reduce decision fatigue (Baumeister 2008)",
      ic:"mind",br:null
    },
    {
      l:"Commitment Motor",r:"95–120s",s:95,e:120,
      k:"Visualiza la decisión. Presiona palmas. 'Esta es.'",
      i:"Visualiza la decisión mientras presionas las palmas contra los muslos. 'Esta es la decisión.' Tres veces.",
      iExec:[
        {
          from:0,to:25,
          text:"Visualiza la decisión. Presiona palmas. 'Esta es la decisión.' Tres veces mentalmente.",
          type:"commitment_motor",
          mechanism:"Compromiso motor + verbalización mental ancla intención en memoria procedimental (Bryan, Adams, Monin 2013, JPSP)",
          duration:{min_ms:18000,target_ms:22000,max_ms:28000},
          validate:{kind:"hold_press",min_hold_ms:6000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:6000,release_message:"Esta es la decisión."}},
          media:{
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"},
            signature:{kind:"checkpoint",fire_at:"end"}
          }
        }
      ],
      sc:"Compromiso motor + verbalización (Bryan, Adams, Monin 2013, JPSP)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #15 SUSPIRO FISIOLÓGICO · Balban et al. 2023 ═══
     Phase 4 SP7 — coreografía multi-acto migrada (Active extra).
     useCase: "active" EXPLÍCITO (Calma Express 90s).
     3 actos: 1 breath (doble inhalación) + 1 interocepción + 1 commitment_motor. */
  {id:15,n:"Suspiro Fisiológico",ct:"Calma Express",d:90,sb:"Reset rápido respiratorio",tg:"SF",cl:"#22D3EE",int:"calma",dif:1,useCase:"active",
  ph:[
    {
      l:"Doble Inhalación",r:"0–30s",s:0,e:30,
      k:"Inhala. Inhala otra vez encima. Exhala largo.",
      i:"Inhala por nariz. Antes de exhalar, inhala una segunda vez encima. Exhala largo por boca. Cinco ciclos.",
      iExec:[
        {
          from:0,to:30,
          text:"Inhala nariz. Inhala otra vez encima. Exhala largo por boca. Cinco ciclos.",
          type:"breath",
          mechanism:"Doble inhalación + exhalación prolongada activa parasimpático en <30s (Balban et al. 2023, Stanford)",
          duration:{min_ms:25000,target_ms:30000,max_ms:35000},
          validate:{kind:"breath_cycles",min_cycles:5,cycle_min_ms:5000},
          ui:{primitive:"breath_orb",props:{cadence:{in:2,h1:1,ex:5,h2:0},double_inhale:true}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Doble inhalación + exhalación prolongada activa parasimpático <30s (Balban 2023, Cell Reports Medicine)",
      ic:"breath",br:{in:2,h1:1,ex:5,h2:0}
    },
    {
      l:"Sostén",r:"30–60s",s:30,e:60,
      k:"Respira normal. Atención al cuerpo.",
      i:"Vuelve a respiración normal. Atención al cuerpo: ¿qué ha cambiado?",
      iExec:[
        {
          from:0,to:30,
          text:"Respira normal. Atención al cuerpo. ¿Qué ha cambiado?",
          type:"interoception",
          mechanism:"Interocepción post-intervención consolida cambio fisiológico via ínsula anterior",
          duration:{min_ms:25000,target_ms:30000,max_ms:35000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Atención al cuerpo."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Interocepción post-intervención (Khalsa 2018)",
      ic:"body",br:null
    },
    {
      l:"Cierre Express",r:"60–90s",s:60,e:90,
      k:"Listo. Sigue.",
      i:"Mantén las palmas presionadas: 'Calmo. Sigo.'",
      iExec:[
        {
          from:0,to:30,
          text:"Mantén palmas presionadas. 'Calmo. Sigo.'",
          type:"commitment_motor",
          mechanism:"Commitment motor cierra ciclo de calma express",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Calmo. Sigo."}},
          media:{
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Commitment motor + verbalización (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #16 RESONANCIA VAGAL · Lehrer & Gevirtz 2014 ═══
     Phase 4 SP7 — coreografía multi-acto migrada (Training).
     6 actos totales: calibración + 4 bloques sostenidos + cierre reflexivo. */
  {id:16,n:"Resonancia Vagal",ct:"Entrenamiento HRV",d:600,sb:"5.5 respiraciones/minuto sostenido",tg:"RV",cl:"#22D3EE",int:"calma",dif:2,useCase:"training",
  ph:[
    {
      l:"Calibración",r:"0–60s",s:0,e:60,
      k:"Encuentra el ritmo: 5.5 inhala, 5.5 exhala.",
      i:"Cinco respiraciones de calibración. Inhala 5.5 segundos por nariz. Exhala 5.5 segundos por nariz o boca relajada.",
      iExec:[
        {
          from:0,to:60,
          text:"Inhala 5.5s nariz. Exhala 5.5s. Cinco ciclos de calibración.",
          type:"breath",
          mechanism:"Respiración a 5.5rpm maximiza variabilidad cardíaca (HRV) por resonancia barorrefleja (Lehrer 2014)",
          duration:{min_ms:50000,target_ms:60000,max_ms:72000},
          validate:{kind:"breath_cycles",min_cycles:5,cycle_min_ms:9500},
          ui:{primitive:"breath_orb",props:{cadence:{in:5.5,h1:0,ex:5.5,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"5.5rpm activa resonancia barorrefleja maximizando HRV (Lehrer & Gevirtz 2014)",
      ic:"breath",br:{in:5.5,h1:0,ex:5.5,h2:0}
    },
    {
      l:"Sostenimiento",r:"60–540s",s:60,e:540,
      k:"Mantén el ritmo. Sin esfuerzo.",
      i:"Continúa el ritmo 5.5rpm. Si pierdes el ritmo, vuelve al orb. Sin presión.",
      iExec:[
        {
          from:0,to:120,
          text:"Bloque 1. Mantén 5.5rpm. Sin esfuerzo.",
          type:"breath",
          mechanism:"Sostenimiento de 5.5rpm sostiene activación barorrefleja (Lehrer 2014)",
          duration:{min_ms:100000,target_ms:120000,max_ms:144000},
          validate:{kind:"breath_cycles",min_cycles:10,cycle_min_ms:9500},
          ui:{primitive:"breath_orb",props:{cadence:{in:5.5,h1:0,ex:5.5,h2:0}}},
          media:{breath_ticks:{enabled:true,auto_sync:true},binaural:{action:"continue"}}
        },
        {
          from:120,to:240,
          text:"Bloque 2. La resonancia se profundiza.",
          type:"breath",
          mechanism:"Sostenimiento prolongado profundiza efecto vagal-barorrefleja",
          duration:{min_ms:100000,target_ms:120000,max_ms:144000},
          validate:{kind:"breath_cycles",min_cycles:10,cycle_min_ms:9500},
          ui:{primitive:"breath_orb",props:{cadence:{in:5.5,h1:0,ex:5.5,h2:0}}},
          media:{breath_ticks:{enabled:true,auto_sync:true},binaural:{action:"continue"}}
        },
        {
          from:240,to:360,
          text:"Bloque 3. Tu cuerpo entrena resilencia autonómica.",
          type:"breath",
          mechanism:"Entrenamiento autonómico crónico aumenta HRV de baseline (Lehrer 2014)",
          duration:{min_ms:100000,target_ms:120000,max_ms:144000},
          validate:{kind:"breath_cycles",min_cycles:10,cycle_min_ms:9500},
          ui:{primitive:"breath_orb",props:{cadence:{in:5.5,h1:0,ex:5.5,h2:0}}},
          media:{breath_ticks:{enabled:true,auto_sync:true},binaural:{action:"continue"}}
        },
        {
          from:360,to:480,
          text:"Bloque 4. Coherencia profunda. Continúa.",
          type:"breath",
          mechanism:"Coherencia HRV sustained reduces stress reactivity baseline",
          duration:{min_ms:100000,target_ms:120000,max_ms:144000},
          validate:{kind:"breath_cycles",min_cycles:10,cycle_min_ms:9500},
          ui:{primitive:"breath_orb",props:{cadence:{in:5.5,h1:0,ex:5.5,h2:0}}},
          media:{breath_ticks:{enabled:true,auto_sync:true},binaural:{action:"continue"}}
        }
      ],
      sc:"Sostenimiento 5.5rpm 8min entrena baseline HRV (Lehrer 2014)",
      ic:"breath",br:{in:5.5,h1:0,ex:5.5,h2:0}
    },
    {
      l:"Cierre Reflexivo",r:"540–600s",s:540,e:600,
      k:"Reduce a respiración natural. Atención al estado.",
      i:"Vuelve gradualmente a respiración natural. Atención al cuerpo.",
      iExec:[
        {
          from:0,to:60,
          text:"Reduce a respiración natural. Quédate con la sensación de calma sostenida.",
          type:"interoception",
          mechanism:"Cierre reflexivo consolida estado entrenado",
          duration:{min_ms:50000,target_ms:60000,max_ms:72000},
          validate:{kind:"min_duration",min_ms:50000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Calma sostenida."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Cierre reflexivo consolida estado entrenado",
      ic:"body",br:null
    }
  ]},

  /* ═══ #17 NSDR · Kjaer et al. 2002 / Datta et al. 2017 / Huberman 2021 ═══
     Phase 4 SP7 — coreografía multi-acto migrada (Training).
     Voice-led — TTS auto-ON via media.voice.enabled_default=true por acto.
     7 actos: 1 setup + 4 body scan descendente + 1 respiración pasiva + 1 retorno. */
  {id:17,n:"NSDR 10 min",ct:"Reset Profundo",d:600,sb:"Non-Sleep Deep Rest",tg:"NS",cl:"#22D3EE",int:"calma",dif:1,useCase:"training",
  ph:[
    {
      l:"Configuración",r:"0–60s",s:0,e:60,
      k:"Acuéstate o siéntate cómodo. Cierra los ojos.",
      i:"Encuentra postura cómoda. Acuéstate o siéntate. Cierra los ojos. Respira normal.",
      iExec:[
        {
          from:0,to:60,
          text:"Encuentra postura cómoda. Cierra los ojos. Respira natural.",
          type:"transition",
          mechanism:"Postura supina + ojos cerrados activa default mode network preparado para body scan profundo (Huberman protocol)",
          duration:{min_ms:50000,target_ms:60000,max_ms:72000},
          validate:{kind:"min_duration",min_ms:50000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Cómodo. Ojos cerrados."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Postura supina + ojos cerrados activa DMN para reset profundo (Huberman)",
      ic:"body",br:null
    },
    {
      l:"Body Scan Descendente",r:"60–360s",s:60,e:360,
      k:"Atención zona por zona. Suelta cada una.",
      i:"Atención secuencial: cabeza, cuello, hombros, brazos, manos, pecho, abdomen, caderas, piernas, pies. 75 segundos por bloque.",
      iExec:[
        {
          from:0,to:75,
          text:"Atención a la cabeza. Cuero cabelludo. Frente. Mandíbula. Cuello. Hombros. Suelta.",
          type:"proprioception",
          mechanism:"Body scan descendente activa propiocepción + reduce activación cortical (Yoga Nidra Saraswati 1976, validated Huberman 2021)",
          duration:{min_ms:65000,target_ms:75000,max_ms:85000},
          validate:{kind:"min_duration",min_ms:65000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Cabeza. Cuello. Hombros."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        },
        {
          from:75,to:150,
          text:"Atención a brazos. Codos. Antebrazos. Manos. Dedos. Suelta.",
          type:"proprioception",
          mechanism:"Body scan extremidades superiores",
          duration:{min_ms:65000,target_ms:75000,max_ms:85000},
          validate:{kind:"min_duration",min_ms:65000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Brazos. Manos. Dedos."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        },
        {
          from:150,to:225,
          text:"Atención al pecho. Costillas. Abdomen. Caderas. Suelta.",
          type:"proprioception",
          mechanism:"Body scan torso central",
          duration:{min_ms:65000,target_ms:75000,max_ms:85000},
          validate:{kind:"min_duration",min_ms:65000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Pecho. Abdomen. Caderas."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        },
        {
          from:225,to:300,
          text:"Atención a piernas. Muslos. Rodillas. Pantorrillas. Pies. Dedos. Suelta.",
          type:"proprioception",
          mechanism:"Body scan extremidades inferiores cierra patrón descendente",
          duration:{min_ms:65000,target_ms:75000,max_ms:85000},
          validate:{kind:"min_duration",min_ms:65000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Piernas. Pies. Dedos."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Body scan descendente progresivo (Yoga Nidra protocol; Huberman 2021)",
      ic:"body",br:null
    },
    {
      l:"Respiración Pasiva",r:"360–510s",s:360,e:510,
      k:"Solo observa la respiración. Sin cambiarla.",
      i:"No controles la respiración. Solo observa. Cuenta cada exhalación: 1, 2, 3...",
      iExec:[
        {
          from:0,to:150,
          text:"Solo observa la respiración. Cuenta cada exhalación: 1, 2, 3...",
          type:"interoception",
          mechanism:"Observación pasiva de respiración profundiza estado parasimpático sin control voluntario (mindfulness protocol)",
          duration:{min_ms:130000,target_ms:150000,max_ms:175000},
          validate:{kind:"min_duration",min_ms:130000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Observa. Cuenta exhalaciones."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Observación pasiva profundiza parasimpático (mindfulness protocol)",
      ic:"breath",br:null
    },
    {
      l:"Retorno Gradual",r:"510–600s",s:510,e:600,
      k:"Atención vuelve. Mueve dedos suavemente. Abre los ojos.",
      i:"Atención vuelve a la habitación. Mueve dedos de manos y pies. Estírate suavemente. Abre los ojos cuando estés listo.",
      iExec:[
        {
          from:0,to:90,
          text:"Atención vuelve. Mueve dedos. Estírate. Abre los ojos cuando estés listo.",
          type:"transition",
          mechanism:"Retorno gradual evita disociación post-NSDR + reactiva atención exterocéptiva",
          duration:{min_ms:75000,target_ms:90000,max_ms:108000},
          validate:{kind:"min_duration",min_ms:75000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Mueve dedos. Estírate. Abre ojos."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Retorno gradual evita disociación post-NSDR",
      ic:"body",br:null
    }
  ]},

  /* ═══ #18 EMERGENCY RESET · Grounding 5-4-3-2-1 ═══
     Phase 4 SP8 — coreografía multi-acto migrada (Crisis).
     Reframing clínico: 5-4-3-2-1 simplificado de Najavits 2002.
     5 actos: visual + auditivo + táctil + breath + commitment. */
  {id:18,n:"Emergency Reset",ct:"Crisis",d:150,sb:"Grounding 5 sentidos",tg:"ER",cl:"#22D3EE",int:"calma",dif:1,useCase:"crisis",
  safety:"Si la angustia es severa o persistente, contacta inmediatamente a un profesional de salud mental o servicio de emergencia (911 en MX).",
  ph:[
    {
      l:"Anclaje Visual",r:"0–30s",s:0,e:30,
      k:"Nombra UN objeto que ves.",
      i:"Mira a tu alrededor. Encuentra UN objeto. Nómbralo en voz alta o mentalmente.",
      iExec:[
        {
          from:0,to:30,
          text:"Nombra UN objeto que ves ahora.",
          type:"sensory_grounding",
          mechanism:"Grounding visual interrumpe rumiación y reactiva córtex visual exterocéptivo (5-4-3-2-1 protocol, Najavits 2002)",
          duration:{min_ms:15000,target_ms:25000,max_ms:40000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"object_anchor_prompt",props:{prompt:"Un objeto que ves",min_chars:2,affirmation_template:"{value} es lo que ves."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Grounding 5-4-3-2-1 visual (Najavits 2002, Seeking Safety)",
      ic:"body",br:null
    },
    {
      l:"Anclaje Auditivo",r:"30–55s",s:30,e:55,
      k:"Nombra UN sonido que escuchas.",
      i:"Detente. Escucha. Encuentra UN sonido en tu entorno. Nómbralo.",
      iExec:[
        {
          from:0,to:25,
          text:"Nombra UN sonido que escuchas ahora.",
          type:"sensory_grounding",
          mechanism:"Grounding auditivo activa córtex auditivo + redirige atención exterior",
          duration:{min_ms:12000,target_ms:20000,max_ms:30000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"object_anchor_prompt",props:{prompt:"Un sonido que escuchas",min_chars:2,affirmation_template:"{value} es lo que escuchas."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Grounding auditivo redirige atención exterior",
      ic:"body",br:null
    },
    {
      l:"Anclaje Táctil",r:"55–85s",s:55,e:85,
      k:"Toca una superficie. Describe la textura mentalmente.",
      i:"Toca cualquier superficie cerca de ti: mesa, ropa, pared. Describe mentalmente: ¿Es rugosa? ¿Lisa? ¿Fría? ¿Tibia?",
      iExec:[
        {
          from:0,to:30,
          text:"Toca una superficie. Describe la textura: rugosa, lisa, fría, tibia.",
          type:"somatic_tactile",
          mechanism:"Grounding táctil activa cortex S1/S2 + propiocepción inmediata",
          duration:{min_ms:18000,target_ms:25000,max_ms:35000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"text_emphasis_voice",props:{text:"Toca una superficie.",subtext:"Describe la textura: rugosa, lisa, fría, tibia."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Grounding táctil activa cortex S1/S2",
      ic:"body",br:null
    },
    {
      l:"Doble Inhalación",r:"85–115s",s:85,e:115,
      k:"Inhala. Inhala otra vez. Exhala largo.",
      i:"Inhala por nariz. Antes de exhalar, inhala otra vez encima. Exhala largo. Tres ciclos.",
      iExec:[
        {
          from:0,to:30,
          text:"Inhala nariz. Inhala otra vez encima. Exhala largo. Tres ciclos.",
          type:"breath",
          mechanism:"Doble inhalación + exhalación prolongada activa parasimpático en <30s (Balban 2023)",
          duration:{min_ms:22000,target_ms:28000,max_ms:36000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"breath_orb",props:{cadence:{in:2,h1:1,ex:5,h2:0},double_inhale:true}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Suspiro fisiológico activa parasimpático rápido (Balban 2023)",
      ic:"breath",br:{in:2,h1:1,ex:5,h2:0}
    },
    {
      l:"¿Estoy Aquí?",r:"115–150s",s:115,e:150,
      k:"Estoy aquí. En este momento.",
      i:"Mantén las palmas firmes contra tu cuerpo. Repite: 'Estoy aquí. En este momento.'",
      iExec:[
        {
          from:0,to:35,
          text:"Mantén las palmas firmes. 'Estoy aquí. En este momento.'",
          type:"commitment_motor",
          mechanism:"Anclaje propioceptivo + verbalización presente cierra ciclo de grounding",
          duration:{min_ms:25000,target_ms:30000,max_ms:40000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:3000,release_message:"Estás aquí."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Anclaje propioceptivo + verbalización presente",
      ic:"body",br:null
    }
  ]},

  /* ═══ #19 PANIC INTERRUPT · Vagal sin agua (Phase 5 SP1 refactor) ═══
     Refactor retrospectivo: dive reflex con agua fría → 3 mecanismos vagales
     ejecutables sin infraestructura externa. Razón: fricción de "camina al
     lavabo" en crisis aguda derrota propósito de intervención de emergencia.
     3 actos: vocalización grave sostenida + apnea voluntaria con presión
     trigeminal frontal + commitment motor. */
  {id:19,n:"Panic Interrupt",ct:"Crisis",d:120,sb:"Interrupción vagal sin infraestructura",tg:"PI",cl:"#22D3EE",int:"calma",dif:2,useCase:"crisis",
  safety:"AVISO: Si la angustia es severa o persistente, contacta inmediatamente a un profesional de salud mental o servicio de emergencias (911 en México y EEUU; números locales en otros países).",
  ph:[
    {
      l:"Vocalización Grave",r:"0–40s",s:0,e:40,
      k:"Exhala con sonido grave: aaaaah. Sostén.",
      i:"Inhala normal. Exhala lentamente con sonido grave 'aaaaah'. Sostén la vocalización lo más largo posible. Tres veces.",
      iExec:[
        {
          from:0,to:40,
          text:"Exhala con sonido grave: aaaaah. Que vibre en pecho y garganta. Tres veces.",
          type:"vocalization",
          mechanism:"Vocalización grave sostenida activa nervio laríngeo recurrente (rama vagal) + extensión exhalatoria parasimpática (Porges 2009)",
          duration:{min_ms:30000,target_ms:35000,max_ms:45000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"vocal_with_haptic",props:{target_vocalizations:3,vocalization_duration_ms:10000}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Vocalización grave sostenida activa nervio laríngeo recurrente (Porges 2009, polyvagal theory)",
      ic:"breath",br:null
    },
    {
      l:"Apnea + Frente",r:"40–80s",s:40,e:80,
      k:"Inhala. Sostén. Presiona frente. Exhala largo.",
      i:"Inhala normal. Sostén el aire 4–6 segundos. Mientras sostienes, presiona la frente con los dedos. Exhala lentamente. Tres veces.",
      iExec:[
        {
          from:0,to:40,
          text:"Inhala normal. Sostén 4–6s mientras presionas frente con dedos. Exhala lento. Tres veces.",
          type:"breath",
          mechanism:"Apnea voluntaria breve aumenta tono vagal (Lemaitre 2008) + presión frontal estimula nervio trigémino (Russo 2017 extensión exhalatoria)",
          duration:{min_ms:30000,target_ms:35000,max_ms:45000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"breath_orb",props:{cadence:{in:3,h1:5,ex:6,h2:0}}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Apnea voluntaria breve + presión trigeminal frontal (Lemaitre 2008 + Porges 2009)",
      ic:"breath",br:{in:3,h1:5,ex:6,h2:0}
    },
    {
      l:"Estás Aquí",r:"80–120s",s:80,e:120,
      k:"Estás aquí. Estás a salvo.",
      i:"Mantén las palmas firmes contra tu pecho. 'Estoy aquí. Estoy a salvo.'",
      iExec:[
        {
          from:0,to:40,
          text:"Mantén las palmas firmes contra el pecho. 'Estoy aquí. Estoy a salvo.'",
          type:"commitment_motor",
          mechanism:"Anclaje propioceptivo central + afirmación de seguridad consolida estado calmo",
          duration:{min_ms:30000,target_ms:35000,max_ms:45000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:3000,release_message:"Estás aquí. A salvo."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Anclaje propioceptivo + afirmación seguridad",
      ic:"body",br:null
    }
  ]},

  /* ═══ #20 BLOCK BREAK · Crisis Cognitiva ═══
     Phase 4 SP8 — coreografía multi-acto migrada (Crisis cognitiva).
     Reset bloqueo agudo: motor → isométrica → re-encuadre → micro-acción.
     4 actos. */
  {id:20,n:"Block Break",ct:"Crisis Cognitiva",d:120,sb:"Reset bloqueo agudo",tg:"BB",cl:"#22D3EE",int:"energia",dif:1,useCase:"crisis",
  safety:"Si te encuentras frecuentemente bloqueado/a o experimentas frustración intensa persistente, considera buscar apoyo profesional.",
  ph:[
    {
      l:"Sacudida Física",r:"0–30s",s:0,e:30,
      k:"Sacude las manos vigorosamente. Romper la inercia.",
      i:"Levántate si puedes. Sacude las manos vigorosamente como si tuvieras agua y la tiraras. Sigue 20 segundos.",
      iExec:[
        {
          from:0,to:30,
          text:"Sacude las manos vigorosamente. Como si tuvieras agua y la tiraras.",
          type:"motor_release",
          mechanism:"Sacudida vigorosa interrumpe estado de paralysis cognitiva + aumenta circulación cerebral inmediata",
          duration:{min_ms:20000,target_ms:25000,max_ms:35000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"shake_hands_prompt",props:{duration_ms:25000}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"energia"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Movimiento vigoroso interrumpe paralysis + aumenta circulación cerebral",
      ic:"body",br:null
    },
    {
      l:"Descarga Isométrica",r:"30–55s",s:30,e:55,
      k:"Aprieta puños 10s. Suelta.",
      i:"Aprieta los puños con todas tus fuerzas durante 10 segundos. Suelta completamente. Siente la diferencia.",
      iExec:[
        {
          from:0,to:25,
          text:"Aprieta los puños 10 segundos. Suelta. Siente la diferencia.",
          type:"motor_isometric",
          mechanism:"Tensión isométrica máxima + relajación crea contraste somático que descarga frustración acumulada (Jacobson 1938 PMR)",
          duration:{min_ms:18000,target_ms:22000,max_ms:30000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"isometric_grip_prompt",props:{target_holds:1,hold_duration_ms:10000,release_duration_ms:10000}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Progressive Muscle Relaxation (Jacobson 1938) descarga tensión",
      ic:"body",br:null
    },
    {
      l:"Re-encuadre",r:"55–85s",s:55,e:85,
      k:"¿Qué necesito ahora?",
      i:"Pregunta sin juzgar: ¿qué necesito en este momento?",
      iExec:[
        {
          from:0,to:30,
          text:"¿Qué necesito ahora?",
          type:"cognitive_anchor",
          mechanism:"Re-encuadre cognitivo activa córtex prefrontal + permite ver opciones más allá del bloqueo (Gross 2014 emotion regulation)",
          duration:{min_ms:22000,target_ms:28000,max_ms:36000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{
            primitive:"chip_selector",
            props:{
              question:"¿Qué necesito ahora?",
              chips:[
                {id:"perspective",label:"Otra perspectiva"},
                {id:"external_help",label:"Pedir ayuda"},
                {id:"pause",label:"Pausa"}
              ],
              min_thinking_ms:4000
            }
          },
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false}
          }
        }
      ],
      sc:"Re-encuadre cognitivo (Gross 2014, emotion regulation)",
      ic:"mind",br:null
    },
    {
      l:"Acción Micro",r:"85–120s",s:85,e:120,
      k:"5 minutos. Una acción concreta.",
      i:"Mantén las palmas presionadas. Identifica UNA acción concreta de 5 minutos que harás al volver.",
      iExec:[
        {
          from:0,to:35,
          text:"Mantén las palmas presionadas. UNA acción de 5 minutos al volver.",
          type:"commitment_motor",
          mechanism:"Commitment motor a micro-acción rompe parálisis y crea momentum (Bryan, Adams, Monin 2013)",
          duration:{min_ms:25000,target_ms:30000,max_ms:40000},
          validate:{kind:"no_validation",reason:"crisis_no_pressure"},
          ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:3000,release_message:"5 minutos. Concreto."}},
          media:{
            voice:{enabled_default:true},
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Commitment a micro-acción crea momentum (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #21 THRESHOLD CROSSING · Reset transición ejecutiva (Phase 5 SP3) ═══
     Cierre cognitivo entre tareas vía event boundary intencional.
     4 fases × 1 acto = 4 actos: identificar → aproximarse → cruzar → consolidar.
     Mecanismo: doorway effect + event segmentation theory. Sin overclaim. */
  {id:21,n:"Threshold Crossing",ct:"Reset",d:120,sb:"Cierre cognitivo entre tareas",tg:"TC",cl:"#22D3EE",int:"reset",dif:1,useCase:"active",
  safety:"Si experimentas epilepsia fotosensible, evita este protocolo. La fase 3 incluye un cambio visual breve. Usa #3 Reset Ejecutivo en su lugar.",
  ph:[
    {
      l:"Estado Actual",r:"0–30s",s:0,e:30,
      k:"¿Qué estás cargando ahora?",
      i:"Identifica qué pesa cognitivamente. Frustración, fatiga, decisión pendiente, distracción.",
      iExec:[
        {
          from:0,to:30,
          text:"¿Qué estás cargando ahora?",
          type:"cognitive_anchor",
          mechanism:"Identificación explícita del estado cargado prepara boundary cognitivo (Zacks 2007 event segmentation theory)",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"chip_selection",required:true},
          ui:{
            primitive:"chip_selector",
            props:{
              question:"¿Qué cargas ahora?",
              chips:[
                {id:"frustration",label:"Frustración"},
                {id:"fatigue",label:"Fatiga"},
                {id:"pending_decision",label:"Decisión pendiente"},
                {id:"distraction",label:"Distracción"},
                {id:"other",label:"Otro"}
              ],
              min_thinking_ms:5000
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"reset"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Identificación explícita del estado prepara boundary cognitivo (Zacks 2007)",
      ic:"mind",br:null
    },
    {
      l:"Acercamiento",r:"30–70s",s:30,e:70,
      k:"Visualiza un umbral. Te acercas. Respira 4-4.",
      i:"Visualiza un umbral, una puerta, un portal. Te acercas caminando mentalmente. Respira: inhala 4, exhala 4. Cuatro ciclos.",
      iExec:[
        {
          from:0,to:40,
          text:"Visualiza un umbral. Te acercas. Inhala 4, exhala 4. Cuatro ciclos.",
          type:"cognitive_segmentation",
          mechanism:"Visualización de aproximación a boundary físico activa preparación cognitiva para event segmentation (Radvansky 2010 Cognition)",
          duration:{min_ms:35000,target_ms:40000,max_ms:48000},
          validate:{kind:"min_duration",min_ms:24000},
          ui:{
            primitive:"doorway_visualizer",
            props:{
              phase:"approach",
              duration_ms:40000,
              flash_enabled:true
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Aproximación a boundary activa preparación cognitiva (Radvansky 2010)",
      ic:"mind",br:{in:4,h1:0,ex:4,h2:0}
    },
    {
      l:"Cruce del Umbral",r:"70–90s",s:70,e:90,
      k:"Cruzas. Del otro lado.",
      i:"En la próxima exhalación, cruzas el umbral mentalmente. Lo que cargabas se queda atrás.",
      iExec:[
        {
          from:0,to:20,
          text:"En la próxima exhalación, cruzas. Lo que cargabas se queda atrás.",
          type:"cognitive_segmentation",
          mechanism:"Cruce del boundary activa event segmentation y limpia working memory (Radvansky 2006, 2011 Memory & Cognition)",
          duration:{min_ms:15000,target_ms:18000,max_ms:22000},
          validate:{kind:"min_duration",min_ms:15000},
          ui:{
            primitive:"doorway_visualizer",
            props:{
              phase:"cross",
              duration_ms:18000,
              flash_enabled:true
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            cue:{type:"spark",fire_at:"cross_moment"},
            signature:{kind:"phaseShift",fire_at:"cross_moment"}
          }
        }
      ],
      sc:"Boundary crossing activa event segmentation (Radvansky 2006, 2011)",
      ic:"mind",br:{in:4,h1:0,ex:4,h2:0}
    },
    {
      l:"Del Otro Lado",r:"90–120s",s:90,e:120,
      k:"Lo que hago ahora es distinto.",
      i:"Mantén las palmas presionadas mientras visualizas la siguiente tarea. 'Lo que hago ahora es distinto.'",
      iExec:[
        {
          from:0,to:30,
          text:"Mantén las palmas presionadas. 'Lo que hago ahora es distinto.'",
          type:"commitment_motor",
          mechanism:"Commitment motor + verbalización de cambio consolida event boundary cognitivo (Bryan, Adams, Monin 2013)",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{
            primitive:"hold_press_button",
            props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Distinto."}
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Commitment motor consolida boundary cognitivo (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #22 VAGAL HUM RESET · Calma vía resonancia vagal (Phase 5 SP4) ═══
     Triple sinergia documentada: humming activa nervio laríngeo recurrente
     (rama vagal) + vibración facial trigeminal + óxido nítrico nasal +15×.
     4 fases × 1 acto = 4 actos: prep → humming → interocepción → cierre.
     Bhramari pranayama instrumentado, sin overclaim inmunológico. */
  {id:22,n:"Vagal Hum Reset",ct:"Calma",d:150,sb:"Resonancia vagal por humming",tg:"VH",cl:"#22D3EE",int:"calma",dif:1,useCase:"active",
  ph:[
    {
      l:"Preparación",r:"0–30s",s:0,e:30,
      k:"Postura cómoda. Boca cerrada. Respiración natural.",
      i:"Postura erguida cómoda. Boca cerrada con lengua relajada. Respira natural por nariz.",
      iExec:[
        {
          from:0,to:30,
          text:"Postura erguida. Boca cerrada. Lengua relajada. Respira natural por nariz.",
          type:"transition",
          mechanism:"Preparación postural + respiración nasal estabiliza estado pre-vocalización",
          duration:{min_ms:25000,target_ms:30000,max_ms:35000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{primitive:"breath_orb",props:{cadence:{in:4,h1:0,ex:4,h2:0}}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Preparación postural + respiración nasal estabiliza estado pre-vocalización",
      ic:"breath",br:{in:4,h1:0,ex:4,h2:0}
    },
    {
      l:"Humming Sostenido",r:"30–80s",s:30,e:80,
      k:"Inhala 4. Exhala 8 con 'mmmmm'. Cuatro veces.",
      i:"Inhala 4 segundos. Exhala 8 segundos con sonido 'mmmmm' continuo. Cuatro vocalizaciones completas.",
      iExec:[
        {
          from:0,to:50,
          text:"Inhala 4. Exhala 8 con 'mmmmm' sostenido. Que vibre en cara y pecho. Cuatro veces.",
          type:"vocal_resonance",
          mechanism:"Humming activa nervio laríngeo recurrente (rama vagal) + vibración facial trigeminal + óxido nítrico nasal +15× (Porges 2009 polyvagal; Maniscalco 2003)",
          duration:{min_ms:42000,target_ms:50000,max_ms:60000},
          validate:{kind:"tap_count",min_taps:4,bilateral:false},
          ui:{
            primitive:"vocal_resonance_visual",
            props:{target_hums:4,hum_duration_ms:10000}
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Humming activa nervio laríngeo recurrente + óxido nítrico nasal (Porges 2009; Maniscalco 2003)",
      ic:"breath",br:null
    },
    {
      l:"Sostén Interocéptivo",r:"80–115s",s:80,e:115,
      k:"Atención a la vibración residual.",
      i:"Sin humming. Solo respiración natural. Atención a la vibración residual en cara y pecho.",
      iExec:[
        {
          from:0,to:35,
          text:"Sin humming. Atención a la vibración residual en cara y pecho.",
          type:"interoception",
          mechanism:"Interocepción post-vocalización consolida cambio fisiológico vía ínsula anterior (Khalsa 2018)",
          duration:{min_ms:28000,target_ms:35000,max_ms:42000},
          validate:{kind:"min_duration",min_ms:28000},
          ui:{primitive:"silence_cyan_minimal",props:{text:"Vibración residual."}},
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Interocepción post-vocalización consolida cambio fisiológico (Khalsa 2018)",
      ic:"body",br:null
    },
    {
      l:"Cierre Calmo",r:"115–150s",s:115,e:150,
      k:"Calma sostenida. Sigo.",
      i:"Mantén las palmas firmes contra pecho. 'Calma sostenida. Sigo.'",
      iExec:[
        {
          from:0,to:35,
          text:"Mantén las palmas firmes contra el pecho. 'Calma sostenida. Sigo.'",
          type:"commitment_motor",
          mechanism:"Anclaje propioceptivo + verbalización consolida estado calmo (Bryan, Adams, Monin 2013)",
          duration:{min_ms:28000,target_ms:32000,max_ms:40000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{
            primitive:"hold_press_button",
            props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Calma. Sigo."}
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Anclaje propioceptivo + verbalización (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #23 POWER POSE ACTIVATION · Energía postural (Phase 5 SP4) ═══
     Postura erguida + respiración energizante + isometric core.
     Reemplazo del "Cold Hand Thermogenic" original (decisión Phase 5).
     4 fases × 1 acto = 4 actos. Framing: Cuddy 2018 p-curve postural
     feedback effect (NO claim hormonal de Carney 2010 que no se replica).
     Cero infraestructura externa. */
  {id:23,n:"Power Pose Activation",ct:"Energía",d:120,sb:"Postura + respiración + isometric",tg:"PP",cl:"#22D3EE",int:"energia",dif:2,useCase:"active",
  ph:[
    {
      l:"Postura Erguida",r:"0–30s",s:0,e:30,
      k:"Pies firmes. Columna erguida. Hombros expandidos.",
      i:"Levántate o siéntate erguido. Pies firmes. Columna recta. Hombros un poco atrás. Cabeza alineada.",
      iExec:[
        {
          from:0,to:30,
          text:"Pies firmes. Columna erguida. Hombros expandidos. Cabeza alineada.",
          type:"power_posture",
          mechanism:"Postura erguida expansiva activa propiocepción central + modifica postural feedback (Cuddy 2018 p-curve análisis)",
          duration:{min_ms:25000,target_ms:30000,max_ms:36000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{
            primitive:"power_pose_visual",
            props:{phase:"posture_alignment",target_holds:0}
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"energia"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Postura erguida expansiva + propiocepción central (Cuddy 2018 p-curve)",
      ic:"body",br:null
    },
    {
      l:"Respiración Energizante",r:"30–65s",s:30,e:65,
      k:"Inhala 4 fuerte. Exhala 4 firme. Cuatro ciclos.",
      i:"Sin perder postura. Inhala 4 segundos con vigor. Exhala 4 segundos firme. Cuatro ciclos.",
      iExec:[
        {
          from:0,to:35,
          text:"Inhala 4 con vigor. Exhala 4 firme. Cuatro ciclos.",
          type:"breath",
          mechanism:"Respiración 4:4 simétrica con postura erguida activa simpático moderado + oxigenación",
          duration:{min_ms:28000,target_ms:35000,max_ms:42000},
          validate:{kind:"breath_cycles",min_cycles:4,cycle_min_ms:7000},
          ui:{primitive:"breath_orb",props:{cadence:{in:4,h1:0,ex:4,h2:0}}},
          media:{
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Respiración 4:4 + postura erguida activa simpático moderado",
      ic:"breath",br:{in:4,h1:0,ex:4,h2:0}
    },
    {
      l:"Activación Core",r:"65–95s",s:65,e:95,
      k:"Aprieta core 10s. Suelta 5s. Tres veces.",
      i:"Mantén postura. Aprieta abdomen y core durante 10 segundos. Suelta 5 segundos. Tres ciclos.",
      iExec:[
        {
          from:0,to:30,
          text:"Aprieta core 10s. Suelta 5s. Tres veces.",
          type:"motor_isometric",
          mechanism:"Isometric core activation refuerza propiocepción central + estabilidad postural sostenida",
          duration:{min_ms:25000,target_ms:30000,max_ms:38000},
          validate:{kind:"min_duration",min_ms:25000},
          ui:{
            primitive:"power_pose_visual",
            props:{phase:"isometric_holds",target_holds:3,hold_duration_ms:10000,release_duration_ms:5000}
          },
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Isometric core + propiocepción central refuerza estabilidad postural",
      ic:"body",br:null
    },
    {
      l:"Anclaje Energético",r:"95–120s",s:95,e:120,
      k:"Postura sostenida. Próxima hora activa.",
      i:"Mantén postura erguida + palmas presionadas. 'Próxima hora activa.'",
      iExec:[
        {
          from:0,to:25,
          text:"Mantén postura + palmas presionadas. 'Próxima hora activa.'",
          type:"commitment_motor",
          mechanism:"Postura sostenida + commitment motor consolida estado activado (Bryan, Adams, Monin 2013)",
          duration:{min_ms:18000,target_ms:22000,max_ms:30000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{
            primitive:"hold_press_button",
            props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Próxima hora activa."}
          },
          media:{
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Postura sostenida + commitment motor (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #24 BILATERAL WALKING MEDITATION · Reset ambulatorio (Phase 5 SP5) ═══
     Walking meditation con atención unilateral alternante (izq → der).
     4 fases × 1 acto = 4 actos: prep → izq × 8 pasos → der × 8 pasos → cierre.
     Mecanismo: walking meditation tradicional instrumentado con interocepción
     ambulatoria (Teut 2013 RCT distress). Cero overclaim crónico — single
     session effects son modestos pero medibles. */
  {id:24,n:"Bilateral Walking Meditation",ct:"Reset",d:150,sb:"Caminata consciente bilateral",tg:"BW",cl:"#22D3EE",int:"reset",dif:1,useCase:"active",
  ph:[
    {
      l:"Preparación",r:"0–30s",s:0,e:30,
      k:"Levántate. Espacio para 8 pasos.",
      i:"Levántate. Necesitas espacio para 8 pasos en línea recta. Si no hay espacio, marcha en el lugar.",
      iExec:[
        {
          from:0,to:30,
          text:"Levántate. Espacio para 8 pasos en línea recta. Sin espacio: marcha en el lugar.",
          type:"transition",
          mechanism:"Cambio de postura sentado a de pie + preparación espacial activa estado pre-ambulatorio",
          duration:{min_ms:22000,target_ms:28000,max_ms:35000},
          validate:{kind:"min_duration",min_ms:22000},
          ui:{
            primitive:"text_emphasis_voice",
            props:{
              text:"Levántate. Espacio para 8 pasos.",
              subtext:"Sin espacio: marcha en el lugar."
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"reset"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Preparación postural pre-ambulatoria",
      ic:"body",br:null
    },
    {
      l:"Pie Izquierdo",r:"30–70s",s:30,e:70,
      k:"8 pasos. Atención solo al pie izquierdo.",
      i:"Camina lento. Atención solo al pie izquierdo: cómo se levanta, cómo aterriza. 8 pasos. Tap cada paso.",
      iExec:[
        {
          from:0,to:40,
          text:"8 pasos. Atención al pie izquierdo. Tap cada vez que tu pie izquierdo aterriza.",
          type:"walking_meditation",
          mechanism:"Walking meditation con atención unilateral activa interocepción ambulatoria + reduce rumiación (Teut 2013 RCT)",
          duration:{min_ms:30000,target_ms:40000,max_ms:50000},
          validate:{kind:"tap_count",min_taps:8,bilateral:false},
          ui:{
            primitive:"walking_pace_indicator",
            props:{target_steps:8,pattern:"left_only",pace_bpm:60}
          },
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Walking meditation con atención unilateral (Teut 2013)",
      ic:"body",br:null
    },
    {
      l:"Pie Derecho",r:"70–110s",s:70,e:110,
      k:"8 pasos. Atención solo al pie derecho.",
      i:"Camina lento. Atención solo al pie derecho: cómo se levanta, cómo aterriza. 8 pasos. Tap cada paso.",
      iExec:[
        {
          from:0,to:40,
          text:"8 pasos. Atención al pie derecho. Tap cada vez que tu pie derecho aterriza.",
          type:"walking_meditation",
          mechanism:"Atención unilateral contralateral mantiene focus alternante",
          duration:{min_ms:30000,target_ms:40000,max_ms:50000},
          validate:{kind:"tap_count",min_taps:8,bilateral:false},
          ui:{
            primitive:"walking_pace_indicator",
            props:{target_steps:8,pattern:"right_only",pace_bpm:60}
          },
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Atención unilateral contralateral",
      ic:"body",br:null
    },
    {
      l:"Cierre Estable",r:"110–150s",s:110,e:150,
      k:"Detente. Pies firmes. Aquí.",
      i:"Detente donde estés. Pies firmes en el suelo. Mantén las palmas presionadas: 'Aquí. Reset.'",
      iExec:[
        {
          from:0,to:40,
          text:"Detente. Pies firmes. Mantén las palmas presionadas. 'Aquí. Reset.'",
          type:"commitment_motor",
          mechanism:"Detención + anclaje propioceptivo cierra ciclo ambulatorio (Bryan, Adams, Monin 2013)",
          duration:{min_ms:30000,target_ms:35000,max_ms:45000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{
            primitive:"hold_press_button",
            props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Aquí. Reset."}
          },
          media:{
            breath_ticks:{enabled:false},
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Detención + anclaje propioceptivo (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]},

  /* ═══ #25 CARDIAC PULSE MATCH · Calma vía interocepción cardíaca (Phase 5 SP5) ═══
     Resonance frequency breathing 5.5rpm + heartbeat detection task explícita.
     4 fases × 1 acto = 4 actos: encontrar pulso → conteo (Schandry task) →
     sincronía pulso-respiración → cierre coherente.
     Mecanismos: Lehrer 2014 (resonance breathing) + Garfinkel 2015 (heartbeat
     detection) + Khalsa 2018 (interocepción roadmap).
     Validate acto 2: min_duration vía interval_ms=30000 (Schandry-style).
     PulseMatchVisual no expone count, así que validation se delega al timing
     del intervalo. Outcome equivalente al spec original tap_count:30. */
  {id:25,n:"Cardiac Pulse Match",ct:"Calma",d:150,sb:"Interocepción cardíaca instrumentada",tg:"CP",cl:"#22D3EE",int:"calma",dif:2,useCase:"active",
  ph:[
    {
      l:"Encontrar Pulso",r:"0–25s",s:0,e:25,
      k:"Dedos índice + medio en muñeca. Encuentra pulso radial.",
      i:"Coloca dedos índice y medio en tu muñeca opuesta, 2 dedos abajo de la base del pulgar. Encuentra el pulso radial.",
      iExec:[
        {
          from:0,to:25,
          text:"Dedos índice y medio en muñeca opuesta. Encuentra pulso radial.",
          type:"cardiac_interoception",
          mechanism:"Localización pulso radial activa interocepción cardíaca explícita (Garfinkel 2015)",
          duration:{min_ms:18000,target_ms:22000,max_ms:30000},
          validate:{kind:"min_duration",min_ms:18000},
          ui:{
            primitive:"text_emphasis_voice",
            props:{
              text:"Encuentra el pulso radial.",
              subtext:"Dedos en muñeca opuesta."
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"start",type:"calma"},
            signature:{kind:"phaseShift",fire_at:"start"}
          }
        }
      ],
      sc:"Localización pulso radial activa interocepción cardíaca explícita (Garfinkel 2015)",
      ic:"body",br:null
    },
    {
      l:"Conteo de Latidos",r:"25–65s",s:25,e:65,
      k:"Cuenta latidos durante 30s. Tap cada uno.",
      i:"Mantén dedos en pulso. Cuenta cada latido durante 30 segundos. Tap cada vez que sientas un latido.",
      iExec:[
        {
          from:0,to:40,
          text:"Cuenta latidos durante 30 segundos. Tap cada latido.",
          type:"cardiac_interoception",
          mechanism:"Heartbeat detection task valida accuracy interocéptiva + activa ínsula posterior (Garfinkel 2015 Biological Psychology; Schandry 1981 Psychophysiology)",
          duration:{min_ms:32000,target_ms:35000,max_ms:45000},
          validate:{kind:"min_duration",min_ms:30000},
          ui:{
            primitive:"pulse_match_visual",
            props:{
              mode:"count_only",
              interval_ms:30000,
              target_breaths:0
            }
          },
          media:{
            voice:{enabled_default:false},
            breath_ticks:{enabled:false},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Heartbeat detection task (Garfinkel 2015; Schandry 1981)",
      ic:"body",br:null
    },
    {
      l:"Sincronía Cardíaca",r:"65–125s",s:65,e:125,
      k:"Respira 5.5rpm. Pulso sincronizado.",
      i:"Mantén dedos en pulso. Respira a ritmo lento (5.5rpm = inhala 5.5s, exhala 5.5s). Atención al pulso sincronizando con respiración.",
      iExec:[
        {
          from:0,to:60,
          text:"Inhala 5.5s. Exhala 5.5s. Atención al pulso sincronizando con respiración. Cinco ciclos.",
          type:"breath",
          mechanism:"Respiración a frecuencia de resonancia 5.5rpm + interocepción cardíaca explícita maximiza HRV vía resonancia barorrefleja (Lehrer 2014; Khalsa 2018)",
          duration:{min_ms:50000,target_ms:60000,max_ms:72000},
          validate:{kind:"min_duration",min_ms:50000},
          ui:{
            primitive:"pulse_match_visual",
            props:{
              mode:"match_breathing",
              target_breaths:5,
              interval_ms:11000
            }
          },
          media:{
            breath_ticks:{enabled:true,auto_sync:true},
            binaural:{action:"continue"}
          }
        }
      ],
      sc:"Respiración 5.5rpm + interocepción cardíaca maximiza HRV (Lehrer 2014; Khalsa 2018)",
      ic:"breath",br:{in:5,h1:0,ex:6,h2:0}
    },
    {
      l:"Cierre Coherente",r:"125–150s",s:125,e:150,
      k:"Coherencia sostenida. Sigo.",
      i:"Suelta el pulso. Mantén las palmas firmes contra el pecho. 'Coherencia. Sigo.'",
      iExec:[
        {
          from:0,to:25,
          text:"Suelta el pulso. Mantén las palmas firmes contra el pecho. 'Coherencia. Sigo.'",
          type:"commitment_motor",
          mechanism:"Anclaje cardíaco + commitment motor consolida estado coherente (Bryan, Adams, Monin 2013)",
          duration:{min_ms:18000,target_ms:22000,max_ms:30000},
          validate:{kind:"hold_press",min_hold_ms:5000},
          ui:{
            primitive:"hold_press_button",
            props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Coherencia. Sigo."}
          },
          media:{
            binaural:{action:"stop"},
            cue:{type:"ok",fire_at:"end"}
          }
        }
      ],
      sc:"Anclaje cardíaco + commitment motor (Bryan, Adams, Monin 2013)",
      ic:"body",br:null
    }
  ]}
];

export const SCIENCE_DEEP = {
  1: "La respiración box (4-4-4-4) activa el complejo vagal ventral, la rama del nervio vago responsable de la conexión social y la calma. Cuando inhalas y sostienes, aumentas la presión intratorácica que estimula los barorreceptores aórticos, enviando señales de 'seguridad' al tronco cerebral. La fase de desplazamiento de carga usa principios de terapia cognitiva: externalizar el pensamiento reduce la rumiación del córtex cingulado anterior.",
  2: "La respiración 6-2-8 genera coherencia cardíaca — un estado donde el corazón, la respiración y el sistema nervioso sincronizan sus ritmos. El etiquetado emocional (affect labeling) tiene respaldo en neuroimagen: nombrar una emoción reduce la activación amigdalar hasta un 40% y activa la corteza prefrontal ventrolateral, que regula las emociones.",
  3: "Las exhalaciones largas (ratio 1:3) activan directamente el sistema parasimpático. El triángulo de prioridad aplica la matriz de Eisenhower de forma embodied — al conectar la decisión con el cuerpo (cerrar el puño), se activa la memoria procedimental, que tiene mayor tasa de ejecución que la decisión puramente mental.",
  4: "El movimiento rítmico bilateral (marcha estática) cruza la línea media del cuerpo, activando ambos hemisferios. La apertura torácica revierte la postura de estrés (hombros cerrados, respiración superficial) y la contracción-liberación usa relajación muscular progresiva de Jacobson.",
  5: "La visión panorámica desactiva el sistema visual de amenazas (visión de túnel). El cambio de foco cerca-lejos reinicia el sistema atencional de la corteza parietal posterior. Estos protocolos oculomotores están basados en investigación de Andrew Huberman sobre regulación del estado de alerta.",
  6: "La postura erguida modifica los niveles de cortisol y testosterona en menos de 2 minutos (Carney et al.). La respiración triangular (ratio 1:1:2) equilibra el sistema simpático-parasimpático. La microtensión sostenida activa los propioceptores de Golgi, que generan sensación de estabilidad y control.",
  7: "La percusión esternal rítmica funciona como anclaje atencional somático: el cuerpo recibe input táctil predecible que redirige la atención del rumiar mental hacia centros corporales. La contracción isométrica al 10% activa propioceptores sin gasto energético (Levine, Somatic Experiencing 2010). La exhalación invertida es el componente vagal real del protocolo.",
  8: "Los movimientos oculares horizontales rápidos producen reset atencional por cambio forzado de fijación visual (atentional capture). Este protocolo NO es equivalente a EMDR clínica que requiere protocolo terapéutico extendido. La fijación visual sostenida activa corteza prefrontal dorsolateral. El mantra repetitivo elimina multitarea neural.",
  9: "El exhale explosivo activa cambio de presión torácica que estimula barorreceptores (mecanismo vagal real). La activación del transverso abdominal genera estabilidad postural via propiocepción de Golgi. La alineación vertebral activa cadena propioceptiva del eje.",
  10: "Los micro-pulsos respiratorios activan coordinación neuromotora del diafragma. El barrido corporal (body scan) activa ínsula anterior, centro de interocepción documentado por Khalsa et al. 2018 y Critchley 2013. La pulsación táctil rítmica de los dedos activa cortex S1/S2 sin generar fatiga, sostiene atención focalizada en input propioceptivo.",
  11: "El exhale con fuerza hacia abajo conecta diafragma con suelo pélvico generando estabilidad postural central. La relajación progresiva descendente sigue patrón natural de descarga parasimpática. La visualización de expansión corporal mantiene foco interocéptivo sustained sin output motor.",
  12: "Respiración diafragmática 4-2-6 con dirección somática reduce activación simpática (Zaccaro et al. 2018). Body scan postural secuencial activa propiocepción + ínsula anterior (Khalsa et al. 2018, Mehling et al. 2009). Atención focalizada single-task reduce decision fatigue (Baumeister 2008). Compromiso motor + verbalización mental ancla intención en memoria procedimental (Bryan, Adams, Monin 2013, Journal of Personality and Social Psychology). Cero claims metafísicos: no 'elevación de conciencia 5cm sobre la cabeza', no cross-body movements (Brain Gym desacreditado, Hyatt 2007).",
  15: "El suspiro fisiológico es el único patrón respiratorio que produce descarga parasimpática aguda con evidencia RCT directa. Balban et al. 2023 (Stanford, Cell Reports Medicine) demostraron que 5 min/día durante 28 días superó a meditación de atención focalizada en reducción de ansiedad estado y mejora de afecto positivo. La doble inhalación reinfla alvéolos colapsados durante estrés y la exhalación prolongada activa los baroreceptores pulmonares.",
  16: "La respiración a frecuencia de resonancia (~5.5 rpm para la mayoría de adultos) induce un estado donde el barorreflejo entra en resonancia con el ritmo respiratorio. Vaschillo et al. 2006 documentaron que en este estado la amplitud de HRV se multiplica por 2-3x. Lehrer & Gevirtz 2014 muestran que 4 semanas de práctica (20 min/día) mejoran la ganancia baroreflex de forma sostenida. El meta-análisis de Goessl et al. 2017 (N=1868) reporta d=0.83 en reducción de ansiedad-estrés, uno de los efectos más grandes documentados para una intervención no-farmacológica.",
  17: "NSDR (Non-Sleep Deep Rest) y Yoga Nidra están entre las pocas prácticas con evidencia directa en neuroimagen. Kjaer et al. 2002 (Cognitive Brain Research) usando PET [11C]raclopride documentaron un incremento del 65% en dopamina endógena durante el estado hipnagógico de yoga nidra. Datta et al. 2017 muestran mejora en calidad de sueño en insomnio crónico. El barrido corporal activa la ínsula (centro de interocepción) sin inducir la inercia de sueño que sí produce una siesta >30 min.",
  18: "Emergency Reset es activación motora bilateral acelerada — el inverso de la respiración consciente. En crisis aguda, el sistema simpático bloquea el control respiratorio voluntario; pedir 'respira lento' a alguien en pánico es contraproducente. Berceli (TRE 2008) y la línea Somatic Experiencing de Levine usan vibración muscular voluntaria para liberar tensión almacenada en psoas y diafragma. La vocalización audible activa la rama vagal ventral por estimulación del nervio laríngeo recurrente (Porges 2011). El cierre con anclaje sensorial (nominar un objeto, decir frases firmes) reactiva la corteza prefrontal por compromiso verbal, reduciendo la activación amigdalar.",
  19: "Panic Interrupt combina tres mecanismos vagales ejecutables en cualquier contexto sin infraestructura externa. Vocalización grave sostenida activa el nervio laríngeo recurrente (rama vagal) por estimulación laríngea + extensión exhalatoria parasimpática (Porges 2009, polyvagal theory). Apnea voluntaria breve de 4–6 s incrementa el tono vagal por reflejo barorreceptor durante la pausa inspiratoria (Lemaitre 2008 documentó el patrón en breath-hold divers; en no-divers la magnitud es menor pero medible en HRV). La presión frontal con los dedos durante la apnea estimula el nervio trigémino indirectamente sin estrés térmico. El cierre con palmas al pecho + afirmación verbal ancla propiocepción central + reactiva córtex prefrontal por compromiso verbal. Diseñado para pánico agudo donde respirar lento ya no es opción y donde el user no puede desplazarse a buscar herramientas externas: sinergia de tres mecanismos vagales en serie con disponibilidad universal.",
  20: "Block Break combina power pose (Carney et al. 2010, efecto subjetivo robusto en réplicas), activación motora bilateral de alta intensidad (Knab & Lightfoot 2010 — eleva BDNF y dopamina central), y descarga isométrica máxima por contracción-liberación. La descarga isométrica activa el reflejo miotático inverso (Golgi tendon organ): tras 10 segundos de contracción al 100%, el órgano de Golgi inhibe la motoneurona y produce una caída brusca del tono muscular acompañada de activación parasimpática post-isometric. Es el patrón usado en PRT (Progressive Resistance Training) clínico para desbloqueo somatomotor en estados de inercia cognitiva.",
  21: "Threshold Crossing instrumenta el doorway effect documentado por Radvansky (2006 Memory & Cognition; 2010 Cognition; 2011 QJEP) dentro del marco de event segmentation theory (Zacks 2007 Psychological Bulletin). Cruzar un umbral físico o mental marca un boundary que reorganiza working memory: en laboratorio, los sujetos olvidan más rápido la información del cuarto anterior tras cruzar una puerta. La aplicación es de instrumentación, no descubrimiento de mecanismo nuevo: identificar el estado cargado, visualizar el cruce y consolidar con commitment motor (Bryan, Adams, Monin 2013) explota el efecto de forma intencional para limpiar carga cognitiva entre tareas. Limitaciones honestas: el efecto es robusto en laboratorio pero magnitudes ecológicas varían (Pettijohn 2016); umbrales mentales visualizados tienen menos data directa que físicos. NO se reclama boost de productividad — solo transición cognitiva limpia. Disclaimer fotosensible obligatorio porque la fase 3 incluye un flash visual breve (<250 ms) que cumple WCAG 2.1 SC 2.3.1.",
  22: "Vagal Hum Reset combina tres mecanismos vagales documentados que se activan simultáneamente con humming sostenido. Primero: el humming activa el nervio laríngeo recurrente (rama del vago) por estimulación laríngea + extensión exhalatoria parasimpática (Porges 2009, polyvagal theory). Segundo: la vibración facial durante el humming estimula el nervio trigémino. Tercero: Maniscalco 2003 (European Respiratory Journal) documentó que el humming aumenta la producción de óxido nítrico nasal aproximadamente 15× vs respiración normal — efecto fisiológico medible inmediato. La práctica de Bhramari pranayama del yoga tradicional usa este mecanismo; la innovación de Bio-Ignición es la instrumentación timed con counter (4 humming sostenidos × 10s) + interocepción post-vocalización para consolidar el cambio fisiológico vía ínsula anterior (Khalsa 2018 Roadmap interoception). Limitación honesta: efectos downstream del NO (broncodilatación) requieren uso sostenido para ser clínicamente relevantes; en una sesión de 150s lo principal es activación parasimpática vía vagal. NO se reclama boost inmunológico ni efectos sistémicos no replicados.",
  23: "Power Pose Activation usa el efecto de feedback postural sin reclamar el efecto neuroendocrino disputed. El claim original Carney/Cuddy 2010 (Psychological Science) de que power poses aumentan testosterona y reducen cortisol NO se replica consistentemente — Ranehill 2015 con muestra mayor lo contradijo. Lo que SÍ se sostiene tras p-curve análisis (Cuddy 2018 Psychological Science) es el postural feedback effect: postura erguida modifica self-perception y proprioception central. Adicionalmente, respiración profunda 4:4 con postura erguida activa simpático moderado (Russo 2017 Breathe slow breathing review) y la activación isométrica del core refuerza propiocepción + estabilidad postural sostenida. El protocolo combina los tres factores documentados sin reclamar el efecto hormonal: cambio postural + respiración + isometric activan estado fisiológico de alerta moderada por mecanismos posturales y respiratorios documentados, no por elevación hormonal. 100% ejecutable sin infraestructura externa (cubículo, oficina, casa).",
  24: "Bilateral Walking Meditation instrumenta walking meditation tradicional (yoga / Buddhist) con atención unilateral alternante. Teut 2013 (Evidence-Based Complementary and Alternative Medicine) RCT documentó reducción de distress psicológico tras 4 semanas de práctica de mindful walking. Yang & Conroy 2018 (Psychology of Sport and Exercise) mostraron afecto negativo momentáneo menor durante mindful movement vs sentado quieto. La instrumentación de Bio-Ignición divide la caminata en dos fases unilaterales (8 pasos pie izquierdo + 8 pasos pie derecho con tap manual) para mantener focus alternante explícito, en contraste con bilateral attention difusa. Mecanismo: walking meditation combina circulación cerebral aumentada por marcha lenta + interocepción ambulatoria + atención corporal a los pies. Limitación honesta: efectos crónicos (4+ semanas) son los mejor documentados; single session de 150s tiene effects modestos pero medibles (reset cognitivo + reducción rumiación). NO se reclama mejora cognitiva sostenida ni cambio neuroplástico — sólo reset interocéptivo en sesión.",
  25: "Cardiac Pulse Match combina dos mecanismos documentados en serie. Primero, heartbeat detection task (Schandry 1981 Psychophysiology; Garfinkel 2015 Biological Psychology): el user cuenta latidos en una ventana de 30s palpando pulso radial, lo cual activa la ínsula posterior y entrena interoceptive accuracy. Segundo, respiración a frecuencia de resonancia ~5.5 rpm (Lehrer & Gevirtz 2014 Frontiers in Psychology; Vaschillo 2006 Applied Psychophysiology and Biofeedback): sostener 5-6 ciclos por minuto maximiza la amplitud de HRV vía resonancia barorrefleja, documentado en biofeedback HRV. La combinación instrumentada timed (heartbeat counting → resonance breathing con interocepción cardíaca sostenida) integra Khalsa 2018 (Roadmap interoception): un ciclo de awareness + accuracy en serie. Limitación honesta: ~10% de población no detecta pulso radial fácilmente (variant pulso carotídeo disponible); efectos clínicos de HRV training requieren semanas de práctica (Lehrer protocolo 20min/día × 4 semanas), no una sola sesión. En 150s, lo principal es el cambio fisiológico inmediato por respiración 5.5rpm + cierre interocéptivo. NO se reclama HRV training acute ni mejora cardíaca clínica.",
};

/* ═══════════════════════════════════════════════════════════════
   USE-CASE FILTERS — Phase 4 SP1
   Centralizan los filtros por useCase. Excluyen protocolos con
   `deprecated: true` (no hay actualmente, filtro safe).
   ═══════════════════════════════════════════════════════════════ */

export function getActiveProtocols() {
  return P.filter((p) => getUseCase(p) === "active" && !p.deprecated);
}

export function getCrisisProtocols() {
  return P.filter((p) => getUseCase(p) === "crisis" && !p.deprecated);
}

export function getTrainingProtocols() {
  return P.filter((p) => getUseCase(p) === "training" && !p.deprecated);
}
