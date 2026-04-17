# CLAUDE.md — Guía de colaboración

## Contexto del proyecto

**BIO-IGNICIÓN** es una PWA local-first de optimización humana. El diferencial es la experiencia sensorial (audio, haptics, binaural, voz, wake-lock) y el motor neural adaptativo en `src/lib/neural.js`.

## Cosas a saber antes de editar

- **`page.jsx` es grande (55 KB) a propósito.** Está bajo refactor progresivo a hooks en `src/hooks/`. No reescribir de una vez; extraer piezas con tests primero.
- **Variables cortas (`st`, `pr`, `bL`) son legacy.** En código nuevo usa nombres completos.
- **Persistencia es async.** `store.init()` es `async`; no asumas estado sincrónico al montar.
- **Nunca añadas `unsafe-inline` ni `unsafe-eval` al CSP.** Cualquier script inline debe recibir el nonce de `middleware.js`.
- **Nada de telemetría por defecto.** El logger solo sale si `NEXT_PUBLIC_LOG_ENDPOINT` está definido.

## Flujo de trabajo

1. Antes de cambiar lógica de dominio, lee `neural.test.js` y añade el caso que vas a soportar.
2. Cambios en `manifest.json` requieren bump de `CACHE_VERSION` en `public/sw.js`.
3. Cambios en persistencia requieren bump de `STORE_VERSION` en `store/useStore.js` y una función de migración en `lib/storage.js`.
4. No commitees archivos `.env*`. Usa `NEXT_PUBLIC_*` solo para valores no sensibles.

## Tests

- `npm run test` debe pasar antes de cada commit.
- Cobertura mínima: 70 % líneas / funciones.
- Usa `vi.useFakeTimers()` para hooks con temporizadores.

## Decisiones ya tomadas (no re-litigar sin motivo)

- **IndexedDB cifrado > `localStorage` plano.** Si el usuario tiene IDB, lo usamos.
- **Zustand > Redux.** El dominio cabe en un único store; no hace falta middleware.
- **Framer Motion > CSS animations puras.** La UX sensorial lo justifica.
- **SVG > PNG para iconos.** PWA moderna; iOS acepta SVG en apple-touch-icon desde iOS 16.
- **i18n casero > next-intl.** 2 locales no justifican otra dep.
