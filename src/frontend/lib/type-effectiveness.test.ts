import { describe, expect, it } from 'vitest';
import { normalizePokemon } from './pokemon';
import { typeEffectiveness } from './type-effectiveness';

describe('PTU type effectiveness', () => {
  it('combines weaknesses and resistances with the PTU multiplier scale', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 1, stats: { HP: 1 }, types: ['Fire', 'Flying'] });
    const values = typeEffectiveness(pokemon);
    expect(values.rock).toBe(2);
    expect(values.grass).toBe(.25);
    expect(values.ground).toBe(0);
    expect(values.typeless).toBe(1);
  });

  it('applies saved manual overrides', () => {
    const pokemon = normalizePokemon({ name: 'Test', level: 1, stats: { HP: 1 }, types: ['Normal'], typeEffectivenessOverrides: { fighting: 3 } });
    expect(typeEffectiveness(pokemon).fighting).toBe(3);
  });
});
