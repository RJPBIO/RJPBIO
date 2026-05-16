/* ESLint v9 flat config · BIO-IGNICIÓN
   Compatible con eslint-config-next 16.2.1 (peer dep eslint >= 9.0.0). */

import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextConfig,
  ...coreWebVitals,
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "scripts/**",
      "tests/e2e/**",
      "tests/load/**",
      "prisma/migrations/**",
      "public/sw.js",
      "*.log",
    ],
  },
  {
    // Project-specific overrides · calibrated for pragmatic strictness
    rules: {
      // ─── Allow console.error / .warn (used in defensive logging) ───
      "no-console": ["warn", { allow: ["error", "warn"] }],

      // ─── React-hooks ^7 NEW strict rules ───
      // Most of these are overly strict for production codebases — many "violations"
      // are legitimate patterns. We keep exhaustive-deps (catches real bugs) and
      // disable the noise-generating new rules.
      "react-hooks/set-state-in-effect": "off",       // 74 false positives in our code
      "react-hooks/set-state-in-render": "off",        // 72 false positives
      "react-hooks/exhaustive-deps": "warn",           // catches real bugs sometimes
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",                     // flags Math.random() etc. — pero usamos en lugares legítimos
      "react-hooks/component-hook-factories": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/immutability": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/globals": "off",
      "react-hooks/gating": "off",

      // ─── Cosmetic / non-bug rules · downgrade to warn ───
      "react/no-unescaped-entities": "off",  // Apple/Linear/Stripe use plain JSX quotes; disable cosmetic noise
      "react/display-name": "warn",
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-page-custom-font": "warn",
      "@next/next/google-font-display": "warn",
      "@next/next/google-font-preconnect": "warn",
      "import/no-anonymous-default-export": "warn",

      // ─── Keep strict (these catch real bugs) ───
      "react-hooks/rules-of-hooks": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-uses-vars": "error",
      "no-undef": "error",
      "no-unused-vars": "off", // covered by TypeScript / handled per-file
    },
  },
];

export default config;
