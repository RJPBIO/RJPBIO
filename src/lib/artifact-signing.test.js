import { describe, it, expect } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import {
  stableStringify,
  signedMessage,
  signArtifact,
  verifyArtifact,
  computeKeyId,
  generateSigningKeypair,
} from "./artifact-signing";

/* Lo que protegen estos tests es la propiedad central de la narrativa de
   compliance: un artifact (reporte NOM-035 / export de auditoría) puede
   firmarse con la clave privada de la plataforma y CUALQUIER tercero —
   auditor, abogado, STPS — puede verificar con la clave pública que el
   documento (a) no fue alterado y (b) vino de nosotros. A diferencia del
   hash-chain (tamper-evident), esto es una firma criptográfica real. */

describe("stableStringify", () => {
  it("es independiente del orden de las keys", () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
  });

  it("ordena keys anidadas (profundo)", () => {
    const x = { outer: { z: 1, a: 2 }, list: [{ y: 1, x: 2 }] };
    const y = { list: [{ x: 2, y: 1 }], outer: { a: 2, z: 1 } };
    expect(stableStringify(x)).toBe(stableStringify(y));
  });

  it("preserva el orden de los arrays (significativo)", () => {
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]));
  });

  it("normaliza Date a ISO y BigInt a string", () => {
    expect(stableStringify({ ts: new Date(0) })).toBe('{"ts":"1970-01-01T00:00:00.000Z"}');
    expect(stableStringify({ n: 42n })).toBe('{"n":"42"}');
  });

  it("omite undefined de forma determinística", () => {
    expect(stableStringify({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});

describe("signedMessage", () => {
  it("liga keyId, signedAt y artifact canónico", () => {
    const m = signedMessage("k1", "2026-06-30T00:00:00.000Z", { b: 2, a: 1 });
    expect(m).toBe('k1.2026-06-30T00:00:00.000Z.{"a":1,"b":2}');
  });
});

describe("computeKeyId", () => {
  it("es determinístico desde la clave pública (16 hex)", () => {
    const { publicKey } = generateKeyPairSync("ed25519");
    const a = computeKeyId(publicKey);
    const b = computeKeyId(publicKey.export({ type: "spki", format: "pem" }));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
  });

  it("claves distintas → keyIds distintos", () => {
    const k1 = generateKeyPairSync("ed25519").publicKey;
    const k2 = generateKeyPairSync("ed25519").publicKey;
    expect(computeKeyId(k1)).not.toBe(computeKeyId(k2));
  });
});

describe("generateSigningKeypair", () => {
  it("produce PEMs PKCS8/SPKI y un keyId derivado", () => {
    const kp = generateSigningKeypair();
    expect(kp.privateKeyPem).toContain("BEGIN PRIVATE KEY");
    expect(kp.publicKeyPem).toContain("BEGIN PUBLIC KEY");
    expect(kp.keyId).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("signArtifact / verifyArtifact", () => {
  const kp = generateSigningKeypair();
  const artifact = {
    type: "nom35.report",
    orgId: "org_1",
    nivel: "medio",
    porDominio: { liderazgo: 12, cargaTrabajo: 18 },
    items: [{ id: 1, v: 3 }, { id: 2, v: 0 }],
  };
  const signedAt = "2026-06-30T12:00:00.000Z";

  it("round-trip: firma → verifica true", () => {
    const env = signArtifact({ privateKey: kp.privateKeyPem, keyId: kp.keyId, artifact, signedAt });
    expect(env.alg).toBe("Ed25519");
    expect(env.keyId).toBe(kp.keyId);
    expect(env.signedAt).toBe(signedAt);
    expect(typeof env.signature).toBe("string");
    expect(verifyArtifact({ publicKey: kp.publicKeyPem, artifact, envelope: env })).toBe(true);
  });

  it("verifica aunque las keys del artifact lleguen reordenadas", () => {
    const env = signArtifact({ privateKey: kp.privateKeyPem, keyId: kp.keyId, artifact, signedAt });
    const reordered = { items: artifact.items, porDominio: { cargaTrabajo: 18, liderazgo: 12 }, nivel: "medio", orgId: "org_1", type: "nom35.report" };
    expect(verifyArtifact({ publicKey: kp.publicKeyPem, artifact: reordered, envelope: env })).toBe(true);
  });

  it("detecta tamper: un campo cambiado → false", () => {
    const env = signArtifact({ privateKey: kp.privateKeyPem, keyId: kp.keyId, artifact, signedAt });
    const tampered = { ...artifact, nivel: "bajo" };
    expect(verifyArtifact({ publicKey: kp.publicKeyPem, artifact: tampered, envelope: env })).toBe(false);
  });

  it("detecta tamper: signedAt cambiado → false", () => {
    const env = signArtifact({ privateKey: kp.privateKeyPem, keyId: kp.keyId, artifact, signedAt });
    expect(verifyArtifact({ publicKey: kp.publicKeyPem, artifact, envelope: { ...env, signedAt: "2026-07-01T00:00:00.000Z" } })).toBe(false);
  });

  it("clave pública equivocada → false", () => {
    const env = signArtifact({ privateKey: kp.privateKeyPem, keyId: kp.keyId, artifact, signedAt });
    const other = generateSigningKeypair();
    expect(verifyArtifact({ publicKey: other.publicKeyPem, artifact, envelope: env })).toBe(false);
  });

  it("rotación: resuelve la clave por keyId desde un set de públicas", () => {
    const oldKp = generateSigningKeypair();
    const env = signArtifact({ privateKey: oldKp.privateKeyPem, keyId: oldKp.keyId, artifact, signedAt });
    const publicKeys = {
      [kp.keyId]: kp.publicKeyPem,        // clave actual
      [oldKp.keyId]: oldKp.publicKeyPem,  // clave previa (rotada)
    };
    expect(verifyArtifact({ publicKeys, artifact, envelope: env })).toBe(true);
  });

  it("rotación: keyId desconocido → false", () => {
    const env = signArtifact({ privateKey: kp.privateKeyPem, keyId: kp.keyId, artifact, signedAt });
    expect(verifyArtifact({ publicKeys: { otra: generateSigningKeypair().publicKeyPem }, artifact, envelope: env })).toBe(false);
  });

  it("envelope ausente o alg inválido → false (defensivo)", () => {
    expect(verifyArtifact({ publicKey: kp.publicKeyPem, artifact, envelope: null })).toBe(false);
    expect(verifyArtifact({ publicKey: kp.publicKeyPem, artifact, envelope: { alg: "HS256", signature: "x" } })).toBe(false);
    expect(verifyArtifact({ publicKey: kp.publicKeyPem, artifact, envelope: { alg: "Ed25519", keyId: kp.keyId, signedAt, signature: "not-base64-sig" } })).toBe(false);
  });

  it("acepta KeyObject además de PEM", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const keyId = computeKeyId(publicKey);
    const env = signArtifact({ privateKey, keyId, artifact, signedAt });
    expect(verifyArtifact({ publicKey, artifact, envelope: env })).toBe(true);
  });
});
