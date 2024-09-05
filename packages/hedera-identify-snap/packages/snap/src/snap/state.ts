import { SnapsGlobalObject } from '@metamask/snaps-types';
import { validHederaChainID } from '../hedera/config';
import {
  Account,
  IdentityAccountState,
  IdentitySnapState,
} from '../interfaces';
import { DEFAULTCOINTYPE, HEDERACOINTYPE } from '../types/constants';
import { getEmptyAccountState, getInitialSnapState } from '../utils/config';
import { getCurrentNetwork } from './network';

/**
 * Function for updating IdentitySnapState object in the MetaMask state.
 *
 * @public
 * @param snap - Snap.
 * @param snapState - Object to replace the current object in the MetaMask state.
 */
export async function updateSnapState(
  snap: SnapsGlobalObject,
  snapState: IdentitySnapState,
) {
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
export async function getSnapState(
  snap: SnapsGlobalObject,
): Promise<IdentitySnapState> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as IdentitySnapState | null;

  if (!state) {
    throw Error('IdentitySnapState is not initialized!');
  }

  return state;
}

/**
 * Function to retrieve IdentitySnapState object from the MetaMask state.
 *
 * @param snap - Snap.
 * @public
 * @returns Object from the state.
 */
export async function getSnapStateUnchecked(
  snap: SnapsGlobalObject,
): Promise<IdentitySnapState | null> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as IdentitySnapState | null;

  return state;
}

/**
 * Function to initialize IdentitySnapState object.
 *
 * @param snap - Snap.
 * @public
 * @returns Object.
 */
export async function initSnapState(
  snap: SnapsGlobalObject,
): Promise<IdentitySnapState> {
  const state = getInitialSnapState();
  await updateSnapState(snap, state);
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
  snap: SnapsGlobalObject,
  state: IdentitySnapState,
  coinType: string,
  evmAddress: string,
): Promise<void> {
  state.currentAccount = { evmAddress } as Account;
  state.accountState[coinType][evmAddress] = getEmptyAccountState();
  await updateSnapState(snap, state);
}

/**
 * Function that returns the current coin type based on what network is selected.
 *
 * @returns Result.
 */
export async function getCurrentCoinType(): Promise<number> {
  const chainId = await getCurrentNetwork(ethereum);
  let coinType = DEFAULTCOINTYPE;
  if (validHederaChainID(chainId)) {
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
  state: IdentitySnapState,
  evmAddress: string,
): Promise<IdentityAccountState> {
  const coinType = await getCurrentCoinType();
  return state.accountState[coinType][evmAddress];
}
