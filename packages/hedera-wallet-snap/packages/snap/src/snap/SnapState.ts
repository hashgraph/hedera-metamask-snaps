import { MetaMaskInpageProvider } from '@metamask/providers';

import _ from 'lodash';
import { WalletSnapState } from '../types/state';
import { StateUtils } from '../utils/StateUtils';
import { HederaUtils } from '../utils/HederaUtils';

export class SnapState {
  /**
   * Function for updating WalletSnapState object in the MetaMask state.
   *
   * @public
   * @param snapState - Object to replace the current object in the MetaMask state.
   */
  public static async updateState(snapState: WalletSnapState) {
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
  public static async getState(): Promise<WalletSnapState> {
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
  public static async getStateUnchecked(): Promise<WalletSnapState | null> {
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
  public static async initState(): Promise<WalletSnapState> {
    const state = StateUtils.getInitialSnapState();
    await SnapState.updateState(state);
    return state;
  }

  /**
   * Get current network.
   *
   * @param metamask - Metamask provider.
   */
  public static async getCurrentNetwork(
    metamask: MetaMaskInpageProvider,
  ): Promise<string> {
    return (await metamask.request({
      method: 'eth_chainId',
    })) as string;
  }

  /**
   * Function that gets  the mirror node url from snap state or whatever was passed in
   * by the user.
   *
   * @param state - WalletSnapState.
   * @param params - Parameters that were passed by the user.
   * @returns Mirror Node Url.
   */
  public static async getMirrorNodeUrl(
    state: WalletSnapState,
    params: unknown,
  ): Promise<string> {
    let mirrorNodeUrl = HederaUtils.getMirrorNodeFlagIfExists(params);
    try {
      if (_.isEmpty(mirrorNodeUrl)) {
        mirrorNodeUrl =
          state.accountState[state.currentAccount.hederaEvmAddress][
            state.currentAccount.network
          ].mirrorNodeUrl;
      } else {
        state.accountState[state.currentAccount.hederaEvmAddress][
          state.currentAccount.network
        ].mirrorNodeUrl = mirrorNodeUrl;
        await SnapState.updateState(state);
      }
    } catch (error: any) {
      console.log(
        'Mirror Node Url could not be set at this time. Continuing...',
      );
    }
    return mirrorNodeUrl;
  }

  /**
   * Function that toggles the disablePopups flag in the config.
   *
   * @param state - WalletSnapState.
   */
  public static async updatePopups(state: WalletSnapState) {
    state.snapConfig.dApp.disablePopups = !state.snapConfig.dApp.disablePopups;
    await SnapState.updateState(state);
  }

  /**
   * Function that lets you add a friendly dApp.
   *
   * @param state - WalletSnapState.
   * @param dapp - Dapp.
   */
  public static async addFriendlyDapp(state: WalletSnapState, dapp: string) {
    state.snapConfig.dApp.friendlyDapps.push(dapp);
    await SnapState.updateState(state);
  }

  /**
   * Function that removes a friendly dApp.
   *
   * @param state - WalletSnapState.
   * @param dapp - Dapp.
   */
  public static async removeFriendlyDapp(state: WalletSnapState, dapp: string) {
    // FIXME: TEST IF YOU CAN REFERENCE FRIENDLY DAPS
    // let friendlyDapps = state.snapConfig.dApp.friendlyDapps;
    // friendlyDapps = friendlyDapps.filter((app) => app !== dapp);
    state.snapConfig.dApp.friendlyDapps =
      state.snapConfig.dApp.friendlyDapps.filter((app) => app !== dapp);
    await SnapState.updateState(state);
  }
}
