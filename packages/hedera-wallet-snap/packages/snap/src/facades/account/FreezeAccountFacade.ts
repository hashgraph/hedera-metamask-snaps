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
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { FreezeAccountCommand } from '../../commands/account/FreezeAccountCommand';
import { TxReceipt } from '../../types/hedera';
import { FreezeOrEnableKYCAccountRequestParams } from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { SnapUtils } from '../../utils/SnapUtils';

export class FreezeAccountFacade {
  /**
   * Capitalizes the first letter of the given string.
   *
   * @param string - The string to capitalize.
   * @returns The string with the first letter capitalized.
   */
  // eslint-disable-next-line no-restricted-syntax
  private static readonly capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  /**
   * Freezes transfers of the specified token for the account. The transaction must be
   * signed by the token's Freeze Key.
   *
   * @param walletSnapParams - Wallet snap params.
   * @param freezeAccountRequestParams - Parameters for freezing/unfreezing an account.
   * @param freeze - If true, the account will be frozen. If false, the account will be unfrozen.
   * @returns Receipt of the transaction.
   */
  public static async freezeAccount(
    walletSnapParams: WalletSnapParams,
    freezeAccountRequestParams: FreezeOrEnableKYCAccountRequestParams,
    freeze: boolean,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { tokenId, accountId } = freezeAccountRequestParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const freezeText = freeze ? 'freeze' : 'unfreeze';

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading(
          `${FreezeAccountFacade.capitalizeFirstLetter(
            freezeText,
          )} account for the specified token`,
        ),
        text(
          `Learn more about ${freezeText}ing accounts [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/readme-1/${freezeText}-an-account)`,
        ),
        text(
          `You are about to ${freezeText} transfers of the specified token for the given account:`,
        ),
        divider(),
        text(`Asset Id: ${tokenId}`),
        text(`Account Id to ${freezeText} transfers for: ${accountId}`),
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
      const command = new FreezeAccountCommand(freeze, tokenId, accountId);

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw new Error('private key object returned null');
      }
      txReceipt = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = `Error while trying to ${freezeText} an account: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
