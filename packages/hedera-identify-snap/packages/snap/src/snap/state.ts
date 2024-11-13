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

import {
  Account,
  IdentitySnapState as IdentifySnapState,
  IdentityAccountState,
} from '../interfaces';
import { DEFAULTCOINTYPE, HEDERACOINTYPE } from '../types/constants';
import { getEmptyAccountState, getInitialSnapState } from '../utils/config';
import { HederaUtils } from '../utils/hederaUtils';
import { getCurrentNetwork } from './network';

/**
 * Function for updating IdentitySnapState object in the MetaMask state.
 *
 * @public
 * @param snap - Snap.
 * @param snapState - Object to replace the current object in the MetaMask state.
 */
export async function updateState(snapState: IdentifySnapState) {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: JSON.parse(JSON.stringify(snapState)),
    },
  });
}

/**
 * Function to retrieve IdentitySnapState object from the MetaMask state.
 *
 * @param snap - Snap.
 * @public
 * @returns Object from the state.
 */
export async function getState(): Promise<IdentifySnapState> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as IdentifySnapState | null;

  if (!state) {
    throw Error('IdentifySnapState is not initialized!');
  }

  return state;
}

/**
 * Function to retrieve IdentifySnapState object from the MetaMask state.
 *
 * @param snap - Snap.
 * @public
 * @returns Object from the state.
 */
export async function getStateUnchecked(): Promise<IdentifySnapState | null> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as IdentifySnapState | null;

  return state;
}

/**
 * Function to initialize IdentitySnapState object.
 *
 * @param snap - Snap.
 * @public
 * @returns Object.
 */
export async function initState(): Promise<IdentifySnapState> {
  const state = getInitialSnapState();
  await updateState(state);
  return state;
}

/**
 * Function that creates an empty IdentitySnapState object in the Identity Snap state for the provided address.
 *
 * @param snap - Snap.
 * @param state - IdentitySnapState.
 * @param coinType - The type of cointype.
 * @param evmAddress - The account address.
 */
export async function initAccountState(
  state: IdentifySnapState,
  coinType: string,
  evmAddress: string,
): Promise<void> {
  state.currentAccount = { metamaskAddress: evmAddress } as Account;
  state.accountState[coinType][evmAddress] = getEmptyAccountState();
  await updateState(state);
}

/**
 * Function that returns the current coin type based on what network is selected.
 *
 * @returns Result.
 */
export async function getCurrentCoinType(): Promise<number> {
  const chainId = await getCurrentNetwork();
  let coinType = DEFAULTCOINTYPE;
  if (HederaUtils.validHederaChainID(chainId)) {
    coinType = HEDERACOINTYPE;
  }
  return coinType;
}

/**
 * Function that get account state according to coin type.
 *
 * @param state - IdentitySnapState.
 * @param evmAddress - The account address.
 * @returns Result.
 */
export async function getAccountStateByCoinType(
  state: IdentifySnapState,
  evmAddress: string,
): Promise<IdentityAccountState> {
  const coinType = await getCurrentCoinType();
  return state.accountState[coinType][evmAddress];
}
