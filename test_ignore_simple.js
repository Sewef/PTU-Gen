const gen = require('./utils/pokemonGenerator.js');

console.log('=== Test ignoreBaseRelation Feature ===\n');

// Pikachu base stats: HP=4, Attack=6, Defense=4, SpA=5, SpD=5, Speed=9

console.log('1. Normal (WITH Base Relation):');
const p1 = gen.generatePokemon({ species: 'Pikachu', level: 50 });
console.log('Stats:', p1.stats);

console.log('\n2. With ignoreBaseRelation=IGNORE:');
const p2 = gen.generatePokemon({ species: 'Pikachu', level: 50, ignoreBaseRelation: 'IGNORE' });
console.log('Stats:', p2.stats);

console.log('\n3. With ignoreBaseRelation=HP,DEF:');
const p3 = gen.generatePokemon({ species: 'Pikachu', level: 50, ignoreBaseRelation: 'HP,DEF' });
console.log('Stats:', p3.stats);
