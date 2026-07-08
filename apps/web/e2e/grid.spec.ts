import { test, expect } from '@playwright/test';
import { seatPlayers } from './helpers';

/**
 * Regression guard for the reported bug: each player must get their own tile,
 * and every tile must keep a 4:3 aspect ratio on both a laptop and a phone
 * viewport (the case where video used to stretch differently per device).
 */
test('every player gets their own 4:3 tile on laptop and phone', async ({ browser }) => {
  const { players } = await seatPlayers(browser, 6);
  const host = players[0]!.page;

  const assertGrid = async () => {
    const tiles = host.locator('[data-player-id]');
    await expect(tiles).toHaveCount(6);
    const n = await tiles.count();
    for (let i = 0; i < n; i++) {
      const box = await tiles.nth(i).boundingBox();
      expect(box).not.toBeNull();
      const ratio = box!.width / box!.height;
      // 4/3 ≈ 1.333; allow a little rounding slack.
      expect(ratio).toBeGreaterThan(1.28);
      expect(ratio).toBeLessThan(1.39);
    }
  };

  // Laptop.
  await host.setViewportSize({ width: 1280, height: 800 });
  await assertGrid();

  // Phone — the viewport where tiles used to distort.
  await host.setViewportSize({ width: 390, height: 844 });
  await assertGrid();

  for (const p of players) await p.ctx.close();
});
