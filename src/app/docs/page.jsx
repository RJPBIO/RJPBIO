import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import CodeTabs from "@/components/ui/CodeTabs";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

const QUICKSTART_SNIPPETS = {
  es: [
    {
      id: "curl",
      label: "curl",
      code: `# Whoami — verifica que la key esté viva
curl https://bio-ignicion.app/api/v1/users/me \\
     -H "Authorization: Bearer bi_xxx"

# Crea una sesión idempotente
curl -X POST https://bio-ignicion.app/api/v1/sessions \\
     -H "Authorization: Bearer bi_xxx" \\
     -H "Idempotency-Key: $(uuidgen)" \\
     -H "Content-Type: application/json" \\
     -d '{"protocol":"resonant-breath-5m"}'`,
    },
    {
      id: "ts",
      label: "TypeScript",
      code: `const BASE = "https://bio-ignicion.app/api/v1";
const KEY  = process.env.BI_API_KEY!;          // bi_xxx

// Whoami — verifica que la key esté viva
const me = await fetch(\`\${BASE}/users/me\`, {
  headers: { Authorization: \`Bearer \${KEY}\` },
}).then((r) => r.json());

// Crea una sesión idempotente
const session = await fetch(\`\${BASE}/sessions\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${KEY}\`,
    "Idempotency-Key": crypto.randomUUID(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ protocol: "resonant-breath-5m" }),
}).then((r) => r.json());`,
    },
    {
      id: "py",
      label: "Python",
      code: `import os, uuid, requests

BASE = "https://bio-ignicion.app/api/v1"
KEY  = os.environ["BI_API_KEY"]               # bi_xxx
headers = {"Authorization": f"Bearer {KEY}"}

# Whoami — verifica que la key esté viva
me = requests.get(f"{BASE}/users/me", headers=headers).json()

# Crea una sesión idempotente
session = requests.post(
    f"{BASE}/sessions",
    headers={**headers, "Idempotency-Key": str(uuid.uuid4())},
    json={"protocol": "resonant-breath-5m"},
).json()`,
    },
  ],
  en: [
    {
      id: "curl",
      label: "curl",
      code: `# Whoami — verifies the key is live
curl https://bio-ignicion.app/api/v1/users/me \\
     -H "Authorization: Bearer bi_xxx"

# Create an idempotent session
curl -X POST https://bio-ignicion.app/api/v1/sessions \\
     -H "Authorization: Bearer bi_xxx" \\
     -H "Idempotency-Key: $(uuidgen)" \\
     -H "Content-Type: application/json" \\
     -d '{"protocol":"resonant-breath-5m"}'`,
    },
    {
      id: "ts",
      label: "TypeScript",
      code: `const BASE = "https://bio-ignicion.app/api/v1";
const KEY  = process.env.BI_API_KEY!;          // bi_xxx

// Whoami — verifies the key is live
const me = await fetch(\`\${BASE}/users/me\`, {
  headers: { Authorization: \`Bearer \${KEY}\` },
}).then((r) => r.json());

// Create an idempotent session
const session = await fetch(\`\${BASE}/sessions\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${KEY}\`,
    "Idempotency-Key": crypto.randomUUID(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ protocol: "resonant-breath-5m" }),
}).then((r) => r.json());`,
    },
    {
      id: "py",
      label: "Python",
      code: `import os, uuid, requests

BASE = "https://bio-ignicion.app/api/v1"
KEY  = os.environ["BI_API_KEY"]               # bi_xxx
headers = {"Authorization": f"Bearer {KEY}"}

# Whoami — verifies the key is live
me = requests.get(f"{BASE}/users/me", headers=headers).json()

# Create an idempotent session
session = requests.post(
    f"{BASE}/sessions",
    headers={**headers, "Idempotency-Key": str(uuid.uuid4())},
    json={"protocol": "resonant-breath-5m"},
).json()`,
    },
  ],
};

export const metadata = {
  title: "API Docs",
  description: "Documentación pública de la API v1 — autenticación Bearer, webhooks firmados, rate-limits.",
  alternates: { canonical: "/docs" },
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
              <a href="https://standardwebhooks.com" target="_blank" rel="noopener noreferrer">Standard Webhooks</a> spec.
              Every delivery includes <code>webhook-id</code>, <code>webhook-timestamp</code> and{" "}
              <code>webhook-signature</code> (HMAC-SHA256 in base64, prefix <code>v1,</code>).
            </> : <>
              Implementamos el estándar{" "}
              <a href="https://standardwebhooks.com" target="_blank" rel="noopener noreferrer">Standard Webhooks</a>.
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
            (<a href="https://datatracker.ietf.org/doc/html/rfc8594" target="_blank" rel="noopener noreferrer">RFC 8594</a>).
            Minimum 6 months between the first <i>Deprecation</i> and the <i>Sunset</i>.
          </> : <>
            Los endpoints marcados para retiro devuelven <code>Deprecation: &lt;date&gt;</code>,{" "}
            <code>Sunset: &lt;date&gt;</code> y <code>Link: &lt;replacement&gt;; rel="successor-version"</code>{" "}
            (<a href="https://datatracker.ietf.org/doc/html/rfc8594" target="_blank" rel="noopener noreferrer">RFC 8594</a>).
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
        <header style={{ marginBottom: space[6], position: "relative" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: `-${space[4]}px -${space[6]}px auto -${space[6]}px`,
              height: 380,
              opacity: 0.2,
              pointerEvents: "none",
              maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
              zIndex: 0,
            }}
          >
            <BioglyphLattice variant="ambient" />
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <IgnitionReveal sparkOrigin="12% 30%">
              <div
                style={{
                  fontSize: font.size.xs,
                  fontFamily: cssVar.fontMono,
                  color: bioSignal.phosphorCyan,
                  textTransform: "uppercase",
                  letterSpacing: "0.28em",
                  fontWeight: font.weight.bold,
                }}
              >
                API · V1
              </div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 64px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.02,
                }}
              >
                {en ? "Integrate the pulse." : "Integra el pulso."}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 24px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  maxWidth: "44ch",
                  margin: `0 0 ${space[4]}px`,
                }}
              >
                {en
                  ? "OpenAPI 3.1. Standard Webhooks. RFC 9331. No vendor lock-in."
                  : "OpenAPI 3.1. Standard Webhooks. RFC 9331. Sin lock-in."}
              </p>
              <p style={{ maxWidth: 680, marginBlockStart: 0 }}>
                {en ? <>
                  Integrate BIO-IGNITION with your stack — Standard Webhooks, OpenAPI 3.1, rate-limits{" "}
                  <a href="https://datatracker.ietf.org/doc/html/rfc9331" target="_blank" rel="noopener noreferrer">RFC 9331</a>,
                  idempotency and transparent deprecation.
                </> : <>
                  Integra BIO-IGNICIÓN con tu stack — webhooks Standard Webhooks, OpenAPI 3.1, rate-limits{" "}
                  <a href="https://datatracker.ietf.org/doc/html/rfc9331" target="_blank" rel="noopener noreferrer">RFC 9331</a>,
                  idempotencia y deprecación transparente.
                </>}
              </p>
            </IgnitionReveal>
          </div>
        </header>

        <div style={{ marginBlock: space[5] }}>
          <PulseDivider intensity="dim" />
        </div>

        <Card as="section" aria-labelledby="quickstart" style={{ marginBlockEnd: space[5], borderColor: cssVar.accent, background: cssVar.accentSoft }}>
          <h2 id="quickstart" style={{ marginTop: 0, fontSize: 18 }}>
            {en ? "Quickstart (60 s)" : "Quickstart (60 s)"}
          </h2>
          <p style={{ marginBlockStart: 0 }}>
            {en ? <>Base URL: <code>https://bio-ignicion.app/api/v1</code> · mint a key in <a href="/admin/api-keys">Admin · API Keys</a>.</>
               : <>Base URL: <code>https://bio-ignicion.app/api/v1</code> · genera una key en <a href="/admin/api-keys">Admin · API Keys</a>.</>}
          </p>
          <CodeTabs
            tabs={QUICKSTART_SNIPPETS[en ? "en" : "es"]}
            ariaLabel={en ? "SDK quickstart samples" : "Ejemplos de quickstart"}
            copyLabel={en ? "Copy" : "Copiar"}
            copiedLabel={en ? "Copied to clipboard" : "Copiado al portapapeles"}
            copyErrorLabel={en ? "Could not copy" : "No se pudo copiar"}
          />
          <p style={{ marginBlockEnd: 0, fontSize: font.size.sm, color: cssVar.textDim }}>
            {en
              ? "Full reference below — auth, webhooks, rate-limits, idempotency, deprecation, OpenAPI and ROI model."
              : "Referencia completa abajo — auth, webhooks, rate-limits, idempotencia, deprecación, OpenAPI y modelo ROI."}
          </p>
        </Card>

        <nav
          aria-label={en ? "Index" : "Índice"}
          style={{
            position: "sticky",
            top: 60,
            zIndex: 5,
            display: "flex",
            flexWrap: "wrap",
            gap: space[2],
            marginBottom: space[6],
            paddingBlock: space[3],
            background: `color-mix(in srgb, var(--bi-bg) 88%, transparent)`,
            backdropFilter: "saturate(160%) blur(8px)",
            borderBottom: `1px solid ${cssVar.border}`,
          }}
        >
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
            <Card as="section" key={s.id} id={s.id} style={{ scrollMarginTop: 140 }}>
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
