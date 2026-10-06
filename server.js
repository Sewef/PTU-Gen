const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import generator
const PokemonGenerator = require('./utils/pokemonGenerator');
const { initializeDatasets } = require('./utils/pokemonGenerator');

// Middleware
app.use(cors());
app.use(express.json());

// Serve the Vite build in production. Keep public as a development fallback.
const staticDirectory = fs.existsSync(path.join(__dirname, 'dist')) ? 'dist' : 'public';
app.use(express.static(staticDirectory));
// Keep extension entry points available if dist is stale or was produced by a
// frontend-only build. Built files in dist retain priority.
if (staticDirectory !== 'public') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Import routes
const pokemonRoutes = require('./routes/pokemon');

// API Routes
app.use('/api/pokemon', pokemonRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'PTU 1.05 Pokemon Generator API',
    version: '1.1.0',
    endpoints: {
      health: '/health',
      generate: '/api/pokemon/generate',
      generateBlank: '/api/pokemon/generateBlank',
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
      customSpecies: 'POST /api/pokemon/custom/species',
      customAbilities: 'POST /api/pokemon/custom/abilities',
      customMoves: 'POST /api/pokemon/custom/moves',
      customStatus: 'GET /api/pokemon/custom',
      customClear: 'DELETE /api/pokemon/custom'
    },
    documentation: 'See README.md and CUSTOMIZATION.md for full documentation'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize datasets and start server
initializeDatasets().then(() => {
  app.listen(PORT);
}).catch((error) => {
  console.error('Failed to initialize datasets:', error);
  process.exit(1);
});
