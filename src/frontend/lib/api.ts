import type { GeneratorSettings, Pokemon } from './types';
import { normalizePokemon } from './pokemon';

export function typesForFandexes(types: string[], fandexes: string[]): string[] {
  const available = new Set(types);
  if (fandexes.some(fandex => fandex.trim().toLowerCase() === 'uranium')) available.add('Nuclear');
  return [...available].sort((left, right) => left.localeCompare(right));
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || body.message || response.statusText);
  return body as T;
}

export async function metadata(settings: Pick<GeneratorSettings, 'dataset' | 'fandex'>) {
  const query = new URLSearchParams({ dataset: settings.dataset });
  if (settings.fandex.length) query.set('fandex', settings.fandex.join(','));
  const [species, habitats, types] = await Promise.all([
    json<{ species: string[] }>(`/api/pokemon/list?${query}`),
    json<{ habitats: string[] }>(`/api/pokemon/habitats?${query}`),
    json<{ types: string[] }>(`/api/pokemon/types?${query}`)
  ]);
  return {
    species: species.species,
    habitats: habitats.habitats,
    types: typesForFandexes(types.types, settings.fandex)
  };
}

export async function generatorOptions() {
  const [fandexes, natures] = await Promise.all([
    json<{ fandexes: any[] }>('/api/pokemon/fandexes'),
    json<{ natures: any[] }>('/api/pokemon/natures')
  ]);
  return { fandexes: fandexes.fandexes || [], natures: natures.natures || [] };
}

export const getNatures = () => json<{ natures: any[] }>('/api/pokemon/natures');

export function generationParams(settings: GeneratorSettings, blank = false): URLSearchParams {
  const params = new URLSearchParams();
  if (settings.levelMode === 'range' && !blank) {
    params.set('minLevel', String(settings.minLevel));
    params.set('maxLevel', String(settings.maxLevel));
  } else params.set('level', String(settings.levelMode === 'range' ? settings.minLevel : settings.level));
  if (!blank && settings.species.trim()) params.set('species', settings.species.trim());
  if (!blank && settings.habitat) params.set('habitat', settings.habitat);
  if (!blank && settings.type) params.set('type', settings.type);
  if (!blank && settings.randomForm) params.set('randomForm', 'true');
  if (!blank && settings.shinyMode === 'force') params.set('shiny', 'true');
  else if (!blank && settings.shinyOdds > 0) params.set('shinyOdds', String(settings.shinyOdds));
  params.set('dataset', settings.dataset);
  if (settings.fandex.length) params.set('fandex', settings.fandex.join(','));
  params.set('distribution', settings.distribution);
  params.set('natureMode', settings.natureMode);
  if (settings.natureMode === 'fixed' && settings.nature) params.set('nature', settings.nature);
  if (settings.includeLegendaries) params.set('includeLegendaries', 'true');
  if (settings.forceEvolution) params.set('forceEvolution', 'true');
  if (settings.ignoreBaseRelation) params.set('ignoreBaseRelation', settings.ignoreBaseRelation);
  if (settings.hpFormula) params.set('hpFormula', settings.hpFormula);
  params.set('fiveStrikeMode', settings.fiveStrikeMode);
  params.set('owlbearVisible', String(settings.owlbearVisible));
  params.set('owlbearTrackers', settings.owlbearTrackers);
  params.set('owlbearInitiative', settings.owlbearInitiative);
  params.set('owlbearDiceRoller', settings.owlbearDiceRoller);
  if (settings.owlbearPlayerId) params.set('owlbearPlayerId', settings.owlbearPlayerId);
  return params;
}

export async function generate(settings: GeneratorSettings, blank = false): Promise<Pokemon> {
  const endpoint = blank ? 'generateBlank' : 'generate';
  return normalizePokemon(await json(`/api/pokemon/${endpoint}?${generationParams(settings, blank)}`));
}

export type CustomizationKind = 'species' | 'abilities' | 'moves';

export async function loadCustom(kind: CustomizationKind, input: string | unknown) {
  let body: Record<string, unknown>;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) throw new Error('Select a JSON file or paste JSON / a URL.');
    body = /^https?:\/\//i.test(trimmed) ? { url: trimmed } : { data: JSON.parse(trimmed) };
  } else body = { data: input };
  return json(`/api/pokemon/custom/${kind}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
}

export const allMoves = (pokemon: Pokemon) => json<any[]>(`/api/pokemon/all-moves?dataset=${pokemon.dataset || 'core'}`);
export const availableMoves = (pokemon: Pokemon) => json<any>(`/api/pokemon/moves/${encodeURIComponent(pokemon.name)}?dataset=${pokemon.dataset || 'core'}`);
export const allAbilities = (pokemon: Pokemon) => json<any[]>(`/api/pokemon/all-abilities?dataset=${pokemon.dataset || 'core'}`);
export const availableAbilities = (pokemon: Pokemon) => json<any>(`/api/pokemon/abilities/${encodeURIComponent(pokemon.name)}?dataset=${pokemon.dataset || 'core'}`);
