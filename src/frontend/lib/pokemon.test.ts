import { describe, expect, it } from 'vitest';
import { calculateHp, normalizePokemon, pokemonTypes } from './pokemon';

describe('pokemon helpers', () => {
  it('evaluates custom HP formulas with every supported stat', () => {
    const stats = { HP: 10, atk: 8, def: 7, spA: 6, spD: 5, spe: 4 };
    expect(calculateHp(20, stats, 'LEVEL + HP + ATK + DEF + SPA + SPD + SPE')).toBe(60);
  });

  it('falls back safely when an HP formula is invalid', () => {
    expect(calculateHp(20, { HP: 10 }, 'window.alert(1)')).toBe(60);
  });

  it('normalizes legacy and partial records for the editor', () => {
    const pokemon = normalizePokemon({ name: 'Testmon', level: 5, stats: { HP: 3 }, types: ['Fire'], otherInfo: { gender: 'Female' } });
    expect(pokemon.moves).toEqual([]);
    expect(pokemon.captureState.standardCounts).toEqual({});
    expect(pokemon.hitPoints).toBe(pokemon.hitPointsMax);
    expect(pokemon.gender).toBe('Female');
    expect(pokemon.otherInfo?.gender).toBe('Female');
    expect(pokemon.combatStages).toEqual({ atk: 0, def: 0, spA: 0, spD: 0, spe: 0 });
  });

  it('preserves combat stages while removing the legacy HP stage', () => {
    const pokemon = normalizePokemon({
      name: 'Testmon',
      level: 5,
      stats: { HP: 3 },
      types: ['Fire'],
      combatStages: { HP: 4, atk: 2, def: -1 }
    });

    expect(pokemon.combatStages).toEqual({ atk: 2, def: -1, spA: 0, spD: 0, spe: 0 });
  });

  it('resolves forme-dependent types', () => {
    const pokemon = normalizePokemon({ name: 'Morph', level: 1, stats: { HP: 1 }, types: { isFormeVariant: true, selectedForme: 'Sky', formes: { Sky: ['Flying'] } } });
    expect(pokemonTypes(pokemon)).toEqual(['Flying']);
  });
});
