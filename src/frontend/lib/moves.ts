import type { JsonRecord, Pokemon } from './types';

const DAMAGE_BASE_TABLE: Record<number, { dmg: string; min: number; avg: number; max: number }> = {
  1:{dmg:'1d6+1',min:2,avg:5,max:7},2:{dmg:'1d6+3',min:4,avg:7,max:9},3:{dmg:'1d6+5',min:6,avg:9,max:11},4:{dmg:'1d8+6',min:7,avg:11,max:14},5:{dmg:'1d8+8',min:9,avg:13,max:16},6:{dmg:'2d6+8',min:10,avg:15,max:20},7:{dmg:'2d6+10',min:12,avg:17,max:22},8:{dmg:'2d8+10',min:12,avg:19,max:26},9:{dmg:'2d10+10',min:12,avg:21,max:30},10:{dmg:'3d8+10',min:13,avg:24,max:34},11:{dmg:'3d10+10',min:13,avg:27,max:40},12:{dmg:'3d12+10',min:13,avg:30,max:46},13:{dmg:'4d10+10',min:14,avg:35,max:50},14:{dmg:'4d10+15',min:19,avg:40,max:55},15:{dmg:'4d10+20',min:24,avg:45,max:60},16:{dmg:'5d10+20',min:25,avg:50,max:70},17:{dmg:'5d12+25',min:30,avg:60,max:85},18:{dmg:'6d12+25',min:31,avg:65,max:97},19:{dmg:'6d12+30',min:36,avg:70,max:102},20:{dmg:'6d12+35',min:41,avg:75,max:107},21:{dmg:'6d12+40',min:46,avg:80,max:112},22:{dmg:'6d12+45',min:51,avg:85,max:117},23:{dmg:'6d12+50',min:56,avg:90,max:122},24:{dmg:'6d12+55',min:61,avg:95,max:127},25:{dmg:'6d12+60',min:66,avg:100,max:132},26:{dmg:'7d12+65',min:72,avg:110,max:149},27:{dmg:'8d12+70',min:78,avg:120,max:166},28:{dmg:'8d12+80',min:88,avg:130,max:176}
};

const struggleCapabilities = [
  ['Zapper','Electric'],['Firestarter','Fire'],['Guster','Flying'],['Fountain','Water'],['Freezer','Ice'],['Materializer','Rock'],['Intoxicator','Poison']
];

export function damageBase(value: number, stab = false) {
  const db = Math.max(1, Math.min(28, Math.trunc(value) || 4));
  return { short: `DB${db}`, ...DAMAGE_BASE_TABLE[db], stab };
}

export function moveDamageBase(move: JsonRecord): number {
  return Number(move.db ?? (String(move.damageBase?.short || '').match(/\d+/)?.[0] || 0));
}

export function isOffensiveMove(move: JsonRecord): boolean {
  return Boolean(move.damageBase) && ['physical', 'special'].includes(String(move.class || '').toLowerCase());
}

export function hasSameType(pokemon: Pokemon, move: JsonRecord): boolean {
  const moveType = String(move.type || '').toLowerCase();
  const source = pokemon.actualTypes || pokemon.types || [];
  const types = Array.isArray(source) ? source : source.formes?.[source.selectedForme] || [];
  return Boolean(moveType) && types.some(type => String(type).toLowerCase() === moveType);
}

export function setDefaultStab(pokemon: Pokemon, move: JsonRecord): JsonRecord {
  if (!move.stabCustomized && isOffensiveMove(move) && hasSameType(pokemon, move) && !move.damageBase.stab) {
    const db = moveDamageBase(move);
    move.db = Math.min(28, db + 2);
    move.damageBase = damageBase(move.db, true);
  }
  return move;
}

export function toggleStab(move: JsonRecord): void {
  if (!move.damageBase) return;
  const active = Boolean(move.damageBase.stab);
  const db = moveDamageBase(move) + (active ? -2 : 2);
  move.db = Math.max(1, Math.min(28, db));
  move.damageBase = damageBase(move.db, !active);
  move.stabCustomized = true;
}

function combatRank(pokemon: Pokemon) { return Number(String(pokemon.skills?.Combat || pokemon.skills?.combat || '').match(/^\s*(\d+)\s*d6/i)?.[1] || 0); }
function capabilityName(value: string) { return value.replace(/\s+[\d/]+$/, '').trim().toLowerCase(); }
export function struggleTypes(pokemon: Pokemon) { const caps = (pokemon.capabilities || []).map(capabilityName); return ['Normal', ...struggleCapabilities.filter(([cap]) => caps.includes(cap.toLowerCase())).map(([, type]) => type)]; }

export function ensureStruggle(pokemon: Pokemon) {
  const defaults = combatRank(pokemon) >= 5 ? { ac: 3, db: 5 } : { ac: 4, db: 4 };
  const struggle = pokemon.struggle && typeof pokemon.struggle === 'object' ? pokemon.struggle : {};
  const types = struggleTypes(pokemon);
  struggle.name = 'Struggle'; struggle.range = 'Melee, 1 Target';
  if (!struggle.type) struggle.type = types[1] || 'Normal';
  // Determine the class of Struggle based on the Pokémon's stats if it has multiple types
  if (types.length > 1) struggle.class = Number(pokemon.stats.spA) > Number(pokemon.stats.atk) ? 'special' : 'physical';
  else struggle.class = 'physical';
  
  if (!struggle.ac) struggle.ac = defaults.ac;
  if (!struggle.damageBase) struggle.damageBase = damageBase(defaults.db);
  pokemon.struggle = struggle;
  return struggle;
}

export function attackValue(pokemon: Pokemon, move: any): number | null {
  const key = String(move.class || '').toLowerCase() === 'physical' ? 'atk' : String(move.class || '').toLowerCase() === 'special' ? 'spA' : null;
  return key ? Number(pokemon.stats[key] || 0) : null;
}

export function rollFormula(pokemon: Pokemon, move: any, critical = false): string | null {
  if (!move.damageBase?.dmg) return null;
  const attack = attackValue(pokemon, move); if (attack === null) return null;
  return critical ? `${move.damageBase.dmg}+${move.damageBase.dmg}+${attack}` : `${move.damageBase.dmg}+${attack}`;
}

export function damageRange(pokemon: Pokemon, move: any) {
  if (!move.damageBase) return null;
  const bonus = attackValue(pokemon, move) || 0;
  return { min: Number(move.damageBase.min) + bonus, avg: Number(move.damageBase.avg) + bonus, max: Number(move.damageBase.max) + bonus };
}
