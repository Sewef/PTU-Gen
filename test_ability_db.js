const PokemonGenerator = require('./utils/pokemonGenerator');

// Test pour vérifier abilitiesDatabase
(async () => {
  try {
    console.log('Initializing datasets...');
    const { initializeDatasets } = require('./utils/pokemonGenerator');
    await initializeDatasets();
    
    // Try to get an ability definition
    console.log('\nTesting getAbilityDefinition...');
    const abilityDef = PokemonGenerator.getAbilityDefinition('Torrent');
    console.log('Torrent definition:', JSON.stringify(abilityDef, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
})();
