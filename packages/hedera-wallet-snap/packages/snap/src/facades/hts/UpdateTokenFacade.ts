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
import type { DialogParams } from '@metamask/snaps-sdk';
import { divider, heading, text } from '@metamask/snaps-sdk';
import _ from 'lodash';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import type { TxReceipt } from '../../types/hedera';
import type { UpdateTokenRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import { UpdateTokenCommand } from '../../commands/hts/UpdateTokenCommand';

export class UpdateTokenFacade {
  /**
   * Updates priorities for a token.
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
      autoRenewAccountId,
      tokenMemo,
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
      );

      if (!_.isEmpty(kycPublicKey)) {
        panelToShow.push(text(kycPublicKey as string));
      }
      if (!_.isEmpty(freezePublicKey)) {
        panelToShow.push(text(freezePublicKey as string));
      }
      if (!_.isEmpty(pausePublicKey)) {
        panelToShow.push(text(pausePublicKey as string));
      }
      if (!_.isEmpty(wipePublicKey)) {
        panelToShow.push(text(wipePublicKey as string));
      }
      if (!_.isEmpty(supplyPublicKey)) {
        panelToShow.push(text(supplyPublicKey as string));
      }
      if (!_.isEmpty(feeSchedulePublicKey)) {
        panelToShow.push(text(feeSchedulePublicKey as string));
      }
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
