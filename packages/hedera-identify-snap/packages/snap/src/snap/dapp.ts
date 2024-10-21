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

import { IdentitySnapState } from '../interfaces';
import { updateState } from './state';

/**
 * Function that toggles the disablePopups flag in the config.
 *
 * @param snap - Snap.
 * @param state - IdentitySnapState.
 */
export async function updatePopups(state: IdentitySnapState) {
  state.snapConfig.dApp.disablePopups = !state.snapConfig.dApp.disablePopups;
  await updateState(state);
}

/**
 * Function that lets you add a friendly dApp.
 *
 * @param snap - Snap.
 * @param state - IdentitySnapState.
 * @param dapp - Dapp.
 */
export async function addFriendlyDapp(state: IdentitySnapState, dapp: string) {
  state.snapConfig.dApp.friendlyDapps.push(dapp);
  await updateState(state);
}

/**
 * Function that removes a friendly dApp.
 *
 * @param snap - Snap.
 * @param state - IdentitySnapState.
 * @param dapp - Dapp.
 */
export async function removeFriendlyDapp(
  state: IdentitySnapState,
  dapp: string,
) {
  // FIXME: TEST IF YOU CAN REFERENCE FRIENDLY DAPS
  // let friendlyDapps = state.snapConfig.dApp.friendlyDapps;
  // friendlyDapps = friendlyDapps.filter((d) => d !== dapp);
  state.snapConfig.dApp.friendlyDapps =
    state.snapConfig.dApp.friendlyDapps.filter((d) => d !== dapp);
  await updateState(state);
}

/**
 * Function that switches the did method to use.
 *
 * @param snap - Snap.
 * @param state - IdentitySnapState.
 */
export async function updateDIDMethod(
  state: IdentitySnapState,
  didMethod: string,
) {
  state.snapConfig.dApp.didMethod = didMethod;
  await updateState(state);
}
