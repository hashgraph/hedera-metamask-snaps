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

import type { SnapConfig } from '@metamask/snaps-cli';
// eslint-disable-next-line import/no-nodejs-modules
import { resolve } from 'path';

const config: SnapConfig = {
  bundler: 'webpack',
  // eslint-disable-next-line no-restricted-globals
  input: resolve(__dirname, 'src/index.ts'),
  server: {
    port: 9001,
  },
  polyfills: {
    buffer: true,
  },
};

export default config;
