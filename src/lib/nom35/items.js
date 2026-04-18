/* ═══════════════════════════════════════════════════════════════
   NOM-035-STPS-2018 — Guía de Referencia III
   "Cuestionario para identificar los factores de riesgo
    psicosocial y evaluar el entorno organizacional"
   Aplicable a centros de trabajo con ≥ 50 trabajadores (72 ítems).

   Fuente: DOF 23-oct-2018, Anexo III.
   Escala Likert (0=Nunca, 1=Casi nunca, 2=Algunas veces,
   3=Casi siempre, 4=Siempre). Ítems marcados `reverse: true`
   invierten la escala (Siempre=0, Nunca=4) por estar redactados
   en positivo (p.ej. "recibo capacitación útil…").

   NOTA: El texto literal debe validarse contra el DOF oficial
   antes de imprimir actas. La estructura (IDs, dominio,
   categoría, reversos) sí refleja la NOM.
   ═══════════════════════════════════════════════════════════════ */

// Categorías oficiales (5)
export const CATEGORIAS = Object.freeze({
  AMBIENTE:    { id: "ambiente",    label: "Ambiente de trabajo" },
  ACTIVIDAD:   { id: "actividad",   label: "Factores propios de la actividad" },
  TIEMPO:      { id: "tiempo",      label: "Organización del tiempo de trabajo" },
  LIDERAZGO:   { id: "liderazgo",   label: "Liderazgo y relaciones en el trabajo" },
  ENTORNO:     { id: "entorno",     label: "Entorno organizacional" },
});

// Dominios oficiales (10) con la categoría a la que pertenecen
export const DOMINIOS = Object.freeze({
  CONDICIONES:            { id: "condiciones",            label: "Condiciones en el ambiente de trabajo",            categoria: "ambiente" },
  CARGA:                  { id: "carga",                  label: "Carga de trabajo",                                 categoria: "actividad" },
  FALTA_CONTROL:          { id: "falta_control",          label: "Falta de control sobre el trabajo",                categoria: "actividad" },
  JORNADA:                { id: "jornada",                label: "Jornada de trabajo",                               categoria: "tiempo" },
  INTERFERENCIA:          { id: "interferencia",          label: "Interferencia en la relación trabajo-familia",     categoria: "tiempo" },
  LIDERAZGO:              { id: "liderazgo",              label: "Liderazgo",                                        categoria: "liderazgo" },
  RELACIONES:             { id: "relaciones",             label: "Relaciones en el trabajo",                         categoria: "liderazgo" },
  VIOLENCIA:              { id: "violencia",              label: "Violencia laboral",                                categoria: "liderazgo" },
  RECONOCIMIENTO:         { id: "reconocimiento",         label: "Reconocimiento del desempeño",                     categoria: "entorno" },
  PERTENENCIA:            { id: "pertenencia",            label: "Insuficiente sentido de pertenencia e inestabilidad", categoria: "entorno" },
});

/**
 * Ítems 1..72 de la Guía III.
 * reverse:true = texto en positivo; el scoring invierte la escala.
 *
 * Mapeo dominio/categoría tomado del Anexo III de la NOM-035.
 */
export const ITEMS = Object.freeze([
  // Ambiente de trabajo — Condiciones (1–5)
  { id: 1,  text: "El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica.", dominio: "condiciones", reverse: true },
  { id: 2,  text: "El lugar donde trabajo tiene las condiciones ambientales (ruido, iluminación, temperatura, ventilación) adecuadas.", dominio: "condiciones", reverse: true },
  { id: 3,  text: "Mi trabajo me exige hacer mucho esfuerzo físico.",                                           dominio: "condiciones", reverse: false },
  { id: 4,  text: "Me preocupa sufrir un accidente en mi trabajo.",                                              dominio: "condiciones", reverse: false },
  { id: 5,  text: "Considero que en mi trabajo se aplican las normas de seguridad e higiene.",                   dominio: "condiciones", reverse: true },

  // Carga de trabajo (6–17)
  { id: 6,  text: "Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno.",            dominio: "carga", reverse: false },
  { id: 7,  text: "Por la cantidad de trabajo que tengo debo trabajar sin parar.",                              dominio: "carga", reverse: false },
  { id: 8,  text: "Considero que es necesario mantener un ritmo de trabajo acelerado.",                          dominio: "carga", reverse: false },
  { id: 9,  text: "Mi trabajo exige que esté muy concentrado.",                                                  dominio: "carga", reverse: false },
  { id: 10, text: "Mi trabajo requiere que memorice mucha información.",                                          dominio: "carga", reverse: false },
  { id: 11, text: "En mi trabajo tengo que tomar decisiones difíciles muy rápido.",                              dominio: "carga", reverse: false },
  { id: 12, text: "Mi trabajo exige que atienda varios asuntos al mismo tiempo.",                                 dominio: "carga", reverse: false },
  { id: 13, text: "En mi trabajo soy responsable de cosas de mucho valor.",                                       dominio: "carga", reverse: false },
  { id: 14, text: "Respondo ante mi jefe por los resultados de toda mi área de trabajo.",                         dominio: "carga", reverse: false },
  { id: 15, text: "En el trabajo me dan órdenes contradictorias.",                                                dominio: "carga", reverse: false },
  { id: 16, text: "Considero que en mi trabajo me piden hacer cosas innecesarias.",                               dominio: "carga", reverse: false },
  { id: 17, text: "Para hacer mi trabajo debo demostrar sentimientos distintos a los míos.",                      dominio: "carga", reverse: false },

  // Falta de control sobre el trabajo (18–25)
  { id: 18, text: "Mi trabajo permite que desarrolle nuevas habilidades.",                                       dominio: "falta_control", reverse: true },
  { id: 19, text: "En mi trabajo puedo aspirar a un mejor puesto.",                                              dominio: "falta_control", reverse: true },
  { id: 20, text: "Durante mi jornada de trabajo puedo tomar pausas cuando las necesito.",                       dominio: "falta_control", reverse: true },
  { id: 21, text: "Puedo decidir cuánto trabajo realizo durante la jornada.",                                     dominio: "falta_control", reverse: true },
  { id: 22, text: "Puedo cambiar el orden de las actividades que realizo en mi trabajo.",                         dominio: "falta_control", reverse: true },
  { id: 23, text: "Puedo decidir la velocidad a la que realizo mis actividades.",                                 dominio: "falta_control", reverse: true },
  { id: 24, text: "Los cambios que se presentan en mi trabajo dificultan mi labor.",                              dominio: "falta_control", reverse: false },
  { id: 25, text: "Cuando se presentan cambios en mi trabajo se tienen en cuenta mis ideas y opiniones.",         dominio: "falta_control", reverse: true },

  // Jornada de trabajo (26–28)
  { id: 26, text: "Trabajo horarios o turnos nocturnos sin periodos de descanso.",                               dominio: "jornada", reverse: false },
  { id: 27, text: "Trabajo los fines de semana y durante días de descanso.",                                      dominio: "jornada", reverse: false },
  { id: 28, text: "Cuando estoy en casa sigo pensando en los problemas del trabajo.",                             dominio: "jornada", reverse: false },

  // Interferencia trabajo-familia (29–31)
  { id: 29, text: "Debo atender asuntos de trabajo cuando estoy en casa.",                                        dominio: "interferencia", reverse: false },
  { id: 30, text: "Pienso en las actividades familiares o personales cuando estoy en el trabajo.",                dominio: "interferencia", reverse: false },
  { id: 31, text: "Pienso que mis responsabilidades familiares afectan mi trabajo.",                              dominio: "interferencia", reverse: false },

  // Liderazgo (32–40)
  { id: 32, text: "Mi jefe tiene problemas para comunicarse con nosotros.",                                       dominio: "liderazgo", reverse: false },
  { id: 33, text: "La orientación que me da mi jefe me resulta poco clara para realizar mi trabajo.",             dominio: "liderazgo", reverse: false },
  { id: 34, text: "Mi jefe solo fija metas sin decirme cómo lograrlas.",                                          dominio: "liderazgo", reverse: false },
  { id: 35, text: "Mi jefe me indica fechas de entrega de trabajo que considero difíciles de cumplir.",           dominio: "liderazgo", reverse: false },
  { id: 36, text: "Mi jefe solo me indica los errores que cometo.",                                               dominio: "liderazgo", reverse: false },
  { id: 37, text: "Mi jefe ignora mis sugerencias para mejorar el trabajo.",                                      dominio: "liderazgo", reverse: false },
  { id: 38, text: "Mi jefe me respeta.",                                                                          dominio: "liderazgo", reverse: true },
  { id: 39, text: "Mi jefe se interesa por la calidad de vida de sus trabajadores.",                              dominio: "liderazgo", reverse: true },
  { id: 40, text: "Los compañeros del trabajo me ayudan cuando tengo dificultades.",                              dominio: "liderazgo", reverse: true },

  // Relaciones en el trabajo (41–46)
  { id: 41, text: "En mi trabajo puedo expresarme libremente sin interrupciones.",                               dominio: "relaciones", reverse: true },
  { id: 42, text: "Recibo críticas constantes a mi persona y/o desempeño.",                                       dominio: "relaciones", reverse: false },
  { id: 43, text: "Recibo burlas, calumnias, difamaciones, humillaciones o ridiculizaciones.",                    dominio: "relaciones", reverse: false },
  { id: 44, text: "Se ignora mi presencia o se me excluye de las reuniones y eventos.",                           dominio: "relaciones", reverse: false },
  { id: 45, text: "Me ignoran o no me hablan.",                                                                    dominio: "relaciones", reverse: false },
  { id: 46, text: "Se manipulan situaciones de trabajo para hacerme parecer mal ante otros.",                     dominio: "relaciones", reverse: false },

  // Violencia laboral (47–57)
  { id: 47, text: "Se ignoran mis éxitos laborales y se atribuyen a otros trabajadores.",                         dominio: "violencia", reverse: false },
  { id: 48, text: "Me bloquean o impiden las oportunidades que tengo para obtener ascenso o mejora.",             dominio: "violencia", reverse: false },
  { id: 49, text: "He presenciado actos de violencia en mi centro de trabajo.",                                   dominio: "violencia", reverse: false },
  { id: 50, text: "Recibo menos beneficios y oportunidades que otros compañeros por razones ajenas al desempeño.", dominio: "violencia", reverse: false },
  { id: 51, text: "Me obligan a trabajar más horas o a hacer más actividades que a los demás.",                   dominio: "violencia", reverse: false },
  { id: 52, text: "Recibo gritos o insultos cuando se me dan instrucciones.",                                      dominio: "violencia", reverse: false },
  { id: 53, text: "Me amenazan con represalias si no cumplo lo que me piden.",                                     dominio: "violencia", reverse: false },
  { id: 54, text: "Me han acosado o lastimado física o sexualmente en el trabajo.",                                dominio: "violencia", reverse: false },
  { id: 55, text: "He sido discriminado por mi origen, condición o apariencia.",                                   dominio: "violencia", reverse: false },
  { id: 56, text: "Se me asignan actividades por debajo de mi capacidad como castigo.",                           dominio: "violencia", reverse: false },
  { id: 57, text: "Me han bajado el sueldo o lo he dejado de recibir a tiempo sin justificación.",                 dominio: "violencia", reverse: false },

  // Reconocimiento del desempeño (58–64)
  { id: 58, text: "Me informan con claridad cuáles son mis funciones.",                                           dominio: "reconocimiento", reverse: true },
  { id: 59, text: "Me pagan el salario que considero justo por mi trabajo.",                                      dominio: "reconocimiento", reverse: true },
  { id: 60, text: "Recibo reconocimiento o premios cuando hago bien mi trabajo.",                                 dominio: "reconocimiento", reverse: true },
  { id: 61, text: "Me siento orgulloso de trabajar en esta empresa.",                                             dominio: "reconocimiento", reverse: true },
  { id: 62, text: "La capacitación que recibo es útil para mi trabajo.",                                          dominio: "reconocimiento", reverse: true },
  { id: 63, text: "Recibo retroalimentación sobre la forma en que realizo mi trabajo.",                           dominio: "reconocimiento", reverse: true },
  { id: 64, text: "Se reconoce la calidad de mi trabajo.",                                                        dominio: "reconocimiento", reverse: true },

  // Sentido de pertenencia e inestabilidad (65–72)
  { id: 65, text: "Pertenezco a esta empresa porque quiero estar aquí.",                                         dominio: "pertenencia", reverse: true },
  { id: 66, text: "Siento que el trabajo que hago es importante para la empresa.",                                dominio: "pertenencia", reverse: true },
  { id: 67, text: "Me dan los recursos necesarios para hacer mi trabajo.",                                         dominio: "pertenencia", reverse: true },
  { id: 68, text: "Me siento comprometido con mi trabajo.",                                                        dominio: "pertenencia", reverse: true },
  { id: 69, text: "En mi trabajo tengo un contrato por tiempo indeterminado.",                                     dominio: "pertenencia", reverse: true },
  { id: 70, text: "Me preocupa perder mi trabajo en los próximos meses.",                                          dominio: "pertenencia", reverse: false },
  { id: 71, text: "Me preocupa no obtener un trabajo con mejores condiciones.",                                    dominio: "pertenencia", reverse: false },
  { id: 72, text: "Siento que puedo ser yo mismo(a) en mi trabajo.",                                              dominio: "pertenencia", reverse: true },
]);

// Escala Likert — el orden del array importa (0..4)
export const LIKERT = Object.freeze([
  { value: 0, label: "Nunca" },
  { value: 1, label: "Casi nunca" },
  { value: 2, label: "Algunas veces" },
  { value: 3, label: "Casi siempre" },
  { value: 4, label: "Siempre" },
]);

// Cortes de nivel de riesgo para el total (Guía III, 72 ítems, máx 288)
export const NIVEL_TOTAL = Object.freeze([
  { max: 49,  nivel: "nulo",       label: "Nulo o despreciable" },
  { max: 69,  nivel: "bajo",       label: "Bajo" },
  { max: 89,  nivel: "medio",      label: "Medio" },
  { max: 139, nivel: "alto",       label: "Alto" },
  { max: Infinity, nivel: "muy_alto", label: "Muy alto" },
]);
