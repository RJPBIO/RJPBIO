import { ImageResponse } from "next/og";

export const alt = "BIO—IGNICIÓN · Plataforma de Optimización Humana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0B1220",
          color: "#F8FAFC",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(34,211,238,0.18)",
              border: "2px dashed rgba(34,211,238,0.55)",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#22D3EE",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 20,
              fontWeight: 800,
              color: "#22D3EE",
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Neural Performance
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 140, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>
            <span style={{ color: "rgba(203,213,225,0.7)", fontWeight: 400 }}>BIO</span>
            <span style={{ color: "#22D3EE", padding: "0 20px" }}>—</span>
            <span style={{ color: "#F8FAFC" }}>IGNICIÓN</span>
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "rgba(203,213,225,0.85)", lineHeight: 1.35 }}>
            Plataforma de Optimización Humana · Sistema Neural de Performance
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "rgba(148,163,184,0.9)", letterSpacing: 2 }}>
            bio-ignicion.app
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#22D3EE" }} />
            <div style={{ display: "flex", fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#22D3EE", letterSpacing: 4, textTransform: "uppercase" }}>
              Ignición · Ready
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
