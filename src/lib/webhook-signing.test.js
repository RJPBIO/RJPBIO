import { describe, it, expect } from "vitest";
import { createHmac, randomBytes } from "node:crypto";
import { sign, timingSafeEqual, verifyIncomingSignature } from "./webhook-signing";

// Secret base64 fijo para reproducibilidad (32 bytes random).
const SECRET = Buffer.from("bio-ignicion-webhook-test-secret").toString("base64");
const FIXED_TS = 1714150800; // 2024-04-26T17:00:00Z
const FIXED_ID = "msg_test_abc123";

describe("sign", () => {
  it("retorna formato 'v1,base64'", () => {
    const sig = sign(SECRET, '{"event":"test"}', FIXED_TS, FIXED_ID);
    expect(sig).toMatch(/^v1,[A-Za-z0-9+/=]+$/);
  });

  it("determinístico para mismos inputs", () => {
    const body = '{"event":"session.completed","userId":"u_1"}';
    const a = sign(SECRET, body, FIXED_TS, FIXED_ID);
    const b = sign(SECRET, body, FIXED_TS, FIXED_ID);
    expect(a).toBe(b);
  });

  it("cambia con secret distinto", () => {
    const body = '{"event":"x"}';
    const sigA = sign(SECRET, body, FIXED_TS, FIXED_ID);
    const sigB = sign(Buffer.from("other-secret").toString("base64"), body, FIXED_TS, FIXED_ID);
    expect(sigA).not.toBe(sigB);
  });

  it("cambia con body distinto", () => {
    const sigA = sign(SECRET, '{"a":1}', FIXED_TS, FIXED_ID);
    const sigB = sign(SECRET, '{"a":2}', FIXED_TS, FIXED_ID);
    expect(sigA).not.toBe(sigB);
  });

  it("cambia con timestamp distinto", () => {
    const body = '{"x":1}';
    const sigA = sign(SECRET, body, FIXED_TS, FIXED_ID);
    const sigB = sign(SECRET, body, FIXED_TS + 1, FIXED_ID);
    expect(sigA).not.toBe(sigB);
  });

  it("cambia con id distinto", () => {
    const body = '{"x":1}';
    const sigA = sign(SECRET, body, FIXED_TS, "msg_a");
    const sigB = sign(SECRET, body, FIXED_TS, "msg_b");
    expect(sigA).not.toBe(sigB);
  });

  it("Standard Webhooks v1 format — payload firmado es id.timestamp.body", () => {
    const body = '{"event":"x"}';
    const sig = sign(SECRET, body, FIXED_TS, FIXED_ID);
    // Reconstruir HMAC manualmente para validar contrato
    const h = createHmac("sha256", Buffer.from(SECRET, "base64"));
    h.update(`${FIXED_ID}.${FIXED_TS}.${body}`);
    const expected = `v1,${h.digest("base64")}`;
    expect(sig).toBe(expected);
  });
});

describe("timingSafeEqual", () => {
  it("strings idénticos → true", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("v1,xyz", "v1,xyz")).toBe(true);
  });

  it("strings distintos misma longitud → false", () => {
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("v1,foo", "v1,bar")).toBe(false);
  });

  it("strings de longitudes distintas → false", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("abcd", "abc")).toBe(false);
  });

  it("ambos vacíos → true", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("uno vacío → false", () => {
    expect(timingSafeEqual("", "abc")).toBe(false);
    expect(timingSafeEqual("abc", "")).toBe(false);
  });

  it("non-string inputs → false (defensive)", () => {
    expect(timingSafeEqual(null, "abc")).toBe(false);
    expect(timingSafeEqual("abc", null)).toBe(false);
    expect(timingSafeEqual(undefined, undefined)).toBe(false);
    expect(timingSafeEqual(42, "42")).toBe(false);
  });

  it("UTF-8 multi-byte handled correctly", () => {
    expect(timingSafeEqual("ñ", "ñ")).toBe(true);
    expect(timingSafeEqual("ñ", "n")).toBe(false);
  });
});

describe("verifyIncomingSignature", () => {
  function freshArgs(overrides = {}) {
    const body = '{"event":"session.completed"}';
    const id = `msg_${randomBytes(8).toString("base64url")}`;
    const ts = Math.floor(Date.now() / 1000);
    const sig = sign(SECRET, body, ts, id);
    return {
      secret: SECRET,
      body,
      timestamp: ts,
      id,
      signatureHeader: sig,
      ...overrides,
    };
  }

  it("acepta firma válida", () => {
    expect(verifyIncomingSignature(freshArgs())).toBe(true);
  });

  it("rechaza firma con secret distinto", () => {
    const args = freshArgs();
    args.secret = Buffer.from("attacker-guess").toString("base64");
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("rechaza firma con body distinto (tampered payload)", () => {
    const args = freshArgs();
    args.body = '{"event":"session.completed","tampered":true}';
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("rechaza firma con timestamp distinto", () => {
    const args = freshArgs();
    args.timestamp = args.timestamp + 1;
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("rechaza firma con id distinto", () => {
    const args = freshArgs();
    args.id = "msg_tampered";
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("acepta MULTIPLES firmas en header (rotación de secrets)", () => {
    const args = freshArgs();
    const oldSig = sign(
      Buffer.from("old-secret").toString("base64"),
      args.body,
      args.timestamp,
      args.id
    );
    args.signatureHeader = `${oldSig} ${args.signatureHeader}`;
    // Una de las dos matchea → true
    expect(verifyIncomingSignature(args)).toBe(true);
  });

  it("rechaza si TODAS las firmas en header son inválidas", () => {
    const args = freshArgs();
    args.signatureHeader = "v1,fakeA v1,fakeB v1,fakeC";
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("rechaza header vacío o ausente", () => {
    expect(verifyIncomingSignature({ ...freshArgs(), signatureHeader: "" })).toBe(false);
    expect(verifyIncomingSignature({ ...freshArgs(), signatureHeader: undefined })).toBe(false);
    expect(verifyIncomingSignature({ ...freshArgs(), signatureHeader: null })).toBe(false);
  });

  it("rechaza si secret falta", () => {
    const args = freshArgs();
    args.secret = "";
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("rechaza si body falta", () => {
    const args = freshArgs();
    args.body = "";
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("rechaza si id falta", () => {
    const args = freshArgs();
    args.id = "";
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("header con solo espacios/separadores → false", () => {
    const args = freshArgs();
    args.signatureHeader = "   ";
    expect(verifyIncomingSignature(args)).toBe(false);
  });

  it("end-to-end: round-trip sign → verify funciona", () => {
    const body = JSON.stringify({ event: "user.subscribed", userId: "u_xyz" });
    const id = "msg_roundtrip";
    const ts = 1714150800;
    const sig = sign(SECRET, body, ts, id);
    const ok = verifyIncomingSignature({
      secret: SECRET,
      body,
      timestamp: ts,
      id,
      signatureHeader: sig,
    });
    expect(ok).toBe(true);
  });
});

describe("security properties", () => {
  it("CADA byte cambiado en body produce firma distinta", () => {
    const body = "abcdefghij";
    const id = "msg_x";
    const ts = 1000;
    const baseline = sign(SECRET, body, ts, id);
    for (let i = 0; i < body.length; i++) {
      const tampered = body.slice(0, i) + "Z" + body.slice(i + 1);
      const sigT = sign(SECRET, tampered, ts, id);
      expect(sigT).not.toBe(baseline);
    }
  });

  it("longitud del output base64 es estable (HMAC-SHA256 = 32 bytes = 44 chars b64 con padding)", () => {
    const sig = sign(SECRET, "test", 1, "msg_x");
    // "v1," prefix + 44 chars b64
    expect(sig.length).toBe(3 + 44);
  });
});
