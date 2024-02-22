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

import { providerErrors } from '@metamask/rpc-errors';
import _ from 'lodash';
import { hederaNetworks, isIn } from '../types/constants';
import { WalletSnapState } from '../types/state';
import { HederaUtils } from '../utils/HederaUtils';
import { updateSnapState } from './state';

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

/**
 * Function that gets  the mirror node url from snap state or whatever was passed in
 * by the user.
 *
 * @param state - WalletSnapState.
 * @param params - Parameters that were passed by the user.
 * @returns Mirror Node Url.
 */
export async function getMirrorNodeUrl(
  state: WalletSnapState,
  params: unknown,
): Promise<string> {
  const mirrorNodeUrl = HederaUtils.getMirrorNodeFlagIfExists(params);
  let mirrorNodeUrlToUse = mirrorNodeUrl;
  try {
    if (_.isEmpty(mirrorNodeUrlToUse)) {
      mirrorNodeUrlToUse =
        state.accountState[state.currentAccount.hederaEvmAddress][
          state.currentAccount.network
        ].mirrorNodeUrl;
    }
    state.accountState[state.currentAccount.hederaEvmAddress][
      state.currentAccount.network
    ].mirrorNodeUrl = mirrorNodeUrlToUse;
    await updateSnapState(state);
  } catch (error: any) {
    throw providerErrors.custom({
      code: 4200,
      message: `Error while trying to set mirror node url}`,
      data: { error: String(error) },
    });
  }
  return mirrorNodeUrlToUse;
}
