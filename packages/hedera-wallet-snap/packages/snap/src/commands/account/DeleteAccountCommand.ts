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
import { AccountDeleteTransaction } from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class DeleteAccountCommand {
  readonly #transferAccountId: string;

  constructor(transferAccountId: string) {
    this.#transferAccountId = transferAccountId;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new AccountDeleteTransaction()
      .setAccountId(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        client.operatorAccountId!,
      )
      .setTransferAccountId(this.#transferAccountId)
      .freezeWith(client);

    return await Utils.executeTransaction(client, transaction);
  }
}
