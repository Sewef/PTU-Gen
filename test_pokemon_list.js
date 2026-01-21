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

console.log('=== Testing Pokemon List API ===\n');

makeRequest('/api/pokemon/list', (data, error) => {
  if (error) {
    console.log(`❌ Error: ${error.message}\n`);
  } else if (data && data.species && Array.isArray(data.species)) {
    console.log(`✅ Pokémon list loaded successfully`);
    console.log(`   Total species: ${data.count}`);
    console.log(`   First 10 Pokémon:`);
    data.species.slice(0, 10).forEach(name => {
      console.log(`   - ${name}`);
    });
    
    // Test autocomplete search
    console.log(`\n   Pokémon containing "Pika": ${data.species.filter(p => p.toLowerCase().includes('pika')).join(', ')}`);
    console.log(`   Pokémon containing "Char": ${data.species.filter(p => p.toLowerCase().includes('char')).join(', ')}`);
    console.log(`   Pokémon containing "Dragon": ${data.species.filter(p => p.toLowerCase().includes('dragon')).join(', ')}`);
  } else {
    console.log(`❌ Invalid response\n`);
  }

  console.log('\n✅ Pokemon list API test completed!');
  process.exit(0);
});

setTimeout(() => {
  console.error('❌ Timeout - server not responding');
  process.exit(1);
}, 5000);
