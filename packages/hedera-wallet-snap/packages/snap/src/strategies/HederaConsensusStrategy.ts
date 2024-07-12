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

import { TopicInfoQuery, type Client } from '@hashgraph/sdk';
import type { TopicInfo } from '../types/consensus';
import { CryptoUtils } from '../utils/CryptoUtils';
import { Utils } from '../utils/Utils';

export class HederaConsensusStrategy {
  public static async getTopicInfo(
    client: Client,
    topicId: string,
  ): Promise<TopicInfo> {
    const query = new TopicInfoQuery({ topicId });
    await query.getCost(client);

    const topicInfo = await query.execute(client);
    return {
      memo: topicInfo.topicMemo,
      runningHash: CryptoUtils.uint8ArrayToHex(topicInfo.runningHash),
      sequenceNumber: topicInfo.sequenceNumber.toNumber(),
      expirationTime: Utils.timestampToString(
        topicInfo.expirationTime?.toDate(),
      ),
      adminKey: {
        key: CryptoUtils.keyToString(topicInfo.adminKey),
      },
      submitKey: {
        key: CryptoUtils.keyToString(topicInfo.submitKey),
      },
      autoRenewAccountId: topicInfo.autoRenewAccountId
        ? topicInfo.autoRenewAccountId.toString()
        : '',
      autoRenewPeriod: topicInfo.autoRenewPeriod
        ? topicInfo.autoRenewPeriod.seconds.toString()
        : '',
      ledgerId: topicInfo.ledgerId ? topicInfo.ledgerId.toString() : '',
    } as TopicInfo;
  }
}
