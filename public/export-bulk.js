/**
 * Bulk export utilities for the index page
 * Handles multi-Pokémon exports (ZIP for PTU-Gen / Roll20 / Pokésheets, merged JSON for Owlbear)
 * Requires JSZip (loaded via CDN), export.js, export-roll20.js, export-pokesheets.js, export-owlbear.js
 */

// ─── helpers ────────────────────────────────────────────────────────────────

function bulkDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function pokemonFilename(pokemon, suffix = '') {
    const base = pokemon.nickname
        ? `${pokemon.nickname}_${pokemon.name}_Lvl${pokemon.level}`
        : `${pokemon.name}_Lvl${pokemon.level}`;
    return suffix ? `${base}_${suffix}` : base;
}

function getStoredPokemons() {
    const count = parseInt(sessionStorage.getItem('pokemon_count') || '0');
    const pokemons = [];
    for (let i = 0; i < count; i++) {
        const raw = sessionStorage.getItem(`pokemon_${i}`);
        if (raw) pokemons.push(JSON.parse(raw));
    }
    return pokemons;
}

// ─── PTU-Gen JSON ────────────────────────────────────────────────────────────

async function exportBulkPTUGen(pokemons) {
    if (pokemons.length === 1) {
        exportPokemon(pokemons[0]);
        return;
    }
    const zip = new JSZip();
    pokemons.forEach(p => {
        zip.file(`${pokemonFilename(p)}.json`, JSON.stringify(p, null, 2));
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    bulkDownload(blob, `PTUGen_${pokemons.length}_pokemon.zip`);
}

// ─── Roll20 ──────────────────────────────────────────────────────────────────

async function exportBulkRoll20(pokemons) {
    if (pokemons.length === 1) {
        exportPokemonRoll20(pokemons[0]);
        return;
    }
    const zip = new JSZip();
    pokemons.forEach(p => {
        const data = convertToRoll20Format(p);
        zip.file(`${pokemonFilename(p, 'Roll20')}.json`, JSON.stringify(data, null, 4));
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    bulkDownload(blob, `Roll20_${pokemons.length}_pokemon.zip`);
}

// ─── Pokésheets ───────────────────────────────────────────────────────────────

async function exportBulkPokesheets(pokemons) {
    if (pokemons.length === 1) {
        exportPokemonPokesheets(pokemons[0]);
        return;
    }
    const zip = new JSZip();
    pokemons.forEach(p => {
        const data = convertToPokesheetsFormat(p);
        zip.file(`${pokemonFilename(p, 'Pokesheets')}.json`, JSON.stringify(data, null, 4));
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    bulkDownload(blob, `Pokesheets_${pokemons.length}_pokemon.zip`);
}

// ─── Owlbear (merged) ────────────────────────────────────────────────────────

async function exportBulkOwlbear(pokemons) {
    const response = await fetch('owlbear_template.json');
    const templateText = await response.text();

    const shared = {};
    let currentX = 0;

    for (const pokemon of pokemons) {
        const { uuid, item } = buildOwlbearItem(pokemon, templateText, { x: currentX, y: 0 });
        shared[uuid] = item;
        currentX += OWLBEAR_TOKEN_SIZE;
    }

    const merged = {
        items: { shared, local: {} },
        bounds: computeOwlbearBounds(shared)
    };

    const jsonStr = JSON.stringify(merged, null, 2);
    await navigator.clipboard.writeText(jsonStr);
}
