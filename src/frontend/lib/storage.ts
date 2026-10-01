import type { HistoryEntry, Pokemon } from './types';
import { pokemonImage } from './pokemon';

export const HISTORY_KEY = 'ptu-pokemon-history-v1';
const RECORD_PREFIX = 'ptu-pokemon-record-';
const MAX_HISTORY = 50;

export function plainPokemon(pokemon: Pokemon): Pokemon {
  return JSON.parse(JSON.stringify(pokemon)) as Pokemon;
}

function history(): HistoryEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function savePokemon(pokemon: Pokemon, storageKey = 'selectedPokemon'): string {
  const id = pokemon._ptuRecordId ||= crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  pokemon._ptuUpdatedAt = new Date().toISOString();
  const serialized = JSON.stringify(pokemon);
  localStorage.setItem(`${RECORD_PREFIX}${id}`, serialized);
  localStorage.setItem(storageKey, serialized);

  const entry: HistoryEntry = {
    id,
    name: pokemon.name,
    nickname: pokemon.nickname || '',
    level: Number(pokemon.level) || 1,
    icon: pokemonImage(pokemon),
    updatedAt: pokemon._ptuUpdatedAt
  };
  const entries = [entry, ...history().filter(item => item.id !== id)];
  entries.splice(MAX_HISTORY).forEach(item => localStorage.removeItem(`${RECORD_PREFIX}${item.id}`));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent('ptu-history-updated', { detail: entry }));

  if (window.parent !== window) {
    window.parent.postMessage({ type: 'ptu-pokemon-updated', storageKey, pokemon: JSON.parse(serialized) }, window.location.origin);
  }
  return id;
}

export function loadPokemon(id: string): Pokemon | null {
  try { return JSON.parse(localStorage.getItem(`${RECORD_PREFIX}${id}`) || 'null'); }
  catch { return null; }
}

export function listHistory(): HistoryEntry[] {
  return history().filter(item => item.id && localStorage.getItem(`${RECORD_PREFIX}${item.id}`));
}

export function removeHistory(id: string) {
  localStorage.removeItem(`${RECORD_PREFIX}${id}`);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history().filter(item => item.id !== id)));
  window.dispatchEvent(new CustomEvent('ptu-history-updated'));
}

export function clearHistory() {
  history().forEach(item => localStorage.removeItem(`${RECORD_PREFIX}${item.id}`));
  localStorage.removeItem(HISTORY_KEY);
  window.dispatchEvent(new CustomEvent('ptu-history-updated'));
}

export function readSelected(storageKey = 'selectedPokemon'): Pokemon | null {
  try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); }
  catch { return null; }
}
