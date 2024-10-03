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
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { DeleteAllowanceCommand } from '../../commands/allowance/DeleteAllowanceCommand';
import type { MirrorTokenInfo, TxRecord } from '../../types/hedera';
import type { DeleteAllowanceRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { SnapUtils } from '../../utils/SnapUtils';

/**
 *
 * @param walletSnapParams
 * @param deleteAllowanceRequestParams
 */
export class DeleteAllowanceFacade {
  public static async deleteAllowance(
    walletSnapParams: WalletSnapParams,
    deleteAllowanceRequestParams: DeleteAllowanceRequestParams,
  ): Promise<TxRecord> {
    const { origin, state } = walletSnapParams;

    const { assetType, assetId, spenderAccountId } =
      deleteAllowanceRequestParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxRecord;
    try {
      const panelToShow = SnapUtils.initializePanelToShow();

      panelToShow.push(
        heading('Approve an allowance'),
        text('Are you sure you want to delete allowances for your tokens?'),
        divider(),
      );

      if (assetType === 'HBAR' || assetType === 'TOKEN') {
        panelToShow.push(
          divider(),
          text(`Spender Account ID:`),
          copyable(spenderAccountId as string),
          divider(),
        );
      }

      if (assetType === 'HBAR') {
        panelToShow.push(text(`Asset: HBAR`));
      } else {
        const tokenInfo: MirrorTokenInfo = await CryptoUtils.getTokenById(
          assetId as string,
          mirrorNodeUrl,
        );

        panelToShow.push(text(`Asset Name: ${tokenInfo.name}`));
        panelToShow.push(text(`Asset Type: ${tokenInfo.type}`));
        panelToShow.push(text(`Asset Id:`), copyable(assetId as string));
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
        content: await SnapUtils.generateCommonPanel(
          origin,
          network,
          mirrorNodeUrl,
          panelToShow,
        ),
      };
      const confirmed = await SnapUtils.snapDialog(
        dialogParamsForDeleteAllowance,
      );
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

      const command = new DeleteAllowanceCommand(
        assetType,
        assetId as string,
        spenderAccountId,
      );

      txReceipt = await command.execute(hederaClient.getClient());
      await SnapUtils.snapCreateDialogAfterTransaction(
        origin,
        network,
        mirrorNodeUrl,
        txReceipt,
      );
    } catch (error: any) {
      const errMessage = `Error while trying to delete an allowance`;
      console.error('Error occurred: %s', errMessage, String(error));
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
