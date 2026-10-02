import { describe, expect, it } from 'vitest';
import { setBattleOnlyForm } from './battle-only-forms';
import { normalizePokemon, pokemonImage } from './pokemon';
import PokemonGenerator from '../../../utils/pokemonGenerator.js';

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
  it('migrates the previous Adv Ability 1 representation', () => {
    const pokemon = normalizePokemon({
      name: 'Necrozma', level: 50, stats: { HP: 10 },
      abilities: [{ name: 'Starlight', sourceTier: 'advanced', sourceSlot: 'Adv Ability 1' }],
      battleOnlyForms: [{
        name: 'Ultra Burst', stats: {}, advancedAbility1: { name: 'Illuminate', frequency: 'Static' }
      }]
    });

    expect(pokemon.battleOnlyForms?.[0].abilityReplacements).toMatchObject({
      'Adv Ability 1': { name: 'Illuminate' }
    });
    setBattleOnlyForm(pokemon, 'Ultra Burst');
    expect(pokemon.abilities).toContainEqual(expect.objectContaining({
      name: 'Illuminate', sourceSlot: 'Adv Ability 1'
    }));
  });

  it('parses markdown replacement instructions for multiple ability slots', () => {
    const [form] = PokemonGenerator.getBattleOnlyForms({
      'Battle-Only Forms': {
        'Radiant Form': {
          'Adv Ability 1': '[Becomes Illuminate](https://sewef.github.io/ptu/ptuhomebrew/pokedex.html#)  ',
          'Adv Ability 2': '[Becomes Solar Power](https://example.com)'
        }
      }
    });

    expect(form.abilityReplacements).toMatchObject({
      'Adv Ability 1': { name: 'Illuminate' },
      'Adv Ability 2': { name: 'Solar Power' }
    });
  });

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

  it('temporarily replaces abilities by slot and restores their complete state', () => {
    const pokemon = lucario();
    const original = {
      name: 'Justified', frequency: 'Scene x2', effect: 'Original effect.', usageCount: 1,
      sourceTier: 'advanced', sourceSlot: 'Adv Ability 1'
    };
    const secondOriginal = {
      name: 'Steadfast', frequency: 'Static', effect: 'Second original.', usageCount: 0,
      sourceTier: 'advanced', sourceSlot: 'Adv Ability 2'
    };
    pokemon.abilities!.push(original, secondOriginal);
    pokemon.battleOnlyForms![0].abilityReplacements = {
      'Adv Ability 1': { name: 'Illuminate', frequency: 'Static', effect: 'Replacement effect.' },
      'Adv Ability 2': { name: 'Solar Power', frequency: 'Scene', effect: 'Second replacement.' }
    };

    setBattleOnlyForm(pokemon, 'Aura Form');
    const transformed = pokemon.abilities!.find(ability => ability.sourceSlot === 'Adv Ability 1');
    expect(transformed).toMatchObject({
      name: 'Illuminate', frequency: 'Static', effect: 'Replacement effect.', usageCount: 0,
      sourceTier: 'advanced', sourceSlot: 'Adv Ability 1'
    });
    expect(pokemon.abilities?.some(ability => ability.name === 'Justified')).toBe(false);
    expect(pokemon.abilities).toContainEqual(expect.objectContaining({ name: 'Solar Power', sourceSlot: 'Adv Ability 2' }));

    setBattleOnlyForm(pokemon, 'Aura Form');
    expect(pokemon.abilities).toContainEqual(original);
    expect(pokemon.abilities).toContainEqual(secondOriginal);
    expect(pokemon.abilities?.some(ability => ability.name === 'Illuminate')).toBe(false);
    expect(pokemon.abilities?.some(ability => ability.name === 'Solar Power')).toBe(false);
  });
});
