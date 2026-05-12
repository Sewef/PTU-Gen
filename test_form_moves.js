const P = require('./utils/pokemonGenerator');

(async () => {
  await P.initializeDatasets();
  
  try {
    console.log('Test 1: Rattata (Alola) moves');
    const alolaMoves = await P.getAvailableMovesForSpecies('Rattata (Alola)');
    console.log('✓ Found moves for Rattata (Alola):', alolaMoves.levelUp.length, 'level-up moves');
    
    console.log('\nTest 2: Rattata (Alola) abilities');
    const alolaAbilities = await P.getAvailableAbilitiesForSpecies('Rattata (Alola)');
    console.log('✓ Found abilities for Rattata (Alola):', (alolaAbilities.basic.length + alolaAbilities.advanced.length + alolaAbilities.high.length), 'total abilities');
    
    console.log('\nTest 3: Regular Pikachu moves');
    const pikachuMoves = await P.getAvailableMovesForSpecies('Pikachu');
    console.log('✓ Found moves for Pikachu:', pikachuMoves.levelUp.length, 'level-up moves');
    
    console.log('\nTest 4: Rotom (Heat Rotom) moves');
    const rotomMoves = await P.getAvailableMovesForSpecies('Rotom (Heat Rotom)');
    console.log('✓ Found moves for Rotom (Heat Rotom):', rotomMoves.levelUp.length, 'level-up moves');
    
  } catch (e) {
    console.error('✗ Error:', e.message);
  }
})();
