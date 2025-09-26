#!/usr/bin/env node

/**
 * Simple Secrets Management Test
 * Tests basic secrets management functionality
 */

console.log('🔐 Testing Secrets Management Implementation');
console.log('=' .repeat(50));

// Test 1: Check for hardcoded secrets
console.log('\n🔍 Scanning for hardcoded secrets...');
import fs from 'fs';
import path from 'path';

function scanForSecrets(dir, patterns) {
  const results = [];
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        scanDirectory(filePath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const pattern of patterns) {
          if (content.includes(pattern)) {
            results.push({
              file: filePath,
              pattern: pattern,
              line: content.split('\n').findIndex(line => line.includes(pattern)) + 1
            });
          }
        }
      }
    }
  }
  
  scanDirectory(dir);
  return results;
}

const secretPatterns = [
  'sk-', // OpenAI API keys
  'pk_', // Stripe keys
  'AKIA', // AWS access keys
  'AIza', // Google API keys
  'your_supabase_url_here',
  'your_supabase_anon_key_here',
  'your_google_client_id_here',
  'your_google_client_secret_here'
];

const secretResults = scanForSecrets('src', secretPatterns);

if (secretResults.length > 0) {
  console.log('⚠️ Found potential hardcoded secrets:');
  secretResults.forEach(result => {
    console.log(`   ${result.file}:${result.line} - ${result.pattern}`);
  });
} else {
  console.log('✅ No hardcoded secrets found');
}

// Test 2: Check environment template
console.log('\n📋 Checking environment template...');
if (fs.existsSync('env.template')) {
  console.log('✅ Environment template exists');
  const template = fs.readFileSync('env.template', 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_GOOGLE_CLIENT_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !template.includes(varName));
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables in template');
  } else {
    console.log('❌ Missing variables in template:', missingVars);
  }
} else {
  console.log('❌ Environment template not found');
}

// Test 3: Check configuration files
console.log('\n⚙️ Checking configuration files...');
const configFiles = [
  'src/config/environment.ts',
  'src/config/google-credentials.ts',
  'src/utils/secretsManager.ts',
  'src/integrations/supabase/client.ts'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Test 4: Check GitHub Actions workflow
console.log('\n🔄 Checking GitHub Actions workflow...');
if (fs.existsSync('.github/workflows/secrets-validation.yml')) {
  console.log('✅ Secrets validation workflow exists');
} else {
  console.log('❌ Secrets validation workflow missing');
}

// Test 5: Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'secrets:validate',
  'secrets:scan',
  'secrets:report',
  'secrets:check'
];

const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
if (missingScripts.length === 0) {
  console.log('✅ All required scripts in package.json');
} else {
  console.log('❌ Missing scripts:', missingScripts);
}

// Summary
console.log('\n📊 Secrets Management Test Summary');
console.log('=' .repeat(50));

const totalTests = 5;
const passedTests = [
  secretResults.length === 0,
  fs.existsSync('env.template'),
  configFiles.every(file => fs.existsSync(file)),
  fs.existsSync('.github/workflows/secrets-validation.yml'),
  missingScripts.length === 0
].filter(Boolean).length;

console.log(`Tests Passed: ${passedTests}/${totalTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🏆 All secrets management tests passed!');
  console.log('✅ Secrets management implementation is complete');
} else {
  console.log('\n⚠️ Some tests failed - review the output above');
  console.log('🔧 Fix the issues and run the test again');
}

console.log('\n💡 Next steps:');
console.log('1. Copy env.template to .env.local');
console.log('2. Fill in your actual environment variables');
console.log('3. Test with: npm run secrets:check');
console.log('4. Deploy with proper environment variables');
