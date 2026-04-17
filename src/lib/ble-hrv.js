"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — WEB BLUETOOTH HRV CONNECTOR
   Heart Rate Service (UUID 0x180D) · RR intervals from GATT
   ───────────────────────────────────────────────────────────────
   Compatible devices (tested profiles):
   - Polar H10, H9, OH1, Verity Sense
   - Wahoo TICKR, TICKR X
   - Garmin HRM-Dual, HRM-Pro (when BLE advertising)
   - CooSpo H6, H808S
   - Any BLE 4.0+ chest strap supporting standard HR Service
   ───────────────────────────────────────────────────────────────
   Bluetooth GATT Heart Rate Measurement characteristic format:
   - Byte 0: flags (bit 0 = HR format, bit 4 = RR present)
   - Bytes 1-2: heart rate (uint8 or uint16)
   - Remaining bytes: RR intervals (uint16, 1/1024 s)
   ═══════════════════════════════════════════════════════════════ */

const HR_SERVICE = "heart_rate";
const HR_MEASUREMENT = "heart_rate_measurement";
const BATTERY_SERVICE = "battery_service";
const BATTERY_LEVEL = "battery_level";

export function isBleSupported() {
  return typeof navigator !== "undefined"
    && typeof navigator.bluetooth !== "undefined"
    && typeof navigator.bluetooth.requestDevice === "function";
}

/**
 * Parse Heart Rate Measurement characteristic value.
 * @param {DataView} value
 * @returns {{ hr: number, rrMs: number[] }}
 */
export function parseHrm(value) {
  const flags = value.getUint8(0);
  const is16bit = (flags & 0x01) !== 0;
  const hasRR = (flags & 0x10) !== 0;
  let offset = 1;
  let hr;
  if (is16bit) {
    hr = value.getUint16(offset, true);
    offset += 2;
  } else {
    hr = value.getUint8(offset);
    offset += 1;
  }
  if ((flags & 0x08) !== 0) offset += 2;
  if ((flags & 0x04) !== 0) offset += 1;
  const rrMs = [];
  if (hasRR) {
    while (offset + 1 < value.byteLength) {
      const rrRaw = value.getUint16(offset, true);
      rrMs.push(+(rrRaw * 1000 / 1024).toFixed(1));
      offset += 2;
    }
  }
  return { hr, rrMs };
}

/**
 * Create a HRV session. Caller provides callbacks; this module
 * owns the GATT connection lifecycle.
 */
export function createHrvSession({ onSample, onConnect, onDisconnect, onError, onBattery }) {
  let device = null;
  let server = null;
  let hrChar = null;
  let batteryChar = null;
  const rrBuffer = [];
  const startedAt = Date.now();
  let stopped = false;

  async function connect() {
    if (!isBleSupported()) {
      const e = new Error("Web Bluetooth not supported in this browser");
      e.code = "NO_BLE";
      if (onError) onError(e);
      throw e;
    }
    try {
      device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE] }],
        optionalServices: [BATTERY_SERVICE],
      });
      device.addEventListener("gattserverdisconnected", () => {
        if (!stopped && onDisconnect) onDisconnect();
      });
      server = await device.gatt.connect();
      const service = await server.getPrimaryService(HR_SERVICE);
      hrChar = await service.getCharacteristic(HR_MEASUREMENT);

      hrChar.addEventListener("characteristicvaluechanged", (ev) => {
        const { hr, rrMs } = parseHrm(ev.target.value);
        const ts = Date.now();
        for (const rr of rrMs) rrBuffer.push(rr);
        if (onSample) onSample({ hr, rrMs, rrBuffer: [...rrBuffer], ts, elapsedSec: (ts - startedAt) / 1000 });
      });
      await hrChar.startNotifications();

      try {
        const battSvc = await server.getPrimaryService(BATTERY_SERVICE);
        batteryChar = await battSvc.getCharacteristic(BATTERY_LEVEL);
        const level = await batteryChar.readValue();
        if (onBattery) onBattery(level.getUint8(0));
      } catch { /* battery service optional */ }

      if (onConnect) onConnect({ name: device.name || "HR sensor", id: device.id });
      return { name: device.name, id: device.id };
    } catch (e) {
      if (e.name === "NotFoundError") e.code = "CANCELLED";
      if (onError) onError(e);
      throw e;
    }
  }

  async function disconnect() {
    stopped = true;
    try { if (hrChar) await hrChar.stopNotifications(); } catch {}
    try { if (server && server.connected) server.disconnect(); } catch {}
  }

  function getBuffer() {
    return [...rrBuffer];
  }

  return { connect, disconnect, getBuffer };
}
