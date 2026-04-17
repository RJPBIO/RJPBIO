export default function Loading() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#64748B", fontFamily: "system-ui" }}>
      <div aria-live="polite" aria-busy="true" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #334155", borderTopColor: "#10B981", animation: "spin 0.8s linear infinite" }} />
        Cargando…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </main>
  );
}
