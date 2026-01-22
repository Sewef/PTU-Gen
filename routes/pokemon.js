const express = require('express');
const router = express.Router();
const PokemonGenerator = require('../utils/pokemonGenerator');

/**
 * GET /api/pokemon/generate
 * Generate a random Pokemon with PTU 1.05 stats
 * Query params:
 *   - level: number (1-100) - specific level
 *   - minLevel: number (1-100) - minimum level for random range
 *   - maxLevel: number (1-100) - maximum level for random range
 *   - species: string (Pokemon name)
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
 */
router.get('/generate', async (req, res) => {
  try {
    const options = {
      level: req.query.level ? parseInt(req.query.level) : undefined,
      minLevel: req.query.minLevel ? parseInt(req.query.minLevel) : undefined,
      maxLevel: req.query.maxLevel ? parseInt(req.query.maxLevel) : undefined,
      species: req.query.species,
      shiny: req.query.shiny === 'true',
      distribution: req.query.distribution || 'RANDOM',
      ignoreBaseRelation: req.query.ignoreBaseRelation,
      hpFormula: req.query.hpFormula,
      dataset: req.query.dataset || 'core',
      nature: req.query.nature
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
 */
router.get('/generateWild/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);
    const dataset = req.query.dataset || 'core';
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
 * Generate a full team of 6 Pokemon
 * Query params:
 *   - level: number (1-100)
 *   - size: number (1-6)
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 */
router.get('/team', async (req, res) => {
  try {
    const options = {
      level: req.query.level ? parseInt(req.query.level) : 50,
      size: req.query.size ? Math.min(parseInt(req.query.size), 6) : 6,
      dataset: req.query.dataset || 'core'
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
    const dataset = req.query.dataset || 'core';
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
 */
router.get('/moves/:species', async (req, res) => {
  try {
    const species = req.params.species;
    const moves = await PokemonGenerator.getAvailableMovesForSpecies(species);
    res.json(moves);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/abilities/:species
 * Get available abilities for a specific Pokemon species
 * Returns abilities organized by category: basic, advanced, high
 */
router.get('/abilities/:species', async (req, res) => {
  try {
    const species = req.params.species;
    const abilities = await PokemonGenerator.getAvailableAbilitiesForSpecies(species);
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
    const dataset = req.query.dataset || 'core';
    const moves = await PokemonGenerator.getAllMovesFromDatabase(dataset);
    res.json(moves);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/all-abilities
 * Get all abilities from the database
 * Query params:
 *   - dataset: string - 'core' (default), 'community', or 'homebrew'
 * Returns all abilities organized by category
 */
router.get('/all-abilities', async (req, res) => {
  try {
    const dataset = req.query.dataset || 'core';
    const abilities = await PokemonGenerator.getAllAbilitiesFromDatabase(dataset);
    res.json(abilities);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
