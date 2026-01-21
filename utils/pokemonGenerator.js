// Pokemon Generator - Handles generating Pokemon stats and teams

const fs = require('fs');
const path = require('path');

// Base URL for external datasets
const DATASETS_BASE_URL = 'https://sewef.github.io/ptu/data/';

// Dataset definitions - includes all generations as they are complementary
const DATASETS = {
  core: {
    name: 'Core',
    pokedex: [
      'pokedex/core/pokedex_core.min.json',
      'pokedex/core/pokedex_7g.min.json',
      'pokedex/core/pokedex_8g.min.json',
      'pokedex/core/pokedex_8g_hisui.min.json'
    ],
    abilities: 'abilities/abilities_core.min.json',
    moves: 'moves/moves_core.min.json',
  },
  community: {
    name: 'Community',
    pokedex: [
      'pokedex/community/pokedex_core.min.json',
      'pokedex/community/pokedex_7g.min.json',
      'pokedex/community/pokedex_8g.min.json',
      'pokedex/community/pokedex_8g_hisui.min.json',
      'pokedex/community/pokedex_9g.min.json'
    ],
    abilities: 'abilities/abilities_9g.min.json',
    moves: 'moves/moves_9g.min.json',
  },
  homebrew: {
    name: 'Homebrew',
    pokedex: [
      'pokedex/homebrew/pokedex_core.min.json',
      'pokedex/homebrew/pokedex_7g.min.json',
      'pokedex/homebrew/pokedex_8g.min.json',
      'pokedex/homebrew/pokedex_8g_hisui.min.json',
      'pokedex/homebrew/pokedex_9g.min.json'
    ],
    abilities: 'abilities/abilities_homebrew.min.json',
    moves: 'moves/moves_homebrew.min.json',
  },
};

// Cache for loaded datasets
const dataCache = {};
let currentDataset = 'core';
let pokemonDatabase = [];
let abilitiesDatabase = {};
let movesDatabase = {};

// Create lookup objects for easier access
let pokemonByName = {};
let movesMap = {};

/**
 * Fetch data from URL
 */
async function fetchDataFromURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    throw error;
  }
}

/**
 * Load dataset from external URLs
 */
async function loadDataset(datasetKey) {
  if (!DATASETS[datasetKey]) {
    throw new Error(`Unknown dataset: ${datasetKey}`);
  }

  // Check cache
  if (dataCache[datasetKey]) {
    return dataCache[datasetKey];
  }

  console.log(`Loading ${DATASETS[datasetKey].name} dataset...`);

  const dataset = DATASETS[datasetKey];
  
  try {
    // Load all pokedex files for this dataset and merge them
    const pokedexPromises = dataset.pokedex.map(path => 
      fetchDataFromURL(DATASETS_BASE_URL + path)
    );
    const pokedexArrays = await Promise.all(pokedexPromises);
    
    // Merge all pokedex arrays, removing duplicates
    const pokedexMap = new Map();
    pokedexArrays.forEach(pokedexArray => {
      pokedexArray.forEach(pokemon => {
        // Use species name as key to avoid duplicates
        pokedexMap.set(pokemon.Species.toLowerCase(), pokemon);
      });
    });
    const mergedPokedex = Array.from(pokedexMap.values());
    
    // Load abilities and moves
    const [abilities, moves] = await Promise.all([
      fetchDataFromURL(DATASETS_BASE_URL + dataset.abilities),
      fetchDataFromURL(DATASETS_BASE_URL + dataset.moves),
    ]);

    dataCache[datasetKey] = { 
      pokedex: mergedPokedex, 
      abilities, 
      moves 
    };
    console.log(`✓ ${DATASETS[datasetKey].name} dataset loaded successfully (${mergedPokedex.length} Pokémon)`);
    return dataCache[datasetKey];
  } catch (error) {
    console.error(`Failed to load ${DATASETS[datasetKey].name} dataset:`, error);
    throw error;
  }
}

/**
 * Switch to a different dataset
 */
async function switchDataset(datasetKey) {
  if (!DATASETS[datasetKey]) {
    throw new Error(`Unknown dataset: ${datasetKey}`);
  }

  const data = await loadDataset(datasetKey);
  currentDataset = datasetKey;
  
  pokemonDatabase = data.pokedex;
  movesDatabase = data.moves;

  // Convert abilities array to object indexed by name
  if (Array.isArray(data.abilities)) {
    const abilitiesObj = {};
    data.abilities.forEach(ability => {
      if (ability.Name) {
        abilitiesObj[ability.Name] = ability;
      }
    });
    abilitiesDatabase = abilitiesObj;
  } else {
    abilitiesDatabase = data.abilities;
  }

  // Rebuild lookup objects
  pokemonByName = {};
  movesMap = {};

  pokemonDatabase.forEach(pokemon => {
    pokemonByName[pokemon.Species.toLowerCase()] = pokemon;
  });

  Object.keys(movesDatabase).forEach(moveName => {
    movesMap[moveName.toLowerCase()] = movesDatabase[moveName];
  });
}

/**
 * Initialize with default dataset (Core)
 */
async function initializeDatasets() {
  try {
    await switchDataset('core');
  } catch (error) {
    console.error('Failed to initialize datasets:', error);
    throw error;
  }
}

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
   * @param {string} options.dataset - Dataset to use: 'core', 'community', 'homebrew'. Default: 'core'
   * @param {string} options.nature - Specific nature name to use. If not specified, a random nature is chosen
   * @returns {Object} Generated Pokemon
   */
  static async generatePokemon(options = {}) {
    // Switch dataset if specified
    const dataset = (options.dataset || 'core').toLowerCase();
    if (dataset !== currentDataset) {
      await switchDataset(dataset);
    }
    let level;
    
    if (options.minLevel && options.maxLevel) {
      // Random level range
      const min = Math.max(1, parseInt(options.minLevel));
      const max = Math.min(100, parseInt(options.maxLevel));
      level = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (options.level) {
      // Specific level
      level = parseInt(options.level);
    } else {
      // Random level by default (1-50)
      level = Math.floor(Math.random() * 50) + 1;
    }
    
    level = Math.min(Math.max(level, 1), 100);
    
    const species = options.species 
      ? this.getSpeciesByName(options.species)
      : this.getRandomSpecies();

    if (!species) {
      throw new Error(`Species not found: ${options.species}`);
    }

    const nature = options.nature 
      ? this.getNatureByName(options.nature)
      : this.selectNature();
    const distribution = (options.distribution || 'RANDOM').toUpperCase();
    const ignoreBaseRelation = options.ignoreBaseRelation ? (options.ignoreBaseRelation).toUpperCase() : undefined;
    const hpFormula = options.hpFormula || 'LEVEL + (HP * 3) + 10';
    
    const stats = this.calculateStats(species['Base Stats'], level, nature, distribution, ignoreBaseRelation);
    
    // Get selected abilities with their definitions
    const abilityNames = this.selectAbilities(species, level);
    const abilitiesWithDefinitions = abilityNames.map(abilityName => {
      const definition = this.getAbilityDefinition(abilityName);
      if (!definition) {
        return { Name: abilityName };
      }
      // Ensure Name is the first property
      return {
        Name: abilityName,
        ...definition
      };
    });
    
    const pokemon = {
      id: species.Number,
      Icon: species.Icon,
      name: species.Species,
      level: level,
      types: species['Basic Information'].Type,
      abilities: abilitiesWithDefinitions,
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
  static async generateWildPokemon(level = 15, dataset = 'core') {
    return this.generatePokemon({ level: Math.max(1, Math.min(100, level)), dataset });
  }

  /**
   * Generate a team of 6 Pokemon
   */
  static async generateTeam(options = {}) {
    const team = [];
    const count = options.size || 6;
    const level = options.level || 50;
    const dataset = options.dataset || 'core';

    for (let i = 0; i < count; i++) {
      team.push(await this.generatePokemon({ level, dataset }));
    }

    return {
      pokemon: team,
      count: team.length,
      averageLevel: level,
      dataset: dataset,
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

    // Group stats by their base value (equal base stats) unless ignoring Base Relation
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
    return this.getAllNatures()[Math.floor(Math.random() * this.getAllNatures().length)];
  }

  /**
   * Get all available natures
   */
  static getAllNatures() {
    return [
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
  }

  /**
   * Get nature by name
   */
  static getNatureByName(natureName) {
    const nature = this.getAllNatures().find(n => n.name.toLowerCase() === natureName.toLowerCase());
    if (!nature) {
      throw new Error(`Nature not found: ${natureName}`);
    }
    return nature;
  }

  /**
   * Get move definition from moves database
   */
  static getMoveDefinition(moveName) {
    // Try exact match first
    if (movesDatabase[moveName]) {
      return movesDatabase[moveName];
    }
    
    // Try case-insensitive match
    const lowerName = moveName.toLowerCase();
    for (const key in movesDatabase) {
      if (key.toLowerCase() === lowerName) {
        return movesDatabase[key];
      }
    }
    
    return null;
  }

  /**
   * Get ability definition from abilities database
   */
  static getAbilityDefinition(abilityName) {
    // Try exact match first
    if (abilitiesDatabase[abilityName]) {
      return abilitiesDatabase[abilityName];
    }
    
    // Try case-insensitive match
    const lowerName = abilityName.toLowerCase();
    for (const key in abilitiesDatabase) {
      if (key.toLowerCase() === lowerName) {
        return abilitiesDatabase[key];
      }
    }
    
    return null;
  }

  /**
   * Select moves for a Pokemon based on their Level Up moveset only
   */
  static selectMovesForPokemon(species, level, count = 6) {
    const allMoves = [];
    
    // Get only level-up moves that the Pokemon can learn at this level
    if (species.Moves && species.Moves['Level Up Move List']) {
      species.Moves['Level Up Move List']
        .filter(move => move.Level <= level)
        .forEach(move => allMoves.push(move));
    }
    
    // Select random moves from level-up moves only
    const selected = [];
    if (allMoves.length === 0) {
      const tackleDefinition = this.getMoveDefinition('Tackle') || {};
      return [{
        Name: 'Tackle',
        ...tackleDefinition
      }];
    }
    
    // Sort moves by level in descending order to prefer later-learned moves
    const sortedMoves = [...allMoves].sort((a, b) => b.Level - a.Level);
    
    // Take the most recent moves up to the count, or fill with earlier moves
    for (let i = 0; i < Math.min(count, sortedMoves.length); i++) {
      const move = sortedMoves[i];
      if (!selected.some(m => m.Name === move.Move)) {
        const moveDefinition = this.getMoveDefinition(move.Move);
        if (moveDefinition) {
          // Add Name property and include move definition
          selected.push({
            Name: move.Move,
            ...moveDefinition
          });
        } else {
          selected.push({ Name: move.Move });
        }
      }
    }
    
    return selected;
  }



  /**
   * Select an item (currently disabled - returns null)
   */
  static selectItem() {
    return null;
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
  static async listAvailablePokemon(dataset = 'core') {
    if (dataset !== currentDataset) {
      await switchDataset(dataset);
    }
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

  /**
   * Get list of available datasets
   */
  static getAvailableDatasets() {
    return Object.keys(DATASETS).map(key => ({
      key: key,
      name: DATASETS[key].name
    }));
  }

  /**
   * Get current dataset
   */
  static getCurrentDataset() {
    return currentDataset;
  }

  /**
   * Switch to a different dataset
   */
  static async switchDataset(datasetKey) {
    return switchDataset(datasetKey);
  }
}

module.exports = PokemonGenerator;
module.exports.initializeDatasets = initializeDatasets;
