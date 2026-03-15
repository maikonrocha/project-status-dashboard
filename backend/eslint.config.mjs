// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // ─── TypeScript ───────────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      // Ban ! non-null assertions — use explicit checks or optional chaining instead
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Enforce `import type` for type-only imports — avoids unnecessary runtime imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // ─── Exports ──────────────────────────────────────────────────────────────
      // Enforce named exports only (CLAUDE.md convention: never default exports)
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],

      // ─── Code Quality ─────────────────────────────────────────────────────────
      // Backend uses NestJS Logger — console.log is a debug leftover
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // ─── Formatting ───────────────────────────────────────────────────────────
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  // Spec files: relax rules that conflict with common Jest mock-introspection patterns
  // (mock.calls[n][n] returns `any`; `as any` casts for test doubles; super() in mock classes)
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
