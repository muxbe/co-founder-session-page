/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        target: 'ES2020',
        moduleResolution: 'node',
        strict: true,
        skipLibCheck: true,
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000, // 60 seconds for API calls
  verbose: true,
  // Run tests sequentially (important for stateful API tests)
  maxWorkers: 1,
};

module.exports = config;
