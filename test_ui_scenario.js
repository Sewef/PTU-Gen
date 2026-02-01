const PokemonGenerator = require('./utils/pokemonGenerator');

async function testUIScenario() {
  try {
    // Initialize the generator
    await PokemonGenerator.initializeDatasets();
    
    console.log('='.repeat(60));
    console.log('SIMULATING UI SCENARIO: Multiple random Pokemon with forceEvolution');
    console.log('='.repeat(60));
    
    for (let i = 0; i < 10; i++) {
      console.log(`\n--- Generation ${i + 1} ---`);
      const result = await PokemonGenerator.generatePokemon({
        level: 50,
        forceevolution: 'true',
        dataset: 'homebrew'
      });
      console.log(`Result: ${result.name}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testUIScenario();
