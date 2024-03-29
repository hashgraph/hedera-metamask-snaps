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

import { AccountUpdateTransaction, type Client } from '@hashgraph/sdk';
import _ from 'lodash';
import type { TxReceipt } from '../types/hedera';
import { Utils } from '../utils/Utils';

export class StakeHbarCommand {
  readonly #nodeId: number | null;

  readonly #accountId: string | null;

  constructor(nodeId: number | null, accountId: string | null) {
    this.#nodeId = nodeId;
    this.#accountId = accountId;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new AccountUpdateTransaction().setAccountId(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      client.operatorAccountId!,
    );

    if (_.isNull(this.#nodeId) && _.isNull(this.#accountId)) {
      transaction.setDeclineStakingReward(true);
    } else {
      if (Number.isFinite(this.#nodeId)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transaction.setStakedNodeId(this.#nodeId!);
      }
      if (!_.isEmpty(this.#accountId)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        transaction.setStakedAccountId(this.#accountId!);
      }
      transaction.setDeclineStakingReward(false);
    }

    return await Utils.executeTransaction(client, transaction);
  }
}
