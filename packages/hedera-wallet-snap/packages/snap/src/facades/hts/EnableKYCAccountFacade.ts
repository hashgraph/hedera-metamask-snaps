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
import { EnableKYCAccountCommand } from '../../commands/hts/EnableKYCAccountCommand';
import { TxReceipt } from '../../types/hedera';
import { FreezeOrEnableKYCAccountRequestParams } from '../../types/params';
import { SnapDialogParams, WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { SnapUtils } from '../../utils/SnapUtils';
import { Utils } from '../../utils/Utils';

export class EnableKYCAccountFacade {
  /**
   * Grants KYC to the Hedera accounts for the given Hedera token.
   *
   * @param walletSnapParams - Wallet snap params.
   * @param enableKYCAccountRequestParams - Parameters for enabling/disabling KYC to
   * an account.
   * @param enableKYC - If true, the account will be granted KYC. If false, the KYC will be
   * revoked.
   * @returns Receipt of the transaction.
   */
  public static async enableKYCAccount(
    walletSnapParams: WalletSnapParams,
    enableKYCAccountRequestParams: FreezeOrEnableKYCAccountRequestParams,
    enableKYC: boolean,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { tokenId, accountId } = enableKYCAccountRequestParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    const enableText = enableKYC ? 'grant' : 'revoke';

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading(
          `${Utils.capitalizeFirstLetter(
            enableText,
          )} KYC to the account for the specified token`,
        ),
        text(
          `Learn more about ${
            enableKYC ? 'granting' : 'revoking'
          } the KYC account flag [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/${
            enableKYC ? 'enable' : 'disable'
          }-kyc-account-flag)`,
        ),
        text(
          `You are about to ${enableText} KYC to an account for the specified token:`,
        ),
        divider(),
        text(`Asset Id: ${tokenId}`),
        text(`Account Id to ${enableText} KYC for: ${accountId}`),
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
      const command = new EnableKYCAccountCommand(
        enableKYC,
        tokenId,
        accountId,
      );

      const privateKeyObj = hederaClient.getPrivateKey();
      if (privateKeyObj === null) {
        throw new Error('private key object returned null');
      }
      txReceipt = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = `Error while trying to ${enableText} the KYC flag to an account: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}