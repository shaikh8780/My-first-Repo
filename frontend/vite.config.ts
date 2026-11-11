/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // Unit tests (Vitest) for the api/ data-access layer + aiClient. Node
  // environment (these are pure module tests — no DOM); exclude the Playwright
  // e2e specs, which are a separate runner.
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
