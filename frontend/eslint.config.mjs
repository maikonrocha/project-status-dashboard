import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated coverage report
    "coverage/**",
  ]),
  {
    rules: {
      // ─── TypeScript ─────────────────────────────────────────────────────────
      "@typescript-eslint/no-explicit-any": "error",
      // Catch unused variables; ignore names prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Ban ! non-null assertions — use explicit checks or optional chaining instead
      "@typescript-eslint/no-non-null-assertion": "error",
      // Enforce `import type` for type-only imports — avoids unnecessary runtime imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // ─── Exports ────────────────────────────────────────────────────────────
      // Enforce named exports only (CLAUDE.md convention: never default exports)
      "no-restricted-exports": ["error", { restrictDefaultExports: { direct: true } }],

      // ─── Code Quality ───────────────────────────────────────────────────────
      // Prefer const for variables that are never reassigned
      "prefer-const": "error",
      // Require === instead of == (except null checks)
      "eqeqeq": ["error", "always", { null: "ignore" }],
      // No console calls in production code — use error boundaries or monitoring
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // Next.js routing files and framework configs REQUIRE `export default` — exempt from named-export rule
  {
    files: [
      "**/page.tsx",
      "**/layout.tsx",
      "**/loading.tsx",
      "**/error.tsx",
      "**/not-found.tsx",
      "next.config.ts",
      "postcss.config.mjs",
      "vitest.config.ts",
      "eslint.config.mjs",
    ],
    rules: {
      "no-restricted-exports": "off",
    },
  },
  // Spec files: relax rules that conflict with common Vitest/RTL mock patterns
  {
    files: ["**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
