// Test script to verify the moves API works correctly

const http = require('http');

// Test the moves API endpoint
const testMovesAPI = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/pokemon/moves/pikachu',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✓ Moves API Response:');
          console.log(`  - Level Up Moves: ${parsed.levelUp?.length || 0}`);
          console.log(`  - TM/HM Moves: ${parsed.tm?.length || 0}`);
          console.log(`  - Tutor Moves: ${parsed.tutor?.length || 0}`);
          
          if (parsed.levelUp && parsed.levelUp.length > 0) {
            console.log(`  First Level Up Move: ${parsed.levelUp[0].name} (Lv. ${parsed.levelUp[0].level})`);
          }
          resolve(true);
        } catch (err) {
          console.error('✗ Failed to parse response:', err.message);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.error('✗ Request failed:', err.message);
      reject(err);
    });

    req.end();
  });
};

// Run test
console.log('Testing Moves API...\n');
testMovesAPI()
  .then(() => {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Test failed:', err.message);
    process.exit(1);
  });
