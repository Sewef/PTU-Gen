const express = require('express');
const router = express.Router();
const PokemonGenerator = require('../utils/pokemonGenerator');

// Middleware to normalize query parameter keys to lowercase
router.use((req, res, next) => {
  const normalizedQuery = {};
  for (const [key, value] of Object.entries(req.query)) {
    normalizedQuery[key.toLowerCase()] = value;
  }
  req.query = normalizedQuery;
  next();
});

/**
 * GET /api/pokemon/generate
 * Generate a random Pokemon with PTU 1.05 stats
 * Query params:
 *   - level: number (1-100) - specific level
 *   - minLevel: number (1-100) - minimum level for random range
 *   - maxLevel: number (1-100) - maximum level for random range
 *   - species: string (Pokemon name) - if not specified, random species is chosen
 *   - habitat: string (habitat name) - if specified, random species from that habitat is chosen
 *   - shiny: boolean
 *   - distribution: string - RANDOM (default), BALANCED, or MINMAXED
 *     * RANDOM: Points distributed randomly to stat groups
 *     * BALANCED: Equal points to all stat groups
 *     * MINMAXED: More points to highest base stats, fewer to lowest
 *     * Note: Stats with equal base values always remain equal (Base Relation preserved)
 *   - ignoreBaseRelation: string - 'IGNORE' (disable for all stats) or comma-separated list (HP,ATK,DEF,SPA,SPD,SPE)
 *     * IGNORE: Completely disable Base Relation - each stat distributed independently
 *     * HP,ATK: Ignore Base Relation only for specified stats, others remain grouped
 *   - hpFormula: string - Custom HP calculation formula (default: 'LEVEL + (HP * 3) + 10')
 *     * Can use 'LEVEL' and 'HP' placeholders, e.g., 'LEVEL + (HP * 2)'
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 *   - nature: string - Specific nature name (e.g., 'Adamant', 'Timid'). If not specified, a random nature is chosen
 *   - includeLegendaries: boolean - Include legendary Pokemon in generation (default: false)
 *   - forceEvolution: boolean - Automatically evolve Pokemon based on level and evolution conditions (default: false)
 *   - customPokemonUrl: string - URL to JSON file with custom Pokemon (will be loaded before generation)
 *   - customAbilitiesUrl: string - URL to JSON file with custom Abilities (will be loaded before generation)
 *   - customMovesUrl: string - URL to JSON file with custom Moves (will be loaded before generation)
 */
router.get('/generate', async (req, res) => {
  try {
    // Load custom data if provided
    if (req.query.custompokemonurl) {
      try {
        await PokemonGenerator.loadCustomPokemon(req.query.custompokemonurl);
      } catch (error) {
        console.warn('Failed to load custom Pokemon from URL:', error.message);
      }
    }
    
    if (req.query.customabilitiesurl) {
      try {
        await PokemonGenerator.loadCustomAbilities(req.query.customabilitiesurl);
      } catch (error) {
        console.warn('Failed to load custom Abilities from URL:', error.message);
      }
    }
    
    if (req.query.custommovesurl) {
      try {
        await PokemonGenerator.loadCustomMoves(req.query.custommovesurl);
      } catch (error) {
        console.warn('Failed to load custom Moves from URL:', error.message);
      }
    }

    const options = {
      level: req.query.level ? parseInt(req.query.level) : undefined,
      minlevel: req.query.minlevel ? parseInt(req.query.minlevel) : undefined,
      maxlevel: req.query.maxlevel ? parseInt(req.query.maxlevel) : undefined,
      species: req.query.species,
      habitat: req.query.habitat,
      shiny: req.query.shiny === 'true',
      shinyodds: req.query.shinyodds ? parseFloat(req.query.shinyodds) : undefined,
      distribution: (req.query.distribution || 'RANDOM').toUpperCase(),
      ignorebaserelation: req.query.ignorebaserelation?.toUpperCase(),
      hpformula: req.query.hpformula,
      dataset: (req.query.dataset || 'core').toLowerCase(),
      nature: req.query.nature,
      includelegendaries: req.query.includelegendaries,
      forceevolution: req.query.forceevolution
    };

    const pokemon = await PokemonGenerator.generatePokemon(options);
    res.json(pokemon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/generateWild/:level
 * Generate a wild Pokemon at specific level
 * Query params:
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 *   - customPokemonUrl: string - URL to JSON file with custom Pokemon
 *   - customAbilitiesUrl: string - URL to JSON file with custom Abilities
 *   - customMovesUrl: string - URL to JSON file with custom Moves
 */
router.get('/generateWild/:level', async (req, res) => {
  try {
    // Load custom data if provided
    if (req.query.custompokemonurl) {
      try {
        await PokemonGenerator.loadCustomPokemon(req.query.custompokemonurl);
      } catch (error) {
        console.warn('Failed to load custom Pokemon from URL:', error.message);
      }
    }
    
    if (req.query.customabilitiesurl) {
      try {
        await PokemonGenerator.loadCustomAbilities(req.query.customabilitiesurl);
      } catch (error) {
        console.warn('Failed to load custom Abilities from URL:', error.message);
      }
    }
    
    if (req.query.custommovesurl) {
      try {
        await PokemonGenerator.loadCustomMoves(req.query.custommovesurl);
      } catch (error) {
        console.warn('Failed to load custom Moves from URL:', error.message);
      }
    }

    const level = parseInt(req.params.level);
    const dataset = (req.query.dataset || 'core').toLowerCase();
    if (isNaN(level) || level < 1 || level > 100) {
      return res.status(400).json({ error: 'Level must be between 1 and 100' });
    }

    const pokemon = await PokemonGenerator.generateWildPokemon(level, dataset);
    res.json(pokemon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/team
 * Generate a full team of Pokemon
 * Query params:
 *   - level: number (1-100)
 *   - minLevel: number (1-100) - minimum level for random range
 *   - maxLevel: number (1-100) - maximum level for random range
 *   - size: number (1-50) - specific team size
 *   - minSize: number (1-50) - minimum team size for random range
 *   - maxSize: number (1-50) - maximum team size for random range
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 *   - includeLegendaries: boolean - Include legendary Pokemon (default: false)
 *   - customPokemonUrl: string - URL to JSON file with custom Pokemon
 *   - customAbilitiesUrl: string - URL to JSON file with custom Abilities
 *   - customMovesUrl: string - URL to JSON file with custom Moves
 */
router.get('/team', async (req, res) => {
  try {
    // Load custom data if provided
    if (req.query.custompokemonurl) {
      try {
        await PokemonGenerator.loadCustomPokemon(req.query.custompokemonurl);
      } catch (error) {
        console.warn('Failed to load custom Pokemon from URL:', error.message);
      }
    }
    
    if (req.query.customabilitiesurl) {
      try {
        await PokemonGenerator.loadCustomAbilities(req.query.customabilitiesurl);
      } catch (error) {
        console.warn('Failed to load custom Abilities from URL:', error.message);
      }
    }
    
    if (req.query.custommovesurl) {
      try {
        await PokemonGenerator.loadCustomMoves(req.query.custommovesurl);
      } catch (error) {
        console.warn('Failed to load custom Moves from URL:', error.message);
      }
    }

    // Determine level
    let level;
    if (req.query.minlevel !== undefined && req.query.maxlevel !== undefined) {
      const min = Math.max(1, parseInt(req.query.minlevel));
      const max = Math.min(100, parseInt(req.query.maxlevel));
      level = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (req.query.level) {
      level = parseInt(req.query.level);
    } else {
      level = 50;
    }

    // Determine team size
    let size;
    if (req.query.minsize !== undefined && req.query.maxsize !== undefined) {
      const min = Math.max(1, parseInt(req.query.minsize));
      const max = Math.min(50, parseInt(req.query.maxsize));
      size = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (req.query.size) {
      size = Math.min(parseInt(req.query.size), 50);
    } else {
      size = 6;
    }

    const options = {
      level: level,
      size: size,
      dataset: (req.query.dataset || 'core').toLowerCase(),
      includelegendaries: req.query.includelegendaries
    };

    if (options.level < 1 || options.level > 100) {
      return res.status(400).json({ error: 'Level must be between 1 and 100' });
    }

    const team = await PokemonGenerator.generateTeam(options);
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/list
 * List all available Pokemon species
 * Query params:
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 */
router.get('/list', async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'core').toLowerCase();
    const pokemon = await PokemonGenerator.listAvailablePokemon(dataset);
    const speciesNames = pokemon.map(p => p.name);
    res.json({
      count: speciesNames.length,
      dataset: dataset,
      species: speciesNames
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/datasets
 * List all available datasets
 */
router.get('/datasets', (req, res) => {
  try {
    const datasets = PokemonGenerator.getAvailableDatasets();
    res.json({
      current: PokemonGenerator.getCurrentDataset(),
      datasets: datasets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/habitats
 * List all available habitats
 */
router.get('/habitats', async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'core').toLowerCase();
    
    // Trigger dataset switch by calling any method that does it
    await PokemonGenerator.listAvailablePokemon(dataset);
    
    const habitats = PokemonGenerator.getAvailableHabitats();
    res.json({
      habitats: habitats,
      count: habitats.length,
      dataset: dataset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/habitat/:habitatName
 * List Pokemon species from a specific habitat
 * Query params:
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 */
router.get('/habitat/:habitatName', async (req, res) => {
  try {
    const habitat = req.params.habitatName;
    const dataset = (req.query.dataset || 'core').toLowerCase();
    
    // Trigger dataset switch
    await PokemonGenerator.listAvailablePokemon(dataset);
    
    const pokemonList = PokemonGenerator.getPokemonByHabitat(habitat);
    if (pokemonList.length === 0) {
      return res.status(400).json({ error: `No Pokemon found in habitat: ${habitat}` });
    }
    
    res.json({
      habitat: habitat,
      species: pokemonList.map(p => ({
        name: p.Species,
        id: p.Number,
        types: p['Basic Information']?.Type || []
      })),
      count: pokemonList.length,
      dataset: dataset
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/natures
 * List all available natures
 */
router.get('/natures', (req, res) => {
  try {
    const natures = PokemonGenerator.getAllNatures();
    res.json({
      count: natures.length,
      natures: natures
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/moves/:species
 * Get available moves for a specific Pokemon species
 * Returns moves organized by category: levelUp, tm, tutor
 * Query params:
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 */
router.get('/moves/:species', async (req, res) => {
  try {
    const species = req.params.species;
    const dataset = (req.query.dataset || 'core').toLowerCase();
    const moves = await PokemonGenerator.getAvailableMovesForSpecies(species, dataset);
    res.json(moves);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/abilities/:species
 * Get available abilities for a specific Pokemon species
 * Returns abilities organized by category: basic, advanced, high
 * Query params:
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 */
router.get('/abilities/:species', async (req, res) => {
  try {
    const species = req.params.species;
    const dataset = (req.query.dataset || 'core').toLowerCase();
    const abilities = await PokemonGenerator.getAvailableAbilitiesForSpecies(species, dataset);
    res.json(abilities);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/all-moves
 * Get all moves from the database
 * Query params:
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 * Returns all moves organized by type
 */
router.get('/all-moves', async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'core').toLowerCase();
    const moves = await PokemonGenerator.getAllMovesFromDatabase(dataset);
    res.json(moves);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/all-abilities
 * Get all abilities from the database, organized by category
 */
router.get('/all-abilities', async (req, res) => {
  try {
    const dataset = (req.query.dataset || 'core').toLowerCase();
    const abilities = await PokemonGenerator.getAllAbilitiesFromDatabase(dataset);
    res.json(abilities);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/pokemon/custom/pokemon
 * Load custom Pokemon from JSON data or URL
 * Body: { data: {...} } or { url: "https://..." }
 */
router.post('/custom/pokemon', async (req, res) => {
  try {
    const { data, url } = req.body;
    
    if (!data && !url) {
      return res.status(400).json({ error: 'Must provide either data (JSON) or url (string)' });
    }
    
    const result = await PokemonGenerator.loadCustomPokemon(data || url);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/pokemon/custom/abilities
 * Load custom Abilities from JSON data or URL
 * Body: { data: {...} } or { url: "https://..." }
 */
router.post('/custom/abilities', async (req, res) => {
  try {
    const { data, url } = req.body;
    
    if (!data && !url) {
      return res.status(400).json({ error: 'Must provide either data (JSON) or url (string)' });
    }
    
    const result = await PokemonGenerator.loadCustomAbilities(data || url);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/pokemon/custom/moves
 * Load custom Moves from JSON data or URL
 * Body: { data: {...} } or { url: "https://..." }
 */
router.post('/custom/moves', async (req, res) => {
  try {
    const { data, url } = req.body;
    
    if (!data && !url) {
      return res.status(400).json({ error: 'Must provide either data (JSON) or url (string)' });
    }
    
    const result = await PokemonGenerator.loadCustomMoves(data || url);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/custom
 * Get status of loaded custom data
 */
router.get('/custom', (req, res) => {
  try {
    const customData = PokemonGenerator.getCustomData();
    res.json({
      custom: customData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/pokemon/custom
 * Clear all custom data
 */
router.delete('/custom', (req, res) => {
  try {
    const result = PokemonGenerator.clearCustomData();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
