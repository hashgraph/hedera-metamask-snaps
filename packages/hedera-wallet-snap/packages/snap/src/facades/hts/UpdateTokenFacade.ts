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

import { rpcErrors } from '@metamask/rpc-errors';
import type { DialogParams } from '@metamask/snaps-sdk';
import { copyable, divider, heading, text } from '@metamask/snaps-sdk';
import _ from 'lodash';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { UpdateTokenCommand } from '../../commands/hts/UpdateTokenCommand';
import type { TxReceipt } from '../../types/hedera';
import type { UpdateTokenRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { SnapUtils } from '../../utils/SnapUtils';

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

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const {
      tokenId,
      name,
      symbol,
      treasuryAccountId,
      adminPublicKey,
      kycPublicKey,
      freezePublicKey,
      feeSchedulePublicKey,
      pausePublicKey,
      wipePublicKey,
      supplyPublicKey,
      expirationTime,
      tokenMemo,
      autoRenewAccountId,
      autoRenewPeriod,
    } = updateTokenRequestParams;

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Update token'),
        text(
          'Learn more about updating tokens [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/update-a-token)',
        ),
        text(`You are about to modify the following token:`),
        divider(),
        text(`Asset Id:`),
        copyable(tokenId),
      ];

      const tokenInfo = await CryptoUtils.getTokenById(tokenId, mirrorNodeUrl);
      if (_.isEmpty(tokenInfo)) {
        const errMessage = `Error while trying to get token info for ${tokenId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        panelToShow.push(text(errMessage));
        panelToShow.push(
          text(`Proceed only if you are sure this asset ID exists`),
        );
      } else {
        panelToShow.push(text(`Asset Name: ${tokenInfo.name}`));
        panelToShow.push(text(`Asset Type: ${tokenInfo.type}`));
        panelToShow.push(text(`Symbol: ${tokenInfo.symbol}`));
        panelToShow.push(
          text(
            `Total Supply: ${(
              Number(tokenInfo.total_supply) /
              Math.pow(10, Number(tokenInfo.decimals))
            ).toString()}`,
          ),
        );
        panelToShow.push(
          text(
            `Max Supply: ${(
              Number(tokenInfo.max_supply) /
              Math.pow(10, Number(tokenInfo.decimals))
            ).toString()}`,
          ),
        );
      }
      panelToShow.push(divider());

      panelToShow.push(
        text(
          `You are about to modify the following properties for this token:`,
        ),
      );

      if (!_.isEmpty(name)) {
        panelToShow.push(text(`New Token Name:`), copyable(name));
      }
      if (!_.isEmpty(symbol)) {
        panelToShow.push(text(`New Token Symbol:`), copyable(symbol));
      }
      if (!_.isEmpty(tokenMemo)) {
        panelToShow.push(text(`New Token Memo:`), copyable(tokenMemo));
      }
      if (!_.isEmpty(treasuryAccountId)) {
        panelToShow.push(
          text(`New Treasury Account Id:`),
          copyable(treasuryAccountId),
        );
      }
      if (!_.isEmpty(autoRenewAccountId)) {
        panelToShow.push(
          text(`New Auto Renew Account ID:`),
          copyable(autoRenewAccountId),
        );
      }
      if (!_.isEmpty(expirationTime)) {
        panelToShow.push(text(`New Expiration Time: ${expirationTime}`));
      }
      if (autoRenewPeriod) {
        panelToShow.push(text(`New Auto Renew Period: ${autoRenewPeriod}`));
      }

      if (!_.isEmpty(adminPublicKey)) {
        panelToShow.push(
          text(`New Admin Public Key:`),
          copyable(adminPublicKey),
        );
      }
      if (!_.isEmpty(kycPublicKey)) {
        panelToShow.push(text(`New KYC Public Key:`), copyable(kycPublicKey));
      }
      if (!_.isEmpty(freezePublicKey)) {
        panelToShow.push(
          text(`New Freeze Public Key:`),
          copyable(freezePublicKey),
        );
      }
      if (!_.isEmpty(feeSchedulePublicKey)) {
        panelToShow.push(
          text(`New Fee Schedule Public Key:`),
          copyable(feeSchedulePublicKey),
        );
      }
      if (!_.isEmpty(pausePublicKey)) {
        panelToShow.push(
          text(`New Pause Public Key:`),
          copyable(pausePublicKey),
        );
      }
      if (!_.isEmpty(wipePublicKey)) {
        panelToShow.push(text(`New Wipe Public Key:`), copyable(wipePublicKey));
      }
      if (!_.isEmpty(supplyPublicKey)) {
        panelToShow.push(
          text(`New Supply Public Key:`),
          copyable(supplyPublicKey),
        );
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

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw rpcErrors.resourceUnavailable('private key object returned null');
      }
      const command = new UpdateTokenCommand(tokenId, privateKeyObj);

      txReceipt = await command.execute(
        hederaClient.getClient(),
        updateTokenRequestParams,
      );
    } catch (error: any) {
      const errMessage = `Error while trying to update a token`;
      console.error('Error occurred: %s', errMessage, String(error));
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
