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
import type { TxRecord } from '../../types/hedera';
import type { SmartContractFunctionParameter } from '../../types/params';
import { Utils } from '../../utils/Utils';

export class CallSmartContractFunctionCommand {
  readonly #contractId: string;

  readonly #functionName: string;

  readonly #functionParams: SmartContractFunctionParameter[] | undefined;

  readonly #gas: number;

  readonly #payableAmount: number | undefined;

  constructor(
    contractId: string,
    functionName: string,
    functionParams: SmartContractFunctionParameter[] | undefined,
    gas: number,
    payableAmount: number | undefined,
  ) {
    this.#contractId = contractId;
    this.#functionName = functionName;
    this.#functionParams = functionParams;
    this.#gas = gas;
    this.#payableAmount = payableAmount;
  }

  public async execute(client: Client): Promise<TxRecord> {
    const transaction = new ContractExecuteTransaction()
      .setContractId(this.#contractId)
      .setGas(this.#gas);

    if (this.#functionParams === undefined) {
      transaction.setFunction(this.#functionName);
    } else {
      const params = new ContractFunctionParameters();
      this.#functionParams.forEach((param) => {
        switch (param.type) {
          case 'string':
            params.addString(param.value as string);
            break;
          case 'bytes':
            params.addBytes(param.value as Uint8Array);
            break;
          case 'boolean':
            params.addBool(param.value as boolean);
            break;
          case 'int':
            params.addInt256(param.value as number);
            break;
          case 'uint':
            params.addUint256(param.value as number);
            break;
          default:
            throw new Error(
              `Unsupported constructor parameter type: only 'string', 'bytes', 'boolean', 'int', 'uint' are supported`,
            );
        }
      });
      transaction.setFunction(this.#functionName, params);
    }
    if (this.#payableAmount !== undefined) {
      transaction.setPayableAmount(new Hbar(this.#payableAmount));
    }

    // Freeze the transaction
    transaction.freezeWith(client);

    // Sign the transaction with the client operator private key and submit to a Hedera network
    return await Utils.executeTransaction(client, transaction);
  }
}
