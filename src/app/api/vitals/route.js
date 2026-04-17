import { metric, observe } from "../../../lib/otel";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { name, value, rating, id, navigationType } = await request.json();
    await metric("apiCalls", 1, { kind: "vitals", metric: name });
    await observe("coachLatency", value, { metric: name, rating });
    return new Response(null, { status: 204 });
  } catch {
    return new Response("bad request", { status: 400 });
  }
}
