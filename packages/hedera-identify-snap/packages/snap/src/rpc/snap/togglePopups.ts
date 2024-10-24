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

import { DialogParams, heading, text } from '@metamask/snaps-sdk';
import { IdentitySnapParams } from '../../interfaces';
import { updatePopups } from '../../snap/dapp';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';

/**
 * Function to toggle popups.
 *
 * @param identitySnapParams - Identity snap params.
 */
export async function togglePopups(
  identitySnapParams: IdentitySnapParams,
): Promise<boolean> {
  const { origin, network, state } = identitySnapParams;
  const { disablePopups } = state.snapConfig.dApp;

  const toggleTextToShow = disablePopups ? 'enable' : 'disable';
  const dialogParams: DialogParams = {
    type: 'confirmation',
    content: await generateCommonPanel(origin, network, [
      heading('Toggle Popups'),
      text(`Would you like to ${toggleTextToShow} the popups?`),
    ]),
  };
  const result = await snapDialog(dialogParams);
  if (result) {
    await updatePopups(state);
    return true;
  }
  return false;
}
