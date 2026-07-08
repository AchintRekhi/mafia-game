import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the Mafia game.
 * Boots both the Next.js web app and the Socket.IO server before running specs.
 *
 * Video: Chromium runs with fake-media flags so it publishes a synthetic camera
 * into each tile. When LiveKit env vars are set the specs exercise real LiveKit
 * (per CLAUDE.md — we never mock it); when they're absent the UI degrades to the
 * video-less static grid, and the flow/grid assertions still hold.
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
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            '--autoplay-policy=no-user-gesture-required',
          ],
        },
      },
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
