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
  TokenGrantKycTransaction,
  TokenRevokeKycTransaction,
  type Client,
} from '@hashgraph/sdk';
import type { TxRecord } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class EnableKYCAccountCommand {
  readonly #enableKYC: boolean;

  readonly #tokenId: string;

  readonly #accountId: string;

  constructor(enableKYC: boolean, tokenId: string, accountId: string) {
    this.#enableKYC = enableKYC;
    this.#tokenId = tokenId;
    this.#accountId = accountId;
  }

  public async execute(client: Client): Promise<TxRecord> {
    let transaction: TokenGrantKycTransaction | TokenRevokeKycTransaction;
    if (this.#enableKYC) {
      transaction = new TokenGrantKycTransaction();
    } else {
      transaction = new TokenRevokeKycTransaction();
    }
    transaction.setTokenId(this.#tokenId).setAccountId(this.#accountId);

    transaction.freezeWith(client);

    return await Utils.executeTransaction(client, transaction);
  }
}
