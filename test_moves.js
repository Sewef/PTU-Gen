const PokemonGenerator = require('./utils/pokemonGenerator');

// Test pour vérifier les moves
(async () => {
  try {
    console.log('Initializing datasets...');
    const { initializeDatasets } = require('./utils/pokemonGenerator');
    await initializeDatasets();
    
    console.log('Generating a test Pokémon...');
    const pokemon = await PokemonGenerator.generatePokemon({
      species: 'Blastoise',
      level: 50
    });
    
    console.log('\n=== Pokémon Generated ===');
    console.log(`Name: ${pokemon.name}`);
    console.log(`Level: ${pokemon.level}`);
    console.log(`\n=== Moves ===`);
    pokemon.moves.forEach((move, index) => {
      console.log(`\n${index + 1}. ${move.name}`);
      console.log(`   Full object:`, JSON.stringify(move, null, 2));
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
})();
