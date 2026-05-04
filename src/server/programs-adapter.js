/* ═══════════════════════════════════════════════════════════════
   Phase 6F SP-A — ProgramAssignment ↔ Zustand activeProgram adapter
   ───────────────────────────────────────────────────────────────
   Los helpers existentes en src/lib/programs.js esperan el shape
   Zustand:
     { id: string, startedAt: number(ms), completedSessionDays: number[] }
   La tabla ProgramAssignment usa:
     { programId: string, startedAt: Date, completedDays: Json (Array<int>) }
   Este módulo bridge ambas formas para que los helpers puros sigan
   reusables tanto cliente como server-side sin refactor mayor.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Convierte una row de ProgramAssignment al shape esperado por
 * programTodayStatus / programLagStatus / programProgress.
 *
 * @param {object} assignment - row de ProgramAssignment
 * @returns {{ id: string, startedAt: number, completedSessionDays: number[] }|null}
 */
export function assignmentToActiveProgram(assignment) {
  if (!assignment || typeof assignment !== "object") return null;
  if (!assignment.programId) return null;
  const startedAtMs = assignment.startedAt instanceof Date
    ? assignment.startedAt.getTime()
    : Number(assignment.startedAt) || Date.now();
  // completedDays viene como Json — Postgres lo entrega como array literal
  // ya parseado; en memory adapter se guarda como array directo. Defensivo
  // contra string serializado por si algún driver lo entrega así.
  let days = assignment.completedDays;
  if (typeof days === "string") {
    try { days = JSON.parse(days); } catch { days = []; }
  }
  if (!Array.isArray(days)) days = [];
  return {
    id: assignment.programId,
    startedAt: startedAtMs,
    completedSessionDays: days.filter((d) => Number.isInteger(d) && d > 0),
  };
}
