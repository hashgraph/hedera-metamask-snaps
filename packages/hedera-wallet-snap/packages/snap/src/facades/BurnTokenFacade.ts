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

import { providerErrors } from '@metamask/rpc-errors';
import { divider, heading, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import { HederaClientImplFactory } from '../client/HederaClientImplFactory';
import { BurnTokenCommand } from '../commands/hts/BurnTokenCommand';
import { TxReceipt } from '../types/hedera';
import { BurnTokenRequestParams } from '../types/params';
import { SnapDialogParams, WalletSnapParams } from '../types/state';
import { CryptoUtils } from '../utils/CryptoUtils';
import { SnapUtils } from '../utils/SnapUtils';

export class BurnTokenFacade {
  /**
   * Burns fungible and non-fungible tokens owned by the Treasury Account.
   *
   * @param walletSnapParams - Wallet snap params.
   * @param burnTokenRequestParams - Parameters for burning a token.
   * @returns Receipt of the transaction.
   */
  public static async burnToken(
    walletSnapParams: WalletSnapParams,
    burnTokenRequestParams: BurnTokenRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const {
      assetType,
      tokenId,
      amount,
      serialNumbers = [],
    } = burnTokenRequestParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Burn token'),
        text(
          'Learn more about burning tokens [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/readme-1/burn-a-token)',
        ),
        text(
          `You are about to burn a ${
            assetType === 'TOKEN' ? 'Fungible Token' : 'Non Fungible Token(NFT)'
          } with the following details:`,
        ),
        divider(),
        text(`Asset Id: ${tokenId}`),
      ];
      if (assetType === 'NFT') {
        panelToShow.push(
          text(`Amount to burn: ${serialNumbers.length}`),
          text(`Serial Numbers: `),
        );
        panelToShow.push(divider());
        for (const serialNumber of serialNumbers) {
          panelToShow.push(text(`🔥 ${serialNumber}`));
        }
        panelToShow.push(divider());
      } else {
        panelToShow.push(text(`Amount to burn: ${amount as number}`));
      }
      const tokenInfo = await CryptoUtils.getTokenById(tokenId, mirrorNodeUrl);
      if (_.isEmpty(tokenInfo)) {
        const errMessage = `Error while trying to get token info for ${tokenId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        throw new Error(errMessage);
      }
      panelToShow.push(
        text(`Burn from Treasury account: ${tokenInfo.treasury_account_id}`),
      );
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
      const mintTokenCommand = new BurnTokenCommand(
        assetType,
        tokenId,
        serialNumbers,
        assetType === 'TOKEN'
          ? Number(amount) * Math.pow(10, Number(tokenInfo.decimals))
          : amount,
      );

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw new Error('private key object returned null');
      }
      txReceipt = await mintTokenCommand.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = `Error while trying to burn tokens: ${String(error)}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
