export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.text();
    console.warn("[csp-report]", body.slice(0, 2000));
  } catch {}
  return new Response(null, { status: 204 });
}
