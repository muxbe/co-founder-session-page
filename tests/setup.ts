/**
 * Jest Setup File
 * Runs before all tests
 */

// Make this a module
export {};

// Set test environment variables
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Increase timeout for API calls
jest.setTimeout(60000);

// Global test utilities
declare global {
  var testBaseUrl: string;
}

global.testBaseUrl = process.env.TEST_BASE_URL;

console.log(`\n🧪 Test Environment Ready`);
console.log(`📍 Base URL: ${global.testBaseUrl}\n`);
