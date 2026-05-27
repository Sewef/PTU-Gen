/**
 * Export utilities for Owlbear Rodeo
 * Generates a token JSON for import into Owlbear Rodeo and copies it to the clipboard
 */

const OWLBEAR_TOKEN_SIZE = 96;
const OWLBEAR_SIZE_SCALES = { 'Large': 2, 'Huge': 3, 'Gigantic': 4 };

function generateTokenUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateOwlTrackersUUID() {
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Fill the template for a single Pokémon and return { uuid, item }.
 * position defaults to {x:0, y:0}.
 */
function buildOwlbearItem(pokemon, templateText, position = { x: 0, y: 0 }) {
    const imageNumber = pokemon.Icon || pokemon.id;
    const imageUrl = `https://sewef.github.io/ptu/img/pokemon/full/${imageNumber}.png`;
    const pokemonName = pokemon.nickname || pokemon.name;
    const uuid = generateTokenUUID();
    const W = OWLBEAR_TOKEN_SIZE;


    const filled = templateText
        .split('PLACEHOLDER_TOKEN_UUID').join(uuid)
        .split('PLACEHOLDER_TRACKER_UUID_HP').join(generateOwlTrackersUUID())
        .split('PLACEHOLDER_TRACKER_UUID_INJURIES').join(generateOwlTrackersUUID())
        .split('"PLACEHOLDER_HP_VALUE"').join(pokemon.hitPoints)
        .split('"PLACEHOLDER_HP_MAX"').join(pokemon.hitPointsMax)
        .split('PLACEHOLDER_POKEMON_NAME').join(pokemonName.replace(/"/g, '\\"'))
        .split('PLACEHOLDER_IMAGE_URL').join(imageUrl);

    const parsed = JSON.parse(filled);
    const item = parsed.items.shared[uuid];

    item.position.x = position.x;
    item.position.y = position.y;

    const scale = OWLBEAR_SIZE_SCALES[pokemon.otherInfo?.sizeCategory] || 1;
    item.scale.x = scale;
    item.scale.y = scale;

    item.image.width = W;
    item.image.height = W;
    item.grid.dpi = W;
    item.grid.offset.x = W / 2;
    item.grid.offset.y = W / 2;

    return { uuid, item };
}

/**
 * Compute the bounding box that encompasses all items in a shared object.
 */
function computeOwlbearBounds(shared) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.values(shared).forEach(item => {
        const hw = item.image.width / 2;
        const hh = item.image.height / 2;
        minX = Math.min(minX, item.position.x - hw);
        minY = Math.min(minY, item.position.y - hh);
        maxX = Math.max(maxX, item.position.x + hw);
        maxY = Math.max(maxY, item.position.y + hh);
    });
    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

async function exportPokemonOwlbear(pokemon) {
    const response = await fetch('owlbear_template.json');
    const templateText = await response.text();

    const { uuid, item } = buildOwlbearItem(pokemon, templateText);
    const shared = { [uuid]: item };

    const result = {
        items: { shared, local: {} },
        bounds: computeOwlbearBounds(shared)
    };

    const jsonStr = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(jsonStr);
    return jsonStr;
}
