import { describe, expect, it } from 'vitest';
import { normalizePokemon } from './pokemon';
import { damageBase, ensureStruggle, rollFormula, struggleTypes } from './moves';

describe('move helpers', () => {
  it('builds the PTU damage base and roll formula', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Fire'], stats: { HP: 5, atk: 12, def: 5, spA: 8, spD: 5, spe: 5 } });
    const move = { class: 'physical', damageBase: damageBase(6) };
    expect(move.damageBase.dmg).toBe('2d6+8');
    expect(rollFormula(pokemon, move)).toBe('2d6+8+12');
  });

  it('derives Struggle options from capabilities', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Fire'], stats: { HP: 5, atk: 8, def: 5, spA: 12, spD: 5, spe: 5 }, capabilities: ['Firestarter 1'] });
    expect(struggleTypes(pokemon)).toEqual(['Normal', 'Fire']);
    expect(ensureStruggle(pokemon).class).toBe('special');
  });
});
