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

import type { MetaMaskInpageProvider } from '@metamask/providers';

import _ from 'lodash';
import type { IdentifySnapState } from '../types/state';
import { StateUtils } from '../utils/StateUtils';

export class SnapState {
  /**
   * Function for updating WalletSnapState object in the MetaMask state.
   * @public
   * @param snapState - Object to replace the current object in the MetaMask state.
   */
  public static async updateState(snapState: IdentifySnapState) {
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
   * @public
   * @returns Object from the state.
   */
  public static async getState(): Promise<IdentifySnapState> {
    const state = (await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    })) as IdentifySnapState | null;

    if (_.isEmpty(state)) {
      throw Error('WalletSnapState is not initialized!');
    }

    return state;
  }

  /**
   * Function to retrieve WalletSnapState object from the MetaMask state.
   * @public
   * @returns Object from the state.
   */
  public static async getStateUnchecked(): Promise<IdentifySnapState | null> {
    const state = (await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    })) as IdentifySnapState | null;

    return state;
  }

  /**
   * Function to initialize WalletSnapState object.
   * @public
   * @returns Object.
   */
  public static async initState(): Promise<IdentifySnapState> {
    const state = StateUtils.getInitialSnapState();
    await SnapState.updateState(state);
    return state;
  }

  /**
   * Get current network.
   * @param metamask - Metamask provider.
   * @returns Current network.
   */
  public static async getCurrentNetwork(
    metamask: MetaMaskInpageProvider,
  ): Promise<string> {
    return (await metamask.request({
      method: 'eth_chainId',
    })) as string;
  }

  /**
   * Function that toggles the disablePopups flag in the config.
   * @param state - WalletSnapState.
   */
  public static async updatePopups(state: IdentifySnapState) {
    state.snapConfig.dApp.disablePopups = !state.snapConfig.dApp.disablePopups;
    await SnapState.updateState(state);
  }

  /**
   * Function that lets you add a friendly dApp.
   * @param state - WalletSnapState.
   * @param dapp - Dapp.
   */
  public static async addFriendlyDapp(state: IdentifySnapState, dapp: string) {
    state.snapConfig.dApp.friendlyDapps.push(dapp);
    await SnapState.updateState(state);
  }

  /**
   * Function that removes a friendly dApp.
   * @param state - WalletSnapState.
   * @param dapp - Dapp.
   */
  public static async removeFriendlyDapp(
    state: IdentifySnapState,
    dapp: string,
  ) {
    // FIXME: TEST IF YOU CAN REFERENCE FRIENDLY DAPS
    // let friendlyDapps = state.snapConfig.dApp.friendlyDapps;
    // friendlyDapps = friendlyDapps.filter((app) => app !== dapp);
    state.snapConfig.dApp.friendlyDapps =
      state.snapConfig.dApp.friendlyDapps.filter((app) => app !== dapp);
    await SnapState.updateState(state);
  }

  /**
   * Function that switches the did method to use.
   *
   * @param snap - Snap.
   * @param state - IdentitySnapState.
   */
  public static async updateDIDMethod(
    state: IdentifySnapState,
    didMethod: string,
  ) {
    state.currentAccount.method = didMethod;
    state.snapConfig.dApp.didMethod = didMethod;
    await SnapState.updateState(state);
  }
}
