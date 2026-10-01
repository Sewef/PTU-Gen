import { describe, expect, it } from 'vitest';
import { generationParams, typesForFandexes } from './api';
import type { GeneratorSettings } from './types';

const settings: GeneratorSettings = {
  dataset: 'community', fandex: ['alpha', 'beta'], countMode: 'fixed', count: 1, minCount: 1, maxCount: 6,
  levelMode: 'range', level: 50, minLevel: 20, maxLevel: 30, species: 'Pikachu', randomForm: true,
  habitat: 'Forest', type: 'Electric', shinyMode: 'odds', shinyOdds: 2.5, includeLegendaries: true,
  forceEvolution: true, distribution: 'BALANCED', natureMode: 'fixed', nature: 'Brave',
  ignoreBaseRelation: 'HP', hpFormula: 'LEVEL + HP', owlbearVisible: false, owlbearPlayerId: 'player-1',
  owlbearTrackers: 'owltrackers', owlbearInitiative: 'prettysordid', owlbearDiceRoller: 'justdices'
};

describe('generationParams', () => {
  it('maps the complete reactive form state to the existing API contract', () => {
    const params = generationParams(settings);
    expect(params.get('minLevel')).toBe('20');
    expect(params.get('maxLevel')).toBe('30');
    expect(params.get('species')).toBe('Pikachu');
    expect(params.get('fandex')).toBe('alpha,beta');
    expect(params.get('nature')).toBe('Brave');
    expect(params.get('owlbearVisible')).toBe('false');
  });

  it('omits species filters for blank Pokémon', () => {
    const params = generationParams(settings, true);
    expect(params.has('species')).toBe(false);
    expect(params.has('habitat')).toBe(false);
    expect(params.get('level')).toBe('20');
  });
});

describe('typesForFandexes', () => {
  it('adds Nuclear only when Uranium is included', () => {
    expect(typesForFandexes(['Fire', 'Water'], ['uranium'])).toEqual(['Fire', 'Nuclear', 'Water']);
    expect(typesForFandexes(['Fire', 'Water'], ['Uranium'])).toEqual(['Fire', 'Nuclear', 'Water']);
    expect(typesForFandexes(['Fire', 'Water'], ['sage'])).toEqual(['Fire', 'Water']);
  });

  it('does not duplicate Nuclear when the API already returns it', () => {
    expect(typesForFandexes(['Fire', 'Nuclear'], ['uranium'])).toEqual(['Fire', 'Nuclear']);
  });
});
