import { describe, expect, it } from 'vitest';
import { natureLabel, natureName } from './natures';

describe('nature labels', () => {
  it('shows the raised and lowered stats without changing the option value', () => {
    const nature = { name: 'Brave', raise: 'Attack', lower: 'Speed' };
    expect(natureName(nature)).toBe('Brave');
    expect(natureLabel(nature)).toBe('Brave (+Attack / −Speed)');
  });

  it('supports legacy names and plain strings', () => {
    expect(natureLabel({ Name: 'Calm', Raise: 'Special Defense', Lower: 'Attack' })).toBe('Calm (+Special Defense / −Attack)');
    expect(natureLabel('Composed')).toBe('Composed');
  });
});
