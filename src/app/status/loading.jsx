import { headers } from "next/headers";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font } from "@/components/ui/tokens";

export default async function StatusLoading() {
  const h = await headers();
  const nonce = h.get("x-nonce") || undefined;
  return (
    <PublicShell activePath="/status">
      <Container size="md" className="bi-prose">
        <header style={{ textAlign: "center", marginBottom: space[8] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            Status
          </div>
          <h1 style={{ margin: `${space[2]}px 0`, color: cssVar.textDim }} aria-busy="true">
            Verificando componentes…
          </h1>
          <p style={{ color: cssVar.textMuted }}>Midiendo latencia en vivo.</p>
        </header>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }} aria-live="polite" aria-busy="true">
          {["Web (SSR)", "API v1", "Webhooks", "DB (read)"].map((name) => (
            <li
              key={name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: `${space[3]}px ${space[4]}px`,
                borderBottom: `1px solid ${cssVar.border}`,
                fontSize: font.size.lg,
              }}
            >
              <span>{name}</span>
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: 96,
                  height: 14,
                  borderRadius: 6,
                  background: cssVar.surface2,
                  animation: "bi-pulse 1.2s ease-in-out infinite",
                }}
              />
            </li>
          ))}
        </ul>
        <style nonce={nonce}>{`@keyframes bi-pulse{0%,100%{opacity:.5}50%{opacity:1}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`}</style>
      </Container>
    </PublicShell>
  );
}
