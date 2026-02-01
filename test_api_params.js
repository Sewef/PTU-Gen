const PokemonGenerator = require('./utils/pokemonGenerator');

async function testAPI() {
  try {
    // Initialize the generator
    await PokemonGenerator.initializeDatasets();
    
    console.log('Test 1: Turtwig level 50 WITH forceEvolution');
    const result1 = await PokemonGenerator.generatePokemon({
      species: 'Turtwig',
      level: 50,
      forceevolution: 'true', // String as it comes from query
      dataset: 'homebrew'
    });
    console.log(`Result: ${result1.name}\n`);
    
    console.log('Test 2: Turtwig level 50 WITHOUT forceEvolution');
    const result2 = await PokemonGenerator.generatePokemon({
      species: 'Turtwig',
      level: 50,
      dataset: 'homebrew'
    });
    console.log(`Result: ${result2.name}\n`);
    
    console.log('Test 3: Random Pokemon level 50 WITH forceEvolution');
    const result3 = await PokemonGenerator.generatePokemon({
      level: 50,
      forceevolution: 'true',
      dataset: 'homebrew'
    });
    console.log(`Result: ${result3.name}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
