"use client";
import { useState } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const ZONE_INFO = {
  Enfoque: { axis: "córtex prefrontal", desc: "Capacidad de sostener atención dirigida y filtrar distractores." },
  Calma: { axis: "tono vagal", desc: "Activación parasimpática y regulación emocional sostenida." },
  Energía: { axis: "activación simpática", desc: "Disponibilidad de recursos motores y motivacionales." },
  Estabilidad: { axis: "homeostasis", desc: "Coherencia entre sistemas a lo largo del tiempo." },
};

export function NeuralRadarChart({ st, isDark, ac, t1, t2, t3, bd, onZoneSelect }) {
  const [zone, setZone] = useState(null);
  const ml = st.moodLog || [];
  const last14 = ml.slice(-14);

  const enfoque = Math.round(((st.coherencia || 50) + (last14.filter(m => m.energy >= 2).length / Math.max(1, last14.length)) * 50));
  const calma = Math.round(((st.resiliencia || 50) + (last14.filter(m => m.mood >= 3).length / Math.max(1, last14.length)) * 50));
  const energia = Math.round(((st.capacidad || 50) + (last14.filter(m => m.energy >= 3).length / Math.max(1, last14.length)) * 50));
  const moods = last14.map(m => m.mood).filter(Boolean);
  const variance = moods.length ? Math.sqrt(moods.reduce((a, m) => a + Math.pow(m - moods.reduce((x, y) => x + y, 0) / moods.length, 2), 0) / moods.length) : 1;
  const estabilidad = Math.round(Math.max(20, Math.min(100, 100 - variance * 30)));

  const data = [
    { axis: "Enfoque", value: Math.min(100, enfoque), full: 100 },
    { axis: "Calma", value: Math.min(100, calma), full: 100 },
    { axis: "Energía", value: Math.min(100, energia), full: 100 },
    { axis: "Estabilidad", value: Math.min(100, estabilidad), full: 100 },
  ];

  const balance = Math.round(data.reduce((a, d) => a + d.value, 0) / data.length);
  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const symmetry = Math.round(100 - (max - min));

  return (
    <div style={{ background: isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)", borderRadius: 18, padding: "16px 14px", marginBottom: 14, border: "1px solid " + bd, animation: "fi .5s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t1, letterSpacing: 1.5, textTransform: "uppercase" }}>Mapa Neural</div>
          <div style={{ fontSize: 9, color: t3, marginTop: 2 }}>4 dimensiones · últimos 14 días</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: ac, lineHeight: 1 }}>{balance}</div>
          <div style={{ fontSize: 9, color: t3 }}>balance</div>
        </div>
      </div>

      <div style={{ width: "100%", height: 220, animation: "radarPulse 6s ease infinite" }}>
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke={isDark ? "#334155" : "#CBD5E1"} strokeOpacity={0.3} />
            <PolarAngleAxis dataKey="axis" tick={{ fill: t2, fontSize: 10, fontWeight: 700 }} />
            <Radar name="Tu estado" dataKey="value" stroke={ac} fill={ac} fillOpacity={0.25} strokeWidth={2} />
            <Tooltip
              contentStyle={{ background: isDark ? "#0C1017" : "#FFFFFF", border: "1px solid " + bd, borderRadius: 10, fontSize: 11 }}
              labelStyle={{ color: t1, fontWeight: 700 }}
              itemStyle={{ color: ac }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {data.map(d => (
          <button
            key={d.axis}
            onClick={() => { setZone(d.axis); onZoneSelect && onZoneSelect(d.axis); }}
            style={{ flex: 1, padding: "7px 4px", borderRadius: 9, border: zone === d.axis ? `1.5px solid ${ac}` : `1px solid ${bd}`, background: zone === d.axis ? ac + "10" : "transparent", cursor: "pointer", textAlign: "center" }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: d.value >= 70 ? "#10B981" : d.value >= 50 ? ac : "#F59E0B" }}>{d.value}</div>
            <div style={{ fontSize: 8, color: t3, marginTop: 1, fontWeight: 600 }}>{d.axis}</div>
          </button>
        ))}
      </div>

      {zone && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: ac + "08", borderRadius: 11, animation: "fi .3s", border: "1px solid " + ac + "15" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: 1 }}>{zone} · {ZONE_INFO[zone].axis}</div>
          <div style={{ fontSize: 10, color: t2, marginTop: 4, lineHeight: 1.5 }}>{ZONE_INFO[zone].desc}</div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "8px 10px", background: isDark ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.02)", borderRadius: 9 }}>
        <div style={{ fontSize: 9, color: t3 }}>Simetría neural</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: symmetry >= 70 ? "#10B981" : symmetry >= 50 ? ac : "#F59E0B" }}>{symmetry}%</div>
      </div>
    </div>
  );
}
