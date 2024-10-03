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
import { divider, heading, text } from '@metamask/snaps-sdk';
import { HederaClientImplFactory } from '../../client/HederaClientImplFactory';
import { EthereumTransactionCommand } from '../../commands/hscs/EthereumTransactionCommand';
import type { EthereumTransactionRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class EthereumTransactionFacade {
  /**
   * Executes an Ethereum transaction on the Hedera network.
   * @param walletSnapParams - Wallet snap params.
   * @param ethereumTransactionParams - Parameters for the Ethereum transaction.
   * @returns Receipt of the transaction.
   */
  public static async ethereumTransaction(
    walletSnapParams: WalletSnapParams,
    ethereumTransactionParams: EthereumTransactionRequestParams,
  ): Promise<any> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { ethereumData, callDataFileId, maxGasAllowanceHbar } =
      ethereumTransactionParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt;
    try {
      const panelToShow = [
        heading('Execute Ethereum transaction'),
        text(
          `Learn more about executing Ethereum transactions [here](https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/ethereum-transaction)`,
        ),
        text(
          `You are about to execute an Ethereum transaction with the following parameters:`,
        ),
        divider(),
        text(`Ethereum Data: ${ethereumData}`),
      ];

      if (callDataFileId !== undefined) {
        panelToShow.push(text(`Call Data File ID: ${callDataFileId}`));
      }

      if (maxGasAllowanceHbar !== undefined) {
        panelToShow.push(
          text(`Max Gas Allowance (Hbar): ${maxGasAllowanceHbar}`),
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
      const command = new EthereumTransactionCommand(
        ethereumData,
        callDataFileId,
        maxGasAllowanceHbar,
      );

      txReceipt = await command.execute(hederaClient.getClient());
      console.log('txReceipt: ', JSON.stringify(txReceipt, null, 4));
    } catch (error: any) {
      const errMessage =
        'Error while trying to execute the Ethereum transaction';
      console.error('Error occurred: %s', errMessage, String(error));
      await SnapUtils.snapNotification(
        `Error occurred: ${errMessage} - ${String(error)}`,
      );
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
