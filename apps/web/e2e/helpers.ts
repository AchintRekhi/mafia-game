import { type Browser, type BrowserContext, type Page, expect } from '@playwright/test';

export interface Player {
  ctx: BrowserContext;
  page: Page;
  name: string;
}

/** Host creates a room; returns the room code plus the host's page/context. */
export async function createRoom(
  browser: Browser,
  hostName: string,
  viewport = { width: 1280, height: 800 },
): Promise<Player & { code: string }> {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByPlaceholder('e.g. Corleone').fill(hostName);
  await page.getByRole('button', { name: 'Create a room' }).click();
  await page.waitForURL(/\/room\/[A-Z0-9]{6}/, { timeout: 15_000 });
  const code = page.url().split('/').pop()!;
  return { ctx, page, name: hostName, code };
}

/** A guest joins an existing room by code. */
export async function joinRoom(
  browser: Browser,
  code: string,
  name: string,
  viewport = { width: 1280, height: 800 },
): Promise<Player> {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByPlaceholder('e.g. Corleone').fill(name);
  await page.getByPlaceholder('ABC123').fill(code);
  await page.getByRole('button', { name: 'Join room' }).click();
  await page.waitForURL(`/room/${code}`, { timeout: 15_000 });
  return { ctx, page, name };
}

/** Create a host + (count-1) guests so the room is startable (needs 6). */
export async function seatPlayers(
  browser: Browser,
  count: number,
  opts: { phoneLast?: boolean } = {},
): Promise<{ code: string; players: Player[] }> {
  const names = ['Don', 'Rosa', 'Sal', 'Nina', 'Frankie', 'Lena', 'Gio', 'Mira'];
  const host = await createRoom(browser, names[0]!);
  const players: Player[] = [host];
  for (let i = 1; i < count; i++) {
    const phone = opts.phoneLast && i === count - 1;
    players.push(
      await joinRoom(browser, host.code, names[i]!, phone ? { width: 390, height: 844 } : undefined),
    );
  }
  // Every player should see all names seated in the lobby.
  for (const n of names.slice(0, count)) {
    await expect(host.page.getByText(n, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
  }
  return { code: host.code, players };
}

/** Read the coarse FSM phase the room shell is currently rendering. */
export async function phaseOf(page: Page): Promise<string> {
  return (await page.locator('[data-phase]').first().getAttribute('data-phase')) ?? 'unknown';
}

/** Click the first actionable tile (night target / vote) if one is present. */
export async function actIfPossible(page: Page): Promise<void> {
  const loc = page.locator('[data-selectable="true"][data-selected="false"]');
  if (await loc.count()) await loc.first().click({ timeout: 1000 }).catch(() => {});
}
