const P = require('./utils/pokemonGenerator');

(async () => {
  await P.initializeDatasets();
  
  const pokemon = await P.generatePokemon({ species: 'Pikachu', level: 10 });
  console.log('Pokemon:', pokemon.name);
  console.log('Moves count:', pokemon.moves.length);
  console.log('\nMoves:');
  pokemon.moves.forEach((m, i) => {
    console.log((i+1) + '. ' + m.name + ' - type: ' + (m.type || 'MISSING') + ', damageBase: ' + (m.damageBase ? m.damageBase.short : 'N/A'));
  });
  
  // Test a specific move
  console.log('\nDirect lookup test:');
  const tackleMove = P.getMoveDefinition('Tackle');
  console.log('Tackle found:', tackleMove ? 'YES' : 'NO');
  if (tackleMove) {
    console.log('Tackle type:', tackleMove.Type);
  }
})().catch(e => console.error('Error:', e.message));
