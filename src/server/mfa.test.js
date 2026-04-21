import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  generateSecret,
  otpauthURL,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  newTrustedDeviceToken,
  hashDeviceToken,
} from "./mfa";

/* ─────────────────── Helpers locales para generar códigos TOTP ───
   Replicamos el algoritmo de HOTP sobre secreto base32 para poder
   producir el código esperado en un instante arbitrario — así no
   dependemos del reloj del sistema y podemos probar ventanas. */
import { createHmac } from "node:crypto";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Decode(s) {
  s = s.replace(/=+$/, "").toUpperCase();
  let bits = 0, value = 0; const out = [];
  for (const c of s) {
    const i = ALPHABET.indexOf(c); if (i < 0) continue;
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}
function totpAt(secret, timestampMs, step = 30) {
  const counter = Math.floor(timestampMs / 1000 / step);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) | ((hmac[offset + 1] & 0xff) << 16)
             | ((hmac[offset + 2] & 0xff) << 8) | (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

describe("generateSecret", () => {
  it("produce un secreto base32 no vacío", () => {
    const s = generateSecret();
    expect(s).toMatch(/^[A-Z2-7]+$/);
    expect(s.length).toBeGreaterThanOrEqual(32);
  });

  it("cada invocación da un secreto distinto", () => {
    const a = generateSecret();
    const b = generateSecret();
    expect(a).not.toBe(b);
  });
});

describe("otpauthURL", () => {
  it("arma una URL otpauth válida", () => {
    const url = otpauthURL("JBSWY3DPEHPK3PXP", "user@example.com", "BIO");
    expect(url).toMatch(/^otpauth:\/\/totp\//);
    expect(url).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(url).toContain("issuer=BIO");
    expect(url).toContain("digits=6");
    expect(url).toContain("period=30");
  });

  it("urlencodea issuer y account", () => {
    const url = otpauthURL("S", "ana+test@example.com", "BIO IGN");
    expect(url).toContain("BIO%20IGN%3Aana%2Btest%40example.com");
  });

  it("default issuer es BIO-IGNICIÓN", () => {
    const url = otpauthURL("S", "a@b.c");
    expect(url).toContain("issuer=BIO-IGNICI%C3%93N");
  });
});

describe("verifyTOTP", () => {
  const SECRET = "JBSWY3DPEHPK3PXP"; // base32 ejemplo RFC 6238
  const FIXED = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("acepta el código del paso actual", async () => {
    const code = totpAt(SECRET, FIXED);
    expect(await verifyTOTP(SECRET, code)).toBe(true);
  });

  it("acepta código del paso anterior dentro de la ventana", async () => {
    const code = totpAt(SECRET, FIXED - 30_000);
    expect(await verifyTOTP(SECRET, code, 1)).toBe(true);
  });

  it("acepta código del paso siguiente dentro de la ventana", async () => {
    const code = totpAt(SECRET, FIXED + 30_000);
    expect(await verifyTOTP(SECRET, code, 1)).toBe(true);
  });

  it("rechaza código fuera de ventana", async () => {
    const code = totpAt(SECRET, FIXED - 120_000);
    expect(await verifyTOTP(SECRET, code, 1)).toBe(false);
  });

  it("rechaza código incorrecto", async () => {
    expect(await verifyTOTP(SECRET, "000000")).toBe(false);
  });

  it("rechaza entradas vacías", async () => {
    expect(await verifyTOTP("", "123456")).toBe(false);
    expect(await verifyTOTP(SECRET, "")).toBe(false);
    expect(await verifyTOTP(null, null)).toBe(false);
  });
});

describe("generateBackupCodes", () => {
  it("devuelve N códigos con formato xxxx-xxxx", () => {
    const codes = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
    for (const c of codes) expect(c).toMatch(/^[0-9a-f]{8}-[0-9a-f]{8}$/);
  });

  it("produce códigos únicos entre sí", () => {
    const codes = generateBackupCodes(20);
    expect(new Set(codes).size).toBe(20);
  });

  it("respeta el conteo por default y custom", () => {
    expect(generateBackupCodes()).toHaveLength(10);
    expect(generateBackupCodes(3)).toHaveLength(3);
  });
});

describe("backup code hashing + verify", () => {
  it("hash incluye salt.base64 separado por punto", () => {
    const h = hashBackupCode("abcd1234-ef567890");
    expect(h).toMatch(/^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
  });

  it("verifyBackupCode acepta el código correcto y lo elimina (single-use)", () => {
    const codes = ["abcd1234-ef567890", "11112222-33334444"];
    const hashes = codes.map(hashBackupCode);
    const r = verifyBackupCode("abcd1234-ef567890", hashes);
    expect(r.ok).toBe(true);
    expect(r.remaining).toHaveLength(1);
    // El hash consumido no está, el otro sí
    expect(r.remaining).not.toContain(hashes[0]);
    expect(r.remaining).toContain(hashes[1]);
  });

  it("rechaza código incorrecto sin alterar remaining", () => {
    const hashes = [hashBackupCode("abcd1234-ef567890")];
    const r = verifyBackupCode("wrongwrong-wrongwrng", hashes);
    expect(r.ok).toBe(false);
    expect(r.remaining).toEqual(hashes);
  });

  it("normaliza case y remueve guiones/espacios antes de verificar", () => {
    const code = "abcd1234-ef567890";
    const hashes = [hashBackupCode(code)];
    expect(verifyBackupCode("ABCD1234-EF567890", hashes).ok).toBe(true);
    expect(verifyBackupCode("abcd1234ef567890", hashes).ok).toBe(true);
    expect(verifyBackupCode("  abcd 1234 ef56 7890  ", hashes).ok).toBe(true);
  });

  it("rechaza input demasiado corto sin intentar scrypt", () => {
    const hashes = [hashBackupCode("abcd1234-ef567890")];
    const r = verifyBackupCode("short", hashes);
    expect(r.ok).toBe(false);
    expect(r.remaining).toEqual(hashes);
  });

  it("tolera hashes malformados sin tirar", () => {
    const good = hashBackupCode("abcd1234-ef567890");
    const hashes = ["notavalidhash", good];
    const r = verifyBackupCode("abcd1234-ef567890", hashes);
    expect(r.ok).toBe(true);
  });

  it("lista vacía de hashes → ok:false", () => {
    const r = verifyBackupCode("abcd1234-ef567890", []);
    expect(r.ok).toBe(false);
    expect(r.remaining).toEqual([]);
  });

  it("cada hash del mismo código es distinto (salt único)", () => {
    const a = hashBackupCode("abcd1234-ef567890");
    const b = hashBackupCode("abcd1234-ef567890");
    expect(a).not.toBe(b);
  });
});

describe("trusted-device tokens", () => {
  it("newTrustedDeviceToken genera strings base64url no-padded", () => {
    const t = newTrustedDeviceToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t).not.toContain("=");
    // 32 bytes base64url => 43 chars
    expect(t.length).toBe(43);
  });

  it("cada token es único", () => {
    const tokens = new Set();
    for (let i = 0; i < 50; i++) tokens.add(newTrustedDeviceToken());
    expect(tokens.size).toBe(50);
  });

  it("hashDeviceToken produce sha256 hex de 64 chars determinístico", () => {
    const token = "example-token";
    const a = hashDeviceToken(token);
    const b = hashDeviceToken(token);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashDeviceToken distingue tokens distintos", () => {
    expect(hashDeviceToken("a")).not.toBe(hashDeviceToken("b"));
  });
});
