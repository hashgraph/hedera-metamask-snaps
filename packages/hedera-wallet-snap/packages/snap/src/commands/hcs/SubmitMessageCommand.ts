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

import type { Client } from '@hashgraph/sdk';
import {
  TopicMessageSubmitTransaction,
  TransactionReceiptQuery,
} from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class SubmitMessageCommand {
  readonly #topicID: string;

  readonly #message: string;

  readonly #maxChunks: number | undefined;

  readonly #chunkSize: number | undefined;

  constructor(
    topicID: string,
    message: string,
    maxChunks?: number,
    chunkSize?: number,
  ) {
    this.#topicID = topicID;
    this.#message = message;
    this.#maxChunks = maxChunks;
    this.#chunkSize = chunkSize;
  }

  public async execute(client: Client): Promise<TxReceipt[]> {
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(this.#topicID)
      .setMessage(this.#message);

    if (this.#maxChunks) {
      transaction.setMaxChunks(this.#maxChunks);
    }
    if (this.#chunkSize) {
      transaction.setChunkSize(this.#chunkSize);
    }

    const txMessage = await transaction.executeAll(client);

    // Initialize an array for receipts
    const receipts = [];
    for (const tx of txMessage) {
      const txReceipt = await new TransactionReceiptQuery()
        .setTransactionId(tx.transactionId)
        .setIncludeChildren(true)
        .execute(client);
      receipts.push(Utils.formatTransactionReceipt(txReceipt));
    }

    return receipts;
  }
}
