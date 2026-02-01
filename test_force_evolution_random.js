const PokemonGenerator = require('./utils/pokemonGenerator');

async function testRandomWithForceEvolution() {
  try {
    console.log('Testing forceEvolution with RANDOM Pokémon selection...\n');
    
    // Generate multiple random Pokemon with forceEvolution
    const results = {};
    
    for (let i = 0; i < 30; i++) {
      const pokemon = await PokemonGenerator.generatePokemon({
        level: 50,
        forceevolution: true,
        dataset: 'homebrew'
      });
      
      // Check evolution chain
      const baseForm = pokemon.Evolution ? pokemon.Evolution.find(e => e.Stade === 1 || e.Stade === undefined) : null;
      const currentStage = pokemon.Evolution ? pokemon.Evolution.find(e => e.Species === pokemon.name) : null;
      
      const stage = currentStage?.Stade || 1;
      if (!results[stage]) {
        results[stage] = [];
      }
      results[stage].push(pokemon.name);
    }
    
    console.log('Distribution of evolution stages (from 30 random Pokemon at level 50):');
    for (const stage in results) {
      const count = results[stage].length;
      const percentage = ((count / 30) * 100).toFixed(1);
      console.log(`  Stage ${stage}: ${count} Pokemon (${percentage}%)`);
      console.log(`    Examples: ${results[stage].slice(0, 3).join(', ')}`);
    }
    
    console.log('\n\nNow testing WITHOUT forceEvolution for comparison:\n');
    
    const resultsNoForce = {};
    
    for (let i = 0; i < 30; i++) {
      const pokemon = await PokemonGenerator.generatePokemon({
        level: 50,
        forceevolution: false,
        dataset: 'homebrew'
      });
      
      // Check evolution chain
      const currentStage = pokemon.Evolution ? pokemon.Evolution.find(e => e.Species === pokemon.name) : null;
      
      const stage = currentStage?.Stade || 1;
      if (!resultsNoForce[stage]) {
        resultsNoForce[stage] = [];
      }
      resultsNoForce[stage].push(pokemon.name);
    }
    
    console.log('Distribution WITHOUT forceEvolution (from 30 random Pokemon at level 50):');
    for (const stage in resultsNoForce) {
      const count = resultsNoForce[stage].length;
      const percentage = ((count / 30) * 100).toFixed(1);
      console.log(`  Stage ${stage}: ${count} Pokemon (${percentage}%)`);
      console.log(`    Examples: ${resultsNoForce[stage].slice(0, 3).join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testRandomWithForceEvolution();
