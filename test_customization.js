// Test script for customization endpoints

async function testCustomizations() {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 Testing Customization Endpoints...\n');

  // Test 1: Load custom Pokemon
  console.log('📝 Test 1: Loading custom Pokémon...');
  try {
    const pokemonData = [
      {
        Number: 9001,
        Species: 'TestMon',
        Icon: 25,
        Legendary: false,
        'Basic Information': {
          Type: ['Normal'],
          'Basic Ability 1': 'Test Ability'
        },
        'Base Stats': {
          HP: 50,
          Attack: 50,
          Defense: 50,
          'Special Attack': 50,
          'Special Defense': 50,
          Speed: 50
        },
        'Other Information': {
          Genders: '50% Male, 50% Female',
          Habitat: 'Test'
        },
        Moves: {
          'Level Up Move List': []
        }
      }
    ];

    const response = await fetch(`${baseUrl}/api/pokemon/custom/pokemon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: pokemonData })
    });

    const result = await response.json();
    console.log('✅ Response:', result);
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Load custom Abilities
  console.log('📝 Test 2: Loading custom Abilities...');
  try {
    const abilitiesData = {
      'Test Ability': {
        Frequency: '1/Turn',
        Trigger: 'Passive',
        Effect: 'This is a test ability'
      }
    };

    const response = await fetch(`${baseUrl}/api/pokemon/custom/abilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: abilitiesData })
    });

    const result = await response.json();
    console.log('✅ Response:', result);
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Load custom Moves
  console.log('📝 Test 3: Loading custom Moves...');
  try {
    const movesData = {
      'Test Move': {
        Type: 'Normal',
        Frequency: '1/Turn',
        Class: 'Physical',
        Range: '1 Target, 5 meters',
        'Damage Base': '4',
        Accuracy: '100',
        Effect: 'This is a test move'
      }
    };

    const response = await fetch(`${baseUrl}/api/pokemon/custom/moves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: movesData })
    });

    const result = await response.json();
    console.log('✅ Response:', result);
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: Check status
  console.log('📝 Test 4: Checking custom data status...');
  try {
    const response = await fetch(`${baseUrl}/api/pokemon/custom`);
    const result = await response.json();
    console.log('✅ Status:', result);
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 5: Generate Pokemon with custom data
  console.log('📝 Test 5: Generating Pokémon with custom data...');
  try {
    const response = await fetch(`${baseUrl}/api/pokemon/generate?species=TestMon`);
    if (response.ok) {
      const pokemon = await response.json();
      console.log('✅ Generated:', {
        name: pokemon.name,
        level: pokemon.level,
        abilities: pokemon.abilities.map(a => a.name)
      });
    } else {
      console.log('⚠️ Custom Pokémon not found (may need to load first)');
    }
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 6: Clear custom data
  console.log('📝 Test 6: Clearing custom data...');
  try {
    const response = await fetch(`${baseUrl}/api/pokemon/custom`, {
      method: 'DELETE'
    });
    const result = await response.json();
    console.log('✅ Response:', result);
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 7: Verify cleared
  console.log('📝 Test 7: Verifying data cleared...');
  try {
    const response = await fetch(`${baseUrl}/api/pokemon/custom`);
    const result = await response.json();
    console.log('✅ Status after clear:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n✨ All tests completed!');
}

testCustomizations();
