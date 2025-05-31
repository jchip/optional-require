import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.spec.ts', 'test-cjs/**/*.spec.ts'],
        coverage: {
            include: ['src/**/*.ts'],
            exclude: [],
            reporter: ['text', 'text-summary', 'lcov'],
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100
            }
        }
    }
});
