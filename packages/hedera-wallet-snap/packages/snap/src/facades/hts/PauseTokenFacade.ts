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
import { divider, heading, text } from '@metamask/snaps-sdk';
import _ from 'lodash';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { PauseTokenCommand } from '../../commands/hts/PauseTokenCommand';
import type { TxReceipt } from '../../types/hedera';
import type { PauseOrDeleteTokenRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { SnapUtils } from '../../utils/SnapUtils';
import { Utils } from '../../utils/Utils';

export class PauseTokenFacade {
  /**
   * A token pause transaction prevents the token from being involved in any kind of
   * operation.
   *
   * The following operations cannot be performed when a token is paused and will result in
   * a TOKEN_IS_PAUSED status.
   * - Updating the token.
   * - Transfering the token.
   * - Transferring any other token where it has its paused key in a custom fee schedule.
   * - Deleting the token.
   * - Minting or burning a token.
   * - Freezing or unfreezing an account that holds the token.
   * - Enabling or disabling KYC.
   * - Associating or disassociating a token.
   * - Wiping a token.
   * @param walletSnapParams - Wallet snap params.
   * @param pauseTokenRequestParams - Parameters for pausing/unpausing a token.
   * @param pause - If true, the account will be paused. If false, the account will be unpased.
   * @returns Receipt of the transaction.
   */
  public static async pauseToken(
    walletSnapParams: WalletSnapParams,
    pauseTokenRequestParams: PauseOrDeleteTokenRequestParams,
    pause: boolean,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { tokenId } = pauseTokenRequestParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const pauseText = pause ? 'pause' : 'unpause';

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading(
          `${Utils.capitalizeFirstLetter(
            pauseText,
          )} account for the specified token`,
        ),
        text(
          `Learn more about ${pauseText}ing accounts [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/${pauseText}-a-token)`,
        ),
        text(`You are about to ${pauseText} the following token:`),
        divider(),
        text(`Asset Id: ${tokenId}`),
      ];
      const tokenInfo = await CryptoUtils.getTokenById(tokenId, mirrorNodeUrl);
      if (_.isEmpty(tokenInfo)) {
        const errMessage = `Error while trying to get token info for ${tokenId} from Hedera Mirror Nodes at this time`;
        console.error(errMessage);
        panelToShow.push(
          text(
            `Token Info: Not available. Please proceed only if you know this Token/NFT exists!`,
          ),
        );
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
      const command = new PauseTokenCommand(pause, tokenId);

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw new Error('private key object returned null');
      }
      txReceipt = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = `Error while trying to ${pauseText} a token: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
