import { describe, expect, it } from 'vitest';
import '../../../public/stat-calculator.js';
import PokemonGenerator from '../../../utils/pokemonGenerator.js';
import { natureUpdate } from './pokemon-editor';
import { normalizePokemon } from './pokemon';

const calculator = (globalThis as any).PTUStatCalc;
const baseStats = { HP: 10, Attack: 10, Defense: 10, 'Special Attack': 10, 'Special Defense': 10, Speed: 10 };

describe('nature stat modifiers', () => {
  it.each(PokemonGenerator.getAllNatures())('$name applies ±1 only to HP and ±2 to other stats', nature => {
    const expected: Record<string, number> = { HP: 10, atk: 10, def: 10, spA: 10, spD: 10, spe: 10 };
    if (nature.raise !== nature.lower) {
      expected[nature.raise] += nature.raise === 'HP' ? 1 : 2;
      expected[nature.lower] -= nature.lower === 'HP' ? 1 : 2;
    }
    expect(calculator.getBaseStatsWithNature(baseStats, nature)).toEqual(expected);
    const generated = PokemonGenerator.calculateStats(baseStats, 20, nature, 'BALANCED') as Record<string, number>;
    const distribution = calculator.getDistributedPoints(baseStats, 20, nature, 'BALANCED');
    for (const stat of Object.keys(expected)) {
      expect(generated[stat] - distribution.distributedPoints[stat]).toBe(expected[stat]);
    }
  });

  it.each([
    { name: 'Cuddly', expected: { HP: 11, atk: 8 } },
    { name: 'Desperate', expected: { HP: 9, atk: 12 } }
  ])('changing a sheet to $name keeps separate HP and Attack modifiers', ({ name, expected }) => {
    const pokemon = normalizePokemon({
      name: 'Testmon', level: 20, baseStats, distribution: 'BALANCED',
      stats: { HP: 10, atk: 10, def: 10, spA: 10, spD: 10, spe: 10 },
      statBonuses: { atk: 3 }
    });
    const patch = natureUpdate(pokemon, PokemonGenerator.getNatureByName(name), calculator);
    expect(patch.baseWithNature).toMatchObject(expected);
    expect(patch.stats!.HP - patch.distributedPoints!.HP).toBe(expected.HP);
    expect(patch.stats!.atk - patch.distributedPoints!.atk - 3).toBe(expected.atk);
  });
});
