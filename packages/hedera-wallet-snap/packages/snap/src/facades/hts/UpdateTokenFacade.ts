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

/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { providerErrors } from '@metamask/rpc-errors';
import { divider, heading, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { DialogParams } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { TxReceipt } from '../../types/hedera';
import { UpdateTokenRequestParams } from '../../types/params';
import { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import { UpdateTokenCommand } from '../../commands/hts/UpdateTokenCommand';

export class UpdateTokenFacade {
  /**
   * Updates priorities for a token.
   *
   * @param walletSnapParams - Wallet snap params.
   * @param updateTokenRequestParams - Parameters for updating a token.
   * @returns Receipt of the transaction.
   */
  public static async updateToken(
    walletSnapParams: WalletSnapParams,
    updateTokenRequestParams: UpdateTokenRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network } = state.currentAccount;

    const { privateKey, publicKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const {
      tokenId,
      name,
      symbol,
      kycPublicKey,
      freezePublicKey,
      pausePublicKey,
      wipePublicKey,
      supplyPublicKey,
      feeSchedulePublicKey,
      expirationTime,
      autoRenewAccountId = hederaAccountId,
      tokenMemo = 'Created via Hedera Wallet Snap',
    } = updateTokenRequestParams;

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Update a token'),
        text(
          'Learn more about updating tokens [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/update-a-token)',
        ),
        text(`You are about to modify a token with the following details:`),
        divider(),
        text(`Id: ${tokenId}`),

        text(`Name: ${name}`),
        text(`Symbol: ${symbol}`),
      ];

      panelToShow.push(
        text(`Auto Renew Account ID: ${autoRenewAccountId}`),
        text(`Token Memo: ${tokenMemo}`),
        text(`Admin Key: ${publicKey}`),
        text(`Treasury Account: ${hederaAccountId}`),
        text(
          `KYC Public Key: ${
            _.isEmpty(kycPublicKey) ? 'Not set' : (kycPublicKey as string)
          }`,
        ),
        text(
          `Freeze Public Key: ${
            _.isEmpty(freezePublicKey) ? 'Not set' : (freezePublicKey as string)
          }`,
        ),
        text(
          `Pause Public Key:${
            _.isEmpty(pausePublicKey) ? 'Not set' : (pausePublicKey as string)
          }`,
        ),
        text(
          `Wipe Public Key: ${
            _.isEmpty(wipePublicKey) ? 'Not set' : (wipePublicKey as string)
          }`,
        ),
        text(
          `Supply Public Key: ${
            _.isEmpty(supplyPublicKey) ? 'Not set' : (supplyPublicKey as string)
          }`,
        ),
        text(
          `Fee Schedule Public Key: ${
            _.isEmpty(feeSchedulePublicKey)
              ? 'Not set'
              : (feeSchedulePublicKey as string)
          }`,
        ),
      );
      if (expirationTime) {
        panelToShow.push(text(`Expiration Time: ${expirationTime}`));
      }

      const dialogParams: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(dialogParams);
      if (!confirmed) {
        console.error(`User rejected the transaction`);
        throw providerErrors.userRejectedRequest();
      }

      const hederaClientFactory = new HederaClientImplFactory(
        hederaAccountId,
        network,
        curve,
        privateKey,
      );

      const hederaClient = await hederaClientFactory.createClient();
      if (hederaClient === null) {
        throw new Error('hedera client returned null');
      }

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw new Error('private key object returned null');
      }
      const command = new UpdateTokenCommand(tokenId, privateKeyObj);

      txReceipt = await command.execute(
        hederaClient.getClient(),
        updateTokenRequestParams,
      );
    } catch (error: any) {
      const errMessage = `Error while trying to update a token: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
