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
import { PublicKey, TopicCreateTransaction } from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class CreateTopicCommand {
  readonly #memo: string | undefined;

  readonly #adminKey: string | undefined;

  readonly #submitKey: string | undefined;

  readonly #autoRenewPeriod: number | undefined;

  readonly #autoRenewAccount: string | undefined;

  constructor(
    memo?: string,
    adminKey?: string,
    submitKey?: string,
    autoRenewPeriod?: number,
    autoRenewAccount?: string,
  ) {
    this.#memo = memo;
    this.#adminKey = adminKey;
    this.#submitKey = submitKey;
    this.#autoRenewPeriod = autoRenewPeriod;
    this.#autoRenewAccount = autoRenewAccount;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new TopicCreateTransaction();

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

    return await Utils.executeTransaction(client, transaction);
  }
}
