/*-
 *
 * Hedera Identify Snap
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

export const hederaChainIDs: Record<string, string> = {
  '0x127': 'mainnet',
  '0x128': 'testnet',
  '0x129': 'previewnet',
};

export const DEFAULTHEDERAMIRRORNODES: Record<string, string> = {
  mainnet: 'https://mainnet-public.mirrornode.hedera.com',
  testnet: 'https://testnet.mirrornode.hedera.com',
  previewnet: 'https://previewnet.mirrornode.hedera.com',
};

export const otherChainIDs: Record<string, string> = {
  '0x1': 'Ethereum Mainnet',
  '0xa': 'Optimisim',
  '0xe': 'Flare',
  '0x13': 'Songbird',
  '0x14': 'Elastos',
  '0x1e': 'RSK',
  '0x32': 'XDC',
  '0x38': 'Binance Smart Chain',
  '0x89': 'Polygon',
  '0x13a': 'Filecoin',
  '0x44d': 'Polygon ZKEVM',
  '0x8ae': 'Kava',
  '0x2105': 'Base',
  '0xa4b1': 'Arbitrum',
  '0xa86a': 'Avalanche',
  '0xe71c': 'Linea',
};
