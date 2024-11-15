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

import { rpcErrors } from '@metamask/rpc-errors';
import { DialogParams, heading, text } from '@metamask/snaps-sdk';
import { SnapState } from '../../snap/SnapState';
import { IdentifySnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class TogglePopupsFacade {
  /**
   * Function to toggle popups.
   *
   * @param identitySnapParams - Identity snap params.
   */
  public static async togglePopups(
    identitySnapParams: IdentifySnapParams,
  ): Promise<boolean> {
    const { origin, state } = identitySnapParams;
    const { network } = state.currentAccount;

    const { disablePopups } = state.snapConfig.dApp;

    const toggleTextToShow = disablePopups ? 'enable' : 'disable';
    const panelToShow = [
      heading('Toggle Popups'),
      text(`Would you like to ${toggleTextToShow} the popups?`),
    ];
    const dialogParams: DialogParams = {
      type: 'confirmation',
      content: await SnapUtils.generateCommonPanel(
        origin,
        network,
        panelToShow,
      ),
    };
    const confirmed = await SnapUtils.snapDialog(dialogParams);
    if (!confirmed) {
      const errMessage = 'User rejected the transaction';
      console.error(errMessage);
      throw rpcErrors.transactionRejected(errMessage);
    }

    await SnapState.updatePopups(state);
    return true;
  }
}
