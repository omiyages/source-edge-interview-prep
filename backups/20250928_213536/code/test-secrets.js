#!/usr/bin/env node

/**
 * Secrets Management Test Script
 * Tests the secrets management implementation
 */

import { environment } from './src/config/environment.ts';
import { secretsManager } from './src/utils/secretsManager.ts';

console.log('🔐 Testing Secrets Management Implementation');
console.log('=' .repeat(50));

try {
  // Test environment validation
  console.log('\n📋 Testing Environment Configuration...');
  const envValidation = environment.validateSecrets();
  
  if (envValidation.isValid) {
    console.log('✅ Environment configuration is valid');
  } else {
    console.log('❌ Environment validation failed:');
    envValidation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
  
  // Test secrets manager
  console.log('\n🔍 Testing Secrets Manager...');
  const secretsValidation = secretsManager.validateSecrets();
  
  if (secretsValidation.isValid) {
    console.log('✅ Secrets validation passed');
  } else {
    console.log('❌ Secrets validation failed:');
    secretsValidation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
  }
  
  // Generate security report
  console.log('\n📊 Generating Security Report...');
  const report = secretsManager.generateSecurityReport();
  
  console.log(`Risk Level: ${report.riskLevel}`);
  console.log(`Errors: ${report.validation.errors.length}`);
  console.log(`Warnings: ${report.validation.warnings.length}`);
  console.log(`Recommendations: ${report.recommendations.length}`);
  
  if (report.validation.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    report.validation.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });
  }
  
  console.log('\n🎯 Secrets Management Test Complete!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
