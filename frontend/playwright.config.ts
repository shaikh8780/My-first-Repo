import { defineConfig, devices } from '@playwright/test';

// E2E smoke tests run against a production build served by `vite preview`, with
// the test-only auth bypass enabled so the app loads without a Cognito redirect.
// VITE_E2E_AUTH_BYPASS is set ONLY here — never in dev or the deployed build.
//
// The suite exercises the LocalAdapter (browser localStorage): it runs offline
// with no backend reachable, so we force VITE_API_MODE=local for the build. The
// committed .env.production sets VITE_API_MODE=rest for the real deploy; a shell
// env var overrides the .env file, so this keeps E2E on the local path without
// touching .env.production. (The rest path is covered by backend pytest + live
// smoke tests, not this browser suite.)
const PORT = 4317;

export default defineConfig({
  testDir: './e2e',
  // capture-screens is a screenshot harness for building the walkthrough deck,
  // not a smoke test — run it explicitly, keep it out of the default suite.
  testIgnore: '**/capture-screens.spec.ts',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `VITE_E2E_AUTH_BYPASS=true VITE_API_MODE=local npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
