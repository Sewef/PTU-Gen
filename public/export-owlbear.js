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
 * Build a single Owlbear token and return { uuid, item }.
 * position defaults to {x:0, y:0}.
 */
function buildOwlbearItem(pokemon, position = { x: 0, y: 0 }) {
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
    const scale = OWLBEAR_SIZE_SCALES[pokemon.otherInfo?.sizeCategory] || 1;
    const visible = pokemon.owlbear?.visible !== undefined ? Boolean(pokemon.owlbear.visible) : true;
    const createdUserId = String(pokemon.owlbear?.playerId || '').trim();

    const item = {
        type: 'IMAGE',
        id: uuid,
        name: pokemonName,
        position: {
            x: Number(position.x) || 0,
            y: Number(position.y) || 0
        },
        rotation: 0,
        scale: { x: scale, y: scale },
        visible,
        locked: false,
        metadata: {
            'com.owl-trackers/trackers': [
                {
                    id: generateOwlTrackersUUID(),
                    variant: 'value-max',
                    color: 2,
                    value: hpValue,
                    max: hpMax,
                    name: 'HP'
                },
                {
                    id: generateOwlTrackersUUID(),
                    variant: 'counter',
                    color: 2,
                    inlineMath: true,
                    value: 0,
                    name: 'Injuries'
                }
            ],
            'com.owl-trackers/hidden': true,
            'com.pretty-initiative/metadata': {
                count: speed,
                active: false,
                group: 1
            }
        },
        image: {
            width: W,
            height: W,
            mime: 'image/png',
            url: imageUrl
        },
        grid: {
            dpi: W,
            offset: { x: W / 2, y: W / 2 }
        },
        text: {
            richText: [{ type: 'paragraph', children: [{ text: '' }] }],
            plainText: pokemonName,
            style: {
                padding: 8,
                fontFamily: 'Roboto',
                fontSize: 24,
                fontWeight: 400,
                textAlign: 'CENTER',
                textAlignVertical: 'BOTTOM',
                fillColor: '#ffffff',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeOpacity: 1,
                strokeWidth: 0,
                lineHeight: 1.5
            },
            type: 'PLAIN',
            width: 'AUTO',
            height: 'AUTO'
        },
        textItemType: 'LABEL',
        layer: 'CHARACTER'
    };

    if (createdUserId) item.createdUserId = createdUserId;

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
    const { uuid, item } = buildOwlbearItem(pokemon);
    const shared = { [uuid]: item };

    const result = {
        items: { shared, local: {} },
        bounds: computeOwlbearBounds(shared)
    };

    const jsonStr = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(jsonStr);
    return jsonStr;
}
