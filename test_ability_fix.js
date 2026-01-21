const PokemonGenerator = require('./utils/pokemonGenerator.js');

async function testAbilityFix() {
  try {
    // Initialize
    console.log('Initializing datasets...');
    await PokemonGenerator.initializeDatasets();
    
    // Switch to core dataset
    await PokemonGenerator.switchDataset('core');
    
    // Generate a Squirtle
    const squirtle = PokemonGenerator.generatePokemon('Squirtle', 5);
    
    console.log('\nGenerated Pokémon:');
    console.log('Name:', squirtle.name);
    console.log('Level:', squirtle.level);
    console.log('\nAbilities:');
    console.log(JSON.stringify(squirtle.abilities, null, 2));
    
    // Test getAbilityDefinition directly
    console.log('\n\nDirect getAbilityDefinition tests:');
    const torrents = PokemonGenerator.getAbilityDefinition('Torrent');
    console.log('Torrent:', torrents);
    
    const rainDish = PokemonGenerator.getAbilityDefinition('Rain Dish');
    console.log('Rain Dish:', rainDish);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAbilityFix();
