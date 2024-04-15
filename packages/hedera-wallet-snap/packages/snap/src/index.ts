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

import type {
  OnInstallHandler,
  OnRpcRequestHandler,
  OnUpdateHandler,
} from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  copyable,
  divider,
  heading,
  panel,
  text,
} from '@metamask/snaps-sdk';
import _ from 'lodash';
import { SignMessageCommand } from './commands/SignMessageCommand';
import { StakeHbarFacade } from './facades/StakeHbarFacade';
import { TransferCryptoFacade } from './facades/TransferCryptoFacade';
import { DeleteAccountFacade } from './facades/account/DeleteAccountFacade';
import { FreezeAccountFacade } from './facades/account/FreezeAccountFacade';
import { GetAccountBalanceFacade } from './facades/account/GetAccountBalanceFacade';
import { GetAccountInfoFacade } from './facades/account/GetAccountInfoFacade';
import { ApproveAllowanceFacade } from './facades/allowance/ApproveAllowanceFacade';
import { DeleteAllowanceFacade } from './facades/allowance/DeleteAllowanceFacade';
import { AssociateTokensFacade } from './facades/hts/AssociateTokensFacade';
import { AtomicSwapFacade } from './facades/hts/AtomicSwapFacade';
import { BurnTokenFacade } from './facades/hts/BurnTokenFacade';
import { CreateTokenFacade } from './facades/hts/CreateTokenFacade';
import { DeleteTokenFacade } from './facades/hts/DeleteTokenFacade';
import { DissociateTokensFacade } from './facades/hts/DissociateTokensFacade';
import { EnableKYCAccountFacade } from './facades/hts/EnableKYCAccountFacade';
import { MintTokenFacade } from './facades/hts/MintTokenFacade';
import { PauseTokenFacade } from './facades/hts/PauseTokenFacade';
import { UpdateTokenFacade } from './facades/hts/UpdateTokenFacade';
import { UpdateTokenFeeScheduleFacade } from './facades/hts/UpdateTokenFeeScheduleFacade';
import { WipeTokenFacade } from './facades/hts/WipeTokenFacade';
import { SnapAccounts } from './snap/SnapAccounts';
import { SnapState } from './snap/SnapState';
import { HederaTransactionsStrategy } from './strategies/HederaTransactionsStrategy';
import type { StakeHbarRequestParams } from './types/params';
import type { WalletSnapParams } from './types/state';
import { HederaUtils } from './utils/HederaUtils';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
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

  const walletSnapParams: WalletSnapParams = {
    origin,
    state,
  };

  switch (request.method) {
    case 'hello':
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: panel([
            text(`Hello, **${origin}**!`),
            text(`Network: **${network}**`),
            text(`Mirror Node: **${mirrorNodeUrl}**`),
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
    case 'showAccountPrivateKey':
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: panel([
            text(`Request from: **${origin}**`),
            text(`Network: **${network}**`),
            text(`Mirror Node: **${mirrorNodeUrl}**`),
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
        // eslint-disable-next-line prettier/prettier
        accountBalance:
          await GetAccountBalanceFacade.getAccountBalance(walletSnapParams),
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
    case 'hts/mintToken': {
      HederaUtils.isValidMintTokenParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await MintTokenFacade.mintToken(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'hts/burnToken': {
      HederaUtils.isValidBurnTokenParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await BurnTokenFacade.burnToken(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'hts/pauseToken': {
      HederaUtils.isValidPauseOrDeleteTokenParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await PauseTokenFacade.pauseToken(
          walletSnapParams,
          request.params,
          true,
        ),
      };
    }
    case 'hts/unpauseToken': {
      HederaUtils.isValidPauseOrDeleteTokenParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await PauseTokenFacade.pauseToken(
          walletSnapParams,
          request.params,
          false,
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
    case 'hts/dissociateTokens': {
      HederaUtils.isValidDissociateTokensParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await DissociateTokensFacade.dissociateTokens(
          walletSnapParams,
          request.params,
        ),
      };
    }
    case 'hts/freezeAccount': {
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await FreezeAccountFacade.freezeAccount(
          walletSnapParams,
          request.params,
          true,
        ),
      };
    }
    case 'hts/unfreezeAccount': {
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await FreezeAccountFacade.freezeAccount(
          walletSnapParams,
          request.params,
          false,
        ),
      };
    }
    case 'hts/enableKYCFlag': {
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await EnableKYCAccountFacade.enableKYCAccount(
          walletSnapParams,
          request.params,
          true,
        ),
      };
    }
    case 'hts/disableKYCFlag': {
      HederaUtils.isValidFreezeOrEnableKYCAccountParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await EnableKYCAccountFacade.enableKYCAccount(
          walletSnapParams,
          request.params,
          false,
        ),
      };
    }
    case 'hts/wipeToken': {
      HederaUtils.isValidWipeTokenParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await WipeTokenFacade.wipeToken(
          walletSnapParams,
          request.params,
        ),
      };
    }

    case 'hts/deleteToken': {
      HederaUtils.isValidPauseOrDeleteTokenParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await DeleteTokenFacade.deleteToken(
          walletSnapParams,
          request.params,
        ),
      };
    }

    case 'hts/updateToken': {
      HederaUtils.isValidUpdateTokenParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await UpdateTokenFacade.updateToken(
          walletSnapParams,
          request.params,
        ),
      };
    }

    case 'hts/updateTokenFeeSchedule': {
      HederaUtils.isValidUpdateTokenFeeScheduleParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await UpdateTokenFeeScheduleFacade.updateTokenFeeSchedule(
          walletSnapParams,
          request.params,
        ),
      };
    }

    case 'hts/initiateSwap': {
      HederaUtils.isValidInitiateSwapParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await AtomicSwapFacade.initiateSwap(
          walletSnapParams,
          request.params,
        ),
      };
    }

    case 'hts/completeSwap': {
      HederaUtils.isValidSignScheduledTxParams(request.params);
      return {
        currentAccount: state.currentAccount,
        receipt: await AtomicSwapFacade.completeSwap(
          walletSnapParams,
          request.params,
        ),
      };
    }

    default:
      // Throw a known error to avoid crashing the Snap
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw new MethodNotFoundError();
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
          '😭 If you add a new account in MetaMask after you have already approved existing accounts on your application, you will need to reinstall the snap and reconnect to approve the newly added account. This is only temporary and in the future, you will not need to do the reinstall once MetaMask Snaps support account change events.',
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
          '🚀 Added a new API to create a new token(fungible and non-fungible)',
        ),
        text(
          '🚀 Added support to be able to transfer any kind of tokens including hbar, fungible and non-fungible tokens',
        ),
        text(
          '🚀 Added new APIs to perform atomic swap between any two accounts. This uses scheduled transaction to send the transaction to the ledger and to complete the swap.',
        ),
        text(
          '🚀 Added a new API to update the properties of an existing token such as name, symbol, treasury account, etc.',
        ),
        text('🚀 Added new APIs to associate/dissociate tokens to an account'),
        text('🚀 Added a new API to delete a token'),
        text('🚀 Added new APIs to mint/burn fungible and non-fungible tokens'),
        text(
          '🚀 Added new APIs grant/revoke KYC to/from any account for a given token provided KYC key was set during its creation',
        ),
        text(
          '🚀 Added new APIs to freeze/unfreeze account for a given token provided Freeze key was set during its creation',
        ),
        text(
          '🚀 Added new APIs pause/unpause provided Pause key was set during token its creation',
        ),
        text(
          '🚀 Added new APIs to wipe a token from any accounts provided Wipe key was set during its creation',
        ),
      ]),
    },
  });
};
