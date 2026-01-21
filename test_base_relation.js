const gen = require('./utils/pokemonGenerator.js');

// Check Pikachu base stats to see which are equal
const species = require('./data/pokedex_core.min.json').find(p => p.Species === 'Pikachu');
console.log('Pikachu Base Stats:', species['Base Stats']);

// Test multiple generations with BALANCED to verify equal base stats stay equal
console.log('\n=== Testing Base Relation Preservation (BALANCED mode) ===');
for (let i = 0; i < 5; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, distribution: 'BALANCED' });
  const stats = p.stats;
  console.log(`Generation ${i+1}: HP=${stats.HP}, atk=${stats.atk}, def=${stats.def}, spA=${stats.spA}, spD=${stats.spD}, spe=${stats.spe}`);
}

console.log('\n=== Testing Base Relation Preservation (MINMAXED mode) ===');
for (let i = 0; i < 5; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, distribution: 'MINMAXED' });
  const stats = p.stats;
  console.log(`Generation ${i+1}: HP=${stats.HP}, atk=${stats.atk}, def=${stats.def}, spA=${stats.spA}, spD=${stats.spD}, spe=${stats.spe}`);
}
