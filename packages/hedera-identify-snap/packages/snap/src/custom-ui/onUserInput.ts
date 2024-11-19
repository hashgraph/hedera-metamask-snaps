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

import type { OnUserInputHandler } from '@metamask/snaps-sdk';

import { UserInputEventType, copyable, panel, text } from '@metamask/snaps-sdk';
import _ from 'lodash';
import { SnapAccounts } from '../snap/SnapAccounts';
import { SnapState } from '../snap/SnapState';
import type { IdentifySnapParams } from '../types/state';
import { EvmUtils } from '../utils/EvmUtils';

export const onUserInputUI: OnUserInputHandler = async ({ event }) => {
  // Set origin to be the current page
  const origin = 'Hedera Wallet Snap';

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  // Get network
  const network = await EvmUtils.getChainId();

  // Set current account
  const snapAddress = await SnapAccounts.setCurrentAccount(
    origin,
    state,
    null,
    network,
    false,
    true,
  );

  const walletSnapParams: IdentifySnapParams = {
    origin,
    state,
  };

  if (event.type === UserInputEventType.FormSubmitEvent) {
    switch (event.name) {
      case 'form-transfer-crypto': {
        break;
      }
      default:
        console.log('no logic for this form');
    }
  }

  if (event.type === UserInputEventType.ButtonClickEvent) {
    switch (event.name) {
      case 'btn-export-snap-account-private-key': {
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              text(
                'Warning: Never disclose this key. Anyone with your private keys can steal any assets held in your account.',
              ),
              copyable(
                state.accountState[snapAddress][network].keyStore.privateKey,
              ),
            ]),
          },
        });
        break;
      }
      default:
        console.log('no logic for this button');
    }
  }
};
