/**
 * Export utilities for Owlbear Rodeo
 * Generates a token JSON for import into Owlbear Rodeo and copies it to the clipboard
 */

const OWLBEAR_TOKEN_SIZE = 96;
const OWLBEAR_SIZE_SCALES = { 'Large': 2, 'Huge': 3, 'Gigantic': 4 };
const OWLBEAR_DEFAULT_HP_FORMULA = 'LEVEL + (HP * 3) + 10';

function getOwlbearImageMime(url) {
    const extension = String(url || '').split(/[?#]/, 1)[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
    if (extension === 'webp') return 'image/webp';
    if (extension === 'gif') return 'image/gif';
    if (extension === 'svg') return 'image/svg+xml';
    return 'image/png';
}

function loadOwlbearImageMetadata(url) {
    const fallback = { width: OWLBEAR_TOKEN_SIZE, height: OWLBEAR_TOKEN_SIZE, mime: getOwlbearImageMime(url) };
    if (typeof Image === 'undefined') return Promise.resolve(fallback);

    return new Promise(resolve => {
        const image = new Image();
        let settled = false;
        const finish = metadata => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            resolve(metadata);
        };
        const timeout = setTimeout(() => finish(fallback), 8000);
        image.onload = () => finish({
            width: Math.max(1, image.naturalWidth || image.width || fallback.width),
            height: Math.max(1, image.naturalHeight || image.height || fallback.height),
            mime: getOwlbearImageMime(url)
        });
        image.onerror = () => finish(fallback);
        image.src = url;
    });
}

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
function buildOwlbearItem(pokemon, position = { x: 0, y: 0 }, imageMetadata = {}) {
    const imageNumber = pokemon.activeBattleOnlyFormIcon || pokemon.Icon || pokemon.id;
    const imagePath = pokemon._fandex
        ? `${pokemon._fandex}/${imageNumber}`
        : imageNumber;
    const imageUrl = !pokemon.activeBattleOnlyFormIcon && String(pokemon.image || '').trim()
        ? String(pokemon.image).trim()
        : `https://sewef.github.io/ptu/img/pokemon/full/${imagePath}.png`;
    const pokemonName = (pokemon.shiny ? '✨ ' : '') + (String(pokemon.nickname || '').trim() || pokemon.name);
    const uuid = generateTokenUUID();
    const imageWidth = Math.max(1, Number(imageMetadata.width) || OWLBEAR_TOKEN_SIZE);
    const imageHeight = Math.max(1, Number(imageMetadata.height) || OWLBEAR_TOKEN_SIZE);
    const imageMime = String(imageMetadata.mime || getOwlbearImageMime(imageUrl));
    const gridDpi = Math.max(imageWidth, imageHeight);
    const formulaMax = calculateOwlbearHPValue(pokemon.level, pokemon.stats, pokemon.hpFormula);
    const hpMax = Number.isFinite(Number(pokemon.hitPointsMax)) ? Number(pokemon.hitPointsMax) : formulaMax;
    const hpValue = Number.isFinite(Number(pokemon.hitPoints)) ? Number(pokemon.hitPoints) : hpMax;
    const speed = String(Number.isFinite(Number(pokemon.stats?.spe)) ? Number(pokemon.stats?.spe) : 0);
    const scale = OWLBEAR_SIZE_SCALES[pokemon.otherInfo?.sizeCategory] || 1;
    const visible = pokemon.owlbear?.visible !== undefined ? Boolean(pokemon.owlbear.visible) : true;
    const createdUserId = String(pokemon.owlbear?.playerId || '').trim();
    const metadata = {};

    if (String(pokemon.owlbear?.initiative || 'none').toLowerCase() === 'prettysordid') {
        metadata['com.pretty-initiative/metadata'] = {
            count: speed,
            active: false,
            group: 1
        };
    }

    if (String(pokemon.owlbear?.trackers || 'none').toLowerCase() === 'owltrackers') {
        metadata['com.owl-trackers/trackers'] = [
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
                value: Math.max(0, Math.trunc(Number(pokemon.captureState?.standardCounts?.injuries) || 0)),
                name: 'Injuries'
            }
        ];
        metadata['com.owl-trackers/hidden'] = true;
    }

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
        metadata,
        image: {
            width: imageWidth,
            height: imageHeight,
            mime: imageMime,
            url: imageUrl
        },
        grid: {
            dpi: gridDpi,
            offset: { x: imageWidth / 2, y: imageHeight / 2 }
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

async function buildOwlbearItemWithImage(pokemon, position = { x: 0, y: 0 }) {
    const imageNumber = pokemon.activeBattleOnlyFormIcon || pokemon.Icon || pokemon.id;
    const imagePath = pokemon._fandex ? `${pokemon._fandex}/${imageNumber}` : imageNumber;
    const imageUrl = !pokemon.activeBattleOnlyFormIcon && String(pokemon.image || '').trim()
        ? String(pokemon.image).trim()
        : `https://sewef.github.io/ptu/img/pokemon/full/${imagePath}.png`;
    const imageMetadata = await loadOwlbearImageMetadata(imageUrl);
    return buildOwlbearItem(pokemon, position, imageMetadata);
}

/**
 * Compute the bounding box that encompasses all items in a shared object.
 */
function computeOwlbearBounds(shared) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.values(shared).forEach(item => {
        const hw = item.image.width * Math.abs(Number(item.scale?.x) || 1) / 2;
        const hh = item.image.height * Math.abs(Number(item.scale?.y) || 1) / 2;
        minX = Math.min(minX, item.position.x - hw);
        minY = Math.min(minY, item.position.y - hh);
        maxX = Math.max(maxX, item.position.x + hw);
        maxY = Math.max(maxY, item.position.y + hh);
    });
    return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

async function exportPokemonOwlbear(pokemon) {
    const { uuid, item } = await buildOwlbearItemWithImage(pokemon);
    const shared = { [uuid]: item };

    const result = {
        items: { shared, local: {} },
        bounds: computeOwlbearBounds(shared)
    };

    const jsonStr = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(jsonStr);
    return jsonStr;
}
