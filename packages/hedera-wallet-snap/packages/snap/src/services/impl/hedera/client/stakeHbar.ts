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

import { AccountUpdateTransaction, type Client } from '@hashgraph/sdk';

import _ from 'lodash';
import { CryptoUtils } from '../../../../utils/CryptoUtils';
import { Utils } from '../../../../utils/Utils';
import { TxReceipt } from '../../../../types/hedera';

/**
 * Stake Hbar to a Node or another Acocunt ID.
 *
 * @param client - Hedera Client.
 * @param options - Stake Hbar options.
 * @param options.nodeId - Node ID to stake to.
 * @param options.accountId - Account ID to stake to.
 */
export async function stakeHbar(
  client: Client,
  options: {
    nodeId: number | null;
    accountId: string | null;
  },
): Promise<TxReceipt> {
  const transaction = new AccountUpdateTransaction().setAccountId(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    client.operatorAccountId!,
  );

  if (_.isNull(options.nodeId) && _.isNull(options.accountId)) {
    transaction.setDeclineStakingReward(true);
  } else {
    if (Number.isFinite(options.nodeId)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      transaction.setStakedNodeId(options.nodeId!);
    }
    if (!_.isEmpty(options.accountId)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      transaction.setStakedAccountId(options.accountId!);
    }
    transaction.setDeclineStakingReward(false);
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
