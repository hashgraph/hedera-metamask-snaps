/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 *
 * note on the window.location.href global: without this, some tests will fail
 * because of an upstream hashgraph / node-forge dependency
 */
module.exports = {
  clearMocks: false,
  globals: {
    window: {
      location: {
        hostname: 'hedera-wallet-snap',
        href: 'http://localhost',
      },
    },
  },
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx', 'mjs', 'cjs'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!normalize-url).+\\.js$'],
  testTimeout: 120000,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'Wallet Snap Unit Tests',
        outputName: 'junit-snap.xml',
      },
    ],
  ],
};
