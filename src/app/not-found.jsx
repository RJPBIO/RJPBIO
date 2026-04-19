import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  const links = [
    { href: "/", label: "Inicio" },
    { href: "/pricing", label: "Planes" },
    { href: "/learn", label: "Aprender" },
    { href: "/signin", label: "Entrar" },
  ];

  return (
    <main
      role="main"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "#0B0E14",
        color: "#E2E8F0",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 44, height: 44, borderRadius: 10,
            background: "conic-gradient(from 180deg, #10B981, #22D3EE, #F59E0B, #10B981)",
            boxShadow: "0 0 36px rgba(16,185,129,0.45)",
            marginBottom: 24,
          }}
        />
        <h1 style={{ margin: 0, fontSize: 56, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, color: "#F8FAFC" }}>404</h1>
        <p style={{ margin: "12px 0 28px", color: "#94A3B8", fontSize: 15, lineHeight: 1.5 }}>
          La ruta que buscas no existe o fue movida.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: "inline-block",
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid #1E2330",
                background: "rgba(16,185,129,0.06)",
                color: "#A7F3D0",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
