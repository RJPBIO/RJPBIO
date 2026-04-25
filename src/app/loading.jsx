import { headers } from "next/headers";

export default async function Loading() {
  // Pasar el nonce CSP del middleware al <style> inline. Sin esto, CSP
  // bloquea el bloque y aparece como error de "inline style violation"
  // en consola — degrada el Performance score y se ve mal en demos B2B.
  const h = await headers();
  const nonce = h.get("x-nonce") || undefined;
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#64748B", fontFamily: "system-ui", padding: 24 }}>
      <div aria-live="polite" aria-busy="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span
          aria-hidden="true"
          style={{
            width: 28, height: 28, borderRadius: 6,
            background: "conic-gradient(from 180deg, #10B981, #22D3EE, #F59E0B, #10B981)",
            boxShadow: "0 0 24px rgba(16,185,129,0.55)",
            animation: "bi-orb-spin 1.6s linear infinite",
          }}
        />
        <span style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#94A3B8", fontWeight: 700 }}>Cargando</span>
        <style nonce={nonce}>{`
          @keyframes bi-orb-spin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) {
            [aria-busy="true"] span[aria-hidden] { animation: none !important; }
          }
        `}</style>
      </div>
    </main>
  );
}
