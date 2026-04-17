export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const sub = await request.json();
    console.info("[push] resubscribe", sub?.endpoint?.slice(0, 64));
  } catch {}
  return new Response(null, { status: 204 });
}
