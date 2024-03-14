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

import { Client, TokenMintTransaction } from '@hashgraph/sdk';
import { TxReceipt } from '../../types/hedera';
import { CryptoUtils } from '../../utils/CryptoUtils';
import { Utils } from '../../utils/Utils';

export class MintTokenCommand {
  readonly #assetType: 'TOKEN' | 'NFT';

  readonly #tokenId: string;

  readonly #metadata: string[];

  readonly #amount: number | undefined;

  constructor(
    assetType: 'TOKEN' | 'NFT',
    tokenId: string,
    metadata: string[],
    amount?: number,
  ) {
    this.#assetType = assetType;
    this.#tokenId = tokenId;
    this.#metadata = metadata;
    this.#amount = amount;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new TokenMintTransaction().setTokenId(this.#tokenId);

    if (this.#assetType === 'NFT') {
      // Iterate through metadata and convert each metadata to Uint8Array and store
      // everything in Uint8Array[]
      transaction.setMetadata(
        this.#metadata.map((metadata) =>
          CryptoUtils.stringToUint8Array(metadata),
        ),
      );
    } else {
      transaction.setAmount(this.#amount as number);
    }

    transaction.freezeWith(client);

    const txResponse = await transaction.execute(client);

    const receipt = await txResponse.getReceipt(client);

    let newExchangeRate;
    if (receipt.exchangeRate) {
      newExchangeRate = {
        ...receipt.exchangeRate,
        expirationTime: Utils.timestampToString(
          receipt.exchangeRate.expirationTime,
        ),
      };
    }

    return {
      status: receipt.status.toString(),
      accountId: receipt.accountId ? receipt.accountId.toString() : '',
      fileId: receipt.fileId ? receipt.fileId : '',
      contractId: receipt.contractId ? receipt.contractId : '',
      topicId: receipt.topicId ? receipt.topicId : '',
      tokenId: receipt.tokenId ? receipt.tokenId : '',
      scheduleId: receipt.scheduleId ? receipt.scheduleId : '',
      exchangeRate: newExchangeRate,
      topicSequenceNumber: receipt.topicSequenceNumber
        ? String(receipt.topicSequenceNumber)
        : '',
      topicRunningHash: CryptoUtils.uint8ArrayToHex(receipt.topicRunningHash),
      totalSupply: receipt.totalSupply ? String(receipt.totalSupply) : '',
      scheduledTransactionId: receipt.scheduledTransactionId
        ? receipt.scheduledTransactionId.toString()
        : '',
      serials: JSON.parse(JSON.stringify(receipt.serials)),
      duplicates: JSON.parse(JSON.stringify(receipt.duplicates)),
      children: JSON.parse(JSON.stringify(receipt.children)),
    } as TxReceipt;
  }
}
