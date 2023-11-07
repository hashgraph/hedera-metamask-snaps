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

import { divider, heading, panel, Panel, text } from '@metamask/snaps-ui';

import { SnapDialogParams, WalletSnapState } from '../types/state';
import { updateSnapState } from './state';

/**
 * Function that toggles the disablePopups flag in the config.
 *
 * @param state - WalletSnapState.
 */
export async function updatePopups(state: WalletSnapState) {
  state.snapConfig.dApp.disablePopups = !state.snapConfig.dApp.disablePopups;
  await updateSnapState(state);
}

/**
 * Function that opens snap dialog.
 *
 * @param params - Snap dialog params.
 */
export async function snapDialog(
  params: SnapDialogParams,
): Promise<string | boolean | null> {
  return (await snap.request({
    method: 'snap_dialog',
    params,
  })) as boolean;
}

/**
 * Function to generate snap dialog panel.
 *
 * @param origin - The origin of where the call is being made from.
 * @param prompt - Prompt text of the metamask dialog box(eg. 'Are you sure you want to send VCs to the dApp?').
 */
export async function generateCommonPanel(
  origin: string,
  prompt: any[],
): Promise<Panel> {
  const panelToShow = [text(`Origin: ${origin}`), divider(), ...prompt];
  return panel(panelToShow);
}

/**
 * Request Hedera Account Id.
 *
 * @param origin - Source.
 * @param publicKey - Public key.
 * @param address - EVM address.
 */
export async function requestHederaAccountId(
  origin: string,
  publicKey: string,
  address: string,
): Promise<string> {
  const dialogParamsForHederaAccountId: SnapDialogParams = {
    type: 'prompt',
    content: await generateCommonPanel(origin, [
      heading('Connect to Hedera Account'),
      text(
        `Enter your hedera account Id associated with the following account`,
      ),
      divider(),
      text(`Public Key: ${publicKey}`),
      text(`EVM Address: ${address}`),
      divider(),
    ]),
    placeholder: '0.0.3658062',
  };
  return (await snapDialog(dialogParamsForHederaAccountId)) as string;
}
