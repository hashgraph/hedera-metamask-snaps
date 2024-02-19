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
  AccountId,
  TokenAssociateTransaction,
  type Client,
} from '@hashgraph/sdk';

import { CryptoUtils } from '../../../../../utils/CryptoUtils';
import { timestampToString } from '../../../../../utils/helper';
import { TxReceipt } from '../../../../../types/hedera';

/**
 * Associate tokens to an account.
 *
 * @param client - Hedera Client.
 * @param options - Associate Tokens options.
 * @param options.tokenIds - Token Ids to associate to the account.
 */
export async function associateTokens(
  client: Client,
  options: {
    tokenIds: string[];
  },
): Promise<TxReceipt> {
  const transaction = new TokenAssociateTransaction()
    .setAccountId(client.operatorAccountId as AccountId)
    .setTokenIds(options.tokenIds)
    .freezeWith(client);

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
