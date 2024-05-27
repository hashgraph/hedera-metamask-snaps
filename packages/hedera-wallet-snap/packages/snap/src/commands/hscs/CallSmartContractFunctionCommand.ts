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
import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} from '@hashgraph/sdk';
import type { TxReceipt } from '../../types/hedera';
import { Utils } from '../../utils/Utils';

export class CallSmartContractFunctionCommand {
  readonly #contractId: string;

  readonly #functionName: string;

  readonly #functionParams: string | undefined;

  readonly #gas: number;

  readonly #payableAmount: number | undefined;

  constructor(
    contractId: string,
    functionName: string,
    functionParams: any,
    gas: number,
    payableAmount: number | undefined,
  ) {
    this.#contractId = contractId;
    this.#functionName = functionName;
    this.#functionParams = functionParams;
    this.#gas = gas;
    this.#payableAmount = payableAmount;
  }

  public async execute(client: Client): Promise<TxReceipt> {
    const parameters = new ContractFunctionParameters();
    if (this.#functionParams !== undefined) {
      parameters.addString(this.#functionParams);
    }

    const transaction = new ContractExecuteTransaction()
      .setContractId(this.#contractId)
      .setGas(this.#gas)
      .setFunction(this.#functionName, parameters);

    if (this.#payableAmount !== undefined) {
      transaction.setPayableAmount(new Hbar(this.#payableAmount));
    }

    // Freeze the transaction
    transaction.freezeWith(client);

    // Sign the transaction with the client operator private key and submit to a Hedera network
    return await Utils.executeTransaction(client, transaction);
  }
}
