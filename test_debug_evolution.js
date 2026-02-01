const PokemonGenerator = require('./utils/pokemonGenerator');

async function testDebug() {
  try {
    console.log('Debugging forceEvolution...\n');
    
    // Test simple: Solosis at level 50 with forceEvolution should become Reuniclus
    console.log('Test 1: Solosis at level 50 with forceEvolution');
    const pokemon1 = await PokemonGenerator.generatePokemon({
      species: 'Solosis',
      level: 50,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon1.name}`);
    console.log(`Expected: Reuniclus`);
    console.log(`Evolution chain exists: ${pokemon1.Evolution ? 'YES' : 'NO'}`);
    if (pokemon1.Evolution) {
      console.log(`Evolution stages: ${pokemon1.Evolution.map(e => e.Species).join(' -> ')}`);
    }
    console.log();
    
    // Test 2: Random Pokemon with level 50 - should show various stages
    console.log('Test 2: Random Pokemon at level 50 with forceEvolution');
    for (let i = 0; i < 5; i++) {
      const pokemon = await PokemonGenerator.generatePokemon({
        level: 50,
        forceevolution: true,
        dataset: 'homebrew'
      });
      console.log(`  - ${pokemon.name} (has evolution chain: ${pokemon.Evolution ? 'YES' : 'NO'})`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testDebug();
