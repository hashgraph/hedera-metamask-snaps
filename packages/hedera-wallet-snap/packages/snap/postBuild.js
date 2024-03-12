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

/* eslint-disable */
const fs = require('fs');
const pathUtils = require('path');

const bundlePath = pathUtils.join('dist', 'snap.js');
console.log('Bundle path', bundlePath);

let bundleString = fs.readFileSync(bundlePath, 'utf8');

// Perform some post-processing here if needed

fs.writeFileSync(bundlePath, bundleString);
