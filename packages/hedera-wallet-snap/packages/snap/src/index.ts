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
import { divider, heading, panel, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { getAccountBalance } from './rpc/account/getAccountBalance';
import { getAccountInfo } from './rpc/account/getAccountInfo';
import { transferCrypto } from './rpc/transactions/transferCrypto';
import { setCurrentAccount } from './snap/account';
import { getSnapStateUnchecked, initSnapState } from './snap/state';
import { WalletSnapParams } from './types/state';

import { approveAllowance } from './rpc/account/approveAllowance';
import { deleteAccount } from './rpc/account/deleteAccount';
import { deleteAllowance } from './rpc/account/deleteAllowance';
import { stakeHbar } from './rpc/account/stakeHbar';
import { associateTokens } from './rpc/hts/associateTokens';
import { signMessage } from './rpc/misc/signMessage';
import { getTransactions } from './rpc/transactions/getTransactions';
import { HederaUtils } from './utils/HederaUtils';

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
  if (_.isEmpty(state)) {
    state = await initSnapState();
  }

  let isExternalAccount = false;
  if (HederaUtils.isExternalAccountFlagSet(request.params)) {
    isExternalAccount = true;
  }

  const mirrorNodeUrl = HederaUtils.getMirrorNodeFlagIfExists(request.params);

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
      HederaUtils.isValidSignMessageRequest(request.params);
      return {
        currentAccount: state.currentAccount,
        signature: await signMessage(walletSnapParams, request.params),
      };
    }
    case 'getAccountInfo': {
      HederaUtils.isValidGetAccountInfoRequest(request.params);
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
    case 'getTransactions': {
      HederaUtils.isValidGetTransactionsParams(request.params);
      return {
        currentAccount: state.currentAccount,
        transactions: await getTransactions(walletSnapParams, request.params),
      };
    }
    case 'associateTokens': {
      HederaUtils.isValidAssociateTokensParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await associateTokens(walletSnapParams, request.params),
      };
    }
    case 'transferCrypto': {
      HederaUtils.isValidTransferCryptoParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await transferCrypto(walletSnapParams, request.params),
      };
    }
    case 'stakeHbar': {
      HederaUtils.isValidStakeHbarParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await stakeHbar(walletSnapParams, request.params),
      };
    }
    case 'approveAllowance': {
      HederaUtils.isValidApproveAllowanceParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await approveAllowance(walletSnapParams, request.params),
      };
    }
    case 'deleteAllowance': {
      HederaUtils.isValidDeleteAllowanceParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await deleteAllowance(walletSnapParams, request.params),
      };
    }
    case 'deleteAccount': {
      HederaUtils.isValidDeleteAccountParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await deleteAccount(walletSnapParams, request.params),
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
          '🔑 Applications do NOT have access to your private keys. Everything is stored inside the sandbox environment of Hedera Wallet inside MetaMask',
        ),
        divider(),
        text(
          '💰 Hedera Wallet is a beta version and is not recommended for use with large amounts of funds. Use at your own risk.',
        ),
        divider(),
        text(
          '⦿ Note that Hedera Wallet Snap does not have direct access to the private key of the MetaMask accounts so it generates a new snap account that is associated with the currently connected MetaMask account so the account created by the snap will have a different address compared to your MetaMask account address.',
        ),
        divider(),
        text(
          '😭 If you add a new account in MetaMask after you have already approved existing accounts, you will need to reinstall the snap and reconnect to approve the newly added account. This is only temporary and in the future, you will not need to do the reinstall once MetaMask Snaps support account change events.',
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
        text(
          '🚀 Added a new API to associate fungible/non-fungible tokens to an account',
        ),
        text(
          '🚀 Added support to be able to transfer any kind of tokens including hbar, fungible and non-fungible tokens',
        ),
        text(
          '🚀 Added a new API to stake/unstake Hbar to and from Hedera Network nodes',
        ),
        text(
          '🚀 Added a new API to approve/delete an allowance for Hbar, tokens and NFTs',
        ),
        text(
          '🚀 Added a new API to delete a Hedera account from the ledger permanently. This action is irreversible!',
        ),
      ]),
    },
  });
};
