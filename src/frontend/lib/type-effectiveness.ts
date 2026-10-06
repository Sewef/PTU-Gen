import type { Pokemon } from './types';
import { pokemonTypes, selectableTypes } from './pokemon';

export function attackingTypes(pokemon: Pokemon): string[] {
  return selectableTypes(pokemon);
}

type Relations = { weak?: string[]; resist?: string[]; immune?: string[] };
const chart: Record<string, Relations> = {
  normal: { weak: ['fighting'], immune: ['ghost'] },
  fire: { weak: ['water', 'ground', 'rock'], resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'] },
  water: { weak: ['electric', 'grass'], resist: ['fire', 'water', 'ice', 'steel'] },
  electric: { weak: ['ground'], resist: ['electric', 'flying', 'steel'] },
  grass: { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], resist: ['water', 'electric', 'grass', 'ground'] },
  ice: { weak: ['fire', 'fighting', 'rock', 'steel'], resist: ['ice'] },
  fighting: { weak: ['flying', 'psychic', 'fairy'], resist: ['bug', 'rock', 'dark'] },
  poison: { weak: ['ground', 'psychic'], resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'] },
  ground: { weak: ['water', 'grass', 'ice'], resist: ['poison', 'rock'], immune: ['electric'] },
  flying: { weak: ['electric', 'ice', 'rock'], resist: ['grass', 'fighting', 'bug'], immune: ['ground'] },
  psychic: { weak: ['bug', 'ghost', 'dark'], resist: ['fighting', 'psychic'] },
  bug: { weak: ['fire', 'flying', 'rock'], resist: ['grass', 'fighting', 'ground'] },
  rock: { weak: ['water', 'grass', 'fighting', 'ground', 'steel'], resist: ['normal', 'fire', 'poison', 'flying'] },
  ghost: { weak: ['ghost', 'dark'], resist: ['poison', 'bug'], immune: ['normal', 'fighting'] },
  dragon: { weak: ['ice', 'dragon', 'fairy'], resist: ['fire', 'water', 'electric', 'grass'] },
  dark: { weak: ['fighting', 'bug', 'fairy'], resist: ['ghost', 'dark'], immune: ['psychic'] },
  steel: { weak: ['fire', 'fighting', 'ground'], resist: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immune: ['poison'] },
  fairy: { weak: ['poison', 'steel'], resist: ['fighting', 'bug', 'dark'], immune: ['dragon'] }
};

export function typeEffectiveness(pokemon: Pokemon): Record<string, number> {
  const result: Record<string, number> = { typeless: 1 };
  for (const attacking of attackingTypes(pokemon).slice(1).map(type => type.toLowerCase())) {
    let score = 0;
    let immune = false;
    for (const defending of pokemonTypes(pokemon).map(type => type.toLowerCase())) {
      const relations = chart[defending];
      if (relations?.immune?.includes(attacking)) immune = true;
      else if (relations?.weak?.includes(attacking)) score++;
      else if (relations?.resist?.includes(attacking)) score--;
    }
    result[attacking] = immune ? 0 : score < 0 ? .5 ** Math.abs(score) : score === 0 ? 1 : score === 1 ? 1.5 : score;
  }
  for (const [type, value] of Object.entries(pokemon.typeEffectivenessOverrides || {})) {
    if (type in result && Number.isFinite(Number(value))) result[type] = Number(value);
  }
  return result;
}
