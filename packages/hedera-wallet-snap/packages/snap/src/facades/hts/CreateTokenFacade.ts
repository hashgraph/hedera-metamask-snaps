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

import { rpcErrors } from '@metamask/rpc-errors';
import type { DialogParams } from '@metamask/snaps-sdk';
import { copyable, divider, heading, text } from '@metamask/snaps-sdk';
import _ from 'lodash';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { CreateTokenCommand } from '../../commands/hts/CreateTokenCommand';
import type { TxReceipt } from '../../types/hedera';
import type { CreateTokenRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class CreateTokenFacade {
  /**
   * Associates the provided Hedera account with the provided Hedera token(s).
   *
   * Hedera accounts must be associated with a fungible or non-fungible token first
   * before you can transfer tokens to that account.  In the case of NON_FUNGIBLE Type,
   * once an account is associated, it can hold any number of NFTs (serial numbers)
   * of that token type. There is currently no limit on the number of token IDs that
   * can be associated with an account (reference HIP-367). Still, you can see
   * TOKENS_PER_ACCOUNT_LIMIT_EXCEEDED responses for pre-HIP-367 transactions.
   * @param walletSnapParams - Wallet snap params.
   * @param createTokenRequestParams - Parameters for creating a token.
   * @returns Receipt of the transaction.
   */
  public static async createToken(
    walletSnapParams: WalletSnapParams,
    createTokenRequestParams: CreateTokenRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, publicKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const {
      assetType,
      name,
      symbol,
      decimals,
      initialSupply = 0,
      kycPublicKey,
      freezePublicKey,
      pausePublicKey,
      wipePublicKey,
      supplyPublicKey,
      feeSchedulePublicKey,
      freezeDefault = false,
      expirationTime,
      autoRenewAccountId = hederaAccountId,
      tokenMemo = 'Created via Hedera Wallet Snap',
      customFees,
      supplyType = 'INFINITE',
      maxSupply = 0,
    } = createTokenRequestParams;

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Create a token'),
        text(
          'Learn more about creating tokens [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/readme-1/define-a-token)',
        ),
        text(
          `You are about to create a ${
            assetType === 'TOKEN' ? 'Fungible Token' : 'Non Fungible Token(NFT)'
          } with the following details:`,
        ),
        divider(),
        text(`Name:`),
        copyable(name),
        text(`Symbol`),
        copyable(symbol),
        text(`Supply Type: ${supplyType}`),
      ];
      if (assetType === 'TOKEN') {
        panelToShow.push(
          text(`Initial Supply: ${initialSupply}`),
          text(`Decimals: ${decimals}`),
        );
      }
      panelToShow.push(
        text(
          `Max Supply: ${supplyType === 'INFINITE' ? 'Infinite' : maxSupply}`,
        ),
        text(`Auto Renew Account ID:`),
        copyable(autoRenewAccountId),
        text(`Token Memo:`),
        copyable(tokenMemo),
        text(`Freeze Default: ${freezeDefault}`),
        text(`Admin Key:`),
        copyable(publicKey),
        text(`Treasury Account:`),
        copyable(hederaAccountId),
        text(`KYC Public Key:`),
        copyable(
          `${_.isEmpty(kycPublicKey) ? 'Not set' : (kycPublicKey as string)}`,
        ),
        text(`Freeze Public Key:`),
        copyable(
          ` ${
            _.isEmpty(freezePublicKey) ? 'Not set' : (freezePublicKey as string)
          }`,
        ),
        text(`Pause Public Key:`),
        copyable(
          `${
            _.isEmpty(pausePublicKey) ? 'Not set' : (pausePublicKey as string)
          }`,
        ),
        text(`Wipe Public Key:`),
        copyable(
          `${_.isEmpty(wipePublicKey) ? 'Not set' : (wipePublicKey as string)}`,
        ),
        text(`Supply Public Key:`),
        copyable(
          ` ${
            _.isEmpty(supplyPublicKey) ? 'Not set' : (supplyPublicKey as string)
          }`,
        ),
        text(`Fee Schedule Public Key:`),
        copyable(
          `${
            _.isEmpty(feeSchedulePublicKey)
              ? 'Not set'
              : (feeSchedulePublicKey as string)
          }`,
        ),
        text(
          `Custom Fees: ${
            _.isEmpty(customFees) ? 'Not set' : 'Set as follows'
          }`,
        ),
      );
      if (expirationTime) {
        panelToShow.push(text(`Expiration Time: ${expirationTime}`));
      }
      if (customFees) {
        panelToShow.push(divider());
        for (const customFee of customFees) {
          panelToShow.push(
            text(`Fee Collector Account ID:`),
            copyable(customFee.feeCollectorAccountId),
          );
          if (customFee.hbarAmount) {
            panelToShow.push(text(`HBAR Amount: ${customFee.hbarAmount}`));
          }
          if (customFee.tokenAmount) {
            panelToShow.push(text(`Token Amount: ${customFee.tokenAmount}`));
          }
          if (customFee.denominatingTokenId) {
            panelToShow.push(
              text(`Denominating Token ID:`),
              copyable(customFee.denominatingTokenId),
            );
          }
          if (customFee.allCollectorsAreExempt) {
            panelToShow.push(
              text(
                `All Collectors Are Exempt: ${
                  customFee.allCollectorsAreExempt as boolean
                }`,
              ),
            );
          }
        }
        panelToShow.push(divider());
      }

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(
          origin,
          network,
          mirrorNodeUrl,
          panelToShow,
        ),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        const errMessage = 'User rejected the transaction';
        console.error(errMessage);
        throw rpcErrors.transactionRejected(errMessage);
      }

      const hederaClientFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );

      const hederaClient = await hederaClientFactory.createClient();
      if (hederaClient === null) {
        throw rpcErrors.resourceUnavailable('hedera client returned null');
      }
      const command = new CreateTokenCommand(
        assetType,
        name,
        symbol,
        decimals,
        supplyType,
        initialSupply,
        maxSupply,
        expirationTime,
        autoRenewAccountId,
        tokenMemo,
        freezeDefault,
        kycPublicKey,
        freezePublicKey,
        pausePublicKey,
        wipePublicKey,
        supplyPublicKey,
        feeSchedulePublicKey,
        customFees,
      );

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw rpcErrors.resourceUnavailable('private key object returned null');
      }
      txReceipt = await command.execute(
        hederaClient.getClient(),
        privateKeyObj,
      );
    } catch (error: any) {
      const errMessage = `Error while trying to create a token`;
      console.error(errMessage, String(error));
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
