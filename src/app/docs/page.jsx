import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "API Docs",
  description: "Documentación pública de la API v1 — autenticación Bearer, webhooks firmados, rate-limits.",
  openGraph: {
    title: "BIO-IGNICIÓN · API Docs",
    description: "API v1 · OpenAPI 3.1 · Standard Webhooks · RFC 9331 rate-limits",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

function sectionsFor(locale) {
  const en = locale === "en";
  return [
    {
      id: "auth",
      title: en ? "Authentication" : "Autenticación",
      body: (
        <>
          <p>
            {en ? <>
              Every server-to-server call uses an <code>API Key</code> prefixed with <code>bi_</code>.
              It's issued from Admin · API Keys and sent in the header{" "}
              <code>Authorization: Bearer bi_&lt;key&gt;</code>. Keys are hashed with SHA-256 before
              storage — never in plaintext.
            </> : <>
              Toda llamada server-to-server usa un <code>API Key</code> con prefijo <code>bi_</code>.
              Se emite desde Admin · API Keys y se envía en el header{" "}
              <code>Authorization: Bearer bi_&lt;key&gt;</code>. Las claves se hashean con SHA-256 antes
              de guardarse — nunca en claro.
            </>}
          </p>
          <p>{en
            ? "Browser-to-server requests use a session cookie (NextAuth) + CSRF double-submit."
            : "Los requests navegador→servidor usan cookie de sesión (NextAuth) + CSRF double-submit."}</p>
        </>
      ),
    },
    {
      id: "webhooks",
      title: "Webhooks",
      body: (
        <>
          <p>
            {en ? <>
              We implement the{" "}
              <a href="https://standardwebhooks.com" rel="noopener noreferrer">Standard Webhooks</a> spec.
              Every delivery includes <code>webhook-id</code>, <code>webhook-timestamp</code> and{" "}
              <code>webhook-signature</code> (HMAC-SHA256 in base64, prefix <code>v1,</code>).
            </> : <>
              Implementamos el estándar{" "}
              <a href="https://standardwebhooks.com" rel="noopener noreferrer">Standard Webhooks</a>.
              Cada entrega incluye <code>webhook-id</code>, <code>webhook-timestamp</code> y{" "}
              <code>webhook-signature</code> (HMAC-SHA256 en base64, prefijo <code>v1,</code>).
            </>}
          </p>
          <pre>{`signed = \`\${id}.\${timestamp}.\${body}\`
signature = "v1," + base64(hmac_sha256(secret, signed))`}</pre>
          <p>{en
            ? "Retries with exponential backoff up to 5 times. Timestamps outside ±5 min must be rejected."
            : "Reintentos con backoff exponencial hasta 5 veces. Timestamps fuera de ±5 min deben rechazarse."}</p>
        </>
      ),
    },
    {
      id: "rate-limits",
      title: en ? "Rate limits" : "Rate limits",
      body: (
        <p>
          {en ? <>
            Default: <b>120 req/min</b> per IP, <b>10 req/min</b> on auth endpoints. Quotas come in
            the headers <code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code> and{" "}
            <code>RateLimit-Reset</code>. A <code>429</code> includes <code>Retry-After</code> in seconds.
          </> : <>
            Por defecto: <b>120 req/min</b> por IP, <b>10 req/min</b> en endpoints de auth. Los cupos vienen en
            los headers <code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code> y{" "}
            <code>RateLimit-Reset</code>. Un <code>429</code> incluye <code>Retry-After</code> en segundos.
          </>}
        </p>
      ),
    },
    {
      id: "idempotency",
      title: en ? "Idempotency" : "Idempotencia",
      body: (
        <p>
          {en ? <>
            <code>POST</code> requests that create resources accept <code>Idempotency-Key</code>: retries with the
            same key within 24 h return the original response. Use UUIDv4 per business operation.
          </> : <>
            Los <code>POST</code> que crean recursos aceptan <code>Idempotency-Key</code>: reintentos con la misma
            key dentro de 24 h devuelven la respuesta original. Usa UUIDv4 por operación de negocio.
          </>}
        </p>
      ),
    },
    {
      id: "deprecation",
      title: en ? "Deprecation" : "Deprecación",
      body: (
        <p>
          {en ? <>
            Endpoints marked for retirement return <code>Deprecation: &lt;date&gt;</code>,{" "}
            <code>Sunset: &lt;date&gt;</code> and <code>Link: &lt;replacement&gt;; rel="successor-version"</code>{" "}
            (<a href="https://datatracker.ietf.org/doc/html/rfc8594" rel="noopener noreferrer">RFC 8594</a>).
            Minimum 6 months between the first <i>Deprecation</i> and the <i>Sunset</i>.
          </> : <>
            Los endpoints marcados para retiro devuelven <code>Deprecation: &lt;date&gt;</code>,{" "}
            <code>Sunset: &lt;date&gt;</code> y <code>Link: &lt;replacement&gt;; rel="successor-version"</code>{" "}
            (<a href="https://datatracker.ietf.org/doc/html/rfc8594" rel="noopener noreferrer">RFC 8594</a>).
            Mínimo 6 meses entre el primer <i>Deprecation</i> y el <i>Sunset</i>.
          </>}
        </p>
      ),
    },
    {
      id: "spec",
      title: en ? "OpenAPI specification" : "Especificación OpenAPI",
      body: (
        <>
          <p>
            {en ? <>
              Download the full spec as <a href="/api/openapi">OpenAPI 3.1 JSON</a>.
              Compatible with Scalar, Swagger UI, Postman, Stoplight, Insomnia, HTTPie and clients
              generated with openapi-typescript.
            </> : <>
              Descarga el spec completo en <a href="/api/openapi">JSON OpenAPI 3.1</a>.
              Compatible con Scalar, Swagger UI, Postman, Stoplight, Insomnia, HTTPie y clientes
              generados con openapi-typescript.
            </>}
          </p>
          <pre>{`curl https://bio-ignicion.app/api/openapi -o openapi.json
npx @scalar/cli reference openapi.json
npx openapi-typescript openapi.json -o src/types/api.ts`}</pre>
        </>
      ),
    },
    {
      id: "roi-model",
      title: en ? "ROI model" : "Modelo ROI",
      body: (
        <p>
          {en ? <>
            The <a href="/roi-calculator">public calculator</a> uses the same formula as the team panel:{" "}
            <code>recoveredHours = sessionsMinutes × observedLift × residualFactor ÷ 60</code>,
            with <code>effectSizeCap = 0.35</code> and <code>residualFactor = 2.0</code>. Assumptions and
            references to the literature (Zeidan 2010, Basso 2019) are in <code>src/lib/roi.js</code>.
          </> : <>
            La <a href="/roi-calculator">calculadora pública</a> usa la misma fórmula que el panel de equipo:{" "}
            <code>recoveredHours = sessionsMinutes × observedLift × residualFactor ÷ 60</code>,
            con <code>effectSizeCap = 0.35</code> y <code>residualFactor = 2.0</code>. Supuestos y referencias
            a literatura (Zeidan 2010, Basso 2019) están en el fuente <code>src/lib/roi.js</code>.
          </>}
        </p>
      ),
    },
  ];
}

export default async function DocsPage() {
  const locale = await getServerLocale();
  const en = locale === "en";
  const sections = sectionsFor(locale);
  return (
    <PublicShell activePath="/docs">
      <Container size="lg" className="bi-prose">
        <header style={{ marginBottom: space[6] }}>
          <div style={{ fontSize: font.size.sm, color: cssVar.accent, textTransform: "uppercase", letterSpacing: "2px", fontWeight: font.weight.bold }}>
            API · v1
          </div>
          <h1 style={{ margin: `${space[2]}px 0` }}>{en ? "Developer documentation" : "Documentación para desarrolladores"}</h1>
          <p style={{ maxWidth: 680 }}>
            {en ? <>
              Integrate BIO-IGNITION with your stack — Standard Webhooks, OpenAPI 3.1, rate-limits{" "}
              <a href="https://datatracker.ietf.org/doc/html/rfc9331" rel="noopener noreferrer">RFC 9331</a>,
              idempotency and transparent deprecation.
            </> : <>
              Integra BIO-IGNICIÓN con tu stack — webhooks Standard Webhooks, OpenAPI 3.1, rate-limits{" "}
              <a href="https://datatracker.ietf.org/doc/html/rfc9331" rel="noopener noreferrer">RFC 9331</a>,
              idempotencia y deprecación transparente.
            </>}
          </p>
        </header>

        <nav aria-label={en ? "Index" : "Índice"} style={{ display: "flex", flexWrap: "wrap", gap: space[2], marginBottom: space[6] }}>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                padding: `${space[1]}px ${space[3]}px`,
                border: `1px solid ${cssVar.border}`,
                borderRadius: 999,
                color: cssVar.textDim,
                textDecoration: "none",
                fontSize: font.size.md,
              }}
            >
              {s.title}
            </a>
          ))}
          <Button href="/api/openapi" size="sm">openapi.json ↓</Button>
        </nav>

        <div style={{ display: "grid", gap: space[3] }}>
          {sections.map((s) => (
            <Card as="section" key={s.id} id={s.id} style={{ scrollMarginTop: space[6] }}>
              <h2 style={{ marginTop: 0 }}>{s.title}</h2>
              <div>{s.body}</div>
            </Card>
          ))}
        </div>

        <footer style={{ marginTop: space[8], color: cssVar.textMuted, fontSize: font.size.md }}>
          {en ? "Need an SDK?" : "¿Necesitas un SDK?"}{" "}
          <a href="mailto:developers@bio-ignicion.app">developers@bio-ignicion.app</a> ·{" "}
          {en ? "Live status" : "Estado en tiempo real"}: <a href="/status">/status</a>
        </footer>
      </Container>
    </PublicShell>
  );
}
