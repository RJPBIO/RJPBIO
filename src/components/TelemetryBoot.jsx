"use client";
/* ═══════════════════════════════════════════════════════════════
   TelemetryBoot — wires installTelemetry() on app boot + page views
   ═══════════════════════════════════════════════════════════════
   Off-by-default: el módulo telemetry.js no emite si no hay
   NEXT_PUBLIC_LOG_ENDPOINT. Aquí solo arrancamos los observers.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { installTelemetry, trackPageView } from "../lib/telemetry";

export default function TelemetryBoot() {
  const pathname = usePathname();

  useEffect(() => {
    installTelemetry();
  }, []);

  useEffect(() => {
    if (pathname) trackPageView(pathname);
  }, [pathname]);

  return null;
}
