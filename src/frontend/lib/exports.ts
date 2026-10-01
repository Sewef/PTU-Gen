import type { Pokemon } from './types';

declare global {
  interface Window {
    exportPokemon?: (pokemon: Pokemon) => void;
    exportPokemonRoll20?: (pokemon: Pokemon) => void;
    exportPokemonPokesheets?: (pokemon: Pokemon) => void;
    exportPokemonOwlbear?: (pokemon: Pokemon) => Promise<void>;
    exportBulkPTUGen?: (pokemon: Pokemon[]) => Promise<void>;
    exportBulkRoll20?: (pokemon: Pokemon[]) => Promise<void>;
    exportBulkPokesheets?: (pokemon: Pokemon[]) => Promise<void>;
    exportBulkOwlbear?: (pokemon: Pokemon[]) => Promise<void>;
  }
}

export type ExportFormat = 'json' | 'roll20' | 'pokesheets' | 'owlbear';

export async function exportOne(format: ExportFormat, pokemon: Pokemon) {
  const functions = {
    json: window.exportPokemon,
    roll20: window.exportPokemonRoll20,
    pokesheets: window.exportPokemonPokesheets,
    owlbear: window.exportPokemonOwlbear
  };
  const action = functions[format];
  if (!action) throw new Error(`Export ${format} is unavailable`);
  await action(pokemon);
}

export async function exportMany(format: ExportFormat, pokemon: Pokemon[]) {
  const functions = {
    json: window.exportBulkPTUGen,
    roll20: window.exportBulkRoll20,
    pokesheets: window.exportBulkPokesheets,
    owlbear: window.exportBulkOwlbear
  };
  const action = functions[format];
  if (!action) throw new Error(`Bulk export ${format} is unavailable`);
  await action(pokemon);
}
