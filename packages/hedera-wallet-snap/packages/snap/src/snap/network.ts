/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2023 Tuum Tech
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

import { MetaMaskInpageProvider } from '@metamask/providers';

import { hederaNetworks, isIn } from '../types/constants';

/**
 * Get current network.
 *
 * @param metamask - Metamask provider.
 */
export async function getCurrentNetwork(
  metamask: MetaMaskInpageProvider,
): Promise<string> {
  return (await metamask.request({
    method: 'eth_chainId',
  })) as string;
}

export const validHederaNetwork = (network: string) => {
  return isIn(hederaNetworks, network);
};
