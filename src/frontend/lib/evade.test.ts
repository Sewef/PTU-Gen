import { describe, expect, it } from 'vitest';
import { normalizePokemon } from './pokemon';
import { evade } from './stats';

describe('Evade', () => {
  it('defaults the general bonus to zero and rounds stat contributions down', () => {
    const pokemon = normalizePokemon({ stats: { def: 19, spD: 4, spe: 30 } });
    expect(pokemon.evadeBonus).toBe(0);
    expect(evade(pokemon, 'def').total).toBe(3);
    expect(evade(pokemon, 'spD').total).toBe(0);
    expect(evade(pokemon, 'spe').total).toBe(6);
  });

  it('uses totals after combat stages and caps the stat contribution before adding the bonus', () => {
    const pokemon = normalizePokemon({
      stats: { def: 20, spD: 50, spe: 20 },
      combatStages: { def: 3, spD: 0, spe: -6 }, evadeBonus: 2
    });
    expect(evade(pokemon, 'def')).toEqual({ base: 6, bonus: 2, total: 8 });
    expect(evade(pokemon, 'spD').total).toBe(8);
    expect(evade(pokemon, 'spe').total).toBe(3);
    pokemon.evadeBonus = 5;
    expect(evade(pokemon, 'def').total).toBe(9);
    expect(evade(pokemon, 'spe').total).toBe(6);
  });

  it('keeps negative stat contributions and negative final values at zero', () => {
    const pokemon = normalizePokemon({ stats: { def: -10, spD: 5 }, evadeBonus: 2 });
    expect(evade(pokemon, 'def')).toEqual({ base: 0, bonus: 2, total: 2 });
    pokemon.evadeBonus = -4;
    expect(evade(pokemon, 'spD').total).toBe(0);
  });
});
