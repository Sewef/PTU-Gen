const http = require('http');

function makeRequest(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        callback(JSON.parse(data));
      } catch (e) {
        callback(null, e);
      }
    });
  });

  req.on('error', (error) => {
    callback(null, error);
  });
  req.end();
}

console.log('=== Testing API with HP Calculation ===\n');

let testCount = 0;

function runNextTest() {
  const tests = [
    {
      path: '/api/pokemon/generate?species=Pikachu&level=50',
      name: 'Default formula'
    },
    {
      path: '/api/pokemon/generate?species=Pikachu&level=50&hpFormula=LEVEL%2BHP',
      name: 'Custom formula: LEVEL + HP'
    },
    {
      path: '/api/pokemon/generate?species=Pikachu&level=50&hpFormula=(LEVEL*2)%2B(HP*2)',
      name: 'Custom formula: (LEVEL*2)+(HP*2)'
    }
  ];

  if (testCount >= tests.length) {
    console.log('\n✅ All API tests completed!');
    process.exit(0);
  }

  const test = tests[testCount];
  console.log(`Test ${testCount + 1}: ${test.name}`);

  makeRequest(test.path, (data, error) => {
    if (error) {
      console.log(`❌ Error: ${error.message}\n`);
    } else if (data && data.hitPoints !== undefined) {
      console.log(`✓ Level: ${data.level}, HP stat: ${data.stats.HP}, Hit Points: ${data.hitPoints}\n`);
    } else {
      console.log(`❌ Invalid response\n`);
    }

    testCount++;
    runNextTest();
  });
}

runNextTest();

setTimeout(() => {
  console.error('Timeout - server not responding');
  process.exit(1);
}, 5000);
