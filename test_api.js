const http = require('http');

function testAPI() {
  console.log('=== Testing PTU Generator API with Distribution Modes ===\n');

  // Test helper function
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

  let testCount = 0;
  const testSequence = [
    {
      path: '/api/pokemon/generate?species=Pikachu&level=50',
      name: 'Default RANDOM distribution'
    },
    {
      path: '/api/pokemon/generate?species=Pikachu&level=50&distribution=BALANCED',
      name: 'BALANCED distribution'
    },
    {
      path: '/api/pokemon/generate?species=Pikachu&level=50&distribution=MINMAXED',
      name: 'MINMAXED distribution'
    },
    {
      path: '/api/pokemon/generate?species=Pikachu&level=50&distribution=RANDOM',
      name: 'Explicit RANDOM distribution'
    }
  ];

  function runNextTest() {
    if (testCount >= testSequence.length) {
      console.log('\n✅ All API tests completed!');
      process.exit(0);
    }

    const test = testSequence[testCount];
    console.log(`Test ${testCount + 1}: ${test.name}`);
    console.log(`Path: ${test.path}`);

    makeRequest(test.path, (data, error) => {
      if (error) {
        console.log(`❌ Error: ${error.message}\n`);
      } else if (data && data.stats) {
        console.log(`✓ Stats: HP=${data.stats.HP}, atk=${data.stats.atk}, def=${data.stats.def}, spA=${data.stats.spA}, spD=${data.stats.spD}, spe=${data.stats.spe}`);
        console.log(`  Nature: ${data.nature.name} (+${data.nature.raise}/-${data.nature.lower})\n`);
      } else {
        console.log(`❌ Invalid response\n`);
      }

      testCount++;
      runNextTest();
    });
  }

  runNextTest();
}

// Wait for server to start
setTimeout(testAPI, 2000);
