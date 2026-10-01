import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearHistory, listHistory, loadPokemon, plainPokemon, removeHistory, savePokemon } from './storage';
import { normalizePokemon } from './pokemon';

describe('pokemon storage', () => {
  beforeEach(() => { localStorage.clear(); vi.stubGlobal('crypto', { randomUUID: () => 'record-1' }); });

  it('keeps the selected record and history index in sync', () => {
    const pokemon = normalizePokemon({ id: 25, name: 'Pikachu', level: 12, stats: { HP: 5 }, types: ['Electric'] });
    const id = savePokemon(pokemon);
    expect(id).toBe('record-1');
    expect(loadPokemon(id)?.name).toBe('Pikachu');
    expect(listHistory()).toHaveLength(1);
  });

  it('removes individual records and clears the complete history', () => {
    const pokemon = normalizePokemon({ id: 1, name: 'Bulbasaur', level: 5, stats: { HP: 5 }, types: ['Grass'] });
    const id = savePokemon(pokemon);
    removeHistory(id);
    expect(listHistory()).toEqual([]);
    savePokemon(pokemon);
    clearHistory();
    expect(listHistory()).toEqual([]);
  });

  it('creates a structured-clone-safe value for iframe messages', () => {
    const pokemon = normalizePokemon({ id: 25, name: 'Pikachu', level: 12, stats: { HP: 5 }, types: ['Electric'] });
    const reactiveLikePokemon = new Proxy(pokemon, {});

    expect(() => structuredClone(reactiveLikePokemon)).toThrow();
    expect(structuredClone(plainPokemon(reactiveLikePokemon))).toMatchObject({ name: 'Pikachu', level: 12 });
  });
});
