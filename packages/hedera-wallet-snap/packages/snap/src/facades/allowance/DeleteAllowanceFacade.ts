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

import type { WalletSnapParams } from '../../types/state';
import type { DeleteAllowanceRequestParams } from '../../types/params';
import type { MirrorTokenInfo, TxReceipt } from '../../types/hedera';
import type { DialogParams } from '@metamask/snaps-sdk';
import { divider, heading, text } from '@metamask/snaps-sdk';
import { SnapUtils } from '../../utils/SnapUtils';
import { providerErrors } from '@metamask/rpc-errors';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { DeleteAllowanceCommand } from '../../commands/allowance/DeleteAllowanceCommand';

/**
 *
 * @param walletSnapParams
 * @param deleteAllowanceRequestParams
 */
export class DeleteAllowanceFacade {
  public static async deleteAllowance(
    walletSnapParams: WalletSnapParams,
    deleteAllowanceRequestParams: DeleteAllowanceRequestParams,
  ): Promise<TxReceipt> {
    const { origin, state } = walletSnapParams;

    const { assetType, assetId, spenderAccountId } =
      deleteAllowanceRequestParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxReceipt;
    try {
      const panelToShow = [
        heading('Approve an allowance'),
        text('Are you sure you want to delete allowances for your tokens?'),
        divider(),
      ];

      if (assetType === 'HBAR' || assetType === 'TOKEN') {
        panelToShow.push(
          divider(),
          text(`Spender Account ID: ${spenderAccountId as string}`),
          divider(),
        );
      }

      if (assetType === 'HBAR') {
        panelToShow.push(text(`Asset: ${assetType}`));
      } else {
        const tokenInfo: MirrorTokenInfo = await CryptoUtils.getTokenById(
          assetId as string,
          mirrorNodeUrl,
        );

        panelToShow.push(text(`Asset Name: ${tokenInfo.name}`));
        panelToShow.push(text(`Asset Type: ${tokenInfo.type}`));
        panelToShow.push(text(`Id: ${assetId as string}`));
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

      const dialogParamsForDeleteAllowance: DialogParams = {
        type: 'confirmation',
        content: await SnapUtils.generateCommonPanel(origin, panelToShow),
      };
      const confirmed = await SnapUtils.snapDialog(
        dialogParamsForDeleteAllowance,
      );
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

      const command = new DeleteAllowanceCommand(
        assetType,
        assetId as string,
        spenderAccountId,
      );

      txReceipt = await command.execute(hederaClient.getClient());
    } catch (error: any) {
      const errMessage = `Error while trying to delete an allowance: ${String(
        error,
      )}`;
      console.error(errMessage);
      throw providerErrors.unsupportedMethod(errMessage);
    }

    return txReceipt;
  }
}
