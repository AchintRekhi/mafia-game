import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal Playwright config for the Mafia game.
 * Boots both the Next.js web app and the Socket.IO server before running specs.
 * LiveKit is intentionally NOT exercised here — these tests cover the lobby +
 * socket plumbing, not video/voice.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @mafia/server dev',
      port: 4000,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'pnpm --filter @mafia/web dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
