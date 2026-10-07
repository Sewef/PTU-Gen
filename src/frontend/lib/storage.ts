import type { HistoryEntry, Pokemon } from './types';
import { pokemonImage } from './pokemon';

export const HISTORY_KEY = 'ptu-pokemon-history-v1';
export const SETTINGS_KEY = 'ptu-generator-preferences-v1';
export const SITE_HISTORY_SCOPE = 'site';
const RECORD_PREFIX = 'ptu-pokemon-record-';
const MAX_HISTORY = 50;

export function owlbearHistoryScope(roomId: string) {
  return `owlbear:${roomId}`;
}

export function historyKey(scope = SITE_HISTORY_SCOPE) {
  return scope === SITE_HISTORY_SCOPE ? HISTORY_KEY : `${HISTORY_KEY}:${encodeURIComponent(scope)}`;
}

export function settingsKey(scope = SITE_HISTORY_SCOPE) {
  return scope === SITE_HISTORY_SCOPE ? SETTINGS_KEY : `${SETTINGS_KEY}:${encodeURIComponent(scope)}`;
}

function recordPrefix(scope = SITE_HISTORY_SCOPE) {
  return scope === SITE_HISTORY_SCOPE ? RECORD_PREFIX : `${RECORD_PREFIX}${encodeURIComponent(scope)}-`;
}

export function plainPokemon(pokemon: Pokemon): Pokemon {
  return JSON.parse(JSON.stringify(pokemon)) as Pokemon;
}

export function ensurePokemonId(pokemon: Pokemon): string {
  return pokemon._ptuRecordId ||= crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function history(scope = SITE_HISTORY_SCOPE): HistoryEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(historyKey(scope)) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function savePokemon(pokemon: Pokemon, storageKey = 'selectedPokemon', scope = SITE_HISTORY_SCOPE): string {
  const id = ensurePokemonId(pokemon);
  pokemon._ptuHistoryScope = scope;
  pokemon._ptuUpdatedAt = new Date().toISOString();
  const serialized = JSON.stringify(pokemon);
  localStorage.setItem(`${recordPrefix(scope)}${id}`, serialized);
  localStorage.setItem(storageKey, serialized);

  const entry: HistoryEntry = {
    id,
    name: pokemon.name,
    nickname: pokemon.nickname || '',
    level: Number(pokemon.level) || 1,
    icon: pokemonImage(pokemon),
    updatedAt: pokemon._ptuUpdatedAt
  };
  const entries = [entry, ...history(scope).filter(item => item.id !== id)];
  entries.splice(MAX_HISTORY).forEach(item => localStorage.removeItem(`${recordPrefix(scope)}${item.id}`));
  localStorage.setItem(historyKey(scope), JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent('ptu-history-updated', { detail: entry }));

  if (window.parent !== window) {
    window.parent.postMessage({ type: 'ptu-pokemon-updated', storageKey, pokemon: JSON.parse(serialized) }, window.location.origin);
  }
  return id;
}

export function loadPokemon(id: string, scope = SITE_HISTORY_SCOPE): Pokemon | null {
  try { return JSON.parse(localStorage.getItem(`${recordPrefix(scope)}${id}`) || 'null'); }
  catch { return null; }
}

export function listHistory(scope = SITE_HISTORY_SCOPE): HistoryEntry[] {
  return history(scope).filter(item => item.id && localStorage.getItem(`${recordPrefix(scope)}${item.id}`));
}

export function removeHistory(id: string, scope = SITE_HISTORY_SCOPE) {
  localStorage.removeItem(`${recordPrefix(scope)}${id}`);
  localStorage.setItem(historyKey(scope), JSON.stringify(history(scope).filter(item => item.id !== id)));
  window.dispatchEvent(new CustomEvent('ptu-history-updated'));
}

export function clearHistory(scope = SITE_HISTORY_SCOPE) {
  history(scope).forEach(item => localStorage.removeItem(`${recordPrefix(scope)}${item.id}`));
  localStorage.removeItem(historyKey(scope));
  window.dispatchEvent(new CustomEvent('ptu-history-updated'));
}

export function readSelected(storageKey = 'selectedPokemon'): Pokemon | null {
  try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); }
  catch { return null; }
}
