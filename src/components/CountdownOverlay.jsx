"use client";

/**
 * CountdownOverlay — Pre-session countdown
 * Shows protocol name + large animated number + expanding ring.
 * Uses state-driven background blur and color.
 */
export function CountdownOverlay({ countdown, pr, bg, ac, t3, theme }) {
  if (countdown <= 0) return null;
  
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 240,
      background: `${bg}DD`,
      backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: t3,
        letterSpacing: 3, textTransform: "uppercase",
        marginBottom: 12,
        animation: "fi 0.4s ease",
      }}>{pr.n}</div>
      
      <div style={{ position: "relative" }}>
        <div key={countdown} style={{
          fontSize: 100, fontWeight: 800, color: ac,
          lineHeight: 1,
          animation: "po 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>{countdown}</div>
        
        {/* Expanding ring */}
        <div key={"r" + countdown} style={{
          position: "absolute", top: "50%", left: "50%",
          width: 130, height: 130, borderRadius: "50%",
          border: `2px solid ${ac}30`,
          animation: "cdPulse 1s ease forwards",
        }} />
      </div>
      
      <div style={{
        fontSize: 10, color: t3, marginTop: 16, opacity: 0.5,
        letterSpacing: 1,
      }}>Preparando tu sesión</div>
    </div>
  );
}
