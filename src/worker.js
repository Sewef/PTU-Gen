import { Hono } from 'hono';
import { cors } from 'hono/cors';
import PokemonGenerator, { initializeDatasets } from '../utils/pokemonGenerator.js';

const app = new Hono();

app.use('/api/*', cors());

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeDatasets();
    initialized = true;
  }
}

function normalizeQuery(query) {
  const normalized = {};
  for (const [key, value] of Object.entries(query)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

function splitFandex(query) {
  return query.fandex ? query.fandex.split(',') : [];
}

async function loadCustomDataFromQuery(query) {
  const customLoaders = [
    {
      url: query.custompokemonurl,
      label: 'custom Pokemon',
      load: PokemonGenerator.loadCustomPokemon
    },
    {
      url: query.customabilitiesurl,
      label: 'custom Abilities',
      load: PokemonGenerator.loadCustomAbilities
    },
    {
      url: query.custommovesurl,
      label: 'custom Moves',
      load: PokemonGenerator.loadCustomMoves
    }
  ];

  for (const customLoader of customLoaders) {
    if (!customLoader.url) continue;

    try {
      await customLoader.load.call(PokemonGenerator, customLoader.url);
    } catch (error) {
      console.warn(`Failed to load ${customLoader.label} from URL:`, error.message);
    }
  }
}

async function readJsonBody(c) {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

function jsonError(c, error, status = 500) {
  return c.json({ error: error.message }, status);
}

app.get('/health', c => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/info', c => {
  return c.json({
    name: 'PTU 1.05 Pokemon Generator API',
    version: '1.1.0',
    endpoints: {
      health: '/health',
      generate: '/api/pokemon/generate',
      generateWild: '/api/pokemon/generateWild/:level',
      team: '/api/pokemon/team',
      list: '/api/pokemon/list',
      datasets: '/api/pokemon/datasets',
      natures: '/api/pokemon/natures',
      types: '/api/pokemon/types',
      habitats: '/api/pokemon/habitats',
      moves: '/api/pokemon/moves/:species',
      abilities: '/api/pokemon/abilities/:species',
      allMoves: '/api/pokemon/all-moves',
      allAbilities: '/api/pokemon/all-abilities',
      customPokemon: 'POST /api/pokemon/custom/pokemon',
      customAbilities: 'POST /api/pokemon/custom/abilities',
      customMoves: 'POST /api/pokemon/custom/moves',
      customStatus: 'GET /api/pokemon/custom',
      customClear: 'DELETE /api/pokemon/custom'
    },
    documentation: 'See README.md and CUSTOMIZATION.md for full documentation'
  });
});

app.get('/api/pokemon/generate', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    await loadCustomDataFromQuery(query);

    const pokemon = await PokemonGenerator.generatePokemon({
      level: query.level ? parseInt(query.level) : undefined,
      minlevel: query.minlevel ? parseInt(query.minlevel) : undefined,
      maxlevel: query.maxlevel ? parseInt(query.maxlevel) : undefined,
      species: query.species,
      type: query.type,
      habitat: query.habitat,
      randomform: query.randomform === 'true',
      shiny: query.shiny === 'true',
      shinyodds: query.shinyodds ? parseFloat(query.shinyodds) : undefined,
      distribution: (query.distribution || 'RANDOM').toUpperCase(),
      ignorebaserelation: query.ignorebaserelation?.toUpperCase(),
      hpformula: query.hpformula,
      dataset: (query.dataset || 'core').toLowerCase(),
      nature: query.nature,
      includelegendaries: query.includelegendaries,
      forceevolution: query.forceevolution,
      fandex: splitFandex(query)
    });

    return c.json(pokemon);
  } catch (error) {
    console.error('Error generating pokemon:', error);
    return jsonError(c, error, 400);
  }
});

app.get('/api/pokemon/generateWild/:level', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    await loadCustomDataFromQuery(query);

    const level = parseInt(c.req.param('level'));
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);

    if (isNaN(level) || level < 1 || level > 100) {
      return c.json({ error: 'Level must be between 1 and 100' }, 400);
    }

    const pokemon = await PokemonGenerator.generatePokemon({ level, dataset, fandex });
    return c.json(pokemon);
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.get('/api/pokemon/team', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    await loadCustomDataFromQuery(query);

    let level;
    if (query.minlevel !== undefined && query.maxlevel !== undefined) {
      const min = Math.max(1, parseInt(query.minlevel));
      const max = Math.min(100, parseInt(query.maxlevel));
      level = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (query.level) {
      level = parseInt(query.level);
    } else {
      level = 50;
    }

    let size;
    if (query.minsize !== undefined && query.maxsize !== undefined) {
      const min = Math.max(1, parseInt(query.minsize));
      const max = Math.min(50, parseInt(query.maxsize));
      size = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (query.size) {
      size = Math.min(parseInt(query.size), 50);
    } else {
      size = 6;
    }

    const options = {
      level,
      size,
      dataset: (query.dataset || 'core').toLowerCase(),
      fandex: splitFandex(query),
      hpformula: query.hpformula,
      includelegendaries: query.includelegendaries
    };

    if (options.level < 1 || options.level > 100) {
      return c.json({ error: 'Level must be between 1 and 100' }, 400);
    }

    const team = await PokemonGenerator.generateTeam(options);
    return c.json(team);
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.get('/api/pokemon/list', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);
    const pokemon = await PokemonGenerator.listAvailablePokemon(dataset, fandex);
    const speciesNames = pokemon.map(p => p.name);

    return c.json({
      count: speciesNames.length,
      dataset,
      fandex,
      species: speciesNames
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.get('/api/pokemon/datasets', async c => {
  try {
    await ensureInitialized();
    const datasets = PokemonGenerator.getAvailableDatasets();
    return c.json({
      current: PokemonGenerator.getCurrentDataset(),
      datasets
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.get('/api/pokemon/fandexes', async c => {
  try {
    await ensureInitialized();
    const fandexes = PokemonGenerator.getAvailableFandexes();
    return c.json({
      current: PokemonGenerator.getCurrentFandexes(),
      fandexes
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.get('/api/pokemon/habitats', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);

    await PokemonGenerator.listAvailablePokemon(dataset, fandex);

    const habitats = PokemonGenerator.getAvailableHabitats();
    return c.json({
      habitats,
      count: habitats.length,
      dataset,
      fandex
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.get('/api/pokemon/types', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);

    await PokemonGenerator.listAvailablePokemon(dataset, fandex);

    const types = PokemonGenerator.getAvailableTypes();
    return c.json({
      types,
      count: types.length,
      dataset,
      fandex
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.get('/api/pokemon/habitat/:habitatName', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const habitat = c.req.param('habitatName');
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);

    await PokemonGenerator.listAvailablePokemon(dataset, fandex);

    const pokemonList = PokemonGenerator.getPokemonByHabitat(habitat);
    if (pokemonList.length === 0) {
      return c.json({ error: `No Pokemon found in habitat: ${habitat}` }, 400);
    }

    return c.json({
      habitat,
      species: pokemonList.map(p => ({
        name: p.Species,
        id: p.Number,
        types: p['Basic Information']?.Type || []
      })),
      count: pokemonList.length,
      dataset,
      fandex
    });
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.get('/api/pokemon/natures', async c => {
  try {
    await ensureInitialized();
    const natures = PokemonGenerator.getAllNatures();
    return c.json({
      count: natures.length,
      natures
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.get('/api/pokemon/moves/:species', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const species = c.req.param('species');
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);
    const moves = await PokemonGenerator.getAvailableMovesForSpecies(species, dataset, fandex);

    return c.json(moves);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.get('/api/pokemon/abilities/:species', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const species = c.req.param('species');
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);
    const abilities = await PokemonGenerator.getAvailableAbilitiesForSpecies(species, dataset, fandex);

    return c.json(abilities);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.get('/api/pokemon/all-moves', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);
    const moves = await PokemonGenerator.getAllMovesFromDatabase(dataset, fandex);

    return c.json(moves);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.get('/api/pokemon/all-abilities', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || 'core').toLowerCase();
    const fandex = splitFandex(query);
    const abilities = await PokemonGenerator.getAllAbilitiesFromDatabase(dataset, fandex);

    return c.json(abilities);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.post('/api/pokemon/custom/pokemon', async c => {
  try {
    await ensureInitialized();
    const { data, url } = await readJsonBody(c);

    if (!data && !url) {
      return c.json({ error: 'Must provide either data (JSON) or url (string)' }, 400);
    }

    const result = await PokemonGenerator.loadCustomPokemon(data || url);
    return c.json(result);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.post('/api/pokemon/custom/abilities', async c => {
  try {
    await ensureInitialized();
    const { data, url } = await readJsonBody(c);

    if (!data && !url) {
      return c.json({ error: 'Must provide either data (JSON) or url (string)' }, 400);
    }

    const result = await PokemonGenerator.loadCustomAbilities(data || url);
    return c.json(result);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.post('/api/pokemon/custom/moves', async c => {
  try {
    await ensureInitialized();
    const { data, url } = await readJsonBody(c);

    if (!data && !url) {
      return c.json({ error: 'Must provide either data (JSON) or url (string)' }, 400);
    }

    const result = await PokemonGenerator.loadCustomMoves(data || url);
    return c.json(result);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.get('/api/pokemon/custom', async c => {
  try {
    await ensureInitialized();
    const customData = PokemonGenerator.getCustomData();
    return c.json({ custom: customData });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.delete('/api/pokemon/custom', async c => {
  try {
    await ensureInitialized();
    const result = PokemonGenerator.clearCustomData();
    return c.json(result);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});

app.get('/api/pokemon/evolutions/:species', async c => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const species = decodeURIComponent(c.req.param('species'));
    const dataset = query.dataset || 'core';

    if (dataset !== PokemonGenerator.getCurrentDataset()) {
      await PokemonGenerator.switchDataset(dataset);
    }

    const pokemon = PokemonGenerator.getSpeciesByName(species);

    if (!pokemon) {
      return c.json({ error: `Pokemon "${species}" not found in dataset "${dataset}"` }, 404);
    }

    const evolutionData = pokemon.Evolution || [];

    if (evolutionData.length === 0) {
      return c.json({ evolutionChain: [{ stage: 1, species: pokemon.Species, minimumLevel: 1 }] });
    }

    let currentStage = 1;
    let maxStage = 1;

    evolutionData.forEach(evo => {
      const stage = evo.Stade || 1;
      if (evo.Species?.toLowerCase() === species.toLowerCase()) {
        currentStage = stage;
      }
      maxStage = Math.max(maxStage, stage);
    });

    return c.json({
      evolutionChain: evolutionData,
      currentSpecies: pokemon.Species,
      currentStage,
      maxStage,
      evolutionsRemaining: maxStage - currentStage
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});

app.all('*', c => c.env.ASSETS.fetch(c.req.raw));

export default app;
