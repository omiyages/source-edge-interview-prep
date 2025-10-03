// Test the admin-user-management Edge Function
console.log('🧪 Testing admin-user-management Edge Function...');

// Test data structure that the function expects
const testData = {
  email: 'test@source-edge.com',
  fullName: 'Test User',
  role: 'user',
  customPassword: 'TestPassword123!'
};

console.log('📋 Test data:', JSON.stringify(testData, null, 2));

// Simulate the request structure
const requestBody = {
  body: testData
};

console.log('📦 Request body structure:', JSON.stringify(requestBody, null, 2));

// Test the data extraction logic
const userData = requestBody.body || requestBody;
console.log('✅ Extracted user data:', JSON.stringify(userData, null, 2));

console.log('🎯 This should match the test data structure');
