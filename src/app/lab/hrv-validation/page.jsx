"use client";
/* ═══════════════════════════════════════════════════════════════
   /lab/hrv-validation — modo validación cámara vs BLE
   ═══════════════════════════════════════════════════════════════
   Page wrapper para HRVValidationLab. Acceso directo vía URL para
   compartir entre dispositivos (e.g., probar en Android Chrome).
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useThemeDark } from "../../../hooks/useThemeDark";

const HRVValidationLab = dynamic(
  () => import("../../../components/HRVValidationLab"),
  { ssr: false }
);

export default function HRVValidationPage() {
  const router = useRouter();
  const isDark = useThemeDark();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!show) router.push("/app");
  }, [show, router]);

  return <HRVValidationLab show={show} isDark={isDark} onClose={() => setShow(false)} />;
}
