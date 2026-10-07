import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearHistory, listHistory, loadPokemon, plainPokemon, removeHistory, savePokemon, settingsKey } from './storage';
import { normalizePokemon } from './pokemon';

describe('pokemon storage', () => {
  beforeEach(() => { localStorage.clear(); vi.stubGlobal('crypto', { randomUUID: () => 'record-1' }); });

  it('uses a room-specific key for Owlbear generator settings', () => {
    expect(settingsKey()).toBe('ptu-generator-preferences-v1');
    expect(settingsKey('owlbear:room-42')).toBe('ptu-generator-preferences-v1:owlbear%3Aroom-42');
    expect(settingsKey('owlbear:another-room')).not.toBe(settingsKey('owlbear:room-42'));
  });

  it('keeps the selected record and history index in sync', () => {
    const pokemon = normalizePokemon({ id: 25, name: 'Pikachu', level: 12, stats: { HP: 5 }, types: ['Electric'] });
    const id = savePokemon(pokemon);
    expect(id).toBe('record-1');
    expect(loadPokemon(id)?.name).toBe('Pikachu');
    expect(listHistory()).toHaveLength(1);
    savePokemon(plainPokemon(pokemon));
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

  it('keeps site and Owlbear room histories isolated', () => {
    const sitePokemon = normalizePokemon({ id: 1, name: 'Bulbasaur', level: 5, stats: { HP: 5 }, types: ['Grass'] });
    const roomPokemon = normalizePokemon({ id: 4, name: 'Charmander', level: 7, stats: { HP: 5 }, types: ['Fire'] });
    savePokemon(sitePokemon);
    savePokemon(roomPokemon, 'room-selected', 'owlbear:room-42');

    expect(listHistory().map(entry => entry.name)).toEqual(['Bulbasaur']);
    expect(listHistory('owlbear:room-42').map(entry => entry.name)).toEqual(['Charmander']);
    expect(listHistory('owlbear:another-room')).toEqual([]);

    clearHistory('owlbear:room-42');
    expect(listHistory('owlbear:room-42')).toEqual([]);
    expect(listHistory().map(entry => entry.name)).toEqual(['Bulbasaur']);
  });

  it('creates a structured-clone-safe value for iframe messages', () => {
    const pokemon = normalizePokemon({ id: 25, name: 'Pikachu', level: 12, stats: { HP: 5 }, types: ['Electric'] });
    const reactiveLikePokemon = new Proxy(pokemon, {});

    expect(() => structuredClone(reactiveLikePokemon)).toThrow();
    expect(structuredClone(plainPokemon(reactiveLikePokemon))).toMatchObject({ name: 'Pikachu', level: 12 });
  });
});
