import { describe, it, expect } from 'vitest';
import { generateRoomCode } from './code.js';

describe('generateRoomCode', () => {
  it('produces a 6-char code by default', () => {
    expect(generateRoomCode()).toHaveLength(6);
    expect(generateRoomCode(8)).toHaveLength(8);
  });

  it('only uses the unambiguous alphabet (no 0/O/1/I/L/U/V)', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateRoomCode()).toMatch(/^[ABCDEFGHJKMNPQRSTWXYZ23456789]+$/);
    }
  });

  it('is effectively unique across many draws', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(generateRoomCode());
    // 500 draws from 28^6 ≈ 4.8e8 should essentially never collide.
    expect(seen.size).toBeGreaterThan(495);
  });
});
