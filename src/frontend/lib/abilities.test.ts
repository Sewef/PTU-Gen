import { describe, expect, it } from 'vitest';
import PokemonGenerator from '../../../utils/pokemonGenerator.js';

describe('ability properties', () => {
  it('normalizes every property from an ability definition', () => {
    expect(PokemonGenerator.normalizeAbilityFields('Test Ability', {
      Frequency: 'Scene',
      Target: 'One creature',
      Effect: 'A test effect.',
      'Contest Effect': 'Excitement',
      Requirements: ['Novice Focus']
    })).toEqual({
      name: 'Test Ability',
      frequency: 'Scene',
      target: 'One creature',
      effect: 'A test effect.',
      contestEffect: 'Excitement',
      requirements: ['Novice Focus']
    });
  });

  it('preserves additional properties from custom abilities', async () => {
    await PokemonGenerator.loadCustomAbilities({
      'Custom Test': {
        frequency: 'Static',
        effect: 'A custom effect.',
        target: 'The user',
        custom_rule: { active: true }
      }
    });

    const definition = PokemonGenerator.getAbilityDefinition('Custom Test');
    expect(PokemonGenerator.normalizeAbilityFields('Custom Test', definition)).toMatchObject({
      target: 'The user',
      customRule: { active: true }
    });
    PokemonGenerator.clearCustomData();
  });
});
