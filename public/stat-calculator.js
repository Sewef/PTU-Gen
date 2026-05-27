// PTU Stat Calculation Utilities — shared between server (Node.js) and client (browser)
// In the browser these become global functions; in Node.js they are exported via module.exports.

const STAT_SHORT_NAMES = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];

const BASE_STATS_KEY_MAP = {
    HP: 'HP',
    atk: 'Attack',
    def: 'Defense',
    spA: 'Special Attack',
    spD: 'Special Defense',
    spe: 'Speed'
};

/**
 * Returns the nature modifier for a given stat.
 * Non-HP stats: +2 (raised) / -2 (lowered). HP: +1 / -1.
 * Neutral natures (raise === lower) return 0.
 */
function getNatureModifier(statName, nature) {
    if (!nature) return 0;
    if (nature.raise === nature.lower) return 0;
    if (statName === 'HP') {
        if (nature.raise === statName) return 1;
        if (nature.lower === statName) return -1;
        return 0;
    }
    if (nature.raise === statName) return 2;
    if (nature.lower === statName) return -2;
    return 0;
}

/**
 * Applies nature modifiers to raw base stats.
 * @param {Object} baseStats  — long-name keys: { HP, Attack, Defense, ... }
 * @param {Object} nature     — { name, raise, lower } using short-name keys
 * @returns {Object}          — short-name keys: { HP, atk, def, spA, spD, spe }
 */
function getBaseStatsWithNature(baseStats, nature) {
    const baseWithNature = {};
    STAT_SHORT_NAMES.forEach(statName => {
        const raw = baseStats?.[BASE_STATS_KEY_MAP[statName]] || 0;
        baseWithNature[statName] = Math.max(1, raw + getNatureModifier(statName, nature));
    });
    return baseWithNature;
}

/**
 * Groups stats that share the same baseWithNature value (Base Relation).
 * Returns groups sorted highest base value first.
 */
function groupStatsByValue(baseWithNature) {
    const groups = [];
    const processed = new Set();
    Object.entries(baseWithNature).forEach(([stat, value]) => {
        if (processed.has(stat)) return;
        const group = [stat];
        processed.add(stat);
        Object.entries(baseWithNature).forEach(([other, otherVal]) => {
            if (other !== stat && !processed.has(other) && otherVal === value) {
                group.push(other);
                processed.add(other);
            }
        });
        groups.push({ stats: group, baseValue: value });
    });
    return groups.sort((a, b) => b.baseValue - a.baseValue);
}

/**
 * Returns stat groups respecting the ignoreBaseRelation setting:
 *   - undefined / falsy  → full Base Relation grouping
 *   - 'IGNORE'           → every stat is its own group
 *   - 'atk,def,...'      → listed stats are split out of their groups
 */
function getStatGroups(baseWithNature, ignoreBaseRelation) {
    if (ignoreBaseRelation === 'IGNORE') {
        return STAT_SHORT_NAMES.map(stat => ({ stats: [stat], baseValue: baseWithNature[stat] }));
    }
    if (!ignoreBaseRelation) {
        return groupStatsByValue(baseWithNature);
    }
    const ignoredStats = ignoreBaseRelation.split(',').map(s => s.trim());
    return groupStatsByValue(baseWithNature).flatMap(group => {
        const ignored = group.stats.filter(s => ignoredStats.includes(s));
        if (ignored.length === 0) return [group];
        if (ignored.length === group.stats.length) {
            return ignored.map(stat => ({ stats: [stat], baseValue: baseWithNature[stat] }));
        }
        const kept = group.stats.filter(s => !ignoredStats.includes(s));
        return [
            { stats: kept, baseValue: baseWithNature[kept[0]] },
            ...ignored.map(stat => ({ stats: [stat], baseValue: baseWithNature[stat] }))
        ];
    });
}

/**
 * RANDOM distribution: points are allocated to groups at random.
 * All stats in the same group receive equal points (Base Relation preserved).
 */
function distributePointsRandom(totalPoints, groups) {
    const distributedPoints = {};
    STAT_SHORT_NAMES.forEach(s => { distributedPoints[s] = 0; });
    const groupPoints = new Array(groups.length).fill(0);
    for (let i = 0; i < totalPoints; i++) {
        groupPoints[Math.floor(Math.random() * groups.length)]++;
    }
    groups.forEach((group, gi) => {
        const pts = groupPoints[gi];
        if (pts === 0) return;
        const pps = Math.floor(pts / group.stats.length);
        const rem = pts % group.stats.length;
        const remIdx = new Set();
        while (remIdx.size < rem) remIdx.add(Math.floor(Math.random() * group.stats.length));
        group.stats.forEach((stat, si) => {
            distributedPoints[stat] = pps + (remIdx.has(si) ? 1 : 0);
        });
    });
    return distributedPoints;
}

/**
 * BALANCED distribution: points spread evenly across all stats,
 * then groups are equalised to maintain Base Relation.
 */
function distributePointsBalanced(totalPoints, groups) {
    const distributedPoints = {};
    const pps = Math.floor(totalPoints / 6);
    const rem = totalPoints % 6;
    STAT_SHORT_NAMES.forEach((s, i) => { distributedPoints[s] = pps + (i < rem ? 1 : 0); });
    groups.forEach(group => {
        if (group.stats.length <= 1) return;
        let total = 0;
        group.stats.forEach(s => { total += distributedPoints[s]; });
        const gPps = Math.floor(total / group.stats.length);
        const gRem = total % group.stats.length;
        group.stats.forEach((s, i) => { distributedPoints[s] = gPps + (i < gRem ? 1 : 0); });
    });
    return distributedPoints;
}

/**
 * MINMAXED distribution: higher base-value groups receive proportionally more points.
 * Base Relation is preserved within each group.
 */
function distributePointsMinmaxed(totalPoints, groups) {
    const distributedPoints = {};
    STAT_SHORT_NAMES.forEach(s => { distributedPoints[s] = 0; });
    const sorted = [...groups].sort((a, b) => b.baseValue - a.baseValue);
    const totalWeight = sorted.reduce((sum, g) => sum + g.baseValue, 0);
    let distributed = 0;
    sorted.forEach((group, i) => {
        const pts = i === sorted.length - 1
            ? totalPoints - distributed
            : Math.round((group.baseValue / totalWeight) * totalPoints);
        distributed += pts;
        const pps = Math.floor(pts / group.stats.length);
        const rem = pts % group.stats.length;
        group.stats.forEach((s, si) => { distributedPoints[s] = pps + (si < rem ? 1 : 0); });
    });
    return distributedPoints;
}

// Node.js export (the browser just uses the global functions above)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STAT_SHORT_NAMES,
        BASE_STATS_KEY_MAP,
        getNatureModifier,
        getBaseStatsWithNature,
        groupStatsByValue,
        getStatGroups,
        distributePointsRandom,
        distributePointsBalanced,
        distributePointsMinmaxed
    };
}
