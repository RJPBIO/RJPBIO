"use client";
import { useEffect, useState } from "react";

/* Detecta si la UI debe renderizarse en modo oscuro.
   - "dark" / "light" fuerzan el modo (override manual en Settings).
   - "auto" (default) usa la hora local: oscuro entre 20:00 y 05:59.
   Re-evalúa cada 60 s mientras el componente esté montado y ready=true,
   así la transición nocturna ocurre sin recargar la app.
   Hasta que ready=true no emite; evita parpadeo antes de cargar store. */
export function useThemeDark({ ready = true, mode = "auto" } = {}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (!ready) return;
    function evaluate() {
      if (mode === "dark") { setIsDark(true); return; }
      if (mode === "light") { setIsDark(false); return; }
      const h = new Date().getHours();
      setIsDark(h >= 20 || h < 6);
    }
    evaluate();
    const iv = setInterval(evaluate, 60000);
    return () => clearInterval(iv);
  }, [ready, mode]);

  return isDark;
}
