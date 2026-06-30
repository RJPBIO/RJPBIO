/* ═══════════════════════════════════════════════════════════════
   BIO-MUSIC — tu sistema nervioso como instrumento.
   ───────────────────────────────────────────────────────────────
   Mapea el estado HRV en vivo (del createStreamingAnalyzer) a parámetros
   musicales para un motor procedural (bioMusicEngine). Señal limpia y HRV
   sana → armonía; señal fragmentada / sin dedo → disonancia. Función PURA
   y testeable; el motor de audio (Web Audio) consume estos parámetros.

   HONESTIDAD: no es una medida clínica de "coherencia cardíaca". Es una
   sonificación EXPRESIVA de la calidad de señal (SQI) + la HRV (RMSSD) +
   el pulso (bpm). El SQI domina la consonancia porque una señal limpia y
   estable es lo que se siente "coherente" al oído.
   ═══════════════════════════════════════════════════════════════ */

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Intervalos (semitonos desde la raíz) por banda de consonancia: de cluster
// disonante (abajo) a maj9 luminoso (arriba).
export function chordForConsonance(c) {
  if (c >= 0.8) return [0, 4, 7, 11, 14]; // maj9 — armonía luminosa
  if (c >= 0.6) return [0, 4, 7];         // mayor — estable
  if (c >= 0.4) return [0, 5, 7];         // sus4 — neutro/abierto
  if (c >= 0.2) return [0, 3, 7, 10];     // m7 — tensión cálida
  return [0, 1, 6];                       // cluster + tritono — disonancia
}

/**
 * @param {object} u — update del streaming analyzer: { hrv:{meanHr,rmssd}, sqi:{score}, fingerOk }
 * @returns {{consonance,dissonance,chord,brightness,pulseHz,level,hasSignal}}
 */
export function mapStateToMusic(u) {
  const sqi = clamp01((Number(u?.sqi?.score) || 0) / 100);
  const rmssd = Number(u?.hrv?.rmssd);
  const bpm = Number(u?.hrv?.meanHr);
  const fingerOk = u?.fingerOk !== false;

  const hasSignal = fingerOk && Number.isFinite(rmssd) && sqi > 0;
  // RMSSD 15→60 ms mapea a 0→1 (rango fisiológico usual en reposo).
  const rmssdNorm = Number.isFinite(rmssd) ? clamp01((rmssd - 15) / 45) : 0;
  // Consonancia: SQI domina (0.7), HRV sana aporta calidez (0.3).
  const consonance = hasSignal ? clamp01(0.7 * sqi + 0.3 * rmssdNorm) : 0.1;
  // Brillo del timbre crece con la HRV.
  const brightness = clamp01(0.3 + 0.7 * rmssdNorm);
  // Pulso = latido. Fuera de rango → 1 Hz neutro.
  const pulseHz = Number.isFinite(bpm) && bpm > 30 && bpm < 220 ? bpm / 60 : 1;
  // Volumen sube con la calidad de señal; sin señal queda tenue y tenso.
  const level = hasSignal ? clamp01(0.4 + 0.6 * sqi) : 0.12;

  return {
    consonance: Math.round(consonance * 1000) / 1000,
    dissonance: Math.round((1 - consonance) * 1000) / 1000,
    chord: chordForConsonance(consonance),
    brightness: Math.round(brightness * 1000) / 1000,
    pulseHz: Math.round(pulseHz * 1000) / 1000,
    level: Math.round(level * 1000) / 1000,
    hasSignal,
  };
}
