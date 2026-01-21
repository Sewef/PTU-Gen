const gen = require('./utils/pokemonGenerator.js');

console.log('=== Testing ignoreBaseRelation Option ===\n');

// Pikachu base stats: HP=4, Attack=6, Defense=4, SpA=5, SpD=5, Speed=9
// Equal groups: (HP,DEF) at 4, (SPA,SPD) at 5, (SPE) at 9

console.log('1. Default (WITH Base Relation - equal stats stay equal):');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50 });
  console.log(`  Gen ${i+1}: HP=${p.stats.HP}, atk=${p.stats.atk}, def=${p.stats.def}, spA=${p.stats.spA}, spD=${p.stats.spD}, spe=${p.stats.spe}`);
}

console.log('\n2. With ignoreBaseRelation=IGNORE (completely ignore Base Relation):');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, ignoreBaseRelation: 'IGNORE' });
  console.log(`  Gen ${i+1}: HP=${p.stats.HP}, atk=${p.stats.atk}, def=${p.stats.def}, spA=${p.stats.spA}, spD=${p.stats.spD}, spe=${p.stats.spe}`);
}

console.log('\n3. With ignoreBaseRelation=HP,DEF (ignore for HP and DEF only):');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, ignoreBaseRelation: 'HP,DEF' });
  console.log(`  Gen ${i+1}: HP=${p.stats.HP}, atk=${p.stats.atk}, def=${p.stats.def}, spA=${p.stats.spA}, spD=${p.stats.spD}, spe=${p.stats.spe}`);
}

console.log('\n4. With ignoreBaseRelation=SPA (ignore for SpA only):');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, ignoreBaseRelation: 'SPA' });
  console.log(`  Gen ${i+1}: HP=${p.stats.HP}, atk=${p.stats.atk}, def=${p.stats.def}, spA=${p.stats.spA}, spD=${p.stats.spD}, spe=${p.stats.spe}`);
}

console.log('\n5. BALANCED + ignoreBaseRelation=IGNORE:');
for (let i = 0; i < 3; i++) {
  const p = gen.generatePokemon({ species: 'Pikachu', level: 50, distribution: 'BALANCED', ignoreBaseRelation: 'IGNORE' });
  console.log(`  Gen ${i+1}: HP=${p.stats.HP}, atk=${p.stats.atk}, def=${p.stats.def}, spA=${p.stats.spA}, spD=${p.stats.spD}, spe=${p.stats.spe}`);
}
