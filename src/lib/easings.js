/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Animation Easings (JS)

   Mirror de los CSS vars en globals.css para usar en Framer Motion
   y otras animaciones JS. Mantiene consistencia entre CSS y JS —
   un cambio en globals.css debe propagarse acá manualmente.

   Cuándo usar cada uno:
     · breath   — settle/exhale-like. Default para entradas y salidas
                  de modales, sheets, dialogs. La curva más usada.
     · inhale   — pulls toward. Para entrar/escalar in con peso.
     · linger   — slow hold. Para cosas que deben sentirse pesadas.
     · instant  — feedback taps. Near-snap para press/release.
     · apple    — iOS bounce-out signature. La curva [0.16,1,0.3,1]
                  ya usada en varios sitios; explicitada acá para
                  consistencia.

   IMPORTANTE: NO reemplazar "easeInOut" en animaciones repetitivas
   (breath, pulse, ripple). Esos casos quieren la curva orgánica
   simétrica de easeInOut nativo, no una cubic-bezier asimétrica.
   ═══════════════════════════════════════════════════════════════ */

export const EASE = {
  breath:  [0.22, 1, 0.36, 1],
  inhale:  [0.6, 0, 0.32, 1],
  linger:  [0.4, 0.04, 0.3, 1],
  instant: [0.2, 0.5, 0.2, 1],
  apple:   [0.16, 1, 0.3, 1],
};

// CSS string equivalents para inline style="transition: ..."
export const EASE_CSS = {
  breath:  "cubic-bezier(0.22, 1, 0.36, 1)",
  inhale:  "cubic-bezier(0.6, 0, 0.32, 1)",
  linger:  "cubic-bezier(0.4, 0.04, 0.3, 1)",
  instant: "cubic-bezier(0.2, 0.5, 0.2, 1)",
  apple:   "cubic-bezier(0.16, 1, 0.3, 1)",
};
