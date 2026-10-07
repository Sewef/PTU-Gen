import type { BattleOnlyForm, JsonRecord, Pokemon } from './types';
import { ensureStruggle, setDefaultStab } from './moves';

export const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground',
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
] as const;

export const STAT_LABELS: Record<string, string> = {
  HP: 'HP', atk: 'Attack', def: 'Defense', spA: 'Special Attack', spD: 'Special Defense', spe: 'Speed'
};

export const COMBAT_STAGE_KEYS = ['atk', 'def', 'spA', 'spD', 'spe'] as const;
export const STAT_KEYS = ['HP', ...COMBAT_STAGE_KEYS] as const;

export function pokemonTypes(pokemon: Pokemon): string[] {
  const source = pokemon.actualTypes || pokemon.types || [];
  if (Array.isArray(source)) return source;
  return source.formes?.[source.selectedForme] || [];
}

export function hasNuclearType(pokemon: Pokemon): boolean {
  return pokemonTypes(pokemon).some(type => type.toLowerCase() === 'nuclear')
    || String(pokemon._fandex || '').toLowerCase() === 'uranium'
    || (pokemon.fandex || []).some(fandex => String(fandex).toLowerCase() === 'uranium');
}

function normalizeBattleOnlyForms(value: unknown): BattleOnlyForm[] {
  const entries = Array.isArray(value)
    ? value.map(form => [String(form?.name || ''), form] as const)
    : Object.entries(value && typeof value === 'object' ? value : {});
  const statAliases: Record<string, keyof Pokemon['statBonuses']> = {
    HP: 'HP', Attack: 'atk', atk: 'atk', Defense: 'def', def: 'def',
    'Special Attack': 'spA', spA: 'spA', 'Special Defense': 'spD', spD: 'spD', Speed: 'spe', spe: 'spe'
  };
  return entries.filter(([name]) => Boolean(name)).map(([name, raw]: readonly [string, any]) => {
    const stats: BattleOnlyForm['stats'] = {};
    for (const [key, amount] of Object.entries(raw?.stats || raw?.Stats || {})) {
      const stat = statAliases[key];
      if (stat) stats[stat] = Number(amount) || 0;
    }
    const abilityValue = raw?.ability ?? raw?.Ability;
    const abilityReplacements: Record<string, JsonRecord> = {};
    const replacementValues = {
      ...(raw?.advancedAbility1 ? { 'Adv Ability 1': raw.advancedAbility1 } : {}),
      ...(raw?.abilityReplacements && typeof raw.abilityReplacements === 'object' ? raw.abilityReplacements : {}),
      ...Object.fromEntries(Object.entries(raw || {}).filter(([key]) => /^(?:(?:Basic|Adv) Ability \d+|High Ability)$/i.test(key.trim())))
    };
    for (const [slot, value] of Object.entries(replacementValues)) {
      if (value && typeof value === 'object') {
        abilityReplacements[slot.trim()] = value as JsonRecord;
        continue;
      }
      const instruction = String(value || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\u00a0/g, ' ').trim();
      const replacementName = instruction.match(/^Becomes\s+(.+)$/i)?.[1]?.trim();
      if (replacementName) abilityReplacements[slot.trim()] = { name: replacementName };
    }
    return {
      name,
      icon: String(raw?.icon ?? raw?.Icon ?? '').trim(),
      types: Array.isArray(raw?.types ?? raw?.Type) ? [...(raw.types ?? raw.Type)] : [],
      stats,
      ability: typeof abilityValue === 'string' ? { name: abilityValue } : abilityValue || null,
      abilityReplacements
    };
  });
}

function imageUrl(pokemon: Pokemon, number: string | number, size: 'icons' | 'full'): string {
  const path = pokemon._fandex ? `${pokemon._fandex}/${number}` : number;
  return `https://sewef.github.io/ptu/img/pokemon/${size}/${path}.png`;
}

export function pokemonImage(pokemon: Pokemon, size: 'icons' | 'full' = 'icons'): string {
  if (!pokemon.activeBattleOnlyFormIcon && pokemon.image?.trim()) return pokemon.image.trim();
  return imageUrl(pokemon, pokemon.activeBattleOnlyFormIcon || pokemon.Icon || pokemon.id, size);
}

export function selectableTypes(pokemon: Pokemon): string[] {
  return ['Typeless', ...ALL_TYPES, ...(hasNuclearType(pokemon) ? ['Nuclear'] : [])];
}

export function battleOnlyFormImage(pokemon: Pokemon, form: BattleOnlyForm, size: 'icons' | 'full' = 'full'): string {
  return imageUrl(pokemon, form.icon || pokemon.Icon || pokemon.id, size);
}

export function slug(value: unknown): string {
  return String(value || 'normal').toLowerCase().replace(/\s+/g, '-');
}

function formulaStats(stats: Record<string, number> | undefined) {
  return {
    HP: Number(stats?.HP) || 0,
    ATK: Number(stats?.atk ?? stats?.ATK ?? stats?.Attack) || 0,
    DEF: Number(stats?.def ?? stats?.DEF ?? stats?.Defense) || 0,
    SPA: Number(stats?.spA ?? stats?.SPA ?? stats?.['Special Attack']) || 0,
    SPD: Number(stats?.spD ?? stats?.SPD ?? stats?.['Special Defense']) || 0,
    SPE: Number(stats?.spe ?? stats?.SPE ?? stats?.Speed) || 0
  };
}

export function calculateHp(level: number, stats: Record<string, number>, formula = 'LEVEL + (HP * 3) + 10'): number {
  const values = formulaStats(stats);
  try {
    const expression = formula.toUpperCase()
      .replace(/\bLEVEL\b/g, String(Number(level)))
      .replace(/\b(HP|ATK|DEF|SPA|SPD|SPE)\b/g, token => String(values[token as keyof typeof values]));
    if (!/^[\d+\-*/(). ]+$/.test(expression)) throw new Error('Invalid HP formula');
    // The expression is reduced to numbers and arithmetic operators above.
    return Math.max(1, Math.floor(Function(`"use strict"; return (${expression})`)()));
  } catch {
    return Math.max(1, Math.floor(Number(level) + values.HP * 3 + 10));
  }
}

export function normalizePokemon(raw: any): Pokemon {
  const pokemon = structuredClone(raw || {}) as Pokemon;
  pokemon.name ||= 'Unnamed Pokémon';
  pokemon.level = Number(pokemon.level) || 1;
  pokemon.types ||= ['Normal'];
  pokemon.stats ||= { HP: 1, atk: 1, def: 1, spA: 1, spD: 1, spe: 1 };
  if (!pokemon.baseStatsOriginal && pokemon.baseStats) pokemon.baseStatsOriginal = structuredClone(pokemon.baseStats);
  const storedStatBonuses = pokemon.statBonuses || {};
  pokemon.statBonuses = Object.fromEntries(
    STAT_KEYS.map(stat => [stat, Number(storedStatBonuses[stat]) || 0])
  ) as Pokemon['statBonuses'];
  pokemon.moves = (Array.isArray(pokemon.moves) ? pokemon.moves : []).map(move => setDefaultStab(pokemon, move));
  pokemon.abilities = Array.isArray(pokemon.abilities) ? pokemon.abilities : [];
  pokemon.pokeEdges = Array.isArray(pokemon.pokeEdges) ? pokemon.pokeEdges : [];
  pokemon.capabilities = Array.isArray(pokemon.capabilities) ? pokemon.capabilities : [];
  pokemon.battleOnlyForms = normalizeBattleOnlyForms(pokemon.battleOnlyForms || pokemon['Battle-Only Forms']);
  pokemon.skills ||= {};
  pokemon.otherInfo ||= {};
  const storedGender = String(pokemon.gender ?? pokemon.otherInfo.gender ?? 'Unknown');
  pokemon.gender = storedGender === 'Genderless' ? 'No Gender' : storedGender;
  pokemon.otherInfo.gender = pokemon.gender;
  const storedCombatStages = pokemon.combatStages || {};
  pokemon.combatStages = Object.fromEntries(
    COMBAT_STAGE_KEYS.map(stat => [stat, Number(storedCombatStages[stat]) || 0])
  ) as Pokemon['combatStages'];
  pokemon.captureState ||= { useErrata: false, standardCounts: {}, standardFlags: {}, errataFlags: {}, rarityBonus: 0 };
  pokemon.captureState.standardCounts ||= {};
  pokemon.captureState.standardFlags ||= {};
  pokemon.captureState.errataFlags ||= {};
  pokemon.owlbear ||= { visible: true, playerId: '', trackers: 'none', initiative: 'none', diceRoller: 'none' };
  pokemon.owlbear.visible ??= true;
  pokemon.owlbear.playerId ||= '';
  pokemon.owlbear.trackers ||= 'none';
  pokemon.owlbear.initiative ||= 'none';
  pokemon.owlbear.diceRoller ||= 'none';
  pokemon.hpFormula ||= pokemon.hp_formula || 'LEVEL + (HP * 3) + 10';
  pokemon.fiveStrikeMode = String(pokemon.fiveStrikeMode || '').toLowerCase() === 'additive' ? 'additive' : 'multiplicative';
  pokemon.hitPointsMax = Number(pokemon.hitPointsMax) || calculateHp(pokemon.level, pokemon.stats, pokemon.hpFormula);
  if (pokemon.hitPoints === undefined || pokemon.hitPoints === null) pokemon.hitPoints = pokemon.hitPointsMax;
  pokemon.tempHitPoints = Math.max(0, Math.trunc(Number(pokemon.tempHitPoints) || 0));
  pokemon.tutorPoints ??= Math.floor(pokemon.level / 5) + 1;
  setDefaultStab(pokemon, ensureStruggle(pokemon));
  delete pokemon.typeMultiplierMode;
  return pokemon;
}

export function frequencyUses(frequency: unknown): number {
  const match = String(frequency || '').match(/\d+/);
  return match ? Math.max(1, Number(match[0])) : 1;
}

export function parseTutorCost(cost: unknown): number {
  const match = String(cost || '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}
