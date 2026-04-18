"use client";
// Cliente raíz montado en el layout: habilita command palette global, toast
// host y puede alojar futuros observers/escuchas (shortcuts extra) sin forzar
// que cada page sea client.
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("./ui/CommandPalette"), { ssr: false });
const ToastHost = dynamic(() => import("./ui/Toast"), { ssr: false });
const AuthBadge = dynamic(() => import("./AuthBadge"), { ssr: false });

export default function GlobalChrome() {
  return (
    <>
      <CommandPalette />
      <ToastHost />
      <AuthBadge />
    </>
  );
}
