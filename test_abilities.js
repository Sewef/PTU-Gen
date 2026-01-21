const PokemonGenerator = require('./utils/pokemonGenerator');

// Test pour vérifier les abilities
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
    console.log(`\n=== Abilities ===`);
    console.log(JSON.stringify(pokemon.abilities, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
})();
