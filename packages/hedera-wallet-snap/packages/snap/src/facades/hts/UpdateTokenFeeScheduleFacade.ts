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
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { TxReceipt } from '../../types/hedera';
import { UpdateTokenRequestParams } from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';
import { UpdateTokenFeeScheduleCommand } from '../../commands/hts/UpdateTokenFeeScheduleCommand';
import { CryptoUtils } from '../../utils/CryptoUtils';

export class UpdateTokenFeeScheduleFacade {
  /**
   * Updates the fee schedule for a token.
   *
   * @param walletSnapParams - Wallet snap params.
   * @param updateTokenRequestParams - Parameters for updating a token.
   * @returns Receipt of the transaction.
   */
  public static async updateTokenFeeSchedule(
    walletSnapParams: WalletSnapParams,
    updateTokenRequestParams: UpdateTokenRequestParams,
  ): Promise<TxReceipt> {
    if (updateTokenRequestParams.customFees === undefined) {
      throw new Error('null custom fee schedule given');
    }

    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, publicKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const { tokenId, name, symbol, feeSchedulePublicKey } =
      updateTokenRequestParams;

    const mirrorTokenInfo = await CryptoUtils.getTokenById(
      tokenId,
      mirrorNodeUrl,
    );

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Update a token'),
        text(
          'Learn more about updating a token fee schedule [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/readme-1/update-a-fee-schedule)',
        ),
        text(
          `You are about to modify a token's fee schedule with the following details:`,
        ),
        divider(),
        text(`Id: ${tokenId}`),

        text(`Name: ${name}`),
        text(`Symbol: ${symbol}`),
      ];

      panelToShow.push(
        text(`Admin Key: ${publicKey}`),
        text(
          `Fee Schedule Public Key: ${
            _.isEmpty(feeSchedulePublicKey)
              ? 'Not set'
              : (feeSchedulePublicKey as string)
          }`,
        ),
      );

      const dialogParams: SnapDialogParams = {
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
      const command = new UpdateTokenFeeScheduleCommand(
        tokenId,
        privateKeyObj,
        Number(mirrorTokenInfo.decimals),
        updateTokenRequestParams.customFees,
      );

      txReceipt = await command.execute(hederaClient.getClient());
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
