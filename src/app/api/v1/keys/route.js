/* GET /api/v1/keys — claves públicas de firma (Ed25519).
   Público, sin auth: cualquier tercero (auditor, abogado, STPS) descarga
   la clave pública para verificar artifacts firmados (reportes, exports).
   Devuelve la clave actual + las previas (rotación). */

import { getPublicKeys } from "@/server/artifact-signing-keys";

export const dynamic = "force-dynamic";

export async function GET() {
  const keys = getPublicKeys().map((k) => ({
    keyId: k.keyId,
    alg: k.alg,
    publicKey: k.publicKey,
    current: k.current,
  }));
  return Response.json(
    { keys },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
