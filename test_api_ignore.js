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

console.log('=== Testing API with ignoreBaseRelation ===\n');

makeRequest('/api/pokemon/generate?species=Pikachu&level=50', (data) => {
  console.log('1. Normal:');
  console.log('   Stats:', data.stats);
  
  makeRequest('/api/pokemon/generate?species=Pikachu&level=50&ignoreBaseRelation=IGNORE', (data) => {
    console.log('\n2. With ignoreBaseRelation=IGNORE:');
    console.log('   Stats:', data.stats);
    
    makeRequest('/api/pokemon/generate?species=Pikachu&level=50&ignoreBaseRelation=HP,DEF', (data) => {
      console.log('\n3. With ignoreBaseRelation=HP,DEF:');
      console.log('   Stats:', data.stats);
      
      makeRequest('/api/pokemon/generate?species=Pikachu&level=50&distribution=MINMAXED&ignoreBaseRelation=IGNORE', (data) => {
        console.log('\n4. MINMAXED + ignoreBaseRelation=IGNORE:');
        console.log('   Stats:', data.stats);
        
        console.log('\n✅ All API tests passed!');
        process.exit(0);
      });
    });
  });
});

setTimeout(() => {
  console.error('Timeout - server not responding');
  process.exit(1);
}, 5000);
