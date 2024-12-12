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
import { DialogParams, divider, heading, text } from '@metamask/snaps-sdk';
import { verifyToken } from '../../plugins/veramo/google-drive-data-store';
import { SnapState } from '../../snap/SnapState';
import { GoogleToken } from '../../types/params';
import { IdentifySnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class ConfigureGAccountFacde {
  /**
   * Function to configure google account
   *
   * @param identifySnapParams - Identify snap params.
   */
  public static async configureGoogleAccount(
    identifySnapParams: IdentifySnapParams,
    { accessToken }: GoogleToken,
  ): Promise<boolean> {
    const { state } = identifySnapParams;
    const { snapEvmAddress, network } = state.currentAccount;

    let newGUserEmail;
    try {
      newGUserEmail = await verifyToken(accessToken);
    } catch (error) {
      console.error(`Failed to verify google access token: ${error}`);
      return false;
    }

    const currentGUserInfo =
      state.accountState[snapEvmAddress][network].accountConfig.identity
        .googleUserInfo;

    const panelToShow = SnapUtils.initializePanelToShow();
    panelToShow.push(
      heading('Configure Google Drive'),
      text('Would you like to change your Google account to the following?'),
      divider(),
      text(
        `Current Gdrive account: ${
          currentGUserInfo.email ? currentGUserInfo.email : 'Not yet set'
        }`,
      ),
      text(`New Gdrive account: ${newGUserEmail}`),
    );
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

    state.accountState[snapEvmAddress][
      network
    ].accountConfig.identity.googleUserInfo.accessToken = accessToken;

    state.accountState[snapEvmAddress][
      network
    ].accountConfig.identity.googleUserInfo.email = newGUserEmail;

    await SnapState.updatePopups(state);
    return true;
  }
}
