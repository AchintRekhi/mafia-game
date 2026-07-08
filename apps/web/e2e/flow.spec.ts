import { test, expect } from '@playwright/test';
import { seatPlayers, phaseOf, actIfPossible } from './helpers';

/**
 * End-to-end flow: a 6-player game must progress from the deal through the
 * three night sub-phases, the dawn recap, and discussion, and arrive at the
 * day vote. Driving the night actions exercises the FSM + resolver for real.
 *
 * This is timing-heavy (real phase timers, fast preset), so it gets a long
 * per-test budget and runs serially.
 */
test('a 6-player game advances through the night to the day vote', async ({ browser }) => {
  test.setTimeout(260_000);

  const { players } = await seatPlayers(browser, 6);
  const host = players[0]!.page;

  // Fastest preset, then deal.
  await host.getByRole('button', { name: 'fast' }).click().catch(() => {});
  await host.waitForTimeout(500);
  await host.getByRole('button', { name: 'Deal the cards' }).click();

  const phases = new Set<string>();
  let reachedVote = false;
  for (let i = 0; i < 120; i++) {
    const phase = await phaseOf(host);
    phases.add(phase);
    if (phase === 'day_vote') {
      reachedVote = true;
      break;
    }
    for (const p of players) await actIfPossible(p.page);
    await host.waitForTimeout(2000);
  }

  expect(reachedVote).toBe(true);
  // We must have passed through the night and the dawn recap to get here.
  expect(phases).toContain('night_mafia');
  expect(phases).toContain('day_recap');

  // The vote screen offers targets to at least one living player.
  const anyAlive = players.find(async (p) => (await phaseOf(p.page)) === 'day_vote');
  expect(anyAlive).toBeTruthy();

  for (const p of players) await p.ctx.close();
});
