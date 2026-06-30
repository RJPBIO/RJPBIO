/* ═══════════════════════════════════════════════════════════════
   Artifact signing keys (server) — carga de claves Ed25519 + firma.
   ═══════════════════════════════════════════════════════════════
   Resuelve la clave de firma de plataforma desde env y expone helpers
   para firmar artifacts y publicar las claves públicas (verificación
   por terceros + rotación).

   Generar la clave de producción una vez:
     node -e 'import("./src/lib/artifact-signing.js").then(m=>{const k=m.generateSigningKeypair();console.log("KEY_ID",k.keyId);console.log("PRIVATE_B64",Buffer.from(k.privateKeyPem).toString("base64"));console.log(k.publicKeyPem)})'

   Env:
     ARTIFACT_SIGNING_PRIVATE_KEY          PEM PKCS8 (o su base64) de la clave privada
     ARTIFACT_SIGNING_KEY_ID               (opcional) keyId; si falta se deriva de la pública
     ARTIFACT_SIGNING_PUBLIC_KEYS_PREVIOUS (opcional) JSON [{keyId, publicKey(PEM o base64)}] para rotación

   Sin clave en producción → firma deshabilitada (los artifacts salen sin
   `signature`, honestos, en vez de fingir). En dev sin clave se usa una
   clave EFÍMERA (cambia al reiniciar) para que los endpoints funcionen.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { computeKeyId, generateSigningKeypair, signArtifact } from "@/lib/artifact-signing";

function decodePem(s) {
  if (!s) return null;
  return s.includes("BEGIN") ? s : Buffer.from(s, "base64").toString("utf8");
}

function devKey() {
  if (!globalThis.__artifactSigningDevKey) {
    globalThis.__artifactSigningDevKey = generateSigningKeypair();
    console.warn(
      "[artifact-signing] ARTIFACT_SIGNING_PRIVATE_KEY no configurada — usando clave EFÍMERA de dev (cambia al reiniciar). Configura la env para firmas estables."
    );
  }
  return globalThis.__artifactSigningDevKey;
}

/**
 * Clave de firma activa. `{ privateKeyPem, keyId }` o null si no hay clave
 * (producción sin configurar → firma deshabilitada).
 */
export function loadSigningKey() {
  const raw = process.env.ARTIFACT_SIGNING_PRIVATE_KEY;
  if (raw) {
    const privateKeyPem = decodePem(raw);
    const keyId =
      process.env.ARTIFACT_SIGNING_KEY_ID ||
      computeKeyId(createPublicKey(createPrivateKey(privateKeyPem)));
    return { privateKeyPem, keyId };
  }
  if (process.env.NODE_ENV !== "production") {
    const k = devKey();
    return { privateKeyPem: k.privateKeyPem, keyId: k.keyId };
  }
  return null;
}

/** Firma un artifact con la clave activa. Devuelve el envelope o null. */
export function signArtifactServer(artifact, signedAt) {
  const k = loadSigningKey();
  if (!k) return null;
  return signArtifact({ privateKey: k.privateKeyPem, keyId: k.keyId, artifact, signedAt });
}

/**
 * Claves públicas para publicar/verificar: la actual + las previas (rotación).
 * @returns {Array<{keyId:string, alg:"Ed25519", publicKey:string, current:boolean}>}
 */
export function getPublicKeys() {
  const out = [];
  const k = loadSigningKey();
  if (k) {
    const publicKey = createPublicKey(createPrivateKey(k.privateKeyPem))
      .export({ type: "spki", format: "pem" });
    out.push({ keyId: k.keyId, alg: "Ed25519", publicKey, current: true });
  }
  const prev = process.env.ARTIFACT_SIGNING_PUBLIC_KEYS_PREVIOUS;
  if (prev) {
    try {
      for (const e of JSON.parse(prev)) {
        if (e?.keyId && e?.publicKey) {
          out.push({ keyId: e.keyId, alg: "Ed25519", publicKey: decodePem(e.publicKey), current: false });
        }
      }
    } catch {
      /* env malformada → ignora previas */
    }
  }
  return out;
}

/** Mapa keyId→PEM para `verifyArtifact({ publicKeys })`. */
export function getPublicKeyMap() {
  return Object.fromEntries(getPublicKeys().map((k) => [k.keyId, k.publicKey]));
}
