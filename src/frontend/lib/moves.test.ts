import { describe, expect, it } from 'vitest';
import { normalizePokemon } from './pokemon';
import { damageBase, ensureStruggle, rollFormula, setDefaultStab, struggleTypes, toggleStab } from './moves';

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

  it('enables STAB by default for an offensive move of the same type', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Fire'], stats: { HP: 5, atk: 8, def: 5, spA: 12, spD: 5, spe: 5 } });
    const move = setDefaultStab(pokemon, { name: 'Flamethrower', type: 'Fire', class: 'Special', damageBase: damageBase(7) });
    expect(move.damageBase).toMatchObject({ short: 'DB9', stab: true });

    const statusMove = setDefaultStab(pokemon, { name: 'Sunny Day', type: 'Fire', class: 'Status' });
    expect(statusMove.damageBase).toBeUndefined();
  });

  it('toggles STAB by adding and removing two damage bases', () => {
    const move = { damageBase: damageBase(6) };
    toggleStab(move);
    expect(move).toMatchObject({ damageBase: { short: 'DB8', stab: true }, stabCustomized: true });
    toggleStab(move);
    expect(move.damageBase).toMatchObject({ short: 'DB6', stab: false });
  });

  it('keeps an explicit STAB choice when normalizing saved Pokemon', () => {
    const move = { name: 'Ember', type: 'Fire', class: 'Special', damageBase: damageBase(4), stabCustomized: true };
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Fire'], stats: { HP: 5 }, moves: [move] });
    expect(pokemon.moves?.[0].damageBase).toMatchObject({ short: 'DB4', stab: false });
  });
});
