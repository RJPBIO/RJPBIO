import { db } from "../../../server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = { db: "skip", time: new Date().toISOString() };
  let status = 200;
  try {
    const client = db();
    if (client?.$queryRaw) {
      await client.$queryRaw`SELECT 1`;
      checks.db = "ok";
    } else {
      checks.db = "memory";
    }
  } catch (err) {
    checks.db = "fail:" + (err?.message || "unknown");
    status = 503;
  }
  return Response.json({ status: status === 200 ? "ready" : "degraded", checks }, { status, headers: { "Cache-Control": "no-store" } });
}
