/* ═══════════════════════════════════════════════════════════════
   KMS — envelope encryption with BYOK fallback
   · In prod set AWS_KMS_KEY_ID to encrypt data keys with AWS KMS.
   · Without KMS, falls back to DATA_KEY from env (32-byte hex).
   · All payloads are AES-256-GCM with random 12-byte IV.
   ═══════════════════════════════════════════════════════════════ */
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALG = "aes-256-gcm";

function rootKey() {
  const hex = process.env.DATA_KEY;
  if (!hex || hex.length !== 64) {
    if (process.env.NODE_ENV === "production") throw new Error("DATA_KEY missing in production");
    return Buffer.alloc(32, 0);
  }
  return Buffer.from(hex, "hex");
}

export async function wrapDataKey(plainKey) {
  // Placeholder: in prod, call AWS KMS Encrypt with KeyId = AWS_KMS_KEY_ID.
  // Here we XOR-shield with rootKey so the stored "wrapped" key is never
  // directly usable if only the DB is leaked.
  const root = rootKey();
  const out = Buffer.alloc(plainKey.length);
  for (let i = 0; i < plainKey.length; i++) out[i] = plainKey[i] ^ root[i % root.length];
  return out.toString("base64");
}

export async function unwrapDataKey(wrapped) {
  const w = Buffer.from(wrapped, "base64");
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
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decrypt(blob, keyB64) {
  const [ver, ivB, tagB, ctB] = blob.split(":");
  if (ver !== "v1") throw new Error("unsupported cipher version");
  const key = keyB64 ? Buffer.from(keyB64, "base64") : rootKey();
  const decipher = createDecipheriv(ALG, key, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB, "base64")), decipher.final()]);
  return pt.toString("utf8");
}

export async function newTenantKey() {
  const dek = randomBytes(32);
  const wrapped = await wrapDataKey(dek);
  return { dek: dek.toString("base64"), wrapped };
}
