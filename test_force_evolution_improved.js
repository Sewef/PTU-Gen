const PokemonGenerator = require('./utils/pokemonGenerator');

async function testForceEvolutionImproved() {
  try {
    console.log('Testing improved forceEvolution option...\n');
    
    // Test 1: Starting from base stage (Pichu) at level 40 -> should become Raichu
    console.log('Test 1: Pichu with forceEvolution at level 40 (should evolve)');
    const pokemon1 = await PokemonGenerator.generatePokemon({
      species: 'Pichu',
      level: 40,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon1.name}`);
    console.log(`Expected: Raichu\n`);
    
    // Test 2: Starting from intermediate stage (Raichu) at level 50 -> should stay Raichu
    console.log('Test 2: Raichu with forceEvolution at level 50 (should stay Raichu - last stage)');
    const pokemon2 = await PokemonGenerator.generatePokemon({
      species: 'Raichu',
      level: 50,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon2.name}`);
    console.log(`Expected: Raichu\n`);
    
    // Test 3: Starting from stage 2 (Ivysaur) at level 30 -> should become Venusaur
    console.log('Test 3: Ivysaur with forceEvolution at level 30 (should evolve to Venusaur)');
    const pokemon3 = await PokemonGenerator.generatePokemon({
      species: 'Ivysaur',
      level: 30,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon3.name}`);
    console.log(`Expected: Venusaur\n`);
    
    // Test 4: Starting from stage 2 (Ivysaur) at level 10 -> should stay Ivysaur (level too low for stage 3)
    console.log('Test 4: Ivysaur with forceEvolution at level 10 (level too low, should stay Ivysaur)');
    const pokemon4 = await PokemonGenerator.generatePokemon({
      species: 'Ivysaur',
      level: 10,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon4.name}`);
    console.log(`Expected: Ivysaur\n`);
    
    // Test 5: Charmeleon at level 36 -> should become Charizard
    console.log('Test 5: Charmeleon with forceEvolution at level 36 (should evolve to Charizard)');
    const pokemon5 = await PokemonGenerator.generatePokemon({
      species: 'Charmeleon',
      level: 36,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon5.name}`);
    console.log(`Expected: Charizard\n`);
    
    // Test 6: Random with forceEvolution at level 50
    console.log('Test 6: Random Pokémon with forceEvolution at level 50');
    const pokemon6 = await PokemonGenerator.generatePokemon({
      level: 50,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon6.name}`);
    console.log(`(Should be an evolved form based on level 50)\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testForceEvolutionImproved();
