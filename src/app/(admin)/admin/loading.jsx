export default function AdminLoading() {
  return (
    <div aria-live="polite" aria-busy="true" style={{ color: "#A7F3D0", fontFamily: "system-ui" }}>
      <div
        aria-hidden="true"
        style={{ height: 28, width: 220, borderRadius: 8, background: "rgba(16,185,129,.12)", marginBottom: 14, animation: "bi-pulse 1.2s ease-in-out infinite" }}
      />
      <div
        aria-hidden="true"
        style={{ height: 14, width: 160, borderRadius: 6, background: "rgba(16,185,129,.08)", marginBottom: 24, animation: "bi-pulse 1.2s ease-in-out infinite" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              height: 104,
              borderRadius: 16,
              background: "rgba(5,150,105,.08)",
              border: "1px solid #064E3B",
              animation: "bi-pulse 1.2s ease-in-out infinite",
            }}
          />
        ))}
      </div>
      <span className="bi-sr-only">Cargando datos administrativos…</span>
      <style>{`@keyframes bi-pulse{0%,100%{opacity:.5}50%{opacity:1}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`}</style>
    </div>
  );
}
