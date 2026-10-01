import type { Pokemon } from './types';

export interface StandardCaptureBreakdown {
  capturable: boolean;
  base: number;
  hp: number;
  evolution: number;
  shiny: number;
  legendary: number;
  persistent: number;
  injuries: number;
  stuck: number;
  slow: number;
  current: number;
}

export function standardCaptureBreakdown(pokemon: Pokemon, evolutionStages: number): StandardCaptureBreakdown {
  const state = pokemon.captureState || {};
  const hp = Number(pokemon.hitPoints);
  const hpMax = Math.max(1, Number(pokemon.hitPointsMax));
  const hpPercent = hp / hpMax * 100;
  const base = 100 - Number(pokemon.level) * 2;
  const hpModifier = hp <= 0 ? 0 : hp === 1 ? 30 : hpPercent <= 25 ? 15 : hpPercent <= 50 ? 0 : hpPercent <= 75 ? -15 : -30;
  const breakdown = {
    capturable: hp > 0,
    base,
    hp: hpModifier,
    evolution: evolutionStages === 2 ? 10 : evolutionStages === 1 ? 0 : -10,
    shiny: pokemon.shiny ? -10 : 0,
    legendary: pokemon.legendary ? -30 : 0,
    persistent: (Number(state.standardCounts?.persistent) || 0) * 10,
    injuries: (Number(state.standardCounts?.injuries) || 0) * 5,
    stuck: state.standardFlags?.stuck ? 10 : 0,
    slow: state.standardFlags?.slow ? 5 : 0,
    current: 0
  };
  breakdown.current = breakdown.capturable
    ? Math.max(0, breakdown.base + breakdown.hp + breakdown.evolution + breakdown.shiny + breakdown.legendary + breakdown.persistent + breakdown.injuries + breakdown.stuck + breakdown.slow)
    : 0;
  return breakdown;
}

export interface ErrataCaptureBreakdown {
  base: number;
  hp50: boolean;
  hp25: boolean;
  status: boolean;
  evo1: boolean;
  evo2: boolean;
  injuries5: boolean;
  boxes: number;
  rarity: number;
  current: number;
}

export function errataCaptureBreakdown(pokemon: Pokemon): ErrataCaptureBreakdown {
  const state = pokemon.captureState || {};
  const flags = state.errataFlags || {};
  const hpPercent = Number(pokemon.hitPoints) / Math.max(1, Number(pokemon.hitPointsMax)) * 100;
  const hp50 = hpPercent <= 50;
  const hp25 = hpPercent <= 25;
  const status = Boolean(flags.status);
  const evo1 = Boolean(flags.evo1);
  const evo2 = Boolean(flags.evo2 ?? flags.evo2a);
  const injuries5 = Boolean(flags.injuries5 ?? flags.injuries5a);
  const boxes = Number(hp50) + Number(hp25) + Number(status) + Number(evo1) + Number(evo2) * 2 + Number(injuries5) * 2;
  const base = 10 + Math.floor(Number(pokemon.level) / 10);
  const rarity = Number(state.rarityBonus) || 0;
  return { base, hp50, hp25, status, evo1, evo2, injuries5, boxes, rarity, current: Math.max(0, base + rarity - boxes * 2) };
}
