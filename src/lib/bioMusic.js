/* ═══════════════════════════════════════════════════════════════
   BIO-MUSIC — tu sistema nervioso como instrumento (mapeo).
   ───────────────────────────────────────────────────────────────
   Mapea el HRV en vivo a parámetros de una sinfonía en capas. Devuelve
   GRADOS diatónicos (índices dentro del modo del usuario) — NO frecuencias
   ni semitonos crudos — para que el motor los resuelva en la TONALIDAD
   personal (bioMusicSignature). Así siempre suena en la tonalidad del
   usuario: la tensión nace de voicings más cerrados, no de notas "fuera".

   Señal limpia + HRV sana → voicing abierto y luminoso + arpegio presente.
   Señal fragmentada / sin dedo → cluster cerrado + arpegio apagado.

   Pura, testeable. HONESTIDAD: sonificación expresiva, no medida clínica.
   ═══════════════════════════════════════════════════════════════ */

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

// Grados (índices en el modo) por banda de consonancia. >6 = octava arriba.
// Abierto/luminoso arriba → cluster cerrado (tensión diatónica) abajo.
export function chordDegreesForConsonance(c) {
  if (c >= 0.8) return [0, 2, 4, 6, 7]; // I maj9 extendido (1-3-5-7-9)
  if (c >= 0.6) return [0, 2, 4];       // tríada
  if (c >= 0.4) return [0, 3, 4];       // 1-4-5 abierto
  if (c >= 0.2) return [0, 1, 3];       // cluster suave (1-2-4)
  return [0, 1, 2];                     // cluster cerrado (1-2-3) — tensión
}

/**
 * @param {object} u — update del analyzer: { hrv:{meanHr,rmssd}, sqi:{score}, fingerOk }
 */
export function mapStateToMusic(u) {
  const sqi = clamp01((Number(u?.sqi?.score) || 0) / 100);
  const rmssd = Number(u?.hrv?.rmssd);
  const bpm = Number(u?.hrv?.meanHr);
  const fingerOk = u?.fingerOk !== false;

  const hasSignal = fingerOk && Number.isFinite(rmssd) && sqi > 0;
  const rmssdNorm = Number.isFinite(rmssd) ? clamp01((rmssd - 15) / 45) : 0;
  const consonance = hasSignal ? clamp01(0.7 * sqi + 0.3 * rmssdNorm) : 0.1;
  const brightness = clamp01(0.3 + 0.7 * rmssdNorm);
  const pulseHz = Number.isFinite(bpm) && bpm > 30 && bpm < 220 ? bpm / 60 : 1;
  const level = hasSignal ? clamp01(0.4 + 0.6 * sqi) : 0.12;
  // Arpegio: dos notas por latido; densidad/volumen por calidad + coherencia.
  const arpRate = Math.round(pulseHz * 2 * 1000) / 1000;
  const arpGain = hasSignal ? clamp01(level * (0.5 + 0.5 * consonance)) : 0;
  // Shimmer (capa alta) emerge con alta coherencia + HRV.
  const shimmer = clamp01(consonance * brightness);

  const r3 = (x) => Math.round(x * 1000) / 1000;
  return {
    consonance: r3(consonance),
    dissonance: r3(1 - consonance),
    chordDegrees: chordDegreesForConsonance(consonance),
    bassDegree: 0,
    brightness: r3(brightness),
    level: r3(level),
    pulseHz,
    arpRate,
    arpGain: r3(arpGain),
    shimmer: r3(shimmer),
    hasSignal,
  };
}
