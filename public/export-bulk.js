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
    // Load template once
    const response = await fetch('owlbear_template.json');
    const templateText = await response.text();

    const mergedShared = {};
    const sizeScales = { 'Large': 2, 'Huge': 3, 'Gigantic': 4 };

    let currentX = 0;

    for (let i = 0; i < pokemons.length; i++) {
        const pokemon = pokemons[i];
        const imageNumber = pokemon.Icon || pokemon.id;
        const imageUrl = `https://sewef.github.io/ptu/img/pokemon/full/${imageNumber}.png`;
        const pokemonName = pokemon.nickname || pokemon.name;
        const uuid = generateOwlbearUUID();

        let filled = templateText
            .split('PLACEHOLDER_UUID').join(uuid)
            .split('PLACEHOLDER_POKEMON_NAME').join(pokemonName.replace(/"/g, '\\"'))
            .split('PLACEHOLDER_IMAGE_URL').join(imageUrl);

        const result = JSON.parse(filled);
        const items = result.items.shared;
        const itemKey = Object.keys(items)[0];
        const item = items[itemKey];

        // Position tokens side by side
        item.position.x = currentX;
        item.position.y = 0;

        // Scale from size category
        const scale = sizeScales[pokemon.otherInfo?.sizeCategory] || 1;
        item.scale.x = scale;
        item.scale.y = scale;

        // Fixed token dimensions
        applyTokenDimensions(item, 96, 96);

        currentX += 96;

        mergedShared[uuid] = item;
    }

    // Compute global bounds from all token positions + half-size
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.values(mergedShared).forEach(item => {
        const hw = item.image.width / 2;
        const hh = item.image.height / 2;
        minX = Math.min(minX, item.position.x - hw);
        minY = Math.min(minY, item.position.y - hh);
        maxX = Math.max(maxX, item.position.x + hw);
        maxY = Math.max(maxY, item.position.y + hh);
    });

    const merged = {
        items: { shared: mergedShared, local: {} },
        bounds: { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } }
    };

    const jsonStr = JSON.stringify(merged, null, 2);
    await navigator.clipboard.writeText(jsonStr);
}

function applyTokenDimensions(item, w, h) {
    const dpi = Math.max(w, h);
    item.image.width = w;
    item.image.height = h;
    item.grid.dpi = dpi;
    item.grid.offset.x = w / 2;
    item.grid.offset.y = h / 2;
}
