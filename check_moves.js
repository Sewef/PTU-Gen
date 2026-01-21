const PokemonGenerator = require('./utils/pokemonGenerator.js');

async function checkMoveDB() {
  try {
    await PokemonGenerator.initializeDatasets();
    await PokemonGenerator.switchDataset('core');
    
    // Access the module-level movesDatabase via getMoveDefinition
    const tackleMove = PokemonGenerator.getMoveDefinition('Tackle');
    console.log('\nTackle move:', JSON.stringify(tackleMove, null, 2));
    
    // Now let's check what happens when selecting moves
    const squirtle = await PokemonGenerator.generatePokemon({ species: 'Squirtle', level: 5 });
    
    console.log('\nFirst move returned:');
    console.log('Move object keys:', Object.keys(squirtle.moves[0]));
    console.log('Move object:', JSON.stringify(squirtle.moves[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

checkMoveDB();
