"use client";
/* Cinematic brand backdrop for admin — same DNA as /signin AuthHero,
   calmed for productivity (lower opacity, no orb drift animation).
   Layers: mesh (cyan + violet halos) → orbs → scanline → vignette. */
export default function AdminBackdrop() {
  return (
    <div className="bi-admin-backdrop" aria-hidden>
      <div className="bi-admin-mesh" />
      <div className="bi-admin-orb bi-admin-orb-a" />
      <div className="bi-admin-orb bi-admin-orb-b" />
      <div className="bi-admin-scanline" />
      <div className="bi-admin-vignette" />
    </div>
  );
}
