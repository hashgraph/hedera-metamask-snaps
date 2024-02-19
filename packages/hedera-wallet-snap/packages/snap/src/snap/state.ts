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

import _ from 'lodash';
import { Account } from '../types/account';
import { WalletSnapState } from '../types/state';
import { StateUtils } from '../utils/StateUtils';

/**
 * Function for updating WalletSnapState object in the MetaMask state.
 *
 * @public
 * @param snapState - Object to replace the current object in the MetaMask state.
 */
export async function updateSnapState(snapState: WalletSnapState) {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: JSON.parse(JSON.stringify(snapState)),
    },
  });
}

/**
 * Function to retrieve WalletSnapState object from the MetaMask state.
 *
 * @public
 * @returns Object from the state.
 */
export async function getSnapState(): Promise<WalletSnapState> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as WalletSnapState | null;

  if (_.isEmpty(state)) {
    throw Error('WalletSnapState is not initialized!');
  }

  return state;
}

/**
 * Function to retrieve WalletSnapState object from the MetaMask state.
 *
 * @public
 * @returns Object from the state.
 */
export async function getSnapStateUnchecked(): Promise<WalletSnapState | null> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as WalletSnapState | null;

  return state;
}

/**
 * Function to initialize WalletSnapState object.
 *
 * @public
 * @returns Object.
 */
export async function initSnapState(): Promise<WalletSnapState> {
  const state = StateUtils.getInitialSnapState();
  await updateSnapState(state);
  return state;
}

/**
 * Function that creates an empty IdentitySnapState object in the Identity Snap state for the provided address.
 *
 * @param state - WalletSnapState.
 * @param network - Hedera network.
 * @param evmAddress - The account address.
 */
export async function initAccountState(
  state: WalletSnapState,
  network: string,
  evmAddress: string,
): Promise<void> {
  state.currentAccount = { hederaEvmAddress: evmAddress } as Account;
  if (_.isEmpty(state.accountState[evmAddress])) {
    state.accountState[evmAddress] = {};
  }
  state.accountState[evmAddress][network] = StateUtils.getEmptyAccountState();

  await updateSnapState(state);
}

/**
 * Check if Hedera account was imported.
 *
 * @param state - WalletSnapState.
 * @param network - Hedera network.
 * @param evmAddress - Ethereum address.
 * @returns Result.
 */
export async function getHederaAccountIdIfExists(
  state: WalletSnapState,
  network: string,
  evmAddress: string,
): Promise<string> {
  let result = '';
  for (const address of Object.keys(state.accountState)) {
    if (state.accountState[address][network]) {
      const { keyStore } = state.accountState[address][network];
      if (keyStore.address === evmAddress) {
        result = keyStore.hederaAccountId;
      }
    }
  }
  return result;
}
