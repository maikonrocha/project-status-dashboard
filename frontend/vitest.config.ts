import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'happy-dom',
        setupFiles: ['./src/test/setup.ts'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/test/**',
                'src/**/*.spec.{ts,tsx}',
                'src/**/*.test.{ts,tsx}',
                // Next.js routing files — thin wrappers with no testable business logic
                'src/app/**/page.tsx',
                'src/app/**/layout.tsx',
                'src/app/globals.css',
                // Types + axios instance only, no logic
                'src/lib/api-client.ts',
            ],
            thresholds: {
                lines: 80,
                branches: 80,
                functions: 80,
                statements: 80,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
