import { WalletSnapState } from '../types/state';
import { updateSnapState } from './state';

/**
 * Function that lets you add a friendly dApp.
 *
 * @param state - WalletSnapState.
 * @param dapp - Dapp.
 */
export async function addFriendlyDapp(state: WalletSnapState, dapp: string) {
  state.snapConfig.dApp.friendlyDapps.push(dapp);
  await updateSnapState(state);
}

/**
 * Function that removes a friendly dApp.
 *
 * @param state - WalletSnapState.
 * @param dapp - Dapp.
 */
export async function removeFriendlyDapp(state: WalletSnapState, dapp: string) {
  // FIXME: TEST IF YOU CAN REFERENCE FRIENDLY DAPS
  // let friendlyDapps = state.snapConfig.dApp.friendlyDapps;
  // friendlyDapps = friendlyDapps.filter((app) => app !== dapp);
  state.snapConfig.dApp.friendlyDapps =
    state.snapConfig.dApp.friendlyDapps.filter((app) => app !== dapp);
  await updateSnapState(state);
}
