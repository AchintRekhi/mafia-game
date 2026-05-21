import { test, expect, type Browser } from '@playwright/test';

/**
 * Happy-path smoke: a host creates a room, a second player joins, and both
 * browsers see each other in the lobby player list.
 *
 * This exercises:
 *   - Socket.IO connection to apps/server
 *   - room:create / room:join handlers
 *   - The personalized room:state broadcast (SocketListener in the root layout)
 *   - URL routing from / to /room/:code
 */

async function createRoom(browser: Browser, hostName: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByPlaceholder('e.g. Achint').fill(hostName);
  await page.getByRole('button', { name: 'Create' }).click();
  await page.waitForURL(/\/room\/[A-Z0-9]{6}/, { timeout: 10_000 });
  const code = page.url().split('/').pop()!;
  return { ctx, page, code };
}

async function joinRoom(browser: Browser, code: string, name: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByPlaceholder('e.g. Achint').fill(name);
  await page.getByPlaceholder('ABC123').fill(code);
  await page.getByRole('button', { name: 'Join' }).click();
  await page.waitForURL(`/room/${code}`, { timeout: 10_000 });
  return { ctx, page };
}

test('host can create a room and a second player can join it', async ({ browser }) => {
  const host = await createRoom(browser, 'Achint');
  expect(host.code).toMatch(/^[A-Z0-9]{6}$/);

  const guest = await joinRoom(browser, host.code, 'Bob');

  // Both pages should show both names in the lobby player list.
  await expect(host.page.getByText('Achint').first()).toBeVisible();
  await expect(host.page.getByText('Bob').first()).toBeVisible();
  await expect(guest.page.getByText('Achint').first()).toBeVisible();
  await expect(guest.page.getByText('Bob').first()).toBeVisible();

  await host.ctx.close();
  await guest.ctx.close();
});

test('joining with a bad code surfaces an error', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByPlaceholder('e.g. Achint').fill('Achint');
  await page.getByPlaceholder('ABC123').fill('ZZZZZZ');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByText(/Room not found/i)).toBeVisible({ timeout: 5_000 });
  await ctx.close();
});
