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

export const isIn = <T>(values: readonly T[], value: any): value is T => {
  return values.includes(value);
};

const hederaChainIDs = new Map([
  ['0x127', 'mainnet'],
  ['0x128', 'testnet'],
  ['0x129', 'previewnet'],
  ['0x12a', 'localnet'],
]);

export const getHederaNetwork = (chainId: string): string => {
  const network = hederaChainIDs.get(chainId);
  return network || 'mainnet';
};

export const validHederaChainID = (x: string) =>
  isIn(Array.from(hederaChainIDs.keys()), x);

const evmChainIDs = new Map([
  ['0x1', 'Ethereum Mainnet'],
  ['0x89', 'Polygon Mainnet'],
  ['0xa4b1', 'Arbitrum One'],
  ['0xa', 'Optimism'],
  ['0x38', 'Binance Smart Chain Mainnet'],
  ['0xe', 'Flare Mainnet'],
  ['0x13', 'Songbird Canary-Network'],
  ['0x13a', 'Filecoin - Mainnet'],
  ['0x2329', 'Evmos'],
  ['0x14', 'Elastos Smart Chain'],
  ['0x5', 'Goerli Testnet'],
]);

const validEVMChainID = (x: string) => isIn(Array.from(evmChainIDs.keys()), x);

export const getNetwork = (chainId: string): string => {
  if (chainId) {
    if (validHederaChainID(chainId)) {
      return `Hedera - ${getHederaNetwork(chainId)}`;
    } else if (validEVMChainID(chainId)) {
      return `EVM Chain - ${evmChainIDs.get(chainId)}`;
    }
    return `EVM Chain - Chain Id: ${chainId}`;
  }
  return '';
};
