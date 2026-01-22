const { initializeDatasets } = require('./utils/pokemonGenerator');
const PokemonGenerator = require('./utils/pokemonGenerator');

// Initialize datasets
initializeDatasets();

// Wait for dataset to load, then generate
setTimeout(async () => {
  try {
    const pokemon = await PokemonGenerator.generatePokemon({ species: 'Pikachu' });

    console.log('\n=== Generated Pokémon ===');
    console.log(`ID: ${pokemon.id}`);
    console.log(`Name: ${pokemon.name}`);
    console.log(`Gender: ${pokemon.otherInfo?.gender}`);
    console.log(`Size Category: ${pokemon.otherInfo?.sizeCategory}`);
    console.log(`Weight Class: ${pokemon.otherInfo?.weightClass}`);
    console.log(`Diet: ${pokemon.otherInfo?.diet}`);
    console.log(`Habitat: ${pokemon.otherInfo?.habitat}`);
    console.log('\nFull otherInfo:');
    console.log(JSON.stringify(pokemon.otherInfo, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}, 1000);
