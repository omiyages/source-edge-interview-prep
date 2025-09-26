#!/usr/bin/env node

/**
 * WebSocket Fix Script
 * Fixes common Vite HMR WebSocket issues
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing WebSocket HMR Issues');
console.log('==============================');

// Check if we're in a Vite project
if (!fs.existsSync('vite.config.ts') && !fs.existsSync('vite.config.js')) {
  console.log('❌ Not a Vite project. This script is for Vite projects only.');
  process.exit(1);
}

// Check for common issues
const issues = [];
const fixes = [];

// Check for port conflicts
console.log('🔍 Checking for port conflicts...');
try {
  const { exec } = await import('child_process');
  exec('lsof -ti:8080,8081', (error, stdout) => {
    if (stdout) {
      issues.push('Ports 8080 or 8081 are in use');
      fixes.push('Kill processes using these ports: lsof -ti:8080,8081 | xargs kill -9');
    }
  });
} catch (e) {
  console.log('⚠️ Could not check port usage');
}

// Check for corrupted cache
console.log('🔍 Checking for corrupted cache...');
const cacheDirs = ['node_modules/.vite', '.vite', 'dist'];
cacheDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    issues.push(`Cache directory exists: ${dir}`);
    fixes.push(`Remove cache directory: rm -rf ${dir}`);
  }
});

// Check for environment issues
console.log('🔍 Checking environment configuration...');
if (!fs.existsSync('.env.local')) {
  issues.push('Missing .env.local file');
  fixes.push('Create .env.local file with proper environment variables');
}

// Check for package.json scripts
console.log('🔍 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.scripts.dev.includes('--host')) {
    issues.push('Dev script missing --host flag');
    fixes.push('Update dev script to include --host flag');
  }
} catch (e) {
  issues.push('Could not read package.json');
}

// Generate report
console.log('\n📊 WebSocket HMR Diagnostic Report');
console.log('===================================');

if (issues.length === 0) {
  console.log('✅ No obvious issues found');
} else {
  console.log('❌ Issues found:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  
  console.log('\n🔧 Recommended fixes:');
  fixes.forEach((fix, index) => {
    console.log(`   ${index + 1}. ${fix}`);
  });
}

console.log('\n🚀 Quick Fix Commands:');
console.log('1. Clean cache: npm run dev:clean');
console.log('2. Reset server: npm run dev:reset');
console.log('3. Manual reset: rm -rf node_modules/.vite .vite dist && npm run dev');

console.log('\n🌐 Browser Fixes:');
console.log('1. Clear browser cache completely');
console.log('2. Open in incognito/private mode');
console.log('3. Disable browser extensions temporarily');
console.log('4. Try a different browser');

console.log('\n🔧 Advanced Fixes:');
console.log('1. Check firewall settings');
console.log('2. Disable antivirus real-time scanning');
console.log('3. Try different network (mobile hotspot)');
console.log('4. Update Node.js and npm to latest versions');

console.log('\n✅ WebSocket fix analysis complete!');
