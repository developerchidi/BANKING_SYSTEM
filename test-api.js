// Test script for API endpoints
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing API endpoints...\n');
  
  // Test health endpoint
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData.status);
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }
  
  // Test admin stats endpoint (will fail without auth)
  try {
    const statsResponse = await fetch(`${baseUrl}/api/admin/stats`);
    const statsData = await statsResponse.json();
    console.log('📊 Admin stats endpoint:', statsData.message || 'Success');
  } catch (error) {
    console.log('❌ Admin stats endpoint failed:', error.message);
  }
  
  // Test admin activities endpoint (will fail without auth)
  try {
    const activitiesResponse = await fetch(`${baseUrl}/api/admin/activities?limit=5`);
    const activitiesData = await activitiesResponse.json();
    console.log('📋 Admin activities endpoint:', activitiesData.message || 'Success');
  } catch (error) {
    console.log('❌ Admin activities endpoint failed:', error.message);
  }
  
  console.log('\n🎉 API endpoint testing completed!');
};

// Run the test
testEndpoints();
