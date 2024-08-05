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
import { WipeTokenCommand } from '../../commands/hts/WipeTokenCommand';
import type { TxRecord } from '../../types/hedera';
import type { WipeTokenRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { SnapUtils } from '../../utils/SnapUtils';

export class WipeTokenFacade {
  /**
   * Wipes the provided amount of fungible or non-fungible tokens from the specified
   * Hedera account. This transaction does not delete tokens from the treasury account.
   * This transaction must be signed by the token's Wipe Key. Wiping an account's tokens
   * burns the tokens and decreases the total supply.
   * @param walletSnapParams - Wallet snap params.
   * @param wipeTokenRequestParams - Parameters for wiping a token.
   * @returns Receipt of the transaction.
   */
  public static async wipeToken(
    walletSnapParams: WalletSnapParams,
    wipeTokenRequestParams: WipeTokenRequestParams,
  ): Promise<TxRecord> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const {
      assetType,
      tokenId,
      accountId,
      amount,
      serialNumbers = [],
    } = wipeTokenRequestParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxRecord;
    try {
      const panelToShow = [
        heading('Wipe token'),
        text(
          'Learn more about wiping tokens [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/readme-1/wipe-a-token)',
        ),
        text(
          `You are about to wipe a ${
            assetType === 'TOKEN' ? 'Fungible Token' : 'Non Fungible Token(NFT)'
          } with the following details:`,
        ),
        divider(),
        text(`Asset Id:`),
        copyable(tokenId),
        text(`Account Id to wipe from:`),
        copyable(accountId),
      ];
      if (assetType === 'NFT') {
        panelToShow.push(
          text(`Amount to wipe: ${serialNumbers.length}`),
          text(`Serial Numbers: `),
        );
        panelToShow.push(divider());
        for (const serialNumber of serialNumbers) {
          panelToShow.push(text(`🔥 ${serialNumber}`));
        }
        panelToShow.push(divider());
      } else {
        panelToShow.push(text(`Amount to wipe: ${amount as number}`));
      }
      const tokenInfo = await CryptoUtils.getTokenById(tokenId, mirrorNodeUrl);
      if (_.isEmpty(tokenInfo)) {
        const errMessage = `Error while trying to get token info for ${tokenId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        if (assetType === 'TOKEN') {
          throw rpcErrors.resourceUnavailable(errMessage);
        } else {
          panelToShow.push(
            text(
              `Token Info: Not available. Please proceed only if you know this NFT exists!`,
            ),
          );
        }
      }
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
      const command = new WipeTokenCommand(
        assetType,
        tokenId,
        accountId,
        serialNumbers,
        assetType === 'TOKEN'
          ? Number(amount) * Math.pow(10, Number(tokenInfo.decimals))
          : amount,
      );

      txReceipt = await command.execute(hederaClient.getClient());
      await SnapUtils.snapCreateDialogAfterTransaction(network, txReceipt);
    } catch (error: any) {
      const errMessage = `Error while trying to wipe tokens`;
      console.error('Error occurred: %s', errMessage, String(error));
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
