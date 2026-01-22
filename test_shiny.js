const PG = require('./utils/pokemonGenerator');

async function testShinyRate() {
  await PG.initializeDatasets();
  
  let shinyCount = 0;
  const total = 100;
  
  for (let i = 0; i < total; i++) {
    const pokemon = await PG.generatePokemon({ level: 50 });
    if (pokemon.shiny) shinyCount++;
  }
  
  console.log(`Generated ${total} Pokémon`);
  console.log(`Shinies: ${shinyCount} (${(shinyCount/total*100).toFixed(2)}%)`);
  console.log(`Expected: ~1 (1%)`);
}

testShinyRate().catch(e => console.error(e));
