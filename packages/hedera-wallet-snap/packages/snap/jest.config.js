/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */
module.exports = {
  clearMocks: false,
  globals: {
    window: {
      location: {
        hostname: 'hedera-pulse',
      },
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts', 'mjs', 'cjs'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transformIgnorePatterns: [],
  testTimeout: 120000,
};
