// Test CSP for courses/tracks functionality
console.log('🔍 Testing CSP for courses/tracks functionality...');

// Test CSP policy parsing
const testCSP = (cspString) => {
  console.log('📋 Testing CSP policy:', cspString);
  
  const directives = cspString.split(';').map(d => d.trim());
  const policy = {};
  
  directives.forEach(directive => {
    const [key, ...values] = directive.split(' ');
    policy[key] = values;
  });
  
  console.log('📊 Parsed CSP directives:', policy);
  
  // Check for common issues
  const issues = [];
  
  if (!policy['script-src']?.includes("'unsafe-inline'")) {
    issues.push('Missing unsafe-inline for script-src');
  }
  
  if (!policy['connect-src']?.includes('wss://')) {
    issues.push('Missing WebSocket support in connect-src');
  }
  
  if (!policy['font-src']?.includes('data:')) {
    issues.push('Missing data: for font-src');
  }
  
  if (issues.length > 0) {
    console.log('❌ CSP Issues found:', issues);
  } else {
    console.log('✅ CSP policy looks good');
  }
  
  return { policy, issues };
};

// Test current CSP policies
const vercelCSP = "default-src 'self'; connect-src 'self' https://*.supabase.co https://api.mapbox.com wss://*.supabase.co; img-src 'self' https://*.supabase.co data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; font-src 'self' data:; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests; object-src 'none';";

const publicCSP = "default-src 'self'; connect-src 'self' https://*.supabase.co https://api.mapbox.com wss://*.supabase.co; img-src 'self' https://*.supabase.co data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; font-src 'self' data:; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests; object-src 'none';";

console.log('🧪 Testing Vercel CSP:');
const vercelResult = testCSP(vercelCSP);

console.log('\n🧪 Testing Public Headers CSP:');
const publicResult = testCSP(publicCSP);

// Check for consistency
const isConsistent = vercelResult.issues.length === 0 && publicResult.issues.length === 0;
console.log('\n📊 CSP Consistency Check:');
console.log('Vercel CSP issues:', vercelResult.issues.length);
console.log('Public CSP issues:', publicResult.issues.length);
console.log('Consistent:', isConsistent ? '✅ Yes' : '❌ No');

// Test React-specific requirements
console.log('\n⚛️ React Application CSP Requirements:');
const reactRequirements = [
  { directive: 'script-src', requirement: "'unsafe-inline'", reason: 'Inline event handlers' },
  { directive: 'script-src', requirement: "'unsafe-eval'", reason: 'Dynamic code evaluation' },
  { directive: 'style-src', requirement: "'unsafe-inline'", reason: 'Inline styles' },
  { directive: 'connect-src', requirement: 'wss://', reason: 'WebSocket connections' },
  { directive: 'font-src', requirement: 'data:', reason: 'Base64 encoded fonts' }
];

reactRequirements.forEach(req => {
  const hasRequirement = vercelResult.policy[req.directive]?.includes(req.requirement);
  console.log(`${req.directive} ${req.requirement}: ${hasRequirement ? '✅' : '❌'} (${req.reason})`);
});

console.log('\n🎯 Recommendations:');
if (!isConsistent) {
  console.log('1. Ensure both vercel.json and public/_headers have identical CSP policies');
  console.log('2. Test CSP changes in staging environment first');
  console.log('3. Monitor browser console for CSP violations');
} else {
  console.log('✅ CSP policies are consistent and should work for React applications');
}

console.log('\n🔧 Debugging Steps:');
console.log('1. Check browser console for CSP violation messages');
console.log('2. Test courses/tracks functionality after deployment');
console.log('3. Use CSP report-only mode for testing');
console.log('4. Monitor network requests for blocked resources');
