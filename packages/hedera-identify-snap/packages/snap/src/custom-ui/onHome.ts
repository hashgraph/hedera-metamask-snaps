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
import { getNetworkNameFromChainId } from '../constants';
import { SnapAccounts } from '../snap/SnapAccounts';
import { SnapState } from '../snap/SnapState';
import { EvmUtils } from '../utils/EvmUtils';

export const OnHomePageUI: OnHomePageHandler = async () => {
  const origin = 'Identify Snap';

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  const network = await EvmUtils.getChainId();
  const connectedAddress = await SnapAccounts.getCurrentMetamaskAccount();

  const snapAddress = await SnapAccounts.setCurrentAccount(
    origin,
    state,
    null,
    network,
    false,
    true,
  );

  return {
    content: panel([
      heading('Identify Snap'),
      text('Welcome to Identify Snap home page!'),
      divider(),
      text(`**Network**: ${getNetworkNameFromChainId(network)}`),
      divider(),
      text(`**Snap Account DID**:`),
      copyable(state.currentAccount.identifier.did || 'Unavailable'),
      text(`**Snap Account EVM Address**:`),
      copyable(snapAddress || 'Unavailable'),
      text(`**Snap Hedera Account ID**:`),
      copyable(state.currentAccount.hederaAccountId || 'Unavailable'),
      text(`**Associated Metamask Address**:`),
      copyable(connectedAddress || 'Unavailable'),
      text(`**Current DID Method**: ${state.currentAccount.method || 'None'}`),
      divider(),
      text(`**Switch DID Method**:`),
      form({
        name: 'form-switch-did-method',
        children: [
          input({
            name: 'didMethod',
            placeholder: 'Methods: [did:pkh, did:key, did:hedera]',
            value: state.currentAccount.method || '',
          }),
          button({
            value: 'Switch DID Method',
            buttonType: 'submit',
          }),
        ],
      }),
      divider(),
      text(`**Resolve DID**:`),
      form({
        name: 'form-resolve-did',
        children: [
          input({
            name: 'did',
            placeholder: 'Enter DID string',
            value: state.currentAccount.identifier.did || '',
          }),
          button({
            value: 'Resolve DID',
            buttonType: 'submit',
          }),
        ],
      }),
      divider(),
      text(`**Create a new Verifiable Credential**:`),
      form({
        name: 'form-create-vc',
        children: [
          input({
            name: 'vcText',
            placeholder: 'Enter some text',
            value: 'Sample text',
          }),
          button({
            value: 'Create VC',
            buttonType: 'submit',
          }),
        ],
      }),
      divider(),
      text(`**Retrieve Verifiable Credentials**:`),
      form({
        name: 'form-get-vcs',
        children: [
          button({
            value: 'Get VCs',
            buttonType: 'submit',
          }),
        ],
      }),
      divider(),
      text(`**Create Verifiable Presentation**:`),
      form({
        name: 'form-create-vp',
        children: [
          input({
            name: 'vcData',
            placeholder: 'Enter your Verifiable Credential',
            value: '',
          }),
          button({
            value: 'Create VP',
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
        `**Why is my MetaMask address different from my Snap EVM address?**: Since MetaMask does not allow Snaps to access the private keys of MetaMask accounts, Identify Snap creates a new account with its own private key. However, this new account is still associated with the MetaMask account so you can easily get back to your account on any device as long as you're connected to the same MetaMask account.`,
      ),
      text(
        `**Is the Snap safe to use?**: Yes, the Snap is safe to use as it is run in a sandboxed environment and uses a permissions model to protect your data and respect your consent. The Snap does not have access to your MetaMask account data.`,
      ),
      divider(),
      text(`[View Snap documentation](https://docs.tuum.tech/identify)`),
    ]),
  };
};
