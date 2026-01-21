const PokemonGenerator = require('./utils/pokemonGenerator.js');

async function debug() {
  try {
    await PokemonGenerator.initializeDatasets();
    await PokemonGenerator.switchDataset('core');
    
    const pokemon = await PokemonGenerator.generatePokemon({ species: 'Squirtle', level: 5 });
    
    console.log('\n=== ABILITIES DEBUG ===');
    pokemon.abilities.forEach((ability, i) => {
      console.log(`\nAbility ${i}:`);
      console.log(JSON.stringify(ability, null, 2));
      console.log('Keys:', Object.keys(ability));
    });
    
    console.log('\n=== MOVES DEBUG ===');
    pokemon.moves.forEach((move, i) => {
      console.log(`\nMove ${i}:`);
      console.log(JSON.stringify(move, null, 2));
      console.log('Keys:', Object.keys(move));
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debug();
