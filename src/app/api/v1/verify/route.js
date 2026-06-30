/* POST /api/v1/verify — verifica un artifact firmado (Ed25519).
   Público, sin auth. Body: { artifact, envelope }. Resuelve la clave por
   envelope.keyId desde el set de claves públicas (actual + previas) y
   responde { valid, keyId, signedAt }. Permite que un tercero valide por
   API; el verificador offline (lib/artifact-signing) hace lo mismo local. */

import { verifyArtifact } from "@/lib/artifact-signing";
import { getPublicKeyMap } from "@/server/artifact-signing-keys";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }

  const { artifact, envelope } = body || {};
  if (artifact === undefined || !envelope || typeof envelope !== "object") {
    return Response.json({ error: "missing_artifact_or_envelope" }, { status: 422 });
  }

  const valid = verifyArtifact({ publicKeys: getPublicKeyMap(), artifact, envelope });

  return Response.json(
    { valid, keyId: envelope.keyId ?? null, signedAt: envelope.signedAt ?? null },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}
