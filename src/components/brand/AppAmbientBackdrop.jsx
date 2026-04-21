"use client";

/* AppAmbientBackdrop — the PWA's quieter sibling of AmbientBackdrop.
   Marketing needs theatre; /app is an instrument. Same brand atoms
   (lattice + vignette + grain) so the DNA reads through, but no
   conic mesh and no drifting orbs — those compete with the session
   timer and the biometric readouts. Fades further during a running
   session via the [data-session="running"] attribute wired from page.
   Fixed behind everything; never captures events. */
export default function AppAmbientBackdrop() {
  return (
    <div className="bi-app-ambient" aria-hidden>
      <div className="bi-app-ambient-lattice" />
      <div className="bi-app-ambient-halo" />
      <div className="bi-app-ambient-scanline" />
      <div className="bi-app-ambient-vignette" />
      <svg className="bi-app-ambient-grain" width="100%" height="100%">
        <filter id="bi-app-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.28 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bi-app-grain)" />
      </svg>
    </div>
  );
}
