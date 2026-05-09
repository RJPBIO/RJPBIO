/* ═══════════════════════════════════════════════════════════════
   particleSystem — Phase 7 SP-B-1 Capa 1
   ───────────────────────────────────────────────────────────────
   Canvas2D-based particle field that synchronizes with breath cycle.
   Foundation reusable para SP-B-2/3/4/5/6 + futuros F1.5/F2.5/F4-F23.

   Specs locked:
     - 12 particles full / 6 low-power / 0 reduced motion
     - Canvas2D rendering (NO SVG to avoid DOM update cost en 12 nodes)
     - RAF loop with delta-time scaling (cap 32ms = 30fps min)
     - Auto-detect low-power: navigator.deviceMemory < 4 → 6 particles

   Phase behaviors (synced con breath cycle):
     - inhale: particles drift centripetally (toward center, force * (1+progress))
     - hold: particles orbit gently (tangential motion)
     - exhale: particles drift centrifugally (toward edges)
     - empty: particles pause (velocity damping)

   Anti-regression: cero modificación a primitives existing. Componentes
   consumers integran createParticleSystem({ canvas, reducedMotion }).
   ═══════════════════════════════════════════════════════════════ */

const PARTICLE_COUNT_FULL = 12;
const PARTICLE_COUNT_LOW = 6;
const PARTICLE_BASE_OPACITY = 0.4;
const PARTICLE_RADIUS_BASE = 1.5;
const PARTICLE_RADIUS_VARIATION = 1.0;
const CYAN_BASE_RGB = { r: 34, g: 211, b: 238 }; // #22D3EE phosphorCyan

const VALID_PHASES = new Set(["inhale", "hold", "exhale", "empty"]);

/**
 * Detect particle count based on device tier.
 * Pattern reuse de NeuralCore3D.jsx:217 (deviceMemory existing usage).
 */
export function detectParticleCount() {
  if (typeof navigator === "undefined") return PARTICLE_COUNT_FULL;
  if (typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4) {
    return PARTICLE_COUNT_LOW;
  }
  return PARTICLE_COUNT_FULL;
}

function createParticle(canvasWidth, canvasHeight, idx, total) {
  const angle = total > 0 ? (idx / total) * Math.PI * 2 : 0;
  const distanceFromCenter = canvasWidth / 4 + Math.random() * (canvasWidth / 6);
  return {
    x: canvasWidth / 2 + Math.cos(angle) * distanceFromCenter,
    y: canvasHeight / 2 + Math.sin(angle) * distanceFromCenter,
    vx: 0,
    vy: 0,
    radius: PARTICLE_RADIUS_BASE + Math.random() * PARTICLE_RADIUS_VARIATION,
    baseOpacity: PARTICLE_BASE_OPACITY + (Math.random() - 0.5) * 0.2,
    angleOffset: angle,
  };
}

/**
 * @param {object} opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {boolean} [opts.reducedMotion=false]
 * @returns {{ start: Function, stop: Function, setPhase: Function, getParticleCount: Function }|null}
 */
export function createParticleSystem({ canvas, reducedMotion = false } = {}) {
  if (!canvas || typeof canvas.getContext !== "function") {
    return null;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const particleCount = reducedMotion ? 0 : detectParticleCount();
  const particles = Array.from({ length: particleCount }, (_, i) =>
    createParticle(canvas.width, canvas.height, i, particleCount),
  );

  let rafId = null;
  let phase = "inhale";
  let phaseProgress = 0;
  let lastTime = 0;
  let cancelled = false;

  function update(deltaTime) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxDistance = canvas.width / 2;

    for (const p of particles) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let targetVx = 0;
      let targetVy = 0;

      switch (phase) {
        case "inhale": {
          const force = -0.0008 * (1 + phaseProgress);
          targetVx = dx * force;
          targetVy = dy * force;
          break;
        }
        case "hold": {
          const orbitalSpeed = 0.0003;
          targetVx = -dy * orbitalSpeed;
          targetVy = dx * orbitalSpeed;
          break;
        }
        case "exhale": {
          const force = 0.0006 * (1 + phaseProgress);
          targetVx = dx * force;
          targetVy = dy * force;
          break;
        }
        case "empty": {
          targetVx = p.vx * 0.95;
          targetVy = p.vy * 0.95;
          break;
        }
      }

      p.vx += (targetVx - p.vx) * 0.05;
      p.vy += (targetVy - p.vy) * 0.05;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      if (distance > maxDistance) {
        const ratio = maxDistance / distance;
        p.x = cx + dx * ratio;
        p.y = cy + dy * ratio;
        p.vx *= 0.5;
        p.vy *= 0.5;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CYAN_BASE_RGB.r}, ${CYAN_BASE_RGB.g}, ${CYAN_BASE_RGB.b}, ${p.baseOpacity})`;
      ctx.fill();
    }
  }

  function tick(timestamp) {
    if (cancelled) return;
    if (lastTime === 0) lastTime = timestamp;
    const deltaTime = Math.min(timestamp - lastTime, 32);
    lastTime = timestamp;
    update(deltaTime);
    render();
    rafId = (typeof requestAnimationFrame !== "undefined")
      ? requestAnimationFrame(tick)
      : null;
  }

  function start() {
    if (cancelled || rafId !== null) return;
    if (particleCount === 0) {
      // Reduced motion: blank canvas (no particles).
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    if (typeof requestAnimationFrame === "undefined") return;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    cancelled = true;
    if (rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
  }

  function setPhase(newPhase, progress = 0) {
    if (typeof newPhase === "string" && VALID_PHASES.has(newPhase)) {
      phase = newPhase;
    }
    if (typeof progress === "number" && Number.isFinite(progress)) {
      phaseProgress = Math.max(0, Math.min(1, progress));
    }
  }

  function getParticleCount() {
    return particleCount;
  }

  function getPhase() {
    return phase;
  }

  return {
    start,
    stop,
    setPhase,
    getParticleCount,
    getPhase,
  };
}

export const __internals = {
  PARTICLE_COUNT_FULL,
  PARTICLE_COUNT_LOW,
  CYAN_BASE_RGB,
  VALID_PHASES,
};
