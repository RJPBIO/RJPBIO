import { describe, it, expect } from "vitest";
import { sha256, canonicalize, stripSeal, sealHmac, recomputeRow } from "./audit-chain";

/* The invariants these tests protect are the ones that matter during
   an actual tamper investigation: the hash the server wrote must be
   reproducible offline from the stored row alone. Any drift between
   this module and src/server/audit.js would surface as false TAMPERED. */

describe("sha256", () => {
  it("is deterministic hex", () => {
    expect(sha256("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256("abc")).toBe(sha256("abc"));
  });
});

describe("canonicalize", () => {
  it("sorts TOP-LEVEL keys so object construction order doesn't break the hash", () => {
    const a = canonicalize({ action: "x", orgId: "o", target: "t" });
    const b = canonicalize({ target: "t", orgId: "o", action: "x" });
    expect(a).toBe(b);
  });

  it("prepends prevHash as a framed prefix", () => {
    const c = canonicalize({ action: "x", prevHash: "PREV" });
    expect(c.startsWith("PREV|")).toBe(true);
  });

  it("empty prevHash becomes empty string, not 'null'", () => {
    const c = canonicalize({ action: "x", prevHash: null });
    expect(c.startsWith("|")).toBe(true);
  });

  it("excludes id/ts/hash from the signed envelope", () => {
    const withMeta = canonicalize({ action: "x", id: 42, ts: new Date(0), hash: "H" });
    const withoutMeta = canonicalize({ action: "x" });
    expect(withMeta).toBe(withoutMeta);
  });
});

describe("stripSeal", () => {
  it("returns null seal when payload is null", () => {
    expect(stripSeal(null)).toEqual({ payload: null, seal: null });
  });

  it("returns payload unchanged when no _seal present", () => {
    expect(stripSeal({ a: 1 })).toEqual({ payload: { a: 1 }, seal: null });
  });

  it("removes _seal and returns it separately", () => {
    const { payload, seal } = stripSeal({ a: 1, _seal: "HMAC" });
    expect(payload).toEqual({ a: 1 });
    expect(seal).toBe("HMAC");
  });

  it("does not mutate the input", () => {
    const original = { a: 1, _seal: "HMAC" };
    stripSeal(original);
    expect(original).toEqual({ a: 1, _seal: "HMAC" });
  });
});

describe("sealHmac", () => {
  it("returns null when key absent (seal disabled)", () => {
    expect(sealHmac("prev", "hash", null)).toBeNull();
    expect(sealHmac("prev", "hash", "")).toBeNull();
  });

  it("is deterministic with a key", () => {
    const a = sealHmac("prev", "hash", "key");
    const b = sealHmac("prev", "hash", "key");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("different keys yield different seals", () => {
    expect(sealHmac("p", "h", "k1")).not.toBe(sealHmac("p", "h", "k2"));
  });
});

describe("recomputeRow", () => {
  /* End-to-end invariant: a row produced with canonicalize(entry) + injected
     _seal is round-trip verifiable by recomputeRow reading the row back. */
  it("recomputes the exact hash the writer produced", () => {
    const entry = {
      orgId: "org_1", actorId: "u_1", actorEmail: "a@b.co",
      action: "org.created", target: null, ip: "1.2.3.4", ua: "ua",
      payload: { plan: "STARTER" }, prevHash: null,
    };
    const hash = sha256(canonicalize(entry));
    const seal = sealHmac(entry.prevHash, hash, "key");
    const stored = { ...entry, hash, payload: { ...entry.payload, _seal: seal }, id: 1n, ts: new Date() };

    const { expectedHash, expectedSeal, storedSeal } = recomputeRow(stored, null, "key");
    expect(expectedHash).toBe(hash);
    expect(expectedSeal).toBe(seal);
    expect(storedSeal).toBe(seal);
  });

  it("detects tamper: flipped action", () => {
    const entry = { orgId: "o", action: "a", payload: null, prevHash: null };
    const hash = sha256(canonicalize(entry));
    const stored = { ...entry, action: "a_tampered", hash };
    const { expectedHash } = recomputeRow(stored, null, null);
    expect(expectedHash).not.toBe(hash);
  });

  it("detects tamper: flipped payload", () => {
    const entry = { orgId: "o", action: "a", payload: { x: 1 }, prevHash: null };
    const hash = sha256(canonicalize(entry));
    const stored = { ...entry, payload: { x: 2 }, hash };
    const { expectedHash } = recomputeRow(stored, null, null);
    expect(expectedHash).not.toBe(hash);
  });

  it("seal is null when row stored without key and verifier has no key", () => {
    const entry = { orgId: "o", action: "a", payload: null, prevHash: null };
    const hash = sha256(canonicalize(entry));
    const { expectedSeal, storedSeal } = recomputeRow({ ...entry, hash }, null, null);
    expect(expectedSeal).toBeNull();
    expect(storedSeal).toBeNull();
  });

  it("chain: each row's recompute uses prev hash as prevHash", () => {
    /* Build rows with the full envelope the writer would produce so
       recomputeRow's null-defaulted fields match what hashed the row. */
    const envelope = { orgId: "o", actorId: null, actorEmail: null, target: null, ip: null, ua: null, payload: null };
    const rowA = { ...envelope, action: "a1" };
    const hashA = sha256(canonicalize({ ...rowA, prevHash: null }));
    const rowB = { ...envelope, action: "a2" };
    const hashB = sha256(canonicalize({ ...rowB, prevHash: hashA }));

    const { expectedHash: expA } = recomputeRow({ ...rowA, hash: hashA }, null, null);
    const { expectedHash: expB } = recomputeRow({ ...rowB, hash: hashB }, hashA, null);
    expect(expA).toBe(hashA);
    expect(expB).toBe(hashB);
  });
});
