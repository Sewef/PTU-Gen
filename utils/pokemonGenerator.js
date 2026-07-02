// Pokemon Generator - Handles generating Pokemon stats and teams

import '../public/stat-calculator.js';

const statCalc = globalThis.PTUStatCalc;

// Base URL for external datasets
const DATASETS_BASE_URL = 'https://sewef.github.io/ptu/data/';

// Damage Base conversion table
const DAMAGE_BASE_TABLE = {
  1: { dmg: '1d6+1', min: 2, avg: 5, max: 7 },
  2: { dmg: '1d6+3', min: 4, avg: 7, max: 9 },
  3: { dmg: '1d6+5', min: 6, avg: 9, max: 11 },
  4: { dmg: '1d8+6', min: 7, avg: 11, max: 14 },
  5: { dmg: '1d8+8', min: 9, avg: 13, max: 16 },
  6: { dmg: '2d6+8', min: 10, avg: 15, max: 20 },
  7: { dmg: '2d6+10', min: 12, avg: 17, max: 22 },
  8: { dmg: '2d8+10', min: 12, avg: 19, max: 26 },
  9: { dmg: '2d10+10', min: 12, avg: 21, max: 30 },
  10: { dmg: '3d8+10', min: 13, avg: 24, max: 34 },
  11: { dmg: '3d10+10', min: 13, avg: 27, max: 40 },
  12: { dmg: '3d12+10', min: 13, avg: 30, max: 46 },
  13: { dmg: '4d10+10', min: 14, avg: 35, max: 50 },
  14: { dmg: '4d10+15', min: 19, avg: 40, max: 55 },
  15: { dmg: '4d10+20', min: 24, avg: 45, max: 60 },
  16: { dmg: '5d10+20', min: 25, avg: 50, max: 70 },
  17: { dmg: '5d12+25', min: 30, avg: 60, max: 85 },
  18: { dmg: '6d12+25', min: 31, avg: 65, max: 97 },
  19: { dmg: '6d12+30', min: 36, avg: 70, max: 102 },
  20: { dmg: '6d12+35', min: 41, avg: 75, max: 107 },
  21: { dmg: '6d12+40', min: 46, avg: 80, max: 112 },
  22: { dmg: '6d12+45', min: 51, avg: 85, max: 117 },
  23: { dmg: '6d12+50', min: 56, avg: 90, max: 122 },
  24: { dmg: '6d12+55', min: 61, avg: 95, max: 127 },
  25: { dmg: '6d12+60', min: 66, avg: 100, max: 132 },
  26: { dmg: '7d12+65', min: 72, avg: 110, max: 149 },
  27: { dmg: '8d12+70', min: 78, avg: 120, max: 166 },
  28: { dmg: '8d12+80', min: 88, avg: 130, max: 176 }
};

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
    abilities: 'abilities/abilities_community.min.json',
    moves: 'moves/moves_community.min.json',
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

// FanDex definitions
const FANDEX_DATASETS = {
  variant: {
    name: 'Variant',
    pokedex: 'pokedex/fandex/pokedex_variant.min.json'
  },
  insurgence: {
    name: 'Insurgence',
    pokedex: 'pokedex/fandex/pokedex_insurgence.min.json',
    abilities: 'abilities/fandex/abilities_insurgence.min.json',
    moves: 'moves/fandex/moves_insurgence.min.json',
    capabilities: 'capabilities/fandex/capabilities_insurgence.min.json'
  },
  sage: {
    name: 'Sage',
    pokedex: 'pokedex/fandex/pokedex_sage.min.json',
    abilities: 'abilities/fandex/abilities_sage.min.json',
    moves: 'moves/fandex/moves_sage.min.json',
    capabilities: 'capabilities/fandex/capabilities_sage.min.json'
  },
  uranium: {
    name: 'Uranium',
    pokedex: 'pokedex/fandex/pokedex_uranium.min.json',
    abilities: 'abilities/fandex/abilities_uranium.min.json',
    moves: 'moves/fandex/moves_uranium.min.json',
    capabilities: 'capabilities/fandex/capabilities_uranium.min.json'
  },
  slimerancher: {
    name: 'Slime Rancher',
    pokedex: 'pokedex/fandex/pokedex_slimerancher.min.json'
  }
};

// Cache for loaded datasets
const dataCache = {};
let currentDataset = 'core';
let currentFandexes = [];
let pokemonDatabase = [];
let abilitiesDatabase = {};
let movesDatabase = {};

// Create lookup objects for easier access
let pokemonByName = {};
let movesMapLower = {};  // Lowercase indexed map for case-insensitive lookups
let abilitiesMapLower = {};  // Lowercase indexed map for case-insensitive lookups

// Custom data storage (will override database data when set)
let customPokemon = [];
let customAbilities = {};
let customMoves = {};

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
 * Convert Damage Base number to short format with stats
 * Input: 9 (or string "9")
 * Output: { short: "DB9", dmg: "2d10+10", min: 12, avg: 21, max: 30, stab: false }
 * @param {number|string} damageBaseNumber - The damage base number
 * @param {boolean} hasStab - Whether the move gets STAB bonus (+2 DB)
 */
function convertDamageBase(damageBaseNumber, hasStab = false) {
  if (damageBaseNumber === null || damageBaseNumber === undefined) return null;

  // Parse as number if it's a string
  let dbNumber = typeof damageBaseNumber === 'string' ? parseInt(damageBaseNumber) : damageBaseNumber;
  
  if (isNaN(dbNumber)) return null;

  // Apply STAB bonus (+2 to DB)
  if (hasStab) {
    dbNumber = Math.min(dbNumber + 2, 28); // Cap at DB28
  }

  const dbData = DAMAGE_BASE_TABLE[dbNumber];

  if (!dbData) return null;

  return {
    short: `DB${dbNumber}`,
    dmg: dbData.dmg,
    min: dbData.min,
    avg: dbData.avg,
    max: dbData.max,
    stab: hasStab
  };
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
        // Use species name + form as key to avoid duplicates (handle form variants)
        const key = pokemon.Form 
          ? `${pokemon.Species.toLowerCase()}|${pokemon.Form.toLowerCase()}`
          : pokemon.Species.toLowerCase();
        pokedexMap.set(key, pokemon);
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
 * Load FanDex dataset from external URLs
 */
async function loadFandexDataset(fandexKey) {
  if (!FANDEX_DATASETS[fandexKey]) {
    throw new Error(`Unknown FanDex: ${fandexKey}`);
  }

  // Check cache
  const cacheKey = `fandex_${fandexKey}`;
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }

  console.log(`Loading ${FANDEX_DATASETS[fandexKey].name} FanDex...`);

  const fandex = FANDEX_DATASETS[fandexKey];
  
  try {
    const promises = [];
    const promiseIndices = {
      pokedex: null,
      abilities: null,
      moves: null,
      capabilities: null
    };
    
    // Always fetch pokedex
    promiseIndices.pokedex = promises.length;
    promises.push(fetchDataFromURL(DATASETS_BASE_URL + fandex.pokedex));
    
    // Fetch abilities only if defined
    if (fandex.abilities) {
      promiseIndices.abilities = promises.length;
      promises.push(fetchDataFromURL(DATASETS_BASE_URL + fandex.abilities));
    }
    
    // Fetch moves only if defined
    if (fandex.moves) {
      promiseIndices.moves = promises.length;
      promises.push(fetchDataFromURL(DATASETS_BASE_URL + fandex.moves));
    }
    
    // Fetch capabilities only if defined
    if (fandex.capabilities) {
      promiseIndices.capabilities = promises.length;
      promises.push(fetchDataFromURL(DATASETS_BASE_URL + fandex.capabilities));
    }

    const results = await Promise.all(promises);
    const pokedex = results[promiseIndices.pokedex];
    const abilities = promiseIndices.abilities !== null ? results[promiseIndices.abilities] : {};
    const moves = promiseIndices.moves !== null ? results[promiseIndices.moves] : {};
    const capabilities = promiseIndices.capabilities !== null ? results[promiseIndices.capabilities] : {};

    dataCache[cacheKey] = { 
      pokedex: Array.isArray(pokedex) ? pokedex : Object.values(pokedex), 
      abilities, 
      moves,
      capabilities: capabilities || {}
    };
    console.log(`✓ ${FANDEX_DATASETS[fandexKey].name} FanDex loaded successfully`);
    return dataCache[cacheKey];
  } catch (error) {
    console.error(`Failed to load ${FANDEX_DATASETS[fandexKey].name} FanDex:`, error);
    throw error;
  }
}

/**
 * Switch to a different dataset and optionally apply FanDex overrides
 */
async function switchDataset(datasetKey, fandexKeys = []) {
  if (!DATASETS[datasetKey]) {
    throw new Error(`Unknown dataset: ${datasetKey}`);
  }

  // Ensure fandexKeys is an array
  if (!Array.isArray(fandexKeys)) {
    fandexKeys = typeof fandexKeys === 'string' ? fandexKeys.split(',').filter(Boolean) : [];
  }

  // Check if we already have this configuration loaded
  const fandexSuffix = fandexKeys.length > 0 ? `+${fandexKeys.sort().join(',')}` : '';
  const configKey = `${datasetKey}${fandexSuffix}`;
  
  // If current config is same AND we have pokemon in database, skip
  if (currentDataset === datasetKey && 
      currentFandexes.length === fandexKeys.length && 
      currentFandexes.every(f => fandexKeys.includes(f)) && 
      pokemonDatabase.length > 0) {
    return;
  }

  const baseData = await loadDataset(datasetKey);
  
  const fandexDataResults = await Promise.all(fandexKeys.map(key => loadFandexDataset(key)));
  
  currentDataset = datasetKey;
  currentFandexes = [...fandexKeys];
  
  // Start with base data
  pokemonDatabase = [...baseData.pokedex];
  movesDatabase = { ...baseData.moves };
  
  // Handle abilities (can be array or object)
  if (Array.isArray(baseData.abilities)) {
    const abilitiesObj = {};
    baseData.abilities.forEach(ability => {
      if (ability.Name) abilitiesObj[ability.Name] = ability;
    });
    abilitiesDatabase = abilitiesObj;
  } else {
    abilitiesDatabase = { ...baseData.abilities };
  }

  // Apply FanDex overrides/additions
  for (let fandexIndex = 0; fandexIndex < fandexDataResults.length; fandexIndex++) {
    const fandexData = fandexDataResults[fandexIndex];
    const fandexKey = fandexKeys[fandexIndex];
    // Merge Pokedex with de-dup
    const pokedexMap = new Map();
    // First, add existing pokemon to map
    pokemonDatabase.forEach(p => {
      const key = p.Form 
        ? `${p.Species.toLowerCase()}|${p.Form.toLowerCase()}`
        : p.Species.toLowerCase();
      pokedexMap.set(key, p);
    });
    
    // Then, override with fandex pokemon, tagging with the fandex source
    fandexData.pokedex.forEach(p => {
      const key = p.Form 
        ? `${p.Species.toLowerCase()}|${p.Form.toLowerCase()}`
        : p.Species.toLowerCase();
      const fandexInfo = { ...p, _fandex: fandexKey };
      pokedexMap.set(key, fandexInfo);
    });
    pokemonDatabase = Array.from(pokedexMap.values());

    // Merge Moves
    Object.assign(movesDatabase, fandexData.moves);

    // Merge Abilities
    if (Array.isArray(fandexData.abilities)) {
      fandexData.abilities.forEach(ability => {
        if (ability.Name) abilitiesDatabase[ability.Name] = ability;
      });
    } else {
      Object.assign(abilitiesDatabase, fandexData.abilities);
    }
    
    // Note: Capabilities are currently handled per-pokemon in PTU-Gen, 
    // but some fandexes might have global capability overrides.
    // For now, we rely on the pokemon data itself having the correct capabilities.
  }

  // Rebuild lookup objects
  pokemonByName = {};
  movesMapLower = {};
  abilitiesMapLower = {};

  pokemonDatabase.forEach(pokemon => {
    const speciesLower = pokemon.Species.toLowerCase();
    
    if (!pokemon.Form) {
      pokemonByName[speciesLower] = pokemon;
    }
    
    if (pokemon.Form) {
      const formKey = `${speciesLower}|${pokemon.Form.toLowerCase()}`;
      pokemonByName[formKey] = pokemon;
    }
  });

  Object.keys(movesDatabase).forEach(moveName => {
    movesMapLower[moveName.toLowerCase()] = movesDatabase[moveName];
  });
  
  Object.keys(abilitiesDatabase).forEach(abilityName => {
    if (typeof abilityName === 'string') {
      abilitiesMapLower[abilityName.toLowerCase()] = abilitiesDatabase[abilityName];
    }
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

/**
 * Extract types from a Pokemon's Type field
 * Handles both simple types (string array) and complex types (object with forme alternatives)
 * @param {any} typeField - Type field from Basic Information
 * @returns {Array} Array of type strings, or forme information if applicable
 */
function extractPokemonTypes(typeField) {
  if (!typeField) return ['Normal'];
  
  // Handle nested array with object inside (e.g., Oricorio: [{ Baille: [...], Pom Pom: [...], ... }])
  if (Array.isArray(typeField) && typeField.length > 0 && typeof typeField[0] === 'object') {
    const formeObj = typeField[0];
    const formeKeys = Object.keys(formeObj);
    
    if (formeKeys.length > 0) {
      // Pick a random forme
      const selectedForme = formeKeys[Math.floor(Math.random() * formeKeys.length)];
      return {
        isFormeVariant: true,
        formes: formeObj,
        selectedForme: selectedForme
      };
    }
  }
  
  // Handle array of simple types (normal case)
  if (Array.isArray(typeField)) {
    return typeField.filter(t => typeof t === 'string');
  }
  
  // Handle object with forme alternatives (e.g., if structured differently)
  if (typeof typeField === 'object' && !Array.isArray(typeField)) {
    const formeKeys = Object.keys(typeField);
    if (formeKeys.length > 0) {
      const selectedForme = formeKeys[Math.floor(Math.random() * formeKeys.length)];
      return {
        isFormeVariant: true,
        formes: typeField,
        selectedForme: selectedForme
      };
    }
  }
  
  return ['Normal'];
}

/**
 * Get actual type array from extracted types
 * If it's a forme variant, returns the types for the selected forme
 * @param {any} extractedTypes - Result from extractPokemonTypes
 * @returns {Array} Array of type strings
 */
function getActualTypes(extractedTypes) {
  if (!extractedTypes) return ['Normal'];
  
  if (extractedTypes.isFormeVariant) {
    const formes = extractedTypes.formes[extractedTypes.selectedForme];
    return Array.isArray(formes) ? formes : ['Normal'];
  }
  
  return Array.isArray(extractedTypes) ? extractedTypes : ['Normal'];
}

/**
 * Extract base stats from a Pokemon's Base Stats field
 * Handles both simple stats (object) and complex stats with variants (object with forme/size keys)
 * @param {any} baseStatsField - Base Stats field from species data
 * @returns {Object} Base stats object
 */
function extractBaseStats(baseStatsField) {
  if (!baseStatsField) return {};
  
  // Check if it's a simple stats object (has standard stat keys like HP, Attack, etc)
  if (baseStatsField.HP !== undefined || baseStatsField.Attack !== undefined) {
    return baseStatsField;
  }
  
  // Check if it has variants (Small, Average, Large, Super Size, etc)
  const variantKeys = Object.keys(baseStatsField).filter(key => 
    typeof baseStatsField[key] === 'object' && 
    (baseStatsField[key].HP !== undefined || baseStatsField[key].Attack !== undefined)
  );
  
  if (variantKeys.length > 0) {
    // Pick a random variant
    const selectedVariant = variantKeys[Math.floor(Math.random() * variantKeys.length)];
    return {
      isStatVariant: true,
      variants: baseStatsField,
      selectedVariant: selectedVariant,
      stats: baseStatsField[selectedVariant]
    };
  }
  
  return baseStatsField;
}

/**
 * Get actual base stats from extracted stats
 * @param {any} extractedStats - Result from extractBaseStats
 * @returns {Object} Base stats object
 */
function getActualBaseStats(extractedStats) {
  if (!extractedStats) return {};
  
  if (extractedStats.isStatVariant) {
    return extractedStats.stats || {};
  }
  
  return extractedStats;
}

class PokemonGenerator {
  /**
   * Generate a random Pokemon with PTU 1.05 stats
   * @param {Object} options - Generation options
   * @param {number} options.level - Pokemon level (1-100)
   * @param {number} options.minLevel - Minimum level for random range
   * @param {number} options.maxLevel - Maximum level for random range
   * @param {string} options.species - Specific species to generate
   * @param {string} options.type - Specific type to generate (random Pokemon of that type)
   * @param {string} options.habitat - Specific habitat to generate (random Pokemon from that habitat)
   * @param {boolean} options.shiny - Force shiny
   * @param {string} options.distribution - RANDOM (default), BALANCED, or MINMAXED
   * @param {string} options.ignoreBaseRelation - 'IGNORE' (all stats) or comma-separated list (e.g., 'HP,ATK,DEF')
   * @param {string} options.hpFormula - Custom HP formula. Default: 'LEVEL + (HP * 3) + 10'
   * @param {string} options.dataset - Dataset to use: 'core', 'community', 'homebrew'. Default: 'core'
   * @param {string|string[]} options.fandex - FanDexes to apply as overrides. Comma-separated or array.
   * @param {string} options.nature - Specific nature name to use. If not specified, a random nature is chosen
   * @returns {Object} Generated Pokemon
   */
  static async generatePokemon(options = {}) {
    // Switch dataset and apply FanDex if specified
    const dataset = (options.dataset || 'core').toLowerCase();
    const fandex = options.fandex || [];
    
    // Check if we need to switch dataset or apply different fandexes
    const fandexArray = Array.isArray(fandex) ? fandex : (typeof fandex === 'string' ? fandex.split(',').filter(Boolean) : []);
    
    if (dataset !== currentDataset || 
        fandexArray.length !== currentFandexes.length || 
        !fandexArray.every(f => currentFandexes.includes(f))) {
      await switchDataset(dataset, fandexArray);
    }
    let level;
    
    if (options.minlevel !== undefined && options.maxlevel !== undefined) {
      // Random level range - with validation
      let min = Math.max(1, parseInt(options.minlevel) || 1);
      let max = Math.min(100, parseInt(options.maxlevel) || 100);
      
      // Ensure min <= max
      if (min > max) {
        [min, max] = [max, min];
      }
      
      level = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (options.level !== undefined) {
      // Specific level - with NaN validation
      const parsed = parseInt(options.level);
      level = isNaN(parsed) ? 50 : parsed;
    } else {
      // Random level by default (1-50)
      level = Math.floor(Math.random() * 50) + 1;
    }
    
    // Ensure level is always within valid range [1, 100]
    level = Math.min(Math.max(level, 1), 100);
    
    const includeLegendaries = options.includelegendaries === 'true' || options.includelegendaries === true;
    
    let species = options.species 
      ? this.getSpeciesByName(options.species)
      : options.type 
        ? this.getRandomSpeciesByType(options.type, includeLegendaries)
        : options.habitat 
          ? this.getRandomSpeciesByHabitat(options.habitat, includeLegendaries)
          : this.getRandomSpecies(includeLegendaries);

    if (!species) {
      throw new Error(`Species not found: ${options.species}`);
    }

    // Apply random form selection if requested
    if (options.randomform === true || options.randomform === 'true') {
      const allForms = this.getAllFormsOfSpecies(species.Species);
      if (allForms.length > 1) {
        // Randomly select one of the available forms
        species = allForms[Math.floor(Math.random() * allForms.length)];
      }
    }

    // Apply forceEvolution if specified
    if (options.forceevolution === 'true' || options.forceevolution === true) {
      // Get the base form of the evolution chain if a random species was selected
      if (!options.species) {
        species = this.getBaseFormOfEvolutionChain(species);
      }
      species = this.selectEvolvedSpecies(species, level);
    }

    const nature = options.nature 
      ? this.getNatureByName(options.nature)
      : this.selectNature();
    const distribution = (options.distribution || 'RANDOM').toUpperCase();
    const ignoreBaseRelation = this.normalizeIgnoreBaseRelation(options.ignorebaserelation);
    const hpFormula = options.hpformula || 'LEVEL + (HP * 3) + 10';
    
    // Extract base stats, handling variants like Pumpkaboo (Small/Average/Large/Super Size)
    const extractedStats = extractBaseStats(species['Base Stats']);
    const baseStatsData = getActualBaseStats(extractedStats);
    const stats = this.calculateStats(baseStatsData, level, nature, distribution, ignoreBaseRelation);
    
    // Get selected abilities with their definitions
    const abilitySelections = this.selectAbilities(species, level);
    const abilitiesWithDefinitions = abilitySelections.map(abilitySelection => {
      const abilityName = typeof abilitySelection === 'string' ? abilitySelection : abilitySelection.name;
      const definition = this.getAbilityDefinition(abilityName);
      if (!definition) {
        const fallbackAbility = { name: abilityName };
        if (typeof abilitySelection === 'object') {
          fallbackAbility.sourceTier = abilitySelection.tier;
          fallbackAbility.sourceSlot = abilitySelection.label;
        }
        return fallbackAbility;
      }
      // Convert all fields to camelCase and ensure name is the first property
      const normalizedAbility = this.normalizeAbilityFields(abilityName, definition);
      if (typeof abilitySelection === 'object') {
        normalizedAbility.sourceTier = abilitySelection.tier;
        normalizedAbility.sourceSlot = abilitySelection.label;
      }
      return normalizedAbility;
    });
    
    // Extract other information
    const otherInfo = species['Other Information'] || {};
    const sizeInfo = otherInfo['Size Information'] || {};
    
    // Extract size category from height (text in parentheses)
    const heightStr = sizeInfo.Height || '';
    const heightMatch = heightStr.match(/\(([^)]+)\)/);
    const sizeCategory = heightMatch ? heightMatch[1] : 'Unknown';
    
    // Extract weight class from weight
    const weightStr = sizeInfo.Weight || '';
    const weightMatch = weightStr.match(/Weight Class (\d+)/);
    const weightClass = weightMatch ? parseInt(weightMatch[1]) : 0;
    
    // Determine gender
    const gendersStr = otherInfo.Genders || 'Unknown';
    let gender = 'Unknown';
    if (gendersStr !== 'Unknown') {
      const maleMatch = gendersStr.match(/(\d+(?:\.\d+)?)\%\s*Male/);
      const malePercent = maleMatch ? parseFloat(maleMatch[1]) : 0;
      gender = Math.random() * 100 < malePercent ? 'Male' : 'Female';
    }
    
    // Calculate baseWithNature for proper level points calculation on frontend.
    const baseWithNature = statCalc.getBaseStatsWithNature(baseStatsData, nature);
    
    // Extract types, handling forme variants like Oricorio
    const extractedTypes = extractPokemonTypes(species['Basic Information'].Type);
    const actualTypes = getActualTypes(extractedTypes);
    
    // Build display name, including Form if present
    const displayName = species.Form 
      ? `${species.Species} (${species.Form})`
      : species.Species;
    
    const hitPointsMax = this.calculateHitPoints(level, stats.HP, hpFormula);

    const pokemon = {
      id: species.Number,
      Icon: species.Icon,
      name: displayName,
      displayName: displayName,
      baseName: species.Species,
      form: species.Form || null,
      level: level,
      types: extractedTypes,
      actualTypes: actualTypes,
      abilities: abilitiesWithDefinitions,
      shiny: options.shiny === true ? true : Math.random() < ((options.shinyodds || 1) / 100), // Use custom odds or default 1%
      nature: nature,
      baseStats: {
        HP: baseStatsData?.HP || 0,
        Attack: baseStatsData?.Attack || 0,
        Defense: baseStatsData?.Defense || 0,
        'Special Attack': baseStatsData?.['Special Attack'] || 0,
        'Special Defense': baseStatsData?.['Special Defense'] || 0,
        Speed: baseStatsData?.Speed || 0
      },
      statVariant: extractedStats.isStatVariant ? { selectedVariant: extractedStats.selectedVariant } : undefined,
      baseWithNature: baseWithNature,
      stats: stats,
      hitPoints: hitPointsMax,
      hitPointsMax: hitPointsMax,
      hpFormula: hpFormula,
      ignoreBaseRelation: ignoreBaseRelation,
      moves: this.selectMovesForPokemon(species, level, 6),
      item: this.selectItem(),
      skills: species.Skills || {},
      otherInfo: {
        sizeCategory: sizeCategory,
        weightClass: weightClass,
        gender: gender,
        diet: otherInfo.Diet || 'Unknown',
        habitat: (otherInfo.Habitat || 'Unknown').split(',').map(h => h.trim()).join(', ')
      },
      capabilities: species.Capabilities || [],
      legendary: species.Legendary || false,
      _fandex: species._fandex,
      dataset: dataset,
      fandex: fandexArray,
      learnsets: {
        moveLearns: species.Moves || {},
        abilityLearns: {
          basicAbilities: [
            (species['Basic Information'] && species['Basic Information']['Basic Ability 1']) || null, 
            (species['Basic Information'] && species['Basic Information']['Basic Ability 2']) || null
          ].filter(a => a != null && a !== '').map(a => this.getAbilityLearnsetEntry(a)),
          advancedAbilities: [
            (species['Basic Information'] && species['Basic Information']['Adv Ability 1']) || null, 
            (species['Basic Information'] && species['Basic Information']['Adv Ability 2']) || null
          ].filter(a => a != null && a !== '').map(a => this.getAbilityLearnsetEntry(a)),
          highAbilities: [
            (species['Basic Information'] && species['Basic Information']['High Ability']) || null
          ].filter(a => a != null && a !== '').map(a => this.getAbilityLearnsetEntry(a))
        }
      },
      includedLegendary: includeLegendaries
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
    let hp; // Declare variable before try/catch
    
    try {
      // Safely evaluate formula using a function constructor (safer than eval)
      // Only allow basic math operations + LEVEL and HP variables
      const sanitized = formula
        .toUpperCase()
        .replace(/[^0-9+\-*/(). LEVEL HP]/g, '');
      
      if (sanitized !== formula.toUpperCase() || sanitized.length === 0) {
        throw new Error('Invalid formula');
      }
      
      // Create function with named parameters (sandboxed execution)
      const calcFunction = new Function('LEVEL', 'HP', `return ${sanitized}`);
      hp = Math.max(1, Math.floor(calcFunction(level, hpStat)));
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
    const hpFormula = options.hpformula;
    const includeLegendaries = options.includelegendaries === 'true' || options.includelegendaries === true;

    for (let i = 0; i < count; i++) {
      team.push(await this.generatePokemon({ level, dataset, hpformula: hpFormula, includelegendaries: includeLegendaries }));
    }

    return {
      pokemon: team,
      count: team.length,
      averageLevel: level,
      dataset: dataset,
      includedLegendaries: includeLegendaries,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Normalize ignoreBaseRelation so only the special value IGNORE is upper-cased.
   * Individual stat names must remain in statCalc's canonical short-name format
   * (HP, atk, def, spA, spD, spe), otherwise partial ignores like "atk,def"
   * do not match the generated stat groups.
   */
  static normalizeIgnoreBaseRelation(ignoreBaseRelation) {
    return statCalc.normalizeIgnoreBaseRelation(ignoreBaseRelation);
  }

  static getStatOrder() {
    return statCalc.STAT_SHORT_NAMES;
  }

  static initDistributedPoints() {
    return statCalc.initDistributedPoints();
  }

  static getSortedRelationGroups(groups) {
    return statCalc.getSortedRelationGroups(groups);
  }

  static buildStatToGroupMap(groups) {
    return statCalc.buildStatToGroupMap(groups);
  }

  static getGroupDistributedPoints(distributedPoints, group) {
    return statCalc.getGroupDistributedPoints(distributedPoints, group);
  }

  static getGroupFinalValues(distributedPoints, group) {
    return statCalc.getGroupFinalValues(distributedPoints, group);
  }

  static wouldKeepBaseRelation(distributedPoints, statToIncrement, relationGroups, enforceBaseRelation = true) {
    return statCalc.wouldKeepBaseRelation(distributedPoints, statToIncrement, relationGroups, enforceBaseRelation);
  }

  static getValidDistributionCandidates(distributedPoints, groups, enforceBaseRelation = true) {
    return statCalc.getValidDistributionCandidates(distributedPoints, groups, enforceBaseRelation);
  }

  static distributePointsWithBaseRelation(totalPoints, groups, distribution = 'RANDOM', enforceBaseRelation = true) {
    return statCalc.distributePointsWithBaseRelation(totalPoints, groups, distribution, enforceBaseRelation);
  }

  /**
   * Calculate stats based on base stats and level with PTU 1.05 rules
   * - Base stats from pokedex
   * - Nature: +2 or -2 to stat (except HP: +1 or -1)
   * - Start with 10 points to distribute
   * - Gain 1 point per level to distribute
   * - Base Relation: equal stats stay as even as possible, order is preserved (can be ignored)
   * - Distribution mode: RANDOM, BALANCED, or MINMAXED
   * - ignoreBaseRelation: 'IGNORE' to disable Base Relation, or comma-separated stats to exclude from grouping
   */
  static calculateStats(baseStats, level, nature, distribution = 'RANDOM', ignoreBaseRelation = undefined) {
    return statCalc.calculateStats(baseStats, level, nature, distribution, ignoreBaseRelation);
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

    // Helper function to flatten ability arrays and return all possible values
    const getAllAbilityOptions = (ability) => {
      if (Array.isArray(ability)) {
        return ability;
      }
      return [ability];
    };

    // Helper to resolve a slot to ONE ability (or null if empty)
    const resolveAbilitySlot = (slotValue) => {
      const options = getAllAbilityOptions(slotValue || []);
      if (options.length === 0) return null;
      return options[Math.floor(Math.random() * options.length)];
    };

    // Resolve each slot to ONE ability. Keep slot identity so the same ability
    // appearing in multiple slots can be selected multiple times.
    const slots = [
      { id: 'basic1', tier: 'basic', label: 'Basic Ability 1', name: resolveAbilitySlot(basicInfo['Basic Ability 1']) },
      { id: 'basic2', tier: 'basic', label: 'Basic Ability 2', name: resolveAbilitySlot(basicInfo['Basic Ability 2']) },
      { id: 'adv1', tier: 'advanced', label: 'Adv Ability 1', name: resolveAbilitySlot(basicInfo['Adv Ability 1']) },
      { id: 'adv2', tier: 'advanced', label: 'Adv Ability 2', name: resolveAbilitySlot(basicInfo['Adv Ability 2']) },
      { id: 'adv3', tier: 'advanced', label: 'Adv Ability 3', name: resolveAbilitySlot(basicInfo['Adv Ability 3']) },
      { id: 'high', tier: 'high', label: 'High Ability', name: resolveAbilitySlot(basicInfo['High Ability']) }
    ].filter(slot => slot.name !== null);
    const selectedSlotIds = new Set();

    const pickSlot = (candidateSlots) => {
      const available = candidateSlots.filter(slot => !selectedSlotIds.has(slot.id));
      if (available.length === 0) return;
      const selected = available[Math.floor(Math.random() * available.length)];
      selectedSlotIds.add(selected.id);
      abilities.push(selected);
    };

    // Level 1: Pick one from basic abilities
    pickSlot(slots.filter(slot => slot.tier === 'basic'));

    // Level 20+: Add one random from basic + advanced (not already selected slot)
    if (level >= 20) {
      pickSlot(slots.filter(slot => slot.tier === 'basic' || slot.tier === 'advanced'));
    }

    // Level 40+: Add one random from all (not already selected slot)
    if (level >= 40) {
      pickSlot(slots);
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
   * Get move definition from moves database (checks custom first)
   * Optimized with cached lowercase lookups
   */
  static getMoveDefinition(moveName) {
    if (!moveName) return null;
    // Remove trailing asterisks are just markers, not part of the move name
    const cleanName = moveName.replace(/\*+$/, '');
    const lowerName = cleanName.toLowerCase();
    
    // Check custom moves first (exact then lowercase)
    if (customMoves[cleanName]) {
      return customMoves[cleanName];
    }
    const customLower = Object.keys(customMoves).find(key => key.toLowerCase() === lowerName);
    if (customLower) {
      return customMoves[customLower];
    }
    
    // Try database (exact then lowercase indexed map)
    if (movesDatabase[cleanName]) {
      return movesDatabase[cleanName];
    }
    if (movesMapLower[lowerName]) {
      return movesMapLower[lowerName];
    }
    
    return null;
  }

  /**
   * Get ability definition from abilities database (checks custom first)
   * Optimized with cached lowercase lookups
   */
  static getAbilityDefinition(abilityName) {
    if (!abilityName) return null;
    const lowerName = abilityName.toLowerCase();
    
    // Check custom abilities first (exact then lowercase)
    if (customAbilities[abilityName]) {
      return customAbilities[abilityName];
    }
    const customLower = Object.keys(customAbilities).find(key => key.toLowerCase() === lowerName);
    if (customLower) {
      return customAbilities[customLower];
    }
    
    // Try database (exact then lowercase indexed map)
    if (abilitiesDatabase[abilityName]) {
      return abilitiesDatabase[abilityName];
    }
    if (abilitiesMapLower[lowerName]) {
      return abilitiesMapLower[lowerName];
    }
    
    return null;
  }

  /**
   * Get ability learnset entry with full details
   * Handles arrays of ability choices
   */
  static getAbilityLearnsetEntry(abilityOrArray) {
    // If it's an array of choices, get details for each
    if (Array.isArray(abilityOrArray)) {
      return abilityOrArray.map(abilityName => {
        const definition = this.getAbilityDefinition(abilityName);
        if (!definition) {
          return {
            name: abilityName,
            effect: '',
            trigger: '',
            target: '',
            frequency: 'Static'
          };
        }
        return this.normalizeAbilityFields(abilityName, definition);
      });
    }
    
    // Single ability
    const definition = this.getAbilityDefinition(abilityOrArray);
    if (!definition) {
      return {
        name: abilityOrArray,
        effect: '',
        trigger: '',
        target: '',
        frequency: 'Static'
      };
    }
    return this.normalizeAbilityFields(abilityOrArray, definition);
  }

  /**
   * Select moves for a Pokemon based on their Level Up moveset only
   * FIXED: Better handling of missing level data
   */
  static selectMovesForPokemon(species, level, count = 6) {
    const allMoves = [];
    const typeField = species['Basic Information']?.Type || [];
    const extractedTypes = extractPokemonTypes(typeField);
    const pokemonTypes = getActualTypes(extractedTypes);
    
    // Get only level-up moves that the Pokemon can learn at this level
    if (species.Moves && Array.isArray(species.Moves['Level Up Move List'])) {
      species.Moves['Level Up Move List']
        .filter(move => {
          // Handle missing or invalid level data - treat as Level 1
          const moveLevel = move.Level !== undefined ? move.Level : 1;
          return moveLevel <= level && move.Move;  // Also ensure move name exists
        })
        .forEach(move => allMoves.push(move));
    }
    
    // Select random moves from level-up moves only
    const selected = [];
    if (allMoves.length === 0) {
      const tackleDefinition = this.getMoveDefinition('Tackle') || {};
      return [{
        name: 'Tackle',
        ...this.normalizeMoveFields(tackleDefinition, 'Tackle', pokemonTypes)
      }];
    }
    
    // Sort moves by level in descending order to prefer later-learned moves
    const sortedMoves = [...allMoves].sort((a, b) => (b.Level || 0) - (a.Level || 0));
    
    // Take the most recent moves up to the count, or fill with earlier moves
    for (let i = 0; i < Math.min(count, sortedMoves.length); i++) {
      const move = sortedMoves[i];
      const cleanMoveName = move.Move.replace(/\*+$/, '');
      if (!selected.some(m => m.name === cleanMoveName)) {
        const moveDefinition = this.getMoveDefinition(move.Move);
        if (moveDefinition) {
          // Add name property and include move definition with camelCase fields
          const normalizedMove = this.normalizeMoveFields(moveDefinition, cleanMoveName, pokemonTypes);
          selected.push(normalizedMove);
        } else {
          selected.push({ name: cleanMoveName });
        }
      }
    }
    
    return selected;
  }

  /**
   * Normalize ability object fields to camelCase
   */
  static normalizeAbilityFields(abilityName, definition) {
    return {
      name: abilityName,
      frequency: definition.Frequency,
      trigger: definition.Trigger,
      effect: definition.Effect,
      bonus: definition.Bonus,
      special: definition.Special,
      note: definition.Note,
      table: definition.table || definition.Table
    };
  }

  /**
   * Normalize move object fields to camelCase
   * FIXED: Validate pokemonTypes before calling .some()
   */
  static normalizeMoveFields(moveDefinition, moveName = moveDefinition.Name, pokemonTypes = []) {
    const damageBaseRaw = moveDefinition['Damage Base'];
    const moveType = moveDefinition.Type;
    
    // Check if move type matches any of the pokemon's types for STAB
    // FIXED: Validate pokemonTypes is an array and contains strings
    let hasStab = false;
    if (Array.isArray(pokemonTypes) && pokemonTypes.length > 0) {
      hasStab = pokemonTypes.some(type => 
        typeof type === 'string' && type.toLowerCase() === moveType?.toLowerCase()
      );
    }
    
    const damageBaseConverted = damageBaseRaw ? convertDamageBase(damageBaseRaw, hasStab) : null;

    return {
      name: moveName || moveDefinition.Name,
      type: moveDefinition.Type,
      frequency: moveDefinition.Frequency,
      class: moveDefinition.Class,
      range: moveDefinition.Range,
      damageBase: damageBaseConverted,
      ac: moveDefinition.AC,
      effect: moveDefinition.Effect
    };
  }



  /**
   * Select an item (currently disabled - returns null)
   */
  static selectItem() {
    return null;
  }

  /**
   * Get species by name from database (checks custom first, then database)
   * Accepts both formats: "Species" or "Species (Form)" or "species|form"
   */
  static getSpeciesByName(name) {
    if (!name) return null;
    
    const customLower = name.toLowerCase().trim();
    
    // Check if name includes form variant with parentheses (e.g., "rotom (heat rotom)")
    if (customLower.includes('(') && customLower.includes(')')) {
      const match = customLower.match(/^([^(]+)\s*\(([^)]+)\)$/);
      if (match) {
        const baseName = match[1].trim();
        const formName = match[2].trim();
        
        // Check custom data for form variant
        const customSpecies = customPokemon.find(p => 
          p.Species.toLowerCase() === baseName && 
          p.Form && 
          p.Form.toLowerCase() === formName
        );
        if (customSpecies) {
          return customSpecies;
        }
        
        // Check database for form variant
        const key = `${baseName}|${formName}`.toLowerCase();
        if (pokemonByName[key]) {
          return pokemonByName[key];
        }
        
        // Fallback to base name if form variant not found
        const baseSpecies = customPokemon.find(p => p.Species.toLowerCase() === baseName);
        if (baseSpecies) {
          return baseSpecies;
        }
        return pokemonByName[baseName];
      }
    }
    
    // Check if name includes form variant with pipe (e.g., "palafin|zero form")
    if (customLower.includes('|')) {
      const [baseName, formName] = customLower.split('|').map(s => s.trim());
      
      // Check custom data for form variant
      const customSpecies = customPokemon.find(p => 
        p.Species.toLowerCase() === baseName && 
        p.Form && 
        p.Form.toLowerCase() === formName
      );
      if (customSpecies) {
        return customSpecies;
      }
      
      // Check database for form variant
      if (pokemonByName[customLower]) {
        return pokemonByName[customLower];
      }
      
      // Fallback to base name if form variant not found
      const baseSpecies = customPokemon.find(p => p.Species.toLowerCase() === baseName);
      if (baseSpecies) {
        return baseSpecies;
      }
      return pokemonByName[baseName];
    }
    
    // Search custom data for exact match (with or without form)
    const customSpecies = customPokemon.find(p => p.Species.toLowerCase() === customLower);
    if (customSpecies) {
      return customSpecies;
    }
    
    // Fall back to database
    return pokemonByName[customLower];
  }

  /**
   * Get all form variants of a species
   * Returns array of species including base form and all form variants
   * OPTIMIZED: Uses Set to avoid duplicate checking
   */
  static getAllFormsOfSpecies(baseName) {
    if (!baseName) return [];
    const baseLower = baseName.toLowerCase();
    const forms = [];
    const seen = new Set();  // Track already-added species to avoid dupes

    // Check custom data for this species and all its forms
    customPokemon.forEach(p => {
      if (p.Species.toLowerCase() === baseLower) {
        const key = `${p.Species}|${p.Form || ''}`;
        if (!seen.has(key)) {
          forms.push(p);
          seen.add(key);
        }
      }
    });

    // Check database for this species and all its forms
    pokemonDatabase.forEach(p => {
      if (p.Species.toLowerCase() === baseLower) {
        const key = `${p.Species}|${p.Form || ''}`;
        if (!seen.has(key)) {
          forms.push(p);
          seen.add(key);
        }
      }
    });

    return forms;
  }

  /**
   * Get random species from database (includes custom Pokemon)
   */
  static getRandomSpecies(includeLegendaries = false) {
    // Combine custom and database Pokemon
    const allPokemon = [...customPokemon, ...pokemonDatabase];
    
    let availablePokemon = allPokemon;
    if (!includeLegendaries) {
      availablePokemon = allPokemon.filter(pokemon => !pokemon.Legendary);
    }
    if (availablePokemon.length === 0) {
      throw new Error('No Pokemon available with current filters');
    }
    return availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
  }

  /**
   * Get all available habitats
   */
  static getAvailableHabitats() {
    const habitats = new Set();
    pokemonDatabase.forEach(pokemon => {
      const habitatStr = pokemon['Other Information']?.Habitat;
      if (habitatStr) {
        // Split by comma and add each habitat
        habitatStr.split(',').forEach(habitat => {
          habitats.add(habitat.trim());
        });
      }
    });
    return Array.from(habitats).sort();
  }

  /**
   * Get Pokemon by habitat (includes custom Pokemon)
   */
  static getPokemonByHabitat(habitat) {
    if (!habitat) return [];
    const habitatLower = habitat.toLowerCase();
    const allPokemon = [...customPokemon, ...pokemonDatabase];
    return allPokemon.filter(pokemon => {
      const habitatStr = pokemon['Other Information']?.Habitat || '';
      return habitatStr.toLowerCase().includes(habitatLower);
    });
  }

  /**
   * Get random Pokemon from a specific habitat
   */
  static getRandomSpeciesByHabitat(habitat, includeLegendaries = false) {
    let pokemonInHabitat = this.getPokemonByHabitat(habitat);
    if (!includeLegendaries) {
      pokemonInHabitat = pokemonInHabitat.filter(pokemon => !pokemon.Legendary);
    }
    if (pokemonInHabitat.length === 0) {
      throw new Error(`No Pokemon found in habitat: ${habitat}`);
    }
    return pokemonInHabitat[Math.floor(Math.random() * pokemonInHabitat.length)];
  }

  /**
   * Get all available types
   */
  static getAvailableTypes() {
    const types = new Set();
    pokemonDatabase.forEach(pokemon => {
      const typeField = pokemon['Basic Information']?.Type;
      if (typeField) {
        const extractedTypes = extractPokemonTypes(typeField);
        const pokemonTypes = getActualTypes(extractedTypes);
        pokemonTypes.forEach(type => {
          if (typeof type === 'string') {
            types.add(type.trim());
          }
        });
      }
    });
    return Array.from(types).sort();
  }

  /**
   * Get Pokemon by type (includes custom Pokemon)
   */
  static getPokemonByType(type) {
    if (!type) return [];
    const typeLower = type.toLowerCase();
    const allPokemon = [...customPokemon, ...pokemonDatabase];
    return allPokemon.filter(pokemon => {
      const typeField = pokemon['Basic Information']?.Type;
      if (!typeField) return false;
      
      const extractedTypes = extractPokemonTypes(typeField);
      const pokemonTypes = getActualTypes(extractedTypes);
      
      return pokemonTypes.some(t => 
        typeof t === 'string' && t.toLowerCase() === typeLower
      );
    });
  }

  /**
   * Get random Pokemon from a specific type
   */
  static getRandomSpeciesByType(type, includeLegendaries = false) {
    let pokemonOfType = this.getPokemonByType(type);
    if (!includeLegendaries) {
      pokemonOfType = pokemonOfType.filter(pokemon => !pokemon.Legendary);
    }
    if (pokemonOfType.length === 0) {
      throw new Error(`No Pokemon found with type: ${type}`);
    }
    return pokemonOfType[Math.floor(Math.random() * pokemonOfType.length)];
  }

  /**
   * Get the base form (stage 1) of a Pokemon's evolution chain
   * @param {Object} pokemon - The Pokemon species (can be any stage)
   * @returns {Object} The base form of the evolution chain
   */
  static getBaseFormOfEvolutionChain(pokemon) {
    const evolutionChain = pokemon.Evolution || [];
    
    if (evolutionChain.length === 0) {
      return pokemon;
    }
    
    // Find stage 1 (base form)
    for (let i = 0; i < evolutionChain.length; i++) {
      const evolution = evolutionChain[i];
      const stage = evolution.Stade || (i + 1);
      
      if (stage === 1) {
        const baseName = evolution.Species;
        if (baseName !== pokemon.Species) {
          return this.getSpeciesByName(baseName);
        }
        return pokemon;
      }
    }
    
    return pokemon;
  }

  /**
   * Select evolved species based on level and evolution conditions
   * @param {Object} baseSpecies - The Pokemon species (can be any stage in evolution chain)
   * @param {number} level - The level of the Pokemon
   * @returns {Object} The evolved species if applicable, otherwise the input species
   */
  static selectEvolvedSpecies(baseSpecies, level) {
    // Get the evolution chain from the species
    const evolutionChain = baseSpecies.Evolution || [];
    
    if (evolutionChain.length === 0) {
      return baseSpecies;
    }

    // Find the current stage of this Pokemon in the evolution chain
    const currentSpeciesName = baseSpecies.Species;
    let currentStage = 1; // Default to stage 1 if not found
    
    for (let i = 0; i < evolutionChain.length; i++) {
      if (evolutionChain[i].Species === currentSpeciesName) {
        currentStage = evolutionChain[i].Stade || (i + 1);
        break;
      }
    }

    // Find the highest stage the Pokemon can reach at this level, starting from current stage
    let selectedSpeciesName = currentSpeciesName;
    
    for (let i = evolutionChain.length - 1; i >= 0; i--) {
      const evolution = evolutionChain[i];
      const evolutionStage = evolution.Stade || (i + 1);
      
      // Only consider evolution stages that are >= current stage
      if (evolutionStage < currentStage) {
        continue;
      }
      
      // Check if this evolution stage can be reached at the current level
      const minLevel = evolution['Minimum Level'];
      
      // If no minimum level requirement or level meets the requirement, this stage is available
      if (!minLevel || level >= minLevel) {
        selectedSpeciesName = evolution.Species;
        break;
      }
    }
    
    // Return the selected species, or the input species if not changed
    if (selectedSpeciesName === currentSpeciesName) {
      return baseSpecies;
    }
    
    return this.getSpeciesByName(selectedSpeciesName);
  }

  /**
   * List available Pokemon (includes custom Pokemon)
   */
  static async listAvailablePokemon(dataset = 'core', fandex = []) {
    // Switch dataset and apply FanDex if specified
    const fandexArray = Array.isArray(fandex) ? fandex : (typeof fandex === 'string' ? fandex.split(',').filter(Boolean) : []);
    
    if (dataset !== currentDataset || 
        fandexArray.length !== currentFandexes.length || 
        !fandexArray.every(f => currentFandexes.includes(f))) {
      await switchDataset(dataset, fandexArray);
    }

    const allPokemon = [...customPokemon, ...pokemonDatabase];
    return allPokemon.map(species => {
      // Include Form in the display name if present
      const displayName = species.Form 
        ? `${species.Species} (${species.Form})`
        : species.Species;
      
      return {
        id: species.Number,
        name: displayName,
        baseName: species.Species,
        form: species.Form || null,
        types: species['Basic Information']?.Type,
        abilities: {
          basic1: species['Basic Information']?.['Basic Ability 1'],
          basic2: species['Basic Information']?.['Basic Ability 2'],
          adv1: species['Basic Information']?.['Adv Ability 1'],
          adv2: species['Basic Information']?.['Adv Ability 2'],
          high: species['Basic Information']?.['High Ability']
        }
      };
    });
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
   * Get all available FanDexes
   */
  static getAvailableFandexes() {
    return Object.keys(FANDEX_DATASETS).map(key => ({
      key: key,
      name: FANDEX_DATASETS[key].name
    }));
  }

  /**
   * Get current dataset
   */
  static getCurrentDataset() {
    return currentDataset;
  }

  /**
   * Get current FanDexes
   */
  static getCurrentFandexes() {
    return currentFandexes;
  }

  /**
   * Switch to a different dataset
   */
  static async switchDataset(datasetKey, fandexKeys = []) {
    return switchDataset(datasetKey, fandexKeys);
  }

  /**
   * Get available moves for a Pokemon species
   * Returns moves organized by category (levelUp, tm, tutor)
   */
  static async getAvailableMovesForSpecies(speciesName, dataset = 'core', fandex = []) {
    try {
      const fandexArray = Array.isArray(fandex) ? fandex : (typeof fandex === 'string' ? fandex.split(',').filter(Boolean) : []);
      
      if (dataset !== currentDataset || 
          fandexArray.length !== currentFandexes.length || 
          !fandexArray.every(f => currentFandexes.includes(f))) {
        await switchDataset(dataset, fandexArray);
      }

      // Use getSpeciesByName to properly handle form variants like "Rattata (Alola)"
      const species = this.getSpeciesByName(speciesName);
      if (!species) {
        throw new Error(`Pokemon species not found: ${speciesName}`);
      }

      const pokemonTypes = species['Basic Information']?.Type || [];

      const result = {
        levelUp: [],
        tm: [],
        tutor: []
      };

      // Check if moves data is in the new format (9G) or old format (Core)
      if (species.Moves) {
        const movesData = species.Moves;

        // Handle new 9G format (moves as strings in "Level Up Move List" and "TM/Tutor Moves List")
        if (typeof movesData['Level Up Move List'] === 'string') {
          // 9G format - moves are stored as space-separated strings
          // This format doesn't provide detailed move information
          // We'll need to extract move names from the available moves database
          const levelUpStr = movesData['Level Up Move List']?.trim() || '';
          const tmStr = movesData['TM/Tutor Moves List']?.trim() || '';

          // For 9G, we would need to parse these strings, but they appear to be placeholders
          // Return empty arrays for now since the actual data format needs clarification
        } else {
          // Handle old format (Core, with structured arrays)
          // Level Up Moves
          if (Array.isArray(movesData['Level Up Move List'])) {
            result.levelUp = movesData['Level Up Move List'].map(move => {
              const cleanMoveName = move.Move.replace(/\*+$/, '');
              const hasStab = pokemonTypes.some(type => type.toLowerCase() === move.Type?.toLowerCase());
              const moveDef = this.getMoveDefinition(cleanMoveName);
              return {
                name: cleanMoveName,
                type: moveDef?.['Type'] || move.Type,
                level: move.Level,
                frequency: moveDef?.['Frequency'] || 'N/A',
                class: moveDef?.['Class'] || 'N/A',
                range: moveDef?.['Range'] || 'N/A',
                damageBase: moveDef ? convertDamageBase(moveDef['Damage Base'], hasStab) : null,
                ac: moveDef?.['AC'] || moveDef?.['Accuracy'],
                effect: moveDef?.['Effect']
              };
            });
          }

          // TM/HM Moves
          if (Array.isArray(movesData['TM/HM Move List'])) {
            result.tm = movesData['TM/HM Move List'].map(move => {
              const cleanMoveName = move.Move.replace(/\*+$/, '');
              const hasStab = pokemonTypes.some(type => type.toLowerCase() === move.Type?.toLowerCase());
              const moveDef = this.getMoveDefinition(cleanMoveName);
              return {
                name: cleanMoveName,
                type: moveDef?.['Type'] || move.Type,
                frequency: moveDef?.['Frequency'] || 'N/A',
                class: moveDef?.['Class'] || 'N/A',
                range: moveDef?.['Range'] || 'N/A',
                damageBase: moveDef ? convertDamageBase(moveDef['Damage Base'], hasStab) : null,
                ac: moveDef?.['AC'] || moveDef?.['Accuracy'],
                effect: moveDef?.['Effect']
              };
            });
          }

          // Tutor Moves
          if (Array.isArray(movesData['Tutor Move List'])) {
            result.tutor = movesData['Tutor Move List'].map(move => {
              const cleanMoveName = move.Move.replace(/\*+$/, '');
              const hasStab = pokemonTypes.some(type => type.toLowerCase() === move.Type?.toLowerCase());
              const moveDef = this.getMoveDefinition(cleanMoveName);
              return {
                name: cleanMoveName,
                type: moveDef?.['Type'] || move.Type,
                frequency: moveDef?.['Frequency'] || 'N/A',
                class: moveDef?.['Class'] || 'N/A',
                range: moveDef?.['Range'] || 'N/A',
                damageBase: moveDef ? convertDamageBase(moveDef['Damage Base'], hasStab) : null,
                ac: moveDef?.['AC'] || moveDef?.['Accuracy'],
                effect: moveDef?.['Effect']
              };
            });
          }
        }
      }

      // Sort level up moves by level
      result.levelUp.sort((a, b) => (a.level || 0) - (b.level || 0));

      return result;
    } catch (error) {
      console.error(`Error getting moves for ${speciesName}:`, error);
      throw error;
    }
  }

  /**
   * Get available abilities for a Pokemon species
   * Returns abilities organized by category (basic, advanced, high)
   */
  static async getAvailableAbilitiesForSpecies(speciesName, dataset = 'core', fandex = []) {
    try {
      const fandexArray = Array.isArray(fandex) ? fandex : (typeof fandex === 'string' ? fandex.split(',').filter(Boolean) : []);
      
      if (dataset !== currentDataset || 
          fandexArray.length !== currentFandexes.length || 
          !fandexArray.every(f => currentFandexes.includes(f))) {
        await switchDataset(dataset, fandexArray);
      }

      // Use getSpeciesByName to properly handle form variants like "Rattata (Alola)"
      const species = this.getSpeciesByName(speciesName);
      if (!species) {
        throw new Error(`Pokemon species not found: ${speciesName}`);
      }

      // Helper to flatten ability and return array
      const flattenAbility = (ability) => {
        if (Array.isArray(ability)) {
          return ability;
        }
        return [ability];
      };

      const result = {
        basic: [],
        advanced: [],
        high: []
      };

      const pushAvailableAbility = (target, abilityName, tier, sourceSlot) => {
        const abilityData = this.getAbilityDefinition(abilityName);
        const ability = abilityData
          ? this.normalizeAbilityFields(abilityName, abilityData)
          : {
              name: abilityName,
              frequency: 'N/A',
              effect: 'N/A'
            };

        ability.sourceTier = tier;
        ability.sourceSlot = sourceSlot;
        target.push(ability);
      };

      if (species['Basic Information']) {
        const basicInfo = species['Basic Information'];
        
        // Basic Abilities
        if (basicInfo['Basic Ability 1']) {
          flattenAbility(basicInfo['Basic Ability 1']).forEach(abilityName => {
            pushAvailableAbility(result.basic, abilityName, 'basic', 'Basic Ability 1');
          });
        }
        if (basicInfo['Basic Ability 2']) {
          flattenAbility(basicInfo['Basic Ability 2']).forEach(abilityName => {
            pushAvailableAbility(result.basic, abilityName, 'basic', 'Basic Ability 2');
          });
        }

        // Advanced Abilities
        if (basicInfo['Adv Ability 1']) {
          flattenAbility(basicInfo['Adv Ability 1']).forEach(abilityName => {
            pushAvailableAbility(result.advanced, abilityName, 'advanced', 'Adv Ability 1');
          });
        }
        if (basicInfo['Adv Ability 2']) {
          flattenAbility(basicInfo['Adv Ability 2']).forEach(abilityName => {
            pushAvailableAbility(result.advanced, abilityName, 'advanced', 'Adv Ability 2');
          });
        }
        if (basicInfo['Adv Ability 3']) {
          flattenAbility(basicInfo['Adv Ability 3']).forEach(abilityName => {
            pushAvailableAbility(result.advanced, abilityName, 'advanced', 'Adv Ability 3');
          });
        }

        // High Ability
        if (basicInfo['High Ability']) {
          flattenAbility(basicInfo['High Ability']).forEach(abilityName => {
            pushAvailableAbility(result.high, abilityName, 'high', 'High Ability');
          });
        }
      }

      return result;
    } catch (error) {
      console.error(`Error getting abilities for ${speciesName}:`, error);
      throw error;
    }
  }

  static async getAllMovesFromDatabase(dataset = 'core', fandex = []) {
    try {
      // Load moves database
      const movesUrl = DATASETS_BASE_URL + DATASETS[dataset].moves;
      let movesDatabase = await fetchDataFromURL(movesUrl);
      
      // Load and merge fandex moves
      const fandexArray = Array.isArray(fandex) ? fandex : (typeof fandex === 'string' ? fandex.split(',').filter(Boolean) : []);
      for (const fandexKey of fandexArray) {
        if (FANDEX_DATASETS[fandexKey]) {
          const fandexMovesUrl = DATASETS_BASE_URL + FANDEX_DATASETS[fandexKey].moves;
          const fandexMoves = await fetchDataFromURL(fandexMovesUrl);
          movesDatabase = { ...movesDatabase, ...fandexMoves };
        }
      }

      // Organize all moves by type
      const result = {
        all: []
      };

      for (const [moveName, moveData] of Object.entries(movesDatabase)) {
        result.all.push({
          name: moveName,
          type: moveData['Type'] || 'N/A',
          frequency: moveData['Frequency'] || 'N/A',
          class: moveData['Class'] || 'N/A',
          range: moveData['Range'] || 'N/A',
          damageBase: convertDamageBase(moveData['Damage Base']) || null,
          ac: moveData['Accuracy'],
          effect: moveData['Effect'] || 'N/A'
        });
      }

      // Sort alphabetically
      result.all.sort((a, b) => a.name.localeCompare(b.name));

      return result;
    } catch (error) {
      console.error(`Error getting all moves from database:`, error);
      throw error;
    }
  }

  static async getAllAbilitiesFromDatabase(dataset = 'core', fandex = []) {
    try {
      // Load abilities database
      const abilitiesUrl = DATASETS_BASE_URL + DATASETS[dataset].abilities;
      let abilitiesData = await fetchDataFromURL(abilitiesUrl);
      
      // Load and merge fandex abilities
      const fandexArray = Array.isArray(fandex) ? fandex : (typeof fandex === 'string' ? fandex.split(',').filter(Boolean) : []);
      for (const fandexKey of fandexArray) {
        if (FANDEX_DATASETS[fandexKey]) {
          const fandexAbilitiesUrl = DATASETS_BASE_URL + FANDEX_DATASETS[fandexKey].abilities;
          let fandexAbilities = await fetchDataFromURL(fandexAbilitiesUrl);
          
          // Handle both object and array formats for fandex abilities
          if (Array.isArray(fandexAbilities)) {
            // Convert array to object to merge
            const fandexAbilitiesObj = {};
            fandexAbilities.forEach(ability => {
              if (ability.Name) {
                fandexAbilitiesObj[ability.Name] = ability;
              }
            });
            if (Array.isArray(abilitiesData)) {
              // Base is array, merge both arrays
              const existingNames = new Set(abilitiesData.map(a => a.Name));
              abilitiesData = [
                ...abilitiesData, 
                ...Object.values(fandexAbilitiesObj).filter(a => !existingNames.has(a.Name))
              ];
            } else {
              // Base is object, merge with fandex object
              abilitiesData = { ...abilitiesData, ...fandexAbilitiesObj };
            }
          } else {
            // Fandex is object, merge
            if (Array.isArray(abilitiesData)) {
              // Base is array, convert to object first, merge, then convert back
              const baseObj = {};
              abilitiesData.forEach(ability => {
                if (ability.Name) {
                  baseObj[ability.Name] = ability;
                }
              });
              const mergedObj = { ...baseObj, ...fandexAbilities };
              abilitiesData = Object.values(mergedObj);
            } else {
              abilitiesData = { ...abilitiesData, ...fandexAbilities };
            }
          }
        }
      }

      // Handle two different formats: array or object
      let abilitiesList = [];
      
      if (Array.isArray(abilitiesData)) {
        // Format: Array of {Name, Frequency, Effect}
        abilitiesList = abilitiesData;
      } else {
        // Format: Object with ability names as keys
        abilitiesList = Object.entries(abilitiesData)
          .filter(([key]) => isNaN(parseInt(key))) // Skip numeric keys
          .map(([name, data]) => ({
            Name: name,
            Frequency: data['Frequency'] || 'N/A',
            Effect: data['Effect'] || 'N/A',
            table: data.table || data.Table
          }));
      }

      // Organize all abilities
      const result = {
        all: abilitiesList.map(ability => ({
          name: ability.Name || ability.name,
          frequency: ability.Frequency || ability.frequency || 'N/A',
          effect: ability.Effect || ability.effect || 'N/A',
          table: ability.table || ability.Table
        }))
      };

      // Sort alphabetically
      result.all.sort((a, b) => a.name.localeCompare(b.name));

      return result;
    } catch (error) {
      console.error(`Error getting all abilities from database:`, error);
      throw error;
    }
  }

  /**
   * Load custom Pokemon from JSON data or URL
   * @param {Object|string} data - Either parsed JSON object or URL string
   * @returns {Promise<Object>} Result with count and status
   */
  static async loadCustomPokemon(data) {
    try {
      let pokemonData;
      
      if (typeof data === 'string') {
        // It's a URL - fetch it
        pokemonData = await fetchDataFromURL(data);
      } else {
        // It's already parsed JSON
        pokemonData = data;
      }

      // Ensure it's an array
      if (!Array.isArray(pokemonData)) {
        throw new Error('Custom Pokemon data must be an array');
      }

      // Limit custom Pokemon to avoid memory issues (max 1000)
      if (pokemonData.length > 1000) {
        console.warn(`Custom Pokemon data too large (${pokemonData.length}). Truncating to 1000.`);
        pokemonData = pokemonData.slice(0, 1000);
      }

      // Validate and filter out invalid entries
      const validPokemon = pokemonData.filter(pokemon => {
        if (!pokemon.Species || typeof pokemon.Species !== 'string') {
          console.warn('Skipping Pokemon without valid Species field');
          return false;
        }
        return true;
      });

      // Merge with existing custom Pokemon, overwriting duplicates by Species name
      const customMap = new Map(customPokemon.map(p => [p.Species.toLowerCase(), p]));
      validPokemon.forEach(pokemon => {
        customMap.set(pokemon.Species.toLowerCase(), pokemon);
      });
      customPokemon = Array.from(customMap.values());

      // Update pokemonByName lookup to include custom Pokemon
      validPokemon.forEach(pokemon => {
        pokemonByName[pokemon.Species.toLowerCase()] = pokemon;
      });

      console.log(`✓ Loaded ${validPokemon.length} custom Pokemon (${customPokemon.length} total)`);
      return {
        success: true,
        count: validPokemon.length,
        totalCustom: customPokemon.length
      };
    } catch (error) {
      console.error('Error loading custom Pokemon:', error);
      throw error;
    }
  }

  /**
   * Load custom Abilities from JSON data or URL
   * @param {Object|string} data - Either parsed JSON object or URL string
   * @returns {Promise<Object>} Result with count and status
   */
  static async loadCustomAbilities(data) {
    try {
      let abilitiesData;
      
      if (typeof data === 'string') {
        // It's a URL - fetch it
        abilitiesData = await fetchDataFromURL(data);
      } else {
        // It's already parsed JSON
        abilitiesData = data;
      }

      let count = 0;
      
      // Merge with existing custom abilities, overwriting duplicates by name
      if (Array.isArray(abilitiesData)) {
        // Convert array to object format
        // Limit to 500 abilities to avoid memory issues
        const slice = abilitiesData.slice(0, 500);
        count = slice.length;
        slice.forEach(ability => {
          if (ability.Name && typeof ability.Name === 'string') {
            customAbilities[ability.Name] = ability;
          }
        });
      } else {
        // Already in object format
        const entries = Object.entries(abilitiesData).slice(0, 500);
        count = entries.length;
        entries.forEach(([name, abilityData]) => {
          if (typeof name === 'string' && abilityData) {
            customAbilities[name] = abilityData;
          }
        });
      }

      // Rebuild abilities map with new custom abilities
      Object.keys(customAbilities).forEach(abilityName => {
        abilitiesMapLower[abilityName.toLowerCase()] = customAbilities[abilityName];
      });

      console.log(`✓ Loaded ${count} custom Abilities (${Object.keys(customAbilities).length} total)`);
      return {
        success: true,
        count: count,
        totalCustom: Object.keys(customAbilities).length
      };
    } catch (error) {
      console.error('Error loading custom Abilities:', error);
      throw error;
    }
  }

  /**
   * Load custom Moves from JSON data or URL
   * @param {Object|string} data - Either parsed JSON object or URL string
   * @returns {Promise<Object>} Result with count and status
   */
  static async loadCustomMoves(data) {
    try {
      let movesData;
      
      if (typeof data === 'string') {
        // It's a URL - fetch it
        movesData = await fetchDataFromURL(data);
      } else {
        // It's already parsed JSON
        movesData = data;
      }

      let count = 0;

      // Merge with existing custom moves, overwriting duplicates by name
      if (Array.isArray(movesData)) {
        // Convert array to object format
        // Limit to 500 moves to avoid memory issues
        const slice = movesData.slice(0, 500);
        count = slice.length;
        slice.forEach(move => {
          if (move.Name && typeof move.Name === 'string') {
            customMoves[move.Name] = move;
          }
        });
      } else {
        // Already in object format
        const entries = Object.entries(movesData).slice(0, 500);
        count = entries.length;
        entries.forEach(([name, moveData]) => {
          if (typeof name === 'string' && moveData) {
            customMoves[name] = moveData;
          }
        });
      }

      // Rebuild moves map with new custom moves
      Object.keys(customMoves).forEach(moveName => {
        movesMapLower[moveName.toLowerCase()] = customMoves[moveName];
      });

      console.log(`✓ Loaded ${count} custom Moves (${Object.keys(customMoves).length} total)`);
      return {
        success: true,
        count: count,
        totalCustom: Object.keys(customMoves).length
      };
    } catch (error) {
      console.error('Error loading custom Moves:', error);
      throw error;
    }
  }

  /**
   * Get custom data that has been loaded
   */
  static getCustomData() {
    return {
      pokemon: customPokemon.length,
      abilities: Object.keys(customAbilities).length,
      moves: Object.keys(customMoves).length
    };
  }

  /**
   * Clear all custom data
   */
  static clearCustomData() {
    // Remove custom Pokemon from lookup
    customPokemon.forEach(pokemon => {
      delete pokemonByName[pokemon.Species.toLowerCase()];
    });
    
    customPokemon = [];
    customAbilities = {};
    customMoves = {};
    console.log('✓ Cleared all custom data');
    return { success: true };
  }
}

export { initializeDatasets };
export default PokemonGenerator;
