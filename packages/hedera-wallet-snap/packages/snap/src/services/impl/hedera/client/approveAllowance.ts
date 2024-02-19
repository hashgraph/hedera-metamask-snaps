/*-
 *
 * Hedera Wallet Snap
 *
 * Copyright (C) 2024 Tuum Tech
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
  AccountId,
  Hbar,
  type Client,
} from '@hashgraph/sdk';

import { ApproveAllowanceAssetDetail } from '../../../../types/params';
import { CryptoUtils } from '../../../../utils/CryptoUtils';
import { timestampToString } from '../../../../utils/helper';
import { TxReceipt } from '../../../../types/hedera';

/**
 * Approve an allowance.
 *
 * @param client - Hedera Client.
 * @param options - Approve Allowance options.
 * @param options.spenderAccountId - Account ID to of the spender.
 * @param options.amount - Amount to approve.
 * @param options.assetType - Asset type to approve.
 * @param options.assetDetail - Asset detail to approve.
 */
export async function approveAllowance(
  client: Client,
  options: {
    spenderAccountId: string;
    amount: number;
    assetType: string;
    assetDetail?: ApproveAllowanceAssetDetail;
  },
): Promise<TxReceipt> {
  const transaction = new AccountAllowanceApproveTransaction();

  if (options.assetType === 'HBAR') {
    transaction.approveHbarAllowance(
      client.operatorAccountId as AccountId,
      options.spenderAccountId,
      new Hbar(options.amount),
    );
  } else if (options.assetType === 'TOKEN') {
    const multiplier = Math.pow(
      10,
      options.assetDetail?.assetDecimals as number,
    );
    transaction.approveTokenAllowance(
      options.assetDetail?.assetId as string,
      client.operatorAccountId as AccountId,
      options.spenderAccountId,
      options.amount * multiplier,
    );
  } else if (options.assetType === 'NFT') {
    if (options.assetDetail?.all) {
      transaction.approveTokenNftAllowanceAllSerials(
        options.assetDetail?.assetId,
        client.operatorAccountId as AccountId,
        options.spenderAccountId,
      );
    } else {
      transaction.approveTokenNftAllowance(
        options.assetDetail?.assetId as string,
        client.operatorAccountId as AccountId,
        options.spenderAccountId,
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
      expirationTime: timestampToString(receipt.exchangeRate.expirationTime),
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
