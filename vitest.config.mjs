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
      exclude: ["**/*.test.js", "**/locales/**"],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
    include: ["src/**/*.test.{js,jsx}"],
  },
});
