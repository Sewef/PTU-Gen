const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const pokemonRoutes = require('./routes/pokemon');

// Routes
app.use('/api/pokemon', pokemonRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PTU 1.05 Pokemon Generator API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      generate: '/api/pokemon/generate',
      generateWild: '/api/pokemon/generateWild/:level',
      list: '/api/pokemon/list'
    },
    documentation: 'See README.md for full documentation'
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

app.listen(PORT, () => {
  console.log(`PTU Pokemon Generator running on port ${PORT}`);
});
