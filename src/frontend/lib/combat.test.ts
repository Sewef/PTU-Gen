import { describe, expect, it } from 'vitest';
import { calculateIncomingDamage } from './combat';

describe('incoming damage', () => {
  it('subtracts the relevant defense before effectiveness', () => {
    expect(calculateIncomingDamage(20, 5, 2)).toBe(30);
  });

  it('supports immunity and the minimum non-immune damage', () => {
    expect(calculateIncomingDamage(20, 5, 0)).toBe(0);
    expect(calculateIncomingDamage(3, 10, 0.5)).toBe(1);
  });

  it('ignores empty damage', () => {
    expect(calculateIncomingDamage(0, 5, 2)).toBe(0);
  });
});
