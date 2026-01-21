const http = require('http');

// Test that the HTML page is served
function testWebInterface() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (data.includes('<!DOCTYPE html') && data.includes('PTU Pokémon Generator')) {
        console.log('✅ Web interface is properly served');
        console.log(`   Page size: ${(data.length / 1024).toFixed(2)} KB`);
        console.log('   Check: http://localhost:3000');
      } else {
        console.log('❌ Web interface not found');
      }
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  });

  req.end();
}

// Wait for server and test
setTimeout(testWebInterface, 1500);
