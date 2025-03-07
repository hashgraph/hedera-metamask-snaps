/*-
 *
 * Hedera Wallet Snap
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
import { TransferCryptoFacade } from '../facades/TransferCryptoFacade';
import { SnapAccounts } from '../snap/SnapAccounts';
import { SnapState } from '../snap/SnapState';
import type { SimpleTransfer, TxRecord } from '../types/hedera';
import type { TransferCryptoRequestParams } from '../types/params';
import type { WalletSnapParams } from '../types/state';
import { HederaUtils } from '../utils/HederaUtils';
import { SnapUtils } from '../utils/SnapUtils';

export const onUserInputUI: OnUserInputHandler = async ({ event }) => {
  // Ensure valid event structure
  if (!event?.name) {
    console.warn('Invalid event detected:', event);
    return;
  }

  // Ignore InputChangeEvent explicitly
  if (event.type === UserInputEventType.InputChangeEvent) {
    console.warn('Ignoring InputChangeEvent:', event.name);
    return;
  }

  // Set origin to be the current page
  const origin = 'Hedera Wallet Snap';

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  // Get network and mirrorNodeUrl
  const { network, mirrorNodeUrl } = HederaUtils.getNetworkInfoFromUser(null);

  // Set current account
  const snapAddress = await SnapAccounts.setCurrentAccount(
    origin,
    state,
    null,
    network,
    mirrorNodeUrl,
    false,
    true,
  );

  const walletSnapParams: WalletSnapParams = {
    origin,
    state,
  };

  let result: TxRecord;

  if (event.type === UserInputEventType.FormSubmitEvent) {
    switch (event.name) {
      case 'form-transfer-crypto': {
        const params = {
          transfers: [
            {
              assetType: 'HBAR',
              to: event.value.to,
              amount: parseFloat(event.value.amount as string),
            } as SimpleTransfer,
          ],
        } as TransferCryptoRequestParams;
        if (event.value.memo) {
          params.memo = event.value.memo as string;
        }
        result = await TransferCryptoFacade.transferCrypto(
          walletSnapParams,
          params,
        );
        await SnapUtils.snapCreateDialogAfterTransaction(
          origin,
          network,
          mirrorNodeUrl,
          result,
        );
        break;
      }
      default:
        console.log('no logic for this form');
    }
  }

  if (event.type === UserInputEventType.ButtonClickEvent) {
    switch (event.name) {
      case 'btn-export-snap-account-private-key': {
        const privateKey =
          state.accountState[snapAddress]?.[network]?.keyStore?.privateKey;

        if (privateKey) {
          await snap.request({
            method: 'snap_dialog',
            params: {
              type: 'alert',
              content: panel([
                text(
                  'Warning: Never disclose this key. Anyone with your private keys can steal any assets held in your account.',
                ),
                copyable({
                  value: privateKey,
                  sensitive: true,
                }),
              ]),
            },
          });
          // Safely overwrite the private key
          const keyStore = state.accountState[snapAddress]?.[network]?.keyStore;
          if (keyStore) {
            keyStore.privateKey = ''; // Overwrite with an empty string
          }
        } else {
          console.error('Private key unavailable or already cleared.');
        }
        break;
      }
      default:
        console.log('no logic for this button');
    }
  }
};
