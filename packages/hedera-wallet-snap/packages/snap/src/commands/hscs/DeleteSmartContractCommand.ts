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
import { ContractDeleteTransaction } from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class DeleteSmartContractCommand {
  readonly #contractId: string;

  readonly #transferAccountId: string | undefined;

  readonly #transferContractId: string | undefined;

  constructor(
    contractId: string,
    transferAccountId: string | undefined,
    transferContractId: string | undefined,
  ) {
    this.#contractId = contractId;
    this.#transferAccountId = transferAccountId;
    this.#transferContractId = transferContractId;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const transaction = new ContractDeleteTransaction().setContractId(
      this.#contractId,
    );

    if (this.#transferAccountId) {
      transaction.setTransferAccountId(this.#transferAccountId);
    }
    if (this.#transferContractId) {
      transaction.setTransferContractId(this.#transferContractId);
    }

    // Freeze the transaction
    transaction.freezeWith(client);

    // Sign the transaction with the client operator private key and submit to a Hedera network
    return await Utils.executeTransaction(client, transaction);
  }
}
