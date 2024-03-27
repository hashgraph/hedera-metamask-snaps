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

import {
  AccountAllowanceApproveTransaction,
  AccountAllowanceDeleteTransaction,
  type AccountId,
  type Client,
} from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';
import { CryptoUtils } from '../../utils/CryptoUtils';

export class DeleteAllowanceCommand {
  readonly #assetType: string;

  readonly #assetId: string;

  readonly #spenderAccountId?: string;

  constructor(assetType: string, assetId: string, spenderAccountId?: string) {
    this.#assetType = assetType;
    this.#assetId = assetId;
    if (spenderAccountId) {
      this.#spenderAccountId = spenderAccountId;
    }
  }

  public async execute(client: Client): Promise<TxReceipt> {
    let transaction:
      | AccountAllowanceApproveTransaction
      | AccountAllowanceDeleteTransaction;

    if (this.#assetType === 'HBAR' || this.#assetType === 'TOKEN') {
      transaction = new AccountAllowanceApproveTransaction();
      if (this.#assetType === 'HBAR') {
        transaction.approveHbarAllowance(
          client.operatorAccountId as AccountId,
          this.#spenderAccountId as string,
          0,
        );
      } else {
        transaction.approveTokenAllowance(
          this.#assetId,
          client.operatorAccountId as AccountId,
          this.#spenderAccountId as string,
          0,
        );
      }
    } else {
      transaction =
        new AccountAllowanceDeleteTransaction().deleteAllTokenNftAllowances(
          this.#assetId,
          client.operatorAccountId as AccountId,
        );
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
