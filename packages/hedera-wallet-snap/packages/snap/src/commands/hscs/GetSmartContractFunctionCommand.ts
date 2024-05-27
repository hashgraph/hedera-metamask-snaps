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
import { ContractCallQuery, ContractFunctionParameters } from '@hashgraph/sdk';

export class GetSmartContractFunctionCommand {
  readonly #contractId: string;

  readonly #functionName: string;

  readonly #functionParams: string | undefined;

  readonly #gas: number;

  readonly #senderAccountId: string | undefined;

  constructor(
    contractId: string,
    functionName: string,
    functionParams: string | undefined,
    gas: number,
    senderAccountId: string | undefined,
  ) {
    this.#contractId = contractId;
    this.#functionName = functionName;
    this.#functionParams = functionParams;
    this.#gas = gas;
    this.#senderAccountId = senderAccountId;
  }

  public async execute(client: Client): Promise<any> {
    const query = new ContractCallQuery()
      .setContractId(this.#contractId)
      .setGas(this.#gas);

    if (this.#functionParams === undefined) {
      query.setFunction(this.#functionName);
    } else {
      query.setFunction(
        this.#functionName,
        new ContractFunctionParameters().addString(this.#functionParams),
      );
    }

    if (this.#senderAccountId) {
      query.setSenderAccountId(this.#senderAccountId);
    }

    // Execute the query
    return await query.execute(client);
  }
}
