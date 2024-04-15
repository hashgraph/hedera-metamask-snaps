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
import type { DialogParams } from '@metamask/snaps-sdk';
import { copyable, divider, heading, text } from '@metamask/snaps-sdk';
import _ from 'lodash';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { MintTokenCommand } from '../../commands/hts/MintTokenCommand';
import type { TxReceipt } from '../../types/hedera';
import type { MintTokenRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { SnapUtils } from '../../utils/SnapUtils';

export class MintTokenFacade {
  /**
   * Minting fungible token allows you to increase the total supply of the token. Minting a
   * non-fungible token creates an NFT with its unique metadata for the class of NFTs defined by
   * the token ID. The Supply Key must sign the transaction.
   * @param walletSnapParams - Wallet snap params.
   * @param mintTokenRequestParams - Parameters for minting a token.
   * @returns Receipt of the transaction.
   */
  public static async mintToken(
    walletSnapParams: WalletSnapParams,
    mintTokenRequestParams: MintTokenRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const {
      assetType,
      tokenId,
      amount,
      metadata = [],
    } = mintTokenRequestParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Mint token'),
        text(
          'Learn more about minting tokens [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/readme-1/mint-a-token)',
        ),
        text(
          `You are about to mint a ${
            assetType === 'TOKEN' ? 'Fungible Token' : 'Non Fungible Token(NFT)'
          } with the following details:`,
        ),
        divider(),
        text(`Asset Id:`),
        copyable(tokenId),
      ];
      if (assetType === 'NFT') {
        panelToShow.push(
          text(`Amount to mint: ${metadata.length}`),
          text(`Metadata: `),
        );
        panelToShow.push(divider());
        for (const data of metadata) {
          panelToShow.push(copyable(`${data}`));
        }
        panelToShow.push(divider());
      } else {
        panelToShow.push(text(`Amount to mint: ${amount as number}`));
      }
      const tokenInfo = await CryptoUtils.getTokenById(tokenId, mirrorNodeUrl);
      if (_.isEmpty(tokenInfo)) {
        const errMessage = `Error while trying to get token info for ${tokenId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        if (assetType === 'TOKEN') {
          throw new Error(errMessage);
        } else {
          panelToShow.push(
            text(
              `Token Info: Not available. Please proceed only if you know this NFT exists!`,
            ),
          );
        }
      }
      panelToShow.push(
        text(`Mint to Treasury account: ${tokenInfo.treasury_account_id}`),
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
      const command = new MintTokenCommand(
        assetType,
        tokenId,
        metadata,
        assetType === 'TOKEN'
          ? Number(amount) * Math.pow(10, Number(tokenInfo.decimals))
          : amount,
      );

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw new Error('private key object returned null');
      }
      txReceipt = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = `Error while trying to mint tokens: ${String(error)}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
