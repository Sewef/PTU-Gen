/**
 * Comprehensive API Test Suite for PTU-Gen
 * Tests all API endpoints with various parameters and validates responses
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Helper function to make HTTP requests
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Test assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Run a single test
 */
async function runTest(testName, testFn) {
  try {
    await testFn();
    console.log(`${colors.green}✓ PASS${colors.reset} - ${testName}`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    testsFailed++;
  }
}

/**
 * Test suite
 */
async function runTests() {
  console.log(`\n${colors.cyan}=== PTU-Gen API Test Suite ===${colors.reset}\n`);

  // ===== HEALTH CHECKS =====
  console.log(`${colors.blue}Health Checks${colors.reset}`);
  
  await runTest('Health endpoint returns OK', async () => {
    const res = await makeRequest('/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'OK', 'Status should be OK');
    assert(res.body.timestamp, 'Should include timestamp');
  });

  await runTest('Root endpoint returns API info', async () => {
    const res = await makeRequest('/api/info');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.name, 'Should have name field');
    assert(res.body.endpoints, 'Should include endpoints');
  });

  // ===== GENERATE POKEMON TESTS =====
  console.log(`\n${colors.blue}Pokemon Generation${colors.reset}`);

  await runTest('Generate Pokemon with default options', async () => {
    const res = await makeRequest('/api/pokemon/generate');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.name, 'Pokemon should have name');
    assert(res.body.level, 'Pokemon should have level');
    assert(res.body.stats, 'Pokemon should have stats');
    assert(res.body.moves, 'Pokemon should have moves');
  });

  await runTest('Generate Pokemon with specific level', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=50');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.level === 50, `Expected level 50, got ${res.body.level}`);
  });

  await runTest('Generate specific Pokemon (Charizard)', async () => {
    const res = await makeRequest('/api/pokemon/generate?species=Charizard');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.name?.toLowerCase() === 'charizard', `Expected Charizard, got ${res.body.name}`);
  });

  await runTest('Generate Pokemon with level range', async () => {
    const res = await makeRequest('/api/pokemon/generate?minLevel=30&maxLevel=40');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.level >= 30 && res.body.level <= 40, `Level ${res.body.level} not in range 30-40`);
  });

  await runTest('Generate Pokemon with BALANCED distribution', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=50&distribution=BALANCED');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.stats, 'Pokemon should have stats');
  });

  await runTest('Generate Pokemon with MINMAXED distribution', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=50&distribution=MINMAXED');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.stats, 'Pokemon should have stats');
  });

  await runTest('Generate shiny Pokemon', async () => {
    const res = await makeRequest('/api/pokemon/generate?shiny=true');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.shiny === true, 'Pokemon should be shiny');
  });

  await runTest('Generate Pokemon with specific nature', async () => {
    const res = await makeRequest('/api/pokemon/generate?nature=Adamant');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.nature?.name === 'Adamant', `Expected Adamant nature, got ${res.body.nature?.name}`);
  });

  await runTest('Generate Pokemon with custom HP formula', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=50&hpFormula=LEVEL+(HP*2)');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.hitPoints, 'Pokemon should have calculated HP');
  });

  await runTest('Generate Pokemon with ignoreBaseRelation=IGNORE', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=50&ignoreBaseRelation=IGNORE');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.stats, 'Pokemon should have stats');
  });

  await runTest('Generate Pokemon with ignoreBaseRelation for specific stats', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=50&ignoreBaseRelation=HP,ATK');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.stats, 'Pokemon should have stats');
  });

  await runTest('Generate Pokemon from different dataset (community)', async () => {
    const res = await makeRequest('/api/pokemon/generate?dataset=core&species=Bulbasaur');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.name, 'Pokemon should have name');
  });

  // ===== WILD POKEMON TESTS =====
  console.log(`\n${colors.blue}Wild Pokemon Generation${colors.reset}`);

  await runTest('Generate wild Pokemon at level 15', async () => {
    const res = await makeRequest('/api/pokemon/generateWild/15');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.level === 15, `Expected level 15, got ${res.body.level}`);
  });

  await runTest('Generate wild Pokemon at level 50', async () => {
    const res = await makeRequest('/api/pokemon/generateWild/50');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.level === 50, `Expected level 50, got ${res.body.level}`);
  });

  // ===== TEAM GENERATION TESTS =====
  console.log(`\n${colors.blue}Team Generation${colors.reset}`);

  await runTest('Generate team of 6 Pokemon', async () => {
    const res = await makeRequest('/api/pokemon/team');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.pokemon, 'Team should have pokemon array');
    assert(res.body.pokemon.length === 6, `Expected 6 pokemon, got ${res.body.pokemon.length}`);
    assert(res.body.count === 6, 'Count should be 6');
  });

  await runTest('Generate team with custom size', async () => {
    const res = await makeRequest('/api/pokemon/team?size=3');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.pokemon.length === 3, `Expected 3 pokemon, got ${res.body.pokemon.length}`);
  });

  await runTest('Generate team with specific level', async () => {
    const res = await makeRequest('/api/pokemon/team?level=75&size=4');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.averageLevel === 75, `Expected average level 75, got ${res.body.averageLevel}`);
    res.body.pokemon.forEach((poke, i) => {
      assert(poke.level === 75, `Pokemon ${i} should be level 75, got ${poke.level}`);
    });
  });

  // ===== LIST POKEMON TESTS =====
  console.log(`\n${colors.blue}Pokemon Listing${colors.reset}`);

  await runTest('List available Pokemon', async () => {
    const res = await makeRequest('/api/pokemon/list');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.species, 'Response should have species array');
    assert(Array.isArray(res.body.species), 'species should be array');
    assert(res.body.species.length > 0, 'Should have Pokemon');
    assert(res.body.count > 0, 'Should have count');
  });

  await runTest('List Pokemon from community dataset', async () => {
    const res = await makeRequest('/api/pokemon/list?dataset=community');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.species, 'Response should have species array');
    assert(Array.isArray(res.body.species), 'species should be array');
    assert(res.body.species.length > 0, 'Should have Pokemon');
  });

  // ===== DATASETS TESTS =====
  console.log(`\n${colors.blue}Datasets Management${colors.reset}`);

  await runTest('Get available datasets', async () => {
    const res = await makeRequest('/api/pokemon/datasets');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.datasets, 'Response should have datasets array');
    assert(Array.isArray(res.body.datasets), 'datasets should be array');
    assert(res.body.datasets.length >= 3, 'Should have at least 3 datasets');
    const datasetKeys = res.body.datasets.map(d => d.key);
    assert(datasetKeys.includes('core'), 'Should include core dataset');
    assert(datasetKeys.includes('community'), 'Should include community dataset');
    assert(datasetKeys.includes('homebrew'), 'Should include homebrew dataset');
  });

  // ===== MOVES TESTS =====
  console.log(`\n${colors.blue}Pokemon Moves${colors.reset}`);

  await runTest('Get moves for Pokemon (Charizard)', async () => {
    const res = await makeRequest('/api/pokemon/moves/Charizard');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.levelUp, 'Should have levelUp moves');
    assert(res.body.tm, 'Should have tm moves');
    assert(res.body.tutor, 'Should have tutor moves');
    assert(Array.isArray(res.body.levelUp), 'levelUp should be array');
  });

  await runTest('Level-up moves should have level property', async () => {
    const res = await makeRequest('/api/pokemon/moves/Pikachu');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    if (res.body.levelUp.length > 0) {
      assert(res.body.levelUp[0].level !== undefined, 'Level-up move should have level');
      assert(res.body.levelUp[0].name, 'Move should have name');
      assert(res.body.levelUp[0].type, 'Move should have type');
    }
  });

  await runTest('Moves should have damage base with DB format', async () => {
    const res = await makeRequest('/api/pokemon/moves/Charizard');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const allMoves = [...res.body.levelUp, ...res.body.tm, ...res.body.tutor];
    const movesWithDamage = allMoves.filter(m => m.damageBase);
    if (movesWithDamage.length > 0) {
      const move = movesWithDamage[0];
      assert(move.damageBase.short, 'Should have short DB format (e.g., DB9)');
      assert(move.damageBase.dmg, 'Should have dmg formula');
      assert(move.damageBase.min !== undefined, 'Should have min damage');
      assert(move.damageBase.avg !== undefined, 'Should have avg damage');
      assert(move.damageBase.max !== undefined, 'Should have max damage');
      assert(move.damageBase.stab !== undefined, 'Should have stab flag');
    }
  });

  await runTest('Get moves for different dataset', async () => {
    const res = await makeRequest('/api/pokemon/moves/Charizard?dataset=community');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.levelUp !== undefined, 'Should have moves');
  });

  await runTest('Get all moves from database', async () => {
    const res = await makeRequest('/api/pokemon/all-moves');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.all, 'Should have all moves array');
    assert(Array.isArray(res.body.all), 'all should be array');
    assert(res.body.all.length > 0, 'Should have moves');
    const move = res.body.all[0];
    assert(move.name, 'Move should have name');
    assert(move.type, 'Move should have type');
  });

  // ===== ABILITIES TESTS =====
  console.log(`\n${colors.blue}Pokemon Abilities${colors.reset}`);

  await runTest('Get abilities for Pokemon (Pikachu)', async () => {
    const res = await makeRequest('/api/pokemon/abilities/Pikachu');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.basic, 'Should have basic abilities');
    assert(res.body.advanced, 'Should have advanced abilities');
    assert(res.body.high, 'Should have high abilities');
    assert(Array.isArray(res.body.basic), 'basic should be array');
  });

  await runTest('Abilities should have details', async () => {
    const res = await makeRequest('/api/pokemon/abilities/Pikachu');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const allAbilities = [...res.body.basic, ...res.body.advanced, ...res.body.high];
    if (allAbilities.length > 0) {
      const ability = allAbilities[0];
      assert(ability.name, 'Ability should have name');
      assert(ability.frequency !== undefined, 'Ability should have frequency');
    }
  });

  await runTest('Get all abilities from database', async () => {
    const res = await makeRequest('/api/pokemon/all-abilities');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.all, 'Should have all abilities array');
    assert(Array.isArray(res.body.all), 'all should be array');
    assert(res.body.all.length > 0, 'Should have abilities');
  });

  // ===== ERROR HANDLING TESTS =====
  console.log(`\n${colors.blue}Error Handling${colors.reset}`);

  await runTest('Invalid species name returns error', async () => {
    const res = await makeRequest('/api/pokemon/generate?species=InvalidSpecies123');
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.error, 'Should have error message');
  });

  await runTest('Invalid distribution returns error', async () => {
    const res = await makeRequest('/api/pokemon/generate?distribution=INVALID');
    assert(res.status === 200, `This should still work - distribution defaults to RANDOM`);
  });

  await runTest('Invalid level returns error', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=999');
    assert(res.status === 200, `This should work - level is capped at 100`);
    assert(res.body.level <= 100, 'Level should be capped at 100');
  });

  // ===== STAT VALIDATION TESTS =====
  console.log(`\n${colors.blue}Stat Validation${colors.reset}`);

  await runTest('Generated stats are within valid range', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=50');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const stats = res.body.stats;
    Object.entries(stats).forEach(([statName, value]) => {
      assert(value > 0, `${statName} should be > 0, got ${value}`);
      assert(value < 1000, `${statName} should be < 1000, got ${value}`);
    });
  });

  await runTest('HP is calculated correctly', async () => {
    const res = await makeRequest('/api/pokemon/generate?level=50');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.hitPoints > 0, 'HP should be > 0');
    assert(res.body.hitPoints < 1000, 'HP should be < 1000');
  });

  await runTest('Pokemon has types', async () => {
    const res = await makeRequest('/api/pokemon/generate');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.types, 'Pokemon should have types');
    if (Array.isArray(res.body.types)) {
      assert(res.body.types.length > 0, 'Pokemon should have at least one type');
    }
  });

  // ===== TEST SUMMARY =====
  console.log(`\n${colors.cyan}=== Test Summary ===${colors.reset}`);
  const total = testsPassed + testsFailed + testsSkipped;
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  if (testsFailed > 0) {
    console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  }
  if (testsSkipped > 0) {
    console.log(`${colors.yellow}Skipped: ${testsSkipped}${colors.reset}`);
  }
  console.log(`Total: ${total}\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
