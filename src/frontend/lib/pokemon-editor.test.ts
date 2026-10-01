import { describe, expect, it, vi } from 'vitest';
import { normalizePokemon } from './pokemon';
import { levelUpdate, natureUpdate } from './pokemon-editor';

const pokemon = normalizePokemon({
  name: 'Testmon', level: 5, types: ['Normal'],
  stats: { HP: 5, atk: 5, def: 5, spA: 5, spD: 5, spe: 5 },
  baseStats: { HP: 5, Attack: 5, Defense: 5, 'Special Attack': 5, 'Special Defense': 5, Speed: 5 }
});

describe('details editor calculations', () => {
  it('clamps level and derives HP and tutor points', () => {
    expect(levelUpdate(pokemon, 150)).toMatchObject({ level: 100, hitPointsMax: 125, tutorPoints: 21 });
  });

  it('returns a complete stat patch for a nature', () => {
    const calculator = { getDistributedPoints: vi.fn(() => ({
      baseWithNature: { HP: 5, atk: 7, def: 5, spA: 5, spD: 5, spe: 3 },
      distributedPoints: { HP: 1, atk: 2, def: 3, spA: 4, spD: 5, spe: 6 }
    })) };
    const patch = natureUpdate(pokemon, { name: 'Brave' }, calculator);
    expect(patch.stats).toEqual({ HP: 6, atk: 9, def: 8, spA: 9, spD: 10, spe: 9 });
    expect(calculator.getDistributedPoints).toHaveBeenCalledOnce();
  });
});
