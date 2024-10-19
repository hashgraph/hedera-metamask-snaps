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
