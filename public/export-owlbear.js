/**
 * Export utilities for Owlbear Rodeo
 * Generates a token JSON for import into Owlbear Rodeo and copies it to the clipboard
 */

function generateOwlbearUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function exportPokemonOwlbear(pokemon) {
    const imageNumber = pokemon.Icon || pokemon.id;
    const imageUrl = `https://sewef.github.io/ptu/img/pokemon/full/${imageNumber}.png`;
    const pokemonName = pokemon.nickname || pokemon.name;
    const newUUID = generateOwlbearUUID();

    // Load the template
    const response = await fetch('owlbear_template.json');
    const templateText = await response.text();

    // Replace the placeholder UUID (appears as both object key and id field value)
    let filled = templateText
        .split('PLACEHOLDER_UUID').join(newUUID)
        .split('PLACEHOLDER_POKEMON_NAME').join(pokemonName.replace(/"/g, '\\"'))
        .split('PLACEHOLDER_IMAGE_URL').join(imageUrl);

    // Parse to set numeric width/height
    const result = JSON.parse(filled);
    const items = result.items.shared;
    const itemKey = Object.keys(items)[0];

    // Resolve actual image dimensions and update bounds
    const item = items[itemKey];
    const pos = item.position;

    // Scale based on size category
    const sizeScales = { 'Large': 2, 'Huge': 3, 'Gigantic': 4 };
    const scale = sizeScales[pokemon.otherInfo?.sizeCategory] || 1;
    item.scale.x = scale;
    item.scale.y = scale;

    function applyDimensions(w, h) {
        const dpi = Math.max(w, h);
        item.image.width = w;
        item.image.height = h;
        item.grid.dpi = dpi;
        item.grid.offset.x = w / 2;
        item.grid.offset.y = h / 2;
        // Bounds = bounding box of the image on the canvas
        // (placeholders in template are replaced here as numeric values)
        result.bounds.min.x = pos.x - w / 2;
        result.bounds.min.y = pos.y - h / 2;
        result.bounds.max.x = pos.x + w / 2;
        result.bounds.max.y = pos.y + h / 2;
    }

    await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            applyDimensions(img.width, img.height);
            resolve();
        };
        img.onerror = function () {
            // Fallback: standard sprite size
            applyDimensions(475, 475);
            resolve();
        };
        img.src = imageUrl;
    });

    const jsonStr = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(jsonStr);
    return jsonStr;
}
