/**
 * LoadingScreen v9 — Cinematic Neural Awakening
 *
 * First impression. Sets the tone for the entire experience.
 * The triple-ring SVG is the brand mark — it pulses like a
 * neural system coming online.
 */
export function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#06090F", gap: 20,
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(16,185,129,.06), transparent 65%)",
        filter: "blur(40px)",
        animation: "pu 3s ease-in-out infinite",
      }} />

      {/* Brand mark — triple ring nucleus */}
      <div style={{ position: "relative" }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{
          animation: "pu 2.2s ease infinite",
          filter: "drop-shadow(0 0 12px rgba(16,185,129,.2))",
        }}>
          {/* Outer ring — system boundary */}
          <circle cx="32" cy="32" r="28" fill="none" stroke="#10B981"
            strokeWidth="1.5" opacity=".35"
            strokeDasharray="4 2" />
          {/* Mid ring — cognitive layer */}
          <circle cx="32" cy="32" r="20" fill="none" stroke="#6366F1"
            strokeWidth="1" strokeDasharray="5 4" opacity=".45"
            style={{ animation: "innerRing 6s linear infinite" }} />
          {/* Inner ring — consciousness */}
          <circle cx="32" cy="32" r="12" fill="none" stroke="#10B981"
            strokeWidth="0.8" opacity=".25"
            style={{ animation: "innerRing 10s linear infinite reverse" }} />
          {/* Core — living center */}
          <circle cx="32" cy="32" r="4" fill="#10B981" opacity=".5">
            <animate attributeName="r" values="3.5;5;3.5" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".3;.6;.3" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Brand text */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: "#3E4A60",
          letterSpacing: 6, textTransform: "uppercase",
        }}>BIO-IGNICIÓN</div>
        <div style={{
          fontSize: 9, fontWeight: 600, color: "#2A3344",
          letterSpacing: 3, marginTop: 6,
          textTransform: "uppercase",
        }}>SISTEMA NEURAL</div>
      </div>
    </div>
  );
}
