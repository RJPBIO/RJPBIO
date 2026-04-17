# Arquitectura — BIO-IGNICIÓN

## Capas

```
┌─────────────────────────────────────────────────────────┐
│  UI (React 19)   app/page.jsx  +  components/  +  hooks │
├─────────────────────────────────────────────────────────┤
│  Estado          store/useStore.js  (Zustand)           │
├─────────────────────────────────────────────────────────┤
│  Dominio         lib/neural.js · protocols.js           │
├─────────────────────────────────────────────────────────┤
│  Infraestructura lib/storage (IDB) · sync · push · i18n │
├─────────────────────────────────────────────────────────┤
│  Plataforma      Service Worker · middleware · manifest │
└─────────────────────────────────────────────────────────┘
```

## Decisiones

1. **Local-first encriptado.** IndexedDB primario + AES-GCM 256. La clave se genera al instante y se guarda no-exportable en IDB. Fallback a `localStorage` si IDB no está disponible. Los datos nunca salen del dispositivo sin consentimiento explícito.
2. **Sync diferida con outbox.** Cada mutación relevante se encola en `STORE_OUTBOX`. El drenado usa backoff exponencial con `MAX_ATTEMPTS=5`. La estrategia de merge es idempotente: max-wins para contadores, dedupe por `ts` para listas.
3. **CSP con nonce.** `middleware.js` genera un nonce por request. El único `<script>` inline del layout (registro del SW) usa ese nonce. Esto permite CSP estricta sin `unsafe-inline`.
4. **Timer como hook puro.** `useSessionTimer` es testeable con fake timers; la UI solo renderiza. Esto desacopla la lógica de fases del renderizado.
5. **i18n sin deps.** Interpolación básica + listeners; suficiente para 2 locales. Migrable a `next-intl` cuando el volumen lo justifique.
6. **Push dual.** Push real (VAPID) + reminders locales como fallback cuando el backend no está disponible.

## Flujo de una sesión

```
Usuario  →  selectProtocol  →  useSessionTimer.start()
                                    │
                                    ├─ tick cada 1s
                                    ├─ hapticBreath / speak fases
                                    └─ done → completeSession()
                                                   │
                                                   ├─ store.completeSession
                                                   ├─ outboxAdd({kind:"session"})
                                                   └─ saveState (IDB cifrado)
                                                           │
                                                           └─ online? → flushOutbox
```

## Convenciones

- Hooks en `src/hooks/` con prefijo `use`, uno por archivo, sin side-effects al importar.
- Lib en `src/lib/` pura cuando es posible; los módulos que tocan `window` guardan comprobación `typeof window !== "undefined"`.
- Tests al lado del archivo: `foo.js` + `foo.test.js`.
- Commits siguen Conventional Commits (`feat:`, `fix:`, `chore:`, …).

## No-objetivos actuales

- Multi-tenant real (se puede añadir cuando haya backend propio).
- SSR de contenido personalizado (app es client-heavy por diseño).
- Tree-shaking agresivo de `protocols.js` (la data completa es parte del producto).
