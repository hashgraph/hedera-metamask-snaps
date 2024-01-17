/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Tuum Tech
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

import { providerErrors } from '@metamask/rpc-errors';
import type { OnInstallHandler, OnUpdateHandler } from '@metamask/snaps-sdk';
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { copyable, divider, heading, panel, text } from '@metamask/snaps-ui';
import { Wallet, ethers } from 'ethers';
import _ from 'lodash';
import { getAccountBalance } from './rpc/account/getAccountBalance';
import { getAccountInfo } from './rpc/account/getAccountInfo';
import { transferCrypto } from './rpc/account/transferCrypto';
import { setCurrentAccount } from './snap/account';
import { getSnapStateUnchecked, initSnapState } from './snap/state';
import { WalletSnapParams } from './types/state';

import { getTransactions } from './rpc/transactions/getTransactions';
import {
  getMirrorNodeFlagIfExists,
  isExternalAccountFlagSet,
  isValidGetAccountInfoRequest,
  isValidGetTransactionsParams,
  isValidSignMessageRequest,
  isValidTransferCryptoParams,
} from './utils/params';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log('Request:', JSON.stringify(request, null, 4));
  console.log('Origin:', origin);
  console.log('-------------------------------------------------------------');
  console.log(
    'request.params=========',
    JSON.stringify(request.params, null, 4),
  );

  let state = await getSnapStateUnchecked();
  if (state === null || _.isEmpty(state)) {
    state = await initSnapState();
  }

  let isExternalAccount = false;
  if (isExternalAccountFlagSet(request.params)) {
    isExternalAccount = true;
  }

  const mirrorNodeUrl = getMirrorNodeFlagIfExists(request.params);

  await setCurrentAccount(
    origin,
    state,
    request.params,
    mirrorNodeUrl,
    isExternalAccount,
  );
  console.log(
    `Current account: ${JSON.stringify(state.currentAccount, null, 4)}`,
  );

  const walletSnapParams: WalletSnapParams = {
    origin,
    state,
    mirrorNodeUrl,
  };

  switch (request.method) {
    case 'hello':
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text(
              "You are seeing this because you interacted with the 'hello' method",
            ),
          ]),
        },
      });
      return {
        currentAccount: state.currentAccount,
      };
    case 'getCurrentAccount':
      return {
        currentAccount: state.currentAccount,
      };
    case 'signMessage': {
      isValidSignMessageRequest(request.params);

      const result = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Signature request'),
            text(
              _.isEmpty(request.params.header)
                ? 'Do you want to sign this message?'
                : request.params.header,
            ),
            copyable(request.params.message),
          ]),
        },
      });

      if (!result) {
        throw providerErrors.userRejectedRequest();
      }

      const { hederaEvmAddress, network } = state.currentAccount;
      const { privateKey } =
        state.accountState[hederaEvmAddress][network].keyStore;
      const wallet: Wallet = new ethers.Wallet(privateKey);

      return {
        currentAccount: state.currentAccount,
        signature: await wallet.signMessage(request.params.message),
      };
    }
    case 'getAccountInfo': {
      isValidGetAccountInfoRequest(request.params);
      return {
        currentAccount: state.currentAccount,
        accountInfo: await getAccountInfo(walletSnapParams, request.params),
      };
    }
    case 'getAccountBalance': {
      return {
        currentAccount: state.currentAccount,
        accountBalance: await getAccountBalance(walletSnapParams),
      };
    }
    case 'getTransactions':
      isValidGetTransactionsParams(request.params);
      return {
        currentAccount: state.currentAccount,
        transactions: await getTransactions(walletSnapParams, request.params),
      };
    case 'transferCrypto': {
      isValidTransferCryptoParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await transferCrypto(walletSnapParams, request.params),
      };
    }
    default:
      throw providerErrors.unsupportedMethod();
  }
};

export const onInstall: OnInstallHandler = async () => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Thank you for installing Hedera Wallet Snap'),
        text(
          'To learn about the Snap, refer to [Hedera Wallet Snap Documentation](https://docs.tuum.tech/hedera-wallet-snap/basics/introduction).',
        ),
        divider(),
        text(
          '🔑 Applications do NOT have access to your private keys. Everything is stored inside the sandbox environment of Hedera Wallet inside Metamask',
        ),
        divider(),
        text(
          '💰 Hedera Wallet is a beta version and is not recommended for use with large amounts of funds. Use at your own risk.',
        ),
        divider(),
        text(
          '⦿ Note that Hedera Wallet Snap does not have direct access to the private key of the Metamask accounts so it generates a new snap account that is associated with the currently connected Metamask account so the account created by the snap will have a different address compared to your Metamask account address.',
        ),
        divider(),
        text(
          '😭 If you add a new account in Metamask, you will need to reinstall the snap and reconnect to the new account. This is only temporary and in the future, you will not need to do the reinstall once Metamask Snaps support account change events.',
        ),
      ]),
    },
  });
};

export const onUpdate: OnUpdateHandler = async () => {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: panel([
        heading('Thank you for updating Hedera Wallet Snap'),
        text('New features added in this version:'),
        text('🚀 Added a new API to let users sign arbitrary messages'),
        text('🚀 Added a new API to let users view their transaction history'),
      ]),
    },
  });
};
