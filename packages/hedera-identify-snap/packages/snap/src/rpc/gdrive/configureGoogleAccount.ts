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

import { divider, heading, text } from '@metamask/snaps-ui';
import {
  GoogleToken,
  IdentitySnapParams,
  SnapDialogParams,
} from '../../interfaces';
import { verifyToken } from '../../plugins/veramo/google-drive-data-store';
import { generateCommonPanel, snapDialog } from '../../snap/dialog';
import { getCurrentCoinType, updateSnapState } from '../../snap/state';

export const configureGoogleAccount = async (
  identitySnapParams: IdentitySnapParams,
  { accessToken }: GoogleToken,
) => {
  const { origin, snap, state, account } = identitySnapParams;
  try {
    const newGUserEmail = await verifyToken(accessToken);
    const coinType = await getCurrentCoinType();

    const currentGUserInfo =
      state.accountState[coinType][account.evmAddress].accountConfig.identity
        .googleUserInfo;

    const dialogParams: SnapDialogParams = {
      type: 'confirmation',
      content: await generateCommonPanel(origin, [
        heading('Configure Google Drive'),
        text('Would you like to change your Google account to the following?'),
        divider(),
        text(
          `Current Gdrive account: ${
            currentGUserInfo.email ? currentGUserInfo.email : 'Not yet set'
          }`,
        ),
        text(`New Gdrive account: ${newGUserEmail}`),
      ]),
    };

    const result = await snapDialog(snap, dialogParams);
    if (result) {
      state.accountState[coinType][
        account.evmAddress
      ].accountConfig.identity.googleUserInfo.accessToken = accessToken;

      state.accountState[coinType][
        account.evmAddress
      ].accountConfig.identity.googleUserInfo.email = newGUserEmail;

      console.log('new state: ', JSON.stringify(state, null, 4));
      await updateSnapState(snap, state);
      return true;
    }
    return false;
  } catch (error) {
    console.error(
      'Could not configure Google Drive',
      JSON.stringify(error, null, 4),
    );
    throw error;
  }
};
