/* GET — tells the client whether phone sign-in is configured on this
   deployment. UI uses it to show/hide the phone tab at first paint. */

import "server-only";
import { NextResponse } from "next/server";
import { smsEnabled } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: smsEnabled() }, {
    headers: { "cache-control": "private, max-age=60" },
  });
}
