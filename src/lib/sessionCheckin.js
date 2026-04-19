/* ═══════════════════════════════════════════════════════════════
   sessionCheckin — construye la entrada mood/energy post-sesión y
   decide si alimentar el bandit. Pura; el orquestador (page.jsx)
   aplica setState y llama al store con `outcome` cuando existe.

   Mantener esta lógica separada del render facilita:
     - tests de casos límite (mood=0, falta preMood, cap de 100 entradas)
     - futuros cambios a la recompensa compuesta sin tocar UI
   ═══════════════════════════════════════════════════════════════ */

const MAX_LOG = 100;
const MOOD5_ACHIEVEMENT = "mood5";

/**
 * @param {object} args
 * @param {number} args.checkMood       Mood post-sesión (1-5). 0 = skip.
 * @param {number} args.checkEnergy     Energía post (1-3). Default 2.
 * @param {string} args.checkTag        Etiqueta libre opcional.
 * @param {number} args.preMood         Mood pre-sesión (1-5, 0 = no capturado).
 * @param {object} args.protocol        Protocolo ejecutado ({ n, int, ... }).
 * @param {Array}  args.existingMoodLog Log previo.
 * @param {Array}  args.existingAchievements Achievements previos.
 * @param {number} [args.ts]            Timestamp (default Date.now()).
 * @param {number} [args.predictedDelta] Predicción del motor (para residuales).
 * @param {number} [args.completionRatio] 0-1, % de sesión completada.
 * @param {number} [args.energyDeltaOverride] Δ energía explícito (si hay pre).
 * @param {number} [args.hrvDelta]      Δ lnRMSSD post-pre (si disponible).
 *
 * @returns {{ skipped: boolean, moodLog: Array, achievements: Array, outcome: object|null }}
 *   - skipped=true si checkMood<=0 (no se guarda nada)
 *   - outcome no-null solo si hay preMood>0 (condición para alimentar bandit)
 */
export function buildCheckinEntry({
  checkMood,
  checkEnergy = 2,
  checkTag = "",
  preMood = 0,
  protocol,
  existingMoodLog = [],
  existingAchievements = [],
  ts = null,
  predictedDelta = null,
  completionRatio = 1,
  energyDeltaOverride = null,
  hrvDelta = null,
}) {
  const mood = Number(checkMood);
  if (!Number.isFinite(mood) || mood <= 0) {
    return {
      skipped: true,
      moodLog: existingMoodLog,
      achievements: existingAchievements,
      outcome: null,
    };
  }
  const entry = {
    ts: ts || Date.now(),
    mood,
    energy: Number.isFinite(+checkEnergy) && +checkEnergy > 0 ? +checkEnergy : 2,
    tag: typeof checkTag === "string" ? checkTag : "",
    proto: protocol?.n ?? null,
    pre: Number.isFinite(+preMood) ? +preMood : 0,
  };
  const moodLog = [...(Array.isArray(existingMoodLog) ? existingMoodLog : []), entry].slice(-MAX_LOG);
  const achievements = Array.isArray(existingAchievements) ? [...existingAchievements] : [];
  if (mood === 5 && !achievements.includes(MOOD5_ACHIEVEMENT)) {
    achievements.push(MOOD5_ACHIEVEMENT);
  }
  // Outcome solo si tenemos ambos extremos (pre + post) y protocolo válido.
  const pre = Number(preMood);
  let outcome = null;
  if (Number.isFinite(pre) && pre > 0 && protocol?.int) {
    outcome = {
      intent: protocol.int,
      protocol: protocol.n ?? null,
      deltaMood: mood - pre,
      predictedDelta: typeof predictedDelta === "number" ? predictedDelta : null,
      completionRatio,
    };
    // Δenergy: si el caller lo pasa explícito úsalo; si no, no lo inferimos
    // (el pre.energy no se captura hoy; forzarlo produciría ruido).
    if (typeof energyDeltaOverride === "number" && Number.isFinite(energyDeltaOverride)) {
      outcome.energyDelta = energyDeltaOverride;
    }
    if (typeof hrvDelta === "number" && Number.isFinite(hrvDelta)) {
      outcome.hrvDelta = hrvDelta;
    }
  }
  return { skipped: false, moodLog, achievements, outcome };
}
