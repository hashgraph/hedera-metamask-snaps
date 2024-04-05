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
  AccountAllowanceApproveTransaction,
  AccountAllowanceDeleteTransaction,
  type AccountId,
  type Client,
} from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class DeleteAllowanceCommand {
  readonly #assetType: string;

  readonly #assetId: string;

  readonly #spenderAccountId?: string;

  constructor(assetType: string, assetId: string, spenderAccountId?: string) {
    this.#assetType = assetType;
    this.#assetId = assetId;
    if (spenderAccountId) {
      this.#spenderAccountId = spenderAccountId;
    }
  }

  public async execute(client: Client): Promise<TxReceipt> {
    let transaction:
      | AccountAllowanceApproveTransaction
      | AccountAllowanceDeleteTransaction;

    if (this.#assetType === 'HBAR' || this.#assetType === 'TOKEN') {
      transaction = new AccountAllowanceApproveTransaction();
      if (this.#assetType === 'HBAR') {
        transaction.approveHbarAllowance(
          client.operatorAccountId as AccountId,
          this.#spenderAccountId as string,
          0,
        );
      } else {
        transaction.approveTokenAllowance(
          this.#assetId,
          client.operatorAccountId as AccountId,
          this.#spenderAccountId as string,
          0,
        );
      }
    } else {
      transaction =
        new AccountAllowanceDeleteTransaction().deleteAllTokenNftAllowances(
          this.#assetId,
          client.operatorAccountId as AccountId,
        );
    }

    transaction.freezeWith(client);

    return await Utils.executeTransaction(client, transaction);
  }
}
