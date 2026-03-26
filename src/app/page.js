"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — GENESIS+
   ═══════════════════════════════════════════════════════════════════
   3-2-1 Countdown · Pre-Session Mood · Before/After Comparison
   Personal Records · Ambient Brown Noise · Data Export
   + All GENESIS: Custom SVGs, Human Voice, Branded Timer, etc.
   ═══════════════════════════════════════════════════════════════════ */

function Ic({name,size=16,color="#64748B"}){const s={width:size,height:size,viewBox:"0 0 24 24",fill:"none",style:{display:"block",flexShrink:0}};const p={stroke:color,strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round"};
  if(name==="stress")return<svg {...s}><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" {...p}/><path d="M8 14s1.5-2 4-2 4 2 4 2" {...p}/><path d="M9 9L10 10M15 9l-1 1" {...p}/></svg>;
  if(name==="drain")return<svg {...s}><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10" {...p}/><path d="M8 15h8M9 9h.01M15 9h.01" {...p}/><path d="M17 17l3 3m0-3l-3 3" {...p}/></svg>;
  if(name==="neutral")return<svg {...s}><circle cx="12" cy="12" r="10" {...p}/><path d="M8 15h8M9 9h.01M15 9h.01" {...p}/></svg>;
  if(name==="sharp")return<svg {...s}><circle cx="12" cy="12" r="10" {...p}/><path d="M8 14s1.5 2 4 2 4-2 4-2" {...p}/><circle cx="9" cy="9" r="1" fill={color}/><circle cx="15" cy="9" r="1" fill={color}/></svg>;
  if(name==="peak")return<svg {...s}><circle cx="12" cy="12" r="10" {...p}/><path d="M8 14s1.5 2 4 2 4-2 4-2" {...p}/><path d="M7 8l2 2 2-2M13 8l2 2 2-2" {...p}/></svg>;
  if(name==="calm")return<svg {...s}><path d="M2 12C2 12 5 4 12 4s10 8 10 8-3 8-10 8S2 12 2 12z" {...p}/><circle cx="12" cy="12" r="3" {...p}/></svg>;
  if(name==="focus")return<svg {...s}><circle cx="12" cy="12" r="3" {...p}/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" {...p}/><path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" {...p} strokeWidth="1.2"/></svg>;
  if(name==="energy")return<svg {...s}><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" {...p} fill={color+"20"}/></svg>;
  if(name==="reset")return<svg {...s}><path d="M3 12a9 9 0 1 0 9-9" {...p}/><path d="M3 3v6h6" {...p}/></svg>;
  if(name==="breath")return<svg {...s}><circle cx="12" cy="12" r="8" {...p} strokeDasharray="4 3"/><circle cx="12" cy="12" r="3" fill={color} opacity=".25"/></svg>;
  if(name==="mind")return<svg {...s}><path d="M12 2a7 7 0 0 1 7 7c0 3-2 5-4 6.5V18a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2.5C7 14 5 12 5 9a7 7 0 0 1 7-7z" {...p}/><path d="M10 22h4" {...p}/></svg>;
  if(name==="body")return<svg {...s}><circle cx="12" cy="5" r="2" {...p}/><path d="M12 7v6M8 21l2-8M16 21l-2-8M8 11h8" {...p}/></svg>;
  if(name==="up")return<svg {...s}><path d="M12 19V5M5 12l7-7 7 7" {...p}/></svg>;
  if(name==="fire")return<svg {...s}><path d="M12 22c4 0 7-2.7 7-7 0-3.5-2.5-6.5-4-8-.7-1-1.5-2-2-3.5-.5 1.5-1.3 2.5-2 3.5-1.5 1.5-4 4.5-4 8 0 4.3 3 7 5 7z" {...p} fill={color+"15"}/></svg>;
  if(name==="rec")return<svg {...s}><path d="M5 12h14M12 5l7 7-7 7" {...p}/></svg>;
  if(name==="alert")return<svg {...s}><path d="M12 2L2 20h20L12 2z" {...p}/><path d="M12 9v4M12 17h.01" {...p}/></svg>;
  if(name==="star")return<svg {...s}><path d="M12 2l3 6 6.5 1-4.7 4.6L18 20l-6-3.2L6 20l1.2-6.4L2.5 9l6.5-1L12 2z" {...p} fill={color+"15"}/></svg>;
  if(name==="check")return<svg {...s}><path d="M20 6L9 17l-5-5" {...p} strokeWidth="2.5"/></svg>;
  if(name==="clock")return<svg {...s}><circle cx="12" cy="12" r="10" {...p}/><path d="M12 6v6l4 2" {...p}/></svg>;
  if(name==="bolt")return<svg {...s}><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" {...p}/></svg>;
  if(name==="chart")return<svg {...s}><rect x="3" y="12" width="4" height="8" rx="1" {...p}/><rect x="10" y="8" width="4" height="12" rx="1" {...p}/><rect x="17" y="4" width="4" height="16" rx="1" {...p}/></svg>;
  if(name==="user")return<svg {...s}><circle cx="12" cy="8" r="4" {...p}/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" {...p}/></svg>;
  if(name==="gear")return<svg {...s}><circle cx="12" cy="12" r="3" {...p}/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" {...p} strokeWidth="1.3"/></svg>;
  if(name==="brief")return<svg {...s}><rect x="2" y="5" width="20" height="16" rx="2" {...p}/><path d="M8 5V3.5A1.5 1.5 0 0 1 9.5 2h5A1.5 1.5 0 0 1 16 3.5V5" {...p}/></svg>;
  if(name==="export")return<svg {...s}><path d="M12 3v12M5 10l7 7 7-7" {...p}/><path d="M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" {...p}/></svg>;
  if(name==="trophy")return<svg {...s}><path d="M6 3h12v5a6 6 0 0 1-12 0V3z" {...p}/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3M9 14v2M15 14v2M7 18h10" {...p}/></svg>;
  return null;
}

const P=[
{id:1,n:"Reinicio Parasimpático",ct:"Reset",d:120,sb:"Restaura función ejecutiva",tg:"R1",cl:"#059669",int:"calma",dif:1,
ph:[{l:"Respiración Vagal Box",r:"0–20s",s:0,e:20,k:"Inhala 4s. Mantén 4s. Exhala 4s. Sostén 4s.",i:"Cierra los ojos. Inhala por la nariz, lento, 4 segundos — siente el aire llenar tu abdomen. Mantén 4 segundos sin tensión. Exhala por la boca, suave, 4 segundos. Quédate vacío 4 segundos. Repite el ciclo.",sc:"Activa el complejo vagal ventral, reduce frecuencia cardíaca",ic:"breath",br:{in:4,h1:4,ex:4,h2:4}},
{l:"Desplazamiento de Carga",r:"20–70s",s:20,e:70,k:"¿Depende de mí? Sí → actúa. No → suéltalo.",i:"Identifica el pensamiento que más pesa ahora mismo. Pregúntate: ¿esto depende de mí? Si sí: elige una micro-acción concreta que puedas hacer en los próximos 30 minutos. Si no: di internamente 'Lo suelto por 24 horas' y déjalo ir.",sc:"Interrumpe el circuito de rumiación del córtex cingulado",ic:"mind",br:null},
{l:"Foco Unidireccional",r:"70–120s",s:70,e:120,k:"Una acción. La más importante. Visualízala.",i:"Pregúntate: ¿cuál es la única acción que, si la hago, hace todo lo demás más fácil o innecesario? Visualiza esa acción con claridad. Siente la certeza de que vas a hacerla. Abre los ojos con dirección.",sc:"Libera dopamina direccional hacia la corteza prefrontal",ic:"focus",br:null}]},
{id:2,n:"Activación Cognitiva",ct:"Activación",d:120,sb:"Enfoque y autorregulación",tg:"AC",cl:"#6366F1",int:"enfoque",dif:1,
ph:[{l:"Respiración 6-2-8",r:"0–30s",s:0,e:30,k:"Inhala 6s. Mantén 2s. Exhala 8s.",i:"Inhala profundamente por la nariz durante 6 segundos. Siente cómo se expande tu abdomen y costillas. Mantén el aire 2 segundos. Exhala lentamente por la boca durante 8 segundos, como si soplaras a través de una pajita invisible.",sc:"Genera coherencia cardíaca y mejora la variabilidad de frecuencia cardíaca",ic:"breath",br:{in:6,h1:2,ex:8,h2:0}},
{l:"Etiquetado Emocional",r:"30–70s",s:30,e:70,k:"¿Qué siento exactamente? Nombra la emoción.",i:"Escanea tu cuerpo. ¿Qué sientes exactamente? No 'mal' o 'estresado' — busca la palabra precisa: ¿frustración? ¿agotamiento? ¿incertidumbre? ¿impaciencia? Nombrar la emoción con precisión reduce su intensidad inmediatamente.",sc:"El etiquetado verbal reduce la activación amigdalar hasta un 40%",ic:"mind",br:null},
{l:"Mini-Visualización",r:"70–120s",s:70,e:120,k:"Visualízate resolviendo con calma. Hoy avanzo.",i:"Cierra los ojos. Visualízate dentro de 2 horas, habiendo resuelto tu tarea principal con calma y claridad. Observa tu postura, tu expresión facial, tu energía. Di internamente: 'Hoy avanzo, paso a paso.'",sc:"La visualización activa dopamina orientada a objetivos futuros",ic:"focus",br:null}]},
{id:3,n:"Reset Ejecutivo",ct:"Reset",d:120,sb:"Para líderes bajo presión",tg:"RE",cl:"#059669",int:"reset",dif:1,
ph:[{l:"Exhalación Extendida",r:"0–20s",s:0,e:20,k:"Inhala rápido por la nariz, 2 segundos",i:"Inhala rápido por la nariz, 2 segundos. Exhala muy lento por la boca, 6 segundos — como si desinflaras globo. Siente cómo tu cuerpo se relaja con cada exhalación. Repite 3 veces.",sc:"Estimulación vagal rápida, activa el sistema parasimpático en menos de 20 segundos",ic:"breath",br:{in:2,h1:0,ex:6,h2:0}},
{l:"Triángulo de Prioridad",r:"20–60s",s:20,e:60,k:"Piensa en tus 3 tareas pendientes más urgentes",i:"Piensa en tus 3 tareas pendientes más urgentes. Para cada una pregunta: ¿Es importante o solo urgente? ¿Puedo eliminarlo? ¿Puedo delegarlo? Quédate solo con lo que es genuinamente importante y depende de ti.",sc:"Desactiva la multitarea y reduce la carga cognitiva del córtex prefrontal",ic:"mind",br:null},
{l:"Micro-Compromiso",r:"60–120s",s:60,e:120,k:"Elige UNA sola tarea para los próximos 60 minutos",i:"Elige UNA sola tarea para los próximos 60 minutos. Solo una. Cierra el puño con firmeza y di internamente: 'Los próximos 60 minutos son para esto.' Siente la decisión en tu cuerpo. Abre los ojos.",sc:"Activa la memoria procedimental y el compromiso motor",ic:"focus",br:null}]},
{id:4,n:"Pulse Shift",ct:"Activación",d:120,sb:"Reset neurocardíaco",tg:"PS",cl:"#6366F1",int:"energia",dif:2,
ph:[{l:"Marcha Estática",r:"0–30s",s:0,e:30,k:"De pie o sentado, alterna elevar cada talón rítmicam...",i:"De pie o sentado, alterna elevar cada talón rítmicamente contra el suelo. Encuentra un ritmo constante, como un metrónomo interno. Siente cómo el movimiento sube por tus piernas y activa tu centro.",sc:"Rompe el congelamiento corporal, incrementa flujo sanguíneo cerebral",ic:"body",br:null},
{l:"Apertura Torácica",r:"30–60s",s:30,e:60,k:"Lleva las manos detrás de la cabeza, codos abiertos",i:"Lleva las manos detrás de la cabeza, codos abiertos. Inhala expandiendo el pecho al máximo, 4 segundos. Mantén 1 segundo sintiendo la amplitud. Exhala relajando los hombros, 5 segundos. Repite con cada ciclo más profundo.",sc:"Incrementa oxigenación cerebral y corrige postura de estrés",ic:"breath",br:{in:4,h1:1,ex:5,h2:0}},
{l:"Contracción y Liberación",r:"60–120s",s:60,e:120,k:"Cierra ambos puños con fuerza moderada, 3 segundos",i:"Cierra ambos puños con fuerza moderada, 3 segundos. Siente la tensión subir por tus antebrazos. Ahora suelta todo de golpe con una exhalación larga de 7 segundos. Repite 3 veces — cada vez la liberación es más profunda.",sc:"Técnica de relajación progresiva, libera tensión acumulada del sistema nervioso",ic:"body",br:null}]},
{id:5,n:"Skyline Focus",ct:"Activación",d:120,sb:"Recalibración visual-cognitiva",tg:"SF",cl:"#6366F1",int:"enfoque",dif:1,
ph:[{l:"Vista al Horizonte",r:"0–20s",s:0,e:20,k:"Busca el punto más lejano que puedas ver — una venta...",i:"Busca el punto más lejano que puedas ver — una ventana, un edificio, el cielo. Fija la mirada ahí sin forzar. Deja que tus ojos se relajen mientras observan la distancia. Nota cómo tu respiración se calma automáticamente.",sc:"Relaja el nervio oculomotor y reduce la tensión visual acumulada por pantallas",ic:"focus",br:null},
{l:"Enfoque Dual",r:"20–50s",s:20,e:50,k:"Mira tu mano a 30cm de tu cara durante 5 segundos",i:"Mira tu mano a 30cm de tu cara durante 5 segundos. Ahora cambia al punto más lejano, 5 segundos. Alterna 3 veces. Con cada cambio, nota cómo tus ojos recalibran la profundidad — esto reinicia tu sistema atencional.",sc:"Reinicia el sistema de enfoque visual y atencional del cerebro",ic:"focus",br:null},
{l:"Enfoque Unidireccional",r:"50–120s",s:50,e:120,k:"Cierra los ojos",i:"Cierra los ojos. Piensa en UNA sola tarea que vas a hacer después de esta sesión. Visualiza exactamente qué vas a hacer, dónde, cómo. Di internamente: 'Una tarea. Un resultado. Un avance.' Repite hasta que se sienta real.",sc:"Canaliza dopamina hacia un objetivo específico y concreto",ic:"focus",br:null}]},
{id:6,n:"Grounded Steel",ct:"Protocolo",d:120,sb:"Presencia ejecutiva",tg:"GS",cl:"#0D9488",int:"calma",dif:2,
ph:[{l:"Postura de Acero",r:"0–20s",s:0,e:20,k:"Planta ambos pies firmemente en el suelo",i:"Planta ambos pies firmemente en el suelo. Siente el peso distribuirse. Espalda recta pero sin rigidez — como si un hilo invisible tirara de tu coronilla hacia arriba. Barbilla ligeramente hacia abajo. Hombros lejos de las orejas. Respira.",sc:"La postura erguida suprime la respuesta de inseguridad en menos de 15 segundos",ic:"body",br:null},
{l:"Respiración Triangular",r:"20–60s",s:20,e:60,k:"Inhala por la nariz 3 segundos",i:"Inhala por la nariz 3 segundos. Mantén el aire 3 segundos — sin tensión, solo pausa. Exhala por la boca 6 segundos, el doble de lento. Repite 3 ciclos completos. Con cada ciclo, siente más control y más calma.",sc:"Genera control emocional profundo y equilibrio autonómico",ic:"breath",br:{in:3,h1:3,ex:6,h2:0}},
{l:"Microtensión de Dominio",r:"60–120s",s:60,e:120,k:"Activa tu abdomen y glúteos al 15-20% de tu fuerza m...",i:"Activa tu abdomen y glúteos al 15-20% de tu fuerza máxima. No aprietes — solo activa. Mantén esta tensión mínima mientras respiras normalmente. Siente cómo esta base de fuerza te ancla al presente. Mantén hasta el final.",sc:"Reancla la atención al cuerpo presente, activa propioceptores de estabilidad",ic:"body",br:null}]},
{id:7,n:"HyperShift",ct:"Protocolo",d:120,sb:"Descarga emocional rápida",tg:"HS",cl:"#0D9488",int:"reset",dif:2,
ph:[{l:"Resonancia Torácica",r:"0–20s",s:0,e:20,k:"Coloca las yemas de los dedos sobre el esternón (cen...",i:"Coloca las yemas de los dedos sobre el esternón (centro del pecho). Golpea suavemente a un ritmo de 2-3 toques por segundo. Siente la vibración propagarse. Esta percusión desactiva la respuesta de lucha-huida del sistema nervioso.",sc:"Estimula el nervio vago a través de vibración torácica, desactiva alerta",ic:"body",br:null},
{l:"Contracción Latente",r:"20–60s",s:20,e:60,k:"Contrae TODO tu cuerpo al 10% — apenas perceptible",i:"Contrae TODO tu cuerpo al 10% — apenas perceptible. Manos, brazos, abdomen, piernas, mandíbula. Mantén 10 segundos. Ahora suelta completamente, 5 segundos. Repite 2 veces. Nota la diferencia entre tensión y liberación.",sc:"Rompe la ansiedad silenciosa que se acumula como tensión muscular inconsciente",ic:"body",br:null},
{l:"Exhalación Invertida",r:"60–120s",s:60,e:120,k:"Inhala corto por la nariz, 2 segundos",i:"Inhala corto por la nariz, 2 segundos. Exhala muy largo por la boca, 8 a 12 segundos — tan lento como puedas. Siente cómo cada exhalación larga te lleva más profundo a la calma. Repite 3 ciclos completos.",sc:"Exhalaciones largas activan directamente el sistema parasimpático de calma",ic:"breath",br:{in:2,h1:0,ex:10,h2:0}}]},
{id:8,n:"Lightning Focus",ct:"Activación",d:120,sb:"Enfoque extremo",tg:"LF",cl:"#6366F1",int:"enfoque",dif:3,
ph:[{l:"Barrido Ocular EMDR",r:"0–15s",s:0,e:15,k:"Sin mover la cabeza, mueve tus ojos rápidamente de i...",i:"Sin mover la cabeza, mueve tus ojos rápidamente de izquierda a derecha, 10 veces. Hazlo lo más rápido que puedas. Esto activa ambos hemisferios cerebrales simultáneamente y rompe patrones de pensamiento estancado.",sc:"Principio de EMDR (desensibilización), integra hemisferios cerebrales",ic:"focus",br:null},
{l:"Fijación Extrema",r:"15–45s",s:15,e:45,k:"Elige un punto fijo frente a ti — una esquina, un bo...",i:"Elige un punto fijo frente a ti — una esquina, un borde, un detalle. Míralo fijamente sin pestañear. Cuando sientas urgencia de pestañear, resiste 2 segundos más. Esto fuerza a tu corteza prefrontal a tomar el control total.",sc:"Activa masivamente la corteza prefrontal, centro del control ejecutivo",ic:"focus",br:null},
{l:"Comando Neural",r:"45–120s",s:45,e:120,k:"Cierra los ojos",i:"Cierra los ojos. Repite internamente con convicción: 'Aquí. Ahora. Una sola tarea.' Cada repetición más lenta, más firme. Si tu mente divaga, vuelve sin juicio. 10 a 12 repeticiones. Al final, deberías sentir un enfoque de láser.",sc:"Elimina la multitarea neural y dirige toda la energía cognitiva a un punto",ic:"mind",br:null}]},
{id:9,n:"Steel Core Reset",ct:"Reset",d:120,sb:"Reinicio nervioso máximo",tg:"SC",cl:"#059669",int:"reset",dif:3,
ph:[{l:"Steel Breath",r:"0–20s",s:0,e:20,k:"Inhala profundamente 4 segundos llenando el abdomen",i:"Inhala profundamente 4 segundos llenando el abdomen. Mantén 2 segundos creando presión interna. Exhala EXPLOSIVAMENTE por la boca — todo el aire de golpe, como si apagaras 50 velas. Repite 3 veces. Siente el reset en tu sistema.",sc:"El exhale explosivo resetea el sistema nervioso autónomo por completo",ic:"breath",br:{in:4,h1:2,ex:2,h2:0}},
{l:"Núcleo de Acero",r:"20–60s",s:20,e:60,k:"Activa tu abdomen al 30-40% de tu fuerza máxima",i:"Activa tu abdomen al 30-40% de tu fuerza máxima. No contengas la respiración — respira normalmente con el abdomen activado. Mantén 10 segundos. Suelta 5 segundos. Repite 2 veces. Siente la fuerza emocional que viene del centro.",sc:"La activación del core genera sensación de fuerza emocional y estabilidad",ic:"body",br:null},
{l:"Alineamiento Vertical",r:"60–120s",s:60,e:120,k:"Imagina que tu columna vertebral es una barra de ace...",i:"Imagina que tu columna vertebral es una barra de acero indestructible. Desde el sacro hasta la coronilla — recta, firme, poderosa. Siente cada vértebra apilada con precisión. Mantén esta imagen y esta postura. Respira con presencia total.",sc:"Activa propioceptores de la columna, genera presencia y confianza somática",ic:"body",br:null}]},
{id:10,n:"Atomic Pulse",ct:"Activación",d:120,sb:"Activación sensorial fina",tg:"AP",cl:"#6366F1",int:"energia",dif:2,
ph:[{l:"Encendido Pulmonar",r:"0–20s",s:0,e:20,k:"Inhala profundamente 4 segundos",i:"Inhala profundamente 4 segundos. Al exhalar, hazlo en 5 micro-pulsos cortos — como 5 pequeñas ráfagas de aire rápidas. Esto activa el diafragma de forma diferente a la respiración normal. Repite 3 ciclos.",sc:"Activa la coordinación sensoriomotora fina del sistema respiratorio",ic:"breath",br:{in:4,h1:0,ex:4,h2:0}},
{l:"Barrido Atómico",r:"20–60s",s:20,e:60,k:"Cierra los ojos",i:"Cierra los ojos. Lleva tu atención a los pies — siente el contacto con el suelo. Sube al abdomen — nota el calor. Recorre los brazos hasta las puntas de los dedos — siente el hormigueo. Llega a la cabeza. Sostén la sensación completa del cuerpo.",sc:"Activa la ínsula, centro cerebral de la interocepción y conciencia corporal",ic:"body",br:null},
{l:"Pulsación Subatómica",r:"60–120s",s:60,e:120,k:"Cierra las manos al 10% de fuerza — apenas perceptible",i:"Cierra las manos al 10% de fuerza — apenas perceptible. Genera micro-pulsos con los dedos, 1 por segundo, durante 60 segundos. Cada pulso es mínimo pero consciente. Siente cómo esta repetición hipnótica sincroniza tu sistema nervioso.",sc:"Genera sincronización somatosensorial rítmica, induce estado de flow",ic:"body",br:null}]},
{id:11,n:"Quantum Grounding",ct:"Protocolo",d:120,sb:"Sólido e inquebrantable",tg:"QG",cl:"#0D9488",int:"calma",dif:2,
ph:[{l:"Anclaje de Diafragma",r:"0–20s",s:0,e:20,k:"Inhala profundamente expandiendo el diafragma",i:"Inhala profundamente expandiendo el diafragma. Mantén 1 segundo en el punto máximo. Exhala con FUERZA hacia abajo — como si empujaras el aire hacia el suelo. Siente la solidez. Repite 3 veces con más intensidad cada vez.",sc:"Estabiliza el eje respiratorio central, activa conexión diafragma-suelo pélvico",ic:"breath",br:{in:4,h1:1,ex:3,h2:0}},
{l:"Raíz Gravitacional",r:"20–60s",s:20,e:60,k:"Siente cómo tu peso cae naturalmente hacia la pelvis",i:"Siente cómo tu peso cae naturalmente hacia la pelvis. Deja que la gravedad haga el trabajo. Relaja los hombros un 20%. Relaja la cara un 10% — especialmente mandíbula y frente. Cada parte que relajas te ancla más al presente.",sc:"Activa la sensación de seguridad profunda a través del sistema propioceptivo",ic:"mind",br:null},
{l:"Expansión Cuántica",r:"60–120s",s:60,e:120,k:"Sin moverte físicamente, siente cómo tu espalda se e...",i:"Sin moverte físicamente, siente cómo tu espalda se expande 1 centímetro hacia atrás, hacia los lados, hacia arriba. No es movimiento — es intención. Siente tu presencia ocupar más espacio. Mantén esta expansión interna hasta el final.",sc:"Genera actividad de ondas alfa, asociadas con calma alerta y creatividad",ic:"mind",br:null}]},
{id:12,n:"Neural Ascension",ct:"Protocolo",d:120,sb:"Ascenso mental y claridad",tg:"NA",cl:"#0D9488",int:"enfoque",dif:2,
ph:[{l:"Respiración Vertical",r:"0–20s",s:0,e:20,k:"Al inhalar, imagina que el aire sube desde la pelvis...",i:"Al inhalar, imagina que el aire sube desde la pelvis hasta la coronilla, como una ola ascendente. Al exhalar, desciende de la cabeza a la pelvis. Haz 3 ciclos completos. Siente el eje vertical de tu cuerpo activarse.",sc:"Integra el eje mente-cuerpo, conecta sistema nervioso central",ic:"breath",br:{in:4,h1:0,ex:4,h2:0}},
{l:"Cruce Neural",r:"20–60s",s:20,e:60,k:"Mano derecha sobre pecho izquierdo",i:"Mano derecha sobre pecho izquierdo. Siente el latido. Mantén 10 segundos. Cambia: mano izquierda sobre costilla derecha. Mantén 10 segundos. Repite el cruce 2 veces. Esto fuerza la comunicación entre hemisferios cerebrales.",sc:"Activación interhemisférica forzada, mejora la integración cognitiva",ic:"body",br:null},
{l:"Ascensión Silenciosa",r:"60–120s",s:60,e:120,k:"Cierra los ojos",i:"Cierra los ojos. Respira normalmente. Imagina que tu punto de conciencia — el lugar desde donde observas — sube 5 centímetros por encima de tu cabeza. Observa todo desde ahí arriba. Los problemas se ven más pequeños. Mantén esa perspectiva.",sc:"Activa la red de modo por defecto en modo expansivo, genera metacognición",ic:"mind",br:null}]},
{id:13,n:"Protocolo OMEGA",ct:"Protocolo",d:120,sb:"Realineación neuronal completa",tg:"\u03A9",cl:"#0D9488",int:"reset",dif:3,
ph:[{l:"Vacío Inicial",r:"0–15s",s:0,e:15,k:"Inhala suavemente 4 segundos",i:"Inhala suavemente 4 segundos. Exhala largo 6 segundos. Haz una pausa de 2 segundos sin aire. Di internamente: 'Apago todo.' Siente cómo el silencio interno se expande.",sc:"Inhibe la amígdala y reduce la actividad del circuito de alarma",ic:"breath",br:{in:4,h1:0,ex:6,h2:2}},
{l:"Pulso del Núcleo",r:"15–30s",s:15,e:30,k:"Coloca una mano en el pecho, otra en el ombligo",i:"Coloca una mano en el pecho, otra en el ombligo. Siente ambos pulsos. Percibe la distancia entre ellos. Nota cómo late tu corazón — cada latido es tu sistema funcionando. Quédate ahí, solo sintiendo.",sc:"Genera coherencia entre el corazón y el cerebro entérico",ic:"body",br:null},
{l:"Realineación Neural",r:"30–55s",s:30,e:55,k:"Mueve solo los ojos: derecha, izquierda, arriba, abajo",i:"Mueve solo los ojos: derecha, izquierda, arriba, abajo. 3 segundos en cada dirección. Ahora imagina un sonido suave moviéndose de oreja a oreja. La combinación de movimiento ocular y sonido imaginario recalibra las redes bilaterales.",sc:"Activa redes bilaterales del cerebro, similar al sueño REM",ic:"focus",br:null},
{l:"Expansión Atómica",r:"55–80s",s:55,e:80,k:"Sin moverte, siente que tu cuerpo se expande 1 centí...",i:"Sin moverte, siente que tu cuerpo se expande 1 centímetro en todas las direcciones — como si tus límites físicos se difuminaran ligeramente. No fuerces. Solo permite. Nota cómo cambia tu percepción del espacio.",sc:"Activa la red de propioceptividad profunda y percepción espacial",ic:"mind",br:null},
{l:"Resonancia Microfina",r:"80–100s",s:80,e:100,k:"Con las manos abiertas, pulsa los dedos contra los p...",i:"Con las manos abiertas, pulsa los dedos contra los pulgares: 8 pulsos en 8 segundos, al 10% de fuerza. Descansa 2 segundos. Repite. Este ritmo micro-fino sincroniza tu sistema somatosensorial con tu atención.",sc:"Sincronización somatosensorial rítmica, genera coherencia neural",ic:"body",br:null},
{l:"Ascenso Omega",r:"100–120s",s:100,e:120,k:"Cierra los ojos",i:"Cierra los ojos. Tu punto de conciencia sube 5-7 centímetros sobre tu cabeza. Todo el ruido mental queda debajo. Aquí arriba hay silencio y claridad. Mantén esta perspectiva. Respira suave. Cuando abras los ojos, lleva esta calma contigo.",sc:"Activa meta-conciencia máxima, estado de observador puro",ic:"mind",br:null}]},
{id:14,n:"Protocolo OMNIA",ct:"Protocolo",d:120,sb:"Activación Humana Total",tg:"\u221E",cl:"#0D9488",int:"energia",dif:3,
ph:[{l:"Golpe de Silencio",r:"0–10s",s:0,e:10,k:"Inhala lento 4 segundos",i:"Inhala lento 4 segundos. Exhala largo 6 segundos. Sostén el vacío 2 segundos. Di internamente: 'Apago todo.' Siente cómo tu mente se aquieta en un instante.",sc:"Modo silencio neural, reduce actividad del cortex prefrontal lateral",ic:"breath",br:{in:4,h1:0,ex:6,h2:2}},
{l:"Presencia Doble",r:"10–25s",s:10,e:25,k:"Mano derecha en el pecho, izquierda en el abdomen",i:"Mano derecha en el pecho, izquierda en el abdomen. Siente ambos puntos simultáneamente. Percibe la distancia entre ellos. Nota cuál se mueve más con tu respiración. Esta doble atención entrena la ínsula cerebral.",sc:"Activa la ínsula y el precúneo, centros de conciencia corporal",ic:"body",br:null},
{l:"Cruce Neural Triple",r:"25–45s",s:25,e:45,k:"Simultáneamente: mueve los ojos en 4 direcciones (3 ...",i:"Simultáneamente: mueve los ojos en 4 direcciones (3 seg cada una), imagina un sonido que viaja de oreja a oreja, y mantén los meñiques al 15% de tensión. Tres canales sensoriales activados al mismo tiempo.",sc:"Triple sincronización sensorial: visual, auditiva y táctil simultánea",ic:"focus",br:null},
{l:"Ola Interna",r:"45–65s",s:45,e:65,k:"Cierra los ojos",i:"Cierra los ojos. Siente una ola de calor que nace en los pies y sube lentamente: pantorrillas, rodillas, muslos, abdomen, pecho, cuello, cabeza. No la fuerces — solo sigue su recorrido natural. Cuando llega arriba, deja que se disipe.",sc:"Activa la red frontoparietal de atención sostenida, integra todo el cuerpo",ic:"mind",br:null},
{l:"Eje Dorado",r:"65–90s",s:65,e:90,k:"Imagina una línea dorada que va desde tu sacro hasta...",i:"Imagina una línea dorada que va desde tu sacro hasta la coronilla de tu cabeza. Es un láser estable, brillante, poderoso. Siente cómo esta línea te mantiene erguido, centrado, inquebrantable. Cada respiración la hace más brillante.",sc:"Alineación propioceptiva vertical, genera presencia somática total",ic:"body",br:null},
{l:"Expansión Omega",r:"90–115s",s:90,e:115,k:"Tu conciencia se expande 20 a 40 centímetros alreded...",i:"Tu conciencia se expande 20 a 40 centímetros alrededor de tu cuerpo. Sientes los límites de tu presencia extenderse. No estás solo dentro de tu piel — tu campo de atención abarca todo a tu alrededor. Luminoso. Expandido. Presente.",sc:"Estado de metaestado expandido, asociado con flow y rendimiento óptimo",ic:"mind",br:null},
{l:"Sello OMNIA",r:"115–120s",s:115,e:120,k:"Di internamente con absoluta convicción: 'Estoy ence...",i:"Di internamente con absoluta convicción: 'Estoy encendido.' Abre los ojos lentamente. Mira el mundo como si lo vieras por primera vez. Lleva esta activación contigo.",sc:"Sello de activación neural, consolida el estado alcanzado",ic:"focus",br:null}]}
];

const CATS=["Reset","Activación","Protocolo"];const LVL=[{n:"INICIADO",m:0,mx:1,c:"#94A3B8"},{n:"OPERADOR",m:1,mx:10,c:"#6366F1"},{n:"EJECUTOR",m:10,mx:25,c:"#059669"},{n:"ESTRATEGA",m:25,mx:50,c:"#D97706"},{n:"COMANDANTE",m:50,mx:100,c:"#DC2626"},{n:"ARQUITECTO",m:100,mx:999,c:"#7C3AED"}];
function gL(s){let l=LVL[0];for(const v of LVL)if(s>=v.m)l=v;return l;}function lvPct(s){const l=gL(s);if(s>=l.mx)return 100;return Math.round(((s-l.m)/(l.mx-l.m))*100);}function nxtLv(s){const i=LVL.findIndex(l=>l.n===gL(s).n);return i<LVL.length-1?LVL[i+1]:null;}const DN=["L","M","X","J","V","S","D"];

const MOODS=[{id:1,label:"Tensión alta",icon:"stress",value:1,color:"#94A3B8"},{id:2,label:"Agotamiento",icon:"drain",value:2,color:"#78909C"},{id:3,label:"Estable",icon:"neutral",value:3,color:"#607D8B"},{id:4,label:"Enfocado",icon:"sharp",value:4,color:"#0D9488"},{id:5,label:"Óptimo",icon:"peak",value:5,color:"#059669"}];
const ENERGY_LEVELS=[{id:1,label:"Bajo",v:1},{id:2,label:"Medio",v:2},{id:3,label:"Alto",v:3}];
const WORK_TAGS=["Pre-reunión","Post-reunión","Inicio jornada","Mitad del día","Fin de jornada","Bajo presión","Pausa activa"];
const INTENTS=[{id:"calma",label:"Calma",icon:"calm",desc:"Reducir tensión",color:"#059669"},{id:"enfoque",label:"Enfoque",icon:"focus",desc:"Concentración",color:"#6366F1"},{id:"energia",label:"Energía",icon:"energy",desc:"Activación",color:"#D97706"},{id:"reset",label:"Reset",icon:"reset",desc:"Reinicio",color:"#0D9488"}];

const DS={totalSessions:0,streak:0,todaySessions:0,lastDate:null,weeklyData:[0,0,0,0,0,0,0],weekNum:null,coherencia:64,resiliencia:66,capacidad:73,achievements:[],vCores:0,history:[],totalTime:0,soundOn:true,hapticOn:true,themeMode:"auto",moodLog:[],firstDone:false,favs:[],prevWeekData:[0,0,0,0,0,0,0],progDay:0,soundscape:"off"};

function getDailyIgn(st){const d=new Date();const seed=d.getFullYear()*1000+d.getMonth()*50+d.getDate();const h=d.getHours();const lastMood=(st.moodLog||[]).slice(-1)[0]?.mood||3;let pool=P;if(h<10)pool=P.filter(p=>p.int==="calma"||p.int==="energia");else if(h<15)pool=P.filter(p=>p.int==="enfoque");else if(h<19)pool=P.filter(p=>p.int==="enfoque"||p.int==="reset");else pool=P.filter(p=>p.int==="calma"||p.int==="reset");if(lastMood<=2)pool=pool.filter(p=>p.dif<=2);const pick=pool[seed%pool.length]||P[0];const phrase=DAILY_PHRASES[seed%DAILY_PHRASES.length];return{proto:pick,phrase};}

// Soundscape generators
let _ssNode=null,_ssGain=null;
function startSoundscape(type){try{const c=gAC();if(!c||type==="off")return;if(c.state==="suspended")c.resume();stopSoundscape();_ssGain=c.createGain();_ssGain.gain.value=0;_ssGain.connect(c.destination);
if(type==="wind"){const bs=4096;_ssNode=c.createScriptProcessor?c.createScriptProcessor(bs,1,1):null;if(!_ssNode)return;let last=0;_ssNode.onaudioprocess=e=>{const o=e.outputBuffer.getChannelData(0);for(let i=0;i<o.length;i++){const w=Math.random()*2-1;last=(last+(0.01*w))/1.01;o[i]=last*2.5;}};_ssNode.connect(_ssGain);_ssGain.gain.linearRampToValueAtTime(0.08,c.currentTime+3);}
else if(type==="drone"){const o=c.createOscillator();const o2=c.createOscillator();o.type="sine";o.frequency.value=60;o2.type="sine";o2.frequency.value=90;o.connect(_ssGain);o2.connect(_ssGain);o.start();o2.start();_ssNode={disconnect:()=>{o.stop();o2.stop();o.disconnect();o2.disconnect();}};_ssGain.gain.linearRampToValueAtTime(0.04,c.currentTime+3);}
else if(type==="bnarl"){const o=c.createOscillator();const o2=c.createOscillator();o.type="sine";o.frequency.value=200;o2.type="sine";o2.frequency.value=210;const panL=c.createStereoPanner();const panR=c.createStereoPanner();panL.pan.value=-1;panR.pan.value=1;o.connect(panL);o2.connect(panR);panL.connect(_ssGain);panR.connect(_ssGain);o.start();o2.start();_ssNode={disconnect:()=>{o.stop();o2.stop();o.disconnect();o2.disconnect();panL.disconnect();panR.disconnect();}};_ssGain.gain.linearRampToValueAtTime(0.035,c.currentTime+3);}
}catch(e){}}
function stopSoundscape(){try{if(_ssGain){const c=gAC();if(c)_ssGain.gain.linearRampToValueAtTime(0,c.currentTime+1.5);}setTimeout(()=>{if(_ssNode){_ssNode.disconnect();_ssNode=null;}if(_ssGain){_ssGain.disconnect();_ssGain=null;}},1800);}catch(e){}}
const AM={streak7:"7 días de racha",streak30:"30 días consecutivos",coherencia90:"Coherencia >90%",sessions50:"50 sesiones",sessions100:"100 sesiones — Centurión",mood5:"Sesión en rendimiento óptimo",allProtos:"Probó los 14 protocolos",time60:"60 minutos totales invertidos",earlyBird:"Sesión antes de las 7am",nightOwl:"Sesión después de las 10pm"};
const STATUS_MSGS=[{min:0,max:40,label:"Calibrando",color:"#94A3B8"},{min:40,max:65,label:"Activación",color:"#6366F1"},{min:65,max:82,label:"Rendimiento",color:"#0D9488"},{min:82,max:100,label:"Óptimo",color:"#059669"}];
function getStatus(v){for(const s of STATUS_MSGS)if(v>=s.min&&v<s.max)return s;return STATUS_MSGS[3];}
const MID_MSGS=["Vas bien. Tu cuerpo siente el cambio.","El ruido mental baja. Sigue.","Estás construyendo claridad.","Tu sistema se recalibra.","Este momento es tuyo."];
const POST_MSGS=["Dos minutos bien invertidos. Tu cerebro lo nota.","Sesión potente. El efecto dura 60-90 minutos.","Hiciste algo que el 95% no hace: pausar para rendir.","Tu sistema acaba de recalibrarse.","Consistencia mata talento. Hoy sumaste."];
const GREETINGS=["Tu sistema está listo.","Cada sesión cuenta. Hoy puede ser la mejor.","Tu cerebro recuerda el hábito."];
function getWeekNum(){const d=new Date();const j=new Date(d.getFullYear(),0,1);return Math.ceil(((d-j)/864e5+j.getDay()+1)/7);}

function genIns(st){const r=[];if(st.totalSessions>0){const cG=st.coherencia-64;if(cG>10)r.push({t:"up",x:`Enfoque +${cG} puntos desde el inicio.`});const rG=st.resiliencia-66;if(rG>5)r.push({t:"up",x:`Calma sistémica +${rG}%.`});if(st.streak>=3)r.push({t:"fire",x:`${st.streak} días consecutivos. El hábito se consolida.`});if(st.totalTime>0)r.push({t:"star",x:`${Math.round(st.totalTime/60)} minutos invertidos en rendimiento.`});const ml=st.moodLog||[];if(ml.length>=3){const a=ml.slice(-3).reduce((a,m)=>a+m.mood,0)/3;if(a>=4)r.push({t:"up",x:"Tendencia emocional ascendente."});if(a<=2)r.push({t:"alert",x:"Tensión elevada detectada. Prioriza sesiones de Calma."});
  // Hour pattern detection
  const hrs=st.history?.slice(-10).map(h=>new Date(h.ts).getHours())||[];if(hrs.length>=5){const counts={};hrs.forEach(h=>{const b=Math.floor(h/3)*3;counts[b]=(counts[b]||0)+1;});const peak=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];if(peak&&peak[1]>=3){const peakH=parseInt(peak[0]);const now=new Date().getHours();if(Math.abs(now-peakH)<=2&&st.todaySessions===0)r.push({t:"rec",x:`Tu hora pico es ${peakH}:00-${peakH+3}:00. Aprovéchala ahora.`});}}
  }if(st.history?.length>=3){const l3=st.history.slice(-3);if(l3.every(h=>h.p===l3[0].p)){const o=P.find(p=>p.n!==l3[0].p);if(o)r.push({t:"rec",x:`Diversifica: prueba ${o.n}.`});}}}const h=new Date().getHours();if(!r.find(x=>x.t==="rec"))r.push({t:"rec",x:h<12?"Reset Ejecutivo ideal para la mañana.":h<17?"Protocolo OMEGA para la tarde.":"Reinicio Parasimpático para cerrar el día."});if(!r.length)r.push({t:"star",x:"Tu primera ignición te espera."});return r;}

function smartSuggest(st){const h=new Date().getHours();const lastMood=(st.moodLog||[]).slice(-1)[0]?.mood||3;const lastP=(st.history||[]).slice(-1)[0]?.p||"";let intent="calma";if(h>=6&&h<10)intent=lastMood<=2?"reset":"energia";else if(h>=10&&h<14)intent="enfoque";else if(h>=14&&h<18)intent=lastMood<=2?"calma":"enfoque";else intent="calma";const opts=P.filter(p=>p.int===intent&&p.n!==lastP);return opts.length?opts[Math.floor(Math.random()*opts.length)]:P[0];}

const DIF_LABELS=["Básico","Intermedio","Avanzado"];
const SOUNDSCAPES=[{id:"off",n:"Silencio"},{id:"wind",n:"Viento suave"},{id:"drone",n:"Drone tonal"},{id:"bnarl",n:"Binaural"}];
const DAILY_PHRASES=["Hoy tu sistema se recalibra.","120 segundos pueden cambiar las próximas 4 horas.","No meditas para escapar. Meditas para llegar.","Tu mente es el instrumento. Esta es la afinación.","El rendimiento empieza en la pausa.","Dos minutos de silencio interno. El mundo puede esperar.","No necesitas más tiempo. Necesitas más presencia.","La claridad no se busca. Se construye.","Este es tu momento de ventaja.","Tu cuerpo sabe resetear. Solo necesita permiso.","La calma no es debilidad. Es tecnología.","Hoy entrenas lo que nadie ve: tu mente.","120 segundos. Sin distracciones. Solo tú.","El ruido mental tiene un interruptor. Estás a punto de tocarlo."];
const PROG_7=[
  {day:1,pid:1,t:"Día 1: Respira",d:"Tu primera conexión con el sistema nervioso."},
  {day:2,pid:2,t:"Día 2: Enfoca",d:"Activa tu corteza prefrontal con intención."},
  {day:3,pid:3,t:"Día 3: Decide",d:"Aprende a priorizar bajo presión."},
  {day:4,pid:6,t:"Día 4: Ancla",d:"Presencia ejecutiva. Tu cuerpo como base."},
  {day:5,pid:8,t:"Día 5: Intensifica",d:"Enfoque extremo. Nivel avanzado."},
  {day:6,pid:13,t:"Día 6: Realinea",d:"Protocolo OMEGA completo. 6 fases."},
  {day:7,pid:14,t:"Día 7: Enciende",d:"OMNIA. Activación humana total."}
];
const SCIENCE_DEEP={
1:"La respiración box (4-4-4-4) activa el complejo vagal ventral, la rama del nervio vago responsable de la conexión social y la calma. Cuando inhalas y sostienes, aumentas la presión intratorácica que estimula los barorreceptores aórticos, enviando señales de 'seguridad' al tronco cerebral. La fase de desplazamiento de carga usa principios de terapia cognitiva: externalizar el pensamiento reduce la rumiación del córtex cingulado anterior.",
2:"La respiración 6-2-8 genera coherencia cardíaca — un estado donde el corazón, la respiración y el sistema nervioso sincronizan sus ritmos. El etiquetado emocional (affect labeling) tiene respaldo en neuroimagen: nombrar una emoción reduce la activación amigdalar hasta un 40% y activa la corteza prefrontal ventrolateral, que regula las emociones.",
3:"Las exhalaciones largas (ratio 1:3) activan directamente el sistema parasimpático. El triángulo de prioridad aplica la matriz de Eisenhower de forma embodied — al conectar la decisión con el cuerpo (cerrar el puño), se activa la memoria procedimental, que tiene mayor tasa de ejecución que la decisión puramente mental.",
4:"El movimiento rítmico bilateral (marcha estática) cruza la línea media del cuerpo, activando ambos hemisferios. La apertura torácica revierte la postura de estrés (hombros cerrados, respiración superficial) y la contracción-liberación usa relajación muscular progresiva de Jacobson.",
5:"La visión panorámica desactiva el sistema visual de amenazas (visión de túnel). El cambio de foco cerca-lejos reinicia el sistema atencional de la corteza parietal posterior. Estos protocolos oculomotores están basados en investigación de Andrew Huberman sobre regulación del estado de alerta.",
6:"La postura erguida modifica los niveles de cortisol y testosterona en menos de 2 minutos (Carney et al.). La respiración triangular (ratio 1:1:2) equilibra el sistema simpático-parasimpático. La microtensión sostenida activa los propioceptores de Golgi, que generan sensación de estabilidad y control.",
7:"La percusión esternal estimula el timo y activa el nervio vago por vibración mecánica. La contracción isométrica al 10% y posterior liberación es una técnica de descarga somática usada en SE (Somatic Experiencing) de Peter Levine para liberar tensión acumulada del trauma.",
8:"Los movimientos oculares bilaterales replican el principio del EMDR (Eye Movement Desensitization and Reprocessing), integrando ambos hemisferios. La fijación visual sostenida activa masivamente la corteza prefrontal dorsolateral — el centro de control ejecutivo y toma de decisiones.",
9:"El exhale explosivo resetea el tono vagal por cambio brusco de presión. La activación del core al 30-40% genera sensación de fuerza emocional porque los propioceptores abdominales están conectados al sistema límbico. La alineación vertebral activa la cadena propioceptiva completa.",
10:"Los micro-pulsos respiratorios activan el diafragma de forma no habitual, creando nuevas vías neuromotoras. El barrido corporal (body scan) activa la ínsula, que es el centro cerebral de la interocepción — la capacidad de sentir el interior del cuerpo. La pulsación rítmica induce estados similares al flow.",
11:"El exhale con fuerza hacia abajo conecta el diafragma con el suelo pélvico, creando un eje de estabilidad central. La relajación progresiva descendente (hombros→cara) sigue el patrón natural de descarga parasimpática. La expansión intencional genera ondas alfa (8-12Hz).",
12:"La respiración vertical usa imaginería guiada para conectar el eje pelvis-coronilla, integrando el sistema nervioso central. El cruce contralateral (mano derecha→pecho izquierdo) fuerza la comunicación interhemisférica a través del cuerpo calloso.",
13:"OMEGA combina 6 modalidades neurocientíficas en secuencia: regulación respiratoria, coherencia cardíaca, integración bilateral (EMDR), expansión propioceptiva, sincronización somatosensorial, y metacognición. Es el protocolo más completo del sistema.",
14:"OMNIA activa los 3 sistemas sensoriales simultáneamente (visual, auditivo, táctil) para generar una sincronización neural masiva. El eje dorado es una técnica de alineación propioceptiva usada en artes marciales internas. La expansión final busca el estado de 'conciencia testigo' descrito en la neurociencia contemplativa."
};

function getRecords(st){const h=st.history||[];const ml=st.moodLog||[];const bestStreak=Math.max(st.streak,...[st.streak]);const maxC=h.length?Math.max(...h.map(x=>x.c)):st.coherencia;const protos={};h.forEach(x=>{protos[x.p]=(protos[x.p]||0)+1;});const topProto=Object.entries(protos).sort((a,b)=>b[1]-a[1])[0];const hours=h.map(x=>new Date(x.ts).getHours()).filter(x=>x>0);const earliest=hours.length?Math.min(...hours):null;return{bestStreak,maxC,topProto:topProto?{n:topProto[0],c:topProto[1]}:null,earliest};}

// ─── AUDIO ────────────────────────────────────────────────
let _aC=null;
function gAC(){if(!_aC&&typeof window!=="undefined"){try{_aC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}return _aC;}
function playChord(f,d,v){try{const c=gAC();if(!c)return;if(c.state==="suspended")c.resume();f.forEach(fr=>{const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.type="sine";o.frequency.value=fr;g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime((v||.04)/f.length,c.currentTime+.08);g.gain.linearRampToValueAtTime(0,c.currentTime+d);o.start(c.currentTime);o.stop(c.currentTime+d);});}catch(e){}}

// Brown noise ambient loop
let _ambNode=null,_ambGain=null;
function startAmbient(){try{const c=gAC();if(!c)return;if(c.state==="suspended")c.resume();if(_ambNode)return;const bs=c.bufferSize||4096;_ambNode=c.createScriptProcessor?c.createScriptProcessor(bs,1,1):null;if(!_ambNode)return;_ambGain=c.createGain();_ambGain.gain.value=0;_ambGain.connect(c.destination);_ambNode.connect(_ambGain);let last=0;_ambNode.onaudioprocess=e=>{const o=e.outputBuffer.getChannelData(0);for(let i=0;i<o.length;i++){const w=Math.random()*2-1;last=(last+(0.02*w))/1.02;o[i]=last*3.5;}};_ambGain.gain.linearRampToValueAtTime(0.12,c.currentTime+2);}catch(e){}}
function stopAmbient(){try{if(_ambGain){const c=gAC();if(c)_ambGain.gain.linearRampToValueAtTime(0,c.currentTime+1);}setTimeout(()=>{if(_ambNode){_ambNode.disconnect();_ambNode=null;}if(_ambGain){_ambGain.disconnect();_ambGain=null;}},1200);}catch(e){}}

function hap(t,sO,hO){try{if(hO!==false&&typeof navigator!=="undefined"&&navigator.vibrate){if(t==="go")navigator.vibrate([20,40,20]);else if(t==="ph")navigator.vibrate(12);else if(t==="ok")navigator.vibrate([40,60,40,60,80]);else if(t==="tick")navigator.vibrate(5);else if(t==="tap")navigator.vibrate(8);}if(sO!==false){if(t==="go")playChord([432,648],.5,.05);else if(t==="ph")playChord([528,660,792],.5,.04);else if(t==="ok"){playChord([432,528,648,792],1.5,.06);setTimeout(()=>playChord([528,648,792],1.2,.025),300);}else if(t==="tap")playChord([440],.08,.02);}}catch(e){}}
function ldS(){try{if(typeof window!=="undefined"){const r=localStorage.getItem("bio-g2");if(r)return{...DS,...JSON.parse(r)};}}catch(e){}return DS;}
function svS(d){try{if(typeof window!=="undefined")localStorage.setItem("bio-g2",JSON.stringify(d));}catch(e){}}
function exportData(st){try{const blob=new Blob([JSON.stringify(st,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="bio-ignicion-data.json";a.click();URL.revokeObjectURL(url);}catch(e){}}

function exportNOM035(st){try{
  const ml=st.moodLog||[];const h=st.history||[];const now=new Date();
  const totalMin=Math.round((st.totalTime||0)/60);
  const avgMd=ml.length?+(ml.reduce((a,m)=>a+m.mood,0)/ml.length).toFixed(1):0;
  const avgEn=ml.filter(m=>m.energy).length?+(ml.filter(m=>m.energy).reduce((a,m)=>a+m.energy,0)/ml.filter(m=>m.energy).length).toFixed(1):0;
  const withPre=ml.filter(m=>m.pre>0);
  const delta=withPre.length?+(withPre.reduce((a,m)=>a+(m.mood-m.pre),0)/withPre.length).toFixed(2):0;
  const riskCount=ml.filter(m=>m.mood<=2).length;
  const riskPct=ml.length?Math.round((riskCount/ml.length)*100):0;
  const tags={};ml.forEach(m=>{if(m.tag){tags[m.tag]=(tags[m.tag]||0)+1;}});
  const topTags=Object.entries(tags).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const protos={};h.forEach(x=>{protos[x.p]=(protos[x.p]||0)+1;});
  const topProtos=Object.entries(protos).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const hrs=Array(24).fill(0);h.forEach(x=>{hrs[new Date(x.ts).getHours()]++;});
  const peakHr=hrs.indexOf(Math.max(...hrs));
  const uniqueDays=new Set(h.map(x=>new Date(x.ts).toDateString())).size;
  const freqPerWeek=uniqueDays>0?(st.totalSessions/(uniqueDays/7)).toFixed(1):"0";
  const moodByWeek=[];for(let i=0;i<Math.min(ml.length,28);i+=7){const slice=ml.slice(i,i+7);moodByWeek.push(+(slice.reduce((a,m)=>a+m.mood,0)/slice.length).toFixed(1));}
  const bestProto=withPre.length>=2?(()=>{const bp={};withPre.forEach(m=>{if(!bp[m.proto])bp[m.proto]={s:0,c:0};bp[m.proto].s+=m.mood-m.pre;bp[m.proto].c++;});const sorted=Object.entries(bp).sort((a,b)=>(b[1].s/b[1].c)-(a[1].s/a[1].c));return sorted[0]?sorted[0][0]+" (+"+(sorted[0][1].s/sorted[0][1].c).toFixed(1)+")":"N/D";})():"Datos insuficientes";

  const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe de Bienestar Laboral — NOM-035</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;background:#fff;padding:40px;max-width:800px;margin:0 auto;font-size:14px;line-height:1.6}
.header{border-bottom:3px solid #059669;padding-bottom:20px;margin-bottom:30px}.logo{font-size:24px;font-weight:800;color:#059669;letter-spacing:-0.5px}.sub{font-size:11px;color:#64748B;margin-top:4px;letter-spacing:2px;text-transform:uppercase}
.meta{display:flex;justify-content:space-between;margin-top:12px;font-size:11px;color:#475569}.badge{background:#059669;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700}
h2{font-size:16px;font-weight:800;color:#0F172A;margin:28px 0 14px;padding-bottom:6px;border-bottom:1px solid #E2E8F0}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}.card{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px}.card .v{font-size:22px;font-weight:800;color:#0F172A}.card .l{font-size:10px;color:#64748B;margin-top:2px;text-transform:uppercase;letter-spacing:1px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.risk{background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:14px;margin-bottom:20px}.risk .v{font-size:20px;font-weight:800;color:#DC2626}.risk .l{font-size:11px;color:#DC2626}
.ok{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;margin-bottom:20px}.ok .v{font-size:20px;font-weight:800;color:#059669}.ok .l{font-size:11px;color:#059669}
table{width:100%;border-collapse:collapse;margin-bottom:20px}th{text-align:left;padding:8px 10px;background:#F1F5F9;font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #E2E8F0}td{padding:8px 10px;border-bottom:1px solid #F1F5F9;font-size:12px}
.footer{margin-top:40px;padding-top:16px;border-top:2px solid #E2E8F0;font-size:10px;color:#94A3B8;text-align:center}
.imp{font-size:28px;font-weight:800;color:${delta>=0?"#059669":"#DC2626"};text-align:center;padding:20px;background:${delta>=0?"#F0FDF4":"#FEF2F2"};border-radius:12px;margin-bottom:20px}
.imp span{display:block;font-size:11px;font-weight:400;color:#64748B;margin-top:4px}
@media print{body{padding:20px}}</style></head><body>
<div class="header"><div class="logo">BIO-IGNICIÓN</div><div class="sub">Informe de Bienestar Laboral — Cumplimiento NOM-035-STPS-2018</div>
<div class="meta"><span>Fecha: ${now.toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"})}</span><span>Periodo: ${h.length?new Date(h[0].ts).toLocaleDateString("es-MX"):"—"} al ${now.toLocaleDateString("es-MX")}</span><span class="badge">MEDIDA PREVENTIVA</span></div></div>

<h2>Resumen Ejecutivo</h2>
<div class="grid"><div class="card"><div class="v">${st.totalSessions}</div><div class="l">Sesiones realizadas</div></div>
<div class="card"><div class="v">${totalMin} min</div><div class="l">Tiempo invertido</div></div>
<div class="card"><div class="v">${uniqueDays}</div><div class="l">Días activos</div></div></div>

<div class="imp">${delta>=0?"+":""}${delta} puntos<span>Mejora promedio de estado emocional por sesión (escala 1-5)</span></div>

<h2>Indicadores de Bienestar (KPIs)</h2>
<div class="grid2">
<div class="${riskPct>30?"risk":"ok"}"><div class="v">${riskPct}%</div><div class="l">Sesiones con estado de tensión alta o agotamiento</div></div>
<div class="ok"><div class="v">${avgMd}/5</div><div class="l">Estado emocional promedio</div></div>
<div class="card"><div class="v">${avgEn}/3</div><div class="l">Energía promedio reportada</div></div>
<div class="card"><div class="v">${freqPerWeek}/sem</div><div class="l">Frecuencia semanal</div></div>
<div class="card"><div class="v">${st.streak} días</div><div class="l">Racha consecutiva actual</div></div>
<div class="card"><div class="v">${peakHr}:00</div><div class="l">Hora pico de actividad</div></div></div>

<h2>Protocolos Utilizados</h2>
<table><tr><th>Protocolo</th><th>Veces usado</th><th>% del total</th></tr>
${topProtos.map(([n,c])=>`<tr><td>${n}</td><td>${c}</td><td>${Math.round(c/st.totalSessions*100)}%</td></tr>`).join("")}</table>

<h2>Contexto Laboral</h2>
<table><tr><th>Contexto</th><th>Frecuencia</th></tr>
${topTags.map(([t,c])=>`<tr><td>${t}</td><td>${c} sesiones</td></tr>`).join("")}
${topTags.length===0?"<tr><td colspan='2'>Sin datos de contexto aún</td></tr>":""}</table>

<h2>Análisis de Efectividad</h2>
<div class="grid2"><div class="card"><div class="v">${bestProto}</div><div class="l">Protocolo más efectivo</div></div>
<div class="card"><div class="v">${withPre.length}</div><div class="l">Sesiones con evaluación pre/post</div></div></div>

<h2>Identificación de Factores de Riesgo</h2>
<div class="${riskPct>30?"risk":"ok"}">
<div class="l">${riskPct>30?"⚠️ Se detectaron "+riskCount+" sesiones con indicadores de tensión alta o agotamiento ("+riskPct+"%). Se recomienda seguimiento y posible canalización conforme al numeral 5.5 de la NOM-035.":"✅ Los indicadores de bienestar se encuentran dentro de rangos aceptables. "+riskCount+" sesiones con tensión detectada ("+riskPct+"%)."}</div></div>

<h2>Cumplimiento NOM-035-STPS-2018</h2>
<table><tr><th>Requisito</th><th>Estado</th><th>Evidencia</th></tr>
<tr><td>Medidas de prevención (5.2)</td><td>✅ Implementado</td><td>${st.totalSessions} sesiones de intervención realizadas</td></tr>
<tr><td>Identificación de riesgo (5.3)</td><td>✅ Activo</td><td>Check-in emocional pre/post en cada sesión</td></tr>
<tr><td>Seguimiento (5.5)</td><td>${riskPct>30?"⚠️ Requiere acción":"✅ Sin alertas"}</td><td>${riskPct}% de sesiones con indicadores de riesgo</td></tr>
<tr><td>Entorno organizacional (5.6)</td><td>✅ Monitoreado</td><td>Datos de contexto laboral: ${topTags.map(t=>t[0]).join(", ")||"pendiente"}</td></tr></table>

<div class="footer">
<p><strong>BIO-IGNICIÓN</strong> — Plataforma de Rendimiento Cognitivo y Bienestar Laboral</p>
<p>Este informe fue generado automáticamente como evidencia de implementación de medidas preventivas conforme a la NOM-035-STPS-2018.</p>
<p>Documento generado: ${now.toLocaleString("es-MX")} | Los datos presentados son autorreportados por el usuario.</p>
</div></body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`Informe-Bienestar-NOM035-${now.toISOString().split("T")[0]}.html`;
  a.click();URL.revokeObjectURL(url);
}catch(e){console.error(e);}}

function AN({value,sfx="",color="#0F172A",sz=32}){const[d,sD]=useState(0);const rf=useRef(null);useEffect(()=>{let s=d;const e=value;const t0=performance.now();function step(n){const p=Math.min((n-t0)/700,1);sD(Math.round(s+(1-Math.pow(1-p,3))*(e-s)));if(p<1)rf.current=requestAnimationFrame(step);}rf.current=requestAnimationFrame(step);return()=>{if(rf.current)cancelAnimationFrame(rf.current);};},[value]);return<span style={{fontSize:sz,fontWeight:800,color,fontFamily:"'Manrope',sans-serif",letterSpacing:"-1px"}}>{d}{sfx}</span>;}
function SK({data,c="#059669",w=120,h=30,id:u}){if(!data||!data.length)return null;const mx=Math.max(...data,1);const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v/mx)*h*.8+h*.08)}`).join(" ");const gi="sk"+(u||"")+(c||"").replace("#","");return(<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}><defs><linearGradient id={gi} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity=".12"/><stop offset="100%" stopColor={c} stopOpacity="0"/></linearGradient></defs><polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gi})`}/><polyline points={pts} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);}
function groupHist(h){const n=new Date();const td=n.toDateString();const yd=new Date(Date.now()-864e5).toDateString();const g={hoy:[],ayer:[],antes:[]};for(const x of h){const d=new Date(x.ts).toDateString();if(d===td)g.hoy.push(x);else if(d===yd)g.ayer.push(x);else g.antes.push(x);}return g;}

/* ═══ PHASE VISUAL — Animated SVG illustrations per phase type ═══ */
function PhaseVisual({type,color,scale=1,active}){
  if(!active)return null;
  const o=.15;const s={display:"block",margin:"0 auto"};
  // BREATH: Animated lungs that expand/contract with breathing
  if(type==="breath")return(
    <svg width="80" height="70" viewBox="0 0 80 70" style={s}>
      <g transform={`translate(40,35) scale(${scale})`} style={{transition:"transform 1s cubic-bezier(.4,0,.2,1)",transformOrigin:"center"}}>
        {/* Left lung */}
        <path d="M-4,-22 C-4,-22 -22,-14 -24,2 C-26,18 -16,26 -8,26 C-2,26 -4,20 -4,10 Z" fill={color} opacity={o} stroke={color} strokeWidth=".8"/>
        {/* Right lung */}
        <path d="M4,-22 C4,-22 22,-14 24,2 C26,18 16,26 8,26 C2,26 4,20 4,10 Z" fill={color} opacity={o} stroke={color} strokeWidth=".8"/>
        {/* Trachea */}
        <line x1="0" y1="-28" x2="0" y2="-16" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
        {/* Bronchi */}
        <path d="M0,-16 C0,-16 -8,-8 -10,-2" fill="none" stroke={color} strokeWidth=".8" opacity=".3"/>
        <path d="M0,-16 C0,-16 8,-8 10,-2" fill="none" stroke={color} strokeWidth=".8" opacity=".3"/>
        {/* Air particles */}
        <circle cx="0" cy={-28+((scale-1)*40)} r="1.5" fill={color} opacity={scale>1.1?.6:.1} style={{transition:"all 1s"}}/>
        <circle cx="-3" cy={-25+((scale-1)*35)} r="1" fill={color} opacity={scale>1.1?.4:.05} style={{transition:"all 1.1s"}}/>
        <circle cx="3" cy={-26+((scale-1)*38)} r="1" fill={color} opacity={scale>1.1?.5:.05} style={{transition:"all 1s"}}/>
      </g>
    </svg>);
  // BODY: Beating heart
  if(type==="body")return(
    <svg width="80" height="70" viewBox="0 0 80 70" style={s}>
      <g style={{animation:"heartBeat 1.2s ease infinite",transformOrigin:"40px 32px"}}>
        <path d="M40,58 C40,58 12,40 12,24 C12,14 20,8 28,8 C34,8 38,12 40,16 C42,12 46,8 52,8 C60,8 68,14 68,24 C68,40 40,58 40,58Z" fill={color} opacity={o} stroke={color} strokeWidth="1"/>
        {/* Pulse line */}
        <polyline points="18,34 28,34 32,22 36,42 40,28 44,36 48,30 52,34 62,34" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity=".35" style={{animation:"ecgDraw 1.2s linear infinite"}}/>
      </g>
    </svg>);
  // MIND: Brain with activating regions
  if(type==="mind")return(
    <svg width="80" height="70" viewBox="0 0 80 70" style={s}>
      {/* Brain outline */}
      <path d="M40,10 C28,10 18,16 16,26 C14,34 18,42 22,46 C26,50 28,54 28,58 L52,58 C52,54 54,50 58,46 C62,42 66,34 64,26 C62,16 52,10 40,10Z" fill={color} opacity={.06} stroke={color} strokeWidth=".8"/>
      {/* Center fissure */}
      <path d="M40,12 L40,56" stroke={color} strokeWidth=".5" opacity=".2" strokeDasharray="2 2"/>
      {/* Left hemisphere folds */}
      <path d="M22,28 C26,24 32,26 36,22" fill="none" stroke={color} strokeWidth=".6" opacity=".2"/>
      <path d="M20,36 C24,32 30,36 38,32" fill="none" stroke={color} strokeWidth=".6" opacity=".2"/>
      {/* Right hemisphere folds */}
      <path d="M58,28 C54,24 48,26 44,22" fill="none" stroke={color} strokeWidth=".6" opacity=".2"/>
      <path d="M60,36 C56,32 50,36 42,32" fill="none" stroke={color} strokeWidth=".6" opacity=".2"/>
      {/* Activation pulses */}
      <circle cx="30" cy="30" r="6" fill={color} opacity=".08" style={{animation:"brainPulse 2.5s ease infinite"}}/>
      <circle cx="50" cy="28" r="5" fill={color} opacity=".06" style={{animation:"brainPulse 2.5s ease infinite .8s"}}/>
      <circle cx="40" cy="40" r="7" fill={color} opacity=".1" style={{animation:"brainPulse 3s ease infinite 1.2s"}}/>
      {/* Neural sparks */}
      <circle cx="32" cy="24" r="1.2" fill={color} opacity=".5" style={{animation:"neuralSpark 1.5s ease infinite"}}/>
      <circle cx="48" cy="22" r="1" fill={color} opacity=".4" style={{animation:"neuralSpark 1.5s ease infinite .5s"}}/>
      <circle cx="38" cy="44" r="1.2" fill={color} opacity=".5" style={{animation:"neuralSpark 1.5s ease infinite 1s"}}/>
      <circle cx="52" cy="38" r="1" fill={color} opacity=".35" style={{animation:"neuralSpark 1.5s ease infinite .3s"}}/>
    </svg>);
  // FOCUS: Crosshair with pulsing target
  if(type==="focus")return(
    <svg width="80" height="70" viewBox="0 0 80 70" style={s}>
      {/* Outer ring */}
      <circle cx="40" cy="35" r="24" fill="none" stroke={color} strokeWidth=".8" opacity=".15" strokeDasharray="4 3" style={{animation:"focusSpin 12s linear infinite",transformOrigin:"40px 35px"}}/>
      {/* Mid ring */}
      <circle cx="40" cy="35" r="16" fill="none" stroke={color} strokeWidth=".6" opacity=".12" strokeDasharray="3 4" style={{animation:"focusSpin 8s linear infinite reverse",transformOrigin:"40px 35px"}}/>
      {/* Inner ring - target lock */}
      <circle cx="40" cy="35" r="8" fill={color} opacity=".06" style={{animation:"focusLock 2s ease infinite"}}/>
      <circle cx="40" cy="35" r="3" fill={color} opacity=".2" style={{animation:"focusLock 2s ease infinite .3s"}}/>
      {/* Crosshair lines */}
      <line x1="40" y1="8" x2="40" y2="22" stroke={color} strokeWidth="1" opacity=".2" strokeLinecap="round"/>
      <line x1="40" y1="48" x2="40" y2="62" stroke={color} strokeWidth="1" opacity=".2" strokeLinecap="round"/>
      <line x1="13" y1="35" x2="27" y2="35" stroke={color} strokeWidth="1" opacity=".2" strokeLinecap="round"/>
      <line x1="53" y1="35" x2="67" y2="35" stroke={color} strokeWidth="1" opacity=".2" strokeLinecap="round"/>
      {/* Center dot */}
      <circle cx="40" cy="35" r="1.5" fill={color} opacity=".6"/>
    </svg>);
  return null;
}

export default function BioIgnicion(){
  const[mt,setMt]=useState(false);const[tab,setTab]=useState("ignicion");const[st,setSt_]=useState(DS);
  const[pr,setPr]=useState(P[12]);const[sc,setSc]=useState("Protocolo");const[sl,setSl]=useState(false);
  const[ts,setTs]=useState("idle");const[sec,setSec]=useState(120);const[pi,setPi]=useState(0);
  const[bL,setBL]=useState("");const[bS,setBS]=useState(1);const[bCnt,setBCnt]=useState(0);
  const[midMsg,setMidMsg]=useState("");const[showMid,setShowMid]=useState(false);
  const[tp,setTp]=useState(false);const[tabFade,setTabFade]=useState(1);
  const[postStep,setPostStep]=useState("none");
  const[postVC,setPostVC]=useState(0);const[postMsg,setPostMsg]=useState("");
  const[checkMood,setCheckMood]=useState(0);const[checkEnergy,setCheckEnergy]=useState(0);const[checkTag,setCheckTag]=useState("");
  const[preMood,setPreMood]=useState(0);
  const[countdown,setCountdown]=useState(0);
  const[compFlash,setCompFlash]=useState(false);
  const[showHist,setShowHist]=useState(false);const[showSettings,setShowSettings]=useState(false);
  const[onboard,setOnboard]=useState(false);const[showIntent,setShowIntent]=useState(false);
  const[greeting,setGreeting]=useState("");
  const[showScience,setShowScience]=useState(false);
  const[selSS,setSelSS]=useState("off");
  const[durMult,setDurMult]=useState(1); // 0.5=60s, 1=120s, 1.5=180s
  const[entryDone,setEntryDone]=useState(false);
  const iR=useRef(null);const bR=useRef(null);const tR=useRef(null);const cdR=useRef(null);

  const setSt=useCallback(v=>{const nv=typeof v==="function"?v(st):v;setSt_(nv);svS(nv);},[st]);
  useEffect(()=>{setMt(true);const l=ldS();const cw=getWeekNum();if(l.weekNum!==null&&l.weekNum!==cw){l.prevWeekData=[...l.weeklyData];l.weeklyData=[0,0,0,0,0,0,0];l.weekNum=cw;}if(l.weekNum===null)l.weekNum=cw;setSt_(l);if(l.totalSessions===0)setOnboard(true);else setGreeting(GREETINGS[Math.floor(Math.random()*GREETINGS.length)]);},[]);
  const[isDark,setIsDark]=useState(false);
  useEffect(()=>{if(!mt)return;function ck(){const h=new Date().getHours();const m=st.themeMode||"auto";if(m==="dark")setIsDark(true);else if(m==="light")setIsDark(false);else setIsDark(h>=20||h<6);}ck();const iv=setInterval(ck,60000);return()=>clearInterval(iv);},[mt,st.themeMode]);
  const H=useCallback(t=>hap(t,st.soundOn,st.hapticOn),[st.soundOn,st.hapticOn]);

  // Soundscape management
  useEffect(()=>{if(ts==="running"&&st.soundOn!==false){const ss=st.soundscape||"off";if(ss!=="off")startSoundscape(ss);else startAmbient();}else{stopAmbient();stopSoundscape();}return()=>{stopAmbient();stopSoundscape();};},[ts]);

  useEffect(()=>{if(ts==="running"){iR.current=setInterval(()=>{setSec(p=>{if(p<=1){clearInterval(iR.current);setTs("done");H("ok");return 0;}return p-1;});},1000);tR.current=setInterval(()=>H("tick"),4000);}return()=>{if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);};},[ts]);
  useEffect(()=>{const el=pr.d-sec;let idx=0;for(let i=pr.ph.length-1;i>=0;i--){if(el>=pr.ph[i].s){idx=i;break;}}if(idx!==pi){setPi(idx);H("ph");}},[sec,pr]);
  useEffect(()=>{if(ts==="running"&&sec===60){setMidMsg(MID_MSGS[Math.floor(Math.random()*MID_MSGS.length)]);setShowMid(true);setTimeout(()=>setShowMid(false),3500);}if(ts==="running"&&sec===30){setMidMsg("Últimos 30. Cierra con todo.");setShowMid(true);setTimeout(()=>setShowMid(false),3000);}},[sec,ts]);
  useEffect(()=>{if(ts==="done"&&sec===0)comp();},[ts,sec]);
  useEffect(()=>{if(bR.current)clearInterval(bR.current);const ph=pr.ph[pi];if(ts!=="running"||!ph.br){setBL("");setBS(1);setBCnt(0);return;}const b=ph.br;const cy=b.in+(b.h1||0)+b.ex+(b.h2||0);let t=0;function tk(){const p=t%cy;if(p<b.in){setBL("INHALA");setBS(1+.22*(p/b.in));setBCnt(b.in-p);}else if(p<b.in+(b.h1||0)){setBL("MANTÉN");setBS(1.22);setBCnt(b.in+(b.h1||0)-p);}else if(p<b.in+(b.h1||0)+b.ex){const ep=p-b.in-(b.h1||0);setBL("EXHALA");setBS(1.22-.22*(ep/b.ex));setBCnt(b.ex-ep);}else{setBL("SOSTÉN");setBS(1);setBCnt(cy-p);}t++;}tk();bR.current=setInterval(tk,1000);return()=>{if(bR.current)clearInterval(bR.current);};},[ts,pi,pr]);

  // NEW: Countdown 3-2-1 before session
  function startCountdown(){setCountdown(3);H("tap");cdR.current=setInterval(()=>{setCountdown(p=>{if(p<=1){clearInterval(cdR.current);setTs("running");H("go");setGreeting("");return 0;}H("tap");return p-1;});},1000);}
  function go(){setPostStep("none");startCountdown();}
  function pa(){if(iR.current)clearInterval(iR.current);if(tR.current)clearInterval(tR.current);setTs("paused");}
  function rs(){if(iR.current)clearInterval(iR.current);if(bR.current)clearInterval(bR.current);if(tR.current)clearInterval(tR.current);if(cdR.current)clearInterval(cdR.current);setTs("idle");setSec(pr.d);setPi(0);setBL("");setBS(1);setBCnt(0);setShowMid(false);setPostStep("none");setCheckMood(0);setCheckEnergy(0);setCheckTag("");setPreMood(0);setCountdown(0);setCompFlash(false);}
  function sp(p){rs();setPr(p);setSl(false);setShowIntent(false);setSec(Math.round(p.d*durMult));setShowScience(false);}
  function timerTap(){H("tap");if(ts==="idle"){go();}else if(ts==="running")pa();else if(ts==="paused"){setTs("running");H("go");}}
  function switchTab(id){if(id===tab)return;setTabFade(0);setTimeout(()=>{setTab(id);setTabFade(1);},150);H("tap");}

  function comp(){
    const td=new Date().toDateString();const di=new Date().getDay();const ad=di===0?6:di-1;const nw=[...st.weeklyData];nw[ad]=(nw[ad]||0)+1;const ys=new Date(Date.now()-864e5).toDateString();let nsk=st.lastDate===td?st.streak:st.lastDate===ys?st.streak+1:1;
    const cD=Math.floor(Math.random()*5)+2,rD=Math.floor(Math.random()*6)+3,eD=Math.floor(Math.random()*4)+1;
    const nC=Math.min(st.coherencia+cD,100),nR=Math.min(st.resiliencia+rD,100),nE=Math.min(st.capacidad+eD,100);
    const ns=st.totalSessions+1;const eVC=10+Math.floor(Math.random()*15);const vc=(st.vCores||0)+eVC;
    const ach=[...st.achievements];
    if(nsk>=7&&!ach.includes("streak7"))ach.push("streak7");
    if(nsk>=30&&!ach.includes("streak30"))ach.push("streak30");
    if(nC>=90&&!ach.includes("coherencia90"))ach.push("coherencia90");
    if(ns>=50&&!ach.includes("sessions50"))ach.push("sessions50");
    if(ns>=100&&!ach.includes("sessions100"))ach.push("sessions100");
    const totalT=(st.totalTime||0)+pr.d;if(totalT>=3600&&!ach.includes("time60"))ach.push("time60");
    const hr=new Date().getHours();if(hr<7&&!ach.includes("earlyBird"))ach.push("earlyBird");
    if(hr>=22&&!ach.includes("nightOwl"))ach.push("nightOwl");
    const uniqueP=new Set([...(st.history||[]).map(h=>h.p),pr.n]);if(uniqueP.size>=14&&!ach.includes("allProtos"))ach.push("allProtos");
    const hist=[...(st.history||[]),{p:pr.n,ts:Date.now(),vc:eVC,c:nC,r:nR}].slice(-50);
    setPostVC(eVC);setPostMsg(POST_MSGS[Math.floor(Math.random()*POST_MSGS.length)]);
    setCompFlash(true);setTimeout(()=>{setCompFlash(false);setPostStep("checkin");},800);
    setCheckMood(0);setCheckEnergy(0);setCheckTag("");
    setSt({...st,totalSessions:ns,streak:nsk,todaySessions:st.lastDate===td?st.todaySessions+1:1,lastDate:td,weeklyData:nw,weekNum:getWeekNum(),coherencia:nC,resiliencia:nR,capacidad:nE,achievements:ach,vCores:vc,history:hist,totalTime:(st.totalTime||0)+pr.d,firstDone:true,progDay:Math.min((st.progDay||0)+1,7)});
  }
  function submitCheckin(){
    if(checkMood>0){const ml=[...(st.moodLog||[]),{ts:Date.now(),mood:checkMood,energy:checkEnergy||2,tag:checkTag,proto:pr.n,pre:preMood||0}].slice(-100);const ach=[...st.achievements];if(checkMood===5&&!ach.includes("mood5"))ach.push("mood5");setSt({...st,moodLog:ml,achievements:ach});}
    setPostStep("summary");
  }

  const lv=gL(st.totalSessions),ph=pr.ph[pi],fl=P.filter(p=>p.ct===sc),mW=Math.max(...st.weeklyData,1);
  const pct=(pr.d-sec)/pr.d,CI=2*Math.PI*116,dO=CI*(1-pct),ins=genIns(st),isBr=ts==="running"&&ph.br;
  const perf=Math.round((st.coherencia+st.resiliencia+st.capacidad)/3);
  const nSt=getStatus(perf);const lPct=lvPct(st.totalSessions);const nLv=nxtLv(st.totalSessions);
  const isActive=ts==="running";const noData=st.totalSessions===0;
  const sugN=useMemo(()=>{const cs=["Reset","Activación","Protocolo"];const nc=cs[(cs.indexOf(pr.ct)+1)%3];const o=P.filter(p=>p.ct===nc);return o[Math.floor(o.length/2)]||P[0];},[pr.id]);
  const rD=useMemo(()=>{const h=st.history||[];if(h.length<2)return{c:0,r:0};return{c:h.slice(-1)[0].c-(h.length>=5?h[h.length-5]:h[0]).c,r:h.slice(-1)[0].r-(h.length>=5?h[h.length-5]:h[0]).r};},[st.history]);
  const moodTrend=useMemo(()=>(st.moodLog||[]).slice(-14).map(m=>m.mood),[st.moodLog]);
  const avgMood=useMemo(()=>{const ml=st.moodLog||[];if(!ml.length)return 0;return+(ml.slice(-7).reduce((a,m)=>a+m.mood,0)/Math.min(ml.length,7)).toFixed(1);},[st.moodLog]);
  const records=useMemo(()=>getRecords(st),[st.history,st.streak]);
  const moodDiff=preMood>0&&checkMood>0?checkMood-preMood:null;
  const nextPh=pi<pr.ph.length-1?pr.ph[pi+1]:null;
  const sessPct=Math.round(pct*100);
  const streakRisk=useMemo(()=>{if(st.streak<2||st.todaySessions>0)return false;const h=new Date().getHours();return h>=20;},[st.streak,st.todaySessions]);
  const lastProto=useMemo(()=>{const h=st.history||[];if(!h.length)return null;return h[h.length-1].p;},[st.history]);
  const favs=st.favs||[];
  const toggleFav=(name)=>{const nf=favs.includes(name)?favs.filter(f=>f!==name):[...favs,name];setSt({...st,favs:nf});};
  const weeklySummary=useMemo(()=>{const pw=st.prevWeekData||[0,0,0,0,0,0,0];const pwTotal=pw.reduce((a,b)=>a+b,0);const cwTotal=st.weeklyData.reduce((a,b)=>a+b,0);if(pwTotal===0)return null;const diff=cwTotal-pwTotal;const bestDay=pw.indexOf(Math.max(...pw));const ml=st.moodLog||[];const weekMoods=ml.slice(-7);const mAvg=weekMoods.length?+(weekMoods.reduce((a,m)=>a+m.mood,0)/weekMoods.length).toFixed(1):0;return{prev:pwTotal,curr:cwTotal,diff,bestDay:DN[bestDay],mAvg};},[st.prevWeekData,st.weeklyData,st.moodLog]);
  const smartPick=useMemo(()=>smartSuggest(st),[st.moodLog,st.history]);
  const daily=useMemo(()=>getDailyIgn(st),[st.moodLog]);
  const progStep=PROG_7[(st.progDay||0)%7];

  const bg=isDark?"#0B0E14":"#F1F4F9",cd=isDark?"#141820":"#FFFFFF",bd=isDark?"#1E2330":"#E2E8F0";
  const t1=isDark?"#E8ECF4":"#0F172A",t2=isDark?"#8B95A8":"#475569",t3=isDark?"#4B5568":"#94A3B8",ac=pr.cl;

  if(!mt)return(<div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#F1F4F9",gap:16}}><svg width="52" height="52" viewBox="0 0 52 52" style={{animation:"pu 1.8s ease infinite"}}><circle cx="26" cy="26" r="22" fill="none" stroke="#059669" strokeWidth="2" opacity=".3"/><circle cx="26" cy="26" r="16" fill="none" stroke="#6366F1" strokeWidth="2" opacity=".3"/><circle cx="26" cy="26" r="5" fill="#059669" opacity=".4"/></svg><div style={{fontSize:10,fontWeight:800,color:"#94A3B8",letterSpacing:6,textTransform:"uppercase"}}>BIO-IGNICIÓN</div></div>);

  return(
  <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:bg,position:"relative",overflow:"hidden",fontFamily:"'Manrope',-apple-system,sans-serif",transition:"background .8s"}}>
  <style>{`body{background:${bg}}@keyframes gl{0%,100%{box-shadow:0 0 20px ${ac}10,0 4px 20px ${ac}06}50%{box-shadow:0 0 40px ${ac}1A,0 4px 28px ${ac}0D}}@keyframes compFlash{0%{opacity:0}50%{opacity:1}100%{opacity:0}}@keyframes pausePulse{0%,100%{opacity:.4}50%{opacity:1}}@keyframes phaseSlide{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}@keyframes heartBeat{0%,100%{transform:scale(1)}14%{transform:scale(1.08)}28%{transform:scale(1)}42%{transform:scale(1.05)}70%{transform:scale(1)}}@keyframes ecgDraw{0%{opacity:.15}50%{opacity:.45}100%{opacity:.15}}@keyframes brainPulse{0%,100%{opacity:.04;transform:scale(1)}50%{opacity:.15;transform:scale(1.3)}}@keyframes neuralSpark{0%,100%{opacity:.1;transform:scale(.6)}50%{opacity:.8;transform:scale(1.8)}}@keyframes focusSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes focusLock{0%,100%{opacity:.05;transform:scale(1)}50%{opacity:.15;transform:scale(1.2)}}`}</style>

  <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}><div style={{position:"absolute",top:"-15%",right:"-15%",width:"50%",height:"50%",borderRadius:"50%",background:`radial-gradient(circle,${ac}${isDark?"12":"08"},transparent)`,animation:"am 25s ease-in-out infinite",filter:"blur(50px)"}}/><div style={{position:"absolute",bottom:"-10%",left:"-10%",width:"40%",height:"40%",borderRadius:"50%",background:`radial-gradient(circle,#818CF8${isDark?"10":"08"},transparent)`,animation:"am 30s ease-in-out infinite reverse",filter:"blur(45px)"}}/></div>
  {showMid&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:180,animation:"midPop 3.5s ease both",pointerEvents:"none"}}><div style={{background:cd,borderRadius:16,padding:"14px 22px",boxShadow:"0 8px 30px rgba(0,0,0,.08)",border:`1px solid ${bd}`,maxWidth:320,textAlign:"center"}}><div style={{fontSize:13,fontWeight:600,color:t1,lineHeight:1.6,fontStyle:"italic"}}>{midMsg}</div></div></div>}

  {/* Countdown Overlay */}
  {countdown>0&&<div style={{position:"fixed",inset:0,zIndex:240,background:`${bg}DD`,backdropFilter:"blur(30px)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{position:"relative"}}><div key={countdown} style={{fontSize:96,fontWeight:800,color:ac,animation:"po .3s cubic-bezier(.34,1.56,.64,1)"}}>{countdown}</div><div key={"r"+countdown} style={{position:"absolute",top:"50%",left:"50%",width:120,height:120,borderRadius:"50%",border:`2px solid ${ac}30`,animation:"cdPulse 1s ease forwards"}}/></div></div>}

  {/* Completion flash */}
  {compFlash&&<div style={{position:"fixed",inset:0,zIndex:230,background:`${ac}12`,animation:"compFlash .8s ease forwards",pointerEvents:"none"}}/>}

  {onboard&&<div style={{position:"fixed",inset:0,zIndex:250,background:"rgba(15,23,42,.5)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><div style={{background:cd,borderRadius:28,padding:"36px 28px",maxWidth:360,textAlign:"center",animation:"po .5s cubic-bezier(.34,1.56,.64,1)"}}>
    <svg width="52" height="52" viewBox="0 0 52 52" style={{margin:"0 auto 18px",display:"block"}}><circle cx="26" cy="26" r="22" fill="none" stroke={ac} strokeWidth="2.5"/><circle cx="26" cy="26" r="15" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="6 4" style={{animation:"innerRing 4s linear infinite"}}/><circle cx="26" cy="26" r="5" fill={ac} opacity=".5"/></svg>
    <div style={{fontSize:22,fontWeight:800,color:t1,marginBottom:6}}>BIO-IGNICIÓN</div>
    <div style={{fontSize:12,color:t2,lineHeight:1.7,marginBottom:24}}>120 segundos que transforman tu rendimiento. La ciencia del sistema nervioso, aplicada a tu día.</div>
    <button onClick={()=>setOnboard(false)} style={{width:"100%",padding:"16px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>ACTIVAR SISTEMA</button>
  </div></div>}

  {/* POST: CHECK-IN */}
  {postStep==="checkin"&&ts==="done"&&<div style={{position:"fixed",inset:0,zIndex:220,background:`${bg}F5`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:cd,borderRadius:28,padding:"28px 22px",maxWidth:400,width:"100%",animation:"po .4s cubic-bezier(.34,1.56,.64,1)"}}>
    <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:16,fontWeight:800,color:t1}}>¿Cómo te sientes ahora?</div></div>
    <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:18}}>{MOODS.map(m=>(
      <button key={m.id} onClick={()=>{setCheckMood(m.value);H("tap");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"8px 4px",borderRadius:13,border:checkMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:checkMood===m.value?m.color+"0A":cd,cursor:"pointer",transition:"all .2s",minWidth:56,flex:1}}>
        <Ic name={m.icon} size={20} color={checkMood===m.value?m.color:t3}/>
        <span style={{fontSize:7,fontWeight:700,color:checkMood===m.value?m.color:t3,textAlign:"center",lineHeight:1.2}}>{m.label}</span>
      </button>))}</div>
    <div style={{marginBottom:16}}><div style={{fontSize:9,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Energía</div><div style={{display:"flex",gap:7}}>{ENERGY_LEVELS.map(e=>(
      <button key={e.id} onClick={()=>{setCheckEnergy(e.v);H("tap");}} style={{flex:1,padding:"9px",borderRadius:11,border:checkEnergy===e.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:checkEnergy===e.v?ac+"08":cd,color:checkEnergy===e.v?ac:t3,fontSize:11,fontWeight:700,cursor:"pointer"}}>{e.label}</button>))}</div></div>
    <div style={{marginBottom:18}}><div style={{fontSize:9,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>Contexto</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{WORK_TAGS.map(tg=>(
      <button key={tg} onClick={()=>{setCheckTag(checkTag===tg?"":tg);H("tap");}} style={{padding:"5px 11px",borderRadius:18,border:checkTag===tg?`1.5px solid ${ac}`:`1px solid ${bd}`,background:checkTag===tg?ac+"08":cd,color:checkTag===tg?ac:t3,fontSize:9,fontWeight:600,cursor:"pointer"}}>{tg}</button>))}</div></div>
    <button onClick={submitCheckin} style={{width:"100%",padding:"14px",borderRadius:50,background:checkMood>0?ac:bd,border:"none",color:checkMood>0?"#fff":t3,fontSize:12,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>{checkMood>0?"CONTINUAR":"SELECCIONA ESTADO"}</button>
    <button onClick={()=>setPostStep("summary")} style={{width:"100%",padding:"8px",marginTop:6,background:"transparent",border:"none",color:t3,fontSize:10,cursor:"pointer"}}>Omitir</button>
  </div></div>}

  {/* POST: SUMMARY with Before/After */}
  {postStep==="summary"&&ts==="done"&&<div style={{position:"fixed",inset:0,zIndex:220,background:`${bg}F2`,backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}><div style={{background:cd,borderRadius:28,padding:"26px 20px",maxWidth:400,width:"100%",animation:"po .5s cubic-bezier(.34,1.56,.64,1)",position:"relative",overflow:"hidden"}}>
    {Array.from({length:8}).map((_,i)=><div key={i} style={{position:"absolute",top:"20%",left:"50%",width:4,height:4,borderRadius:"50%",background:ac,opacity:0,animation:`particle 1.2s ease ${i*.1}s forwards`,"--tx":`${(Math.random()-.5)*120}px`,"--ty":`${-40-Math.random()*80}px`}}/>)}
    <div style={{textAlign:"center",marginBottom:14}}>
      <svg width="44" height="44" viewBox="0 0 48 48" style={{margin:"0 auto 10px",display:"block"}}><circle cx="24" cy="24" r="22" fill={ac} opacity=".12"/><circle cx="24" cy="24" r="16" fill={ac} opacity=".2"/><path d="M15 24l6 6 12-12" stroke={ac} strokeWidth="3" strokeLinecap="round" fill="none"/></svg>
      {st.totalSessions<=1?<div style={{fontSize:15,fontWeight:800,color:t1}}>Tu primera ignición.</div>:<div style={{fontSize:15,fontWeight:800,color:t1}}>Sesión #{st.totalSessions}</div>}
      <div style={{fontSize:10,color:t2,marginTop:2}}>{pr.n} · {pr.d}s</div>
    </div>
    {/* Before → After comparison */}
    {preMood>0&&checkMood>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14,padding:"10px 12px",background:isDark?"#1A1E28":"#F1F5F9",borderRadius:14}}>
      <div style={{textAlign:"center"}}><Ic name={MOODS[preMood-1].icon} size={18} color={MOODS[preMood-1].color}/><div style={{fontSize:7,color:t3,marginTop:2}}>Antes</div></div>
      <div style={{fontSize:16,color:moodDiff>0?"#059669":moodDiff<0?"#DC2626":t3,fontWeight:800}}>{moodDiff>0?"+"+moodDiff:moodDiff===0?"=":moodDiff}</div>
      <div style={{textAlign:"center"}}><Ic name={MOODS[checkMood-1].icon} size={18} color={MOODS[checkMood-1].color}/><div style={{fontSize:7,color:t3,marginTop:2}}>Después</div></div>
    </div>}
    {checkMood>0&&!preMood&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:12,padding:"8px",background:MOODS[checkMood-1].color+"08",borderRadius:12}}>
      <Ic name={MOODS[checkMood-1].icon} size={18} color={MOODS[checkMood-1].color}/><span style={{fontSize:11,fontWeight:700,color:MOODS[checkMood-1].color}}>{MOODS[checkMood-1].label}</span>
      {checkTag&&<span style={{fontSize:9,color:t3}}>· {checkTag}</span>}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:12}}>
      {[{l:"V-Cores",v:"+"+postVC,c:ac},{l:"Enfoque",v:st.coherencia+"%",c:"#3B82F6"},{l:"Calma",v:st.resiliencia+"%",c:"#8B5CF6"}].map((m,i)=>(
        <div key={i} style={{background:m.c+"08",borderRadius:11,padding:"9px 5px",textAlign:"center"}}><div style={{fontSize:15,fontWeight:800,color:m.c}}>{m.v}</div><div style={{fontSize:7,fontWeight:700,color:t3,letterSpacing:.5,marginTop:1,textTransform:"uppercase"}}>{m.l}</div></div>))}
    </div>
    <div style={{background:isDark?"#1A1E28":"#F1F5F9",borderRadius:11,padding:"10px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:8,fontWeight:800,color:lv.c}}>{lv.n}</span><span style={{fontSize:8,color:t3}}>{lPct}%</span></div>
      <div style={{height:3,background:bd,borderRadius:3,overflow:"hidden"}}><div style={{width:lPct+"%",height:"100%",borderRadius:3,background:lv.c}}/></div>
    </div>
    <div style={{background:ac+"06",borderRadius:10,padding:"10px 12px",marginBottom:12,border:`1px solid ${ac}10`}}>
      <div style={{fontSize:11,color:t2,fontWeight:500,lineHeight:1.5,fontStyle:"italic"}}>{postMsg}</div>
    </div>
    <button onClick={()=>{sp(sugN);setPostStep("none");}} style={{width:"100%",padding:"10px",borderRadius:12,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",gap:7,alignItems:"center",marginBottom:10}}>
      <div style={{width:26,height:26,borderRadius:7,background:sugN.cl+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="bolt" size={12} color={sugN.cl}/></div><div><div style={{fontSize:7,color:t3,fontWeight:700,textTransform:"uppercase"}}>Siguiente</div><div style={{fontSize:10,fontWeight:700,color:t1}}>{sugN.n}</div></div>
    </button>
    <button onClick={()=>{rs();setPostStep("none");}} style={{width:"100%",padding:"13px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>CONTINUAR</button>
  </div></div>}

  {showIntent&&<div style={{position:"fixed",inset:0,zIndex:210,background:"rgba(15,23,42,.4)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setShowIntent(false)}><div style={{background:cd,borderRadius:28,padding:"26px 20px",maxWidth:380,width:"100%",animation:"po .4s"}} onClick={e=>e.stopPropagation()}>
    <div style={{textAlign:"center",marginBottom:18}}><div style={{fontSize:16,fontWeight:800,color:t1}}>¿Qué necesitas?</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{INTENTS.map(i=>{const b=P.filter(p=>p.int===i.id);const pk=b[Math.floor(b.length/2)]||P[0];return(<button key={i.id} onClick={()=>sp(pk)} style={{padding:"16px 10px",borderRadius:16,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",textAlign:"center"}}><Ic name={i.icon} size={26} color={i.color}/><div style={{fontSize:12,fontWeight:800,color:t1,marginTop:6}}>{i.label}</div><div style={{fontSize:8,color:i.color,fontWeight:700,marginTop:4}}>{pk.n}</div></button>);})}</div>
  </div></div>}

  {sl&&(<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSl(false)}><div style={{width:"100%",maxWidth:430,maxHeight:"82vh",background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",overflowY:"auto",animation:"su .4s"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:20,fontWeight:800,color:t1,marginBottom:16}}>Protocolos</h3>
    <div style={{display:"flex",background:isDark?"#1A1E28":"#EEF2F7",borderRadius:12,padding:3,marginBottom:16}}>{CATS.map(c=><button key={c} onClick={()=>setSc(c)} style={{flex:1,padding:"9px 0",borderRadius:10,border:"none",background:sc===c?cd:"transparent",color:sc===c?t1:t3,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .3s"}}>{c}</button>)}</div>
    {[...fl].sort((a,b)=>(favs.includes(b.n)?1:0)-(favs.includes(a.n)?1:0)).map(p=>{const isLast=lastProto===p.n;const isFav=favs.includes(p.n);const isSmart=smartPick?.id===p.id;return<button key={p.id} onClick={()=>sp(p)} style={{width:"100%",padding:"12px",marginBottom:4,borderRadius:14,border:isSmart?`2px solid ${ac}`:pr.id===p.id?`2px solid ${p.cl}`:`1.5px solid ${bd}`,background:isSmart?ac+"05":pr.id===p.id?p.cl+"06":cd,cursor:"pointer",textAlign:"left",display:"flex",gap:11,alignItems:"center",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",left:0,top:0,bottom:0,width:3,borderRadius:"0 2px 2px 0",background:p.cl}}/><div style={{width:40,height:40,borderRadius:11,background:p.cl+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:p.cl,flexShrink:0,marginLeft:4}}>{p.tg}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:t1,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>{p.n}{isLast&&<span style={{fontSize:7,fontWeight:700,color:t3,background:isDark?"#1A1E28":"#F1F5F9",padding:"1px 5px",borderRadius:4}}>último</span>}{isSmart&&<span style={{fontSize:7,fontWeight:700,color:ac,background:ac+"10",padding:"1px 5px",borderRadius:4}}>recomendado</span>}</div><div style={{fontSize:9,color:t3,display:"flex",alignItems:"center",gap:6}}>{p.ph.length} fases · {p.d}s · <span style={{color:p.dif===1?"#059669":p.dif===2?"#D97706":"#DC2626"}}>{DIF_LABELS[(p.dif||1)-1]}</span></div></div><div onClick={e=>{e.stopPropagation();toggleFav(p.n);H("tap");}} style={{padding:4,cursor:"pointer",flexShrink:0}}><Ic name="star" size={16} color={isFav?ac:bd}/></div>{pr.id===p.id&&<Ic name="check" size={16} color={p.cl}/>}</button>;})}
  </div></div>)}

  {showSettings&&(<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowSettings(false)}><div style={{width:"100%",maxWidth:430,background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",animation:"su .4s"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:17,fontWeight:800,color:t1,marginBottom:16}}>Configuración</h3>
    {[{l:"Sonido + ambiente",k:"soundOn",d:"Acordes y ruido ambiental"},{l:"Vibración",k:"hapticOn",d:"Feedback táctil"}].map(s=>(
      <div key={s.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${bd}`}}><div><div style={{fontSize:12,fontWeight:700,color:t1}}>{s.l}</div><div style={{fontSize:9,color:t3,marginTop:1}}>{s.d}</div></div>
        <div onClick={()=>setSt({...st,[s.k]:!st[s.k]})} style={{width:42,height:24,borderRadius:12,background:st[s.k]?ac:bd,cursor:"pointer",position:"relative",transition:"background .3s"}}><div style={{width:20,height:20,borderRadius:10,background:"#fff",position:"absolute",top:2,left:st[s.k]?20:2,transition:"left .3s",boxShadow:"0 1px 3px rgba(0,0,0,.15)"}}/></div>
      </div>))}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:`1px solid ${bd}`}}><div style={{fontSize:12,fontWeight:700,color:t1}}>Tema</div><div style={{display:"flex",gap:4}}>{["auto","light","dark"].map(m=>(<button key={m} onClick={()=>setSt({...st,themeMode:m})} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${(st.themeMode||"auto")===m?ac:bd}`,background:(st.themeMode||"auto")===m?ac+"10":cd,color:(st.themeMode||"auto")===m?ac:t3,fontSize:9,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>))}</div></div>
    <button onClick={()=>exportData(st)} style={{width:"100%",padding:"13px",marginTop:14,borderRadius:13,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
      <Ic name="export" size={16} color={t2}/><span style={{fontSize:12,fontWeight:700,color:t2}}>Exportar datos (JSON)</span>
    </button>
    <button onClick={()=>exportNOM035(st)} style={{width:"100%",padding:"13px",marginTop:8,borderRadius:13,border:"1.5px solid #059669",background:"#059669"+"08",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
      <Ic name="brief" size={16} color="#059669"/><span style={{fontSize:12,fontWeight:700,color:"#059669"}}>Informe NOM-035 (HTML)</span>
    </button>
  </div></div>)}

  {showHist&&(<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(15,23,42,.3)",backdropFilter:"blur(16px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowHist(false)}><div style={{width:"100%",maxWidth:430,maxHeight:"75vh",background:cd,borderRadius:"26px 26px 0 0",padding:"18px 20px 36px",overflowY:"auto",animation:"su .4s"}} onClick={e=>e.stopPropagation()}>
    <div style={{width:36,height:4,background:bd,borderRadius:2,margin:"0 auto 20px"}}/><h3 style={{fontSize:17,fontWeight:800,color:t1,marginBottom:14}}>Historial</h3>
    {!(st.history||[]).length&&<div style={{textAlign:"center",padding:"36px 0"}}><Ic name="chart" size={30} color={t3}/><div style={{fontSize:12,color:t3,marginTop:8}}>Tu primera sesión creará el registro.</div></div>}
    {(()=>{const g=groupHist([...(st.history||[])].reverse());return Object.entries(g).map(([k,items])=>{if(!items.length)return null;return(<div key={k}><div style={{fontSize:8,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:7,marginTop:10}}>{k==="hoy"?"Hoy":k==="ayer"?"Ayer":"Anteriores"}</div>{items.map((h,i)=>{const tm=new Date(h.ts).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});const ml=(st.moodLog||[]).find(m=>Math.abs(m.ts-h.ts)<10000);return(<div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 0",borderBottom:`1px solid ${bd}`}}><div style={{width:30,height:30,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="bolt" size={12} color={ac}/></div><div style={{flex:1}}><div style={{fontSize:10,fontWeight:700,color:t1}}>{h.p}</div><div style={{display:"flex",alignItems:"center",gap:3,marginTop:1}}><span style={{fontSize:8,color:t3}}>{tm}</span>{ml&&<Ic name={MOODS[ml.mood-1]?.icon||"neutral"} size={10} color={MOODS[ml.mood-1]?.color||t3}/>}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:800,color:ac}}>+{h.vc}</div></div></div>);})}</div>);});})()}
  </div></div>)}

  <div style={{opacity:tabFade,transition:"opacity .15s",position:"relative",zIndex:1}}>

  {tab==="ignicion"&&postStep==="none"&&countdown===0&&!compFlash&&(<div style={{padding:"14px 20px 180px"}}>
    {/* Immersive entry moment */}
    {!entryDone&&ts==="idle"&&st.totalSessions>0&&<div style={{textAlign:"center",padding:"30px 0 20px",animation:"fi 1s ease"}} onClick={()=>setEntryDone(true)}>
      <svg width="48" height="48" viewBox="0 0 52 52" style={{margin:"0 auto 16px",display:"block",animation:"pu 3s ease infinite"}}><circle cx="26" cy="26" r="22" fill="none" stroke={ac} strokeWidth="1.5" opacity=".3"/><circle cx="26" cy="26" r="15" fill="none" stroke={ac} strokeWidth="1" strokeDasharray="4 4" style={{animation:"innerRing 6s linear infinite"}}/><circle cx="26" cy="26" r="4" fill={ac} opacity=".3"/></svg>
      <div style={{fontSize:14,fontWeight:300,color:t2,lineHeight:1.7,maxWidth:280,margin:"0 auto",letterSpacing:"0.2px"}}>{daily.phrase}</div>
      <div style={{fontSize:9,color:t3,marginTop:16,fontWeight:600,letterSpacing:2,textTransform:"uppercase"}}>TOCA PARA CONTINUAR</div>
    </div>}
    {(entryDone||st.totalSessions===0||ts!=="idle")&&<>
    {/* Streak risk */}
    {streakRisk&&ts==="idle"&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"9px 12px",marginBottom:12,background:isDark?"#1A1510":"#FFFBEB",borderRadius:12,border:"1px solid #D9770620",animation:"fi .4s"}}>
      <Ic name="alert" size={14} color="#D97706"/>
      <span style={{fontSize:10,fontWeight:600,color:"#D97706"}}>Tu racha de {st.streak} días termina esta noche.</span>
    </div>}
    {st.todaySessions>0&&ts==="idle"&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:8}}>
      <div style={{width:4,height:4,borderRadius:"50%",background:ac}}/><span style={{fontSize:9,fontWeight:700,color:ac}}>{st.todaySessions} {st.todaySessions===1?"sesión":"sesiones"} hoy</span>
    </div>}

    {/* ═══ DAILY IGNICIÓN ═══ */}
    {ts==="idle"&&<button onClick={()=>sp(daily.proto)} style={{width:"100%",padding:"16px 14px",marginBottom:14,borderRadius:18,border:`1.5px solid ${daily.proto.cl}20`,background:`linear-gradient(135deg,${daily.proto.cl}06,${daily.proto.cl}02)`,cursor:"pointer",textAlign:"left",display:"flex",gap:12,alignItems:"center",animation:"fi .5s",position:"relative",overflow:"hidden"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:daily.proto.cl+"08"}}/>
      <div style={{width:44,height:44,borderRadius:13,background:daily.proto.cl+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:daily.proto.cl,flexShrink:0,border:`1px solid ${daily.proto.cl}15`}}>{daily.proto.tg}</div>
      <div style={{flex:1,position:"relative",zIndex:1}}>
        <div style={{fontSize:7,fontWeight:800,color:daily.proto.cl,letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>IGNICIÓN DEL DÍA</div>
        <div style={{fontSize:13,fontWeight:800,color:t1}}>{daily.proto.n}</div>
        <div style={{fontSize:9,color:t3,marginTop:2,fontStyle:"italic",lineHeight:1.4}}>{daily.phrase}</div>
      </div>
      <Ic name="bolt" size={16} color={daily.proto.cl}/>
    </button>}

    {/* ═══ 7-DAY PROGRAM ═══ */}
    {ts==="idle"&&(st.progDay||0)<7&&<div style={{marginBottom:14,background:cd,borderRadius:16,padding:"12px",border:`1px solid ${bd}`,animation:"fi .6s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:7,fontWeight:800,letterSpacing:2,color:ac,textTransform:"uppercase"}}>Programa 7 Días</div>
        <span style={{fontSize:8,fontWeight:800,color:t1}}>Día {Math.min((st.progDay||0)+1,7)}/7</span>
      </div>
      <div style={{display:"flex",gap:3,marginBottom:10}}>
        {PROG_7.map((p,i)=>{const done=i<(st.progDay||0);const curr=i===(st.progDay||0);return<div key={i} style={{flex:1,height:4,borderRadius:2,background:done?ac:curr?ac+"50":bd,transition:"background .5s"}}/>;})}</div>
      <button onClick={()=>{const p=P.find(x=>x.id===progStep.pid);if(p)sp(p);}} style={{width:"100%",padding:"10px",borderRadius:12,border:`1px solid ${bd}`,background:isDark?"#1A1E28":"#F8FAFC",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="bolt" size={12} color={ac}/></div>
        <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:11,fontWeight:700,color:t1}}>{progStep.t}</div><div style={{fontSize:8,color:t3}}>{progStep.d}</div></div>
        <Ic name="rec" size={12} color={ac}/>
      </button>
    </div>}

    {ts==="idle"&&smartPick&&pr.id!==smartPick.id&&daily.proto.id!==smartPick.id&&<button onClick={()=>sp(smartPick)} style={{width:"100%",padding:"10px 12px",marginBottom:14,borderRadius:14,border:`1.5px solid ${ac}20`,background:ac+"04",cursor:"pointer",display:"flex",alignItems:"center",gap:10,animation:"fi .5s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
      <div style={{width:32,height:32,borderRadius:9,background:smartPick.cl+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:smartPick.cl,flexShrink:0}}>{smartPick.tg}</div>
      <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:7,fontWeight:700,color:ac,letterSpacing:1,textTransform:"uppercase"}}>También recomendado</div><div style={{fontSize:10,fontWeight:700,color:t1,marginTop:1}}>{smartPick.n}</div></div>
      <Ic name="rec" size={12} color={ac}/>
    </button>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:nSt.color,animation:"shimDot 2s ease infinite"}}/><span style={{fontSize:8,fontWeight:700,color:nSt.color}}>{nSt.label}</span></div>
      <div style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:8,fontWeight:700,color:lv.c}}>{lv.n}</span><div style={{width:36,height:3,borderRadius:2,background:bd,overflow:"hidden"}}><div style={{width:lPct+"%",height:"100%",borderRadius:2,background:lv.c}}/></div></div>
    </div>
    <div style={{display:"flex",gap:7,marginBottom:16}}>
      <button onClick={()=>setSl(true)} style={{flex:1,padding:"10px 12px",borderRadius:15,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",gap:9}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
        <div style={{width:32,height:32,borderRadius:8,background:ac+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:ac}}>{pr.tg}</div>
        <div style={{flex:1,textAlign:"left"}}><div style={{fontWeight:700,fontSize:11,color:t1}}>{pr.n}</div><div style={{fontSize:8,color:t3}}>{pr.ph.length} fases</div></div>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4L6 7L9 4" stroke={t3} strokeWidth="1.8" strokeLinecap="round"/></svg>
      </button>
      <button onClick={()=>setShowIntent(true)} style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic name="focus" size={18} color={t3}/></button>
    </div>

    {/* Duration selector */}
    {ts==="idle"&&<div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:16}}>
      {[{v:.5,l:"60s"},{v:1,l:"120s"},{v:1.5,l:"180s"}].map(d=>(
        <button key={d.v} onClick={()=>{setDurMult(d.v);setSec(Math.round(pr.d*d.v));H("tap");}} style={{padding:"6px 16px",borderRadius:20,border:durMult===d.v?`2px solid ${ac}`:`1.5px solid ${bd}`,background:durMult===d.v?ac+"08":cd,color:durMult===d.v?ac:t3,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>{d.l}</button>
      ))}
    </div>}

    {/* Pre-session mood capture */}
    {ts==="idle"&&<div style={{marginBottom:16,animation:"fi .4s"}}>
      <div style={{fontSize:9,fontWeight:700,color:t3,marginBottom:7,letterSpacing:1.5,textTransform:"uppercase"}}>¿Cómo llegas a esta sesión?</div>
      <div style={{display:"flex",gap:4}}>{MOODS.map(m=>(
        <button key={m.id} onClick={()=>{setPreMood(m.value);H("tap");}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"7px 2px",borderRadius:11,border:preMood===m.value?`2px solid ${m.color}`:`1.5px solid ${bd}`,background:preMood===m.value?m.color+"0A":cd,cursor:"pointer",transition:"all .2s"}}>
          <Ic name={m.icon} size={16} color={preMood===m.value?m.color:t3}/>
          <span style={{fontSize:6,fontWeight:700,color:preMood===m.value?m.color:t3,lineHeight:1.1,textAlign:"center"}}>{m.label}</span>
        </button>))}</div>
    </div>}

    <div onClick={timerTap} onMouseDown={()=>setTp(true)} onMouseUp={()=>setTp(false)} onMouseLeave={()=>setTp(false)} onTouchStart={()=>setTp(true)} onTouchEnd={()=>setTp(false)} style={{position:"relative",width:250,height:250,margin:"0 auto 8px",cursor:"pointer",transform:tp?"scale(0.97)":"scale(1)",transition:"transform .2s cubic-bezier(.4,0,.2,1)",userSelect:"none"}}>
      {isActive&&<><div style={{position:"absolute",inset:-10,borderRadius:"50%",border:`1.5px solid ${ac}10`,animation:"bth 4s ease infinite"}}/><div style={{position:"absolute",inset:-20,borderRadius:"50%",border:`1px solid ${ac}06`,animation:"bth 4s ease infinite .5s"}}/></>}
      {isBr&&<><div style={{position:"absolute",top:"50%",left:"50%",width:150,height:150,transform:`translate(-50%,-50%) scale(${bS})`,borderRadius:"50%",background:`radial-gradient(circle,${ac}10,transparent)`,transition:"transform 1s cubic-bezier(.4,0,.2,1)",pointerEvents:"none"}}/><div style={{position:"absolute",top:"50%",left:"50%",width:105,height:105,transform:`translate(-50%,-50%) scale(${bS*1.05})`,borderRadius:"50%",background:`radial-gradient(circle,${ac}18,transparent)`,transition:"transform 1.1s cubic-bezier(.4,0,.2,1) .05s",pointerEvents:"none"}}/></>}
      <svg width="250" height="250" viewBox="0 0 260 260" style={{transform:"rotate(-90deg)"}}><circle cx="130" cy="130" r="116" fill="none" stroke={bd} strokeWidth="4"/><circle cx="130" cy="130" r="116" fill="none" stroke={ac} strokeWidth="4" strokeLinecap="round" strokeDasharray={CI} strokeDashoffset={dO} style={{transition:isActive?"stroke-dashoffset .95s linear":"stroke-dashoffset .3s ease",animation:isActive?"rp 2.5s ease infinite":"none"}}/><circle cx="130" cy="130" r="100" fill="none" stroke={isDark?"#1E2330":"#E2E8F0"} strokeWidth="1" strokeDasharray="4 6" style={{animation:isActive?"innerRing 8s linear infinite":"none"}}/></svg>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none"}}>
        {isBr&&bL&&<div style={{animation:"fi .3s"}}><span style={{fontSize:8,fontWeight:800,letterSpacing:4,color:ac}}>{bL}</span><span style={{fontSize:10,fontWeight:800,color:ac,marginLeft:3}}>{bCnt}s</span></div>}
        <div style={{fontSize:56,fontWeight:800,color:t1,lineHeight:1,letterSpacing:"-3px"}}>{sec}</div>
        {isActive&&<div style={{fontSize:8,fontWeight:800,color:ac,marginTop:2}}>{sessPct}%</div>}
        {!isActive&&ts!=="paused"&&<div style={{fontSize:7,fontWeight:700,letterSpacing:4,color:t3,marginTop:3,textTransform:"uppercase"}}>segundos</div>}
        {ts==="idle"&&<div style={{fontSize:8,color:t3,marginTop:4}}>toca para iniciar</div>}
        {ts==="running"&&!isBr&&<div style={{fontSize:7,color:t3,marginTop:2}}>toca para pausar</div>}
        {ts==="paused"&&<div style={{fontSize:9,fontWeight:700,color:ac,marginTop:3,animation:"pausePulse 2s ease infinite"}}>EN PAUSA</div>}
      </div>
    </div>
    <div style={{textAlign:"center",marginBottom:8}}><div style={{display:"inline-flex",alignItems:"center",gap:5}}><Ic name={ph.ic} size={13} color={ac}/><span style={{fontSize:13,fontWeight:800,color:t1}}>{ph.l}</span></div><div style={{fontSize:9,color:t3}}>{ph.r}</div></div>
    <div key={pi} style={{background:cd,borderRadius:16,padding:"14px",marginBottom:8,border:`1px solid ${bd}`,animation:"phaseSlide .35s ease"}}>
      {/* Animated phase illustration */}
      {isActive&&<PhaseVisual type={ph.ic} color={ac} scale={bS} active={isActive}/>}
      {/* Key phrase - large, visible at a glance */}
      {ph.k&&<div style={{fontSize:14,fontWeight:800,color:t1,lineHeight:1.4,marginBottom:8,letterSpacing:"-0.3px"}}>{ph.k}</div>}
      {/* Detail - smaller, for when eyes are open */}
      <p style={{fontSize:10,lineHeight:1.7,color:t3,margin:0,fontWeight:400}}>{ph.i}</p>
      {/* Expandable science */}
      <button onClick={()=>setShowScience(!showScience)} style={{display:"flex",alignItems:"center",gap:4,marginTop:10,padding:0,background:"none",border:"none",cursor:"pointer"}}>
        <Ic name="mind" size={10} color={ac}/>
        <span style={{fontSize:8,color:ac,fontWeight:700,letterSpacing:.5}}>NEUROCIENCIA</span>
        <span style={{fontSize:8,color:ac,transform:showScience?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>▾</span>
      </button>
      {showScience&&<div style={{marginTop:8,padding:"10px 12px",background:ac+"05",borderRadius:10,border:`1px solid ${ac}08`,animation:"fi .3s"}}>
        <div style={{fontSize:9,color:t2,lineHeight:1.7,marginBottom:SCIENCE_DEEP[pr.id]?6:0}}>{ph.sc}</div>
        {SCIENCE_DEEP[pr.id]&&<div style={{fontSize:9,color:t3,lineHeight:1.7,borderTop:`1px solid ${bd}`,paddingTop:6,marginTop:4}}>{SCIENCE_DEEP[pr.id]}</div>}
      </div>}
    </div>
    {/* Next phase preview */}
    {isActive&&nextPh&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",marginBottom:10,borderRadius:10,background:isDark?"#1A1E28":"#F8FAFC"}}>
      <Ic name="rec" size={10} color={t3}/>
      <span style={{fontSize:8,color:t3,fontWeight:600}}>Siguiente: {nextPh.l} ({nextPh.r})</span>
    </div>}
    <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>{pr.ph.map((p,i)=><div key={i} style={{padding:"3px 8px",borderRadius:14,border:pi===i?`1.5px solid ${ac}`:`1px solid ${bd}`,background:pi===i?ac+"08":cd,color:pi===i?ac:t3,fontSize:8,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><span style={{width:3,height:3,borderRadius:"50%",background:pi===i?ac:bd}}/>{p.r}</div>)}</div>
    <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center"}}>
      {ts==="idle"&&<button onClick={go} style={{flex:1,maxWidth:260,padding:"14px 0",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2.5,display:"flex",alignItems:"center",justifyContent:"center",gap:7,textTransform:"uppercase",animation:"gl 3s ease infinite",boxShadow:`0 4px 18px ${ac}28`}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}><Ic name="bolt" size={13} color="#fff"/>INICIAR</button>}
      {ts==="running"&&<><button onClick={pa} style={{flex:1,maxWidth:180,padding:"12px 0",borderRadius:50,background:cd,border:`2px solid ${ac}`,color:ac,fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>PAUSAR</button><RB o={rs} bd={bd} cd={cd} t3={t3}/></>}
      {ts==="paused"&&<><button onClick={()=>{setTs("running");H("go");}} style={{flex:1,maxWidth:180,padding:"12px 0",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:10,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>CONTINUAR</button><RB o={rs} bd={bd} cd={cd} t3={t3}/></>}
    </div>
    {isActive&&<div style={{marginTop:14,height:20,borderRadius:10,overflow:"hidden",background:cd,border:`1px solid ${bd}`,position:"relative"}}><svg width="800" height="20" viewBox="0 0 800 20" style={{position:"absolute",top:0,left:0,animation:"wf 4s linear infinite",opacity:.2}}><path d={`M0,10 ${Array.from({length:40},(_,i)=>`Q${i*20+10},${i%2===0?3:17} ${(i+1)*20},10`).join(" ")}`} fill="none" stroke={ac} strokeWidth="1"/></svg><div style={{position:"absolute",left:0,top:0,bottom:0,width:(pct*100)+"%",background:`linear-gradient(90deg,${ac}15,${ac}06)`,transition:"width .95s linear",borderRadius:10}}/></div>}
  </>}
  </div>)}

  {tab==="dashboard"&&(<div style={{padding:"14px 20px 180px"}}>
    {noData?<div style={{textAlign:"center",padding:"50px 20px"}}><Ic name="bolt" size={34} color={ac}/><div style={{fontSize:15,fontWeight:800,color:t1,marginTop:10,marginBottom:5}}>Tu dashboard te espera</div><div style={{fontSize:11,color:t3,marginBottom:18}}>Completa tu primera ignición.</div><button onClick={()=>switchTab("ignicion")} style={{padding:"11px 28px",borderRadius:50,background:ac,border:"none",color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>IR A IGNICIÓN</button></div>
    :<>

    {/* ═══ NEURAL STATE RADAR ═══ */}
    <div style={{background:cd,borderRadius:22,padding:"18px 14px",marginBottom:14,border:`1px solid ${bd}`,position:"relative",overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2}}>
        <div><div style={{fontSize:7,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:3}}>Estado Neural</div><AN value={perf} sfx="%" color={t1} sz={30}/></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:nSt.color,animation:"shimDot 2s ease infinite"}}/><span style={{fontSize:9,fontWeight:700,color:nSt.color}}>{nSt.label}</span></div>
      </div>
      <svg width="200" height="160" viewBox="0 0 200 160" style={{display:"block",margin:"0 auto"}}>
        {/* Radar grid */}
        {[.25,.5,.75,1].map((s,i)=><polygon key={i} points={`100,${80-60*s} ${100+70*s},80 100,${80+60*s} ${100-70*s},80`} fill="none" stroke={bd} strokeWidth={i===3?".8":".4"}/>)}
        {/* Axis labels */}
        <text x="100" y="10" textAnchor="middle" fill={t3} fontSize="7" fontWeight="700">Enfoque</text>
        <text x="185" y="83" textAnchor="start" fill={t3} fontSize="7" fontWeight="700">Energía</text>
        <text x="100" y="155" textAnchor="middle" fill={t3} fontSize="7" fontWeight="700">Calma</text>
        <text x="15" y="83" textAnchor="end" fill={t3} fontSize="7" fontWeight="700">Resiliencia</text>
        {/* Data polygon */}
        {(()=>{const f=st.coherencia/100,e=st.capacidad/100,c=st.resiliencia/100,r=Math.max(0,(perf-20)/80);return<polygon points={`100,${80-60*f} ${100+70*e},80 100,${80+60*c} ${100-70*r},80`} fill={ac+"15"} stroke={ac} strokeWidth="1.5" style={{animation:"fi .8s ease"}}/>;})()}
        {/* Data dots */}
        <circle cx="100" cy={80-60*(st.coherencia/100)} r="3" fill={ac}/>
        <circle cx={100+70*(st.capacidad/100)} cy="80" r="3" fill={ac}/>
        <circle cx="100" cy={80+60*(st.resiliencia/100)} r="3" fill={ac}/>
        <circle cx={100-70*(Math.max(0,(perf-20)/80))} cy="80" r="3" fill={ac}/>
      </svg>
      <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:4}}>
        <div style={{background:lv.c+"0C",borderRadius:8,padding:"4px 8px"}}><span style={{fontSize:8,fontWeight:800,color:lv.c}}>{lv.n}</span></div>
        <div style={{background:bd,borderRadius:8,padding:"4px 8px"}}><span style={{fontSize:8,fontWeight:700,color:t3}}>{lPct}% → {nLv?.n||"MAX"}</span></div>
      </div>
    </div>

    {/* ═══ IMPACTO MEDIBLE ═══ */}
    {(()=>{const ml=st.moodLog||[];const withPre=ml.filter(m=>m.pre>0);if(withPre.length<2)return null;const avg=+(withPre.reduce((a,m)=>a+(m.mood-m.pre),0)/withPre.length).toFixed(1);const bestP={};withPre.forEach(m=>{if(!bestP[m.proto])bestP[m.proto]={sum:0,cnt:0};bestP[m.proto].sum+=m.mood-m.pre;bestP[m.proto].cnt++;});const best=Object.entries(bestP).sort((a,b)=>(b[1].sum/b[1].cnt)-(a[1].sum/a[1].cnt))[0];return(
      <div style={{background:`linear-gradient(135deg,${ac}08,${ac}03)`,borderRadius:18,padding:"16px 14px",marginBottom:14,border:`1px solid ${ac}12`}}>
        <div style={{fontSize:7,fontWeight:800,letterSpacing:3,color:ac,textTransform:"uppercase",marginBottom:8}}>Impacto Medible</div>
        <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:6}}>
          <span style={{fontSize:28,fontWeight:800,color:avg>0?"#059669":avg<0?"#DC2626":t1}}>{avg>0?"+":""}{avg}</span>
          <span style={{fontSize:10,color:t2}}>puntos de mejora promedio por sesión</span>
        </div>
        <div style={{fontSize:10,color:t2,lineHeight:1.6}}>
          Basado en {withPre.length} sesiones con check-in completo.
          {best&&best[1].cnt>=2&&<span> Tu protocolo más efectivo: <span style={{fontWeight:800,color:t1}}>{best[0]}</span> ({best[1].cnt>=2?"+"+((best[1].sum/best[1].cnt)).toFixed(1):"—"} promedio).</span>}
        </div>
      </div>);})()}

    {/* ═══ ACTIVITY HEATMAP (GitHub-style, 4 weeks) ═══ */}
    <div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{fontSize:7,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:10}}>Actividad · 28 días</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {(()=>{const cells=[];const now=new Date();const hist=st.history||[];for(let d=27;d>=0;d--){const day=new Date(now);day.setDate(day.getDate()-d);const ds=day.toDateString();const count=hist.filter(h=>new Date(h.ts).toDateString()===ds).length;const isToday=d===0;cells.push(<div key={d} style={{aspectRatio:"1",borderRadius:4,background:count===0?(isDark?"#1A1E28":"#F1F5F9"):count===1?ac+"30":count===2?ac+"60":ac,border:isToday?`1.5px solid ${ac}`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{count>0&&<span style={{fontSize:6,fontWeight:800,color:count>=3?"#fff":ac}}>{count}</span>}</div>);}return cells;})()}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:7,color:t3}}>4 semanas atrás</span><span style={{fontSize:7,color:t3}}>Hoy</span></div>
    </div>

    {/* ═══ ENERGY FLOW — Hour distribution ═══ */}
    {st.history?.length>=3&&<div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{fontSize:7,fontWeight:800,letterSpacing:3,color:t3,textTransform:"uppercase",marginBottom:10}}>Tu Flujo de Energía</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:2,height:40}}>
        {(()=>{const hrs=Array(24).fill(0);(st.history||[]).forEach(h=>{const hr=new Date(h.ts).getHours();hrs[hr]++;});const mx=Math.max(...hrs,1);const slots=[];for(let i=6;i<23;i++){const v=hrs[i];slots.push(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><div style={{width:"100%",borderRadius:3,height:Math.max((v/mx)*34,1),background:v>0?ac:bd,transition:"height .5s",opacity:v>0?(.3+.7*(v/mx)):1}}/>{i%3===0&&<span style={{fontSize:6,color:t3}}>{i}</span>}</div>);}return slots;})()}
      </div>
      <div style={{fontSize:9,color:t2,marginTop:8,fontStyle:"italic"}}>{(()=>{const hrs=Array(24).fill(0);(st.history||[]).forEach(h=>{hrs[new Date(h.ts).getHours()]++;});const pk=hrs.indexOf(Math.max(...hrs));return pk>0?`Tu hora pico: ${pk}:00. Tu sistema rinde mejor aquí.`:"Aún recopilando datos de tu patrón.";})()}</div>
    </div>}

    {/* ═══ MOOD TREND ═══ */}
    {moodTrend.length>=2&&<div style={{background:cd,borderRadius:16,padding:"12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:7,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>Tendencia Emocional</span><div style={{display:"flex",alignItems:"center",gap:3}}><Ic name={MOODS[Math.round(avgMood)-1]?.icon||"neutral"} size={12} color={MOODS[Math.round(avgMood)-1]?.color||t3}/><span style={{fontSize:12,fontWeight:800,color:MOODS[Math.round(avgMood)-1]?.color||t3}}>{avgMood}</span><span style={{fontSize:8,color:t3}}>/5</span></div></div>
      <SK data={moodTrend} c={MOODS[Math.round(avgMood)-1]?.color||"#6366F1"} w={340} h={26} id="mood"/>
    </div>}

    {/* ═══ METRICS GRID ═══ */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
      {[{l:"Enfoque",v:st.coherencia,d:rD.c>0?"+"+rD.c+"%":"—",c:"#3B82F6",u:"e"},{l:"Calma",v:st.resiliencia,d:rD.r>0?"+"+rD.r+"%":"—",c:"#8B5CF6",u:"c"},{l:"V-Cores",v:st.vCores||0,d:"+"+(st.history?.slice(-1)[0]?.vc||0),c:"#D97706",u:"v"},{l:"Sesiones",v:st.totalSessions,d:st.streak+"d racha",c:"#059669",u:"t"}].map((k,i)=>(
        <div key={i} style={{background:cd,borderRadius:14,padding:"11px 10px",border:`1px solid ${bd}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:7,fontWeight:700,color:t3}}>{k.l}</span><span style={{fontSize:7,fontWeight:700,color:"#059669"}}>{k.d}</span></div>
          <AN value={k.v} sfx={k.l==="Enfoque"||k.l==="Calma"?"%":""} color={k.c} sz={20}/>
        </div>))}
    </div>

    {/* ═══ RECORDS ═══ */}
    {records.topProto&&<div style={{background:cd,borderRadius:16,padding:"12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><Ic name="trophy" size={14} color={ac}/><span style={{fontSize:7,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase"}}>Récords Personales</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
        {[{v:records.bestStreak,l:"Mejor racha",s:"días"},{v:records.maxC+"%",l:"Max coherencia",s:""},{v:records.topProto.c+"x",l:records.topProto.n,s:""},{v:records.earliest!==null?records.earliest+":00":"—",l:"Más temprana",s:""}].map((r,i)=>
          <div key={i} style={{padding:"8px",background:isDark?"#1A1E28":"#F8FAFC",borderRadius:10}}>
            <div style={{fontSize:14,fontWeight:800,color:t1}}>{r.v}</div>
            <div style={{fontSize:7,color:t3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.l} {r.s}</div>
          </div>)}
      </div>
    </div>}

    {/* ═══ COACH IA ═══ */}
    <SL t="Coach IA"/>
    <div style={{marginBottom:14}}>{ins.slice(0,3).map((x,i)=>(
      <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",padding:"10px 11px",background:cd,borderRadius:11,border:`1px solid ${bd}`,marginBottom:3}}>
        <Ic name={x.t==="up"?"up":x.t==="fire"?"fire":x.t==="rec"?"rec":x.t==="alert"?"alert":"star"} size={12} color={x.t==="up"?ac:x.t==="fire"?"#D97706":x.t==="alert"?"#DC2626":"#6366F1"}/>
        <span style={{fontSize:10,color:t2,lineHeight:1.5}}>{x.x}</span>
      </div>))}</div>

    {/* ═══ WEEKLY CHART + SUMMARY ═══ */}
    {weeklySummary&&<div style={{background:isDark?"#141820":"#F8FAFC",borderRadius:16,padding:"12px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{fontSize:9,color:t2,lineHeight:1.6}}>Semana pasada: <span style={{fontWeight:800,color:t1}}>{weeklySummary.prev}</span>. Actual: <span style={{fontWeight:800,color:t1}}>{weeklySummary.curr}</span>.{weeklySummary.diff>0?<span style={{color:"#059669",fontWeight:700}}> +{weeklySummary.diff}</span>:weeklySummary.diff<0?<span style={{color:"#DC2626",fontWeight:700}}> {weeklySummary.diff}</span>:<span style={{color:t3}}> Igual</span>}.{weeklySummary.mAvg>0&&<span> Mood: <span style={{fontWeight:800}}>{weeklySummary.mAvg}/5</span></span>}</div>
    </div>}
    <div style={{background:cd,borderRadius:16,padding:"12px 10px",marginBottom:14,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:50}}>{st.weeklyData.map((v,i)=>{const a=((new Date().getDay()+6)%7)===i;return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><div style={{width:"100%",borderRadius:5,height:Math.max((v/mW)*42,2),background:a?ac:bd,transition:"height .6s"}}/><span style={{fontSize:7,color:a?ac:t3,fontWeight:a?800:600}}>{DN[i]}</span></div>);})}</div>
    </div>

    <button onClick={()=>setShowHist(true)} style={{width:"100%",padding:"11px",borderRadius:13,border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:14}}><Ic name="clock" size={13} color={t3}/><span style={{fontSize:10,fontWeight:700,color:t2}}>Historial ({(st.history||[]).length})</span></button>
    {st.achievements.length>0&&<div style={{background:ac+"05",borderRadius:16,padding:"12px 10px",border:`1px solid ${ac}10`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}><Ic name="star" size={14} color={ac}/><span style={{fontSize:11,fontWeight:800,color:ac}}>Logros</span></div>{st.achievements.map(a=><div key={a} style={{fontSize:9,color:ac,padding:"2px 0",display:"flex",alignItems:"center",gap:5,fontWeight:600}}><div style={{width:3,height:3,borderRadius:"50%",background:ac}}/>{AM[a]||a}</div>)}</div>}
    </>}
  </div>)}

  {tab==="perfil"&&(<div style={{padding:"14px 20px 180px"}}>
    <div style={{textAlign:"center",marginBottom:22,marginTop:12}}>
      <div style={{width:76,height:76,borderRadius:"50%",margin:"0 auto 10px",background:`linear-gradient(135deg,${ac},#6366F1)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 30px ${ac}22`,position:"relative"}}><Ic name="user" size={30} color="#fff"/>
        <div style={{position:"absolute",bottom:-2,right:-2,width:22,height:22,borderRadius:"50%",background:lv.c,display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${cd}`}}><span style={{fontSize:7,fontWeight:800,color:"#fff"}}>{lv.n[0]}</span></div>
      </div>
      <div style={{fontSize:18,fontWeight:800,color:t1}}>Operador Neural</div>
      <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:5,padding:"3px 10px",background:nSt.color+"0C",borderRadius:14}}><div style={{width:4,height:4,borderRadius:"50%",background:nSt.color,animation:"shimDot 2s ease infinite"}}/><span style={{fontSize:8,fontWeight:700,color:nSt.color}}>{nSt.label} · {lv.n}</span></div>
    </div>

    {/* Level progress */}
    <div style={{background:cd,borderRadius:16,padding:"14px",marginBottom:10,border:`1px solid ${bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:9,fontWeight:800,color:lv.c}}>{lv.n}</span>{nLv&&<span style={{fontSize:9,color:t3}}>→ {nLv.n}</span>}</div>
      <div style={{height:5,background:bd,borderRadius:5,overflow:"hidden",marginBottom:6}}><div style={{width:lPct+"%",height:"100%",borderRadius:5,background:`linear-gradient(90deg,${lv.c},${lv.c}CC)`,transition:"width 1s"}}/></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:7,color:t3}}>{lPct}%</span><span style={{fontSize:7,color:t3}}>{st.totalSessions} sesiones · {Math.round((st.totalTime||0)/60)} min · {st.streak}d racha</span></div>
    </div>

    {/* V-Cores + Mood */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
      <div style={{background:ac+"06",borderRadius:14,padding:"14px 12px",border:`1px solid ${ac}10`}}>
        <div style={{fontSize:7,fontWeight:800,letterSpacing:2,color:ac,textTransform:"uppercase",marginBottom:2}}>V-Cores</div>
        <AN value={st.vCores||0} color={ac} sz={24}/>
      </div>
      <div style={{background:cd,borderRadius:14,padding:"14px 12px",border:`1px solid ${bd}`}}>
        <div style={{fontSize:7,fontWeight:800,letterSpacing:2,color:t3,textTransform:"uppercase",marginBottom:2}}>Mood</div>
        {avgMood>0?<div style={{display:"flex",alignItems:"center",gap:4}}><Ic name={MOODS[Math.round(avgMood)-1]?.icon||"neutral"} size={18} color={MOODS[Math.round(avgMood)-1]?.color||t3}/><span style={{fontSize:20,fontWeight:800,color:MOODS[Math.round(avgMood)-1]?.color||t3}}>{avgMood}</span></div>:<span style={{fontSize:11,color:t3}}>Sin datos</span>}
      </div>
    </div>

    {/* Stats */}
    <div style={{background:cd,borderRadius:16,padding:"14px 12px",marginBottom:10,border:`1px solid ${bd}`}}>
      <SL t="Estadísticas"/>
      {[{l:"Sesiones totales",v:String(st.totalSessions)},{l:"Mejor racha",v:(records.bestStreak||st.streak)+" días"},{l:"Tiempo invertido",v:Math.round((st.totalTime||0)/60)+" min"},{l:"Rendimiento neural",v:perf+"%"},{l:"Protocolos únicos",v:String([...new Set((st.history||[]).map(h=>h.p))].length)},{l:"Nivel",v:lv.n}].map((x,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<5?`1px solid ${bd}`:"none"}}><span style={{fontSize:10,color:t3}}>{x.l}</span><span style={{fontSize:10,fontWeight:800,color:t1}}>{x.v}</span></div>)}
    </div>

    {/* Enterprise Mock */}
    <div style={{background:`linear-gradient(135deg,${isDark?"#141820":"#F0F4FF"},${isDark?"#1A1E28":"#F8FAFC"})`,borderRadius:16,padding:"16px 14px",marginBottom:10,border:`1px solid ${isDark?"#2A2E3A":"#D4DDEF"}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{width:32,height:32,borderRadius:9,background:"#6366F110",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic name="brief" size={16} color="#6366F1"/></div>
        <div><div style={{fontSize:12,fontWeight:800,color:t1}}>BIO-IGNICIÓN Enterprise</div><div style={{fontSize:8,color:"#6366F1",fontWeight:700}}>Para equipos y organizaciones</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
        {[{n:"Dashboard\nde equipo",ic:"chart"},{n:"Métricas\nde bienestar",ic:"up"},{n:"Challenges\ngrupales",ic:"trophy"}].map((f,i)=>
          <div key={i} style={{textAlign:"center",padding:"8px 4px",background:cd,borderRadius:10,border:`1px solid ${bd}`}}>
            <Ic name={f.ic} size={16} color="#6366F1"/><div style={{fontSize:7,color:t3,marginTop:3,lineHeight:1.3,whiteSpace:"pre-line"}}>{f.n}</div>
          </div>)}
      </div>
      <div style={{fontSize:9,color:t2,lineHeight:1.5,textAlign:"center"}}>SSO · API · HIPAA · Multi-empresa · QR Onboarding</div>
    </div>

    <div style={{display:"flex",gap:6,marginBottom:10}}>
      <button onClick={()=>setShowSettings(true)} style={{flex:1,padding:"12px",borderRadius:13,border:`1px solid ${bd}`,background:cd,fontSize:10,fontWeight:700,color:t2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Ic name="gear" size={13} color={t3}/>Ajustes</button>
      <button onClick={()=>setShowHist(true)} style={{flex:1,padding:"12px",borderRadius:13,border:`1px solid ${bd}`,background:cd,fontSize:10,fontWeight:700,color:t2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Ic name="clock" size={13} color={t3}/>Historial</button>
    </div>
    <button onClick={()=>{if(typeof window!=="undefined"&&window.confirm("¿Reiniciar todos los datos?")){setSt({...DS,weekNum:getWeekNum()});}}} style={{width:"100%",padding:"11px",borderRadius:12,border:"1px solid #FEE2E2",background:isDark?"#1A0A0A":"#FFF5F5",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer"}}>Reiniciar Datos</button>
  </div>)}
  </div>

  <div style={{position:"fixed",bottom:58,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"5px 20px",background:`${bg}EB`,backdropFilter:"blur(14px)",display:"flex",justifyContent:"center",gap:12,zIndex:50,borderTop:`1px solid ${bd}`}}>
    {[{v:st.coherencia,d:rD.c>0?`+${rD.c}`:"—",c:"#3B82F6",ic:"focus"},{v:st.resiliencia,d:rD.r>0?`+${rD.r}`:"—",c:"#8B5CF6",ic:"calm"},{v:st.capacidad,d:"+2",c:"#6366F1",ic:"energy"}].map((m,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:2,fontSize:8}}><Ic name={m.ic} size={9} color={m.c}/><span style={{color:"#059669",fontWeight:700,fontSize:7}}>{m.d}</span><span style={{color:m.c,fontWeight:800}}>{m.v}%</span></div>)}
  </div>
  <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`${isDark?"rgba(11,14,20,.94)":"rgba(255,255,255,.94)"}`,backdropFilter:"blur(18px)",borderTop:`1px solid ${bd}`,padding:"3px 10px 10px",display:"flex",justifyContent:"center",zIndex:60}}>
    {[{id:"ignicion",lb:"Ignición",ic:"bolt"},{id:"dashboard",lb:"Dashboard",ic:"chart"},{id:"perfil",lb:"Perfil",ic:"user"}].map(t=>{const a=tab===t.id;return(<button key={t.id} onClick={()=>switchTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"6px 0 1px",border:"none",cursor:"pointer",background:a?(isDark?"#1A1E28":"#E8ECF4"):"transparent",borderRadius:11,margin:"0 2px"}}>
      <Ic name={t.ic} size={17} color={a?(t.id==="ignicion"?ac:t.id==="dashboard"?"#6366F1":t1):t3}/><span style={{fontSize:7,fontWeight:700,color:a?t1:t3}}>{t.lb}</span>
    </button>);})}
  </div>
  </div>);
}

function RB({o,bd,cd,t3}){return<button onClick={o} style={{width:42,height:42,borderRadius:"50%",border:`1px solid ${bd}`,background:cd,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.93)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}><Ic name="reset" size={15} color={t3}/></button>;}
function SL({t}){return<div style={{fontSize:7,fontWeight:800,letterSpacing:3,color:"#94A3B8",textTransform:"uppercase",marginBottom:7}}>{t}</div>;}
