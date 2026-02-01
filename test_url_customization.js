// Test script for URL-based customization

async function testURLCustomization() {
  const baseUrl = 'http://localhost:3000';

  console.log('🧪 Testing URL-based Customization...\n');

  // Test 1: Generate with custom Pokemon from URL
  console.log('📝 Test 1: Generate Pokémon with custom Pokemon via URL...');
  try {
    const customUrl = 'http://localhost:3000/example-custom-pokemon.json';
    const response = await fetch(`${baseUrl}/api/pokemon/generate?level=50&customPokemonUrl=${encodeURIComponent(customUrl)}`);
    const result = await response.json();
    console.log('✅ Generated:', {
      name: result.name,
      level: result.level,
      dataset: result.dataset
    });
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Generate specific custom Pokemon by name
  console.log('📝 Test 2: Generate specific custom Pokemon (Customizard)...');
  try {
    const customUrl = 'http://localhost:3000/example-custom-pokemon.json';
    const response = await fetch(`${baseUrl}/api/pokemon/generate?species=Customizard&customPokemonUrl=${encodeURIComponent(customUrl)}`);
    const result = await response.json();
    console.log('✅ Generated:', {
      name: result.name,
      level: result.level,
      types: result.actualTypes
    });
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Generate Hydrosquid
  console.log('📝 Test 3: Generate specific custom Pokemon (Hydrosquid)...');
  try {
    const customUrl = 'http://localhost:3000/example-custom-pokemon.json';
    const response = await fetch(`${baseUrl}/api/pokemon/generate?species=Hydrosquid&customPokemonUrl=${encodeURIComponent(customUrl)}`);
    const result = await response.json();
    console.log('✅ Generated:', {
      name: result.name,
      level: result.level,
      types: result.actualTypes,
      abilities: result.abilities.map(a => a.name)
    });
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: Check custom status after URLs
  console.log('📝 Test 4: Checking custom data status after URL loads...');
  try {
    const response = await fetch(`${baseUrl}/api/pokemon/custom`);
    const result = await response.json();
    console.log('✅ Status:', result.custom);
    console.log();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('✨ All URL customization tests completed!');
}

testURLCustomization();
