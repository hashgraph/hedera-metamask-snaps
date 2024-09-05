import { SnapsGlobalObject } from '@metamask/snaps-types';
import { IdentitySnapState } from '../interfaces';
import { updateSnapState } from './state';

/**
 * Function that lets you add a friendly dApp.
 *
 * @param snap - Snap.
 * @param state - IdentitySnapState.
 * @param dapp - Dapp.
 */
export async function addFriendlyDapp(
  snap: SnapsGlobalObject,
  state: IdentitySnapState,
  dapp: string,
) {
  state.snapConfig.dApp.friendlyDapps.push(dapp);
  await updateSnapState(snap, state);
}

/**
 * Function that removes a friendly dApp.
 *
 * @param snap - Snap.
 * @param state - IdentitySnapState.
 * @param dapp - Dapp.
 */
export async function removeFriendlyDapp(
  snap: SnapsGlobalObject,
  state: IdentitySnapState,
  dapp: string,
) {
  // FIXME: TEST IF YOU CAN REFERENCE FRIENDLY DAPS
  // let friendlyDapps = state.snapConfig.dApp.friendlyDapps;
  // friendlyDapps = friendlyDapps.filter((d) => d !== dapp);
  state.snapConfig.dApp.friendlyDapps =
    state.snapConfig.dApp.friendlyDapps.filter((d) => d !== dapp);
  await updateSnapState(snap, state);
}
