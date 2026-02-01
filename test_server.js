const express = require('express');
const cors = require('cors');
const PokemonGenerator = require('./utils/pokemonGenerator');
const { initializeDatasets } = require('./utils/pokemonGenerator');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/pokemon', require('./routes/pokemon'));

// Start server and test
initializeDatasets().then(() => {
  const server = app.listen(PORT, async () => {
    console.log(`✓ Test server running on port ${PORT}`);
    
    try {
      // Make a test request
      const response = await fetch(`http://localhost:${PORT}/api/pokemon/generate?level=50&forceEvolution=true&dataset=homebrew`);
      const data = await response.json();
      console.log('Result from /api/pokemon/generate:', data.name);
    } catch (error) {
      console.error('Error:', error.message);
    }
    
    server.close();
  });
}).catch((error) => {
  console.error('Failed to initialize datasets:', error);
  process.exit(1);
});
