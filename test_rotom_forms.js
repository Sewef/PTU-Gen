const P = require('./utils/pokemonGenerator');

(async () => {
  await P.initializeDatasets();
  
  // List all Rotom forms
  const allForms = P.getAllFormsOfSpecies('Rotom');
  console.log('Rotom forms available:');
  allForms.forEach(f => {
    const displayName = f.Form ? `${f.Species} (${f.Form})` : f.Species;
    console.log('  -', displayName);
  });
})();
