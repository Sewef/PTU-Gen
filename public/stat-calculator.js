// PTU Stat Calculation Utilities - shared between server (Node.js) and client (browser).
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

function getBaseStatsWithNature(baseStats, nature) {
    const baseWithNature = {};

    STAT_SHORT_NAMES.forEach(statName => {
        const raw = baseStats?.[BASE_STATS_KEY_MAP[statName]] || 0;
        baseWithNature[statName] = Math.max(1, raw + getNatureModifier(statName, nature));
    });

    return baseWithNature;
}

function groupStatsByValue(baseWithNature) {
    const groups = [];
    const processed = new Set();

    Object.entries(baseWithNature).forEach(([stat, value]) => {
        if (processed.has(stat)) return;

        const group = [stat];
        processed.add(stat);

        Object.entries(baseWithNature).forEach(([otherStat, otherValue]) => {
            if (otherStat !== stat && !processed.has(otherStat) && value === otherValue) {
                group.push(otherStat);
                processed.add(otherStat);
            }
        });

        groups.push({ stats: group, baseValue: value });
    });

    return groups.sort((a, b) => b.baseValue - a.baseValue);
}

function normalizeIgnoreBaseRelation(ignoreBaseRelation) {
    if (ignoreBaseRelation === undefined || ignoreBaseRelation === null) {
        return undefined;
    }

    const rawValue = String(ignoreBaseRelation).trim();
    if (!rawValue) {
        return undefined;
    }

    if (rawValue.toUpperCase() === 'IGNORE') {
        return 'IGNORE';
    }

    const statAliases = {
        HP: 'HP',
        H: 'HP',
        ATK: 'atk',
        ATTACK: 'atk',
        DEF: 'def',
        DEFENSE: 'def',
        SPA: 'spA',
        SPATK: 'spA',
        SPECIALATTACK: 'spA',
        SPD: 'spD',
        SPDEF: 'spD',
        SPECIALDEFENSE: 'spD',
        SPE: 'spe',
        SPEED: 'spe'
    };

    const normalizedStats = rawValue
        .split(',')
        .map(stat => stat.trim())
        .filter(Boolean)
        .map(stat => statAliases[stat.replace(/[\s._-]+/g, '').toUpperCase()] || stat)
        .filter((stat, index, stats) => stats.indexOf(stat) === index);

    return normalizedStats.length > 0 ? normalizedStats.join(',') : undefined;
}

function getStatGroups(baseWithNature, ignoreBaseRelation) {
    const normalizedIgnoreBaseRelation = normalizeIgnoreBaseRelation(ignoreBaseRelation);

    if (normalizedIgnoreBaseRelation === 'IGNORE') {
        return STAT_SHORT_NAMES.map(stat => ({
            stats: [stat],
            baseValue: baseWithNature[stat]
        }));
    }

    if (!normalizedIgnoreBaseRelation) {
        return groupStatsByValue(baseWithNature);
    }

    const ignoredStats = normalizedIgnoreBaseRelation.split(',').map(stat => stat.trim());
    const groupedStats = groupStatsByValue(baseWithNature);

    return groupedStats.flatMap(group => {
        const ignoredInGroup = group.stats.filter(stat => ignoredStats.includes(stat));

        if (ignoredInGroup.length === 0) {
            return [group];
        }

        if (ignoredInGroup.length === group.stats.length) {
            return ignoredInGroup.map(stat => ({
                stats: [stat],
                baseValue: baseWithNature[stat]
            }));
        }

        const keptStats = group.stats.filter(stat => !ignoredStats.includes(stat));
        return [
            { stats: keptStats, baseValue: baseWithNature[keptStats[0]] },
            ...ignoredInGroup.map(stat => ({
                stats: [stat],
                baseValue: baseWithNature[stat]
            }))
        ];
    });
}

function initDistributedPoints() {
    const distributedPoints = {};

    STAT_SHORT_NAMES.forEach(stat => {
        distributedPoints[stat] = 0;
    });

    return distributedPoints;
}

function getSortedRelationGroups(groups) {
    return [...groups].sort((a, b) => b.baseValue - a.baseValue);
}

function buildStatToGroupMap(groups) {
    const statToGroup = {};

    groups.forEach(group => {
        group.stats.forEach(stat => {
            statToGroup[stat] = group;
        });
    });

    return statToGroup;
}

function getGroupDistributedPoints(distributedPoints, group) {
    return group.stats.reduce((sum, stat) => sum + (distributedPoints[stat] || 0), 0);
}

function getGroupFinalValues(distributedPoints, group) {
    return group.stats.map(stat => group.baseValue + (distributedPoints[stat] || 0));
}

function wouldKeepBaseRelation(distributedPoints, statToIncrement, relationGroups, enforceBaseRelation = true) {
    if (!enforceBaseRelation) {
        return true;
    }

    const nextPoints = {
        ...distributedPoints,
        [statToIncrement]: (distributedPoints[statToIncrement] || 0) + 1
    };

    // Equal-base stats stay as close as possible. A spread of 1 is allowed
    // because level + 10 is not always divisible by the group size.
    for (const group of relationGroups) {
        if (group.stats.length <= 1) continue;

        const finalValues = getGroupFinalValues(nextPoints, group);
        const minFinal = Math.min(...finalValues);
        const maxFinal = Math.max(...finalValues);

        if (maxFinal - minFinal > 1) {
            return false;
        }
    }

    // Preserve strict ordering between adjacent base-relation groups.
    for (let index = 0; index < relationGroups.length - 1; index++) {
        const higherGroup = relationGroups[index];
        const lowerGroup = relationGroups[index + 1];

        if (higherGroup.baseValue === lowerGroup.baseValue) {
            continue;
        }

        const higherFinalMin = Math.min(...getGroupFinalValues(nextPoints, higherGroup));
        const lowerFinalMax = Math.max(...getGroupFinalValues(nextPoints, lowerGroup));

        if (higherFinalMin <= lowerFinalMax) {
            return false;
        }
    }

    return true;
}

function getValidDistributionCandidates(distributedPoints, groups, enforceBaseRelation = true) {
    const relationGroups = getSortedRelationGroups(groups);

    return relationGroups
        .flatMap(group => group.stats)
        .filter(stat => wouldKeepBaseRelation(distributedPoints, stat, relationGroups, enforceBaseRelation));
}

function distributePointsWithBaseRelation(totalPoints, groups, distribution = 'RANDOM', enforceBaseRelation = true) {
    const normalizedDistribution = ['BALANCED', 'MINMAXED'].includes(distribution)
        ? distribution
        : 'RANDOM';
    const sortedGroups = getSortedRelationGroups(groups);
    const statToGroup = buildStatToGroupMap(sortedGroups);
    const distributedPoints = initDistributedPoints();
    const totalWeight = sortedGroups.reduce((sum, group) => sum + Math.max(1, group.baseValue), 0);

    for (let pointIndex = 0; pointIndex < totalPoints; pointIndex++) {
        const candidates = getValidDistributionCandidates(distributedPoints, sortedGroups, enforceBaseRelation);

        if (candidates.length === 0) {
            console.warn('No valid stat candidate while preserving Base Relation; distribution stopped early.');
            break;
        }

        let selectedStat;

        if (normalizedDistribution === 'RANDOM') {
            selectedStat = candidates[Math.floor(Math.random() * candidates.length)];
        } else if (normalizedDistribution === 'MINMAXED') {
            selectedStat = [...candidates].sort((a, b) => {
                const groupA = statToGroup[a];
                const groupB = statToGroup[b];
                const targetA = (Math.max(1, groupA.baseValue) / totalWeight) * (pointIndex + 1);
                const targetB = (Math.max(1, groupB.baseValue) / totalWeight) * (pointIndex + 1);
                const deficitA = targetA - getGroupDistributedPoints(distributedPoints, groupA);
                const deficitB = targetB - getGroupDistributedPoints(distributedPoints, groupB);

                return (deficitB - deficitA)
                    || (groupB.baseValue - groupA.baseValue)
                    || ((distributedPoints[a] || 0) - (distributedPoints[b] || 0))
                    || (STAT_SHORT_NAMES.indexOf(a) - STAT_SHORT_NAMES.indexOf(b));
            })[0];
        } else {
            selectedStat = [...candidates].sort((a, b) => {
                const groupA = statToGroup[a];
                const groupB = statToGroup[b];
                const finalA = groupA.baseValue + (distributedPoints[a] || 0);
                const finalB = groupB.baseValue + (distributedPoints[b] || 0);

                return ((distributedPoints[a] || 0) - (distributedPoints[b] || 0))
                    || (finalA - finalB)
                    || (STAT_SHORT_NAMES.indexOf(a) - STAT_SHORT_NAMES.indexOf(b));
            })[0];
        }

        distributedPoints[selectedStat] = (distributedPoints[selectedStat] || 0) + 1;
    }

    return distributedPoints;
}

function distributePointsRandom(totalPoints, groups, enforceBaseRelation = true) {
    return distributePointsWithBaseRelation(totalPoints, groups, 'RANDOM', enforceBaseRelation);
}

function distributePointsBalanced(totalPoints, groups, enforceBaseRelation = true) {
    return distributePointsWithBaseRelation(totalPoints, groups, 'BALANCED', enforceBaseRelation);
}

function distributePointsMinmaxed(totalPoints, groups, enforceBaseRelation = true) {
    return distributePointsWithBaseRelation(totalPoints, groups, 'MINMAXED', enforceBaseRelation);
}

function getDistributedPoints(baseStats, level, nature, distribution = 'RANDOM', ignoreBaseRelation = undefined) {
    const normalizedIgnoreBaseRelation = normalizeIgnoreBaseRelation(ignoreBaseRelation);
    const baseWithNature = getBaseStatsWithNature(baseStats, nature);
    const groups = getStatGroups(baseWithNature, normalizedIgnoreBaseRelation);
    const normalizedDistribution = ['BALANCED', 'MINMAXED'].includes(distribution)
        ? distribution
        : 'RANDOM';

    return {
        baseWithNature,
        groups,
        distributedPoints: distributePointsWithBaseRelation(
            level + 10,
            groups,
            normalizedDistribution,
            normalizedIgnoreBaseRelation !== 'IGNORE'
        ),
        distribution: normalizedDistribution,
        ignoreBaseRelation: normalizedIgnoreBaseRelation
    };
}

function calculateStats(baseStats, level, nature, distribution = 'RANDOM', ignoreBaseRelation = undefined) {
    const stats = {};
    const { baseWithNature, distributedPoints } = getDistributedPoints(
        baseStats,
        level,
        nature,
        distribution,
        ignoreBaseRelation
    );

    STAT_SHORT_NAMES.forEach(shortName => {
        stats[shortName] = baseWithNature[shortName] + (distributedPoints[shortName] || 0);
    });

    return stats;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STAT_SHORT_NAMES,
        BASE_STATS_KEY_MAP,
        getNatureModifier,
        getBaseStatsWithNature,
        groupStatsByValue,
        normalizeIgnoreBaseRelation,
        getStatGroups,
        initDistributedPoints,
        getSortedRelationGroups,
        buildStatToGroupMap,
        getGroupDistributedPoints,
        getGroupFinalValues,
        wouldKeepBaseRelation,
        getValidDistributionCandidates,
        distributePointsWithBaseRelation,
        distributePointsRandom,
        distributePointsBalanced,
        distributePointsMinmaxed,
        getDistributedPoints,
        calculateStats
    };
}
