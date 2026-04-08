"use client";

/**
 * DurationSelector — 60s / 120s / 180s pill selector
 * Glassmorphism style matching the reference.
 */
export function DurationSelector({ durMult, setDurMult, pr, setSec, ac, isDark }) {
  const options = [
    { label: "60s", mult: 0.5 },
    { label: "120s", mult: 1.0 },
    { label: "180s", mult: 1.5 },
  ];

  return (
    <div style={{
      display: "flex", justifyContent: "center", gap: 4,
      marginBottom: 16,
    }}>
      <div style={{
        display: "inline-flex", gap: 2,
        padding: 3, borderRadius: 28,
        background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)",
        border: "1px solid " + (isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"),
      }}>
        {options.map(opt => {
          const active = durMult === opt.mult;
          return (
            <button key={opt.mult} onClick={() => {
              setDurMult(opt.mult);
              setSec(Math.round(pr.d * opt.mult));
            }} style={{
              padding: "7px 18px", borderRadius: 24,
              border: "none",
              background: active ? ac : "transparent",
              color: active ? "#fff" : (isDark ? "#8B95A8" : "#475569"),
              fontSize: 11, fontWeight: active ? 800 : 600,
              letterSpacing: active ? 1 : 0,
              boxShadow: active ? "0 2px 12px " + ac + "30" : "none",
              transition: "all .3s cubic-bezier(.4,0,.2,1)",
            }}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
