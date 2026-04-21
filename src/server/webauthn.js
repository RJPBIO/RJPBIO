/* ═══════════════════════════════════════════════════════════════
   WebAuthn / Passkeys — FIDO2 second factor (enterprise-required).
   Thin wrapper over @simplewebauthn/server. Credentials live in
   User.passkeyCredentials (JSON array of {id, publicKey, counter}).
   ═══════════════════════════════════════════════════════════════ */

const RP_NAME = "BIO-IGNICIÓN";
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

export async function beginRegistration(user) {
  const { generateRegistrationOptions } = await import("@simplewebauthn/server");
  const excludeCredentials = (user.passkeyCredentials || []).map((c) => ({ id: c.id, type: "public-key" }));
  return generateRegistrationOptions({
    rpName: RP_NAME, rpID: RP_ID,
    userID: Buffer.from(user.id),
    userName: user.email,
    userDisplayName: user.name || user.email,
    attestationType: "none",
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred", authenticatorAttachment: "platform" },
    excludeCredentials,
  });
}

export async function finishRegistration(response, expectedChallenge) {
  const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
  return verifyRegistrationResponse({
    response, expectedChallenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID,
  });
}

export async function beginAuthentication(user) {
  const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
  const allowCredentials = (user.passkeyCredentials || []).map((c) => ({ id: c.id, type: "public-key" }));
  return generateAuthenticationOptions({ rpID: RP_ID, userVerification: "preferred", allowCredentials });
}

// Discoverable / resident-key flow (conditional UI). Empty allowCredentials
// lets the authenticator enumerate its own discoverable credentials for this
// RP. The browser then returns userHandle in response.response.userHandle,
// which we registered as `Buffer.from(user.id)` at registration time.
export async function beginDiscoverableAuthentication() {
  const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
  return generateAuthenticationOptions({ rpID: RP_ID, userVerification: "preferred", allowCredentials: [] });
}

export async function finishAuthentication(response, expectedChallenge, credential) {
  const { verifyAuthenticationResponse } = await import("@simplewebauthn/server");
  return verifyAuthenticationResponse({
    response, expectedChallenge, expectedOrigin: ORIGIN, expectedRPID: RP_ID, credential,
  });
}
