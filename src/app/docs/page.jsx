export const metadata = {
  title: "API Docs · BIO-IGNICIÓN",
  description: "Documentación pública de la API v1 — autenticación Bearer, webhooks firmados, rate-limits.",
};

const sections = [
  {
    id: "auth",
    title: "Autenticación",
    body: (
      <>
        <p>
          Toda llamada server-to-server usa un <code style={codeInline}>API Key</code> con prefijo{" "}
          <code style={codeInline}>bi_</code>. Se emite desde{" "}
          <a href="/admin/api-keys" style={link}>Admin · API Keys</a> y se envía en el header{" "}
          <code style={codeInline}>Authorization: Bearer bi_&lt;key&gt;</code>. Las claves se hashean con SHA-256
          antes de guardarse — nunca se almacenan en claro.
        </p>
        <p>Los requests navegador-&gt;servidor usan cookie de sesión (NextAuth) + CSRF double-submit.</p>
      </>
    ),
  },
  {
    id: "webhooks",
    title: "Webhooks",
    body: (
      <>
        <p>
          Implementamos el estándar <a href="https://standardwebhooks.com" style={link} rel="noopener noreferrer">Standard Webhooks</a>.
          Cada entrega incluye <code style={codeInline}>webhook-id</code>, <code style={codeInline}>webhook-timestamp</code> y{" "}
          <code style={codeInline}>webhook-signature</code> (HMAC-SHA256 en base64, prefijo <code style={codeInline}>v1,</code>).
        </p>
        <pre style={codeBlock}>{`signed = \`\${id}.\${timestamp}.\${body}\`
signature = "v1," + base64(hmac_sha256(secret, signed))`}</pre>
        <p>Las entregas reintentan con backoff exponencial hasta 5 veces. Timestamps fuera de ±5 min deben rechazarse.</p>
      </>
    ),
  },
  {
    id: "rate-limits",
    title: "Rate limits",
    body: (
      <>
        <p>
          Por defecto: <b>120 req/min</b> por IP, <b>10 req/min</b> en endpoints de auth. Los cupos aparecen en los headers
          <code style={codeInline}>RateLimit-Limit</code>, <code style={codeInline}>RateLimit-Remaining</code> y{" "}
          <code style={codeInline}>RateLimit-Reset</code>. Un <code style={codeInline}>429</code> incluye{" "}
          <code style={codeInline}>Retry-After</code> en segundos.
        </p>
      </>
    ),
  },
  {
    id: "idempotency",
    title: "Idempotencia",
    body: (
      <>
        <p>
          Los <code style={codeInline}>POST</code> que crean recursos aceptan <code style={codeInline}>Idempotency-Key</code>:
          reintentos con la misma key dentro de 24 h devuelven la respuesta original. Usa UUIDv4 por operación de negocio.
        </p>
      </>
    ),
  },
  {
    id: "deprecation",
    title: "Deprecación",
    body: (
      <>
        <p>
          Los endpoints marcados para retiro devuelven los headers <code style={codeInline}>Deprecation: &lt;date&gt;</code>,{" "}
          <code style={codeInline}>Sunset: &lt;date&gt;</code> y <code style={codeInline}>Link: &lt;replacement&gt;; rel="successor-version"</code>{" "}
          (<a href="https://datatracker.ietf.org/doc/html/rfc8594" style={link} rel="noopener noreferrer">RFC 8594</a>).
          Garantizamos al menos 6 meses entre el primer header <i>Deprecation</i> y el <i>Sunset</i>.
        </p>
      </>
    ),
  },
  {
    id: "spec",
    title: "Especificación OpenAPI",
    body: (
      <>
        <p>
          Descarga el spec completo en <a href="/api/openapi" style={link}>JSON OpenAPI 3.1</a>.
          Compatible con Scalar, Swagger UI, Postman, Stoplight, Insomnia, HTTPie y clientes generados con openapi-typescript.
        </p>
        <pre style={codeBlock}>{`curl https://bio-ignicion.app/api/openapi -o openapi.json
npx @scalar/cli reference openapi.json   # viewer local
npx openapi-typescript openapi.json -o src/types/api.ts   # tipos TS`}</pre>
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <main style={page}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#6EE7B7", textTransform: "uppercase", letterSpacing: 2 }}>API · v1</div>
        <h1 style={{ margin: "6px 0", fontSize: 34, fontWeight: 800 }}>Documentación para desarrolladores</h1>
        <p style={{ color: "#A7F3D0", maxWidth: 720, lineHeight: 1.55 }}>
          Integra BIO-IGNICIÓN con tu stack — webhooks Standard Webhooks, OpenAPI 3.1, rate-limits estándar
          (<a href="https://datatracker.ietf.org/doc/html/rfc9331" style={link} rel="noopener noreferrer">RFC 9331</a>),
          idempotencia, y deprecación transparente.
        </p>
      </header>

      <nav style={toc}>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} style={tocItem}>{s.title}</a>
        ))}
        <a href="/api/openapi" style={{ ...tocItem, background: "#10B981", color: "#052E16", fontWeight: 700 }}>
          openapi.json ↓
        </a>
      </nav>

      {sections.map((s) => (
        <section key={s.id} id={s.id} style={card}>
          <h2 style={{ marginTop: 0, fontSize: 20, fontWeight: 700 }}>{s.title}</h2>
          <div style={{ color: "#D1FAE5", lineHeight: 1.65, fontSize: 14 }}>{s.body}</div>
        </section>
      ))}

      <footer style={{ marginTop: 32, color: "#6B7280", fontSize: 12 }}>
        ¿Necesitas un SDK? <a href="mailto:developers@bio-ignicion.app" style={link}>developers@bio-ignicion.app</a> ·
        Estado en tiempo real: <a href="/status" style={link}>/status</a>
      </footer>
    </main>
  );
}

const page = { minHeight: "100dvh", background: "#0B0E14", color: "#ECFDF5", padding: "40px 24px", maxWidth: 920, margin: "0 auto" };
const card = { padding: 20, marginBottom: 14, background: "rgba(5,150,105,.06)", border: "1px solid #064E3B", borderRadius: 14, scrollMarginTop: 24 };
const toc = { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 };
const tocItem = { padding: "6px 12px", border: "1px solid #065F46", borderRadius: 999, color: "#A7F3D0", textDecoration: "none", fontSize: 13 };
const link = { color: "#6EE7B7", textDecoration: "underline" };
const codeInline = { background: "#0B0E14", padding: "1px 5px", borderRadius: 4, border: "1px solid #064E3B", fontSize: 12 };
const codeBlock = { background: "#0B0E14", padding: 12, borderRadius: 8, border: "1px solid #064E3B", fontSize: 12, overflow: "auto", lineHeight: 1.6 };
