import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.mjs"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*.js", "src/hooks/**/*.js", "src/store/**/*.js"],
      exclude: [
        "**/*.test.js",
        "**/locales/**",
        "src/lib/audio.js",
        "src/lib/a11y.js",
        "src/lib/theme.js",
        "src/lib/ble-hrv.js",
        "src/lib/push.js",
        "src/lib/sync.js",
        "src/lib/otel.js",
        "src/lib/badging.js",
        "src/lib/vitals.js",
        "src/lib/logger.js",
        "src/lib/tokens.js",
        "src/lib/locale-context.js",
        "src/store/useStore.js",
        "src/hooks/useWakeLock.js",
        "src/hooks/useSync.js",
        "src/hooks/useT.js",
        "src/hooks/useDeepLink.js",
      ],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
    include: ["src/**/*.test.{js,jsx}"],
    alias: {
      "server-only": new URL("./test-stubs/server-only.js", import.meta.url).pathname,
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
});
