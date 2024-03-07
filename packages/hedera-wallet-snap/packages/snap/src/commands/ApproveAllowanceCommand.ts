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

import { ApproveAllowanceAssetDetail } from '../types/params';
import { TxReceipt } from '../types/hedera';
import {
  AccountAllowanceApproveTransaction,
  AccountId,
  Client,
  Hbar,
} from '@hashgraph/sdk';
import { Utils } from '../utils/Utils';
import { CryptoUtils } from '../utils/CryptoUtils';

export class ApproveAllowanceCommand {
  readonly #spenderAccountId: string;

  readonly #amount: number;

  readonly #assetType: string;

  readonly #assetDetail: ApproveAllowanceAssetDetail | undefined;

  constructor(
    spenderAccountId: string,
    amount: number,
    assetType: string,
    assetDetail?: ApproveAllowanceAssetDetail,
  ) {
    this.#spenderAccountId = spenderAccountId;
    this.#amount = amount;
    this.#assetType = assetType;
    this.#assetDetail = assetDetail;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new AccountAllowanceApproveTransaction();

    if (this.#assetType === 'HBAR') {
      transaction.approveHbarAllowance(
        client.operatorAccountId as AccountId,
        this.#spenderAccountId,
        new Hbar(this.#amount),
      );
    } else if (this.#assetType === 'TOKEN') {
      const multiplier = Math.pow(
        10,
        this.#assetDetail?.assetDecimals as number,
      );
      transaction.approveTokenAllowance(
        this.#assetDetail?.assetId as string,
        client.operatorAccountId as AccountId,
        this.#spenderAccountId,
        this.#amount * multiplier,
      );
    } else if (this.#assetType === 'NFT') {
      if (this.#assetDetail?.all) {
        transaction.approveTokenNftAllowanceAllSerials(
          this.#assetDetail?.assetId,
          client.operatorAccountId as AccountId,
          this.#spenderAccountId,
        );
      } else {
        transaction.approveTokenNftAllowance(
          this.#assetDetail?.assetId as string,
          client.operatorAccountId as AccountId,
          this.#spenderAccountId,
        );
      }
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
