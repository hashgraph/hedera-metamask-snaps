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
import { SubmitMessageCommand } from '../../commands/hcs/SubmitMessageCommand';
import type { TxRecord } from '../../types/hedera';
import type { SubmitMessageRequestParams } from '../../types/params';
import type { WalletSnapParams } from '../../types/state';
import { SnapUtils } from '../../utils/SnapUtils';

export class SubmitMessageFacade {
  /**
   * Submits a message to a topic on the Hedera network.
   * @param walletSnapParams - Wallet snap params.
   * @param submitMessageParams - Parameters for submitting a message.
   * @returns Receipt of the transaction.
   */
  public static async submitMessage(
    walletSnapParams: WalletSnapParams,
    submitMessageParams: SubmitMessageRequestParams,
  ): Promise<TxRecord> {
    const { origin, state } = walletSnapParams;

    const { hederaEvmAddress, hederaAccountId, network, mirrorNodeUrl } =
      state.currentAccount;

    const { topicId, message, maxChunks, chunkSize } = submitMessageParams;

    const { privateKey, curve } =
      state.accountState[hederaEvmAddress][network].keyStore;

    let txReceipt = {} as TxRecord;
    try {
      const panelToShow = SnapUtils.initializePanelToShow();

      panelToShow.push(
        heading('Submit a message to a topic'),
        text(
          `Learn more about submitting messages [here](https://docs.hedera.com/hedera/sdks-and-apis/hedera-api/consensus/consensussubmitmessage)`,
        ),
        text(
          `You are about to submit a message to the topic with the following parameters:`,
        ),
        divider(),
        text(`Topic ID: ${topicId}`),
        text(`Message: ${message}`),
      );

      if (maxChunks !== undefined) {
        panelToShow.push(text(`Max Chunks: ${maxChunks}`));
      }
      if (chunkSize !== undefined) {
        panelToShow.push(text(`Chunk Size: ${chunkSize}`));
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
      const command = new SubmitMessageCommand(
        topicId,
        message,
        maxChunks,
        chunkSize,
      );

      txReceipt = await command.execute(hederaClient.getClient());
      await SnapUtils.snapCreateDialogAfterTransaction(network, txReceipt);
    } catch (error: any) {
      const errMessage = 'Error while trying to submit a message';
      console.error('Error occurred: %s', errMessage, String(error));
      throw rpcErrors.transactionRejected(errMessage);
    }

    return txReceipt;
  }
}
