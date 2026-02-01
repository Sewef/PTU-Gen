const PokemonGenerator = require('./utils/pokemonGenerator');

async function testRandomWithForceEvolutionV2() {
  try {
    console.log('Testing forceEvolution with RANDOM Pokémon at level 50...\n');
    
    // Generate multiple random Pokemon with forceEvolution and WITHOUT
    const withForce = {};
    const withoutForce = {};
    
    console.log('Generating 30 random Pokemon WITH forceEvolution...');
    for (let i = 0; i < 30; i++) {
      const pokemon = await PokemonGenerator.generatePokemon({
        level: 50,
        forceevolution: true,
        dataset: 'homebrew'
      });
      
      const name = pokemon.name;
      if (!withForce[name]) {
        withForce[name] = 0;
      }
      withForce[name]++;
    }
    
    console.log('Generating 30 random Pokemon WITHOUT forceEvolution...');
    for (let i = 0; i < 30; i++) {
      const pokemon = await PokemonGenerator.generatePokemon({
        level: 50,
        dataset: 'homebrew'
      });
      
      const name = pokemon.name;
      if (!withoutForce[name]) {
        withoutForce[name] = 0;
      }
      withoutForce[name]++;
    }
    
    // Get unique names
    const namesWithForce = Object.keys(withForce).sort();
    const namesWithoutForce = Object.keys(withoutForce).sort();
    
    console.log('\n' + '='.repeat(60));
    console.log('WITH forceEvolution:');
    console.log('='.repeat(60));
    console.log(`Total unique Pokemon: ${namesWithForce.length}`);
    namesWithForce.forEach(name => {
      console.log(`  ${name}: ${withForce[name]}x`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('WITHOUT forceEvolution:');
    console.log('='.repeat(60));
    console.log(`Total unique Pokemon: ${namesWithoutForce.length}`);
    namesWithoutForce.forEach(name => {
      console.log(`  ${name}: ${withoutForce[name]}x`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRandomWithForceEvolutionV2();
