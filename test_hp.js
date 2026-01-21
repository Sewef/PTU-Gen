const gen = require('./utils/pokemonGenerator.js');

console.log('=== Testing Hit Points Calculation ===\n');

// Test 1: Default formula
console.log('1. Default formula (LEVEL + (HP * 3) + 10):');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50 });
  console.log(`   Level ${p.level}, HP stat: ${p.stats.HP}, Hit Points: ${p.hitPoints}`);
  console.log(`   Verification: ${p.level} + (${p.stats.HP} * 3) + 10 = ${p.level + (p.stats.HP * 3) + 10}`);
}

// Test 2: Custom formula - simpler
console.log('\n2. Custom formula (LEVEL + HP):');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, hpFormula: 'LEVEL + HP' });
  console.log(`   Level ${p.level}, HP stat: ${p.stats.HP}, Hit Points: ${p.hitPoints}`);
  console.log(`   Verification: ${p.level} + ${p.stats.HP} = ${p.level + p.stats.HP}`);
}

// Test 3: Custom formula - more HP points
console.log('\n3. Custom formula (LEVEL + (HP * 4)):');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, hpFormula: 'LEVEL + (HP * 4)' });
  console.log(`   Level ${p.level}, HP stat: ${p.stats.HP}, Hit Points: ${p.hitPoints}`);
  console.log(`   Verification: ${p.level} + (${p.stats.HP} * 4) = ${p.level + (p.stats.HP * 4)}`);
}

// Test 4: Custom formula - complex
console.log('\n4. Custom formula ((LEVEL * 2) + (HP * 2)):');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, hpFormula: '(LEVEL * 2) + (HP * 2)' });
  console.log(`   Level ${p.level}, HP stat: ${p.stats.HP}, Hit Points: ${p.hitPoints}`);
  console.log(`   Verification: (${p.level} * 2) + (${p.stats.HP} * 2) = ${(p.level * 2) + (p.stats.HP * 2)}`);
}

// Test 5: Verify with different levels
console.log('\n5. Default formula with different levels:');
for (const level of [10, 30, 50, 100]) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: level });
  console.log(`   Level ${p.level}, HP stat: ${p.stats.HP}, Hit Points: ${p.hitPoints}`);
}
