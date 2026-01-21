// Pokemon Generator - Handles generating Pokemon stats and teams

const pokemonDatabase = require('../data/pokedex_core.min.json');
const abilitiesDatabase = require('../data/abilities_core.min.json');
const movesDatabase = require('../data/moves_core.min.json');

// Create lookup objects for easier access
const pokemonByName = {};
const movesMap = {};

pokemonDatabase.forEach(pokemon => {
  pokemonByName[pokemon.Species.toLowerCase()] = pokemon;
});

// movesDatabase is an object with move names as keys
Object.keys(movesDatabase).forEach(moveName => {
  movesMap[moveName.toLowerCase()] = movesDatabase[moveName];
});

class PokemonGenerator {
  /**
   * Generate a random Pokemon with PTU 1.05 stats
   * @param {Object} options - Generation options
   * @param {number} options.level - Pokemon level (1-100)
   * @param {number} options.minLevel - Minimum level for random range
   * @param {number} options.maxLevel - Maximum level for random range
   * @param {string} options.species - Specific species to generate
   * @param {boolean} options.shiny - Force shiny
   * @param {string} options.distribution - RANDOM (default), BALANCED, or MINMAXED
   * @param {string} options.ignoreBaseRelation - 'IGNORE' (all stats) or comma-separated list (e.g., 'HP,ATK,DEF')
   * @param {string} options.hpFormula - Custom HP formula. Default: 'LEVEL + (HP * 3) + 10'
   * @returns {Object} Generated Pokemon
   */
  static generatePokemon(options = {}) {
    let level;
    
    if (options.minLevel && options.maxLevel) {
      // Plage de niveau aléatoire
      const min = Math.max(1, parseInt(options.minLevel));
      const max = Math.min(100, parseInt(options.maxLevel));
      level = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (options.level) {
      // Niveau spécifique
      level = parseInt(options.level);
    } else {
      // Niveau aléatoire par défaut (1-50)
      level = Math.floor(Math.random() * 50) + 1;
    }
    
    level = Math.min(Math.max(level, 1), 100);
    
    const species = options.species 
      ? this.getSpeciesByName(options.species)
      : this.getRandomSpecies();

    if (!species) {
      throw new Error(`Species not found: ${options.species}`);
    }

    const nature = this.selectNature();
    const distribution = (options.distribution || 'RANDOM').toUpperCase();
    const ignoreBaseRelation = options.ignoreBaseRelation ? (options.ignoreBaseRelation).toUpperCase() : undefined;
    const hpFormula = options.hpFormula || 'LEVEL + (HP * 3) + 10';
    
    const stats = this.calculateStats(species['Base Stats'], level, nature, distribution, ignoreBaseRelation);
    
    const pokemon = {
      id: species.Number,
      name: species.Species,
      level: level,
      types: species['Basic Information'].Type,
      abilities: this.selectAbilities(species, level),
      shiny: options.shiny || Math.random() < 0.0625, // 1/16 chance
      nature: nature,
      stats: stats,
      hitPoints: this.calculateHitPoints(level, stats.HP, hpFormula),
      moves: this.selectMovesForPokemon(species, level, 6),
      item: this.selectItem(),
      capabilities: species.Capabilities || []
    };

    return pokemon;
  }

  /**
   * Calculate Hit Points based on level and HP stat
   * @param {number} level - Pokemon level
   * @param {number} hpStat - Pokemon HP stat value
   * @param {string} formula - Formula string (e.g., 'LEVEL + (HP * 3) + 10')
   * @returns {number} Calculated Hit Points
   */
  static calculateHitPoints(level, hpStat, formula = 'LEVEL + (HP * 3) + 10') {
    // Replace placeholders with actual values
    let hp = formula
      .toUpperCase()
      .replace(/LEVEL/g, level)
      .replace(/HP/g, hpStat);
    
    // Safely evaluate the formula
    try {
      // Only allow basic math operations
      if (!/^[\d+\-*/(). ]+$/.test(hp)) {
        throw new Error('Invalid formula');
      }
      hp = Math.max(1, Math.floor(eval(hp)));
    } catch (e) {
      // Fallback to default formula if custom formula fails
      console.warn(`Invalid HP formula "${formula}", using default`);
      hp = Math.max(1, Math.floor(level + (hpStat * 3) + 10));
    }
    
    return hp;
  }

  /**
   * Generate a wild Pokemon at specific level
   */
  static generateWildPokemon(level = 15) {
    return this.generatePokemon({ level: Math.max(1, Math.min(100, level)) });
  }

  /**
   * Generate a team of 6 Pokemon
   */
  static generateTeam(options = {}) {
    const team = [];
    const count = options.size || 6;
    const level = options.level || 50;

    for (let i = 0; i < count; i++) {
      team.push(this.generatePokemon({ level }));
    }

    return {
      pokemon: team,
      count: team.length,
      averageLevel: level,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate stats based on base stats and level with PTU 1.05 rules
   * - Base stats from pokedex
   * - Nature: +2 or -2 to stat (except HP: +1 or -1)  
   * - Start with 10 points to distribute
   * - Gain 1 point per level to distribute
   * - Base Relation: stats égales restent égales, ordre préservé (can be ignored)
   * - Distribution mode: RANDOM, BALANCED, or MINMAXED
   * - ignoreBaseRelation: 'IGNORE' to disable Base Relation, or comma-separated stats to exclude from grouping
   */
  static calculateStats(baseStats, level, nature, distribution = 'RANDOM', ignoreBaseRelation = undefined) {
    const stats = {};
    const statNames = ['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed'];
    const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];

    // Total stat points available: 10 base + (level - 1) from leveling
    const totalPoints = 10 + (level - 1);
    
    // Calculate base stats with nature applied
    const baseWithNature = {};
    shortNames.forEach((shortName, index) => {
      const stat = statNames[index];
      const base = baseStats[stat];
      let value = base;

      if (stat === 'HP') {
        if (nature.raise === shortName) value += 1;
        if (nature.lower === shortName) value -= 1;
      } else {
        if (nature.raise === shortName) value += 2;
        if (nature.lower === shortName) value -= 2;
      }

      baseWithNature[shortName] = Math.max(1, value);
    });

    // Group stats by their base value (stats égales) unless ignoring Base Relation
    let groups;
    if (ignoreBaseRelation === 'IGNORE') {
      // Ignore Base Relation completely - each stat is its own group
      groups = Object.keys(baseWithNature).map(stat => ({
        stats: [stat],
        baseValue: baseWithNature[stat]
      }));
    } else if (ignoreBaseRelation) {
      // Ignore Base Relation for specific stats only
      const ignoreStats = ignoreBaseRelation.split(',').map(s => s.trim());
      const groupedStats = this.groupStatsByValue(baseWithNature);
      groups = groupedStats.map(group => {
        const ignoredInGroup = group.stats.filter(stat => ignoreStats.includes(stat));
        if (ignoredInGroup.length === 0) {
          // No ignored stats in this group, keep as-is
          return group;
        } else if (ignoredInGroup.length === group.stats.length) {
          // All stats in group are ignored, split into individual groups
          return ignoredInGroup.map(stat => ({
            stats: [stat],
            baseValue: baseWithNature[stat]
          }));
        } else {
          // Some stats ignored, split group
          const keptStats = group.stats.filter(stat => !ignoreStats.includes(stat));
          return [
            { stats: keptStats, baseValue: baseWithNature[keptStats[0]] },
            ...ignoredInGroup.map(stat => ({
              stats: [stat],
              baseValue: baseWithNature[stat]
            }))
          ];
        }
      }).flat();
    } else {
      // Normal Base Relation grouping
      groups = this.groupStatsByValue(baseWithNature);
    }

    // Distribute points based on distribution mode
    let distributedPoints;
    if (distribution === 'BALANCED') {
      distributedPoints = this.distributePointsBalanced(totalPoints, groups);
    } else if (distribution === 'MINMAXED') {
      distributedPoints = this.distributePointsMinMaxed(totalPoints, baseWithNature, groups);
    } else {
      // RANDOM (default)
      distributedPoints = this.distributePointsRespectingGroups(totalPoints, baseWithNature, groups);
    }

    // Calculate final stats
    shortNames.forEach((shortName) => {
      stats[shortName] = baseWithNature[shortName] + distributedPoints[shortName];
    });

    return stats;
  }

  /**
   * Group stats that have the same base value
   */
  static groupStatsByValue(baseWithNature) {
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

  /**
   * Distribute points ensuring stats in the same group stay equal (RANDOM mode)
   */
  static distributePointsRespectingGroups(totalPoints, baseWithNature, groups) {
    const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];
    const distributedPoints = {};
    shortNames.forEach(s => distributedPoints[s] = 0);

    // Distribute points by randomly adding to groups
    for (let i = 0; i < totalPoints; i++) {
      const groupIndex = Math.floor(Math.random() * groups.length);
      const group = groups[groupIndex];

      // Add one point to each stat in the group
      group.stats.forEach(stat => {
        distributedPoints[stat]++;
      });
    }

    return distributedPoints;
  }

  /**
   * Distribute points equally across all groups (BALANCED mode)
   * Each group gets equal points, remainder distributed randomly
   */
  static distributePointsBalanced(totalPoints, groups) {
    const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];
    const distributedPoints = {};
    shortNames.forEach(s => distributedPoints[s] = 0);

    // Calculate points per group and remainder
    const pointsPerGroup = Math.floor(totalPoints / groups.length);
    const remainder = totalPoints % groups.length;

    // Distribute equal points to each group
    groups.forEach((group, index) => {
      let groupPoints = pointsPerGroup;
      
      // Distribute remainder randomly to groups
      if (index < remainder) {
        groupPoints++;
      }

      // Add points to each stat in the group
      group.stats.forEach(stat => {
        distributedPoints[stat] = groupPoints;
      });
    });

    return distributedPoints;
  }

  /**
   * Distribute points to extremes (MINMAXED mode)
   * Highest base stats get more points, lowest get fewer
   * Respects Base Relation: equal stats stay equal
   */
  static distributePointsMinMaxed(totalPoints, baseWithNature, groups) {
    const shortNames = ['HP', 'atk', 'def', 'spA', 'spD', 'spe'];
    const distributedPoints = {};
    shortNames.forEach(s => distributedPoints[s] = 0);

    // Distribute points progressively: more to higher groups, fewer to lower
    let pointsRemaining = totalPoints;
    const groupDistribution = [];

    // Calculate distribution: higher base value groups get more priority
    for (let i = 0; i < groups.length; i++) {
      const weight = groups.length - i; // Higher groups get higher weight
      groupDistribution.push(weight);
    }

    // Total weight
    const totalWeight = groupDistribution.reduce((a, b) => a + b, 0);

    // Distribute points proportionally
    groups.forEach((group, index) => {
      const groupWeight = groupDistribution[index];
      const groupPoints = Math.round((groupWeight / totalWeight) * totalPoints);

      group.stats.forEach(stat => {
        distributedPoints[stat] = groupPoints;
      });
    });

    return distributedPoints;
  }

  /**
   * Select abilities for a Pokemon based on its level
   * Level 1: 1 Basic Ability
   * Level 20+: Add 1 random from Basic/Advanced abilities
   * Level 40+: Add 1 random from any abilities
   */
  static selectAbilities(species, level) {
    const basicInfo = species['Basic Information'];
    const abilities = [];

    // Level 1: Basic Ability
    const basicAbilities = [];
    if (basicInfo['Basic Ability 1']) basicAbilities.push(basicInfo['Basic Ability 1']);
    if (basicInfo['Basic Ability 2']) basicAbilities.push(basicInfo['Basic Ability 2']);

    if (basicAbilities.length > 0) {
      abilities.push(basicAbilities[Math.floor(Math.random() * basicAbilities.length)]);
    }

    // Level 20+: Add random from Basic + Advanced
    if (level >= 20) {
      const basicAdvAbilities = [...basicAbilities];
      if (basicInfo['Adv Ability 1']) basicAdvAbilities.push(basicInfo['Adv Ability 1']);
      if (basicInfo['Adv Ability 2']) basicAdvAbilities.push(basicInfo['Adv Ability 2']);

      // Remove already selected ability
      const available = basicAdvAbilities.filter(a => !abilities.includes(a));
      if (available.length > 0) {
        abilities.push(available[Math.floor(Math.random() * available.length)]);
      }
    }

    // Level 40+: Add random from all abilities
    if (level >= 40) {
      const allAbilities = [];
      if (basicInfo['Basic Ability 1']) allAbilities.push(basicInfo['Basic Ability 1']);
      if (basicInfo['Basic Ability 2']) allAbilities.push(basicInfo['Basic Ability 2']);
      if (basicInfo['Adv Ability 1']) allAbilities.push(basicInfo['Adv Ability 1']);
      if (basicInfo['Adv Ability 2']) allAbilities.push(basicInfo['Adv Ability 2']);
      if (basicInfo['High Ability']) allAbilities.push(basicInfo['High Ability']);

      // Remove already selected abilities
      const available = allAbilities.filter(a => !abilities.includes(a));
      if (available.length > 0) {
        abilities.push(available[Math.floor(Math.random() * available.length)]);
      }
    }

    return abilities;
  }

  /**
   * Select a random nature with stat modifiers
   */
  static selectNature() {
    const natures = [
      { name: 'Cuddly', raise: 'HP', lower: 'atk' },
      { name: 'Distracted', raise: 'HP', lower: 'def' },
      { name: 'Proud', raise: 'HP', lower: 'spA' },
      { name: 'Decisive', raise: 'HP', lower: 'spD' },
      { name: 'Patient', raise: 'HP', lower: 'spe' },
      { name: 'Desperate', raise: 'atk', lower: 'HP' },
      { name: 'Lonely', raise: 'atk', lower: 'def' },
      { name: 'Adamant', raise: 'atk', lower: 'spA' },
      { name: 'Naughty', raise: 'atk', lower: 'spD' },
      { name: 'Brave', raise: 'atk', lower: 'spe' },
      { name: 'Stark', raise: 'def', lower: 'HP' },
      { name: 'Bold', raise: 'def', lower: 'atk' },
      { name: 'Impish', raise: 'def', lower: 'spA' },
      { name: 'Lax', raise: 'def', lower: 'spD' },
      { name: 'Relaxed', raise: 'def', lower: 'spe' },
      { name: 'Curious', raise: 'spA', lower: 'HP' },
      { name: 'Modest', raise: 'spA', lower: 'atk' },
      { name: 'Mild', raise: 'spA', lower: 'def' },
      { name: 'Rash', raise: 'spA', lower: 'spD' },
      { name: 'Quiet', raise: 'spA', lower: 'spe' },
      { name: 'Dreamy', raise: 'spD', lower: 'HP' },
      { name: 'Calm', raise: 'spD', lower: 'atk' },
      { name: 'Gentle', raise: 'spD', lower: 'def' },
      { name: 'Careful', raise: 'spD', lower: 'spA' },
      { name: 'Sassy', raise: 'spD', lower: 'spe' },
      { name: 'Skittish', raise: 'spe', lower: 'HP' },
      { name: 'Timid', raise: 'spe', lower: 'atk' },
      { name: 'Hasty', raise: 'spe', lower: 'def' },
      { name: 'Jolly', raise: 'spe', lower: 'spA' },
      { name: 'Naive', raise: 'spe', lower: 'spD' },
      { name: 'Composed', raise: 'HP', lower: 'HP' },
      { name: 'Hardy', raise: 'atk', lower: 'atk' },
      { name: 'Docile', raise: 'def', lower: 'def' },
      { name: 'Bashful', raise: 'spA', lower: 'spA' },
      { name: 'Quirky', raise: 'spD', lower: 'spD' },
      { name: 'Serious', raise: 'spe', lower: 'spe' }
    ];
    
    return natures[Math.floor(Math.random() * natures.length)];
  }

  /**
   * Select 6 random moves for a Pokemon based on their moveset
   */
  static selectMovesForPokemon(species, level, count = 6) {
    const allMoves = [];
    
    // Get level-up moves that the Pokemon can learn at this level
    if (species.Moves && species.Moves['Level Up Move List']) {
      species.Moves['Level Up Move List']
        .filter(move => move.Level <= level)
        .forEach(move => allMoves.push(move));
    }
    
    // Add TM/HM moves
    if (species.Moves && species.Moves['TM/HM Move List']) {
      allMoves.push(...species.Moves['TM/HM Move List']);
    }
    
    // Add Tutor moves
    if (species.Moves && species.Moves['Tutor Move List']) {
      allMoves.push(...species.Moves['Tutor Move List']);
    }
    
    // Select random moves
    const selected = [];
    if (allMoves.length === 0) {
      return [{ Move: 'Tackle', Type: 'Normal' }];
    }
    
    for (let i = 0; i < Math.min(count, allMoves.length); i++) {
      const moveIndex = Math.floor(Math.random() * allMoves.length);
      const move = allMoves[moveIndex];
      if (!selected.some(m => m.Move === move.Move)) {
        selected.push({
          name: move.Move,
          type: move.Type,
          method: move.Method || 'Level Up'
        });
      }
    }
    
    return selected;
  }



  /**
   * Select a random item
   */
  static selectItem() {
    const items = [
      'Assaultvest', 'Choice Band', 'Choice Scarf', 'Choice Specs',
      'Leftovers', 'Life Orb', 'Assault Vest', 'Eviolite',
      'Weakness Policy', 'Sitrus Berry', 'Lum Berry', 'Cheri Berry',
      'Air Balloon', 'Focus Sash', 'Nasty Plot', 'Dragon Dance'
    ];
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Get species by name from database
   */
  static getSpeciesByName(name) {
    return pokemonByName[name.toLowerCase()];
  }

  /**
   * Get random species from database
   */
  static getRandomSpecies() {
    return pokemonDatabase[Math.floor(Math.random() * pokemonDatabase.length)];
  }

  /**
   * List available Pokemon
   */
  static listAvailablePokemon() {
    return pokemonDatabase.map(species => ({
      id: species.Number,
      name: species.Species,
      types: species['Basic Information'].Type,
      abilities: {
        basic1: species['Basic Information']['Basic Ability 1'],
        basic2: species['Basic Information']['Basic Ability 2'],
        adv1: species['Basic Information']['Adv Ability 1'],
        adv2: species['Basic Information']['Adv Ability 2'],
        high: species['Basic Information']['High Ability']
      }
    }));
  }
}

module.exports = PokemonGenerator;
