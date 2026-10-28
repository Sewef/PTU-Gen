import { afterEach, describe, expect, it, vi } from 'vitest';
import { generate, generationParams, loadCustom, typesForFandexes } from './api';
import type { GeneratorSettings } from './types';

const settings: GeneratorSettings = {
  dataset: 'community', fandex: ['alpha', 'beta'], countMode: 'fixed', count: 1, minCount: 1, maxCount: 6,
  levelMode: 'range', level: 50, minLevel: 20, maxLevel: 30, species: 'Pikachu', randomForm: true,
  habitat: 'Forest', type: 'Electric', shinyMode: 'odds', shinyOdds: 2.5, includeLegendaries: true,
  matchEvolutionStageToLevel: true, distribution: 'BALANCED', natureMode: 'fixed', nature: 'Brave',
  ignoreBaseRelation: 'HP', hpFormula: 'LEVEL + HP', fiveStrikeMode: 'additive', owlbearVisible: false, owlbearPlayerId: 'player-1',
  owlbearTrackers: 'owltrackers', owlbearInitiative: 'prettysordid', owlbearDiceRoller: 'justdices'
};

describe('generation progress', () => {
  afterEach(() => vi.unstubAllGlobals());

  function mockStream(chunks: string[]) {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      }
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    })));
  }

  it('reports stages across chunk boundaries and returns the normalized Pokémon', async () => {
    mockStream([
      '{"stage":"Loading data…"}\n{"sta',
      'ge":"Selecting abilities…"}\n',
      '{"pokemon":{"id":25,"name":"Pikachu","level":10,"stats":{"HP":5}}}'
    ]);
    const progress = vi.fn();
    const pokemon = await generate(settings, false, progress);
    expect(progress.mock.calls).toEqual([['Loading data…'], ['Selecting abilities…']]);
    expect(pokemon).toMatchObject({ id: 25, name: 'Pikachu', level: 10, statBonuses: { atk: 0 } });
  });

  it('propagates an error sent after generation starts', async () => {
    mockStream(['{"stage":"Loading data…"}\n{"error":"Species not found"}\n']);
    await expect(generate(settings, false, vi.fn())).rejects.toThrow('Species not found');
  });

  it('rejects a stream that ends without a result', async () => {
    mockStream(['{"stage":"Loading data…"}\n']);
    await expect(generate(settings, false, vi.fn())).rejects.toThrow('Generation finished without a Pokémon');
  });
});

describe('generationParams', () => {
  it('maps the complete reactive form state to the existing API contract', () => {
    const params = generationParams(settings);
    expect(params.get('minLevel')).toBe('20');
    expect(params.get('maxLevel')).toBe('30');
    expect(params.get('species')).toBe('Pikachu');
    expect(params.get('fandex')).toBe('alpha,beta');
    expect(params.get('nature')).toBe('Brave');
    expect(params.get('matchEvolutionStageToLevel')).toBe('true');
    expect(params.get('owlbearVisible')).toBe('false');
    expect(params.get('fiveStrikeMode')).toBe('additive');
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

describe('loadCustom', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts parsed template data to the species endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, count: 1 }) });
    vi.stubGlobal('fetch', fetchMock);

    await loadCustom('species', { Warrior: { types: ['Fire'] } });

    expect(fetchMock).toHaveBeenCalledWith('/api/pokemon/custom/species', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ data: { Warrior: { types: ['Fire'] } } })
    }));
  });

  it('posts HTTP inputs as template URLs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, count: 1 }) });
    vi.stubGlobal('fetch', fetchMock);

    await loadCustom('moves', 'https://example.com/template_moves.json');

    expect(fetchMock).toHaveBeenCalledWith('/api/pokemon/custom/moves', expect.objectContaining({
      body: JSON.stringify({ url: 'https://example.com/template_moves.json' })
    }));
  });
});
