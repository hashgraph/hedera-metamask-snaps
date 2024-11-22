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

import { DialogParams, divider, heading, text } from '@metamask/snaps-sdk';
import { SnapState } from '../../snap/SnapState';
import { availableMethods, isValidMethod } from '../../types/constants';
import { IdentifySnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class SwitchDIDMethodFacade {
  /**
   * Function to switch method.
   *
   * @param identifySnapParams - Identify snap params.
   * @param didMethod - DID method.
   */
  public static async switchDIDMethod(
    identitySnapParams: IdentifySnapParams,
    didMethod: string,
  ): Promise<boolean> {
    const { origin, state } = identitySnapParams;
    const { network } = state.currentAccount;

    const method = state.snapConfig.dApp.didMethod;
    if (!isValidMethod(didMethod)) {
      console.error(
        `did method '${didMethod}' not supported. Supported methods are: ${availableMethods}`,
      );
      throw new Error(
        `did method ${didMethod}'not supported. Supported methods are: ${availableMethods}`,
      );
    }

    if (method !== didMethod) {
      const panelToShow = SnapUtils.initializePanelToShow();
      panelToShow.push(
        heading('Switch to a different DID method to use'),
        text('Would you like to change did method to the following?'),
        divider(),
        text(`Current DID method: ${method}`),
        text(`New DID method: ${didMethod}`),
      );
      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(
          origin,
          network,
          panelToShow,
        ),
      };

      if (
        state.snapConfig.dApp.disablePopups ||
        (await SnapUtils.snapDialog(dialogParams))
      ) {
        await SnapState.updateDIDMethod(state, didMethod);
        return true;
      }
    }
    return false;
  }
}
