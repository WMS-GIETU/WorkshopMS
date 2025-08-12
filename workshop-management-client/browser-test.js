// Browser Test for Admin Check API
// Copy and paste this code into your browser console

console.log('🧪 Browser Test for Admin Check API');
console.log('=====================================');

async function testAdminCheck(clubCode) {
  try {
    console.log(`📡 Testing club code: ${clubCode}`);
    
    const response = await fetch(`http://localhost:5000/api/auth/check-admin/${clubCode}`);
    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, data);
    console.log('---');
    
    return data;
  } catch (error) {
    console.log(`❌ Error for ${clubCode}:`, error.message);
    console.log('---');
    return null;
  }
}

// Test multiple club codes
async function runBrowserTests() {
  const testClubCodes = ['TEST123', 'CLUB001', 'NONEXISTENT'];
  
  for (const clubCode of testClubCodes) {
    await testAdminCheck(clubCode);
  }
  
  console.log('🎯 Browser Test Complete!');
}

// Run the tests
runBrowserTests();

// You can also test individual club codes:
// testAdminCheck('YOUR_CLUB_CODE');