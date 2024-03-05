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
import { SnapAccounts } from './snap/SnapAccounts';
import { SnapState } from './snap/SnapState';
import { WalletSnapParams } from './types/state';
import { SignMessageCommand } from './commands/SignMessageCommand';
import { HederaUtils } from './utils/HederaUtils';
import { StakeHbarRequestParams } from './types/params';
import { GetAccountInfoFacade } from './facades/GetAccountInfoFacade';
import { GetAccountBalanceFacade } from './facades/GetAccountBalanceFacade';
import { HederaTransactionsStrategy } from './strategies/HederaTransactionsStrategy';
import { StakeHbarFacade } from './facades/StakeHbarFacade';
import { ApproveAllowanceFacade } from './facades/ApproveAllowanceFacade';
import { DeleteAllowanceFacade } from './facades/DeleteAllowanceFacade';
import { DeleteAccountFacade } from './facades/DeleteAccountFacade';
import { AssociateTokensFacade } from './facades/AssociateTokensFacade';
import { CreateTokenFacade } from './facades/CreateTokenFacade';
import { TransferCryptoFacade } from './facades/TransferCryptoFacade';

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

  let state = await SnapState.getStateUnchecked();
  if (_.isEmpty(state)) {
    state = await SnapState.initState();
  }

  let isExternalAccount = false;
  if (HederaUtils.isExternalAccountFlagSet(request.params)) {
    isExternalAccount = true;
  }

  // Get network and mirrorNodeUrl
  const { network, mirrorNodeUrl } = HederaUtils.getNetworkInfoFromUser(
    request.params,
  );

  // Set current account
  await SnapAccounts.setCurrentAccount(
    origin,
    state,
    request.params,
    network,
    mirrorNodeUrl,
    isExternalAccount,
  );
  console.log(
    `Current account: ${JSON.stringify(state.currentAccount, null, 4)}`,
  );

  const walletSnapParams: WalletSnapParams = {
    origin,
    state,
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
      const signMessageCommand = new SignMessageCommand(
        walletSnapParams,
        request.params,
      );
      return {
        currentAccount: state.currentAccount,
        signature: await signMessageCommand.execute(),
      };
    }
    case 'getAccountInfo': {
      HederaUtils.isValidGetAccountInfoRequest(request.params);
      return {
        currentAccount: state.currentAccount,
        accountInfo: await GetAccountInfoFacade.getAccountInfo(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'getAccountBalance': {
      return {
        currentAccount: state.currentAccount,
        accountBalance: await GetAccountBalanceFacade.getAccountBalance(
          walletSnapParams,
        ),
      };
    }
    case 'getTransactions': {
      HederaUtils.isValidGetTransactionsParams(request.params);
      return {
        currentAccount: state.currentAccount,
        transactions: await HederaTransactionsStrategy.getTransactions(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'transferCrypto': {
      HederaUtils.isValidTransferCryptoParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await TransferCryptoFacade.transferCrypto(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'stakeHbar': {
      HederaUtils.isValidStakeHbarParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await StakeHbarFacade.stakeHbar(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'unstakeHbar': {
      return {
        currentAccount: state.currentAccount,
        receipt: await StakeHbarFacade.stakeHbar(
          walletSnapParams,
          {} as StakeHbarRequestParams,
        ),
      };
    }
    case 'approveAllowance': {
      HederaUtils.isValidApproveAllowanceParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await ApproveAllowanceFacade.approveAllowance(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'deleteAllowance': {
      HederaUtils.isValidDeleteAllowanceParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await DeleteAllowanceFacade.deleteAllowance(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'deleteAccount': {
      HederaUtils.isValidDeleteAccountParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await DeleteAccountFacade.deleteAccount(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'hts/associateTokens': {
      HederaUtils.isValidAssociateTokensParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await AssociateTokensFacade.associateTokens(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'hts/createToken': {
      HederaUtils.isValidCreateTokenParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await CreateTokenFacade.createToken(
          walletSnapParams,
          request.params,
        ),
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
