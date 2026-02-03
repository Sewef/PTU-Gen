/**
 * Export utilities for Pokémon data
 * Handles JSON export functionality
 */

/**
 * Export a Pokémon to a JSON file
 * @param {Object} pokemon - The Pokémon object to export
 */
function exportPokemon(pokemon) {
    const dataStr = JSON.stringify(pokemon, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const filename = pokemon.nickname 
        ? `${pokemon.nickname}_${pokemon.name}_Lvl${pokemon.level}.json`
        : `${pokemon.name}_Lvl${pokemon.level}.json`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
