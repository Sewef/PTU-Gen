const PG = require('./utils/pokemonGenerator');

async function testShinyOdds() {
  await PG.initializeDatasets();
  
  let shinyCount = 0;
  const total = 200;
  
  for (let i = 0; i < total; i++) {
    const pokemon = await PG.generatePokemon({ level: 50, shinyodds: 5 });
    if (pokemon.shiny) shinyCount++;
  }
  
  console.log('Test avec shinyodds: 5%');
  console.log(`Generated ${total} Pokémon`);
  console.log(`Shinies: ${shinyCount} (${(shinyCount/total*100).toFixed(2)}%)`);
  console.log(`Expected: ~${Math.round(total * 0.05)} (5%)`);
}

testShinyOdds().catch(e => console.error(e));
