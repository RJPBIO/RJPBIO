import { Button } from "@/components/ui/Button";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export const metadata = { title: "Compartir a BIO-IGNICIÓN" };

export default async function Share({ searchParams }) {
  const { title, text, url } = (await searchParams) || {};
  return (
    <main style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      background: cssVar.bg,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
      padding: space[5],
    }}>
      <article style={{
        maxWidth: 520,
        padding: space[5],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.lg,
        display: "grid",
        gap: space[3],
      }}>
        <h1 style={{
          fontSize: font.size.xl,
          fontWeight: font.weight.bold,
          letterSpacing: font.tracking.tight,
          margin: 0,
        }}>
          Contenido recibido
        </h1>
        {title && <p style={{ margin: 0 }}><b>Título:</b> {title}</p>}
        {text && <p style={{ margin: 0 }}><b>Texto:</b> {text}</p>}
        {url && (
          <p style={{ margin: 0 }}>
            <b>URL:</b>{" "}
            <a href={url} style={{ color: cssVar.accent, wordBreak: "break-all" }}>{url}</a>
          </p>
        )}
        <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, margin: 0 }}>
          Guardado como nota en tu perfil.
        </p>
        <Button href="/" variant="secondary" style={{ justifySelf: "start" }}>Volver</Button>
      </article>
    </main>
  );
}
