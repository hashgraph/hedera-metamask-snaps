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
import { PublicKey, TopicUpdateTransaction } from '@hashgraph/sdk';
import type { TxRecord } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class UpdateTopicCommand {
  readonly #topicID: string;

  readonly #memo: string | undefined;

  readonly #expirationTime: number | undefined;

  readonly #adminKey: string | undefined;

  readonly #submitKey: string | undefined;

  readonly #autoRenewPeriod: number | undefined;

  readonly #autoRenewAccount: string | undefined;

  constructor(
    topicID: string,
    memo?: string,
    expirationTime?: number,
    adminKey?: string,
    submitKey?: string,
    autoRenewPeriod?: number,
    autoRenewAccount?: string,
  ) {
    this.#topicID = topicID;
    this.#memo = memo;
    this.#expirationTime = expirationTime;
    this.#adminKey = adminKey;
    this.#submitKey = submitKey;
    this.#autoRenewPeriod = autoRenewPeriod;
    this.#autoRenewAccount = autoRenewAccount;
  }

  public async execute(client: Client): Promise<TxRecord> {
    const transaction = new TopicUpdateTransaction().setTopicId(this.#topicID);

    if (this.#memo) {
      transaction.setTopicMemo(this.#memo);
    }
    if (this.#adminKey) {
      transaction.setAdminKey(PublicKey.fromString(this.#adminKey));
    }
    if (this.#submitKey) {
      transaction.setSubmitKey(PublicKey.fromString(this.#submitKey));
    }
    if (this.#autoRenewPeriod) {
      transaction.setAutoRenewPeriod(this.#autoRenewPeriod);
    }
    if (this.#autoRenewAccount) {
      transaction.setAutoRenewAccountId(this.#autoRenewAccount);
    }
    if (this.#expirationTime) {
      transaction.setExpirationTime(new Date(this.#expirationTime));
    }

    return await Utils.executeTransaction(client, transaction);
  }
}
