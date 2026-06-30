/* ═══════════════════════════════════════════════════════════════
   Artifact signing — firma asimétrica Ed25519 (verificable por terceros).
   ═══════════════════════════════════════════════════════════════
   Pure helpers (sin "server-only") para que un verificador OFFLINE
   —auditor, abogado, STPS— reproduzca exactamente la verificación con
   solo la clave pública.

   Diferencia con `audit-chain.js`:
     · audit-chain  → hash-chain HMAC: TAMPER-EVIDENT (detecta cambios).
     · artifact-signing → firma Ed25519: NON-REPUDIATION (prueba que el
       documento vino de nosotros y no se alteró, verificable por un
       tercero con la clave pública). Esto es lo que hace que "reporte
       NOM-035 firmado digitalmente" sea literalmente cierto.

   Mensaje firmado: `${keyId}.${signedAt}.${stableStringify(artifact)}`
   (mismo patrón id.timestamp.body de webhook-signing, pero asimétrico).
   El keyId y signedAt quedan ligados a la firma — no se pueden cambiar
   sin invalidarla.
   ═══════════════════════════════════════════════════════════════ */

import {
  sign as edSign,
  verify as edVerify,
  createPrivateKey,
  createPublicKey,
  createHash,
  generateKeyPairSync,
} from "node:crypto";

/**
 * Serialización JSON estable: ordena keys de objetos recursivamente para
 * que la firma sobreviva a re-serialización (orden de keys distinto). El
 * orden de los ARRAYS se preserva (es significativo). Date→ISO, BigInt→string,
 * `undefined` se omite.
 */
export function stableStringify(value) {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === "object") {
    return Object.keys(v)
      .sort()
      .reduce((acc, k) => {
        if (v[k] !== undefined) acc[k] = sortDeep(v[k]);
        return acc;
      }, {});
  }
  if (typeof v === "bigint") return v.toString();
  return v;
}

/** Mensaje canónico que se firma/verifica. */
export function signedMessage(keyId, signedAt, artifact) {
  return `${keyId || ""}.${signedAt || ""}.${stableStringify(artifact)}`;
}

function toPrivateKey(k) {
  if (k && typeof k === "object" && k.asymmetricKeyType) return k; // ya es KeyObject
  return createPrivateKey(k);
}

function toPublicKey(k) {
  if (k && typeof k === "object" && k.asymmetricKeyType) return k; // ya es KeyObject
  return createPublicKey(k);
}

/**
 * keyId determinístico = primeros 16 hex del SHA-256 de la clave pública
 * (DER SPKI). Estable entre procesos; identifica qué clave firmó.
 * @param {string|import("node:crypto").KeyObject} publicKey
 * @returns {string}
 */
export function computeKeyId(publicKey) {
  const der = toPublicKey(publicKey).export({ type: "spki", format: "der" });
  return createHash("sha256").update(der).digest("hex").slice(0, 16);
}

/**
 * Genera un keypair Ed25519 nuevo. Úsalo una vez para crear la clave de
 * plataforma: guarda `privateKeyPem` en env (base64) y publica `publicKeyPem`.
 * @returns {{privateKeyPem:string, publicKeyPem:string, keyId:string}}
 */
export function generateSigningKeypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }),
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
    keyId: computeKeyId(publicKey),
  };
}

/**
 * Firma un artifact. Devuelve el envelope a adjuntar/almacenar junto al doc.
 * @param {object} args
 * @param {string|import("node:crypto").KeyObject} args.privateKey - PEM PKCS8 o KeyObject
 * @param {string} args.keyId
 * @param {*} args.artifact - objeto JSON-serializable
 * @param {string} args.signedAt - ISO timestamp
 * @returns {{alg:"Ed25519", keyId:string, signedAt:string, signature:string}}
 */
export function signArtifact({ privateKey, keyId, artifact, signedAt }) {
  const sk = toPrivateKey(privateKey);
  const msg = Buffer.from(signedMessage(keyId, signedAt, artifact), "utf8");
  const signature = edSign(null, msg, sk).toString("base64");
  return { alg: "Ed25519", keyId, signedAt, signature };
}

/**
 * Verifica un envelope contra el artifact y la(s) clave(s) pública(s).
 * Acepta `publicKey` (una sola PEM/KeyObject) o `publicKeys` (mapa
 * keyId→PEM, para rotación). Nunca lanza: input inválido → false.
 * @param {object} args
 * @param {string|import("node:crypto").KeyObject} [args.publicKey]
 * @param {Object<string,string>} [args.publicKeys] - mapa keyId→PEM
 * @param {*} args.artifact
 * @param {{alg:string, keyId:string, signedAt:string, signature:string}} args.envelope
 * @returns {boolean}
 */
export function verifyArtifact({ publicKey, publicKeys, artifact, envelope }) {
  if (!envelope || envelope.alg !== "Ed25519" || !envelope.signature) return false;

  let pub = publicKey;
  if (publicKeys) {
    pub = publicKeys[envelope.keyId];
    if (!pub) return false; // keyId no reconocido
  }
  if (!pub) return false;

  try {
    const pk = toPublicKey(pub);
    const msg = Buffer.from(signedMessage(envelope.keyId, envelope.signedAt, artifact), "utf8");
    const sig = Buffer.from(envelope.signature, "base64");
    return edVerify(null, msg, pk, sig);
  } catch {
    return false;
  }
}
