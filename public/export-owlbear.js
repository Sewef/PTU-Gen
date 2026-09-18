/**
 * Export utilities for Owlbear Rodeo
 * Generates a token JSON for import into Owlbear Rodeo and copies it to the clipboard
 */

const OWLBEAR_TOKEN_SIZE = 96;
const OWLBEAR_SIZE_SCALES = { 'Large': 2, 'Huge': 3, 'Gigantic': 4 };
const OWLBEAR_DEFAULT_HP_FORMULA = 'LEVEL + (HP * 3) + 10';

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

function getOwlbearFormulaStats(statsOrHp) {
    if (statsOrHp && typeof statsOrHp === 'object') {
        return {
            HP: Number(statsOrHp.HP) || 0,
            ATK: Number(statsOrHp.atk ?? statsOrHp.ATK ?? statsOrHp.Attack) || 0,
            DEF: Number(statsOrHp.def ?? statsOrHp.DEF ?? statsOrHp.Defense) || 0,
            SPA: Number(statsOrHp.spA ?? statsOrHp.SPA ?? statsOrHp['Special Attack']) || 0,
            SPD: Number(statsOrHp.spD ?? statsOrHp.SPD ?? statsOrHp['Special Defense']) || 0,
            SPE: Number(statsOrHp.spe ?? statsOrHp.SPE ?? statsOrHp.Speed) || 0
        };
    }

    return { HP: Number(statsOrHp) || 0, ATK: 0, DEF: 0, SPA: 0, SPD: 0, SPE: 0 };
}

function calculateOwlbearHPValue(level, statsOrHp, formula = OWLBEAR_DEFAULT_HP_FORMULA) {
    const parsedLevel = Number(level);
    const safeLevel = Number.isFinite(parsedLevel) ? parsedLevel : 1;
    const stats = getOwlbearFormulaStats(statsOrHp);

    try {
        const formulaText = String(formula);
        const sanitized = formulaText
            .toUpperCase()
            .replace(/[^0-9+\-*/(). LEVEL HP ATK DEF SPA SPD SPE]/g, '');

        if (sanitized !== formulaText.toUpperCase() || sanitized.length === 0) {
            throw new Error('Invalid formula');
        }

        const calcFunction = new Function('LEVEL', 'HP', 'ATK', 'DEF', 'SPA', 'SPD', 'SPE', `return ${sanitized}`);
        return Math.max(1, Math.floor(calcFunction(safeLevel, stats.HP, stats.ATK, stats.DEF, stats.SPA, stats.SPD, stats.SPE)));
    } catch (e) {
        return Math.max(1, Math.floor(safeLevel + (stats.HP * 3) + 10));
    }
}

/**
 * Fill the template for a single Pokémon and return { uuid, item }.
 * position defaults to {x:0, y:0}.
 */
function buildOwlbearItem(pokemon, templateText, position = { x: 0, y: 0 }) {
    const imageNumber = pokemon.Icon || pokemon.id;
    const imagePath = pokemon._fandex
        ? `${pokemon._fandex}/${imageNumber}`
        : imageNumber;
    const imageUrl = `https://sewef.github.io/ptu/img/pokemon/full/${imagePath}.png`;
    const pokemonName = pokemon.shiny ? `✨ ${pokemon.nickname || pokemon.name}` : pokemon.nickname || pokemon.name;
    const uuid = generateTokenUUID();
    const W = OWLBEAR_TOKEN_SIZE;
    const formulaMax = calculateOwlbearHPValue(pokemon.level, pokemon.stats, pokemon.hpFormula);
    const hpMax = Number.isFinite(Number(pokemon.hitPointsMax)) ? Number(pokemon.hitPointsMax) : formulaMax;
    const hpValue = Number.isFinite(Number(pokemon.hitPoints)) ? Number(pokemon.hitPoints) : hpMax;
    const speed = String(Number.isFinite(Number(pokemon.stats?.spe)) ? Number(pokemon.stats?.spe) : 0);

    const parsed = JSON.parse(templateText);
    const item = parsed.items.shared.PLACEHOLDER_TOKEN_UUID;

    item.id = uuid;
    item.name = pokemonName;
    item.metadata['com.owl-trackers/trackers'][0].id = generateOwlTrackersUUID();
    item.metadata['com.owl-trackers/trackers'][0].value = hpValue;
    item.metadata['com.owl-trackers/trackers'][0].max = hpMax;
    item.metadata['com.owl-trackers/trackers'][1].id = generateOwlTrackersUUID();
    item.metadata['com.pretty-initiative/metadata'].count = speed;
    item.image.url = imageUrl;
    item.text.plainText = pokemonName;
    item.visible = pokemon.owlbear?.visible !== undefined ? Boolean(pokemon.owlbear.visible) : item.visible;

    const createdUserId = String(pokemon.owlbear?.playerId || '').trim();
    if (createdUserId) {
        item.createdUserId = createdUserId;
    } else {
        delete item.createdUserId;
    }

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
