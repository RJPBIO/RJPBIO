/* ═══════════════════════════════════════════════════════════════
   streakCalendar — construye la grilla de actividad estilo
   contribution-graph a partir del history de sesiones.

   Pura: no depende de React. Devuelve una matriz por semanas del
   último `weeks` semanas, con el conteo y "nivel" (0-4) de cada día.

   Agrupación por día usando la fecha local del usuario para que la
   rejilla respete su zona horaria (no se rompen rachas por UTC).
   ═══════════════════════════════════════════════════════════════ */

const MS_DAY = 24 * 60 * 60 * 1000;

function toDayKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function level(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

/**
 * @param {Array}  history  Array de entradas con `ts` numérico.
 * @param {object} [opts]
 * @param {number} [opts.weeks=12]  Cuántas semanas mostrar (contando la actual).
 * @param {number} [opts.now=Date.now()]  Referencia temporal (testeable).
 * @returns {{ weeks: Array<Array<{dayKey:string,date:Date,count:number,level:number,inFuture:boolean}>>, total:number, activeDays:number, longestStreak:number }}
 */
export function buildStreakCalendar(history, { weeks = 12, now = Date.now() } = {}) {
  const counts = new Map();
  let total = 0;
  for (const h of Array.isArray(history) ? history : []) {
    if (!h || typeof h.ts !== "number") continue;
    const key = toDayKey(h.ts);
    counts.set(key, (counts.get(key) || 0) + 1);
    total += 1;
  }

  const todayDate = new Date(now);
  // Normalizamos al inicio del día local.
  todayDate.setHours(0, 0, 0, 0);
  // Día de semana 0=Dom...6=Sáb. Arrancamos la rejilla en el domingo más
  // antiguo dentro del rango (siguiendo la convención de contribution-graph).
  const dowToday = todayDate.getDay();
  const totalDays = weeks * 7;
  const startDate = new Date(todayDate.getTime() - (totalDays - 1 - (6 - dowToday)) * MS_DAY);

  const weeksOut = [];
  let cursor = new Date(startDate);
  let activeDays = 0;
  let longestStreak = 0;
  let run = 0;

  for (let w = 0; w < weeks; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const key = toDayKey(cursor.getTime());
      const count = counts.get(key) || 0;
      const inFuture = cursor.getTime() > todayDate.getTime();
      if (!inFuture && count > 0) {
        activeDays += 1;
        run += 1;
        if (run > longestStreak) longestStreak = run;
      } else if (!inFuture) {
        run = 0;
      }
      weekDays.push({
        dayKey: key,
        date: new Date(cursor),
        count,
        level: inFuture ? 0 : level(count),
        inFuture,
      });
      cursor = new Date(cursor.getTime() + MS_DAY);
    }
    weeksOut.push(weekDays);
  }

  return { weeks: weeksOut, total, activeDays, longestStreak };
}
