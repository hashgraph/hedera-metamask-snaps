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

import type { OnHomePageHandler } from '@metamask/snaps-sdk';
import {
  button,
  copyable,
  divider,
  form,
  heading,
  input,
  panel,
  text,
} from '@metamask/snaps-sdk';
import _ from 'lodash';
import { GetAccountInfoFacade } from '../facades/snap/GetAccountInfoFacade';
import { SnapAccounts } from '../snap/SnapAccounts';
import { SnapState } from '../snap/SnapState';
import type { PublicAccountInfo } from '../types/account';
import type { IdentifySnapParams } from '../types/state';
import { EvmUtils } from '../utils/EvmUtils';

export const OnHomePageUI: OnHomePageHandler = async () => {
  // Set origin to be the current page
  const origin = 'Identify Snap';

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  // Get network
  const network = await EvmUtils.getChainId();

  // Get connected metamask account
  const connectedAddress = await SnapAccounts.getCurrentMetamaskAccount();

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

  try {
    const accountInfo: PublicAccountInfo =
      await GetAccountInfoFacade.getAccountInfo(walletSnapParams);

    return {
      content: panel([
        heading('Identify Snap'),
        text('Welcome to Identify Snap home page!'),
        divider(),
        text(`**Network**: ${network}`),
        divider(),
        text(`**Account EVM Address**:`),
        copyable(accountInfo.snapAddress),
        text(`**Associated Metamask Address**:`),
        copyable(connectedAddress),
        divider(),
        text(`**Transfer Hbar**:`),
        form({
          name: 'form-transfer-crypto',
          children: [
            input({
              name: 'to',
              placeholder: 'Recipient Address',
            }),
            input({
              name: 'amount',
              placeholder: 'Amount',
            }),
            input({
              name: 'memo',
              placeholder: 'Memo(Needed for exchange transfers)',
            }),
            button({
              value: 'Send Hbar',
              buttonType: 'submit',
            }),
          ],
        }),
        divider(),
        button({
          value: 'Export Snap Account Private Key',
          name: 'btn-export-snap-account-private-key',
        }),
        divider(),
        text(`**FAQs**:`),
        text(
          `**Why is my MetaMask address different from my Hedera EVM address?**: Since MetaMask does not allow Snaps to access the private keys of MetaMask accounts, Hedera Wallet Snap creates a new account with its own private key. However, this new account is still associated with the MetaMask account so you can easily get back to your account on any device as long as you're connected to the same MetaMask account.`,
        ),
        text(
          `**Is the Snap safe to use?**: Yes, the Snap is safe to use as it is run in a sandboxed environment and uses a permissions model to protect your data and respect your consent. The Snap does not have access to your MetaMask account data.`,
        ),
        divider(),
        text(
          `[View Snap documentation](https://docs.tuum.tech/hedera-wallet-snap)`,
        ),
        text(`[Visit Pulse for additional features](https://pulse.tuum.tech)`),
      ]),
    };
  } catch (error) {
    return {
      content: panel([
        heading('Identify Snap'),
        text('Welcome to Identifyt Snap home page!'),
        divider(),
        text(`**Network**: ${network}`),
        divider(),
        text(`**Account EVM Address**:`),
        copyable(snapAddress),
        text(`**Associated Metamask Address**:`),
        copyable(connectedAddress),
        divider(),
        button({
          value: 'Export Snap Account Private Key',
          name: 'btn-export-snap-account-private-key',
        }),
        divider(),
        text(`**FAQs**:`),
        text(
          `**Why is my MetaMask address different from my Identify EVM address?**: Since MetaMask does not allow Snaps to access the private keys of MetaMask accounts, Hedera Wallet Snap creates a new account with its own private key. However, this new account is still associated with the MetaMask account so you can easily get back to your account on any device as long as you're connected to the same MetaMask account.`,
        ),
        text(`[View Snap documentation](https://docs.tuum.tech/identify-snap)`),
      ]),
    };
  }
};
