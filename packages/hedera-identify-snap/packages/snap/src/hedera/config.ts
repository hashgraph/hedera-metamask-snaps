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

import { isIn } from '../types/constants';

const hederaChainIDs: Record<string, string> = {
  '0x127': 'mainnet',
  '0x128': 'testnet',
  '0x129': 'previewnet',
};

export const getHederaNetwork = (chainId: string): string => {
  const network = hederaChainIDs[chainId];
  return network || 'mainnet';
};

export const validHederaChainID = (x: string) => {
  return isIn(Object.keys(hederaChainIDs) as string[], x);
};
