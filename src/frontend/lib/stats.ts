import type { Pokemon } from './types';

export const COMBAT_STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 0.4,
  [-5]: 0.5,
  [-4]: 0.6,
  [-3]: 0.7,
  [-2]: 0.8,
  [-1]: 0.9,
  0: 1,
  1: 1.2,
  2: 1.4,
  3: 1.6,
  4: 1.8,
  5: 2,
  6: 2.2
};

type StatKey = 'HP' | keyof Pokemon['combatStages'];

export function totalStat(pokemon: Pokemon, stat: StatKey): number {
  const value = Number(pokemon.stats?.[stat]) || 0;
  if (stat === 'HP') return value;
  const stage = Number(pokemon.combatStages?.[stat]) || 0;
  return Math.floor(value * (COMBAT_STAGE_MULTIPLIERS[stage] || 1));
}
