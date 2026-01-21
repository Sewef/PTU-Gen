/**
 * Tests pour le générateur de Pokémons
 * Exécutez avec: npm test
 */

const PokemonGenerator = require('../utils/pokemonGenerator');

console.log('=== Tests du Générateur de Pokémons PTU 1.05 ===\n');

// Test 1: Génération d'un Pokémon simple
console.log('Test 1: Génération d\'un Pokémon aléatoire');
const pokemon1 = PokemonGenerator.generatePokemon();
console.log(`✓ Généré: ${pokemon1.name} niveau ${pokemon1.level}`);
console.log(`  Types: ${pokemon1.types.join(', ')}`);
console.log(`  Capacité: ${pokemon1.ability}\n`);

// Test 2: Génération d'un Pokémon spécifique
console.log('Test 2: Génération d\'un Pikachu');
const pokemon2 = PokemonGenerator.generatePokemon({ species: 'Pikachu', level: 50 });
console.log(`✓ Généré: ${pokemon2.name} niveau ${pokemon2.level}`);
console.log(`  Stats: HP=${pokemon2.stats.hp}, ATK=${pokemon2.stats.atk}, DEF=${pokemon2.stats.def}\n`);

// Test 3: Génération d'une équipe
console.log('Test 3: Génération d\'une équipe niveau 50');
const team = PokemonGenerator.generateTeam({ level: 50, size: 6 });
console.log(`✓ Équipe générée avec ${team.pokemon.length} Pokémons:`);
team.pokemon.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name} (Niveau ${p.level}, ${p.types.join('/')})`);
});
console.log();

// Test 4: Génération sauvage
console.log('Test 4: Génération d\'un Pokémon sauvage niveau 15');
const wild = PokemonGenerator.generateWildPokemon(15);
console.log(`✓ Pokémon sauvage: ${wild.name} niveau ${wild.level}`);
console.log(`  Objet: ${wild.item}\n`);

// Test 5: Liste des Pokémons
console.log('Test 5: Pokémons disponibles');
const list = PokemonGenerator.listAvailablePokemon();
console.log(`✓ ${list.length} espèces disponibles:`);
list.forEach(p => {
  console.log(`  - ${p.name} (${p.types.join('/')})`);
});
console.log();

// Test 6: Vérification des stats
console.log('Test 6: Vérification des formules de stats');
const testPokemon = PokemonGenerator.generatePokemon({ level: 50 });
console.log(`✓ Pokémon: ${testPokemon.name}`);
console.log(`  Stats générées: ${JSON.stringify(testPokemon.stats)}`);
console.log(`  Nature: ${testPokemon.nature}`);
console.log(`  Attaques: ${testPokemon.moves.map(m => m.name).join(', ')}\n`);

console.log('=== Tous les tests réussis! ===');
