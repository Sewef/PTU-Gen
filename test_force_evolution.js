const PokemonGenerator = require('./utils/pokemonGenerator');

async function testForceEvolution() {
  try {
    console.log('Testing forceEvolution option...\n');
    
    // Test 1: Bulbasaur at level 5 (should stay Bulbasaur)
    console.log('Test 1: Bulbasaur with forceEvolution at level 5');
    const pokemon1 = await PokemonGenerator.generatePokemon({
      species: 'Bulbasaur',
      level: 5,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon1.name}`);
    console.log(`Expected: Bulbasaur\n`);
    
    // Test 2: Bulbasaur at level 15 (should become Ivysaur)
    console.log('Test 2: Bulbasaur with forceEvolution at level 15');
    const pokemon2 = await PokemonGenerator.generatePokemon({
      species: 'Bulbasaur',
      level: 15,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon2.name}`);
    console.log(`Expected: Ivysaur\n`);
    
    // Test 3: Bulbasaur at level 30 (should become Venusaur)
    console.log('Test 3: Bulbasaur with forceEvolution at level 30');
    const pokemon3 = await PokemonGenerator.generatePokemon({
      species: 'Bulbasaur',
      level: 30,
      forceevolution: true,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon3.name}`);
    console.log(`Expected: Venusaur\n`);
    
    // Test 4: Without forceEvolution (should stay Bulbasaur at level 30)
    console.log('Test 4: Bulbasaur WITHOUT forceEvolution at level 30');
    const pokemon4 = await PokemonGenerator.generatePokemon({
      species: 'Bulbasaur',
      level: 30,
      dataset: 'homebrew'
    });
    console.log(`Result: ${pokemon4.name}`);
    console.log(`Expected: Bulbasaur\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testForceEvolution();
