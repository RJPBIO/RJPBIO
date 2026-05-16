import { webcrypto } from "node:crypto";
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

// Polyfill de matchMedia para jsdom
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (q) => ({
    matches: false, media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  });
}

// Mock HTMLCanvasElement.getContext en jsdom (elimina warnings ruidosos
// "Not implemented: HTMLCanvasElement.prototype.getContext" generados por
// componentes que usan canvas para animaciones — particleSystem.js etc.).
// Devuelve un stub mínimo CanvasRenderingContext2D compatible que NO renderiza
// pero permite que el código mounte sin errores.
if (typeof HTMLCanvasElement !== "undefined" && HTMLCanvasElement.prototype.getContext) {
  const noop = () => {};
  const stubCtx = new Proxy(
    {
      canvas: null,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      shadowBlur: 0,
      shadowColor: "",
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: "10px sans-serif",
      textAlign: "start",
      textBaseline: "alphabetic",
      lineCap: "butt",
      lineJoin: "miter",
      miterLimit: 10,
      filter: "none",
      imageSmoothingEnabled: true,
    },
    {
      get(target, key) {
        if (key in target) return target[key];
        // Métodos comunes devuelven funciones noop
        if (
          [
            "fillRect","strokeRect","clearRect","beginPath","closePath",
            "moveTo","lineTo","quadraticCurveTo","bezierCurveTo","arc","arcTo",
            "rect","fill","stroke","clip","drawImage","fillText","strokeText",
            "save","restore","translate","rotate","scale","transform","setTransform",
            "resetTransform","setLineDash","getLineDash","createLinearGradient",
            "createRadialGradient","createPattern","ellipse","roundRect",
          ].includes(key)
        ) {
          return noop;
        }
        if (key === "measureText") return () => ({ width: 0 });
        if (key === "getImageData") return () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 });
        if (key === "createImageData") return () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 });
        return undefined;
      },
      set(target, key, value) {
        target[key] = value;
        return true;
      },
    }
  );
  HTMLCanvasElement.prototype.getContext = function getContextStub(type) {
    if (type === "2d") {
      stubCtx.canvas = this;
      return stubCtx;
    }
    return null;
  };
}
