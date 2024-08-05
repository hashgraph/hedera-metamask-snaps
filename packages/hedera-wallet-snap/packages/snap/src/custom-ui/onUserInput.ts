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
  // Set origin to be the current page
  const origin = 'Hedera Wallet Snap';

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  // Get network and mirrorNodeUrl
  const { network, mirrorNodeUrl } = HederaUtils.getNetworkInfoFromUser(null);

  // Set current account
  await SnapAccounts.setCurrentAccount(
    origin,
    state,
    null,
    network,
    mirrorNodeUrl,
    false,
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
        result = await TransferCryptoFacade.transferCrypto(
          walletSnapParams,
          params,
        );
        await SnapUtils.snapCreateDialogAfterTransaction(network, result);

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
                state.accountState[state.currentAccount.hederaEvmAddress][
                  state.currentAccount.network
                ].keyStore.privateKey,
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
