const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import generator
const PokemonGenerator = require('./utils/pokemonGenerator');
const { initializeDatasets } = require('./utils/pokemonGenerator');

// Middleware
app.use(cors());
app.use(express.json());

// Static files FIRST (so index.html is served for root path)
app.use(express.static('public'));

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
      generateWild: '/api/pokemon/generateWild/:level',
      team: '/api/pokemon/team',
      list: '/api/pokemon/list',
      datasets: '/api/pokemon/datasets',
      natures: '/api/pokemon/natures',
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
  app.listen(PORT, () => {
    console.log(`✓ PTU Pokemon Generator running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize datasets:', error);
  process.exit(1);
});
