#!/usr/bin/env node

// Simple test runner to check if our fixes work
const { execSync } = require('child_process');
const path = require('path');

const testFile = 'src/__tests__/components/encounter/forms/ObservationForm.test.tsx';

try {
  console.log('Running ObservationForm tests...');
  
  // Try to run the specific test file
  const result = execSync(`npx vitest run ${testFile}`, {
    cwd: __dirname,
    stdio: 'pipe',
    encoding: 'utf8'
  });
  
  console.log('✅ Tests passed!');
  console.log(result);
} catch (error) {
  console.log('❌ Tests failed:');
  console.log(error.stdout);
  console.log(error.stderr);
  process.exit(1);
}