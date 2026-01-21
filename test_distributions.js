const gen = require('./utils/pokemonGenerator.js');

// Test RANDOM distribution
console.log('=== Testing RANDOM Distribution ===');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, distribution: 'RANDOM' });
  console.log(`Pikachu #${i+1} (RANDOM):`, Object.entries(p.stats).sort((a,b) => b[1] - a[1]).map(s => `${s[0]}:${s[1]}`).join(' >= '));
}

console.log('\n=== Testing BALANCED Distribution ===');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, distribution: 'BALANCED' });
  console.log(`Pikachu #${i+1} (BALANCED):`, Object.entries(p.stats).sort((a,b) => b[1] - a[1]).map(s => `${s[0]}:${s[1]}`).join(' >= '));
}

console.log('\n=== Testing MINMAXED Distribution ===');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, distribution: 'MINMAXED' });
  console.log(`Pikachu #${i+1} (MINMAXED):`, Object.entries(p.stats).sort((a,b) => b[1] - a[1]).map(s => `${s[0]}:${s[1]}`).join(' >= '));
}

console.log('\n=== Testing Base Relation Preservation (BALANCED - equal base stats stay equal) ===');
const p1 = gen.generatePokemon({ species: 'Pikachu', level: 50, distribution: 'BALANCED' });
console.log('Pikachu (BALANCED):', Object.entries(p1.stats).sort((a,b) => b[1] - a[1]).map(s => `${s[0]}:${s[1]}`).join(' >= '));
