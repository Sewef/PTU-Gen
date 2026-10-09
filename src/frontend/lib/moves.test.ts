import { describe, expect, it } from 'vitest';
import { normalizePokemon } from './pokemon';
import { damageBase, doubleStrikeCases, ensureStruggle, fiveStrikeCases, hasDoubleStrike, hasFiveStrike, rollFormula, setDefaultStab, struggleTypes, toggleStab } from './moves';

describe('move helpers', () => {
  it('builds the PTU damage base and roll formula', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Fire'], stats: { HP: 5, atk: 12, def: 5, spA: 8, spD: 5, spe: 5 } });
    const move = { class: 'physical', damageBase: damageBase(6) };
    expect(move.damageBase.dmg).toBe('2d6+8');
    expect(rollFormula(pokemon, move)).toBe('2d6+8+12');
  });

  it('uses the total attack stat including combat stages', () => {
    const pokemon = normalizePokemon({
      name: 'Test', level: 10, types: ['Fire'],
      stats: { HP: 5, atk: 12, def: 5, spA: 8, spD: 5, spe: 5 },
      combatStages: { atk: 2 }
    });
    const move = { class: 'physical', damageBase: damageBase(6) };

    expect(rollFormula(pokemon, move)).toBe('2d6+8+16');
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

  it('detects Double Strike and exposes every valid hit and critical result', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Fighting'], stats: { HP: 5, atk: 12 } });
    const move = { name: 'Double Kick', type: 'Fighting', class: 'Physical', range: 'Melee, 1 Target, Double Strike', damageBase: damageBase(3) };
    expect(hasDoubleStrike(move)).toBe(true);
    expect(hasDoubleStrike({ range: 'Melee, Double-Strike' })).toBe(false);
    expect(hasDoubleStrike({ effect: 'Double Strike' })).toBe(false);
    expect(doubleStrikeCases(pokemon, move)).toEqual([
      { hits: 1, criticals: 0, label: '1 hit · 0 crit', formula: '1d6+5+12', range: { min: 18, avg: 21, max: 23 } },
      { hits: 1, criticals: 1, label: '1 hit · 1 crit', formula: '1d6+5+1d6+5+12', range: { min: 24, avg: 30, max: 34 } },
      { hits: 2, criticals: 0, label: '2 hits · 0 crit', formula: '2d6+8+12', range: { min: 22, avg: 27, max: 32 } },
      { hits: 2, criticals: 1, label: '2 hits · 1 crit', formula: '2d6+8+1d6+5+12', range: { min: 28, avg: 36, max: 43 } },
      { hits: 2, criticals: 2, label: '2 hits · 2 crits', formula: '2d6+8+2d6+10+12', range: { min: 34, avg: 45, max: 54 } }
    ]);
  });

  it('adds STAB after multiplying Double Strike DB and excludes it from critical damage', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Fighting'], stats: { HP: 5, atk: 12 } });
    const move = { name: 'Double Kick', type: 'Fighting', class: 'Physical', range: 'Melee, Double Strike', damageBase: damageBase(5, true) };
    expect(doubleStrikeCases(pokemon, move).map(result => result.formula)).toEqual([
      '1d8+8+12',
      '1d8+8+1d6+5+12',
      '2d8+10+12',
      '2d8+10+1d6+5+12',
      '2d8+10+2d6+10+12'
    ]);
    expect(doubleStrikeCases(pokemon, move).map(result => result.range)).toEqual([
      { min: 21, avg: 25, max: 28 },
      { min: 27, avg: 34, max: 39 },
      { min: 24, avg: 31, max: 38 },
      { min: 30, avg: 40, max: 49 },
      { min: 36, avg: 49, max: 60 }
    ]);
  });

  it('detects Five Strike in Range and multiplies DB before applying STAB', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Normal'], stats: { HP: 5, atk: 12 } });
    const move = { name: 'Fury Swipes', type: 'Normal', class: 'Physical', range: 'Melee, 1 Target, Five Strike', damageBase: damageBase(5, true) };
    expect(hasFiveStrike(move)).toBe(true);
    expect(hasFiveStrike({ range: 'Melee, Five-Strike' })).toBe(false);
    expect(hasFiveStrike({ effect: 'Five Strike' })).toBe(false);
    expect(fiveStrikeCases(pokemon, move).map(result => ({ label: result.label, formula: result.formula, criticalFormula: result.criticalFormula }))).toEqual([
      { label: '1 hit · d8: 1', formula: '1d8+8+12', criticalFormula: '1d8+8+1d8+8+12' },
      { label: '2 hits · d8: 2–3', formula: '2d8+10+12', criticalFormula: '2d8+10+2d8+10+12' },
      { label: '3 hits · d8: 4–6', formula: '3d10+10+12', criticalFormula: '3d10+10+3d10+10+12' },
      { label: '4 hits · d8: 7', formula: '4d10+15+12', criticalFormula: '4d10+15+4d10+15+12' },
      { label: '5 hits · d8: 8', formula: '5d12+25+12', criticalFormula: '5d12+25+5d12+25+12' }
    ]);
  });

  it('supports additive Five Strike before applying STAB and critical damage', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 10, types: ['Normal'], stats: { HP: 5, atk: 12 }, fiveStrikeMode: 'additive' });
    const move = { name: 'Fury Swipes', type: 'Normal', class: 'Physical', range: 'Melee, Five Strike', damageBase: damageBase(5, true) };
    expect(fiveStrikeCases(pokemon, move).map(result => ({ formula: result.formula, criticalFormula: result.criticalFormula }))).toEqual([
      { formula: '1d8+8+12', criticalFormula: '1d8+8+1d8+8+12' },
      { formula: '2d6+10+12', criticalFormula: '2d6+10+2d6+10+12' },
      { formula: '2d10+10+12', criticalFormula: '2d10+10+2d10+10+12' },
      { formula: '3d10+10+12', criticalFormula: '3d10+10+3d10+10+12' },
      { formula: '4d10+10+12', criticalFormula: '4d10+10+4d10+10+12' }
    ]);
  });
});
