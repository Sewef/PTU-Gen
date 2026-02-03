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

// Experience table for level progression
const EXP_TABLE = [
    { lvl: 1, exp: 0 },
    { lvl: 2, exp: 10 },
    { lvl: 3, exp: 20 },
    { lvl: 4, exp: 30 },
    { lvl: 5, exp: 40 },
    { lvl: 6, exp: 50 },
    { lvl: 7, exp: 60 },
    { lvl: 8, exp: 70 },
    { lvl: 9, exp: 80 },
    { lvl: 10, exp: 90 },
    { lvl: 11, exp: 110 },
    { lvl: 12, exp: 135 },
    { lvl: 13, exp: 160 },
    { lvl: 14, exp: 190 },
    { lvl: 15, exp: 220 },
    { lvl: 16, exp: 250 },
    { lvl: 17, exp: 285 },
    { lvl: 18, exp: 320 },
    { lvl: 19, exp: 360 },
    { lvl: 20, exp: 400 },
    { lvl: 21, exp: 460 },
    { lvl: 22, exp: 530 },
    { lvl: 23, exp: 600 },
    { lvl: 24, exp: 670 },
    { lvl: 25, exp: 745 },
    { lvl: 26, exp: 820 },
    { lvl: 27, exp: 900 },
    { lvl: 28, exp: 990 },
    { lvl: 29, exp: 1075 },
    { lvl: 30, exp: 1165 },
    { lvl: 31, exp: 1260 },
    { lvl: 32, exp: 1355 },
    { lvl: 33, exp: 1455 },
    { lvl: 34, exp: 1555 },
    { lvl: 35, exp: 1660 },
    { lvl: 36, exp: 1770 },
    { lvl: 37, exp: 1880 },
    { lvl: 38, exp: 1995 },
    { lvl: 39, exp: 2110 },
    { lvl: 40, exp: 2230 },
    { lvl: 41, exp: 2355 },
    { lvl: 42, exp: 2480 },
    { lvl: 43, exp: 2610 },
    { lvl: 44, exp: 2740 },
    { lvl: 45, exp: 2875 },
    { lvl: 46, exp: 3015 },
    { lvl: 47, exp: 3155 },
    { lvl: 48, exp: 3300 },
    { lvl: 49, exp: 3445 },
    { lvl: 50, exp: 3645 },
    { lvl: 51, exp: 3850 },
    { lvl: 52, exp: 4060 },
    { lvl: 53, exp: 4270 },
    { lvl: 54, exp: 4485 },
    { lvl: 55, exp: 4705 },
    { lvl: 56, exp: 4930 },
    { lvl: 57, exp: 5160 },
    { lvl: 58, exp: 5390 },
    { lvl: 59, exp: 5625 },
    { lvl: 60, exp: 5865 },
    { lvl: 61, exp: 6110 },
    { lvl: 62, exp: 6360 },
    { lvl: 63, exp: 6610 },
    { lvl: 64, exp: 6865 },
    { lvl: 65, exp: 7125 },
    { lvl: 66, exp: 7390 },
    { lvl: 67, exp: 7660 },
    { lvl: 68, exp: 7925 },
    { lvl: 69, exp: 8205 },
    { lvl: 70, exp: 8485 },
    { lvl: 71, exp: 8770 },
    { lvl: 72, exp: 9060 },
    { lvl: 73, exp: 9350 },
    { lvl: 74, exp: 9645 },
    { lvl: 75, exp: 9945 },
    { lvl: 76, exp: 10250 },
    { lvl: 77, exp: 10560 },
    { lvl: 78, exp: 10870 },
    { lvl: 79, exp: 11185 },
    { lvl: 80, exp: 11505 },
    { lvl: 81, exp: 11910 },
    { lvl: 82, exp: 12320 },
    { lvl: 83, exp: 12735 },
    { lvl: 84, exp: 13155 },
    { lvl: 85, exp: 13580 },
    { lvl: 86, exp: 14010 },
    { lvl: 87, exp: 14445 },
    { lvl: 88, exp: 14885 },
    { lvl: 89, exp: 15330 },
    { lvl: 90, exp: 15780 },
    { lvl: 91, exp: 16235 },
    { lvl: 92, exp: 16695 },
    { lvl: 93, exp: 17160 },
    { lvl: 94, exp: 17630 },
    { lvl: 95, exp: 18105 },
    { lvl: 96, exp: 18585 },
    { lvl: 97, exp: 19070 },
    { lvl: 98, exp: 19560 },
    { lvl: 99, exp: 20055 },
    { lvl: 100, exp: 20555 }];