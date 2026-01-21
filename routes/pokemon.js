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
 */
router.get('/generate', (req, res) => {
  try {
    const options = {
      level: req.query.level ? parseInt(req.query.level) : undefined,
      minLevel: req.query.minLevel ? parseInt(req.query.minLevel) : undefined,
      maxLevel: req.query.maxLevel ? parseInt(req.query.maxLevel) : undefined,
      species: req.query.species,
      shiny: req.query.shiny === 'true',
      distribution: req.query.distribution || 'RANDOM',
      ignoreBaseRelation: req.query.ignoreBaseRelation,
      hpFormula: req.query.hpFormula
    };

    const pokemon = PokemonGenerator.generatePokemon(options);
    res.json(pokemon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/generateWild/:level
 * Generate a wild Pokemon at specific level
 */
router.get('/generateWild/:level', (req, res) => {
  try {
    const level = parseInt(req.params.level);
    if (isNaN(level) || level < 1 || level > 100) {
      return res.status(400).json({ error: 'Level must be between 1 and 100' });
    }

    const pokemon = PokemonGenerator.generateWildPokemon(level);
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
 */
router.get('/team', (req, res) => {
  try {
    const options = {
      level: req.query.level ? parseInt(req.query.level) : 50,
      size: req.query.size ? Math.min(parseInt(req.query.size), 6) : 6
    };

    if (options.level < 1 || options.level > 100) {
      return res.status(400).json({ error: 'Level must be between 1 and 100' });
    }

    const team = PokemonGenerator.generateTeam(options);
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/pokemon/list
 * List all available Pokemon species
 */
router.get('/list', (req, res) => {
  try {
    const pokemon = PokemonGenerator.listAvailablePokemon();
    res.json({
      count: pokemon.length,
      pokemon: pokemon
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
