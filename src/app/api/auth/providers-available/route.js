/* GET — which sign-in providers are configured on this deployment.
   The UI hides buttons whose credentials aren't present so users
   never click into a 500. Cached briefly per user (providers are
   constant within a deploy). */

import "server-only";
import { NextResponse } from "next/server";
import { smsEnabled } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // In dev, expose every provider so the UI can be reviewed end-to-end
  // without provisioning real OAuth apps. Clicks will fail at the IdP
  // step, but layout/brand/behavior are visible.
  const isDev = process.env.NODE_ENV !== "production";
  const has = (...keys) => keys.every((k) => !!process.env[k]);

  return NextResponse.json({
    google:    isDev || has("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
    microsoft: isDev || has("AZURE_AD_CLIENT_ID", "AZURE_AD_CLIENT_SECRET"),
    apple:     isDev || has("APPLE_CLIENT_ID", "APPLE_CLIENT_SECRET"),
    okta:      isDev || has("OKTA_CLIENT_ID", "OKTA_CLIENT_SECRET", "OKTA_ISSUER"),
    // Email magic link is always available: src/server/auth.js prints the
    // link to the server log when EMAIL_SERVER is unset (pilot fallback).
    email:     true,
    phone:     smsEnabled(),
  }, {
    headers: { "cache-control": "no-store" },
  });
}
