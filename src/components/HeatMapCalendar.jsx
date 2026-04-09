"use client";
import { useMemo } from "react";

const WEEKS = 12;
const DAYS_PER_WEEK = 7;

function dayKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
}

export function HeatMapCalendar({ history, moodLog, isDark, ac, t1, t2, t3, bd }) {
  const data = useMemo(() => {
    const counts = {};
    const moodSum = {};
    (history || []).forEach(s => {
      const k = dayKey(s.ts);
      counts[k] = (counts[k] || 0) + 1;
    });
    (moodLog || []).forEach(m => {
      if (m.mood > 0) {
        const k = dayKey(m.ts);
        if (!moodSum[k]) moodSum[k] = { sum: 0, n: 0 };
        moodSum[k].sum += m.mood;
        moodSum[k].n += 1;
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (WEEKS * DAYS_PER_WEEK - 1));
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - ((dayOfWeek + 6) % 7));

    const weeks = [];
    for (let w = 0; w < WEEKS; w++) {
      const week = [];
      for (let d = 0; d < DAYS_PER_WEEK; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * DAYS_PER_WEEK + d);
        const k = dayKey(cellDate);
        const c = counts[k] || 0;
        const m = moodSum[k] ? moodSum[k].sum / moodSum[k].n : 0;
        const isFuture = cellDate > today;
        week.push({ date: cellDate, count: c, mood: m, isFuture, isToday: dayKey(cellDate) === dayKey(today) });
      }
      weeks.push(week);
    }
    return weeks;
  }, [history, moodLog]);

  const total = (history || []).length;
  const uniqueDays = new Set((history || []).map(s => dayKey(s.ts))).size;
  const avgPerDay = uniqueDays ? (total / uniqueDays).toFixed(1) : "0";
  const last30 = (history || []).filter(s => Date.now() - s.ts < 30 * 86400000);
  const active30 = new Set(last30.map(s => dayKey(s.ts))).size;

  const colorFor = (cell) => {
    if (cell.isFuture) return "transparent";
    if (cell.count === 0) return isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)";
    const intensity = Math.min(1, 0.25 + cell.count * 0.2 + (cell.mood / 5) * 0.3);
    const r = parseInt(ac.slice(1, 3), 16);
    const g = parseInt(ac.slice(3, 5), 16);
    const b = parseInt(ac.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${intensity.toFixed(2)})`;
  };

  return (
    <div style={{ background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: 18, padding: "16px 14px", marginBottom: 14, border: "1px solid " + bd, animation: "fi .5s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t1, letterSpacing: 1.5, textTransform: "uppercase" }}>Mapa de Actividad</div>
          <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>{WEEKS} semanas · intensidad por día</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: ac, lineHeight: 1 }}>{active30}</div>
          <div style={{ fontSize: 9, color: t3 }}>días activos / 30</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4, animation: "heatAppear .6s ease" }}>
        {data.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((cell, di) => (
              <div
                key={di}
                title={cell.date.toLocaleDateString("es-MX") + " · " + cell.count + " sesiones"}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  background: colorFor(cell),
                  border: cell.isToday ? `1.5px solid ${ac}` : "1px solid " + (isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.03)"),
                  transition: "transform .15s",
                  cursor: cell.count > 0 ? "pointer" : "default"
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
        <div style={{ flex: 1, padding: "8px 10px", background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 9 }}>
          <div style={{ fontSize: 9, color: t3 }}>Total</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t1 }}>{total}</div>
        </div>
        <div style={{ flex: 1, padding: "8px 10px", background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 9 }}>
          <div style={{ fontSize: 9, color: t3 }}>Días únicos</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t1 }}>{uniqueDays}</div>
        </div>
        <div style={{ flex: 1, padding: "8px 10px", background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 9 }}>
          <div style={{ fontSize: 9, color: t3 }}>Promedio</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t1 }}>{avgPerDay}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: t3 }}>menos</span>
        {[0.1, 0.3, 0.5, 0.7, 0.95].map(o => {
          const r = parseInt(ac.slice(1, 3), 16);
          const g = parseInt(ac.slice(3, 5), 16);
          const b = parseInt(ac.slice(5, 7), 16);
          return <div key={o} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(${r},${g},${b},${o})` }} />;
        })}
        <span style={{ fontSize: 9, color: t3 }}>más</span>
      </div>
    </div>
  );
}
