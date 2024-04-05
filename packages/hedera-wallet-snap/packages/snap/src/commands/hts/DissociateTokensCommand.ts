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
  TokenDissociateTransaction,
  type AccountId,
  type Client,
} from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class DissociateTokensCommand {
  readonly #tokenIds: string[];

  constructor(tokenIds: string[]) {
    this.#tokenIds = tokenIds;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new TokenDissociateTransaction()
      .setAccountId(client.operatorAccountId as AccountId)
      .setTokenIds(this.#tokenIds);

    transaction.freezeWith(client);

    return await Utils.executeTransaction(client, transaction);
  }
}
