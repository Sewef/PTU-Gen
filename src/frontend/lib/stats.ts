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

export function evade(pokemon: Pokemon, stat: 'def' | 'spD' | 'spe') {
  const base = Math.max(0, Math.min(6, Math.floor(totalStat(pokemon, stat) / 5)));
  const bonus = Number.isFinite(Number(pokemon.evadeBonus)) ? Math.trunc(Number(pokemon.evadeBonus)) : 0;
  return { base, bonus, total: Math.max(0, Math.min(9, base + bonus)) };
}
