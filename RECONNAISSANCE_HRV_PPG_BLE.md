# RECONNAISSANCE — HRV / PPG / BLE / PSS-4 standalone

**Fecha:** 2026-05-03
**Trigger:** usuario reporta "el sistema ya contaba con esa función" pero "sigue teniendo la UI de antes" en HRV/PPG/BLE.
**Alcance:** análisis forense read-only del estado actual de implementaciones biometría + instrumentos psicométricos repetibles. NO modifica código.
**Verdict:** **Caso A absoluto** — implementación PPG/BLE de calidad clínica existe, completa y robusta. Está **DESCONECTADA** del shell v2 (Phase 4-6). Trabajo Phase 6B = wiring + ADN refactor + persistencia, NO implementación desde cero.

---

## 1. Resumen ejecutivo

### Hallazgo principal

El codebase contiene una implementación PPG/BLE de **grado clínico** terminada en sprints anteriores (≤Sprint 80). La superficie técnica:

- **3 componentes UI** premium (HRVCameraMeasure, HRVMonitor, HRVHistoryPanel + HRVValidationLab)
- **8 archivos de pipeline** en `src/lib/hrv-camera/` (capture → filter → peaks → metrics → sqi → validation → insight + synth para tests)
- **1 connector BLE** (`src/lib/ble-hrv.js`) con parseHrm GATT estándar
- **1 ruta admin** activa (`/lab/hrv-validation`) que monta HRVValidationLab vía dynamic import

### El gap real

Estos componentes **NUNCA se conectaron** al shell v2 reconstruido en Phase 4-6:

1. `HRVCameraMeasure` y `HRVMonitor` son **huérfanos en producción**. Únicas referencias: el archivo mismo + `FINAL_FRONTEND_REQUIREMENTS.md`. Cero imports en [src/app/page.jsx](src/app/page.jsx), [src/components/app/v2/AppV2Root.jsx](src/components/app/v2/AppV2Root.jsx), [src/components/onboarding/v2/NeuralCalibrationV2.jsx](src/components/onboarding/v2/NeuralCalibrationV2.jsx).
2. `NeuralCalibrationV2` step HRV es **placeholder estático** ([src/components/onboarding/v2/NeuralCalibrationV2.jsx#L824-L880](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L824-L880)): texto "próximamente" + botón disabled.
3. `CalibrationView` y `InstrumentsView` muestran datos **hardcoded** desde [src/components/app/v2/profile/fixtures.js](src/components/app/v2/profile/fixtures.js#L14-L24). Botones disparan `onNavigate({ action: "new-hrv" })` y `onNavigate({ action: "retake-pss4" })` que **caen sin handler** en [src/components/app/v2/AppV2Root.jsx#L92-L136](src/components/app/v2/AppV2Root.jsx#L92-L136).
4. `ColdStartView` cards "hrv" y "pss4" navegan vía `target` a esas vistas con fixtures — círculo vicioso sin flow biométrico real.
5. `recordSessionOutcome` recibe `hrvDelta: null` en [src/components/app/v2/AppV2Root.jsx#L223](src/components/app/v2/AppV2Root.jsx#L223) con comentario explícito *"sin biometría real todavía (Phase 6B)"*.

### Implicaciones para Phase 6B

Trabajo dirigido **bajo riesgo**: el motor neural ya consume `hrvDelta` y `hrvLog`; el store ya tiene `logHRV` y `logInstrument`; los componentes ya respetan ADN cyan + Inter Tight + JetBrains Mono. Falta:

1. **Wiring shell v2** (handlers en `AppV2Root.onNavigate`, mount de modales)
2. **Reemplazo de fixtures** por lectura real de `hrvLog` / `instruments` del store
3. **Refactor estilos** desde tokens legacy (`lib/theme.js`) a tokens v2 (`components/app/v2/tokens.js`)
4. **Conexión NeuralCalibrationV2 step HRV** al modal real
5. **Schema persistencia server** (NeuralSession actualmente sin campos HRV; `WearableEvent` solo es genérico)

---

## 2. Inventario detallado

### 2.1 Pipeline `src/lib/hrv-camera/` (calidad clínica, listo para reuso)

| Archivo | LoC | Función | Reuso |
|---------|-----|---------|-------|
| [capture.js](src/lib/hrv-camera/capture.js) | 422 | `createCameraCapture` (getUserMedia + ImageCapture torch + ROI 64×64 canal rojo) + `createStreamingAnalyzer` (sliding window, bandpass adaptativo, zero-phase filtfilt, SQI, finger detection, lastPeakTs para haptic) | 100% |
| [filter.js](src/lib/hrv-camera/filter.js) | 163 | Butterworth biquad HPF/LPF/cascade, filtfilt zero-phase, detrend prefix-sum, zscoreNormalize | 100% |
| [peaks.js](src/lib/hrv-camera/peaks.js) | 325 | `detectPeaks` (zero-crossing + prominence + refractory + sanity), `refinePeakPositions` (parabolic interpolation sub-sample), `peaksToIbi`, `validateIbis`, `hampelFilterIbis` (MAD-based, mejor que running-median para atletas), `detectEctopic` legacy | 100% |
| [metrics.js](src/lib/hrv-camera/metrics.js) | 84 | `computeHrv`: meanHr, meanIbi, sdnn, rmssd, pnn50, **lnRmssd**, cv, n. Task Force 1996 standard. | 100% |
| [sqi.js](src/lib/hrv-camera/sqi.js) | 123 | `computeSqi` (4 componentes ponderados: periodicity 35%, ectopic 25%, prominence 25%, coverage 15%) + bands `excellent`/`good`/`marginal`/`poor` + `shouldAcceptMeasurement` conservador | 100% |
| [validation.js](src/lib/hrv-camera/validation.js) | 156 | `computeMAE`, `computeCorrelation` (Pearson), `computeBlandAltman` (bias + LoA 95%), `compareMeasurements` (cámara vs BLE), `aggregateValidationSessions` | 100% (lab use) |
| [insight.js](src/lib/hrv-camera/insight.js) | 76 | `computeHrvInsight` (zScore vs baseline 14d, deltaPctRmssd, intent recommendation `energia/enfoque/reset/calma`, frase humana) | 100% |
| [synth.js](src/lib/hrv-camera/synth.js) | 139 | Generador PPG sintético (Gaussianas + drift + noise + Mulberry32 PRNG) para tests | tests only |

**Total pipeline:** ~1,488 LoC. Zero dependencies externas (vanilla JS). Tests: `pipeline.test.js`, `validation.test.js`, `insight.test.js`.

### 2.2 BLE connector — [src/lib/ble-hrv.js](src/lib/ble-hrv.js) (129 LoC)

- `isBleSupported()` feature detection
- `parseHrm(DataView)` parser GATT Heart Rate Measurement (flags + 8/16-bit HR + RR intervals 1/1024 s)
- `createHrvSession({ onSample, onConnect, onDisconnect, onError, onBattery })` lifecycle completo con startNotifications + battery service opcional
- Compatible: **Polar H10/H9/OH1/Verity Sense, Wahoo TICKR/TICKR X, Garmin HRM-Dual/HRM-Pro, CooSpo H6/H808S** y cualquier strap BLE 4.0+ con Heart Rate Service estándar.

### 2.3 Componentes UI

#### [src/components/HRVCameraMeasure.jsx](src/components/HRVCameraMeasure.jsx) — 1,595 LoC

Modal full-screen `show / onClose / onComplete / onUseBLE`. **3 modos:**

- `torch` (Android default — back camera + LED)
- `screen-light` (iOS default — front camera + screen as light source, fondo blanco forzado)
- `ambient` (back camera + sol/lámpara externa)

**Capacidades:**
- Detección automática iOS (UA + maxTouchPoints) → ofrece screen-light + ambient
- 6 fases: `intro / requesting / settling / measuring / done / saved / error`
- Wake Lock API (re-adquisición en visibilitychange)
- Race guards contra doble-click, settling timeout 30s, finger-loss grace 1.5s con pause
- Beat-synced haptic via `useHaptic("beat")` solo en peaks <1.5s, respeta reduced-motion
- SQI chip con hint accionable ("apoya más firme", "busca más luz")
- Comparación contextual (última, baseline 14d) durante medición
- Trend chip vs baseline en pantalla `done`
- Low-quality fallback: "Repetir" pasa a primario, "Guardar igual" secundario
- A11y completa: focus trap, aria-live, announce, role="dialog", aria-modal
- Sprint 76 hardening: eliminado "Detener y guardar" (incentivaba mediciones <60s contaminadas)
- Sprint 73 hardening: `saveNow()` flush síncrono pre-saved screen + botón explícito "Continuar"
- Sprint 80 hardening: `setTorch(false)` antes de `track.stop()` (evita LED quedando encendido en Chrome stock Android)

**ADN visual:** ✅ Cyan `#22D3EE` (brand.primary), JetBrains Mono mono, Inter Tight body, `bioSignal.ignition` para warnings, glass dark + cyan radial gradient. **Pero usa `lib/theme.js` legacy** (`resolveTheme`, `withAlpha`, `brand`, `bioSignal`), NO los tokens v2 (`components/app/v2/tokens.js` — `colors.accent.phosphorCyan`, `surfaces.iconBox`).

**Estado uso:** Huérfano. Cero imports en producción. Solo se referenció en sprints previos (probablemente desde page.jsx legacy antes del refactor v2).

#### [src/components/HRVMonitor.jsx](src/components/HRVMonitor.jsx) — ~400+ LoC

Modal BLE-only `show / onClose / onComplete / quickMode`. **2 duraciones:**

- Full: 300s (5 min — gold standard HRV)
- Quick: 60s (`quickMode=true`)

**Capacidades:**
- `isBleSupported()` gate (oculta CTA si no hay Web Bluetooth)
- 5 fases: `intro / connecting / measuring / done / error`
- Battery indicator del strap
- Disconnect handler durante measuring → switch a `error`
- `hrvSummary(rrBuffer)` final desde `lib/hrv.js` (módulo separado, pre-existente)
- A11y: focus trap, announce, aria-live

**ADN visual:** Idéntico a HRVCameraMeasure (mismo `theme.js` legacy). Estado uso: Huérfano.

#### [src/components/HRVHistoryPanel.jsx](src/components/HRVHistoryPanel.jsx) — ~300 LoC

Panel histórico con stats agregadas vía [src/lib/hrvStats.js](src/lib/hrvStats.js). Bucketing 7d/30d/90d, tendencia con minN=3 (Sprint 75 hardening). **Estado uso:** Huérfano.

#### [src/components/HRVValidationLab.jsx](src/components/HRVValidationLab.jsx)

Modo cámara + BLE simultáneo. Compara métricas via `compareMeasurements` y `aggregateValidationSessions` (Bland-Altman, Pearson, MAE).

**Estado uso:** ✅ **Único componente HRV montado en prod**, vía [src/app/lab/hrv-validation/page.jsx](src/app/lab/hrv-validation/page.jsx) con dynamic import + `ssr: false`. Acceso por URL directo (lab/admin), no descubrible desde shell v2.

### 2.4 Persistencia store actual — [src/store/useStore.js](src/store/useStore.js)

```javascript
hrvLog: [],           // L29 — array max 365 entries
rhrLog: [],           // L30 — derivado de hrvLog (entries con HR)
nom035Results: [],
instruments: [],      // PSS-4 / SWEMWBS-7 / PHQ-2 entries

logHRV: (entry) => {  // L275 — full action con outbox + scheduleSave + rhrLog propagation
  // entry shape: { ts, rmssd, lnRmssd, sdnn, pnn50, meanHR, rhr, n,
  //                durationSec, source: "camera"|"ble", sqi, sqiBand }
},

logInstrument: (entry) => {  // L330 — para PSS-4 standalone repeatable
  // entry shape: { instrumentId: "pss-4", ts, score, level, answers }
  // Outbox kind: "instrument"
},

setNeuralBaseline: (baseline) => {  // L199 — set + onboardingComplete=true
  // baseline shape: { pss4, rmeq, maia2, hrvBaseline: null, composite, profile, ... }
},

recordSessionOutcome: ({ ..., hrvDelta = null }) => { ... }  // L364
```

**Conclusión:** El store ya está **listo para HRV real**. No requiere cambios de shape; solo conexión de UI → `logHRV`. Para PSS-4 standalone repeatable, `logInstrument` ya existe.

### 2.5 Persistencia server — [prisma/schema.prisma](prisma/schema.prisma)

| Tabla | HRV-relevant fields | Gap |
|-------|---------------------|-----|
| `NeuralSession` (L309) | `coherenciaDelta`, `moodPre`, `moodPost`. **Sin rmssd/sdnn/pnn50/lnRmssd.** | Falta extender o crear tabla `HrvMeasurement` separada |
| `WearableEvent` (L752) | `provider` (whoop/oura/garmin/apple/fitbit), `kind: "hrv"\|"sleep"\|...`, `payload: Json`. | Genérico solo para wearables 3rd-party. NO sirve para PPG cámara o BLE strap directo |
| `Instrument` model | **No existe** en schema | Si quisiéramos persistir PSS-4/SWEMWBS-7 server-side, hay que crear tabla |

**Gap clave:** El sync outbox lleva entries `kind: "hrv"` y `kind: "instrument"` ([useStore.js#L295,L337](src/store/useStore.js)) pero **no hay endpoints/tablas server que los acepten** específicamente. Probable que los entries entren a `WearableEvent` con `provider: "self_camera"` o queden en outbox sin destino. Verificar [src/app/api/sync/outbox/route.js](src/app/api/sync/outbox/route.js) en sub-prompt separado.

---

## 3. Análisis del ColdStart card "Mide tu HRV"

[src/components/app/v2/home/ColdStartView.jsx#L23-L29](src/components/app/v2/home/ColdStartView.jsx#L23-L29):

```javascript
{
  id: "hrv",
  Icon: Activity,
  title: "Mide tu variabilidad cardíaca",
  description: "60s con cámara o BLE · primera medición",
  target: "/app/profile/calibration#hrv",
}
```

**Flow actual al tap:**

1. `ActionRow.onClick` → `onAction(item)`
2. `AppV2Root.onNavigate({ id: "hrv", target: "/app/profile/calibration#hrv" })`
3. Match en [AppV2Root.jsx#L115-L122](src/components/app/v2/AppV2Root.jsx#L115-L122):
   ```javascript
   if (target.startsWith("/app/profile/calibration")) {
     setTab("perfil");
     // Sub-section is read by ProfileV2 vía useProfileSectionInitial,
     // que lee ?ps= del URL. ... Defer al user navegar manualmente desde Perfil.
     return;
   }
   ```
4. Switch a tab "perfil" — pero la sub-sección NO se abre (comentario admite el bug).
5. Usuario debe navegar manualmente a `Perfil → Calibración`.
6. CalibrationView muestra **fixtures hardcoded** (`rmssd: 47, n: 12 mediciones`).
7. Botón "Nueva medición" → `onNavigate({ action: "new-hrv" })`.
8. `onNavigate` **no tiene handler** para `"new-hrv"` → cae en `console.log("[v2] navigate", event)` línea 135.

**Hash `#hrv` es ignorado.** No hay handler de fragment navigation.

### 3.1 Análisis del ColdStart card "Test estrés percibido" (PSS-4)

```javascript
{
  id: "pss4",
  Icon: ClipboardList,
  title: "Test de estrés percibido",
  description: "PSS-4 · 4 preguntas · 1 min",
  target: "/app/profile/instruments#pss4",
}
```

Flow idéntico al de HRV: navega a tab perfil, hash ignorado, InstrumentsView muestra fixtures, botón "Tomar de nuevo" → action `"retake-pss4"` sin handler.

**Confirmado:** ambas cards son **stubs de navegación**, no stubs absolutos. Apuntan a destinos que existen pero no operan.

---

## 4. Análisis del NeuralCalibrationV2 step HRV

[src/components/onboarding/v2/NeuralCalibrationV2.jsx#L824-L880](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L824-L880):

```javascript
function HRVPlaceholder() {
  return (
    <>
      <InstrumentHeader
        eyebrow="CALIBRACIÓN NEURAL"
        title="Variabilidad cardíaca"
        badge="HRV · próximamente"
      />
      <article ...>
        <p>Mediremos tu HRV cuando habilites la cámara o un dispositivo BLE.</p>
        <p>Por ahora, esta calibración queda incompleta. Puedes habilitarla después desde
          <strong>Hoy → Mide tu HRV</strong>.</p>
      </article>
      <button type="button" disabled data-testid="hrv-enable-camera"
        style={{ ... color: "rgba(34,211,238,0.4)", cursor: "default" }}>
        Habilitar cámara — próximamente
      </button>
    </>
  );
}
```

**Diagnóstico:**
- 100% UI estática. Cero handler de cámara, cero import de HRVCameraMeasure, cero conexión a `useStore.logHRV`.
- Botón "Habilitar cámara" tiene `disabled` hardcoded.
- `data-testid="hrv-enable-camera"` revela que se planeó conectar (test ID ya existe esperando wiring).
- En [NeuralCalibrationV2.jsx#L233-L238](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L233-L238) el `canAdvance` para step 3 (HRV) es `step === 3` puro — siempre permite avanzar sin medición.
- En [NeuralCalibrationV2.jsx#L246-L261](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L246-L261) el `baseline` final tiene `hrvBaseline: null` hardcoded.
- En `CalibSummary` ([L929-L934](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L929-L934)):
  ```javascript
  <SummaryRow kicker="HRV" value="Pendiente" aux="Habilitar después con cámara o BLE" dim />
  ```

**Por qué NO se conectó:** Phase 6 quick-fix priorizó cerrar onboarding deployable con instrumentos peer-reviewed (PSS-4 Cohen 1983 + rMEQ Adan 1991 + MAIA-2 Mehling 2018). HRV cámara/BLE quedó deferido a Phase 6B explícitamente — este es el sub-prompt actual que cierra ese bucle.

---

## 5. Plan dirigido por hallazgos — Caso A

### 5.1 Wiring AppV2Root.onNavigate

Añadir handlers para los 6 actions huérfanos identificados:

| Action / id | Origen | Trabajo |
|-------------|--------|---------|
| `id: "hrv"` (ColdStart) | ColdStartView ACTIONS[2] | Mount HRVCameraMeasure modal directamente, omitir tab perfil |
| `id: "pss4"` (ColdStart) | ColdStartView ACTIONS[3] | Mount InstrumentRunner({ instrument: PSS4, scorer: scorePss4 }) |
| `action: "new-hrv"` | CalibrationView | Mount HRVCameraMeasure modal con onUseBLE → swap a HRVMonitor |
| `action: "retake-pss4"` | InstrumentsView | Mount InstrumentRunner PSS-4 |
| `action: "retake-swemwbs"` | InstrumentsView | Mount InstrumentRunner WEMWBS7 |
| `action: "retake-phq2"` | InstrumentsView | Mount InstrumentRunner PHQ2 |

State lifted al root:
```javascript
const [hrvModalOpen, setHrvModalOpen] = useState(false);
const [bleFallback, setBleFallback] = useState(false);
const [instrumentModal, setInstrumentModal] = useState(null);  // { instrument, scorer }
```

`onComplete` callback de cada modal → `store.logHRV(entry)` o `store.logInstrument(entry)`.

### 5.2 Reemplazo fixtures por datos reales

[src/components/app/v2/profile/calibration/CalibrationView.jsx](src/components/app/v2/profile/calibration/CalibrationView.jsx):

```javascript
// Antes: const c = FIXTURE_CALIBRATION;
// Después:
const hrvLog = useStore((s) => s.hrvLog || []);
const reliable = hrvLog.filter(isReliableHrvEntry).sort((a,b) => b.ts - a.ts);
const lastHrv = reliable[0];
const baselineRmssd = buildReliableHrvBaseline(hrvLog, 14);
// Render: `RMSSD ${lastHrv?.rmssd ?? "—"}ms · n=${reliable.length} mediciones`
```

[src/components/app/v2/profile/instruments/InstrumentsView.jsx](src/components/app/v2/profile/instruments/InstrumentsView.jsx):

```javascript
const instruments = useStore((s) => s.instruments || []);
const lastOf = (id) => instruments.filter(e => e.instrumentId === id).sort((a,b) => b.ts - a.ts)[0];
const pss4Last = lastOf("pss-4");  // shape: { score, level, ts }
```

Ambas vistas requieren empty state: si `hrvLog.length === 0` → "Sin mediciones aún · empieza con Nueva medición". Igual para instruments.

### 5.3 Conectar NeuralCalibrationV2 step HRV

Reemplazar `<HRVPlaceholder />` por componente real:

```javascript
function HRVOnboardingStep({ onMeasured }) {
  const [showModal, setShowModal] = useState(false);
  const [measured, setMeasured] = useState(null);

  return (
    <>
      <InstrumentHeader eyebrow="CALIBRACIÓN NEURAL"
        title="Variabilidad cardíaca"
        badge="HRV · 60s · cámara o BLE strap" />
      {measured ? (
        <ResultPreview rmssd={measured.rmssd} lnRmssd={measured.lnRmssd} />
      ) : (
        <button onClick={() => setShowModal(true)}>Habilitar cámara</button>
      )}
      <HRVCameraMeasure show={showModal} isDark={true}
        onClose={() => setShowModal(false)}
        onComplete={(entry) => { setMeasured(entry); onMeasured(entry); }}
        onUseBLE={...} />
    </>
  );
}
```

Y en `handleAdvance` ([L246-L261](src/components/onboarding/v2/NeuralCalibrationV2.jsx#L246-L261)) cambiar:
```javascript
hrvBaseline: hrvMeasured ?? null,  // antes: null hardcoded
```

`canAdvance` step 3: `step === 3 && (hrvMeasured || skippedHrv)`.

### 5.4 Refactor ADN tokens legacy → v2

Los componentes HRV usan [src/lib/theme.js](src/lib/theme.js) (`resolveTheme`, `withAlpha`, `brand`, `bioSignal`) que es el sistema **legacy**. La PWA v2 canonical usa [src/components/app/v2/tokens.js](src/components/app/v2/tokens.js):

| Legacy (`theme.js`) | V2 (`tokens.js`) |
|---------------------|------------------|
| `brand.primary` (#22D3EE) | `colors.accent.phosphorCyan` (#22D3EE) — mismo valor ✅ |
| `bg`/`card`/`border` via `resolveTheme(isDark)` | `colors.bg.base`/`bg.raised`/`separator` |
| `t1`/`t2`/`t3` text levels | `colors.text.primary`/`secondary`/`muted` |
| `font.weight.black` / inline JetBrains Mono | `typography.weight.bold` / `typography.familyMono` |
| `bioSignal.ignition` (#f59e0b warning) | (no equivalente directo — usar inline o extender tokens) |
| `withAlpha(c, 18)` | (no equivalente — mantener helper o usar `rgba()` literal) |

**Decisión:** los componentes HRV pueden mantener `theme.js` (refactor mecánico ~300 LoC sweep) o migrar a `tokens.js` para coherencia con shell v2. Recomendado: **migrar a tokens v2** para consistencia visual con bottom nav, cards, buttons del resto del shell. ADN visual idéntico (cyan + Inter Tight + JetBrains Mono), solo cambia la fuente de truth.

### 5.5 Schema persistencia (deferrable)

Decisión arquitectónica para Phase 6B vs deferred:

**Opción A — extender NeuralSession:**
```prisma
model NeuralSession {
  ...
  hrvRmssd    Float?
  hrvLnRmssd  Float?
  hrvSdnn     Float?
  hrvSqi      Int?
  hrvSource   String?  // "camera" | "ble"
}
```
Migración aditiva, sin breaking. Pero acopla HRV a sesiones (HRV standalone no entraría).

**Opción B — tabla nueva `HrvMeasurement`:**
```prisma
model HrvMeasurement {
  id           String   @id @default(cuid())
  userId       String
  orgId        String?
  rmssd        Float
  lnRmssd      Float
  sdnn         Float?
  pnn50        Float?
  meanHr       Float
  durationSec  Int
  source       String   // "camera" | "ble"
  sqi          Int?
  sqiBand      String?
  measuredAt   DateTime
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, measuredAt])
  @@index([orgId, measuredAt])
}
```
Mejor separación, soporta HRV standalone, alinea con outbox `kind: "hrv"`.

**Recomendado:** Opción B. Más limpio, alineado con `WearableEvent` separado. Migración nueva `0024_hrv_measurement`.

Para PSS-4 standalone repeatable, **opción análoga**: tabla `Instrument` con `(instrumentId, score, level, ts, answers Json)`.

---

## 6. Estimación LoC por escenario

**Escenario actual: Caso A** (existe + funcional + huérfano del shell v2).

### Breakdown realista

| Bloque | LoC nuevos | LoC modificados | Detalle |
|--------|------------|-----------------|---------|
| `AppV2Root.onNavigate` extension | 60-80 | 0 | 6 handlers, state lifted, mount modales |
| `AppV2Root` modal mounts | 30-40 | 0 | `<HRVCameraMeasure show={hrvModalOpen} ... />` etc |
| `CalibrationView` real-data refactor | 40-60 | 30-40 | Reemplaza fixtures, empty state, useStore selector |
| `InstrumentsView` real-data refactor | 50-70 | 30-40 | 3 instrumentos + empty state |
| `NeuralCalibrationV2` HRV step real | 80-120 | 40-60 | Reemplazo HRVPlaceholder, canAdvance gate, hrvBaseline en payload |
| `ColdStartView` direct mount HRV | 0 | 10-15 | `id: "hrv"` action shortcut sin tab switch |
| ADN refactor `theme.js` → `tokens.js` (HRVCameraMeasure + HRVMonitor + HRVHistoryPanel) | 50-100 | 250-400 | Sweep mecánico de imports + token paths |
| Schema Prisma + migración 0024 | 30-50 | 0 | Nueva tabla HrvMeasurement |
| Endpoint server `/api/sync/outbox` extender kind:"hrv" | 30-50 | 10-20 | Insert HrvMeasurement |
| Tests (vitest) wiring + selectors | 80-120 | 0 | NeuralCalibrationV2 HRV path, CalibrationView hydration |
| **TOTAL** | **450-690** | **370-575** | **820-1,265 LoC** |

**Estimación honesta:** **~1,000 LoC** (mid-range), **2-3 sprints** dirigidos a wiring + ADN + persistencia. Comparar con Caso C (implementación desde cero) que sería 2,500-3,500 LoC + 6-8 sprints incluyendo pipeline DSP.

### Tiempo estimado

| Fase | Tiempo |
|------|--------|
| Sprint A — wiring shell v2 (handlers + mounts + fixtures→real) | 1 sprint |
| Sprint B — NeuralCalibrationV2 step HRV real + ADN refactor | 1 sprint |
| Sprint C — schema + endpoint server + tests | 1 sprint |

---

## 7. Decisiones arquitectónicas pendientes

### 7.1 PPG front + back o solo back

**Estado actual:** soporta los 3 modos (torch/screen-light/ambient).

**Decisión Phase 6B:** mantener los 3 modos. Ya están implementados, ya tienen UX validada (Sprint 76+), iOS sin screen-light dejaría iOS users sin ruta gratis.

### 7.2 BLE incluido o deferred a Phase 6C

**Estado actual:** HRVMonitor + ble-hrv.js completos y funcionales. CTA secundario "¿Tienes sensor Bluetooth?" en HRVCameraMeasure intro path (`onUseBLE` callback hace el swap).

**Decisión Phase 6B:** **incluir BLE**. Costo marginal: wiring del callback `onUseBLE` para mountar HRVMonitor en lugar de HRVCameraMeasure. ~30 LoC. Diferencial vs competencia (Whoop/Oura) es ofrecer ambas rutas.

### 7.3 Web Worker o main thread

**Estado actual:** main thread. `createStreamingAnalyzer` corre `bandpassCascade.process()` por sample en `pushSample()`. A 30fps × 60s = 1,800 samples; cada uno 2 biquads + buffer ops + cada updateMs (500ms) = 2/seg corre `analyze()` que hace filtfilt zero-phase + peak detection sobre window completo (~1,800 samples).

**Performance medido:** UX previa (Sprint 76+) no reportó jank. Modelo Pixel 6 medio-bajo lo soporta sin Worker.

**Decisión Phase 6B:** **mantener main thread**. Worker añadiría complexity (postMessage + transfer) sin ROI demostrado. Re-evaluar si se reportan FPS drops <55 en devices low-end (Moto G, Pixel 4a).

### 7.4 Library externa (TensorFlow.js, MediaPipe BlazeFace) o custom

**Estado actual:** custom DSP completo (Butterworth biquad + Hampel filter + parabolic interpolation), CERO dependencias externas (`grep tensorflow|mediapipe|blazeface src/` → 0 matches).

**Decisión Phase 6B:** **mantener custom**. Bundle size impact = 0 KB. Para face-detection PPG (sin contacto, frente como ROI) sí requeriría MediaPipe BlazeFace (~3 MB). El approach actual finger-on-lens cubre 95% del use-case con zero-dependency.

### 7.5 PSS-4 standalone repeatable: ¿modal o página?

**Estado actual:** `InstrumentRunner` modal genérico existe con A11y completa.

**Decisión Phase 6B:** **modal**. Consistencia con HRVCameraMeasure, evita route navigation (rompe flow rápido), state local en root.

---

## 8. Risk register

| Riesgo | Severidad | Mitigación actual | Acción Phase 6B |
|--------|-----------|-------------------|-----------------|
| iOS Safari: torch inaccesible con cámara abierta | Alto | screen-light mode + ambient mode con SVG illustration específica | Verificar real-device iOS 17+ post-wiring |
| iOS Safari: Web Bluetooth no soportado | Alto | `isBleSupported()` gate oculta CTA BLE en iOS | Mostrar mensaje claro "BLE solo en Android Chrome" |
| Skin tone bias en face PPG | N/A | No usamos face PPG (solo finger-on-lens) | N/A |
| Permission denied (camera) | Medio | Error message específico `"Permiso de cámara denegado"` + Reintentar | Añadir link a `?settings` deep-link |
| Battery consumption (60s torch + camera + wake lock) | Medio | wake lock release explícito en `finish/handleStop`, torch off antes de track.stop() (Sprint 80) | Telemetría `hrv.measure.duration` para detectar mediciones que dejan torch on |
| Bundle size impact | Bajo | DSP custom = 0 KB nuevas deps. HRVCameraMeasure ya en bundle (lazy via dynamic? **verificar**) | Confirmar dynamic import en `AppV2Root` para no inflar initial bundle |
| Mediciones <60s contaminan histórico | Resuelto | Sprint 76 eliminó "Detener y guardar"; finish() solo via auto-complete | N/A |
| Race condition doble-click "Empezar" | Resuelto | `startingRef.current` guard | N/A |
| Finger-loss durante measuring drift count | Resuelto | `measureElapsedMsRef` con grace 1.5s + pause | N/A |
| Outbox `kind: "hrv"` sin destino server | **NUEVO** | Outbox enqueue OK; server insert NO existe | Schema migration + endpoint extension |
| ADN visual mismatch (theme.js vs tokens.js) | Bajo | Mismo valor `#22D3EE` en ambos sistemas | Sweep mecánico Sprint B |
| `nom035TextValidatedByLawyer = false` flag (CLAUDE.md) | N/A | No relevante para HRV/PSS-4 | N/A |
| Wake Lock no soportado en navegadores legacy | Bajo | Try/catch silencioso (best-effort) | Mantener |

### Riesgo no técnico — UX gap entre flow planeado y wiring

**Observación:** los `data-testid="hrv-enable-camera"` en HRVPlaceholder revelan que el wiring estaba **planeado** (selectors de test pre-existen). Probable que tests E2E o snapshots referencien estos IDs con `disabled` actual. Verificar [src/components/onboarding/v2/NeuralCalibrationV2.test.jsx](src/components/onboarding/v2/NeuralCalibrationV2.test.jsx) para no romper aserciones existentes durante el rewire.

---

## 9. Microscopio: archivos clave + paths exactos

### Existen, listos para reuso 100% (Caso A confirmado)

```
src/lib/hrv-camera/capture.js        — 422 LoC pipeline streaming
src/lib/hrv-camera/filter.js         — 163 LoC Butterworth + filtfilt
src/lib/hrv-camera/peaks.js          — 325 LoC peak detection + Hampel
src/lib/hrv-camera/metrics.js        —  84 LoC HRV time-domain
src/lib/hrv-camera/sqi.js            — 123 LoC quality index
src/lib/hrv-camera/validation.js     — 156 LoC Bland-Altman + Pearson
src/lib/hrv-camera/insight.js        —  76 LoC delta vs baseline
src/lib/hrv-camera/synth.js          — 139 LoC test PPG generator
src/lib/ble-hrv.js                   — 129 LoC GATT HR Service
src/lib/hrv.js                       —  ?? LoC (hrvSummary used by HRVMonitor)
src/lib/hrvLog.js                    —  ?? LoC (isReliableHrvEntry, baseline)
src/lib/hrvStats.js                  —  ?? LoC (HRVHistoryPanel stats)
src/components/HRVCameraMeasure.jsx  — 1595 LoC modal full-screen 3 modos
src/components/HRVMonitor.jsx        —  ~400 LoC modal BLE
src/components/HRVHistoryPanel.jsx   —  ~300 LoC histórico
src/components/HRVValidationLab.jsx  —   ?? LoC lab compare
src/components/InstrumentRunner.jsx  —  ~200 LoC PSS-4/SWEMWBS-7/PHQ-2 modal
src/lib/instruments.js               — definiciones + scorers PSS4/WEMWBS7/PHQ2
src/store/useStore.js#L275           — logHRV action lista
src/store/useStore.js#L330           — logInstrument action lista
src/app/lab/hrv-validation/page.jsx  — única ruta que monta validation lab
```

### Requieren wiring + refactor

```
src/components/app/v2/AppV2Root.jsx                       — handler extension
src/components/app/v2/home/ColdStartView.jsx              — ya OK, action dispatch
src/components/app/v2/profile/calibration/CalibrationView.jsx  — fixtures → useStore
src/components/app/v2/profile/instruments/InstrumentsView.jsx  — fixtures → useStore
src/components/app/v2/profile/fixtures.js                 — eliminar FIXTURE_CALIBRATION + FIXTURE_INSTRUMENTS
src/components/onboarding/v2/NeuralCalibrationV2.jsx#L824-L880 — HRVPlaceholder → real
prisma/schema.prisma                                      — nueva tabla HrvMeasurement (+ Instrument?)
src/app/api/sync/outbox/route.js                          — handle kind:"hrv"|"instrument"
```

### Verdict final

**CASO A confirmado**: ~3,500+ LoC de código clínico-grado funcional ya escrito, esperando ser conectado al shell v2. Phase 6B = **cirugía de wiring, no construcción**. Riesgo bajo, ROI alto, ~1,000 LoC nuevos vs ~2,500-3,500 si fuera Caso C.

**Bloqueante real:** decisión de schema persistencia server (HrvMeasurement como tabla nueva vs extender NeuralSession). Recomendación: tabla nueva, migración aditiva 0024, alineada con outbox actual.

**Out-of-scope sub-prompt actual (deferrable a Phase 6C):**
- Frequency-domain HRV (LF/HF, Welch periodogram) — requiere ≥5 min mediciones, no necesario para readiness daily
- Wearable OAuth Whoop/Oura/Garmin (Sprint 6 deferido — ver ROADMAP.md)
- HRV cohort agregaciones server-side k-anónimas
- Validation lab visibilidad post-MVP (mantener `/lab/hrv-validation` URL-only)

---

**Reporte preparado para Phase 6B planning. Sin cambios al código. Sin tests modificados. Sin commits.**
