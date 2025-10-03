#!/usr/bin/env node

/**
 * Test Database User Creation
 * Verifies that the database user creation service works
 */

import { DatabaseUserService } from './src/services/databaseUserService.js';

console.log('🧪 Testing Database User Creation...');

try {
  // Test email generation
  const testEmail = DatabaseUserService.generateEmail('John Doe');
  console.log('✅ Email generation works:', testEmail);

  // Test name parsing
  const testNames = DatabaseUserService.parseNames('John Doe\nJane Smith\nBob Johnson');
  console.log('✅ Name parsing works:', testNames);

  // Test stats calculation
  const testResults = [
    { name: 'John', email: 'john@test.com', status: 'success', message: 'Created' },
    { name: 'Jane', email: 'jane@test.com', status: 'skipped', message: 'Exists' },
    { name: 'Bob', email: 'bob@test.com', status: 'error', message: 'Failed' }
  ];
  const stats = DatabaseUserService.getStats(testResults);
  console.log('✅ Stats calculation works:', stats);

  console.log('🎉 Database user creation service test completed successfully!');

} catch (error) {
  console.error('❌ Database user creation service test failed:', error.message);
  process.exit(1);
}
