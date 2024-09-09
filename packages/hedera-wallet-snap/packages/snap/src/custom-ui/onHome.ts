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
import { GetAccountInfoFacade } from '../facades/account/GetAccountInfoFacade';
import { SnapAccounts } from '../snap/SnapAccounts';
import { SnapState } from '../snap/SnapState';
import type { AccountInfo } from '../types/account';
import type { GetAccountInfoRequestParams } from '../types/params';
import type { WalletSnapParams } from '../types/state';
import { HederaUtils } from '../utils/HederaUtils';

export const OnHomePageUI: OnHomePageHandler = async () => {
  // Set origin to be the current page
  const origin = 'Hedera Wallet Snap';

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  // Get network and mirrorNodeUrl
  const { network, mirrorNodeUrl } = HederaUtils.getNetworkInfoFromUser(null);

  // Get connected metamask account
  const connectedAddress = await SnapAccounts.getCurrentMetamaskAccount();

  try {
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

    const accountInfo: AccountInfo = await GetAccountInfoFacade.getAccountInfo(
      walletSnapParams,
      {} as GetAccountInfoRequestParams,
    );

    return {
      content: panel([
        heading('Hedera Wallet Snap'),
        text('Welcome to Hedera Wallet Snap home page!'),
        divider(),
        text(`**Network**: ${network}`),
        text(`**Mirror Node URL**: ${mirrorNodeUrl}`),
        divider(),
        text(`**Account Id**:`),
        copyable(accountInfo.accountId),
        text(`**Account EVM Address**:`),
        copyable(accountInfo.evmAddress),
        text(`**Associated Metamask Address**:`),
        copyable(connectedAddress),
        text(`**Balance**: ${accountInfo.balance.hbars.toFixed(8)} Hbar`),
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
        heading('Hedera Wallet Snap'),
        text('Welcome to Hedera Wallet Snap home page!'),
        divider(),
        text(`**Network**: ${network}`),
        text(`**Mirror Node URL**: ${mirrorNodeUrl}`),
        divider(),
        text(`**Account Id**: Could not fetch account id.`),
        text(`**Account EVM Address**: Could not fetch EVM address.`),
        text(`**Associated Metamask Address**:`),
        copyable(connectedAddress),
        divider(),
        text(`**FAQs**:`),
        text(
          `**Why is my account not activated?**: On Hedera, until a transaction is sent to the network, the account is not activated. Please visit [Pulse](https://pulse.tuum.tech) to activate your account for free.`,
        ),
        text(
          `[View Snap documentation](https://docs.tuum.tech/hedera-wallet-snap)`,
        ),
      ]),
    };
  }
};
