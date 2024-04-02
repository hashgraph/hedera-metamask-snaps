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

import { TransferTransaction } from '@hashgraph/sdk';
import type { Client, PrivateKey } from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';

export class CreateSwapCommand {
  readonly #senderPrivateKey: PrivateKey;

  readonly #recipientPrivateKey: PrivateKey;

  constructor(senderPrivateKey: PrivateKey, recipientPrivateKey: PrivateKey) {
    this.#recipientPrivateKey = recipientPrivateKey;
    this.#senderPrivateKey = senderPrivateKey;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transferFromAddr = `0.0.1847`;
    const transferToAddr = `0.0.546905`;

    const tokenId = `0.0.3711622`;

    const transaction = new TransferTransaction();

    transaction.addTokenTransfer(tokenId, transferToAddr, 10);
    transaction.addTokenTransfer(tokenId, transferFromAddr, -10);

    transaction.addHbarTransfer(transferToAddr, -159);
    transaction.addHbarTransfer(transferFromAddr, 159);

    transaction.freezeWith(client);

    const txResponse = await (
      await (
        await transaction.sign(this.#senderPrivateKey)
      ).sign(this.#recipientPrivateKey)
    ).execute(client);

    const receipt = await txResponse.getReceipt(client);

    /* let newExchangeRate;
    if (receipt.exchangeRate) {
      newExchangeRate = {
        ...receipt.exchangeRate,
        expirationTime: Utils.timestampToString(
          receipt.exchangeRate.expirationTime,
        ),
      };
    }*/

    return {
      status: receipt.status ? receipt.status.toString() : '',
      accountId: receipt.accountId ? receipt.accountId.toString() : '',
      /*
      fileId: receipt.fileId ? receipt.fileId : '',
      contractId: receipt.contractId ? receipt.contractId : '',
      topicId: receipt.topicId ? receipt.topicId : '',
      tokenId: receipt.tokenId ? receipt.tokenId : '',*/
      // scheduleId: receipt.scheduleId ? receipt.scheduleId.toString() : '',
      /*
      exchangeRate: newExchangeRate,
      topicSequenceNumber: receipt.topicSequenceNumber
        ? String(receipt.topicSequenceNumber)
        : '',
      topicRunningHash: CryptoUtils.uint8ArrayToHex(receipt.topicRunningHash),
      totalSupply: receipt.totalSupply ? String(receipt.totalSupply) : '',*/
      // scheduledTransactionId: receipt.scheduledTransactionId
      // ? receipt.scheduledTransactionId.toString()
      // : ''
      /* serials: JSON.parse(JSON.stringify(receipt.serials)),
      duplicates: JSON.parse(JSON.stringify(receipt.duplicates)),
      children: JSON.parse(JSON.stringify(receipt.children)),*/
    } as TxReceipt;
  }
}
