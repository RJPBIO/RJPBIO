/* ═══════════════════════════════════════════════════════════════
   Custom domain DNS verification — pure helpers.
   ═══════════════════════════════════════════════════════════════
   Flujo (Cloudflare/Vercel-style):
   1. Admin solicita verificación → generamos token "bio-ign-verify-{hex}"
   2. Mostramos TXT record a añadir: _bio-ignicion-verify.{domain} → token
   3. Admin añade el record en su DNS provider
   4. Admin click "Verificar ahora" → server hace dns.resolveTxt y compara
   5. Match → marcamos verified=true, dejamos token persistido para
      eventuales re-checks (rotación cada 90 días suele ser suficiente)

   Por qué prefijar el FQDN con `_bio-ignicion-verify.` en vez del root:
   - Permite verification sin afectar tráfico real al dominio.
   - Convención usada por Vercel, Stripe, Atlassian.
   - El usuario puede añadir el record antes de cambiar nameservers/CNAME.

   Token format intencional:
   - Prefix fijo `bio-ign-verify-` para que admins identifiquen el record
     en su DNS dashboard sin confundirse con otros TXTs (SPF, DKIM, etc).
   - Hex random 24 chars (96 bits entropy) — no necesita ser secret en
     términos criptográficos, sólo único + difícil de adivinar.
   ═══════════════════════════════════════════════════════════════ */

import { randomBytes } from "node:crypto";

export const VERIFY_TOKEN_PREFIX = "bio-ign-verify-";
export const VERIFY_TOKEN_HEX_LENGTH = 24;
export const VERIFY_SUBDOMAIN_PREFIX = "_bio-ignicion-verify";

/**
 * Genera un token único para una nueva verificación.
 */
export function generateVerifyToken() {
  const hex = randomBytes(VERIFY_TOKEN_HEX_LENGTH / 2).toString("hex");
  return `${VERIFY_TOKEN_PREFIX}${hex}`;
}

/**
 * ¿String tiene formato de token válido?
 */
export function isValidToken(token) {
  if (typeof token !== "string") return false;
  if (!token.startsWith(VERIFY_TOKEN_PREFIX)) return false;
  const hex = token.slice(VERIFY_TOKEN_PREFIX.length);
  if (hex.length !== VERIFY_TOKEN_HEX_LENGTH) return false;
  return /^[0-9a-f]+$/i.test(hex);
}

/**
 * Construye el FQDN donde el usuario debe poner el TXT record.
 *
 * @param {string} domain  e.g. "app.empresa.com"
 * @returns {string}        e.g. "_bio-ignicion-verify.app.empresa.com"
 */
export function verifyHostname(domain) {
  if (typeof domain !== "string" || !domain) return null;
  const trimmed = domain.trim().toLowerCase();
  return `${VERIFY_SUBDOMAIN_PREFIX}.${trimmed}`;
}

/**
 * ¿Algún record TXT del array contiene exactamente el token esperado?
 *
 * `dns.resolveTxt` retorna `string[][]` (cada record puede dividirse en
 * fragmentos de ≤255 chars, joined). Soportamos ambos shapes.
 *
 * @param {Array<string|string[]>} records  Resultado de dns.resolveTxt
 * @param {string} expectedToken
 */
export function txtMatchesToken(records, expectedToken) {
  if (!Array.isArray(records) || !expectedToken) return false;
  for (const r of records) {
    const value = Array.isArray(r) ? r.join("") : (typeof r === "string" ? r : null);
    if (!value) continue;
    // Comparación exacta — evita partial matches que faciliten ataques
    // tipo "agregué el token a un record que YA tenía otro contenido".
    if (value.trim() === expectedToken) return true;
  }
  return false;
}

/**
 * Genera instrucciones legibles paso-a-paso para el admin.
 * Devuelve un objeto estructurado (UI lo formatea como prefiera).
 */
export function getVerifyInstructions(domain, token) {
  if (!domain || !token) return null;
  const host = verifyHostname(domain);
  return {
    summary: `Añade un record TXT a tu DNS para probar que controlas ${domain}.`,
    record: {
      type: "TXT",
      hostname: host,
      hostnameLabel: VERIFY_SUBDOMAIN_PREFIX, // si tu provider pide solo el "subdomain"
      value: token,
      ttl: 300,
    },
    steps: [
      `Entra a tu DNS provider (Cloudflare, Route 53, Vercel DNS, etc).`,
      `Crea un record TXT con hostname "${host}" (algunos providers piden solo "${VERIFY_SUBDOMAIN_PREFIX}").`,
      `Pega el token "${token}" como valor.`,
      `Guarda. Espera 1-5 minutos a que propague (típicamente <60s).`,
      `Vuelve aquí y click "Verificar ahora".`,
    ],
    notes: [
      "El record TXT no afecta tráfico al dominio — sólo prueba ownership.",
      "Una vez verificado, puedes eliminar el TXT (re-check cada 90 días lo regenerará).",
    ],
  };
}

/**
 * Resumen del status para mostrar en UI.
 */
export function summarizeVerificationState({ verified, token, verifiedAt, lastCheckedAt }) {
  if (verified) {
    return {
      status: "verified",
      label: "Verificado",
      tone: "success",
      detail: verifiedAt ? `Verificado el ${verifiedAt}` : "Dominio verificado.",
    };
  }
  if (token) {
    return {
      status: "pending",
      label: "Pendiente",
      tone: "warn",
      detail: lastCheckedAt
        ? `Último intento: ${lastCheckedAt}. Asegúrate que el TXT está propagado.`
        : "Añade el TXT record y click 'Verificar ahora'.",
    };
  }
  return {
    status: "none",
    label: "No iniciada",
    tone: "neutral",
    detail: "Inicia el proceso para obtener el TXT record.",
  };
}
