import type { Pokemon } from './types';
import { calculateHp } from './pokemon';

export function levelUpdate(pokemon: Pokemon, requested: number) {
  const level = Math.min(100, Math.max(1, Number(requested) || 1));
  return {
    level,
    hitPointsMax: calculateHp(level, pokemon.stats, pokemon.hpFormula),
    tutorPoints: pokemon.tutorPointsManual ? pokemon.tutorPoints : Math.floor(level / 5) + 1
  };
}

export function natureUpdate(pokemon: Pokemon, nature: any, calculator: any) {
  if (!calculator?.getDistributedPoints || !pokemon.baseStats) return { nature };
  const result = calculator.getDistributedPoints(
    pokemon.baseStats,
    pokemon.level,
    nature,
    pokemon.distribution || 'RANDOM',
    pokemon.ignoreBaseRelation
  );
  const stats = { ...pokemon.stats };
  for (const stat of ['HP', 'atk', 'def', 'spA', 'spD', 'spe']) {
    stats[stat] = result.baseWithNature[stat] + (result.distributedPoints[stat] || 0);
  }
  return {
    nature,
    baseWithNature: result.baseWithNature,
    distributedPoints: result.distributedPoints,
    stats,
    hitPointsMax: calculateHp(pokemon.level, stats, pokemon.hpFormula)
  };
}
