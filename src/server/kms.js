/* ═══════════════════════════════════════════════════════════════
   KMS — envelope encryption
   · Prod: AWS_KMS_KEY_ID + AWS SDK v3 → KMS Encrypt / Decrypt real.
   · Fallback: DATA_KEY (32-byte hex) como root key local.
   · Payloads: AES-256-GCM con IV 12-byte aleatorio.
   · Formato de campo: "enc:v1:<iv64>:<tag64>:<ct64>"
     (prefijo marca "ya está cifrado", para idempotencia al guardar).
   ═══════════════════════════════════════════════════════════════ */
import "server-only";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALG = "aes-256-gcm";
const PREFIX = "enc:v1:";

function rootKey() {
  const hex = process.env.DATA_KEY;
  if (!hex || hex.length !== 64) {
    if (process.env.NODE_ENV === "production") throw new Error("DATA_KEY missing in production");
    return Buffer.alloc(32, 0);
  }
  return Buffer.from(hex, "hex");
}

let _kmsClientPromise;
async function getKmsClient() {
  if (!process.env.AWS_KMS_KEY_ID) return null;
  if (!_kmsClientPromise) {
    _kmsClientPromise = (async () => {
      try {
        const { KMSClient, EncryptCommand, DecryptCommand } = await import(/* webpackIgnore: true */ "@aws-sdk/client-kms");
        return { client: new KMSClient({}), EncryptCommand, DecryptCommand };
      } catch { return null; }
    })();
  }
  return _kmsClientPromise;
}

export async function wrapDataKey(plainKey) {
  const kms = await getKmsClient();
  if (kms) {
    const out = await kms.client.send(new kms.EncryptCommand({
      KeyId: process.env.AWS_KMS_KEY_ID,
      Plaintext: plainKey,
    }));
    return `kms:${Buffer.from(out.CiphertextBlob).toString("base64")}`;
  }
  const root = rootKey();
  const out = Buffer.alloc(plainKey.length);
  for (let i = 0; i < plainKey.length; i++) out[i] = plainKey[i] ^ root[i % root.length];
  return `xor:${out.toString("base64")}`;
}

export async function unwrapDataKey(wrapped) {
  if (typeof wrapped !== "string") throw new Error("invalid wrapped key");
  if (wrapped.startsWith("kms:")) {
    const kms = await getKmsClient();
    if (!kms) throw new Error("KMS not configured to unwrap kms: key");
    const out = await kms.client.send(new kms.DecryptCommand({
      CiphertextBlob: Buffer.from(wrapped.slice(4), "base64"),
    }));
    return Buffer.from(out.Plaintext);
  }
  const raw = wrapped.startsWith("xor:") ? wrapped.slice(4) : wrapped;
  const w = Buffer.from(raw, "base64");
  const root = rootKey();
  const out = Buffer.alloc(w.length);
  for (let i = 0; i < w.length; i++) out[i] = w[i] ^ root[i % root.length];
  return out;
}

export function encrypt(plaintext, keyB64) {
  const key = keyB64 ? Buffer.from(keyB64, "base64") : rootKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(plaintext, "utf8")), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decrypt(blob, keyB64) {
  if (typeof blob !== "string") throw new Error("invalid ciphertext");
  if (!blob.startsWith(PREFIX)) {
    if (blob.startsWith("v1:")) {
      // formato legacy sin prefijo "enc:"
      const [, ivB, tagB, ctB] = blob.split(":");
      return decryptParts(ivB, tagB, ctB, keyB64);
    }
    throw new Error("unsupported cipher version");
  }
  const [ivB, tagB, ctB] = blob.slice(PREFIX.length).split(":");
  return decryptParts(ivB, tagB, ctB, keyB64);
}

function decryptParts(ivB, tagB, ctB, keyB64) {
  const key = keyB64 ? Buffer.from(keyB64, "base64") : rootKey();
  const decipher = createDecipheriv(ALG, key, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB, "base64")), decipher.final()]);
  return pt.toString("utf8");
}

export function isEncrypted(blob) {
  return typeof blob === "string" && (blob.startsWith(PREFIX) || blob.startsWith("v1:"));
}

/* Cifra si aún no lo está. Idempotente. */
export function encryptIfPlaintext(value) {
  if (value == null) return value;
  if (isEncrypted(value)) return value;
  return encrypt(value);
}

/* Descifra si está cifrado; si no, asume plaintext legacy y lo devuelve tal cual. */
export function decryptIfEncrypted(value) {
  if (value == null) return value;
  if (!isEncrypted(value)) return value;
  try { return decrypt(value); } catch { return value; }
}

export async function newTenantKey() {
  const dek = randomBytes(32);
  const wrapped = await wrapDataKey(dek);
  return { dek: dek.toString("base64"), wrapped };
}
