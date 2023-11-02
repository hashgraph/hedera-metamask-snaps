/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: false,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ['/node_modules/', 'tests'],
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'json', 'ts', 'mjs', 'cjs'],
  // The test environment that will be used for testing
  testEnvironment: 'node',
  // The regexp pattern or array of patterns that Jest uses to detect test files
  testRegex: '.*\\.spec\\.ts$',
  // A set of global variables that need to be available in all test environments
  globals: {
    window: {
      location: {
        hostname: 'hedera-pulse',
      },
    },
  },
  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [],
  testTimeout: 120000,
};

export default config;
