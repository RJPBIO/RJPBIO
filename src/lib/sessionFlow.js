/* ═══════════════════════════════════════════════════════════════
   sessionFlow — Cierre de sesión post-protocolo.
   Phase 6 SP3 · extracted from comp() en page.jsx:664-729 (legacy).

   Función pura: el caller pasa todos los inputs explícitamente y
   recibe `{newState, eVC, bioQ, postDelta, programAdvance}`. NO
   ejecuta side effects (no setSt, no audio, no haptics, no refs.cleanup);
   el caller los aplica fuera. Esto permite reusarse desde AppV2Root
   sin arrastrar la closure de page.jsx.
   ═══════════════════════════════════════════════════════════════ */

import { computeSessionMetrics } from "./sessionClose";
import { calcSessionCompletion } from "./neural";
import { buildSessionDelta } from "./sessionDelta";
import { programTodayStatus, programRequiredSessions } from "./programs";

/**
 * Cierra una sesión y devuelve la transición de state + side-effects
 * sugeridos. NO muta nada.
 *
 * @param {object} params
 * @param {object} params.sessionData      shape legacy + playerCompletion stash
 * @param {object} params.protocol         protocolo P[i] del catálogo
 * @param {object} params.st               slice del store useStore
 * @param {number} [params.durMult=1]      multiplicador de duración
 * @param {number|null} [params.preMood]   mood pre-sesión (1-5, 0 = no capturado)
 * @param {object|null} [params.nfcCtx]    contexto NFC station si aplica
 * @param {object|null} [params.circadian] contexto circadiano si aplica
 * @param {boolean} [params.voiceOn]       flag TTS (acepta pero no usa — caller decide speakNow)
 * @param {object} [params.refs]           { sessionStartedAt, sessionEndedAt }
 * @param {Array}  [params.hrvLog]         hrvLog del store para buildSessionDelta
 * @param {number} [params.now=Date.now()] timestamp inyectable para tests
 *
 * @returns {{
 *   sessionDataFull: object,
 *   eVC: number,
 *   newState: object,
 *   bioQ: object,
 *   postDelta: object|null,
 *   programAdvance: { day:number, program:object, finalize:boolean }|null,
 *   announce: string|null
 * }}
 */
export function closeSession({
  sessionData,
  protocol,
  st,
  durMult = 1,
  preMood = null,
  nfcCtx = null,
  circadian = null,
  voiceOn = false, // eslint-disable-line no-unused-vars
  refs = null,
  hrvLog = null,
  now = null,
} = {}) {
  if (!protocol || !sessionData || !st) {
    throw new Error("closeSession: protocol, sessionData y st son requeridos");
  }
  const ts = typeof now === "number" ? now : Date.now();

  // 1. Métricas temporales (pure, ya en lib/sessionClose).
  const metrics = computeSessionMetrics({ sessionData, protocol, durMult, now: ts });
  const sessionDataFull = metrics.sessionDataFull;

  // 2. Cómputo de cierre (pure, en lib/neural). Devuelve {eVC, newState, bioQ}.
  const result = calcSessionCompletion(st, {
    protocol,
    durMult,
    sessionData: sessionDataFull,
    nfcCtx,
    circadian,
  });

  // 3. Delta HRV opcional (pure). Solo si se pasaron timestamps.
  let postDelta = null;
  if (refs && typeof refs.sessionStartedAt === "number" && typeof refs.sessionEndedAt === "number") {
    try {
      postDelta = buildSessionDelta({
        sessionStartedAt: refs.sessionStartedAt,
        sessionEndedAt: refs.sessionEndedAt,
        hrvLog: Array.isArray(hrvLog) ? hrvLog : (Array.isArray(st.hrvLog) ? st.hrvLog : []),
        preMood: typeof preMood === "number" ? preMood : null,
        postMood: null,
        durationSec: Math.round((protocol.d || 0) * durMult),
      });
    } catch {
      postDelta = null;
    }
  }

  // 4. Programs avance — derivado de la lógica de comp() líneas 711-728.
  let programAdvance = null;
  let announce = null;
  if (st.activeProgram && st.activeProgram.id && protocol?.id) {
    const todayStatus = programTodayStatus(st.activeProgram, ts);
    if (
      todayStatus.shouldSession &&
      todayStatus.session &&
      todayStatus.session.protocolId === protocol.id
    ) {
      const program = todayStatus.program;
      const totalRequired = programRequiredSessions(program);
      const completedNow = (st.activeProgram.completedSessionDays?.length || 0) + 1;
      const finalize = completedNow >= totalRequired;
      programAdvance = {
        day: todayStatus.day,
        program,
        finalize,
      };
      announce = finalize
        ? `¡Programa ${program.n} completado! +20 vCores.`
        : `Día ${todayStatus.day} del programa ${program.n} completado.`;
    }
  }

  return {
    sessionDataFull,
    eVC: result.eVC,
    newState: result.newState,
    bioQ: result.bioQ,
    postDelta,
    programAdvance,
    announce,
  };
}

/**
 * Adapter que convierte el shape rico de Phase 4 ProtocolPlayer
 * (`playerCompletion`) al `sessionData` legacy que `closeSession`
 * y los helpers consumen. Stash el playerCompletion raw en el campo
 * homónimo para futuro consumo (CLEANUP_BACKLOG #12).
 *
 * @param {object} playerCompletion shape Phase 4
 * @param {object} protocol         protocolo P[i]
 * @param {number} startedAt        timestamp de mount del player
 * @returns {object} sessionData legacy
 */
export function adaptPlayerCompletionToSessionData(playerCompletion, protocol, startedAt) {
  const durationMs = playerCompletion?.durationMs || 0;
  const actualSec = Math.round(durationMs / 1000);
  const expectedSec = Math.round((protocol?.d || 0));
  return {
    interactions: playerCompletion?.completedActs || 0,
    actualSec,
    expectedSec,
    startedAt: typeof startedAt === "number" ? startedAt : Date.now() - durationMs,
    hiddenMs: 0,
    pauses: 0,
    scienceViews: 0,
    motionSamples: 0,
    stability: 0,
    touchHolds: 0,
    reactionTimes: [],
    phaseTimings: [{
      phase: "player_v2",
      durationMs,
      completedActs: playerCompletion?.completedActs || 0,
      totalActs: playerCompletion?.totalActs || 0,
      status: playerCompletion?.status,
      partial: playerCompletion?.partial,
      partialPercent: playerCompletion?.partialPercent,
      banditWeight: playerCompletion?.banditWeight,
      useCase: playerCompletion?.useCase,
    }],
    playerCompletion,
  };
}
