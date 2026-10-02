import { describe, expect, it } from 'vitest';
import { setBattleOnlyForm } from './battle-only-forms';
import { normalizePokemon, pokemonImage } from './pokemon';

function lucario() {
  return normalizePokemon({
    id: 448, name: 'Lucario', level: 50, types: ['Fighting', 'Steel'],
    stats: { HP: 16, atk: 22, def: 13, spA: 27, spD: 17, spe: 18 },
    statBonuses: { HP: 0, atk: 0, def: 0, spA: 0, spD: 0, spe: 0 },
    abilities: [{ name: 'Inner Focus' }],
    battleOnlyForms: [{
      name: 'Aura Form', icon: '448-mega', types: ['Unchanged'],
      stats: { Attack: 4, Defense: 2, 'Special Attack': 2, Speed: 2 },
      ability: { name: 'Adaptability', frequency: 'Static', effect: 'Double STAB.' }
    }]
  });
}

describe('Battle-Only Forms', () => {
  it('applies and reverts stat bonuses, ability and sprite without accumulation', () => {
    const pokemon = lucario();
    const originalAttack = pokemon.stats.atk;

    expect(setBattleOnlyForm(pokemon, 'Aura Form')).toBe(true);
    expect(pokemon.statBonuses).toMatchObject({ atk: 4, def: 2, spA: 2, spe: 2 });
    expect(pokemon.stats.atk).toBe(originalAttack + 4);
    expect(pokemon.abilities?.some(ability => ability.name === 'Adaptability')).toBe(true);
    expect(pokemonImage(pokemon, 'full')).toContain('/448-mega.png');

    expect(setBattleOnlyForm(pokemon, 'Aura Form')).toBe(false);
    expect(pokemon.statBonuses).toMatchObject({ atk: 0, def: 0, spA: 0, spe: 0 });
    expect(pokemon.stats.atk).toBe(originalAttack);
    expect(pokemon.abilities?.some(ability => ability.name === 'Adaptability')).toBe(false);
    expect(pokemonImage(pokemon, 'full')).toContain('/448.png');
  });

  it('does not remove an ability the Pokemon already had', () => {
    const pokemon = lucario();
    pokemon.abilities!.push({ name: 'Adaptability' });
    setBattleOnlyForm(pokemon, 'Aura Form');
    setBattleOnlyForm(pokemon, 'Aura Form');
    expect(pokemon.abilities?.filter(ability => ability.name === 'Adaptability')).toHaveLength(1);
  });
});
