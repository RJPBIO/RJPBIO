"use client";
// Cliente raíz montado en el layout: habilita command palette global y puede
// alojar futuros observers/escuchas (toasts, shortcuts extra) sin forzar que
// cada page sea client.
import dynamic from "next/dynamic";

const CommandPalette = dynamic(() => import("./ui/CommandPalette"), { ssr: false });

export default function GlobalChrome() {
  return <CommandPalette />;
}
