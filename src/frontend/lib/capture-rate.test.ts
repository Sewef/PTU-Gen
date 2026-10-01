import { describe, expect, it } from 'vitest';
import { errataCaptureBreakdown, standardCaptureBreakdown } from './capture-rate';
import { normalizePokemon } from './pokemon';

function pokemon(overrides: Record<string, any> = {}) {
  return normalizePokemon({
    name: 'Testmon', level: 10, types: ['Normal'],
    stats: { HP: 5, atk: 5, def: 5, spA: 5, spD: 5, spe: 5 },
    hitPoints: 25, hitPointsMax: 100,
    captureState: { useErrata: false, standardCounts: {}, standardFlags: {}, errataFlags: {}, rarityBonus: 0 },
    ...overrides
  });
}

describe('capture rate calculations', () => {
  it('returns every standard modifier separately', () => {
    const result = standardCaptureBreakdown(pokemon({
      shiny: true,
      captureState: { standardCounts: { persistent: 1, injuries: 2 }, standardFlags: { stuck: true, slow: true }, errataFlags: {} }
    }), 2);
    expect(result).toMatchObject({ base: 80, hp: 15, evolution: 10, shiny: -10, persistent: 10, injuries: 10, stuck: 10, slow: 5, current: 130 });
  });

  it('marks a zero-HP Pokémon as not capturable', () => {
    expect(standardCaptureBreakdown(pokemon({ hitPoints: 0 }), 0)).toMatchObject({ capturable: false, current: 0 });
  });

  it('counts double errata conditions as two boxes', () => {
    const result = errataCaptureBreakdown(pokemon({
      hitPoints: 20,
      captureState: { standardCounts: {}, standardFlags: {}, errataFlags: { status: true, evo2: true, injuries5: true }, rarityBonus: 3 }
    }));
    expect(result).toMatchObject({ hp50: true, hp25: true, boxes: 7, base: 11, rarity: 3, current: 0 });
  });
});
