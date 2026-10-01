import { describe, expect, it } from 'vitest';
import { adjustHitPointsByTick, calculateIncomingDamage, hitPointTick, injuredHitPointMaximum } from './combat';

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

  it('always applies at least one non-immune point of damage', () => {
    expect(calculateIncomingDamage(5, 99, 0.25)).toBe(1);
    expect(calculateIncomingDamage(5, 99, 0)).toBe(0);
  });

  it('adjusts HP by ten-percent ticks and caps healing at maximum HP', () => {
    expect(hitPointTick(47)).toBe(4);
    expect(adjustHitPointsByTick(20, 47, -1)).toBe(16);
    expect(adjustHitPointsByTick(45, 47, 1)).toBe(47);
  });

  it('reduces the healing ceiling by ten percent per injury', () => {
    expect(injuredHitPointMaximum(47, 2)).toBe(37);
    expect(adjustHitPointsByTick(36, 47, 1, 2)).toBe(37);
    expect(injuredHitPointMaximum(47, 10)).toBe(0);
  });
});
