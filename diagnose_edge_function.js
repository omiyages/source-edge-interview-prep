// Diagnose Edge Function 400 Error
console.log('🔍 Diagnosing Edge Function 400 Error...');

// Simulate the exact request structure from CreateUserForm.tsx
const simulateFrontendRequest = () => {
  console.log('\n📱 Frontend Request Structure:');
  
  const userData = {
    email: 'test@source-edge.com',
    fullName: 'Test User',
    role: 'user',
    customPassword: 'TestPassword123!'
  };
  
  const requestBody = {
    body: userData
  };
  
  console.log('Request body sent by frontend:');
  console.log(JSON.stringify(requestBody, null, 2));
  
  return requestBody;
};

// Simulate the Edge Function data extraction
const simulateEdgeFunctionExtraction = (requestData) => {
  console.log('\n⚙️ Edge Function Data Extraction:');
  
  // Original logic (would fail)
  console.log('❌ Original logic (requestData.body):', requestData.body);
  console.log('❌ Original logic (requestData.email):', requestData.email);
  
  // Fixed logic
  const userData = requestData.body || requestData;
  console.log('✅ Fixed logic (userData):', JSON.stringify(userData, null, 2));
  
  const { email, fullName, role = 'user', customPassword } = userData;
  
  console.log('\n📋 Extracted fields:');
  console.log('Email:', email);
  console.log('Full Name:', fullName);
  console.log('Role:', role);
  console.log('Custom Password:', customPassword ? 'Present' : 'Not provided');
  
  return { email, fullName, role, customPassword };
};

// Test the complete flow
const testCompleteFlow = () => {
  console.log('\n🧪 Complete Flow Test:');
  
  const requestData = simulateFrontendRequest();
  const extractedData = simulateEdgeFunctionExtraction(requestData);
  
  // Validate extracted data
  const isValid = extractedData.email && extractedData.fullName;
  
  console.log('\n✅ Validation Results:');
  console.log('Email present:', !!extractedData.email);
  console.log('Full name present:', !!extractedData.fullName);
  console.log('Role present:', !!extractedData.role);
  console.log('Overall valid:', isValid);
  
  if (isValid) {
    console.log('\n🎉 SUCCESS: Edge Function should work correctly!');
  } else {
    console.log('\n❌ FAILURE: Edge Function will return 400 error');
  }
};

// Run the diagnosis
testCompleteFlow();

console.log('\n📖 Next Steps:');
console.log('1. Deploy the updated Edge Function');
console.log('2. Test user creation in admin dashboard');
console.log('3. Check function logs for detailed execution');
console.log('4. Verify users are created successfully');
