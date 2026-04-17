export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { status: "ok", service: "bio-ignicion", version: process.env.APP_VERSION || "dev", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
